from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, HTTPException, status

from ..models.area import Area
from ..models.area_status_request import AreaStatusRequest
from ..schemas.area_status_request import (
    AreaStatusRequestCreate,
    AreaStatusRequestRead,
    AreaStatusRequestReview,
)

router = APIRouter()


@router.get("", response_model=List[AreaStatusRequestRead])
async def list_area_status_requests() -> List[AreaStatusRequestRead]:
    docs = await AreaStatusRequest.find_all().sort("-requested_at").to_list()
    return [AreaStatusRequestRead.from_doc(doc) for doc in docs]


@router.post(
    "",
    response_model=AreaStatusRequestRead,
    status_code=status.HTTP_201_CREATED,
)
async def create_area_status_request(
    payload: AreaStatusRequestCreate,
) -> AreaStatusRequestRead:
    area = None
    try:
        area = await Area.get(payload.area_id)
    except Exception:
        pass
    if area is None:
        area = await Area.find_one(Area.code == payload.area_id)
    if area is None:
        clean = payload.area_id.replace("KV-", "").replace("A0", "A")
        area = await Area.find_one(Area.code == clean)
    if area is None:
        all_areas = await Area.find_all().to_list()
        for a in all_areas:
            if a.code == payload.area_id or payload.area_id in a.code or a.code in payload.area_id:
                area = a
                break
    
    area_id_str = str(area.id) if area else payload.area_id
    area_code_str = area.code if area else payload.area_id
    area_name_str = area.name if area else f"Khu vực {payload.area_id}"
    current_status_str = area.status if area else "Trong"

    count = await AreaStatusRequest.find_all().count()
    code = f"YC-TT{count + 1:03d}"

    doc = AreaStatusRequest(
        code=code,
        area_id=area_id_str,
        area_code=area_code_str,
        area_name=area_name_str,
        current_status=current_status_str,
        target_status=payload.target_status,
        reason=payload.reason,
        requested_by="Nhân viên kho",
        requested_at=datetime.now(),
        status="ChoDuyet",
    )
    await doc.insert()

    # Cập nhật tạm trạng thái kho sang "LoiChoXacNhan" (Màu Đỏ) trong lúc chờ Admin duyệt
    if area:
        area.status = "LoiChoXacNhan"
        await area.save()

    return AreaStatusRequestRead.from_doc(doc)


@router.post(
    "/{id}/approve",
    response_model=AreaStatusRequestRead,
)
async def approve_area_status_request(
    id: str,
    payload: Optional[AreaStatusRequestReview] = None,
) -> AreaStatusRequestRead:
    doc = await AreaStatusRequest.get(id)
    if doc is None:
        doc = await AreaStatusRequest.find_one(AreaStatusRequest.code == id)
    if doc is None:
        raise HTTPException(status_code=404, detail="Không tìm thấy yêu cầu")

    area = await Area.get(doc.area_id)
    if area is None:
        area = await Area.find_one(Area.code == doc.area_code)
    if area is None and doc.area_code:
        clean = doc.area_code.replace("KV-", "").replace("A0", "A")
        area = await Area.find_one(Area.code == clean)
    
    if area:
        # Sau khi Admin phê duyệt, cập nhật trạng thái kho sang "BaoTri" (hoặc target_status)
        area.status = doc.target_status if doc.target_status else "BaoTri"
        await area.save()

    doc.status = "DaDuyet"
    doc.reviewed_by = "Hoàng Thu Huyền (Admin)"
    doc.reviewed_at = datetime.now()
    if payload and payload.admin_note:
        doc.admin_note = payload.admin_note
    await doc.save()

    return AreaStatusRequestRead.from_doc(doc)


@router.post(
    "/{id}/reject",
    response_model=AreaStatusRequestRead,
)
async def reject_area_status_request(
    id: str,
    payload: Optional[AreaStatusRequestReview] = None,
) -> AreaStatusRequestRead:
    doc = await AreaStatusRequest.get(id)
    if doc is None:
        doc = await AreaStatusRequest.find_one(AreaStatusRequest.code == id)
    if doc is None:
        raise HTTPException(status_code=404, detail="Không tìm thấy yêu cầu")

    area = await Area.get(doc.area_id)
    if area is None:
        area = await Area.find_one(Area.code == doc.area_code)
    if area is None and doc.area_code:
        clean = doc.area_code.replace("KV-", "").replace("A0", "A")
        area = await Area.find_one(Area.code == clean)

    if area:
        # Nếu từ chối, khôi phục lại trạng thái ban đầu của kho
        area.status = doc.current_status
        await area.save()

    doc.status = "TuChoi"
    doc.reviewed_by = "Hoàng Thu Huyền (Admin)"
    doc.reviewed_at = datetime.now()
    if payload and payload.admin_note:
        doc.admin_note = payload.admin_note
    await doc.save()

    return AreaStatusRequestRead.from_doc(doc)


@router.delete(
    "/{id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_area_status_request(id: str):
    doc = await AreaStatusRequest.get(id)
    if doc is None:
        doc = await AreaStatusRequest.find_one(AreaStatusRequest.code == id)
    if doc:
        await doc.delete()
    return None
