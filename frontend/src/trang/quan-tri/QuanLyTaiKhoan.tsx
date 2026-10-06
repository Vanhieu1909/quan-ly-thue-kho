import { useMemo, useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Lock, LockOpen, Key, Eye, EyeOff, RefreshCw, AlertTriangle } from 'lucide-react';
import type { Account, Role } from '../../kieu';
import { roleLabel } from '../../thu-vien/dinhDang';
import { HopThoai } from '../../thanh-phan/HopThoai';
import { accounts as seedAccounts } from '../../du-lieu/duLieuMau';
import { dungXacThuc } from '../../boi-canh/BoiCanhXacThuc';

export function QuanLyTaiKhoan() {
  const { account: currentAcc } = dungXacThuc();
  const [rows, setRows] = useState<Account[]>([]);
  const [roleFilter, setRoleFilter] = useState<Role | 'All'>('All');
  const [open, setOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
  const [showFormPassword, setShowFormPassword] = useState(false);

  // Modal Cấp lại mật khẩu
  const [resetOpen, setResetOpen] = useState(false);
  const [targetAccount, setTargetAccount] = useState<Account | null>(null);
  const [newPassword, setNewPassword] = useState('123456');
  const [showNewPassword, setShowNewPassword] = useState(true);

  // Modal Xóa tài khoản
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Account | null>(null);

  const [form, setForm] = useState<Partial<Account>>({
    name: '',
    username: '',
    passwordHash: '',
    role: 'customer',
    phone: '',
    email: '',
    status: 'ACTIVE'
  });

  useEffect(() => {
    const raw = localStorage.getItem('mock_accounts');
    if (raw) {
      setRows(JSON.parse(raw));
    } else {
      setRows(seedAccounts);
      localStorage.setItem('mock_accounts', JSON.stringify(seedAccounts));
    }
  }, []);

  const saveToLocal = (data: Account[]) => {
    setRows(data);
    localStorage.setItem('mock_accounts', JSON.stringify(data));
    window.dispatchEvent(new Event('storage'));
  };

  const filtered = useMemo(
    () => rows.filter((c) => roleFilter === 'All' || c.role === roleFilter),
    [rows, roleFilter]
  );

  function togglePasswordVisibility(id: string) {
    setVisiblePasswords((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  }

  function openCreate() {
    setIsEdit(false);
    setShowFormPassword(false);
    setForm({ name: '', username: '', passwordHash: '123456', role: 'staff', phone: '', email: '', status: 'ACTIVE' });
    setOpen(true);
  }

  function openEdit(acc: Account) {
    setIsEdit(true);
    setShowFormPassword(false);
    setForm({ ...acc, passwordHash: '' });
    setOpen(true);
  }

  function openResetPassword(acc: Account) {
    setTargetAccount(acc);
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
    if (!targetAccount) return;
    if (!newPassword.trim()) {
      alert('Vui lòng nhập mật khẩu mới!');
      return;
    }

    const updated = rows.map((r) =>
      r.id === targetAccount.id ? { ...r, passwordHash: newPassword } : r
    );
    saveToLocal(updated);

    // Make new password visible in table after reset
    setVisiblePasswords((prev) => ({ ...prev, [targetAccount.id]: true }));

    alert(
      `Đã cấp lại mật khẩu thành công cho tài khoản "${targetAccount.username}" (${targetAccount.name})!\nMật khẩu mới: ${newPassword}`
    );
    setResetOpen(false);
  }

  function save() {
    if (!form.name || !form.username || (!isEdit && !form.passwordHash)) {
      alert('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }
    
    if (isEdit) {
      const updated = rows.map(r => r.id === form.id ? { ...r, ...form, passwordHash: form.passwordHash || r.passwordHash } as Account : r);
      saveToLocal(updated);
    } else {
      if (rows.some(r => r.username === form.username)) {
        alert('Tên đăng nhập đã tồn tại!');
        return;
      }
      const next: Account = {
        id: `a${Date.now()}`,
        username: form.username,
        passwordHash: form.passwordHash || '123456',
        name: form.name,
        role: form.role as Role,
        phone: form.phone,
        email: form.email,
        status: form.status as 'ACTIVE' | 'INACTIVE',
      };
      saveToLocal([...rows, next]);
    }
    setOpen(false);
  }

  function toggleStatus(id: string) {
    const target = rows.find(r => r.id === id);
    if (target && (target.username === 'admin' || target.id === 'a1')) {
      alert('Không thể khóa tài khoản Quản trị viên mặc định (admin).');
      return;
    }
    const updated = rows.map(r => r.id === id ? { ...r, status: r.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' } as Account : r);
    saveToLocal(updated);
  }

  function openDeleteModal(acc: Account) {
    if (acc.username === 'admin' || acc.id === 'a1') {
      alert('Không thể xóa tài khoản Quản trị viên mặc định hệ thống (admin).');
      return;
    }
    if (currentAcc && (acc.id === currentAcc.id || acc.username === currentAcc.username)) {
      alert('Không thể xóa tài khoản Quản trị viên bạn đang sử dụng để đăng nhập hiện tại.');
      return;
    }
    setDeleteTarget(acc);
    setDeleteOpen(true);
  }

  function confirmDeleteAccount() {
    if (!deleteTarget) return;
    const updated = rows.filter((r) => r.id !== deleteTarget.id);
    saveToLocal(updated);
    setDeleteOpen(false);
    alert(`Đã xóa tài khoản "${deleteTarget.username}" (${deleteTarget.name}) thành công.`);
    setDeleteTarget(null);
  }

  return (
    <div>
      <div className="toolbar">
        <div className="toolbar-left">
          <select className="filter-select" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value as Role | 'All')}>
            <option value="All">Tất cả vai trò</option>
            <option value="admin">Quản trị viên</option>
            <option value="staff">Nhân viên kho</option>
            <option value="accountant">Kế toán</option>
            <option value="customer">Khách hàng</option>
          </select>
        </div>
        <div className="toolbar-right">
          <button className="btn btn-primary" onClick={openCreate}>
            <Plus size={16} /> Thêm tài khoản
          </button>
        </div>
      </div>

      <div className="panel">
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Tên đăng nhập</th>
                <th>Họ và tên</th>
                <th>Vai trò</th>
                <th>Mật khẩu</th>
                <th>Liên hệ</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => {
                const isVisible = visiblePasswords[c.id];
                const isSystemAdmin = c.username === 'admin' || c.id === 'a1';
                const isSelf = Boolean(currentAcc && (c.id === currentAcc.id || c.username === currentAcc.username));

                return (
                  <tr key={c.id}>
                    <td>
                      <strong>{c.username}</strong>
                      {isSelf && <span style={{ marginLeft: 6, fontSize: '0.75rem', color: '#2563eb', fontWeight: 500 }}>(Tôi)</span>}
                    </td>
                    <td>{c.name}</td>
                    <td>{roleLabel[c.role]}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <code style={{ fontSize: '0.85rem', background: '#f1f5f9', padding: '2px 6px', borderRadius: 4 }}>
                          {isVisible ? (c.passwordHash || '123456') : '••••••••'}
                        </code>
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          onClick={() => togglePasswordVisibility(c.id)}
                          title={isVisible ? 'Ẩn mật khẩu' : 'Xem mật khẩu'}
                        >
                          {isVisible ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.85rem' }}>{c.phone || '—'}</div>
                      <div style={{ color: 'var(--muted)', fontSize: '0.78rem' }}>{c.email || '—'}</div>
                    </td>
                    <td>
                      <span className={`badge ${c.status === 'ACTIVE' ? 'badge-ok' : 'badge-muted'}`}>
                        {c.status === 'ACTIVE' ? 'Hoạt động' : 'Khóa'}
                      </span>
                    </td>
                    <td>
                      <div className="actions">
                        <button
                          className="btn btn-ghost btn-sm"
                          style={{ color: '#2563eb' }}
                          onClick={() => openResetPassword(c)}
                          title="Cấp lại mật khẩu"
                        >
                          <Key size={14} />
                        </button>
                        <button className="btn btn-ghost btn-sm" onClick={() => openEdit(c)} title="Sửa thông tin">
                          <Pencil size={14} />
                        </button>
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => toggleStatus(c.id)}
                          disabled={isSystemAdmin}
                          title={isSystemAdmin ? 'Không thể khóa Admin mặc định' : c.status === 'ACTIVE' ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
                        >
                          {c.status === 'ACTIVE' ? <Lock size={14} /> : <LockOpen size={14} />}
                        </button>
                        <button
                          className="btn btn-ghost btn-sm btn-danger"
                          onClick={() => openDeleteModal(c)}
                          disabled={isSystemAdmin || isSelf}
                          title={isSystemAdmin ? 'Không thể xóa Admin mặc định' : isSelf ? 'Không thể xóa tài khoản của bạn' : 'Xóa tài khoản'}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="pagination">
          <span>
            Hiển thị {filtered.length} / {rows.length} tài khoản
          </span>
        </div>
      </div>

      {/* Modal Cấp lại mật khẩu */}
      <HopThoai
        open={resetOpen}
        title="Cấp lại mật khẩu tài khoản"
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
        {targetAccount && (
          <div className="stack" style={{ gap: 16 }}>
            <div style={{ background: '#f8fafc', padding: 12, borderRadius: 6, border: '1px solid #e2e8f0' }}>
              <div><strong>Tài khoản:</strong> {targetAccount.username}</div>
              <div><strong>Họ và tên:</strong> {targetAccount.name}</div>
              <div><strong>Vai trò:</strong> {roleLabel[targetAccount.role]}</div>
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

      {/* Modal Xác nhận xóa tài khoản */}
      <HopThoai
        open={deleteOpen}
        title="Xác nhận xóa tài khoản"
        onClose={() => setDeleteOpen(false)}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setDeleteOpen(false)}>Hủy</button>
            <button className="btn btn-primary btn-danger" onClick={confirmDeleteAccount}>
              <Trash2 size={14} style={{ marginRight: 4 }} /> Xác nhận xóa
            </button>
          </>
        }
      >
        {deleteTarget && (
          <div className="stack" style={{ gap: 16 }}>
            <div style={{ display: 'flex', gap: 12, background: '#fef2f2', border: '1px solid #fecaca', padding: 12, borderRadius: 6, color: '#991b1b' }}>
              <AlertTriangle size={24} style={{ flexShrink: 0, color: '#dc2626' }} />
              <div style={{ fontSize: '0.88rem' }}>
                <strong>Cảnh báo:</strong> Bạn có chắc chắn muốn xóa tài khoản này khỏi hệ thống? Người dùng sẽ không thể đăng nhập lại sau khi xóa.
              </div>
            </div>

            <div style={{ background: '#f8fafc', padding: 12, borderRadius: 6, border: '1px solid #e2e8f0', fontSize: '0.9rem' }}>
              <div><strong>Tên đăng nhập:</strong> {deleteTarget.username}</div>
              <div><strong>Họ và tên:</strong> {deleteTarget.name}</div>
              <div><strong>Vai trò:</strong> {roleLabel[deleteTarget.role]}</div>
              {deleteTarget.email && <div><strong>Email:</strong> {deleteTarget.email}</div>}
              {deleteTarget.phone && <div><strong>Số điện thoại:</strong> {deleteTarget.phone}</div>}
            </div>
          </div>
        )}
      </HopThoai>

      {/* Modal Tạo/Sửa tài khoản */}
      <HopThoai
        open={open}
        title={isEdit ? 'Cập nhật tài khoản' : 'Thêm tài khoản'}
        onClose={() => setOpen(false)}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setOpen(false)}>Hủy</button>
            <button className="btn btn-primary" onClick={save}>Lưu</button>
          </>
        }
      >
        <div className="field-row">
          <div className="field">
            <label>Tên đăng nhập <span className="req">*</span></label>
            <input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} disabled={isEdit} />
          </div>
          <div className="field">
            <label>Mật khẩu {isEdit ? '(Để trống nếu không đổi)' : <span className="req">*</span>}</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showFormPassword ? 'text' : 'password'}
                value={form.passwordHash}
                onChange={(e) => setForm({ ...form, passwordHash: e.target.value })}
                placeholder={isEdit ? '••••••••' : 'Nhập mật khẩu'}
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
                onClick={() => setShowFormPassword(!showFormPassword)}
                title={showFormPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              >
                {showFormPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
        </div>
        <div className="field">
          <label>Họ và tên <span className="req">*</span></label>
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div className="field-row">
          <div className="field">
            <label>Vai trò</label>
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as Role })}>
              <option value="admin">Quản trị viên</option>
              <option value="staff">Nhân viên kho</option>
              <option value="accountant">Kế toán</option>
              <option value="customer">Khách hàng</option>
            </select>
          </div>
          <div className="field">
            <label>Trạng thái</label>
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as any })}>
              <option value="ACTIVE">Hoạt động</option>
              <option value="INACTIVE">Bị khóa</option>
            </select>
          </div>
        </div>
        <div className="field-row">
          <div className="field">
            <label>Số điện thoại</label>
            <input value={form.phone || ''} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div className="field">
            <label>Email</label>
            <input value={form.email || ''} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
        </div>
      </HopThoai>
    </div>
  );
}
