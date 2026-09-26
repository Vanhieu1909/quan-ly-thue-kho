from beanie.operators import Or
from fastapi import APIRouter, Depends, HTTPException, status

from ..deps import get_current_account
from ..models.account import Account
from ..schemas.auth import LoginRequest, TokenResponse
from ..schemas.account import AccountRead, AccountUpdate
from ..security import create_access_token, hash_password, verify_password

router = APIRouter()


@router.post("/login", response_model=TokenResponse)
async def login(payload: LoginRequest) -> TokenResponse:
    identifier = payload.username
    account = await Account.find_one(
        Or(Account.username == identifier, Account.email == identifier, Account.phone == identifier)
    )
    if account is None or not verify_password(payload.password, account.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Sai tên đăng nhập hoặc mật khẩu",
        )
    token = create_access_token(subject=str(account.id))
    return TokenResponse(access_token=token, account=AccountRead.from_doc(account))


@router.get("/me", response_model=AccountRead)
async def me(current_account: Account = Depends(get_current_account)) -> AccountRead:
    return AccountRead.from_doc(current_account)


@router.patch("/me", response_model=AccountRead)
async def update_me(payload: AccountUpdate, current_account: Account = Depends(get_current_account)) -> AccountRead:
    data = payload.model_dump(exclude_unset=True)
    password = data.pop("password", None)
    for field, value in data.items():
        setattr(current_account, field, value)
    if password:
        current_account.password_hash = hash_password(password)
    await current_account.save()
    return AccountRead.from_doc(current_account)
