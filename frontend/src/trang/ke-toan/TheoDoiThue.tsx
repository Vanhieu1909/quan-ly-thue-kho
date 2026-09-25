import { useState, useEffect } from 'react';
import { invoices as seedInvoices } from '../../du-lieu/duLieuMau';
import type { Invoice } from '../../kieu';
import { formatMoney } from '../../thu-vien/dinhDang';

export function TheoDoiThue() {
  const [invoices, setInvoices] = useState<Invoice[]>(() => {
    const raw = localStorage.getItem('mock_invoices');
    return raw ? JSON.parse(raw) : seedInvoices;
  });

  useEffect(() => {
    const raw = localStorage.getItem('mock_invoices');
    if (raw) setInvoices(JSON.parse(raw));
  }, []);

  const output = invoices.reduce((s, i) => s + (i.vat || 0), 0);

  return (
    <div className="stack">
      <div className="summary-box">
        <div className="row">
          <span>Mã số thuế DN</span>
          <strong>0108123456</strong>
        </div>
        <div className="row">
          <span>Kỳ kê khai</span>
          <strong>Tháng 8/2026</strong>
        </div>
      </div>

      <div className="panel">
        <div className="panel-hd">
          <h2>Thuế GTGT đầu ra theo hóa đơn</h2>
        </div>
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Số hóa đơn</th>
                <th>Doanh thu</th>
                <th>Thuế suất</th>
                <th>Thuế GTGT</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((i) => (
                <tr key={i.id}>
                  <td>{i.number}</td>
                  <td>{formatMoney(i.amountBeforeTax)}</td>
                  <td>10%</td>
                  <td>{formatMoney(i.vat)}</td>
                </tr>
              ))}
              <tr>
                <td colSpan={3}>
                  <strong>Tổng GTGT đầu ra</strong>
                </td>
                <td>
                  <strong>{formatMoney(output)}</strong>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="panel">
        <div className="panel-hd">
          <h2>Thuế TNDN tạm tính</h2>
        </div>
        <div className="panel-bd detail-grid">
          <div className="detail-item">
            <label>Lợi nhuận chịu thuế ước tính</label>
            <strong>{formatMoney(480_000_000)}</strong>
          </div>
          <div className="detail-item">
            <label>Thuế suất</label>
            <strong>20%</strong>
          </div>
          <div className="detail-item">
            <label>Thuế TNDN tạm tính</label>
            <strong>{formatMoney(96_000_000)}</strong>
          </div>
        </div>
      </div>
    </div>
  );
}
