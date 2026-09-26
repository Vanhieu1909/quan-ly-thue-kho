import { useState, useEffect } from 'react';
import { Pencil, Plus } from 'lucide-react';
import { priceTable as seed, accounts as seedAccounts } from '../../du-lieu/duLieuMau';
import type { Account, AreaType, PriceRow } from '../../kieu';
import { areaTypeLabel, formatDate, formatMoney, roleLabel, getVatRate } from '../../thu-vien/dinhDang';
import { HopThoai } from '../../thanh-phan/HopThoai';

export function CaiDatHeThong() {
  const [tab, setTab] = useState<'price' | 'roles'>('price');
  const [prices, setPrices] = useState<PriceRow[]>(() => {
    const raw = localStorage.getItem('mock_prices');
    return raw ? JSON.parse(raw) : seed;
  });
  const [userAccounts, setUserAccounts] = useState<Account[]>(() => {
    const raw = localStorage.getItem('mock_accounts');
    return raw ? JSON.parse(raw) : seedAccounts;
  });

  const [vatRate, setVatRateState] = useState<number>(() => getVatRate());

  const [openModal, setOpenModal] = useState(false);
  const [editingItem, setEditingItem] = useState<PriceRow | null>(null);
  const [form, setForm] = useState({
    type: 'Ke' as AreaType,
    unitPrice: 120000,
    unit: 'đồng/Pallet/tháng',
    effectiveFrom: '2026-01-01',
  });

  useEffect(() => {
    const rawAcc = localStorage.getItem('mock_accounts');
    if (rawAcc) setUserAccounts(JSON.parse(rawAcc));
    const rawPrices = localStorage.getItem('mock_prices');
    if (rawPrices) setPrices(JSON.parse(rawPrices));
    setVatRateState(getVatRate());
  }, []);

  function handleSaveVat(newRate: number) {
    setVatRateState(newRate);
    localStorage.setItem('mock_vat_rate', String(newRate));
    window.dispatchEvent(new Event('storage'));
    alert(`✅ Đã cập nhật mức thuế GTGT (VAT) hệ thống thành ${Math.round(newRate * 100)}%!`);
  }

  function handleOpenAdd() {
    setEditingItem(null);
    setForm({
      type: 'Ke',
      unitPrice: 120000,
      unit: 'đồng/Pallet/tháng',
      effectiveFrom: new Date().toISOString().split('T')[0],
    });
    setOpenModal(true);
  }

  function handleOpenEdit(p: PriceRow) {
    setEditingItem(p);
    setForm({
      type: p.type,
      unitPrice: p.unitPrice,
      unit: p.unit,
      effectiveFrom: p.effectiveFrom,
    });
    setOpenModal(true);
  }

  function handleSavePrice() {
    let updated: PriceRow[];
    if (editingItem) {
      updated = prices.map((p) =>
        p.id === editingItem.id
          ? { ...p, type: form.type, unitPrice: Number(form.unitPrice), unit: form.unit, effectiveFrom: form.effectiveFrom }
          : p
      );
    } else {
      const newRow: PriceRow = {
        id: `p_${Date.now()}`,
        type: form.type,
        unitPrice: Number(form.unitPrice),
        unit: form.unit,
        effectiveFrom: form.effectiveFrom,
        status: 'DangApDung',
      };
      updated = [...prices, newRow];
    }
    setPrices(updated);
    localStorage.setItem('mock_prices', JSON.stringify(updated));
    window.dispatchEvent(new Event('storage'));
    setOpenModal(false);
  }

  return (
    <div>
      <div className="tabs">
        <button className={`tab${tab === 'price' ? ' active' : ''}`} onClick={() => setTab('price')}>
          Bảng giá thuê kho
        </button>
        <button className={`tab${tab === 'roles' ? ' active' : ''}`} onClick={() => setTab('roles')}>
          Phân quyền người dùng
        </button>
      </div>

      {tab === 'price' && (
        <>
          <div className="panel">
            <div className="panel-hd">
              <h2>Bảng giá theo loại khu vực</h2>
              <button className="btn btn-primary btn-sm" onClick={handleOpenAdd}>
                <Plus size={14} /> Thêm mức giá
              </button>
            </div>
            <div className="table-wrap">
              <table className="data">
                <thead>
                  <tr>
                    <th>Loại khu vực</th>
                    <th>Đơn giá</th>
                    <th>Đơn vị tính</th>
                    <th>Áp dụng từ</th>
                    <th>Trạng thái</th>
                    <th style={{ textAlign: 'center' }}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {prices.map((p) => (
                    <tr key={p.id}>
                      <td><strong>{areaTypeLabel[p.type]}</strong></td>
                      <td style={{ fontWeight: 600, color: 'var(--primary)' }}>{formatMoney(p.unitPrice)}</td>
                      <td>{p.unit}</td>
                      <td>{formatDate(p.effectiveFrom)}</td>
                      <td>
                        <span className="badge badge-ok">Đang áp dụng</span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleOpenEdit(p)}
                          title="Chỉnh sửa đơn giá"
                        >
                          <Pencil size={14} /> Sửa
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="panel" style={{ marginTop: 16 }}>
            <div className="panel-hd">
              <h2>Chính sách Thuế GTGT (VAT) hệ thống</h2>
            </div>
            <div className="panel-bd" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>
                  Mức thuế GTGT áp dụng hiện tại: <span style={{ color: 'var(--primary)', fontSize: '1.15rem', fontWeight: 700 }}>{Math.round(vatRate * 100)}%</span>
                </div>
                <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
                  Tự động áp dụng tính tiền Thuế GTGT cho tất cả hợp đồng, hóa đơn và báo cáo tài chính
                </span>
              </div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <button
                  className={`btn ${vatRate === 0.08 ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => handleSaveVat(0.08)}
                >
                  Mức 8% (Nghị định ưu đãi)
                </button>
                <button
                  className={`btn ${vatRate === 0.10 ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => handleSaveVat(0.10)}
                >
                  Mức 10% (Chuẩn)
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {tab === 'roles' && (
        <div className="panel">
          <div className="panel-hd">
            <h2>Tài khoản & quyền truy cập module</h2>
          </div>
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>Người dùng</th>
                  <th>Vai trò</th>
                  <th>KHO</th>
                  <th>KH</th>
                  <th>HĐ</th>
                  <th>KT</th>
                  <th>BC</th>
                  <th>CĐ</th>
                </tr>
              </thead>
              <tbody>
                {userAccounts
                  .filter((u) => u.role !== 'customer')
                  .map((u) => {
                    const full = u.role === 'admin';
                    const staff = u.role === 'staff';
                    const acc = u.role === 'accountant';
                    const cell = (on: boolean) => (on ? '✓' : '—');
                    return (
                      <tr key={u.id}>
                        <td>
                          <strong>{u.name}</strong>
                          <div style={{ color: 'var(--muted)', fontSize: '0.78rem' }}>{u.username}</div>
                        </td>
                        <td>{roleLabel[u.role]}</td>
                        <td>{cell(full || staff)}</td>
                        <td>{cell(full || staff)}</td>
                        <td>{cell(full || staff)}</td>
                        <td>{cell(full || acc)}</td>
                        <td>{cell(full || acc)}</td>
                        <td>{cell(full)}</td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
          <div className="panel-bd" style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>
            Module: KHO (khu vực), KH (khách hàng), HĐ (hợp đồng), KT (kế toán), BC (báo cáo), CĐ (cài đặt).
            Admin toàn quyền; nhân viên kho: KHO, KH, HĐ; kế toán: KT, BC.
          </div>
        </div>
      )}

      {/* Modal chỉnh sửa / thêm mức giá */}
      <HopThoai
        open={openModal}
        title={editingItem ? 'Chỉnh sửa mức giá' : 'Thêm mức giá thuê kho'}
        onClose={() => setOpenModal(false)}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setOpenModal(false)}>
              Hủy
            </button>
            <button className="btn btn-primary" onClick={handleSavePrice}>
              Lưu bảng giá
            </button>
          </>
        }
      >
        <div className="stack" style={{ gap: 14 }}>
          <div className="field">
            <label>Loại khu vực kho</label>
            <select
              className="filter-select"
              style={{ width: '100%' }}
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value as AreaType })}
            >
              <option value="Ke">Sàn kho chứa Pallet (Kệ chứa hàng)</option>
              <option value="Treo">Sàn kho tiêu chuẩn</option>
              <option value="KeVIP">Sàn kho đặc biệt</option>
            </select>
          </div>

          <div className="field-row">
            <div className="field">
              <label>Đơn giá (VNĐ)</label>
              <input
                type="number"
                step="5000"
                value={form.unitPrice}
                onChange={(e) => setForm({ ...form, unitPrice: Number(e.target.value) })}
                placeholder="VD: 120000"
              />
            </div>
            <div className="field">
              <label>Đơn vị tính</label>
              <select
                className="filter-select"
                style={{ width: '100%' }}
                value={form.unit}
                onChange={(e) => setForm({ ...form, unit: e.target.value })}
              >
                <option value="đồng/Pallet/tháng">đồng/Pallet/tháng</option>
                <option value="đồng/m²/tháng">đồng/m²/tháng</option>
                <option value="đồng/thùng/tháng">đồng/thùng/tháng</option>
              </select>
            </div>
          </div>

          <div className="field">
            <label>Áp dụng từ ngày</label>
            <input
              type="date"
              value={form.effectiveFrom}
              onChange={(e) => setForm({ ...form, effectiveFrom: e.target.value })}
            />
          </div>
        </div>
      </HopThoai>
    </div>
  );
}
