import { contracts as seedContracts, customers as seedCustomers, invoices as seedInvoices } from '../../du-lieu/duLieuMau';
import { formatMoney } from '../../thu-vien/dinhDang';
import { useState, useEffect } from 'react';

export function CongNo() {
  const [invoices, setInvoices] = useState(seedInvoices);
  const [contracts, setContracts] = useState(seedContracts);
  const [customers, setCustomers] = useState(seedCustomers);

  useEffect(() => {
    const dedupe = (arr: any[]) => arr.filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);
    
    const lInv = localStorage.getItem('mock_invoices');
    const lCont = localStorage.getItem('mock_contracts');
    const lCust = localStorage.getItem('mock_customers');
    
    if (lInv) setInvoices(dedupe(JSON.parse(lInv)));
    if (lCont) setContracts(dedupe(JSON.parse(lCont)));
    if (lCust) setCustomers(dedupe(JSON.parse(lCust)));
  }, []);

  const rows = customers
    .filter((c) => c.status === 'DangThue' || c.debt > 0 || invoices.some(i => i.customerId === c.id))
    .map((c) => {
      const custInvoices = invoices.filter((i) => i.customerId === c.id);
      const mustPay = custInvoices.reduce((s, i) => s + i.total, 0);
      const paid = custInvoices.reduce((s, i) => s + i.paidAmount, 0);
      const overdue = custInvoices
        .filter((i) => i.status === 'QuaHan')
        .reduce((s, i) => s + (i.total - i.paidAmount), 0);
      const contract = contracts.find((ct) => ct.customerId === c.id && ct.status !== 'DaKetThuc');
      return {
        customer: c,
        contract,
        mustPay,
        paid,
        remain: mustPay - paid,
        overdue,
      };
    });

  const totalDebt = rows.reduce((s, r) => s + r.remain, 0);
  const totalOverdue = rows.reduce((s, r) => s + r.overdue, 0);

  return (
    <div className="stack">
      <div className="stats">
        <div className="stat-card">
          <div className="label">Tổng nợ</div>
          <div className="value" style={{ fontSize: '1.35rem' }}>{formatMoney(totalDebt)}</div>
        </div>
        <div className="stat-card danger">
          <div className="label">Nợ quá hạn</div>
          <div className="value" style={{ fontSize: '1.35rem' }}>{formatMoney(totalOverdue)}</div>
        </div>
      </div>

      <div className="panel">
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Khách hàng</th>
                <th>Hợp đồng</th>
                <th>Tổng phải thu</th>
                <th>Đã thanh toán</th>
                <th>Còn nợ</th>
                <th>Quá hạn</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.customer.id}>
                  <td>{r.customer.name}</td>
                  <td>{r.contract?.code || '—'}</td>
                  <td>{formatMoney(r.mustPay)}</td>
                  <td>{formatMoney(r.paid)}</td>
                  <td style={{ fontWeight: 700, color: r.remain > 0 ? 'var(--danger)' : 'var(--ok)' }}>
                    {formatMoney(r.remain)}
                  </td>
                  <td>{formatMoney(r.overdue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
