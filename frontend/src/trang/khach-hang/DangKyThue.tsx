import { useState, useEffect } from 'react';
import { warehouses as seedWarehouses, areas as seedAreas } from '../../du-lieu/duLieuMau';
import type { Area, AreaType } from '../../kieu';
import { BanDoKho } from '../../thanh-phan/BanDoKho';
import { dungXacThuc } from '../../boi-canh/BoiCanhXacThuc';
import { luuYeuCau, taiYeuCau } from '../../du-lieu/yeuCauLocal';

export function DangKyThue() {
  const { account } = dungXacThuc();
  const [areas, setAreas] = useState<Area[]>(seedAreas);
  const [warehouses] = useState(seedWarehouses);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>('w1');
  const [selectedList, setSelectedList] = useState<Area[]>([]);
  const [form, setForm] = useState({ requestedCapacity: '', rentalUnit: 'Pallet' as any, preferredType: 'Ke' as AreaType, startDate: '', endDate: '', duration: 1, note: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sent, setSent] = useState(false);

  useEffect(() => {
    const local = localStorage.getItem('mock_areas');
    if (local) {
      setAreas(JSON.parse(local));
    }
  }, []);

  function chonKhuVuc(area: Area) {
    setSelectedList(prev => {
      // Toggle logic
      const isSelected = prev.some(a => a.id === area.id);
      const newList = isSelected ? prev.filter(a => a.id !== area.id) : [...prev, area];
      
      // Update form capacity
      const totalCapacity = newList.reduce((sum, a) => sum + a.capacity, 0);
      const unit = newList.length > 0 ? newList[0].rentalUnit : 'Pallet';
      const type = newList.length > 0 ? newList[0].type : 'Ke';
      
      setForm(current => ({ 
        ...current, 
        requestedCapacity: totalCapacity > 0 ? String(totalCapacity) : '', 
        rentalUnit: unit, 
        preferredType: type 
      }));
      setErrors(e => ({ ...e, requestedCapacity: '' }));
      return newList;
    });
  }

  function guiYeuCau() {
    const newErrors: Record<string, string> = {};
    if (!form.requestedCapacity) newErrors.requestedCapacity = 'Vui lòng nhập sức chứa/số lượng';
    if (!form.startDate) newErrors.startDate = 'Vui lòng chọn ngày bắt đầu thuê';
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const rows = taiYeuCau();
    const note = selectedList.length > 1 
      ? `[Thuê nhiều khu vực: ${selectedList.map(a => a.code).join(', ')}] ` + form.note 
      : form.note;
    
    luuYeuCau([{ 
      id: `r${Date.now()}`, 
      code: `YC${String(rows.length + 1).padStart(3, '0')}`, 
      customerId: account?.customerId,
      customerName: account?.name ?? 'Khách hàng', 
      phone: account?.phone ?? '', 
      email: account?.email ?? '', 
      requestedCapacity: Number(form.requestedCapacity), 
      rentalUnit: form.rentalUnit, 
      preferredType: form.preferredType, 
      areaId: selectedList[0]?.id, 
      areaIds: selectedList.map(a => a.id),
      startDate: form.startDate, 
      endDate: form.endDate, 
      specialRequest: note || undefined, 
      date: new Date().toISOString().slice(0, 10), 
      status: 'Moi' 
    }, ...rows]);
    window.dispatchEvent(new Event('storage'));
    setSent(true);
  }

  if (sent) {
    return <div className="summary-box"><strong>Đã gửi yêu cầu thuê.</strong> Nhân viên kho sẽ tiếp nhận trước, sau đó quản trị viên phê duyệt và phản hồi cho bạn.</div>;
  }

  const areasInWarehouse = areas.filter(a => a.warehouseId === selectedWarehouseId);

  return (
    <div className="stack">
      <div className="toolbar">
        <div className="toolbar-left">
          <select
            className="filter-select"
            value={selectedWarehouseId}
            onChange={(e) => {
              setSelectedWarehouseId(e.target.value);
              setSelectedList([]);
              setForm(f => ({ ...f, requestedCapacity: '' }));
            }}
          >
            {warehouses.map(w => (
              <option key={w.id} value={w.id}>{w.name}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="panel"><div className="panel-bd">
        <BanDoKho 
          areas={areasInWarehouse} 
          mode="chon-thue" 
          choPhepChon={['Trong']} 
          selectedIds={selectedList.map(a => a.id)} 
          onSelect={chonKhuVuc} 
          title="Chọn mặt bằng còn trống trên bản đồ (có thể chọn nhiều ô)" 
        />
      </div></div>
      <div className="panel"><div className="panel-hd"><h2>Đăng ký thuê mặt bằng</h2></div><div className="panel-bd stack">
          <div className="field-row">
            <div className="field">
              <label>Sức chứa / Số lượng *</label>
              <input 
                type="number" 
                value={form.requestedCapacity} 
                onChange={(event) => {
                  setForm({ ...form, requestedCapacity: event.target.value });
                  if (event.target.value) setErrors(e => ({ ...e, requestedCapacity: '' }));
                }} 
                style={{ borderColor: errors.requestedCapacity ? 'var(--danger)' : undefined }}
              />
              {errors.requestedCapacity && <span style={{ color: 'var(--danger)', fontSize: '0.85rem' }}>{errors.requestedCapacity}</span>}
            </div>
            <div className="field">
              <label>Đơn vị tính</label>
              <select value={form.rentalUnit} onChange={(event) => setForm({ ...form, rentalUnit: event.target.value as any })} disabled>
                <option value="Pallet">Pallet</option>
              </select>
            </div>
            {/* Loại khu vực đã bị ẩn */}
          </div>
          <div className="field-row">
            <div className="field">
              <label>Ngày bắt đầu *</label>
              <input 
                type="date" 
                value={form.startDate} 
                style={{ borderColor: errors.startDate ? 'var(--danger)' : undefined }}
                onChange={(e) => {
                  const s = e.target.value;
                  if (s) setErrors(err => ({ ...err, startDate: '' }));
                  if (!s) return setForm({ ...form, startDate: s, endDate: '' });
                  const d = new Date(s);
                  d.setMonth(d.getMonth() + form.duration);
                  setForm({ ...form, startDate: s, endDate: d.toISOString().slice(0, 10) });
                }} 
              />
              {errors.startDate && <span style={{ color: 'var(--danger)', fontSize: '0.85rem' }}>{errors.startDate}</span>}
            </div>
            <div className="field">
              <label>Thời hạn thuê *</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <select 
                  style={{ flex: 1 }}
                  value={form.duration} 
                  onChange={(e) => {
                    const m = Number(e.target.value);
                    if (!form.startDate) return setForm({ ...form, duration: m });
                    const d = new Date(form.startDate);
                    d.setMonth(d.getMonth() + m);
                    setForm({ ...form, duration: m, endDate: d.toISOString().slice(0, 10) });
                  }}
                >
                  <option value={1}>1 tháng</option>
                  <option value={3}>3 tháng</option>
                  <option value={6}>6 tháng</option>
                  <option value={12}>12 tháng (1 năm)</option>
                  <option value={24}>24 tháng (2 năm)</option>
                </select>
              </div>
            </div>
          </div>
          {form.endDate && (
            <div className="field">
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                → Ngày kết thúc dự kiến: <strong>{form.endDate.split('-').reverse().join('/')}</strong>
              </span>
            </div>
          )}
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
              onChange={(event) => setForm({ ...form, note: event.target.value })}
              placeholder="Yêu cầu về vị trí, điều hòa... (tối đa 200 ký tự)"
            />
          </div>
          <div>
            <button className="btn btn-primary" onClick={guiYeuCau}>Gửi yêu cầu thuê</button>
          </div>
      </div></div>
    </div>
  );
}
