from typing import List

from fastapi import APIRouter, Depends, HTTPException, status

from ..deps import get_current_account, require_roles
from ..models.customer import Customer
from ..models.account import Account
from ..schemas.customer import CustomerCreate, CustomerRead, CustomerUpdate

router = APIRouter()

STAFF_ROLES = ("admin", "staff", "accountant")


@router.get("/me", response_model=CustomerRead)
async def get_my_customer(current_account: Account = Depends(get_current_account)) -> CustomerRead:
    if current_account.customer_id is None:
        raise HTTPException(status_code=404, detail="Tài khoản chưa gắn với hồ sơ khách hàng")
    customer = await Customer.get(current_account.customer_id)
    if customer is None:
        raise HTTPException(status_code=404, detail="Không tìm thấy khách hàng")
    return CustomerRead.from_doc(customer)


@router.get("", response_model=List[CustomerRead], dependencies=[Depends(require_roles(*STAFF_ROLES))])
async def list_customers() -> List[CustomerRead]:
    customers = await Customer.find_all().to_list()
    return [CustomerRead.from_doc(customer) for customer in customers]


@router.get(
    "/{customer_id}",
    response_model=CustomerRead,
    dependencies=[Depends(require_roles(*STAFF_ROLES))],
)
async def get_customer(customer_id: str) -> CustomerRead:
    customer = await Customer.get(customer_id)
    if customer is None:
        raise HTTPException(status_code=404, detail="Không tìm thấy khách hàng")
    return CustomerRead.from_doc(customer)


@router.post(
    "",
    response_model=CustomerRead,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_roles(*STAFF_ROLES))],
)
async def create_customer(payload: CustomerCreate) -> CustomerRead:
    count = await Customer.find_all().count()
    code = f"KH{count + 1:03d}"

    customer = Customer(code=code, **payload.model_dump())
    await customer.insert()
    return CustomerRead.from_doc(customer)


@router.patch(
    "/{customer_id}",
    response_model=CustomerRead,
    dependencies=[Depends(require_roles(*STAFF_ROLES))],
)
async def update_customer(customer_id: str, payload: CustomerUpdate) -> CustomerRead:
    customer = await Customer.get(customer_id)
    if customer is None:
        raise HTTPException(status_code=404, detail="Không tìm thấy khách hàng")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(customer, field, value)
    await customer.save()
    return CustomerRead.from_doc(customer)
