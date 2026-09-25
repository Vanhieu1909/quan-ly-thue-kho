import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, Plus, Pencil, Trash2 } from 'lucide-react';
import { areas as seedAreas, warehouses } from '../../du-lieu/duLieuMau';
import type { Area, AreaStatus, AreaType, RentalUnit } from '../../kieu';
import { NhanTrangThaiKhuVuc } from '../../thanh-phan/NhanTrangThai';
import { BanDoKho } from '../../thanh-phan/BanDoKho';
import { HopThoai } from '../../thanh-phan/HopThoai';
import { formatMoney } from '../../thu-vien/dinhDang';
import { xuatCsv } from '../../thu-vien/xuatCsv';

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

export function QuanLyKho() {
  const navigate = useNavigate();
  const [areas, setAreasState] = useState<Area[]>(() => {
    const saved = localStorage.getItem('mock_areas');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Auto-migrate to new grid layout or flexible unit layout.
      if (parsed.some((a: Area) => a.code.startsWith('KV-')) || (parsed.length > 0 && !parsed[0]?.capacity)) {
        localStorage.setItem('mock_areas', JSON.stringify(seedAreas));
        return seedAreas;
      }
      return parsed;
    }
    return seedAreas;
  });

  function setAreas(action: React.SetStateAction<Area[]>) {
    setAreasState((prev) => {
      const next = typeof action === 'function' ? action(prev) : action;
      localStorage.setItem('mock_areas', JSON.stringify(next));
      return next;
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
    const existing = areas.find((area) => area.id === editingId);
    const next: Area = {
      id: existing?.id ?? `a${Date.now()}`,
      warehouseId: form.warehouseId,
      code: form.code.trim(),
      name: form.name.trim(),
      capacity: Number(form.capacity),
      rentalUnit: form.rentalUnit,
      type: form.type,
      status: form.status,
      location: form.location,
      note: form.note,
      map: { 
        floor: 1, 
        row: Number(form.mapRow), 
        col: Number(form.mapCol), 
        rowSpan: Number(form.mapRowSpan), 
        colSpan: Number(form.mapColSpan) 
      },
    };
    setAreas((prev) => (existing ? prev.map((area) => (area.id === next.id ? next : area)) : [...prev, next]));
    setOpen(false);
    setForm(emptyForm);
    setEditingId(null);
    setError(null);
  }

  function moThem() {
    setEditingId(null);
    setForm({ ...emptyForm, code: `A${areas.length + 1}` });
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
            onSelect={(a) => setSelectedId(a.id)}
            title="Bản đồ kho — xem trạng thái ô thuê"
          />
          {selectedId && (() => {
            const selected = areas.find((area) => area.id === selectedId);
            if (!selected) return null;
            return (
              <div className="ban-do-kho__quick-action">
                <span>
                  {selected.status === 'Trong'
                    ? `Đã chọn ${selected.code}. Bạn có thể tạo hợp đồng hoặc bảo dưỡng.`
                    : `${selected.code} hiện trạng thái: ${selected.status === 'DaThue' ? 'Đang cho thuê' : 'Đang bảo dưỡng'}.`}
                </span>
                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                  {selected.status === 'Trong' && (
                    <button className="btn btn-primary btn-sm" onClick={() => navigate('/admin/contracts', { state: { areaId: selected.id, openCreate: true } })}>
                      Tạo hợp đồng
                    </button>
                  )}
                  <button className="btn btn-secondary btn-sm" onClick={() => moSua(selected)}>
                    Sửa / Đổi trạng thái
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
        <div className="toolbar-right">
          <button className="btn btn-secondary" onClick={xuatDanhSach}>
            <Download size={16} /> Xuất Excel
          </button>
          <button className="btn btn-primary" onClick={moThem}>
            <Plus size={16} /> Thêm khu vực
          </button>
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
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => (
                <tr
                  key={a.id}
                  onClick={() => setSelectedId(a.id)}
                  style={{ cursor: 'pointer', background: selectedId === a.id ? '#f0f7f4' : undefined }}
                >
                  <td>{a.code}</td>
                  <td>{a.name}</td>
                  <td>{a.capacity} {a.rentalUnit}</td>
                  <td>{a.location}</td>
                  <td>
                    <NhanTrangThaiKhuVuc status={a.status} />
                  </td>
                  <td>
                    <div className="actions">
                      <button className="btn btn-ghost btn-sm" title={`Sửa ${a.code}`} onClick={(event) => { event.stopPropagation(); moSua(a); }}>
                        <Pencil size={14} />
                      </button>
                      <button className="btn btn-ghost btn-sm" title={`Xóa ${a.code}`} onClick={(event) => { event.stopPropagation(); xoa(a); }}>
                        <Trash2 size={14} />
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
            <select value={form.mapCol} onChange={(e) => setForm({ ...form, mapCol: e.target.value })}>
              <option value="1">Dãy A (Ngoài cùng trái)</option>
              <option value="4">Dãy B (Giữa trái)</option>
              <option value="7">Dãy C (Giữa phải)</option>
              <option value="10">Dãy D (Ngoài cùng phải)</option>
            </select>
          </div>
          <div className="field">
            <label>Hàng từ trên xuống</label>
            <select value={form.mapRow} onChange={(e) => setForm({ ...form, mapRow: e.target.value })}>
              <option value="1">Hàng 1 (Trên cùng)</option>
              <option value="3">Hàng 2</option>
              <option value="5">Hàng 3</option>
              <option value="7">Hàng 4</option>
              <option value="9">Hàng 5 (Dưới cùng)</option>
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
          <label>Ghi chú</label>
          <textarea
            rows={3}
            value={form.note}
            onChange={(e) => setForm({ ...form, note: e.target.value })}
          />
        </div>
      </HopThoai>
    </div>
  );
}
