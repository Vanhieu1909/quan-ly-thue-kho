import { useMemo, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { invoices as seedInvoices, contracts as seedContracts, billingCycles as seedBillingCycles } from '../../du-lieu/duLieuMau';
import { dungXacThuc } from '../../boi-canh/BoiCanhXacThuc';
import type { PaymentStatus } from '../../kieu';
import { formatDate, formatMoney } from '../../thu-vien/dinhDang';
import { NhanTrangThaiThanhToan } from '../../thanh-phan/NhanTrangThai';

export function HoaDon() {
  const { account } = dungXacThuc();
  const customerId = account?.customerId;
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | 'All'>('All');

  const [invoices, setInvoices] = useState(seedInvoices);
  const [contracts, setContracts] = useState(seedContracts);
  const [billingCycles, setBillingCycles] = useState(seedBillingCycles);

  useEffect(() => {
    const lInv = localStorage.getItem('mock_invoices');
    const lCont = localStorage.getItem('mock_contracts');
    const lBill = localStorage.getItem('mock_billingCycles');
    if (lInv) setInvoices(JSON.parse(lInv));
    if (lCont) setContracts(JSON.parse(lCont));
    if (lBill) setBillingCycles(JSON.parse(lBill));
  }, []);

  const rows = useMemo(() => {
    const mine = invoices.filter((i) => i.customerId === customerId);
    return statusFilter === 'All' ? mine : mine.filter((i) => i.status === statusFilter);
  }, [customerId, statusFilter, invoices]);

  const total = rows.reduce((s, i) => s + i.total, 0);

  function getInvoiceBreakdown(inv: any) {
    const bc = billingCycles.find(b => b.id === inv.billingCycleId);
    const contract = contracts.find(c => c.id === bc?.contractId);
    let deposit = 0;
    let rent = inv.amountBeforeTax;
    if (inv.content.toLowerCase().includes('cọc') && contract) {
      deposit = contract.deposit;
      rent = inv.amountBeforeTax - deposit;
    }
    return { deposit, rent };
  }

  return (
    <div>
      <div className="toolbar">
        <div className="toolbar-left">
          <select
            className="filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as PaymentStatus | 'All')}
          >
            <option value="All">Trạng thái</option>
            <option value="ChuaThanhToan">Chưa thanh toán</option>
            <option value="ThanhToanMotPhan">Thanh toán một phần</option>
            <option value="DaThanhToan">Đã thanh toán</option>
            <option value="QuaHan">Quá hạn</option>
          </select>
        </div>
        <Link className="btn btn-primary" to="/customer/payment">
          Thanh toán hóa đơn
        </Link>
      </div>

      <div className="panel">
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Số HD</th>
                <th>Ngày</th>
                <th>Tiền cọc</th>
                <th>Tiền thuê</th>
                <th>Thuế</th>
                <th>Tổng cộng</th>
                <th>Đã đóng</th>
                <th>Còn nợ</th>
                <th>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((i) => {
                const { deposit, rent } = getInvoiceBreakdown(i);
                const correctVat = rent * 0.1;
                const correctTotal = deposit + rent + correctVat;
                return (
                  <tr key={i.id}>
                    <td style={{ whiteSpace: 'nowrap' }}>{i.number}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>{formatDate(i.date)}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>{formatMoney(deposit)}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>{formatMoney(rent)}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>{formatMoney(correctVat)}</td>
                    <td style={{ whiteSpace: 'nowrap', fontWeight: 'bold' }}>{formatMoney(correctTotal)}</td>
                    <td style={{ whiteSpace: 'nowrap', color: 'var(--ok)' }}>{formatMoney(i.paidAmount)}</td>
                    <td style={{ whiteSpace: 'nowrap', color: 'var(--danger)', fontWeight: 'bold' }}>{formatMoney(correctTotal - i.paidAmount)}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <NhanTrangThaiThanhToan status={i.status} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="pagination">
          <span>Tổng số hóa đơn: {rows.length} | Tổng tiền: {formatMoney(total)}</span>
        </div>
      </div>
    </div>
  );
}
