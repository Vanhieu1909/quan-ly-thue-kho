import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { taiYeuCau, luuYeuCau } from '../../du-lieu/yeuCauLocal';
import { areas } from '../../du-lieu/duLieuMau';
import type { RentalRequest } from '../../kieu';
import { areaTypeLabel, formatDate } from '../../thu-vien/dinhDang';
import { NhanTrangThaiYeuCau } from '../../thanh-phan/NhanTrangThai';
import { HopThoai } from '../../thanh-phan/HopThoai';

export function YeuCauThue({ mode = 'tiepNhan' }: { mode?: 'tiepNhan' | 'pheDuyet' }) {
  const navigate = useNavigate();
  const [rows, setRows] = useState<RentalRequest[]>(taiYeuCau);
  const [selected, setSelected] = useState<RentalRequest | null>(null);
  const [noteOpen, setNoteOpen] = useState(false);
  const [note, setNote] = useState('');

  useEffect(() => {
    luuYeuCau(rows);
  }, [rows]);

  function updateStatus(id: string, status: RentalRequest['status'], extraNote?: string) {
    const updated = rows.map((r) => (r.id === id ? { ...r, status, note: extraNote ?? r.note } : r));
    setRows(updated);
    luuYeuCau(updated);
    window.dispatchEvent(new Event('storage'));
    setSelected((s) => (s && s.id === id ? { ...s, status, note: extraNote ?? s.note } : s));
  }

  return (
    <div className="grid-2">
      <div className="panel">
        <div className="panel-hd">
          <h2>Danh sách yêu cầu thuê</h2>
        </div>
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Mã YC</th>
                <th>Tên khách hàng</th>
                <th>Diện tích</th>
                <th>Ngày gửi</th>
                <th>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr
                  key={r.id}
                  onClick={() => setSelected(r)}
                  style={{ cursor: 'pointer', background: selected?.id === r.id ? '#f0f7f4' : undefined }}
                >
                  <td>{r.code}</td>
                  <td>{r.customerName}</td>
                  <td>{r.requestedCapacity} {r.rentalUnit}</td>
                  <td>{formatDate(r.date)}</td>
                  <td>
                    <NhanTrangThaiYeuCau status={r.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="panel">
        <div className="panel-hd">
          <h2>Chi tiết yêu cầu</h2>
        </div>
        <div className="panel-bd">
          {!selected && <div className="empty">Chọn một yêu cầu để xem chi tiết</div>}
          {selected && (
            <div className="stack">
              <div className="detail-grid">
                <div className="detail-item">
                  <label>Mã yêu cầu</label>
                  <strong>{selected.code}</strong>
                </div>
                <div className="detail-item">
                  <label>Trạng thái</label>
                  <NhanTrangThaiYeuCau status={selected.status} />
                </div>
                <div className="detail-item">
                  <label>Khách hàng</label>
                  <strong>{selected.customerName}</strong>
                </div>
                <div className="detail-item">
                  <label>Liên hệ</label>
                  <strong>{selected.phone}</strong>
                </div>
                <div className="detail-item">
                  <label>Diện tích yêu cầu</label>
                  <strong>{selected.requestedCapacity} {selected.rentalUnit}</strong>
                </div>
                <div className="detail-item">
                  <label>Loại khu vực</label>
                  <strong>{areaTypeLabel[selected.preferredType]}</strong>
                </div>
                <div className="detail-item">
                  <label>Khu vực đã chọn</label>
                  <strong>{selected.areaId ? areas.find(a => a.id === selected.areaId)?.code : 'Chưa chọn'}</strong>
                </div>
                <div className="detail-item">
                  <label>Thời gian thuê</label>
                  <strong>
                    {formatDate(selected.startDate)} – {formatDate(selected.endDate)}
                  </strong>
                </div>
                <div className="detail-item">
                  <label>Yêu cầu đặc biệt</label>
                  <strong>{selected.specialRequest || '—'}</strong>
                </div>
              </div>
              {mode === 'tiepNhan' && selected.status === 'Moi' && (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button className="btn btn-primary" onClick={() => updateStatus(selected.id, 'DaTiepNhan')}>
                    Tiếp nhận yêu cầu
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={() => {
                      setNote(selected.note || '');
                      setNoteOpen(true);
                    }}
                  >
                    Ghi chú
                  </button>
                </div>
              )}
              {mode === 'tiepNhan' && selected.status === 'DaTiepNhan' && (
                <div className="summary-box">Yêu cầu đã được tiếp nhận và đang chờ quản trị viên phê duyệt.</div>
              )}
              {mode === 'pheDuyet' && (selected.status === 'DaTiepNhan' || selected.status === 'Moi') && (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button className="btn btn-primary" onClick={() => {
                    updateStatus(selected.id, 'DaDuyet');
                    navigate('/admin/contracts', { 
                      state: { 
                        openCreate: true, 
                        areaId: selected.areaId,
                        areaIds: selected.areaIds,
                        startDate: selected.startDate,
                        endDate: selected.endDate,
                        customerName: selected.customerName,
                        phone: selected.phone,
                        email: selected.email
                      } 
                    });
                  }}>
                    Phê duyệt yêu cầu {selected.status === 'Moi' && '(Duyệt ngay)'}
                  </button>
                  <button className="btn btn-danger" onClick={() => updateStatus(selected.id, 'TuChoi', 'Từ chối bởi quản trị viên')}>
                    Từ chối
                  </button>
                </div>
              )}
              {selected.note && (
                <div className="summary-box">
                  <div className="row">
                    <span>Ghi chú nội bộ</span>
                    <strong>{selected.note}</strong>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <HopThoai
        open={noteOpen}
        title="Thêm ghi chú nội bộ"
        onClose={() => setNoteOpen(false)}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setNoteOpen(false)}>
              Hủy
            </button>
            <button
              className="btn btn-primary"
              onClick={() => {
                if (selected) {
                  setRows((prev) => prev.map((r) => (r.id === selected.id ? { ...r, note } : r)));
                  setSelected({ ...selected, note });
                }
                setNoteOpen(false);
              }}
            >
              Lưu ghi chú
            </button>
          </>
        }
      >
        <div className="field">
          <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Ghi chú</span>
            <span style={{ fontSize: '0.8rem', color: (note || '').length >= 200 ? '#b91c1c' : 'var(--muted)' }}>
              {(note || '').length}/200 ký tự
            </span>
          </label>
          <textarea
            rows={4}
            maxLength={200}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Nhập ghi chú (tối đa 200 ký tự)..."
          />
        </div>
      </HopThoai>
    </div>
  );
}
