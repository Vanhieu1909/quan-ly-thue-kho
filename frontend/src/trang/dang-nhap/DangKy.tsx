import { useState, type FormEvent } from 'react';
import { Navigate, useNavigate, Link } from 'react-router-dom';
import { dungXacThuc } from '../../boi-canh/BoiCanhXacThuc';

export function DangKy() {
  const { account, register } = dungXacThuc();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (account) return <Navigate to="/customer" replace />;

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const err = register(name.trim(), phone.trim(), email.trim(), password);
    if (err) {
      setError(err);
      return;
    }
    alert('Đăng ký thành công! Vui lòng đăng nhập.');
    navigate('/login');
  }

  return (
    <div className="auth-page" style={{ gridTemplateColumns: '1fr' }}>
      <div className="auth-panel">
        <div className="auth-card" style={{ width: 'min(480px, 100%)' }}>
          <h2 style={{ textAlign: 'center', marginBottom: '24px' }}>Đăng ký tài khoản</h2>

          {error && <div className="error-box">{error}</div>}

          <form onSubmit={onSubmit}>
            <div className="field">
              <label>Họ và tên <span className="req">*</span></label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nguyễn Văn A"
                required
              />
            </div>
            <div className="field-row">
              <div className="field">
                <label>Số điện thoại <span className="req">*</span></label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="09..."
                  required
                />
              </div>
              <div className="field">
                <label>Email <span className="req">*</span></label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="abc@domain.com"
                  required
                />
              </div>
            </div>
            <div className="field">
              <label>Mật khẩu <span className="req">*</span></label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
            <button className="btn btn-primary" style={{ width: '100%', padding: '12px', marginTop: '12px' }} type="submit">
              ĐĂNG KÝ
            </button>
            <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '0.9rem' }}>
              Đã có tài khoản? <Link to="/login" style={{ color: 'var(--accent)', fontWeight: 600 }}>Đăng nhập</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
