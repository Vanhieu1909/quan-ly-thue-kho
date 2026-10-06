import { useMemo, useState, useEffect } from 'react';
import { Download, Plus, Pencil, Trash2, Key, Eye, EyeOff, RefreshCw } from 'lucide-react';
import { customers as seed, accounts as seedAccounts } from '../../du-lieu/duLieuMau';
import type { Customer, CustomerStatus, CustomerType, Account } from '../../kieu';
import { customerStatusLabel, formatMoney } from '../../thu-vien/dinhDang';
import { HopThoai } from '../../thanh-phan/HopThoai';

export function QuanLyKhachHang() {
  const [rows, setRows] = useState<Customer[]>(seed);
  const [contracts, setContracts] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [typeFilter, setTypeFilter] = useState<CustomerType | 'All'>('All');
  const [statusFilter, setStatusFilter] = useState<CustomerStatus | 'All'>('All');
  const [open, setOpen] = useState(false);

  // Reset password states
  const [resetOpen, setResetOpen] = useState(false);
  const [selectedCust, setSelectedCust] = useState<Customer | null>(null);
  const [matchedAccount, setMatchedAccount] = useState<Account | null>(null);
  const [newPassword, setNewPassword] = useState('123456');
  const [showNewPassword, setShowNewPassword] = useState(true);

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
      const activeContracts = contracts.filter(ct => ct.customerId === c.id && (ct.status === 'DangHieuLuc' || ct.status === 'ChoHieuLuc'));
      const capacityGroups = activeContracts.reduce((acc, ct) => {
        const unit = ct.rentalUnit || 'cái';
        acc[unit] = (acc[unit] || 0) + Number(ct.capacity || 0);
        return acc;
      }, {} as Record<string, number>);
      
      const rentedTexts = Object.entries(capacityGroups).map(([unit, val]) => `${val} ${unit}`);
      const rentedText = rentedTexts.length > 0 ? rentedTexts.join(', ') : '0 cái';
      
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

  function openResetPassword(c: Customer) {
    setSelectedCust(c);
    const rawAccs = localStorage.getItem('mock_accounts');
    const allAccs: Account[] = rawAccs ? JSON.parse(rawAccs) : seedAccounts;
    
    // Find matching customer account
    const found = allAccs.find(a => 
      a.customerId === c.id || 
      (a.phone && c.phone && a.phone.trim() === c.phone.trim()) || 
      (a.username && c.phone && a.username.trim() === c.phone.trim()) ||
      (a.email && c.email && a.email.trim() === c.email.trim())
    );

    setMatchedAccount(found || null);
    setNewPassword('123456');
    setShowNewPassword(true);
    setResetOpen(true);
  }

  function generateRandomPassword() {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$';
    let res = '';
    for (let i = 0; i < 8; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPassword(res);
  }

  function handleConfirmResetPassword() {
    if (!selectedCust) return;
    if (!newPassword.trim()) {
      alert('Vui lòng nhập mật khẩu mới!');
      return;
    }

    const rawAccs = localStorage.getItem('mock_accounts');
    let allAccs: Account[] = rawAccs ? JSON.parse(rawAccs) : seedAccounts;

    let targetId = matchedAccount?.id;

    if (!targetId) {
      // Create new customer account if not exists
      const newAcc: Account = {
        id: `a${Date.now()}`,
        username: selectedCust.phone || `kh_${selectedCust.code.toLowerCase()}`,
        passwordHash: newPassword,
        name: selectedCust.name,
        role: 'customer',
        phone: selectedCust.phone,
        email: selectedCust.email,
        customerId: selectedCust.id,
        status: 'ACTIVE'
      };
      allAccs.push(newAcc);
    } else {
      allAccs = allAccs.map(a => a.id === targetId ? { ...a, passwordHash: newPassword } : a);
    }

    localStorage.setItem('mock_accounts', JSON.stringify(allAccs));
    window.dispatchEvent(new Event('storage'));

    alert(`Đã cấp lại mật khẩu cho khách hàng "${selectedCust.name}" thành công!\nMật khẩu mới: ${newPassword}`);
    setResetOpen(false);
  }

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

    // Also auto-create account for new customer with default pass 123456
    const rawAccs = localStorage.getItem('mock_accounts');
    const allAccs: Account[] = rawAccs ? JSON.parse(rawAccs) : seedAccounts;
    if (!allAccs.some(a => a.username === form.phone)) {
      const newAcc: Account = {
        id: `a${Date.now()}`,
        username: form.phone,
        passwordHash: '123456',
        name: form.name,
        role: 'customer',
        phone: form.phone,
        email: form.email,
        customerId: next.id,
        status: 'ACTIVE'
      };
      localStorage.setItem('mock_accounts', JSON.stringify([...allAccs, newAcc]));
      window.dispatchEvent(new Event('storage'));
    }

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
                <th>Sức chứa / Số lượng thuê</th>
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
                      <button
                        className="btn btn-ghost btn-sm"
                        style={{ color: '#2563eb' }}
                        onClick={() => openResetPassword(c)}
                        title="Cấp lại mật khẩu đăng nhập"
                      >
                        <Key size={14} />
                      </button>
                      <button className="btn btn-ghost btn-sm" title="Sửa">
                        <Pencil size={14} />
                      </button>
                      <button className="btn btn-ghost btn-sm" title="Xóa">
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

      {/* Modal Cấp lại mật khẩu cho Khách hàng */}
      <HopThoai
        open={resetOpen}
        title="Cấp lại mật khẩu cho Khách hàng"
        onClose={() => setResetOpen(false)}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setResetOpen(false)}>Hủy</button>
            <button className="btn btn-primary" onClick={handleConfirmResetPassword}>
              <Key size={14} style={{ marginRight: 4 }} /> Xác nhận cấp lại
            </button>
          </>
        }
      >
        {selectedCust && (
          <div className="stack" style={{ gap: 16 }}>
            <div style={{ background: '#f8fafc', padding: 12, borderRadius: 6, border: '1px solid #e2e8f0' }}>
              <div><strong>Khách hàng:</strong> {selectedCust.name} ({selectedCust.code})</div>
              <div><strong>Số điện thoại:</strong> {selectedCust.phone}</div>
              <div><strong>Tài khoản đăng nhập:</strong> {matchedAccount ? matchedAccount.username : `${selectedCust.phone} (Tạo mới khi cấp)`}</div>
              {matchedAccount && (
                <div><strong>Mật khẩu hiện tại:</strong> {matchedAccount.passwordHash || '123456'}</div>
              )}
            </div>

            <div className="field">
              <label>Mật khẩu mới <span className="req">*</span></label>
              <div style={{ display: 'flex', gap: 8 }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Nhập mật khẩu mới"
                    style={{ paddingRight: 36, width: '100%' }}
                  />
                  <button
                    type="button"
                    style={{
                      position: 'absolute',
                      right: 8,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#64748b'
                    }}
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    title={showNewPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  >
                    {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={generateRandomPassword}
                  title="Tạo ngẫu nhiên"
                >
                  <RefreshCw size={14} style={{ marginRight: 4 }} /> Ngẫu nhiên
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setNewPassword('123456')}
              >
                Đặt mặc định: 123456
              </button>
            </div>
          </div>
        )}
      </HopThoai>

      {/* Modal Thêm khách hàng */}
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

