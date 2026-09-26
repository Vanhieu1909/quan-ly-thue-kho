from typing import List

from fastapi import APIRouter, Depends, HTTPException, status

from ..deps import get_current_account, require_roles
from ..models.contract import Contract
from ..models.account import Account
from ..schemas.contract import ContractCreate, ContractRead, ContractUpdate
from ..services import billing

router = APIRouter()


@router.get("", response_model=List[ContractRead])
async def list_contracts(current_account: Account = Depends(get_current_account)) -> List[ContractRead]:
    if current_account.role == "customer":
        if current_account.customer_id is None:
            return []
        contracts = await Contract.find(Contract.customer_id == current_account.customer_id).to_list()
    else:
        contracts = await Contract.find_all().to_list()
    return [ContractRead.from_doc(contract) for contract in contracts]


@router.get("/{contract_id}", response_model=ContractRead)
async def get_contract(
    contract_id: str, current_account: Account = Depends(get_current_account)
) -> ContractRead:
    contract = await Contract.get(contract_id)
    if contract is None:
        raise HTTPException(status_code=404, detail="Không tìm thấy hợp đồng")
    if current_account.role == "customer" and contract.customer_id != current_account.customer_id:
        raise HTTPException(status_code=403, detail="Không có quyền xem hợp đồng này")
    return ContractRead.from_doc(contract)


@router.post(
    "",
    response_model=ContractRead,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_roles("admin", "staff"))],
)
async def create_contract(payload: ContractCreate) -> ContractRead:
    try:
        contract = await billing.create_contract(payload)
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
    return ContractRead.from_doc(contract)


@router.patch(
    "/{contract_id}",
    response_model=ContractRead,
    dependencies=[Depends(require_roles("admin", "staff"))],
)
async def update_contract(contract_id: str, payload: ContractUpdate) -> ContractRead:
    contract = await Contract.get(contract_id)
    if contract is None:
        raise HTTPException(status_code=404, detail="Không tìm thấy hợp đồng")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(contract, field, value)
    await contract.save()
    return ContractRead.from_doc(contract)


@router.post(
    "/{contract_id}/terminate",
    response_model=ContractRead,
    dependencies=[Depends(require_roles("admin", "staff"))],
)
async def terminate_contract(contract_id: str) -> ContractRead:
    contract = await Contract.get(contract_id)
    if contract is None:
        raise HTTPException(status_code=404, detail="Không tìm thấy hợp đồng")

    contract = await billing.terminate_contract(contract)
    return ContractRead.from_doc(contract)
