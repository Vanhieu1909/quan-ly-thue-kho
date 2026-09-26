from datetime import datetime
from typing import Optional
from beanie import Document
from .enums import AreaStatus


class AreaStatusRequest(Document):
    code: str
    area_id: str
    area_code: str
    area_name: str
    current_status: AreaStatus
    target_status: AreaStatus
    reason: str
    requested_by: str
    requested_at: datetime
    status: str = "ChoDuyet"  # ChoDuyet | DaDuyet | TuChoi
    reviewed_by: Optional[str] = None
    reviewed_at: Optional[datetime] = None
    admin_note: Optional[str] = None

    class Settings:
        name = "area_status_requests"
