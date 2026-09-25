import { useState, useEffect } from 'react';
import { dungXacThuc } from '../../boi-canh/BoiCanhXacThuc';
import { formatMoney, formatDate } from '../../thu-vien/dinhDang';

export function LichSuGiaoDich() {
  const { account } = dungXacThuc();
  const customerId = account?.customerId;
  const [transactions, setTransactions] = useState<any[]>([]);

  useEffect(() => {
    const raw = localStorage.getItem('mock_transactions');
    if (raw) {
      const all = JSON.parse(raw);
      setTransactions(all.filter((t: any) => t.customerId === customerId));
    }
  }, [customerId]);

  return (
    <div className="stack">
      <div className="panel">
        <div className="panel-hd">
          <h2>Lịch sử giao dịch</h2>
        </div>
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Mã GD</th>
                <th>Ngày</th>
                <th>Nội dung</th>
                <th>Phương thức</th>
                <th>Số tiền</th>
                <th>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((t: any) => (
                <tr key={t.id}>
                  <td>{t.id}</td>
                  <td>{formatDate(t.date)}</td>
                  <td>{t.content}</td>
                  <td>{t.method}</td>
                  <td style={{ color: t.type === 'Thu' ? 'var(--ok)' : 'var(--danger)', fontWeight: 'bold' }}>
                    {t.type === 'Thu' ? '+' : '-'}{formatMoney(t.amount)}
                  </td>
                  <td>
                    <span className={`badge badge-${t.status === 'XacNhan' ? 'ok' : 'danger'}`}>
                      {t.status === 'XacNhan' ? 'Thành công' : 'Đã hủy'}
                    </span>
                  </td>
                </tr>
              ))}
              {transactions.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                    Chưa có giao dịch nào
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
