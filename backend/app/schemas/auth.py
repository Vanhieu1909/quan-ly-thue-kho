from .common import CamelModel
from .account import AccountRead


class LoginRequest(CamelModel):
    username: str
    password: str


class TokenResponse(CamelModel):
    access_token: str
    token_type: str = "bearer"
    account: AccountRead
