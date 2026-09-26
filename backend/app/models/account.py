from typing import Optional

from beanie import Document
from pymongo import ASCENDING, IndexModel

from .enums import Role


class Account(Document):
    username: str
    password_hash: str
    name: str
    role: Role
    email: Optional[str] = None
    phone: Optional[str] = None
    customer_id: Optional[str] = None

    class Settings:
        name = "accounts"
        indexes = [IndexModel([("username", ASCENDING)], unique=True)]
