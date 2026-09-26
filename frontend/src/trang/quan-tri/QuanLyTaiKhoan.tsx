import { useMemo, useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Lock, LockOpen } from 'lucide-react';
import type { Account, Role } from '../../kieu';
import { roleLabel } from '../../thu-vien/dinhDang';
import { HopThoai } from '../../thanh-phan/HopThoai';
import { accounts as seedAccounts } from '../../du-lieu/duLieuMau';

export function QuanLyTaiKhoan() {
  const [rows, setRows] = useState<Account[]>([]);
  const [roleFilter, setRoleFilter] = useState<Role | 'All'>('All');
  const [open, setOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
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

  function openCreate() {
    setIsEdit(false);
    setForm({ name: '', username: '', passwordHash: '', role: 'staff', phone: '', email: '', status: 'ACTIVE' });
    setOpen(true);
  }

  function openEdit(acc: Account) {
    setIsEdit(true);
    setForm({ ...acc, passwordHash: '' });
    setOpen(true);
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
    if (id === 'a1') return; // Cannot lock default admin
    const updated = rows.map(r => r.id === id ? { ...r, status: r.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' } as Account : r);
    saveToLocal(updated);
  }

  function deleteAccount(id: string) {
    if (id === 'a1') {
      alert('Không thể xóa tài khoản Quản trị viên mặc định.');
      return;
    }
    if (confirm('Bạn có chắc chắn muốn xóa tài khoản này?')) {
      const updated = rows.filter(r => r.id !== id);
      saveToLocal(updated);
    }
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
                <th>Liên hệ</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id}>
                  <td><strong>{c.username}</strong></td>
                  <td>{c.name}</td>
                  <td>{roleLabel[c.role]}</td>
                  <td>
                    <div style={{ fontSize: '0.85rem' }}>{c.phone}</div>
                    <div style={{ color: 'var(--muted)', fontSize: '0.78rem' }}>{c.email}</div>
                  </td>
                  <td>
                    <span className={`badge ${c.status === 'ACTIVE' ? 'badge-ok' : 'badge-muted'}`}>
                      {c.status === 'ACTIVE' ? 'Hoạt động' : 'Khóa'}
                    </span>
                  </td>
                  <td>
                    <div className="actions">
                      <button className="btn btn-ghost btn-sm" onClick={() => openEdit(c)} title="Sửa">
                        <Pencil size={14} />
                      </button>
                      <button className="btn btn-ghost btn-sm" onClick={() => toggleStatus(c.id)} title={c.status === 'ACTIVE' ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}>
                        {c.status === 'ACTIVE' ? <Lock size={14} /> : <LockOpen size={14} />}
                      </button>
                      <button className="btn btn-ghost btn-sm btn-danger" onClick={() => deleteAccount(c.id)} title="Xóa tài khoản">
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
            Hiển thị {filtered.length} / {rows.length} tài khoản
          </span>
        </div>
      </div>

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
            <label>Mật khẩu {isEdit ? '(Để trống nếu không đổi)' : '<span className="req">*</span>'}</label>
            <input type="password" value={form.passwordHash} onChange={(e) => setForm({ ...form, passwordHash: e.target.value })} placeholder={isEdit ? '••••••••' : ''} />
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
