from datetime import datetime
from typing import Optional
from pydantic import BaseModel
from ..models.area_status_request import AreaStatusRequest
from ..models.enums import AreaStatus


class AreaStatusRequestCreate(BaseModel):
    area_id: str
    target_status: AreaStatus
    reason: str


class AreaStatusRequestReview(BaseModel):
    admin_note: Optional[str] = None


class AreaStatusRequestRead(BaseModel):
    id: str
    code: str
    area_id: str
    area_code: str
    area_name: str
    current_status: AreaStatus
    target_status: AreaStatus
    reason: str
    requested_by: str
    requested_at: str
    status: str
    reviewed_by: Optional[str] = None
    reviewed_at: Optional[str] = None
    admin_note: Optional[str] = None

    @classmethod
    def from_doc(cls, doc: AreaStatusRequest) -> "AreaStatusRequestRead":
        return cls(
            id=str(doc.id),
            code=doc.code,
            area_id=doc.area_id,
            area_code=doc.area_code,
            area_name=doc.area_name,
            current_status=doc.current_status,
            target_status=doc.target_status,
            reason=doc.reason,
            requested_by=doc.requested_by,
            requested_at=doc.requested_at.isoformat() if doc.requested_at else "",
            status=doc.status,
            reviewed_by=doc.reviewed_by,
            reviewed_at=doc.reviewed_at.isoformat() if doc.reviewed_at else None,
            admin_note=doc.admin_note,
        )
