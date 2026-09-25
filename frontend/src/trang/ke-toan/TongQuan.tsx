import { useState, useEffect } from 'react';
import {
  customers as seedCustomers,
  invoices as seedInvoices,
  transactions as seedTransactions,
} from '../../du-lieu/duLieuMau';
import type { Customer, Invoice, Transaction } from '../../kieu';
import { formatDate, formatMoney } from '../../thu-vien/dinhDang';
import { NhanTrangThaiThanhToan } from '../../thanh-phan/NhanTrangThai';
import { TheThongKe } from '../../thanh-phan/TheThongKe';

export function TongQuan() {
  const [invoices, setInvoices] = useState<Invoice[]>(seedInvoices);
  const [transactions, setTransactions] = useState<Transaction[]>(seedTransactions);
  const [customers, setCustomers] = useState<Customer[]>(seedCustomers);

  useEffect(() => {
    const lInv = localStorage.getItem('mock_invoices');
    const lTrans = localStorage.getItem('mock_transactions');
    const lCust = localStorage.getItem('mock_customers');
    if (lInv) setInvoices(JSON.parse(lInv));
    if (lTrans) setTransactions(JSON.parse(lTrans));
    if (lCust) setCustomers(JSON.parse(lCust));
  }, []);

  // Doanh thu tháng hiện tại (hóa đơn đã thanh toán)
  const currentMonth = new Date().toISOString().slice(0, 7);
  const monthRevenue = invoices
    .filter((i) => i.date.startsWith(currentMonth) && i.status === 'DaThanhToan')
    .reduce((s, i) => s + i.total, 0);

  // Chưa thu = tổng còn nợ của các HĐ chưa thanh toán
  const unpaid = invoices
    .filter((i) => i.status !== 'DaThanhToan')
    .reduce((s, i) => s + (i.total - i.paidAmount), 0);

  // VAT ước tính từ doanh thu đã thu
  const vat = Math.round(monthRevenue / 11); // VAT = total * 10/110 ≈ total/11

  // Công nợ quá hạn
  const overdue = invoices
    .filter((i) => i.status === 'QuaHan')
    .reduce((s, i) => s + (i.total - i.paidAmount), 0);

  // HĐ chưa thanh toán cần theo dõi (5 gần nhất)
  const pendingInvoices = invoices
    .filter((i) => i.status !== 'DaThanhToan')
    .slice(0, 8);

  // Thu chi gần đây (6 giao dịch mới nhất)
  const recentTrans = transactions.slice(0, 6);

  return (
    <div className="stack">
      <div className="stats">
        <TheThongKe label="Doanh thu tháng này" value={formatMoney(monthRevenue)} />
        <TheThongKe label="Doanh thu chưa thu" value={formatMoney(unpaid)} tone="warn" />
        <TheThongKe label="Thuế GTGT (10%)" value={formatMoney(vat)} />
        <TheThongKe label="Công nợ quá hạn" value={formatMoney(overdue)} tone="danger" />
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
                  <th>Số tiền</th>
                  <th>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {pendingInvoices.map((i) => (
                  <tr key={i.id}>
                    <td>{i.number}</td>
                    <td>{customers.find((c) => c.id === i.customerId)?.name ?? '—'}</td>
                    <td>{formatMoney(i.total - i.paidAmount)}</td>
                    <td>
                      <NhanTrangThaiThanhToan status={i.status} />
                    </td>
                  </tr>
                ))}
                {pendingInvoices.length === 0 && (
                  <tr>
                    <td colSpan={4}>
                      <div className="empty">Tất cả hóa đơn đã thanh toán</div>
                    </td>
                  </tr>
                )}
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
                  <th style={{ textAlign: 'right' }}>Số tiền</th>
                </tr>
              </thead>
              <tbody>
                {recentTrans.map((t) => (
                  <tr key={t.id}>
                    <td>{formatDate(t.date)}</td>
                    <td>
                      <span className={`badge ${t.type === 'Thu' ? 'badge-ok' : 'badge-warn'}`}>
                        {t.type}
                      </span>
                    </td>
                    <td>{t.content}</td>
                    <td style={{ textAlign: 'right', color: t.type === 'Thu' ? 'var(--ok)' : 'var(--warn)', fontWeight: 600 }}>
                      {t.type === 'Thu' ? '+' : '-'}{formatMoney(t.amount)}
                    </td>
                  </tr>
                ))}
                {recentTrans.length === 0 && (
                  <tr>
                    <td colSpan={4}>
                      <div className="empty">Chưa có giao dịch nào</div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
