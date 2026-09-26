import { useMemo, useState, useEffect } from 'react';
import { Plus, Printer, CheckCircle } from 'lucide-react';
import { contracts as seedContracts, customers as seedCustomers, invoices as seed, billingCycles as seedBillingCycles } from '../../du-lieu/duLieuMau';
import type { Invoice, PaymentStatus } from '../../kieu';
import { formatDate, formatMoney, getVatRate, getVatPercentLabel } from '../../thu-vien/dinhDang';
import { NhanTrangThaiThanhToan } from '../../thanh-phan/NhanTrangThai';
import { HopThoai } from '../../thanh-phan/HopThoai';

export function QuanLyHoaDon() {
  const [rows, setRows] = useState<Invoice[]>(() => {
    const saved = localStorage.getItem('mock_invoices');
    return saved ? JSON.parse(saved) : seed;
  });
  
  const [customers, setCustomers] = useState(seedCustomers);
  const [contracts, setContracts] = useState(seedContracts);
  const [billingCycles, setBillingCycles] = useState(seedBillingCycles);

  useEffect(() => {
    const lCust = localStorage.getItem('mock_customers');
    const lCont = localStorage.getItem('mock_contracts');
    const lBill = localStorage.getItem('mock_billingCycles');
    if (lCust) setCustomers(JSON.parse(lCust));
    if (lCont) setContracts(JSON.parse(lCont));
    if (lBill) setBillingCycles(JSON.parse(lBill));
  }, []);

  const [statusFilter, setStatusFilter] = useState<PaymentStatus | 'All'>('All');
  const [open, setOpen] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [payingInvoice, setPayingInvoice] = useState<Invoice | null>(null);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('ChuyenKhoan');
  const [form, setForm] = useState({
    customerId: '',
    contractId: '',
    period: 'Tháng 9/2026',
    content: '',
    date: new Date().toISOString().slice(0, 10),
  });

  const filtered = useMemo(
    () => (statusFilter === 'All' ? rows : rows.filter((i) => i.status === statusFilter)),
    [rows, statusFilter],
  );

  const selectedContract = contracts.find((c) => c.id === form.contractId);
  const amountBeforeTax = selectedContract
    ? selectedContract.monthlyRent + selectedContract.serviceFee
    : 0;
  const vat = Math.round(amountBeforeTax * getVatRate());
  const total = amountBeforeTax + vat;

  const monthTotal = rows
    .filter((i) => i.date.startsWith('2026-08'))
    .reduce((s, i) => s + i.amountBeforeTax, 0);

  function save() {
    if (!form.customerId || !form.contractId) return;
    const rawBilling = localStorage.getItem('mock_billingCycles');
    const allBilling = rawBilling ? JSON.parse(rawBilling) : billingCycles;
    const bcId = `bc${Date.now()}`;
    const newBc = {
      id: bcId,
      contractId: form.contractId,
      startDate: form.date,
      endDate: form.date,
      dueDate: '2026-09-05',
      totalAmount: total,
      status: 'INVOICED',
    };
    localStorage.setItem('mock_billingCycles', JSON.stringify([newBc, ...allBilling]));

    const next: Invoice = {
      id: `i${Date.now()}`,
      number: `HD-2026-${String(rows.length + 90)}`,
      date: form.date,
      customerId: form.customerId,
      billingCycleId: bcId,
      period: form.period,
      content: form.content || `Tiền thuê ${form.period}`,
      amountBeforeTax,
      vat,
      total,
      dueDate: '2026-09-05',
      status: 'ChuaThanhToan',
      paidAmount: 0,
      debtAmount: total,
    };
    const updated = [next, ...rows];
    setRows(updated);
    localStorage.setItem('mock_invoices', JSON.stringify(updated));

    // Update customer debt
    const rawCust = localStorage.getItem('mock_customers');
    if (rawCust) {
      const custs = JSON.parse(rawCust);
      const updatedCusts = custs.map((c: any) =>
        c.id === form.customerId ? { ...c, debt: (c.debt || 0) + total } : c
      );
      localStorage.setItem('mock_customers', JSON.stringify(updatedCusts));
    }

    window.dispatchEvent(new Event('storage'));
    setOpen(false);
  }

  function openPay(inv: Invoice) {
    const { deposit, rent } = getInvoiceBreakdown(inv);
    const correctTotal = deposit + rent + rent * 0.1;
    const remaining = correctTotal - inv.paidAmount;
    setPayingInvoice(inv);
    setPayAmount(String(Math.round(remaining)));
    setPayMethod('ChuyenKhoan');
    setPayOpen(true);
  }

  function handlePayment() {
    if (!payingInvoice || !payAmount) return;
    const amount = Number(payAmount);
    if (amount <= 0) { alert('Số tiền phải lớn hơn 0!'); return; }

    const { deposit, rent } = getInvoiceBreakdown(payingInvoice);
    const correctTotal = deposit + rent + rent * 0.1;
    const newPaid = payingInvoice.paidAmount + amount;
    const newDebt = correctTotal - newPaid;
    const newStatus: PaymentStatus =
      newDebt <= 0 ? 'DaThanhToan'
      : newPaid > 0 ? 'ThanhToanMotPhan'
      : 'ChuaThanhToan';

    // Update invoice
    const updatedInvoices = rows.map((i) =>
      i.id === payingInvoice.id
        ? { ...i, paidAmount: newPaid, debtAmount: Math.max(0, newDebt), status: newStatus }
        : i
    );
    setRows(updatedInvoices);
    localStorage.setItem('mock_invoices', JSON.stringify(updatedInvoices));

    // Create Thu transaction
    const customer = customers.find((c) => c.id === payingInvoice.customerId);
    const rawTrans = localStorage.getItem('mock_transactions');
    const allTrans = rawTrans ? JSON.parse(rawTrans) : [];
    const newTrans = {
      id: `t${Date.now()}`,
      date: new Date().toISOString().slice(0, 10),
      type: 'Thu',
      category: 'ThuTien',
      amount,
      method: payMethod,
      content: `Thu tiền HĐ ${payingInvoice.number} - ${customer?.name || ''}`,
      customerId: payingInvoice.customerId,
      status: 'XacNhan',
    };
    localStorage.setItem('mock_transactions', JSON.stringify([newTrans, ...allTrans]));

    // Activate Contract if it was ChoHieuLuc and deposit is paid or invoice is DaThanhToan
    if (newStatus === 'DaThanhToan' || (deposit > 0 && newPaid >= deposit)) {
      const bc = billingCycles.find(b => b.id === payingInvoice.billingCycleId);
      const targetContractId = bc ? bc.contractId : payingInvoice.billingCycleId;
      const rawContracts = localStorage.getItem('mock_contracts');
      if (rawContracts) {
         let localContracts = JSON.parse(rawContracts);
         let found = localContracts.find((c: any) => c.id === targetContractId);
         if (found && found.status === 'ChoHieuLuc') {
            localContracts = localContracts.map((c: any) => c.id === targetContractId ? { ...c, status: 'DangHieuLuc' } : c);
            localStorage.setItem('mock_contracts', JSON.stringify(localContracts));
         }
      }
    }

    // Update customer debt
    const rawCust = localStorage.getItem('mock_customers');
    if (rawCust) {
      const custs = JSON.parse(rawCust);
      const updatedCusts = custs.map((c: any) =>
        c.id === payingInvoice.customerId ? { ...c, debt: Math.max(0, (c.debt || 0) - amount) } : c
      );
      localStorage.setItem('mock_customers', JSON.stringify(updatedCusts));
    }

    window.dispatchEvent(new Event('storage'));
    setPayOpen(false);
    setPayingInvoice(null);
    alert(`✅ Ghi nhận thu ${formatMoney(amount)} thành công!`);
  }

  function getInvoiceBreakdown(inv: any) {
    const bc = billingCycles.find(b => b.id === inv.billingCycleId);
    const contract = contracts.find(c => c.id === bc?.contractId || c.id === inv.billingCycleId);
    let deposit = 0;
    let rent = inv.amountBeforeTax;
    if (inv.content.toLowerCase().includes('cọc') && contract) {
      deposit = contract.deposit;
      rent = inv.amountBeforeTax - deposit;
    }
    return { deposit, rent };
  }

  function inHoaDon(i: Invoice) {
    const { deposit, rent } = getInvoiceBreakdown(i);
    const customer = customers.find(c => c.id === i.customerId);
    const correctVat = rent * 0.1;
    const correctTotal = deposit + rent + correctVat;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>In Hóa Đơn ${i.number}</title>
          <style>
            body { font-family: sans-serif; padding: 40px; color: #333; max-width: 800px; margin: 0 auto; }
            .header { text-align: center; margin-bottom: 40px; }
            .header h1 { margin: 0; color: #1a4f31; }
            .info { margin-bottom: 30px; line-height: 1.6; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            th, td { padding: 12px; border: 1px solid #ddd; text-align: left; }
            th { background-color: #f5f5f5; }
            .total { text-align: right; font-size: 1.2rem; margin-top: 20px; line-height: 1.8; }
            .footer { text-align: center; margin-top: 50px; font-style: italic; color: #666; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>HÓA ĐƠN THANH TOÁN</h1>
            <p>Số HĐ: <strong>${i.number}</strong> | Ngày lập: ${formatDate(i.date)}</p>
          </div>
          <div class="info">
            <strong>Khách hàng:</strong> ${customer?.name || '---'}<br/>
            <strong>Kỳ thanh toán:</strong> ${i.period}<br/>
            <strong>Nội dung:</strong> ${i.content}<br/>
          </div>
          <table>
            <thead>
              <tr>
                <th>STT</th>
                <th>Diễn giải</th>
                <th style="text-align: right">Thành tiền</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>1</td>
                <td>Tiền cọc</td>
                <td style="text-align: right">${formatMoney(deposit)}</td>
              </tr>
              <tr>
                <td>2</td>
                <td>Tiền thuê & Phí dịch vụ</td>
                <td style="text-align: right">${formatMoney(rent)}</td>
              </tr>
              <tr>
                <td>3</td>
                <td>Thuế VAT (10%)</td>
                <td style="text-align: right">${formatMoney(correctVat)}</td>
              </tr>
            </tbody>
          </table>
          <div class="total">
            Tổng cộng: <strong>${formatMoney(correctTotal)}</strong><br/>
            Đã thanh toán: <strong style="color: #2e7d32">${formatMoney(i.paidAmount)}</strong><br/>
            <span style="color: #d32f2f">Còn nợ: <strong>${formatMoney(correctTotal - i.paidAmount)}</strong></span>
          </div>
          <div class="footer">
            Cảm ơn quý khách đã sử dụng dịch vụ của chúng tôi!<br/>
            <em>(Hóa đơn xuất từ Hệ thống Quản lý Thuê Kho)</em>
          </div>
          <script>
            window.onload = () => { window.print(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  }

  return (
    <div>
      <div className="toolbar">
        <div className="toolbar-left">
          <select className="filter-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as PaymentStatus | 'All')}>
            <option value="All">Trạng thái</option>
            <option value="ChuaThanhToan">Chưa thanh toán</option>
            <option value="ThanhToanMotPhan">Thanh toán một phần</option>
            <option value="DaThanhToan">Đã thanh toán</option>
            <option value="QuaHan">Quá hạn</option>
          </select>
        </div>
        <div className="toolbar-right">
          <button className="btn btn-primary" onClick={() => setOpen(true)}>
            <Plus size={16} /> Lập hóa đơn
          </button>
        </div>
      </div>

      <div className="panel">
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Số hóa đơn</th>
                <th>Khách hàng</th>
                <th>Tiền cọc</th>
                <th>Tiền thuê</th>
                <th>Thuế VAT</th>
                <th>Tổng cộng</th>
                <th>Đã đóng</th>
                <th>Còn nợ</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((i) => {
                const { deposit, rent } = getInvoiceBreakdown(i);
                const correctVat = rent * 0.1;
                const correctTotal = deposit + rent + correctVat;
                return (
                <tr key={i.id}>
                  <td style={{ whiteSpace: 'nowrap' }}>{i.number}<br/><span style={{ fontSize: '0.8rem', color: 'gray' }}>{formatDate(i.date)}</span></td>
                  <td style={{ whiteSpace: 'nowrap' }}>{customers.find((c) => c.id === i.customerId)?.name}</td>
                  <td style={{ whiteSpace: 'nowrap' }}>{formatMoney(deposit)}</td>
                  <td style={{ whiteSpace: 'nowrap' }}>{formatMoney(rent)}</td>
                  <td style={{ whiteSpace: 'nowrap' }}>{formatMoney(correctVat)}</td>
                  <td style={{ whiteSpace: 'nowrap', fontWeight: 'bold' }}>{formatMoney(correctTotal)}</td>
                  <td style={{ whiteSpace: 'nowrap', color: 'var(--ok)' }}>{formatMoney(i.paidAmount)}</td>
                  <td style={{ whiteSpace: 'nowrap', color: 'var(--danger)', fontWeight: 'bold' }}>{formatMoney(correctTotal - i.paidAmount)}</td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    <NhanTrangThaiThanhToan status={i.status} />
                  </td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => inHoaDon(i)} title="In hóa đơn">
                      <Printer size={14} />
                    </button>
                    {i.status !== 'DaThanhToan' && (
                      <button
                        className="btn btn-ghost btn-sm"
                        style={{ color: 'var(--ok)' }}
                        onClick={() => openPay(i)}
                        title="Ghi nhận thu tiền"
                      >
                        <CheckCircle size={14} /> Thu
                      </button>
                    )}
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="pagination">
          <span>TỔNG HÓA ĐƠN THÁNG 8: {formatMoney(monthTotal)}</span>
        </div>
      </div>

      <HopThoai
        open={open}
        title="Lập hóa đơn"
        onClose={() => setOpen(false)}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setOpen(false)}>
              Hủy
            </button>
            <button className="btn btn-primary" onClick={save}>
              Lưu
            </button>
          </>
        }
      >
        <div className="field">
          <label>Số hóa đơn</label>
          <input value={`HD-2026-${rows.length + 90}`} disabled />
        </div>
        <div className="field-row">
          <div className="field">
            <label>Ngày lập</label>
            <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          </div>
          <div className="field">
            <label>Kỳ thanh toán</label>
            <input value={form.period} onChange={(e) => setForm({ ...form, period: e.target.value })} />
          </div>
        </div>
        <div className="field">
          <label>
            Khách hàng <span className="req">*</span>
          </label>
          <select
            value={form.customerId}
            onChange={(e) => setForm({ ...form, customerId: e.target.value, contractId: '' })}
          >
            <option value="">Chọn khách hàng</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>
            Hợp đồng <span className="req">*</span>
          </label>
          <select value={form.contractId} onChange={(e) => setForm({ ...form, contractId: e.target.value })}>
            <option value="">Chọn hợp đồng</option>
            {contracts
              .filter((c) => !form.customerId || c.customerId === form.customerId)
              .filter((c) => c.status === 'DangHieuLuc' || c.status === 'SapHetHan')
              .map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code}
                </option>
              ))}
          </select>
        </div>
        <div className="field">
          <label>Nội dung</label>
          <input value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} placeholder="Tiền thuê tháng..." />
        </div>
        <div className="summary-box">
          <div className="row">
            <span>Tiền chưa thuế</span>
            <strong>{formatMoney(amountBeforeTax)}</strong>
          </div>
          <div className="row">
            <span>Thuế GTGT ({getVatPercentLabel()})</span>
            <strong>{formatMoney(vat)}</strong>
          </div>
          <div className="row total">
            <span>Tổng tiền</span>
            <strong>{formatMoney(total)}</strong>
          </div>
          <div className="row">
            <span>Hạn thanh toán</span>
            <strong>05/09/2026</strong>
          </div>
        </div>
      </HopThoai>

      {/* Dialog ghi nhận thu tiền */}
      <HopThoai
        open={payOpen}
        title="Ghi nhận thu tiền"
        onClose={() => setPayOpen(false)}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setPayOpen(false)}>
              Hủy
            </button>
            <button className="btn btn-primary" onClick={handlePayment}>
              Xác nhận thu
            </button>
          </>
        }
      >
        {payingInvoice && (() => {
          const { deposit, rent } = getInvoiceBreakdown(payingInvoice);
          const correctTotal = deposit + rent + rent * 0.1;
          const remaining = correctTotal - payingInvoice.paidAmount;
          const customer = customers.find(c => c.id === payingInvoice.customerId);
          return (
            <>
              <div className="summary-box" style={{ marginBottom: 12 }}>
                <div className="row">
                  <span>Hóa đơn</span>
                  <strong>{payingInvoice.number}</strong>
                </div>
                <div className="row">
                  <span>Khách hàng</span>
                  <strong>{customer?.name}</strong>
                </div>
                <div className="row">
                  <span>Tổng hóa đơn</span>
                  <strong>{formatMoney(Math.round(correctTotal))}</strong>
                </div>
                <div className="row">
                  <span>Đã thanh toán</span>
                  <strong style={{ color: 'var(--ok)' }}>{formatMoney(payingInvoice.paidAmount)}</strong>
                </div>
                <div className="row total">
                  <span>Còn lại cần thu</span>
                  <strong style={{ color: 'var(--danger)' }}>{formatMoney(Math.round(remaining))}</strong>
                </div>
              </div>
              <div className="field">
                <label>Số tiền thu <span className="req">*</span></label>
                <input
                  type="number"
                  min={1}
                  max={Math.round(remaining)}
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                />
              </div>
              <div className="field">
                <label>Phương thức</label>
                <select value={payMethod} onChange={(e) => setPayMethod(e.target.value)}>
                  <option value="ChuyenKhoan">Chuyển khoản</option>
                  <option value="TienMat">Tiền mặt</option>
                </select>
              </div>
            </>
          );
        })()}
      </HopThoai>
    </div>
  );
}
