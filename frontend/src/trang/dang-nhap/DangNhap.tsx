import { useState, type FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';

import { dungXacThuc, type LoginError } from '../../boi-canh/BoiCanhXacThuc';
import type { Role } from '../../kieu';

const homeByRole: Record<Role, string> = {
  admin: '/admin',
  staff: '/staff',
  accountant: '/accountant',
  customer: '/customer',
};

export function DangNhap() {
  const { account, login } = dungXacThuc();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState<LoginError | null>(null);

  if (account) return <Navigate to={homeByRole[account.role]} replace />;

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const err = login(username.trim(), password);
    if (err) {
      setError(err);
      return;
    }
    const u = JSON.parse(localStorage.getItem('thuekho_account') || '{}');
    navigate(homeByRole[u.role as Role] || '/login');
    void remember;
  }

  return (
    <div className="auth-page" style={{ gridTemplateColumns: '1fr' }}>

      <div className="auth-panel">
        <div className="auth-card">
          <h2 style={{ textAlign: 'center', marginBottom: '24px' }}>Đăng nhập hệ thống kho</h2>

          {error && error.field === 'general' && <div className="error-box">{error.message}</div>}

          <form onSubmit={onSubmit}>
            <div className="field">
              <label>Tên đăng nhập</label>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="SĐT / Email"
                autoComplete="username"
                className={error?.field === 'username' ? 'input-error' : ''}
                required
              />
              {error?.field === 'username' && <span className="error-text">{error.message}</span>}
            </div>
            <div className="field">
              <label>Mật khẩu</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                className={error?.field === 'password' ? 'input-error' : ''}
                required
              />
              {error?.field === 'password' && <span className="error-text">{error.message}</span>}
            </div>
            <div className="checkbox-row">
              <label>
                <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
                Ghi nhớ đăng nhập
              </label>
              <a href="#" onClick={(e) => e.preventDefault()}>
                Quên mật khẩu?
              </a>
            </div>
            <button className="btn btn-primary" style={{ width: '100%', padding: '12px' }} type="submit">
              ĐĂNG NHẬP
            </button>
            <button className="btn btn-secondary" style={{ width: '100%', padding: '12px', marginTop: '12px' }} type="button" onClick={() => navigate('/dang-ky')}>
              ĐĂNG KÝ TÀI KHOẢN
            </button>
          </form>


        </div>
      </div>
    </div>
  );
}
