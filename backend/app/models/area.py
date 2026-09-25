from typing import Optional

from beanie import Document
from pydantic import BaseModel
from pymongo import ASCENDING, IndexModel

from .enums import AreaStatus, AreaType


class AreaMapPos(BaseModel):
    floor: int
    row: int
    col: int
    row_span: Optional[int] = None
    col_span: Optional[int] = None


class Area(Document):
    code: str
    name: str
    warehouse_id: str
    area_m2: float
    type: AreaType
    status: AreaStatus
    location: str
    note: Optional[str] = None
    map: AreaMapPos

    class Settings:
        name = "areas"
        indexes = [IndexModel([("code", ASCENDING)], unique=True)]
