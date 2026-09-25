import { useState, useEffect } from 'react';
import { priceTable as seed, accounts as seedAccounts } from '../../du-lieu/duLieuMau';
import type { Account, PriceRow } from '../../kieu';
import { areaTypeLabel, formatDate, formatMoney, roleLabel } from '../../thu-vien/dinhDang';

export function CaiDatHeThong() {
  const [tab, setTab] = useState<'price' | 'roles'>('price');
  const [prices] = useState<PriceRow[]>(seed);
  const [userAccounts, setUserAccounts] = useState<Account[]>(() => {
    const raw = localStorage.getItem('mock_accounts');
    return raw ? JSON.parse(raw) : seedAccounts;
  });

  useEffect(() => {
    const raw = localStorage.getItem('mock_accounts');
    if (raw) setUserAccounts(JSON.parse(raw));
  }, []);

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
        <div className="panel">
          <div className="panel-hd">
            <h2>Bảng giá theo loại khu vực</h2>
            <button className="btn btn-primary btn-sm">+ Thêm mức giá</button>
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
                </tr>
              </thead>
              <tbody>
                {prices.map((p) => (
                  <tr key={p.id}>
                    <td>{areaTypeLabel[p.type]}</td>
                    <td>{formatMoney(p.unitPrice)}</td>
                    <td>{p.unit}</td>
                    <td>{formatDate(p.effectiveFrom)}</td>
                    <td>
                      <span className="badge badge-ok">Đang áp dụng</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
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
    </div>
  );
}
