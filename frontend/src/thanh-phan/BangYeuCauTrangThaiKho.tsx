import { useState, useEffect } from 'react';
import type { Area, AreaStatus, AreaStatusRequest } from '../kieu';
import { NhanTrangThaiKhuVuc } from './NhanTrangThai';
import { HopThoai } from './HopThoai';
import { areaStatusLabel } from '../thu-vien/dinhDang';
import {
  taiDanhSachYeuCauTrangThai,
  taoYeuCauTrangThai,
  xuLyYeuCauTrangThai,
  xoaYeuCauTrangThai,
} from '../du-lieu/yeuCauTrangThaiLocal';

interface Props {
  mode: 'admin' | 'staff';
  areas?: Area[];
  onAreaStatusUpdated?: () => void;
  requestAreaId?: string | null;
  onRequestModalClose?: () => void;
}

export function BangYeuCauTrangThaiKho({
  mode,
  areas = [],
  onAreaStatusUpdated,
  requestAreaId,
  onRequestModalClose,
}: Props) {
  const [requests, setRequests] = useState<AreaStatusRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [openModal, setOpenModal] = useState(false);

  // Form states for staff request
  const [selectedAreaId, setSelectedAreaId] = useState<string>('');
  const [targetStatus, setTargetStatus] = useState<AreaStatus>('BaoTri');
  const [reason, setReason] = useState<string>('');
  const [reasonError, setReasonError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Review states for admin
  const [reviewingReq, setReviewingReq] = useState<AreaStatusRequest | null>(null);
  const [adminNote, setAdminNote] = useState<string>('');

  async function loadData(isInitial = false) {
    if (isInitial) {
      setLoading(true);
    }
    try {
      const list = await taiDanhSachYeuCauTrangThai();
      setRequests(list);
    } finally {
      if (isInitial) {
        setLoading(false);
      }
    }
  }

  useEffect(() => {
    loadData(true);
    const handleRefresh = () => loadData(false);
    window.addEventListener('storage', handleRefresh);
    const interval = setInterval(handleRefresh, 3000);
    return () => {
      window.removeEventListener('storage', handleRefresh);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (areas.length > 0 && !selectedAreaId) {
      setSelectedAreaId(areas[0].id);
    }
  }, [areas]);

  useEffect(() => {
    if (requestAreaId) {
      const match = areas.find((a) => a.id === requestAreaId || a.code === requestAreaId);
      if (match) {
        setSelectedAreaId(match.id);
      } else if (areas.length > 0) {
        setSelectedAreaId(requestAreaId);
      }
      setOpenModal(true);
      setReasonError(null);
    }
  }, [requestAreaId]);

  function closeModal() {
    setReasonError(null);
    setOpenModal(false);
    if (onRequestModalClose) onRequestModalClose();
  }

  async function handleSubmitRequest() {
    const area = areas.find((a) => a.id === selectedAreaId);
    if (!area) {
      alert('Vui lòng chọn khu vực kho');
      return;
    }
    if (!reason.trim()) {
      setReasonError('Vui lòng nhập lý do / mô tả chi tiết sự cố trước khi gửi yêu cầu!');
      return;
    }

    setReasonError(null);
    setSubmitting(true);
    await taoYeuCauTrangThai({
      areaId: area.id,
      areaCode: area.code,
      areaName: area.name,
      currentStatus: area.status,
      targetStatus: targetStatus,
      reason: reason.trim(),
      requestedBy: 'Nhân viên kho',
    });
    setSubmitting(false);
    setOpenModal(false);
    setReason('');
    if (onRequestModalClose) onRequestModalClose();
    alert('✅ Đã gửi yêu cầu đổi trạng thái kho tới Admin phê duyệt!');
    if (onAreaStatusUpdated) onAreaStatusUpdated();
    loadData();
  }

  async function handleReview(action: 'approve' | 'reject') {
    if (!reviewingReq) return;
    setSubmitting(true);
    const ok = await xuLyYeuCauTrangThai(
      reviewingReq.id,
      action,
      'Hoàng Thu Huyền (Admin)',
      adminNote.trim(),
    );
    setSubmitting(false);
    setReviewingReq(null);
    setAdminNote('');
    if (ok) {
      if (onAreaStatusUpdated) onAreaStatusUpdated();
      await loadData();
    }
  }

  const pendingCount = requests.filter((r) => r.status === 'ChoDuyet').length;

  return (
    <div className="panel" style={{ marginTop: 16 }}>
      <div className="panel-hd" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2>
            {mode === 'admin' ? 'Phê duyệt yêu cầu thay đổi trạng thái kho' : 'Báo lỗi & Yêu cầu cập nhật trạng thái kho'}
          </h2>
          <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
            {mode === 'admin'
              ? `Có ${pendingCount} yêu cầu từ nhân viên đang chờ Admin phê duyệt`
              : 'Nhân viên gửi yêu cầu khi kho gặp sự cố/hư hỏng/bảo trì để Admin duyệt'}
          </span>
        </div>
        {mode === 'staff' && (
          <button
            className="btn btn-primary"
            onClick={() => {
              setReasonError(null);
              setOpenModal(true);
            }}
          >
            + Báo lỗi / Yêu cầu đổi trạng thái
          </button>
        )}
      </div>

      <div className="panel-bd">
        {loading ? (
          <div>Đang tải dữ liệu...</div>
        ) : requests.length === 0 ? (
          <div className="empty">Chưa có yêu cầu cập nhật trạng thái nào</div>
        ) : (
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>Mã YC</th>
                  <th>Khu vực kho</th>
                  <th>Trạng thái hiện tại</th>
                  <th>Trạng thái đề xuất</th>
                  <th>Lý do báo lỗi / bảo trì</th>
                  <th>Người gửi</th>
                  <th>Thời gian</th>
                  <th>Trạng thái duyệt</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((r) => {
                  const liveArea = areas.find(
                    (a) =>
                      a.id === r.areaId ||
                      a.code === r.areaCode ||
                      (r.areaCode &&
                        (a.code === r.areaCode.replace('KV-', '').replace(/^A0/, 'A') ||
                          r.areaCode.includes(a.code) ||
                          a.code.includes(r.areaCode)))
                  );
                  const liveStatus = liveArea ? liveArea.status : r.currentStatus;
                  return (
                    <tr key={r.id}>
                      <td><strong>{r.code}</strong></td>
                      <td>
                        <strong>{r.areaCode}</strong>
                        <div style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>{r.areaName}</div>
                      </td>
                      <td>
                        <NhanTrangThaiKhuVuc status={liveStatus} />
                      </td>
                    <td>
                      <span className="badge badge-warning" style={{ fontWeight: 600 }}>
                        ➔ {areaStatusLabel[r.targetStatus] || r.targetStatus}
                      </span>
                    </td>
                    <td style={{ maxWidth: 280 }}>{r.reason}</td>
                    <td>{r.requestedBy}</td>
                    <td>{r.requestedAt ? new Date(r.requestedAt).toLocaleString('vi-VN') : '-'}</td>
                    <td>
                      {r.status === 'ChoDuyet' && <span className="badge badge-warning">⏳ Chờ Admin duyệt</span>}
                      {r.status === 'DaDuyet' && <span className="badge badge-success">✓ Đã phê duyệt</span>}
                      {r.status === 'TuChoi' && <span className="badge badge-danger">✗ Từ chối</span>}
                    </td>
                    <td>
                      {mode === 'admin' ? (
                        r.status === 'ChoDuyet' ? (
                          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                            <button
                              className="btn btn-success btn-sm"
                              title="Duyệt nhanh"
                              onClick={async () => {
                                const ok = await xuLyYeuCauTrangThai(r.id, 'approve', 'Hoàng Thu Huyền (Admin)');
                                if (ok) {
                                  if (onAreaStatusUpdated) onAreaStatusUpdated();
                                  await loadData();
                                }
                              }}
                            >
                              ✓ Duyệt
                            </button>
                            <button
                              className="btn btn-danger btn-sm"
                              title="Từ chối"
                              onClick={async () => {
                                const ok = await xuLyYeuCauTrangThai(r.id, 'reject', 'Hoàng Thu Huyền (Admin)');
                                if (ok) {
                                  if (onAreaStatusUpdated) onAreaStatusUpdated();
                                  await loadData();
                                }
                              }}
                            >
                              ✗ Từ chối
                            </button>
                            <button
                              className="btn btn-sm"
                              style={{ background: '#e2e8f0', color: '#334155' }}
                              title="Chi tiết & Ghi chú"
                              onClick={() => {
                                setReviewingReq(r);
                                setAdminNote('');
                              }}
                            >
                              🔍
                            </button>
                            <button
                              className="btn btn-danger btn-sm"
                              title="Xóa yêu cầu"
                              onClick={async () => {
                                if (window.confirm(`Xóa dòng yêu cầu ${r.code}?`)) {
                                  await xoaYeuCauTrangThai(r.id);
                                  await loadData();
                                  if (onAreaStatusUpdated) onAreaStatusUpdated();
                                }
                              }}
                            >
                              🗑️ Xóa
                            </button>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
                              {r.reviewedBy ? `Bởi ${r.reviewedBy}` : 'Đã xử lý'}
                            </span>
                            <button
                              className="btn btn-danger btn-sm"
                              title="Xóa dòng nhật ký lịch sử này"
                              onClick={async () => {
                                if (window.confirm(`Xóa dòng lịch sử yêu cầu ${r.code}?`)) {
                                  await xoaYeuCauTrangThai(r.id);
                                  await loadData();
                                  if (onAreaStatusUpdated) onAreaStatusUpdated();
                                }
                              }}
                            >
                              🗑️ Xóa
                            </button>
                          </div>
                        )
                      ) : (
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            className="btn btn-sm"
                            style={{ background: '#e2e8f0', color: '#334155' }}
                            title="Xem chi tiết"
                            onClick={() => {
                              if (r.areaId) setSelectedAreaId(r.areaId);
                              setOpenModal(true);
                            }}
                          >
                            🔍 Xem
                          </button>
                          <button
                            className="btn btn-danger btn-sm"
                            title="Hủy / Xóa yêu cầu"
                            onClick={async () => {
                              if (window.confirm(`Xóa dòng yêu cầu ${r.code}?`)) {
                                await xoaYeuCauTrangThai(r.id);
                                await loadData();
                                if (onAreaStatusUpdated) onAreaStatusUpdated();
                              }
                            }}
                          >
                            🗑️ Xóa
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Staff modal for submitting status change request */}
      <HopThoai open={openModal} onClose={closeModal} title="Gửi yêu cầu đổi trạng thái kho / Báo lỗi (Chờ Admin duyệt)">
        <div className="stack" style={{ gap: 16 }}>
          {reasonError && (
            <div
              style={{
                background: '#fee2e2',
                color: '#b91c1c',
                border: '1px solid #fca5a5',
                padding: '10px 14px',
                borderRadius: '8px',
                fontSize: '0.88rem',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <span>⚠️</span>
              <span>{reasonError}</span>
            </div>
          )}

          <div className="field">
            <label>Chọn khu vực kho</label>
            <select
              className="filter-select"
              style={{ width: '100%' }}
              value={selectedAreaId}
              onChange={(e) => setSelectedAreaId(e.target.value)}
            >
              {areas.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.code} — {a.name} (Hiện tại: {areaStatusLabel[a.status]})
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label>Trạng thái đề xuất mới</label>
            <select
              className="filter-select"
              style={{ width: '100%' }}
              value={targetStatus}
              onChange={(e) => setTargetStatus(e.target.value as AreaStatus)}
            >
              <option value="BaoTri">🛠️ Đang bảo dưỡng / Báo lỗi kỹ thuật</option>
              <option value="Trong">🟢 Đang trống</option>
              <option value="DaThue">🔴 Đang cho thuê</option>
            </select>
          </div>

          <div className="field">
            <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: reasonError ? '#b91c1c' : undefined, fontWeight: reasonError ? 600 : undefined }}>
              <span>Lý do / Mô tả chi tiết sự cố <span style={{ color: '#b91c1c' }}>*</span></span>
              <span style={{ fontSize: '0.8rem', color: (reason || '').length >= 200 ? '#b91c1c' : 'var(--muted)', fontWeight: 400 }}>
                {(reason || '').length}/200 ký tự
              </span>
            </label>
            <textarea
              rows={4}
              maxLength={200}
              style={{
                width: '100%',
                padding: 8,
                borderRadius: 6,
                border: reasonError ? '2px solid #b91c1c' : '1px solid #ccc',
                backgroundColor: reasonError ? '#fff5f5' : '#fff',
              }}
              placeholder="Mô tả sự cố (Ví dụ: Kho A3 hỏng kệ, nguy cơ móp sập thanh đỡ; dột trần... Max 200 ký tự)"
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (e.target.value.trim()) setReasonError(null);
              }}
            />
            {reasonError && (
              <span style={{ color: '#b91c1c', fontSize: '0.82rem', fontWeight: 600, marginTop: 4, display: 'block' }}>
                * Bắt buộc: Bạn phải nhập mô tả chi tiết lý do sự cố để Admin duyệt.
              </span>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
            <button
              className="btn"
              onClick={() => {
                setReasonError(null);
                setOpenModal(false);
              }}
            >
              Hủy
            </button>
            <button className="btn btn-primary" onClick={handleSubmitRequest} disabled={submitting}>
              {submitting ? 'Đang gửi...' : 'Gửi yêu cầu phê duyệt'}
            </button>
          </div>
        </div>
      </HopThoai>

      {/* Admin review modal */}
      {reviewingReq && (
        <HopThoai
          open={!!reviewingReq}
          onClose={() => setReviewingReq(null)}
          title={`Phê duyệt yêu cầu ${reviewingReq.code}`}
        >
          <div className="stack" style={{ gap: 16 }}>
            <div className="detail-grid">
              <div className="detail-item">
                <label>Khu vực kho</label>
                <strong>{reviewingReq.areaCode} — {reviewingReq.areaName}</strong>
              </div>
              <div className="detail-item">
                <label>Thay đổi trạng thái</label>
                <div>
                  <NhanTrangThaiKhuVuc status={reviewingReq.currentStatus} /> ➔{' '}
                  <span className="badge badge-warning">{areaStatusLabel[reviewingReq.targetStatus]}</span>
                </div>
              </div>
              <div className="detail-item">
                <label>Người yêu cầu</label>
                <strong>{reviewingReq.requestedBy}</strong>
              </div>
            </div>

            <div className="field">
              <label>Lý do báo lỗi / bảo trì từ nhân viên</label>
              <div style={{ background: '#f8f9fa', padding: 12, borderRadius: 6, border: '1px solid #e9ecef' }}>
                {reviewingReq.reason}
              </div>
            </div>

            <div className="field">
              <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Ghi chú của Admin (Tùy chọn)</span>
                <span style={{ fontSize: '0.8rem', color: (adminNote || '').length >= 150 ? '#b91c1c' : 'var(--muted)' }}>
                  {(adminNote || '').length}/150 ký tự
                </span>
              </label>
              <input
                type="text"
                maxLength={150}
                style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #ccc' }}
                placeholder="Ghi chú khi phê duyệt hoặc từ chối (tối đa 150 ký tự)..."
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
              <button className="btn btn-danger" onClick={() => handleReview('reject')} disabled={submitting}>
                ❌ Từ chối
              </button>
              <button className="btn btn-success" onClick={() => handleReview('approve')} disabled={submitting}>
                ✅ Phê duyệt & Cập nhật trạng thái kho
              </button>
            </div>
          </div>
        </HopThoai>
      )}
    </div>
  );
}
