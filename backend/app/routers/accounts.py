from typing import List

from fastapi import APIRouter, Depends, HTTPException, status

from ..deps import require_roles
from ..models.account import Account
from ..schemas.account import AccountCreate, AccountRead, AccountUpdate, ResetPasswordRequest
from ..security import hash_password

router = APIRouter(dependencies=[Depends(require_roles("admin"))])


@router.get("", response_model=List[AccountRead])
async def list_accounts() -> List[AccountRead]:
    accounts = await Account.find_all().to_list()
    return [AccountRead.from_doc(acc) for acc in accounts]


@router.post("", response_model=AccountRead, status_code=status.HTTP_201_CREATED)
async def create_account(payload: AccountCreate) -> AccountRead:
    existing = await Account.find_one(Account.username == payload.username)
    if existing is not None:
        raise HTTPException(status_code=400, detail="Tên đăng nhập đã tồn tại")

    account = Account(
        username=payload.username,
        password_hash=hash_password(payload.password),
        name=payload.name,
        role=payload.role,
        email=payload.email,
        phone=payload.phone,
        customer_id=payload.customer_id,
    )
    await account.insert()
    return AccountRead.from_doc(account)


@router.patch("/{account_id}", response_model=AccountRead)
async def update_account(account_id: str, payload: AccountUpdate) -> AccountRead:
    account = await Account.get(account_id)
    if account is None:
        raise HTTPException(status_code=404, detail="Không tìm thấy tài khoản")

    data = payload.model_dump(exclude_unset=True)
    password = data.pop("password", None)
    for field, value in data.items():
        setattr(account, field, value)
    if password:
        account.password_hash = hash_password(password)
    await account.save()
    return AccountRead.from_doc(account)


@router.post("/{account_id}/reset-password", response_model=AccountRead)
async def reset_password(account_id: str, payload: ResetPasswordRequest) -> AccountRead:
    account = await Account.get(account_id)
    if account is None:
        raise HTTPException(status_code=404, detail="Không tìm thấy tài khoản")
    account.password_hash = hash_password(payload.new_password)
    await account.save()
    return AccountRead.from_doc(account)


from ..deps import get_current_account, require_roles


@router.delete("/{account_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_account(
    account_id: str,
    current_account: Account = Depends(get_current_account),
) -> None:
    account = await Account.get(account_id)
    if account is None:
        raise HTTPException(status_code=404, detail="Không tìm thấy tài khoản")
    if account.username == "admin" or str(account.id) == str(current_account.id):
        raise HTTPException(
            status_code=400,
            detail="Không thể xóa tài khoản Quản trị viên mặc định hoặc tài khoản đang đăng nhập",
        )
    await account.delete()


