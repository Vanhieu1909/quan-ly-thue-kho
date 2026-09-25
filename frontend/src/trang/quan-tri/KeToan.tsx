import { Link } from 'react-router-dom';
import { customers, invoices as seedInvoices, transactions } from '../../du-lieu/duLieuMau';
import { formatMoney } from '../../thu-vien/dinhDang';
import { TheThongKe } from '../../thanh-phan/TheThongKe';
import { NhanTrangThaiThanhToan } from '../../thanh-phan/NhanTrangThai';

/** Màn Kế toán trong cổng Admin — cùng chỉ số báo cáo, dữ liệu mock */
export function KeToan() {
  const invoices = (JSON.parse(localStorage.getItem('mock_invoices') || 'null') || seedInvoices) as typeof seedInvoices;
  
  const unpaid = invoices
    .filter((i) => i.status !== 'DaThanhToan')
    .reduce((s, i) => s + (i.total - i.paidAmount), 0);
  const overdue = invoices
    .filter((i) => i.status === 'QuaHan')
    .reduce((s, i) => s + (i.total - i.paidAmount), 0);

  return (
    <div className="stack">
      <div className="stats">
        <TheThongKe label="Doanh thu tháng 8" value={formatMoney(555_000_000)} />
        <TheThongKe label="Chưa thu" value={formatMoney(unpaid)} tone="warn" />
        <TheThongKe label="Thuế GTGT ước tính" value={formatMoney(55_500_000)} />
        <TheThongKe label="Công nợ quá hạn" value={formatMoney(overdue)} tone="danger" />
      </div>

      <div className="toolbar">
        <p style={{ color: 'var(--muted)', margin: 0, fontSize: '0.9rem' }}>
          Lối tắt sang các màn kế toán chi tiết (cùng dữ liệu mock).
        </p>
        <div className="toolbar-right">
          <Link className="btn btn-secondary btn-sm" to="/accountant/invoices">
            Hóa đơn
          </Link>
          <Link className="btn btn-secondary btn-sm" to="/accountant/debts">
            Công nợ
          </Link>
          <Link className="btn btn-secondary btn-sm" to="/accountant/cashflow">
            Thu – Chi
          </Link>
          <Link className="btn btn-primary btn-sm" to="/accountant/reports">
            Báo cáo đầy đủ
          </Link>
        </div>
      </div>

      <div className="grid-2 equal">
        <div className="panel">
          <div className="panel-hd">
            <h2>Hóa đơn cần theo dõi</h2>
          </div>
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>Số HĐ</th>
                  <th>Khách hàng</th>
                  <th>Còn lại</th>
                  <th>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {invoices
                  .filter((i) => i.status !== 'DaThanhToan')
                  .map((i) => (
                    <tr key={i.id}>
                      <td>{i.number}</td>
                      <td>{customers.find((c) => c.id === i.customerId)?.name}</td>
                      <td>{formatMoney(i.total - i.paidAmount)}</td>
                      <td>
                        <NhanTrangThaiThanhToan status={i.status} />
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="panel">
          <div className="panel-hd">
            <h2>Thu – chi gần đây</h2>
          </div>
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>Ngày</th>
                  <th>Loại</th>
                  <th>Nội dung</th>
                  <th>Số tiền</th>
                </tr>
              </thead>
              <tbody>
                {transactions.slice(0, 6).map((t) => (
                  <tr key={t.id}>
                    <td>{t.date.split('-').reverse().join('/')}</td>
                    <td>
                      <span className={`badge ${t.type === 'Thu' ? 'badge-ok' : 'badge-warn'}`}>{t.type}</span>
                    </td>
                    <td>{t.content}</td>
                    <td style={{ fontWeight: 600 }}>{formatMoney(t.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
