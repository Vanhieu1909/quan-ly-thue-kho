import { useState } from 'react';
import { Plus, Download } from 'lucide-react';
import { customers as seedCustomers, transactions as seed } from '../../du-lieu/duLieuMau';
import type { Customer, Transaction } from '../../kieu';
import { formatDate, formatMoney } from '../../thu-vien/dinhDang';
import { HopThoai } from '../../thanh-phan/HopThoai';
import { xuatCsv } from '../../thu-vien/xuatCsv';

const categoryLabel: Record<string, string> = {
  DienNuoc: 'Điện nước',
  BaoTri: 'Bảo trì',
  BaoVe: 'Bảo vệ',
  VeSinh: 'Vệ sinh',
  NhanCong: 'Nhân công',
  Khac: 'Khác',
};

export function ThuChi() {
  const [rows, setRows] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('mock_transactions');
    return saved ? JSON.parse(saved) : seed;
  });
  const [customers] = useState<Customer[]>(() => {
    const saved = localStorage.getItem('mock_customers');
    return saved ? JSON.parse(saved) : seedCustomers;
  });
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    category: 'DienNuoc',
    amount: '',
    content: '',
    method: 'ChuyenKhoan',
  });

  const thu = rows.filter((t) => t.type === 'Thu' && t.status === 'XacNhan').reduce((s, t) => s + t.amount, 0);
  const chi = rows.filter((t) => t.type === 'Chi' && t.status === 'XacNhan').reduce((s, t) => s + t.amount, 0);

  function save() {
    if (!form.amount || !form.content) {
      alert('Vui lòng nhập đầy đủ số tiền và nội dung!');
      return;
    }
    const next: Transaction = {
      id: `t${Date.now()}`,
      date: form.date,
      type: 'Chi',
      category: form.category,
      amount: Number(form.amount),
      method: form.method,
      content: form.content,
      status: 'XacNhan',
    };
    setRows((p) => {
      const updated = [next, ...p];
      localStorage.setItem('mock_transactions', JSON.stringify(updated));
      return updated;
    });
    setForm({ date: new Date().toISOString().slice(0, 10), category: 'DienNuoc', amount: '', content: '', method: 'ChuyenKhoan' });
    setOpen(false);
  }

  function xuatBaoCao() {
    xuatCsv(
      'bao-cao-thu-chi',
      ['Ngày', 'Loại', 'Danh mục', 'Số tiền', 'Nội dung', 'PTTT'],
      rows.map((t) => [formatDate(t.date), t.type, categoryLabel[t.category] ?? t.category, t.amount, t.content, t.method])
    );
  }

  const thuRows = rows.filter((t) => t.type === 'Thu');
  const chiRows = rows.filter((t) => t.type === 'Chi');

  return (
    <div className="stack">
      <div className="stats">
        <div className="stat-card ok">
          <div className="label">Tổng thu</div>
          <div className="value" style={{ fontSize: '1.3rem' }}>{formatMoney(thu)}</div>
        </div>
        <div className="stat-card warn">
          <div className="label">Tổng chi</div>
          <div className="value" style={{ fontSize: '1.3rem' }}>{formatMoney(chi)}</div>
        </div>
        <div className="stat-card">
          <div className="label">Chênh lệch</div>
          <div className="value" style={{ fontSize: '1.3rem', color: thu - chi >= 0 ? 'var(--ok)' : 'var(--danger)' }}>{formatMoney(thu - chi)}</div>
        </div>
      </div>

      <div className="toolbar">
        <div />
        <div className="toolbar-right">
          <button className="btn btn-secondary" onClick={xuatBaoCao}>
            <Download size={16} /> Xuất
          </button>
          <button className="btn btn-primary" onClick={() => setOpen(true)}>
            <Plus size={16} /> Thêm phiếu chi
          </button>
        </div>
      </div>

      <div className="grid-2 equal">
        <div className="panel">
          <div className="panel-hd">
            <h2>Khoản thu</h2>
            <span style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>{thuRows.length} giao dịch</span>
          </div>
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>Ngày</th>
                  <th>Nội dung</th>
                  <th>Khách hàng</th>
                  <th style={{ textAlign: 'right' }}>Số tiền</th>
                </tr>
              </thead>
              <tbody>
                {thuRows.map((t) => (
                  <tr key={t.id}>
                    <td>{formatDate(t.date)}</td>
                    <td>{t.content}</td>
                    <td>{customers.find((c) => c.id === t.customerId)?.name || '—'}</td>
                    <td style={{ textAlign: 'right', color: 'var(--ok)', fontWeight: 600 }}>{formatMoney(t.amount)}</td>
                  </tr>
                ))}
                {thuRows.length === 0 && (
                  <tr>
                    <td colSpan={4}>
                      <div className="empty">Chưa có khoản thu. Khoản thu được ghi nhận tự động khi khách hàng thanh toán hóa đơn.</div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="panel">
          <div className="panel-hd">
            <h2>Khoản chi</h2>
            <span style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>{chiRows.length} giao dịch</span>
          </div>
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>Ngày</th>
                  <th>Nội dung</th>
                  <th>Loại</th>
                  <th style={{ textAlign: 'right' }}>Số tiền</th>
                </tr>
              </thead>
              <tbody>
                {chiRows.map((t) => (
                  <tr key={t.id}>
                    <td>{formatDate(t.date)}</td>
                    <td>{t.content}</td>
                    <td>{categoryLabel[t.category] ?? t.category}</td>
                    <td style={{ textAlign: 'right', color: 'var(--danger)', fontWeight: 600 }}>{formatMoney(t.amount)}</td>
                  </tr>
                ))}
                {chiRows.length === 0 && (
                  <tr>
                    <td colSpan={4}>
                      <div className="empty">Chưa có khoản chi. Bấm "+ Thêm phiếu chi" để ghi nhận.</div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <HopThoai
        open={open}
        title="Thêm phiếu chi"
        onClose={() => setOpen(false)}
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
        <div className="field-row">
          <div className="field">
            <label>Ngày chi</label>
            <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          </div>
          <div className="field">
            <label>Loại chi phí</label>
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              <option value="DienNuoc">Điện nước</option>
              <option value="BaoTri">Bảo trì</option>
              <option value="BaoVe">Bảo vệ</option>
              <option value="VeSinh">Vệ sinh</option>
              <option value="NhanCong">Nhân công</option>
              <option value="Khac">Khác</option>
            </select>
          </div>
        </div>
        <div className="field">
          <label>Số tiền <span className="req">*</span></label>
          <input type="number" min={0} placeholder="0" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
        </div>
        <div className="field">
          <label>Nội dung <span className="req">*</span></label>
          <input placeholder="Mô tả khoản chi..." value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} />
        </div>
        <div className="field">
          <label>Phương thức</label>
          <select value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value })}>
            <option value="ChuyenKhoan">Chuyển khoản</option>
            <option value="TienMat">Tiền mặt</option>
          </select>
        </div>
      </HopThoai>
    </div>
  );
}
