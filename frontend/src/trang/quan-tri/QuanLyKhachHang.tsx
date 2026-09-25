import { useMemo, useState, useEffect } from 'react';
import { Download, Plus, Pencil, Trash2 } from 'lucide-react';
import { customers as seed } from '../../du-lieu/duLieuMau';
import type { Customer, CustomerStatus, CustomerType } from '../../kieu';
import { customerStatusLabel, formatMoney } from '../../thu-vien/dinhDang';
import { HopThoai } from '../../thanh-phan/HopThoai';

export function QuanLyKhachHang() {
  const [rows, setRows] = useState<Customer[]>(seed);
  const [contracts, setContracts] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [typeFilter, setTypeFilter] = useState<CustomerType | 'All'>('All');
  const [statusFilter, setStatusFilter] = useState<CustomerStatus | 'All'>('All');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: '',
    type: 'DoanhNghiep' as CustomerType,
    phone: '',
    email: '',
    taxCode: '',
  });


  useEffect(() => {
    const lCust = localStorage.getItem('mock_customers');
    const lCont = localStorage.getItem('mock_contracts');
    const lInv = localStorage.getItem('mock_invoices');
    if (lCust) setRows(JSON.parse(lCust));
    if (lCont) setContracts(JSON.parse(lCont));
    if (lInv) setInvoices(JSON.parse(lInv));
  }, []);

  const enhancedRows = useMemo(() => {
    return rows.map(c => {
      // Calculate active rented capacity
      const activeContracts = contracts.filter(ct => ct.customerId === c.id && ct.status === 'DangHieuLuc');
      const capacityGroups = activeContracts.reduce((acc, ct) => {
        acc[ct.rentalUnit] = (acc[ct.rentalUnit] || 0) + Number(ct.capacity);
        return acc;
      }, {} as Record<string, number>);
      
      const rentedTexts = Object.entries(capacityGroups).map(([unit, val]) => `${val} ${unit}`);
      const rentedText = rentedTexts.length > 0 ? rentedTexts.join(', ') : '0 m²';
      
      // Calculate debt
      const custInvoices = invoices.filter(i => i.customerId === c.id);
      const totalDebt = custInvoices.reduce((sum, i) => sum + (i.total - (i.paidAmount || 0)), 0);
      
      return {
        ...c,
        displayRented: rentedText,
        displayDebt: totalDebt > 0 ? totalDebt : c.debt, // Fallback to seed debt if no invoices
        displayStatus: activeContracts.length > 0 ? 'DangThue' as const : 'NgungThue' as const
      };
    });
  }, [rows, contracts, invoices]);

  const filtered = useMemo(
    () =>
      enhancedRows.filter((c) => {
        if (typeFilter !== 'All' && c.type !== typeFilter) return false;
        if (statusFilter !== 'All' && c.displayStatus !== statusFilter) return false;
        return true;
      }),
    [enhancedRows, typeFilter, statusFilter],
  );

  function save() {
    if (!form.name || !form.phone) return;
    const next: Customer = {
      id: `c${Date.now()}`,
      code: `KH${String(rows.length + 1).padStart(3, '0')}`,
      name: form.name,
      type: form.type,
      phone: form.phone,
      email: form.email,
      taxCode: form.taxCode,
      rentedM2: 0,
      debt: 0,
      status: 'NgungThue',
    };
    const updated = [next, ...rows];
    setRows(updated);
    localStorage.setItem('mock_customers', JSON.stringify(updated));
    setOpen(false);
  }

  return (
    <div>
      <div className="toolbar">
        <div className="toolbar-left">
          <select className="filter-select" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as CustomerType | 'All')}>
            <option value="All">Loại khách hàng</option>
            <option value="CaNhan">Cá nhân</option>
            <option value="DoanhNghiep">Doanh nghiệp</option>
          </select>
          <select className="filter-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as CustomerStatus | 'All')}>
            <option value="All">Trạng thái</option>
            <option value="DangThue">Đang thuê</option>
            <option value="NgungThue">Ngưng thuê</option>
          </select>
        </div>
        <div className="toolbar-right">
          <button className="btn btn-secondary">
            <Download size={16} /> Xuất Excel
          </button>
          <button className="btn btn-primary" onClick={() => setOpen(true)}>
            <Plus size={16} /> Thêm khách hàng
          </button>
        </div>
      </div>

      <div className="panel">
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Mã KH</th>
                <th>Tên khách hàng</th>
                <th>Liên hệ</th>
                <th>Sức chứa / Diện tích</th>
                <th>Số dư công nợ</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id}>
                  <td>{c.code}</td>
                  <td>
                    <strong>{c.name}</strong>
                    <div style={{ color: 'var(--muted)', fontSize: '0.78rem' }}>
                      {c.type === 'DoanhNghiep' ? 'Doanh nghiệp' : 'Cá nhân'}
                    </div>
                  </td>
                  <td>
                    {c.phone}
                    <div style={{ color: 'var(--muted)', fontSize: '0.78rem' }}>{c.email}</div>
                  </td>
                  <td>{(c as any).displayRented}</td>
                  <td style={{ color: (c as any).displayDebt > 0 ? 'var(--danger)' : undefined, fontWeight: 600 }}>
                    {formatMoney((c as any).displayDebt)}
                  </td>
                  <td>
                    <span className={`badge ${(c as any).displayStatus === 'DangThue' ? 'badge-ok' : 'badge-muted'}`}>
                      {customerStatusLabel[(c as any).displayStatus as CustomerStatus]}
                    </span>
                  </td>
                  <td>
                    <div className="actions">
                      <button className="btn btn-ghost btn-sm">
                        <Pencil size={14} />
                      </button>
                      <button className="btn btn-ghost btn-sm">
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
            Hiển thị 1–{filtered.length} / {rows.length} khách hàng
          </span>
        </div>
      </div>

      <HopThoai
        open={open}
        title="Thêm khách hàng"
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
        <div className="field">
          <label>
            Tên khách hàng <span className="req">*</span>
          </label>
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div className="field-row">
          <div className="field">
            <label>Loại</label>
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as CustomerType })}>
              <option value="CaNhan">Cá nhân</option>
              <option value="DoanhNghiep">Doanh nghiệp</option>
            </select>
          </div>
          <div className="field">
            <label>
              Số điện thoại <span className="req">*</span>
            </label>
            <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
        </div>
        <div className="field-row">
          <div className="field">
            <label>Email</label>
            <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div className="field">
            <label>Mã số thuế</label>
            <input value={form.taxCode} onChange={(e) => setForm({ ...form, taxCode: e.target.value })} />
          </div>
        </div>
      </HopThoai>
    </div>
  );
}
