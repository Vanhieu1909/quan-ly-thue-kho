from typing import Optional

from beanie import Document
from pydantic import BaseModel
from pymongo import ASCENDING, IndexModel

from .enums import WarehouseStatus

class Warehouse(Document):
    code: str
    name: str
    location: str
    total_capacity: float
    status: WarehouseStatus

    class Settings:
        name = "warehouses"
        indexes = [IndexModel([("code", ASCENDING)], unique=True)]
