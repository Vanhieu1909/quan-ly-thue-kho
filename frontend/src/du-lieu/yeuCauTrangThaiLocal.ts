import type { AreaStatusRequest, AreaStatus, Area } from '../kieu';
import { areas as seedAreas } from './duLieuMau';

const KEY = 'thue-kho-area-status-requests';

const seedRequests: AreaStatusRequest[] = [];

export async function taiDanhSachYeuCauTrangThai(): Promise<AreaStatusRequest[]> {
  let backendList: AreaStatusRequest[] = [];
  try {
    const res = await fetch('http://127.0.0.1:8000/api/area-status-requests');
    if (res.ok) {
      const data = await res.json();
      backendList = data.map((d: any) => ({
        id: d.id,
        code: d.code,
        areaId: d.area_id,
        areaCode: d.area_code,
        areaName: d.area_name,
        currentStatus: d.current_status,
        targetStatus: d.target_status,
        reason: d.reason,
        requestedBy: d.requested_by,
        requestedAt: d.requested_at,
        status: d.status,
        reviewedBy: d.reviewed_by,
        reviewedAt: d.reviewed_at,
        adminNote: d.admin_note,
      }));
    }
  } catch {}

  let localList: AreaStatusRequest[] = [];
  try {
    const raw = localStorage.getItem(KEY);
    localList = raw ? JSON.parse(raw) : seedRequests;
  } catch {
    localList = seedRequests;
  }

  // Merging backend and local data without losing pending local requests
  const map = new Map<string, AreaStatusRequest>();
  for (const item of localList) {
    map.set(item.id, item);
  }
  for (const item of backendList) {
    map.set(item.id, item);
    if (item.code) map.set(item.code, item);
  }

  const result = Array.from(new Set(map.values()));

  // Auto-sync: If an area is LoiChoXacNhan on the map, ensure a ChoDuyet request exists for it
  try {
    const areasRaw = localStorage.getItem('mock_areas');
    const areasList = areasRaw ? JSON.parse(areasRaw) : [];
    for (const a of areasList) {
      if (a.status === 'LoiChoXacNhan') {
        const hasPending = result.some(
          (r) =>
            (r.areaId === a.id ||
              r.areaCode === a.code ||
              (r.areaCode && a.code && r.areaCode.includes(a.code))) &&
            r.status === 'ChoDuyet'
        );
        if (!hasPending) {
          result.unshift({
            id: `sync_req_${a.id}`,
            code: `YC-${a.code}`,
            areaId: a.id,
            areaCode: a.code,
            areaName: a.name || `Khu vực ${a.code}`,
            currentStatus: 'Trong',
            targetStatus: 'BaoTri',
            reason: `Báo lỗi / Bảo trì ô kho ${a.code} (Chờ Admin duyệt)`,
            requestedBy: 'Nhân viên kho',
            requestedAt: new Date().toISOString(),
            status: 'ChoDuyet',
          });
        }
      }
    }
  } catch {}

  result.sort((a, b) => new Date(b.requestedAt || 0).getTime() - new Date(a.requestedAt || 0).getTime());
  localStorage.setItem(KEY, JSON.stringify(result));
  return result;
}

export async function taoYeuCauTrangThai(payload: {
  areaId: string;
  areaCode: string;
  areaName: string;
  currentStatus: AreaStatus;
  targetStatus: AreaStatus;
  reason: string;
  requestedBy: string;
}): Promise<AreaStatusRequest> {
  const token = localStorage.getItem('token');

  const currentList: AreaStatusRequest[] = (() => {
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? JSON.parse(raw) : seedRequests;
    } catch {
      return seedRequests;
    }
  })();

  const newReq: AreaStatusRequest = {
    id: `req_${Date.now()}`,
    code: `YC-TT${String(currentList.length + 1).padStart(3, '0')}`,
    areaId: payload.areaId,
    areaCode: payload.areaCode,
    areaName: payload.areaName,
    currentStatus: payload.currentStatus,
    targetStatus: payload.targetStatus,
    reason: payload.reason,
    requestedBy: payload.requestedBy,
    requestedAt: new Date().toISOString(),
    status: 'ChoDuyet',
  };

  const updated = [newReq, ...currentList];
  localStorage.setItem(KEY, JSON.stringify(updated));

  // Cập nhật ngay trạng thái kho sang "Lỗi đang chờ xác nhận" (màu đỏ) trên sơ đồ và bảng
  try {
    const areasRaw = localStorage.getItem('mock_areas');
    const areasList: Area[] = areasRaw && JSON.parse(areasRaw).length > 0 ? JSON.parse(areasRaw) : [...seedAreas];
    const idx = areasList.findIndex(
      (a: any) =>
        a.id === payload.areaId ||
        a.code === payload.areaCode ||
        (payload.areaCode &&
          (a.code === payload.areaCode.replace('KV-', '').replace(/^A0/, 'A') ||
            payload.areaCode.includes(a.code) ||
            a.code.includes(payload.areaCode))) ||
        (payload.areaId && (a.id === payload.areaId || a.code === payload.areaId))
    );
    if (idx !== -1) {
      areasList[idx].status = 'LoiChoXacNhan';
    }
    localStorage.setItem('mock_areas', JSON.stringify(areasList));
  } catch {}

  // Gửi thông tin lên backend API nếu có kết nối
  try {
    fetch('http://127.0.0.1:8000/api/area-status-requests', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        area_id: payload.areaId,
        target_status: payload.targetStatus,
        reason: payload.reason,
      }),
    });
  } catch {}

  window.dispatchEvent(new Event('storage'));
  return newReq;
}

export async function xuLyYeuCauTrangThai(
  id: string,
  action: 'approve' | 'reject',
  reviewerName: string,
  adminNote?: string,
): Promise<boolean> {
  const token = localStorage.getItem('token');

  // 1. Cập nhật ngay trong LocalStorage để đảm bảo phản hồi tức thì
  try {
    const raw = localStorage.getItem(KEY);
    const list: AreaStatusRequest[] = raw ? JSON.parse(raw) : seedRequests;
    const req = list.find((r) => r.id === id || r.code === id);
    if (req) {
      req.status = action === 'approve' ? 'DaDuyet' : 'TuChoi';
      req.reviewedBy = reviewerName;
      req.reviewedAt = new Date().toISOString();
      if (adminNote) req.adminNote = adminNote;
      localStorage.setItem(KEY, JSON.stringify(list));

      const areasRaw = localStorage.getItem('mock_areas');
      const areas: Area[] = areasRaw && JSON.parse(areasRaw).length > 0 ? JSON.parse(areasRaw) : [...seedAreas];
      const idx = areas.findIndex(
        (a: any) =>
          a.id === req.areaId ||
          a.code === req.areaCode ||
          (req.areaCode &&
            (a.code === req.areaCode.replace('KV-', '').replace(/^A0/, 'A') ||
              req.areaCode.includes(a.code) ||
              a.code.includes(req.areaCode)))
      );
      if (idx !== -1) {
        const nextStatus = action === 'approve' ? (req.targetStatus || 'BaoTri') : req.currentStatus;
        areas[idx].status = nextStatus;
        if (nextStatus === 'Trong' || action === 'reject') {
          areas[idx].note = '';
        } else if (action === 'approve') {
          areas[idx].note = req.reason || 'Bảo trì';
        }
      }
      localStorage.setItem('mock_areas', JSON.stringify(areas));
    }
  } catch {}

  // 2. Gửi request đồng bộ tới Backend API
  try {
    await fetch(`http://127.0.0.1:8000/api/area-status-requests/${id}/${action}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ admin_note: adminNote }),
    });
  } catch {}

  window.dispatchEvent(new Event('storage'));
  return true;
}

export async function xoaYeuCauTrangThai(id: string): Promise<boolean> {
  const token = localStorage.getItem('token');

  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const list: AreaStatusRequest[] = JSON.parse(raw);
      const filtered = list.filter((r) => r.id !== id && r.code !== id);
      localStorage.setItem(KEY, JSON.stringify(filtered));
    }
  } catch {}

  try {
    await fetch(`http://127.0.0.1:8000/api/area-status-requests/${id}`, {
      method: 'DELETE',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
  } catch {}

  window.dispatchEvent(new Event('storage'));
  return true;
}
