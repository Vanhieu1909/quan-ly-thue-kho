from typing import List

from fastapi import APIRouter, Depends, HTTPException, status

from ..deps import get_current_account, require_roles
from ..models.invoice import Invoice
from ..models.account import Account
from ..schemas.invoice import InvoiceCreate, InvoiceRead, PaymentCreate
from ..services import debt, invoicing

router = APIRouter()


@router.get("", response_model=List[InvoiceRead])
async def list_invoices(current_account: Account = Depends(get_current_account)) -> List[InvoiceRead]:
    if current_account.role == "customer":
        if current_account.customer_id is None:
            return []
        invoices = await Invoice.find(Invoice.customer_id == current_account.customer_id).to_list()
    else:
        invoices = await Invoice.find_all().to_list()
    return [InvoiceRead.from_doc(invoice) for invoice in invoices]


@router.get("/{invoice_id}", response_model=InvoiceRead)
async def get_invoice(
    invoice_id: str, current_account: Account = Depends(get_current_account)
) -> InvoiceRead:
    invoice = await Invoice.get(invoice_id)
    if invoice is None:
        raise HTTPException(status_code=404, detail="Không tìm thấy hóa đơn")
    if current_account.role == "customer" and invoice.customer_id != current_account.customer_id:
        raise HTTPException(status_code=403, detail="Không có quyền xem hóa đơn này")
    return InvoiceRead.from_doc(invoice)


@router.post(
    "",
    response_model=InvoiceRead,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_roles("admin", "accountant"))],
)
async def create_invoice(payload: InvoiceCreate) -> InvoiceRead:
    try:
        invoice = await invoicing.generate_invoice(payload)
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
    return InvoiceRead.from_doc(invoice)


@router.post(
    "/mark-overdue",
    response_model=dict,
    dependencies=[Depends(require_roles("admin", "accountant"))],
)
async def mark_overdue_invoices() -> dict:
    count = await debt.mark_overdue_invoices()
    return {"updated": count}


@router.post(
    "/{invoice_id}/payments",
    response_model=InvoiceRead,
    dependencies=[Depends(require_roles("admin", "accountant"))],
)
async def pay_invoice(invoice_id: str, payload: PaymentCreate) -> InvoiceRead:
    invoice = await Invoice.get(invoice_id)
    if invoice is None:
        raise HTTPException(status_code=404, detail="Không tìm thấy hóa đơn")

    try:
        invoice = await debt.record_payment(invoice, payload.amount, payload.method)
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
    return InvoiceRead.from_doc(invoice)
