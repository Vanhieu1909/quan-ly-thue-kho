import { Link } from 'react-router-dom';
import { contracts as seedContracts, invoices as seedInvoices, billingCycles as seedBillingCycles } from '../../du-lieu/duLieuMau';
import { dungXacThuc } from '../../boi-canh/BoiCanhXacThuc';
import { formatMoney } from '../../thu-vien/dinhDang';
import { useState, useEffect } from 'react';

export function CongNo() {
  const { account } = dungXacThuc();
  const customerId = account?.customerId;
  
  const [contracts, setContracts] = useState(seedContracts);
  const [invoices, setInvoices] = useState(seedInvoices);
  const [billingCycles, setBillingCycles] = useState(seedBillingCycles);

  useEffect(() => {
    const lContracts = localStorage.getItem('mock_contracts');
    const lInvoices = localStorage.getItem('mock_invoices');
    const lBilling = localStorage.getItem('mock_billingCycles');
    if (lContracts) setContracts(JSON.parse(lContracts));
    if (lInvoices) setInvoices(JSON.parse(lInvoices));
    if (lBilling) setBillingCycles(JSON.parse(lBilling));
  }, []);

  const rows = invoices
    .filter((i) => i.customerId === customerId)
    .map((i) => {
      const bc = billingCycles.find((b) => b.id === i.billingCycleId);
      return {
        invoice: i,
        billingCycle: bc,
        contract: contracts.find((c) => c.id === bc?.contractId),
        remain: i.total - i.paidAmount,
        overdue: i.status === 'QuaHan' ? i.total - i.paidAmount : 0,
      };
    });

  const currentDebt = rows.reduce((s, r) => s + r.remain, 0);

  return (
    <div className="stack">
      <div className="stats">
        <div className="stat-card danger">
          <div className="label">Tổng nợ hiện tại</div>
          <div className="value" style={{ fontSize: '1.4rem' }}>{formatMoney(currentDebt)}</div>
        </div>
      </div>

      <div className="panel">
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Hợp đồng</th>
                <th>Kỳ thanh toán</th>
                <th>Phải thu</th>
                <th>Đã thanh toán</th>
                <th>Còn nợ</th>
                <th>Quá hạn</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.invoice.id}>
                  <td>{r.contract?.code}</td>
                  <td>{r.invoice.period}</td>
                  <td>{formatMoney(r.invoice.total)}</td>
                  <td>{formatMoney(r.invoice.paidAmount)}</td>
                  <td style={{ fontWeight: 700 }}>{formatMoney(r.remain)}</td>
                  <td>{formatMoney(r.overdue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="pagination" style={{ justifyContent: 'flex-end' }}>
          {currentDebt > 0 && (
            <Link className="btn btn-primary" to="/customer/payment">
              Thanh toán ngay
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
