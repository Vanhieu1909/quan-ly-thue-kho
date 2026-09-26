import { useMemo, useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, Plus, Pencil, Trash2 } from 'lucide-react';
import { areas as seedAreas, warehouses } from '../../du-lieu/duLieuMau';
import type { Area, AreaStatus, AreaType, RentalUnit, AreaStatusRequest } from '../../kieu';
import { NhanTrangThaiKhuVuc } from '../../thanh-phan/NhanTrangThai';
import { BanDoKho } from '../../thanh-phan/BanDoKho';
import { HopThoai } from '../../thanh-phan/HopThoai';
import { BangYeuCauTrangThaiKho } from '../../thanh-phan/BangYeuCauTrangThaiKho';
import { formatMoney, areaStatusLabel } from '../../thu-vien/dinhDang';
import { xuatCsv } from '../../thu-vien/xuatCsv';
import {
  taiDanhSachYeuCauTrangThai,
  xuLyYeuCauTrangThai,
} from '../../du-lieu/yeuCauTrangThaiLocal';

const emptyForm = {
  warehouseId: 'w1',
  code: '',
  name: '',
  capacity: '',
  rentalUnit: 'Pallet' as RentalUnit,
  type: 'Ke' as AreaType,
  status: 'Trong' as AreaStatus,
  location: '',
  note: '',
  mapRow: '9',
  mapCol: '1',
  mapRowSpan: '2',
  mapColSpan: '3',
};

export function QuanLyKho({ focusStatusRequests: _focusStatusRequests = false }: { focusStatusRequests?: boolean }) {
  const navigate = useNavigate();
  const approvalSectionRef = useRef<HTMLDivElement>(null);

  const scrollToApproval = () => {
    approvalSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  const sanitizeAreas = (list: Area[]) => {
    let changed = false;
    const cleaned = list.map((a) => {
      if (a.status === 'Trong' && (a.note === 'lỗi' || a.note === 'Lỗi' || a.note?.toLowerCase().includes('lỗi cho xác nhận'))) {
        changed = true;
        return { ...a, note: '' };
      }
      return a;
    });
    if (changed) {
      localStorage.setItem('mock_areas', JSON.stringify(cleaned));
    }
    return cleaned;
  };

  const [areas, setAreasState] = useState<Area[]>(() => {
    const saved = localStorage.getItem('mock_areas');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.some((a: Area) => a.code.startsWith('KV-')) || (parsed.length > 0 && !parsed[0]?.capacity)) {
        localStorage.setItem('mock_areas', JSON.stringify(seedAreas));
        return seedAreas;
      }
      return sanitizeAreas(parsed);
    }
    return seedAreas;
  });

  const [statusRequests, setStatusRequests] = useState<AreaStatusRequest[]>([]);

  const reloadStatusRequests = async () => {
    const list = await taiDanhSachYeuCauTrangThai();
    setStatusRequests(list);
    const saved = localStorage.getItem('mock_areas');
    if (saved) {
      setAreasState(sanitizeAreas(JSON.parse(saved)));
    }
  };

  useEffect(() => {
    reloadStatusRequests();
    window.addEventListener('storage', reloadStatusRequests);
    return () => window.removeEventListener('storage', reloadStatusRequests);
  }, []);

  function setAreas(action: React.SetStateAction<Area[]>) {
    setAreasState((prev) => {
      const next = typeof action === 'function' ? action(prev) : action;
      const sanitized = sanitizeAreas(next);
      localStorage.setItem('mock_areas', JSON.stringify(sanitized));
      window.dispatchEvent(new Event('storage'));
      return sanitized;
    });
  }

  const [statusFilter, setStatusFilter] = useState<AreaStatus | 'All'>('All');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(
    () => (statusFilter === 'All' ? areas : areas.filter((a) => a.status === statusFilter)),
    [areas, statusFilter],
  );

  function save() {
    if (!form.name.trim() || !form.capacity || !form.code.trim()) {
      setError('Vui lòng nhập đầy đủ các trường bắt buộc.');
      return;
    }
    const cleanCode = form.code.trim();
    const existing = areas.find(
      (area) =>
        area.id === editingId ||
        area.code === editingId ||
        area.code === cleanCode ||
        (editingId && area.code.includes(editingId))
    );
    const targetId = existing?.id ?? editingId ?? `a${Date.now()}`;
    const next: Area = {
      id: targetId,
      warehouseId: form.warehouseId,
      code: cleanCode,
      name: form.name.trim(),
      capacity: Number(form.capacity),
      rentalUnit: form.rentalUnit,
      type: form.type,
      status: form.status,
      location: form.location,
      note: form.note,
      map: existing?.map ?? { 
        floor: 1, 
        row: Number(form.mapRow), 
        col: Number(form.mapCol), 
        rowSpan: Number(form.mapRowSpan), 
        colSpan: Number(form.mapColSpan) 
      },
    };
    setAreas((prev) =>
      prev.some((a) => a.id === targetId || a.code === cleanCode)
        ? prev.map((a) => (a.id === targetId || a.code === cleanCode ? next : a))
        : [...prev, next]
    );
    setOpen(false);
    setForm(emptyForm);
    setEditingId(null);
    setError(null);
    alert(`✅ Đã cập nhật thông tin và ghi chú cho ô kho ${next.code} thành công!`);
  }

  function moThem() {
    setEditingId(null);
    const aNums = areas
      .filter((a) => a.code.startsWith('A'))
      .map((a) => parseInt(a.code.replace('A', ''), 10))
      .filter((n) => !isNaN(n));
    const nextANum = aNums.length > 0 ? Math.min(10, Math.max(...aNums) + 1) : 5;
    const nextCode = `A${nextANum}`;
    const autoMapRow = String((nextANum - 1) * 2 + 1);

    setForm({
      ...emptyForm,
      code: nextCode,
      name: `Dãy ${nextCode}`,
      capacity: '60',
      location: 'Dãy A',
      mapCol: '1',
      mapRow: autoMapRow,
    });
    setError(null);
    setOpen(true);
  }

  function moSua(area: Area) {
    setEditingId(area.id);
    setForm({ 
      warehouseId: area.warehouseId, 
      code: area.code, 
      name: area.name, 
      capacity: String(area.capacity), 
      rentalUnit: area.rentalUnit,
      type: area.type,
      status: area.status,
      location: area.location, 
      note: area.note ?? '',
      mapRow: String(area.map.row),
      mapCol: String(area.map.col),
      mapRowSpan: String(area.map.rowSpan ?? 1),
      mapColSpan: String(area.map.colSpan ?? 1),
    });
    setError(null);
    setOpen(true);
  }

  function xoa(area: Area) {
    if (!window.confirm(`Xóa khu vực ${area.code}? Thao tác này chỉ thay đổi dữ liệu đang mở trên giao diện.`)) return;
    setAreas((prev) => prev.filter((item) => item.id !== area.id));
    if (selectedId === area.id) setSelectedId(null);
  }

  function xuatDanhSach() {
    xuatCsv('danh-sach-khu-vuc-kho', ['Mã khu vực', 'Tên khu vực', 'Sức chứa / Số lượng', 'Đơn vị tính', 'Vị trí', 'Trạng thái'], filtered.map((area) => [area.code, area.name, area.capacity, area.rentalUnit, area.location, area.status]));
  }

  return (
    <div className="stack">


      <div className="panel">
        <div className="panel-bd">
          <BanDoKho
            areas={areas}
            mode="xem"
            selectedId={selectedId}
            onSelect={(a) => {
              setSelectedId(a.id);
              if (a.status === 'LoiChoXacNhan') {
                scrollToApproval();
              }
            }}
            onLegendLoiClick={scrollToApproval}
            title="Bản đồ kho — xem trạng thái ô thuê"
          />
          {selectedId && (() => {
            const selected = areas.find((area) => area.id === selectedId);
            if (!selected) return null;

            const pendingReq = statusRequests.find(
              (r) => (r.areaId === selected.id || r.areaCode === selected.code) && r.status === 'ChoDuyet'
            );

            if (selected.status === 'LoiChoXacNhan' || pendingReq) {
              return (
                <div
                  className="ban-do-kho__quick-action"
                  style={{
                    background: '#fef2f2',
                    border: '1px solid #fca5a5',
                    borderRadius: 8,
                    padding: 14,
                    marginTop: 12,
                  }}
                >
                  <div style={{ fontWeight: 700, color: '#991b1b', fontSize: '0.95rem' }}>
                    ⚠️ Kho {selected.code} — {selected.name}: Đang có báo lỗi từ Nhân viên kho (Chờ Admin duyệt)
                  </div>
                  {pendingReq && (
                    <div style={{ color: '#7f1d1d', margin: '6px 0 10px 0', fontSize: '0.88rem' }}>
                      <strong>Lý do báo lỗi:</strong> {pendingReq.reason} (Gửi bởi {pendingReq.requestedBy})
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button
                      className="btn btn-success"
                      onClick={async () => {
                        const reqId = pendingReq ? pendingReq.id : selected.id;
                        await xuLyYeuCauTrangThai(reqId, 'approve', 'Hoàng Thu Huyền (Admin)');
                        alert(`✅ Đã phê duyệt chuyển kho ${selected.code} sang Bảo trì thành công!`);
                        const saved = localStorage.getItem('mock_areas');
                        if (saved) setAreasState(JSON.parse(saved));
                        reloadStatusRequests();
                      }}
                    >
                      ✅ Phê duyệt bảo trì kho {selected.code}
                    </button>
                    <button
                      className="btn btn-danger"
                      onClick={async () => {
                        const reqId = pendingReq ? pendingReq.id : selected.id;
                        await xuLyYeuCauTrangThai(reqId, 'reject', 'Hoàng Thu Huyền (Admin)');
                        alert(`❌ Đã từ chối yêu cầu cho kho ${selected.code}. Kho được khôi phục trạng thái ban đầu.`);
                        const saved = localStorage.getItem('mock_areas');
                        if (saved) setAreasState(JSON.parse(saved));
                        reloadStatusRequests();
                      }}
                    >
                      ❌ Từ chối yêu cầu
                    </button>
                    <button
                      className="btn btn-secondary"
                      onClick={scrollToApproval}
                      style={{ background: '#ffffff', color: '#1e293b', border: '1px solid #cbd5e1' }}
                    >
                      👇 Xem & Duyệt ở Bảng dưới
                    </button>
                  </div>
                </div>
              );
            }

            return (
              <div className="ban-do-kho__quick-action">
                <span>
                  {selected.status === 'Trong'
                    ? `Đã chọn ${selected.code}. Bạn có thể tạo hợp đồng, sửa hoặc xóa khu vực kho này.`
                    : `${selected.code} hiện trạng thái: ${areaStatusLabel[selected.status] || selected.status}.`}
                </span>
                <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                  {selected.status === 'Trong' && (
                    <button className="btn btn-primary btn-sm" onClick={() => navigate('/admin/contracts', { state: { areaId: selected.id, openCreate: true } })}>
                      Tạo hợp đồng
                    </button>
                  )}
                  <button className="btn btn-secondary btn-sm" onClick={() => moSua(selected)}>
                    ✏️ Sửa / Đổi trạng thái {selected.code}
                  </button>
                  <button className="btn btn-danger btn-sm" onClick={() => xoa(selected)}>
                    🗑️ Xóa khu vực {selected.code}
                  </button>
                  <button className="btn btn-success btn-sm" onClick={moThem}>
                    ➕ Thêm khu vực mới
                  </button>
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      <div className="toolbar">
        <div className="toolbar-left">
          <select
            className="filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as AreaStatus | 'All')}
          >
            <option value="All">Tất cả trạng thái</option>
            <option value="Trong">Đang trống</option>
            <option value="DaThue">Đang cho thuê</option>
            <option value="BaoTri">Đang bảo dưỡng</option>
          </select>
        </div>
        <div className="toolbar-right" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button className="btn btn-secondary" onClick={xuatDanhSach}>
            <Download size={16} /> Xuất Excel
          </button>
          <button className="btn btn-primary" onClick={moThem}>
            <Plus size={16} /> Thêm khu vực mới
          </button>
          {selectedId && (() => {
            const selected = areas.find((a) => a.id === selectedId);
            if (!selected) return null;
            return (
              <>
                <button className="btn btn-secondary" onClick={() => moSua(selected)}>
                  <Pencil size={16} /> Sửa ({selected.code})
                </button>
                <button className="btn btn-danger" onClick={() => xoa(selected)}>
                  <Trash2 size={16} /> Xóa ({selected.code})
                </button>
              </>
            );
          })()}
        </div>
      </div>

      <div className="panel">
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Mã KV</th>
                <th>Tên khu vực</th>
                <th>Sức chứa</th>
                <th>Vị trí</th>
                <th style={{ textAlign: 'center' }}>Trạng thái</th>
                <th style={{ textAlign: 'center' }}>Ghi chú</th>
                <th style={{ textAlign: 'center' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => (
                <tr
                  key={a.id}
                  onClick={() => setSelectedId(a.id)}
                  style={{ cursor: 'pointer', background: selectedId === a.id ? '#f0f7f4' : undefined }}
                >
                  <td><strong>{a.code}</strong></td>
                  <td>{a.name}</td>
                  <td>{a.capacity} {a.rentalUnit}</td>
                  <td>{a.location}</td>
                  <td style={{ textAlign: 'center' }}>
                    <NhanTrangThaiKhuVuc status={a.status} />
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    {a.note ? (
                      <span
                        style={{
                          background: '#fef3c7',
                          color: '#92400e',
                          border: '1px solid #fde68a',
                          borderRadius: '12px',
                          padding: '3px 10px',
                          fontSize: '0.78rem',
                          fontWeight: 600,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          boxShadow: '0 1px 2px rgba(180, 83, 9, 0.05)'
                        }}
                      >
                        📝 {a.note}
                      </span>
                    ) : (
                      <span style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>-</span>
                    )}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <div className="actions" style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                      <button
                        className="btn btn-secondary btn-sm"
                        title={`Sửa ${a.code}`}
                        onClick={(event) => { event.stopPropagation(); moSua(a); }}
                      >
                        <Pencil size={14} /> Sửa
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        title={`Xóa ${a.code}`}
                        onClick={(event) => { event.stopPropagation(); xoa(a); }}
                      >
                        <Trash2 size={14} /> Xóa
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="pagination">
          <span>
            Hiển thị 1–{filtered.length} / {filtered.length} khu vực
          </span>
          <span>Đơn giá tham chiếu: Kệ {formatMoney(150000)}/m²</span>
        </div>
      </div>

      <HopThoai
        open={open}
        title={editingId ? 'Cập nhật khu vực kho' : 'Thêm khu vực kho'}
          onClose={() => {
            setOpen(false);
            setEditingId(null);
            setError(null);
        }}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setOpen(false)}>
              Hủy
            </button>
            <button className="btn btn-primary" onClick={save}>
              Lưu
            </button>
          </>
        }
      >
        {error && <div className="error-box">{error}</div>}
        <div className="field">
          <label>
            Kho <span className="req">*</span>
          </label>
          <select value={form.warehouseId} onChange={(e) => setForm({ ...form, warehouseId: e.target.value })}>
            {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
          </select>
        </div>
        <div className="field">
          <label>
            Mã khu vực <span className="req">*</span>
          </label>
          <input
            value={form.code}
            onChange={(e) => setForm({ ...form, code: e.target.value })}
            placeholder="VD: A5"
          />
        </div>
        <div className="field">
          <label>
            Tên khu vực <span className="req">*</span>
          </label>
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="VD: Dãy A5"
          />
        </div>
        <div className="field-row">
          <div className="field">
            <label>
              Sức chứa / Số lượng <span className="req">*</span>
            </label>
            <input
              type="number"
              value={form.capacity}
              onChange={(e) => setForm({ ...form, capacity: e.target.value })}
              placeholder="100"
            />
          </div>
          <div className="field">
            <label>
              Đơn vị tính <span className="req">*</span>
            </label>
            <select value={form.rentalUnit} onChange={(e) => setForm({ ...form, rentalUnit: e.target.value as RentalUnit })} disabled>
              <option value="Pallet">Pallet</option>
            </select>
          </div>
          <div className="field">
            <label>Trạng thái</label>
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as AreaStatus })}>
              <option value="Trong">Đang trống</option>
              <option value="DaThue">Đang cho thuê</option>
              <option value="BaoTri">Đang bảo dưỡng</option>
            </select>
          </div>
        </div>
        <div className="field-row">
          <div className="field">
            <label>Cột bản đồ (Dãy)</label>
            <select
              value={form.mapCol}
              onChange={(e) => {
                const col = e.target.value;
                const letter = col === '1' ? 'A' : col === '4' ? 'B' : col === '7' ? 'C' : 'D';
                const colAreas = areas.filter((a) => a.code.startsWith(letter));
                const nums = colAreas.map((a) => parseInt(a.code.replace(letter, ''), 10)).filter((n) => !isNaN(n));
                const nextNum = nums.length > 0 ? Math.min(10, Math.max(...nums) + 1) : 1;
                const newCode = `${letter}${nextNum}`;
                const autoRow = String((nextNum - 1) * 2 + 1);
                setForm({
                  ...form,
                  mapCol: col,
                  code: newCode,
                  name: `Dãy ${newCode}`,
                  location: `Dãy ${letter}`,
                  mapRow: autoRow,
                });
              }}
            >
              <option value="1">Dãy A (Ngoài cùng trái)</option>
              <option value="4">Dãy B (Giữa trái)</option>
              <option value="7">Dãy C (Giữa phải)</option>
              <option value="10">Dãy D (Ngoài cùng phải)</option>
            </select>
          </div>
          <div className="field">
            <label>Hàng từ trên xuống</label>
            <select value={form.mapRow} onChange={(e) => setForm({ ...form, mapRow: e.target.value })}>
              {Array.from({ length: 10 }).map((_, idx) => {
                const rowVal = String(idx * 2 + 1);
                return (
                  <option key={rowVal} value={rowVal}>
                    Hàng {idx + 1} {idx === 0 ? '(Trên cùng)' : idx === 9 ? '(Max A10/B10/C10/D10)' : ''}
                  </option>
                );
              })}
            </select>
          </div>
        </div>
        <div className="field">
          <label>Vị trí</label>
          <input
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
            placeholder="VD: Dãy A"
          />
        </div>
        <div className="field">
          <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Ghi chú</span>
            <span style={{ fontSize: '0.8rem', color: (form.note || '').length >= 200 ? '#b91c1c' : 'var(--muted)' }}>
              {(form.note || '').length}/200 ký tự
            </span>
          </label>
          <textarea
            rows={3}
            maxLength={200}
            value={form.note}
            onChange={(e) => setForm({ ...form, note: e.target.value })}
            placeholder="Nhập ghi chú ngắn về khu vực (tối đa 200 ký tự)..."
          />
        </div>
      </HopThoai>

      {/* Bảng quản lý và phê duyệt yêu cầu cập nhật trạng thái kho từ nhân viên */}
      <div ref={approvalSectionRef}>
        <BangYeuCauTrangThaiKho
          mode="admin"
          areas={areas}
          onAreaStatusUpdated={() => {
            const saved = localStorage.getItem('mock_areas');
            if (saved) {
              setAreasState(JSON.parse(saved));
            }
            reloadStatusRequests();
          }}
        />
      </div>
    </div>
  );
}
