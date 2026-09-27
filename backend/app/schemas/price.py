from datetime import date
from typing import Optional

from ..models.enums import AreaType, PriceStatus
from ..models.price import PriceRow
from .common import CamelModel


class PriceRead(CamelModel):
    id: str
    type: AreaType
    unit_price: float
    unit: str
    effective_from: date
    status: PriceStatus

    @classmethod
    def from_doc(cls, doc: PriceRow) -> "PriceRead":
        return cls(id=str(doc.id), **doc.model_dump(exclude={"id"}))


class PriceCreate(CamelModel):
    type: AreaType
    unit_price: float
    unit: str = "đồng/cái/tháng"
    effective_from: date


class PriceUpdate(CamelModel):
    unit_price: Optional[float] = None
    status: Optional[PriceStatus] = None
