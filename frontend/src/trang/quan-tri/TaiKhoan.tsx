import { dungXacThuc } from '../../boi-canh/BoiCanhXacThuc';
import { roleLabel } from '../../thu-vien/dinhDang';

export function TaiKhoan() {
  const { account } = dungXacThuc();
  if (!account) return null;

  return (
    <div className="stack">
      <div className="panel" style={{ maxWidth: 600 }}>
        <div className="panel-hd">
          <h2>Hồ sơ của tôi</h2>
        </div>
        <div className="panel-bd">
          <div className="detail-grid">
            <div className="detail-item">
              <label>Họ và tên</label>
              <strong>{account.name}</strong>
            </div>
            <div className="detail-item">
              <label>Vai trò</label>
              <strong>{roleLabel[account.role]}</strong>
            </div>
            <div className="detail-item">
              <label>Tên đăng nhập / SĐT</label>
              <strong>{account.username}</strong>
            </div>
            <div className="detail-item">
              <label>Email</label>
              <strong>{account.email || '—'}</strong>
            </div>
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-hd">
          <h2>Đổi mật khẩu</h2>
        </div>
        <div className="panel-bd">
          <div className="field">
            <label>Mật khẩu hiện tại</label>
            <input type="password" placeholder="••••••••" />
          </div>
          <div className="field">
            <label>Mật khẩu mới</label>
            <input type="password" placeholder="••••••••" />
          </div>
          <div className="field">
            <label>Xác nhận mật khẩu mới</label>
            <input type="password" placeholder="••••••••" />
          </div>
          <button className="btn btn-primary" type="button">
            Cập nhật mật khẩu
          </button>
          <p style={{ marginTop: 12, color: 'var(--muted)', fontSize: '0.85rem' }}>
            Frontend demo — chưa kết nối backend; nút chỉ mô phỏng giao diện.
          </p>
        </div>
      </div>
    </div>
  );
}
