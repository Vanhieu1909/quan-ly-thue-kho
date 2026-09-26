from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

from .models.account import Account
from .security import decode_access_token

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


async def get_current_account(token: str = Depends(oauth2_scheme)) -> Account:
    payload = decode_access_token(token)
    if payload is None or "sub" not in payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token không hợp lệ")
    account = await Account.get(payload["sub"])
    if account is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Tài khoản không tồn tại")
    return account

# Alias for backwards compatibility
get_current_user = get_current_account


def require_roles(*roles: str):
    async def checker(account: Account = Depends(get_current_account)) -> Account:
        if account.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Không có quyền thực hiện hành động này",
            )
        return account

    return checker
