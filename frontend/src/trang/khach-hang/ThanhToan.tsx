import { useMemo, useState, useEffect } from 'react';
import { invoices as seed, contracts as seedContracts, billingCycles as seedBillingCycles } from '../../du-lieu/duLieuMau';
import { dungXacThuc } from '../../boi-canh/BoiCanhXacThuc';
import { formatMoney } from '../../thu-vien/dinhDang';

export function ThanhToan() {
  const { account } = dungXacThuc();
  const customerId = account?.customerId;
  
  const [invoices, setInvoices] = useState(seed);
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

  const unpaid = useMemo(() => invoices.filter((i) => i.customerId === customerId && i.status !== 'DaThanhToan'), [invoices, customerId]);
  
  const [selected, setSelected] = useState<string[]>([]);
  // Store payment option per invoice: 'FULL' | 'SPLIT' | 'DEPOSIT_ONLY'
  const [payOptions, setPayOptions] = useState<Record<string, 'FULL' | 'SPLIT' | 'DEPOSIT_ONLY'>>({});
  const [done, setDone] = useState(false);

  // Initialize selection
  useEffect(() => {
    if (unpaid.length > 0 && selected.length === 0) {
      setSelected(unpaid.map(i => i.id));
      const initOpts: any = {};
      unpaid.forEach(i => initOpts[i.id] = 'FULL');
      setPayOptions(initOpts);
    }
  }, [unpaid]);

  function toggle(id: string) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function getInvoiceBreakdown(inv: any) {
    const bc = billingCycles.find(b => b.id === inv.billingCycleId);
    const contract = contracts.find(c => c.id === bc?.contractId || c.id === inv.billingCycleId);
    
    // Default fallback
    let deposit = 0;
    let rent = inv.amountBeforeTax;
    
    // If it's an initial invoice (contains deposit)
    if (inv?.content?.toLowerCase()?.includes('cọc') && contract) {
      deposit = contract.deposit || 0;
      rent = (inv.amountBeforeTax || 0) - deposit;
    }
    
    return { deposit, rent, contract };
  }

  const total = unpaid
    .filter((i) => selected.includes(i.id))
    .reduce((s, i) => {
      let payAmt = 0;
      const { deposit, rent } = getInvoiceBreakdown(i);
      const vat = rent * 0.1;
      const correctTotal = deposit + rent + vat;
      const opt = payOptions[i.id] || (deposit > 0 ? 'DEPOSIT_ONLY' : 'FULL');
      
      if (i.paidAmount === 0) {
        if (opt === 'DEPOSIT_ONLY' || opt === 'SPLIT') {
          payAmt = deposit;
        } else {
          payAmt = correctTotal;
        }
      } else {
        payAmt = correctTotal - i.paidAmount;
      }
      return s + Math.max(0, payAmt);
    }, 0);

  return (
    <div className="stack">
      <div className="summary-box">
        <div className="row">
          <span>Khách hàng</span>
          <strong>{account?.name}</strong>
        </div>
        <div className="row">
          <span>Số dư ước tính phải trả đợt này</span>
          <strong style={{ fontSize: '1.2rem', color: 'var(--primary)' }}>{formatMoney(total)}</strong>
        </div>
      </div>

      {done ? (
        <div className="panel">
          <div className="panel-bd empty" style={{ color: 'var(--ok)' }}>
            Đã gửi xác nhận thanh toán {formatMoney(total)}. Kế toán sẽ đối chiếu và cập nhật công nợ.
          </div>
        </div>
      ) : (
        <>
          <div className="panel">
            <div className="panel-hd">
              <h2>Chi tiết các khoản thanh toán</h2>
            </div>
            <div className="table-wrap">
              <table className="data">
                <thead>
                  <tr>
                    <th></th>
                    <th>Số HĐ</th>
                    <th>Tiền cọc</th>
                    <th>Tiền thuê & Dịch vụ</th>
                    <th>Thuế (10%)</th>
                    <th>Đã thanh toán</th>
                    <th>Còn nợ</th>
                  </tr>
                </thead>
                <tbody>
                  {unpaid.map((i) => {
                    const { deposit, rent } = getInvoiceBreakdown(i);
                    const vat = rent * 0.1;
                    const correctTotal = deposit + rent + vat;
                    const isSelected = selected.includes(i.id);
                    return (
                      <tr key={i.id} style={{ opacity: isSelected ? 1 : 0.5 }}>
                        <td>
                          <input type="checkbox" checked={isSelected} onChange={() => toggle(i.id)} />
                        </td>
                        <td style={{ whiteSpace: 'nowrap' }}>{i.number}<br/><span style={{ fontSize: '0.8rem', color: 'gray' }}>{i.period}</span></td>
                        <td style={{ whiteSpace: 'nowrap' }}>{formatMoney(deposit)}</td>
                        <td style={{ whiteSpace: 'nowrap' }}>{formatMoney(rent)}</td>
                        <td style={{ whiteSpace: 'nowrap' }}>{formatMoney(vat)}</td>
                        <td style={{ color: 'var(--ok)', whiteSpace: 'nowrap' }}>{formatMoney(i.paidAmount)}</td>
                        <td style={{ color: 'var(--danger)', fontWeight: 'bold', whiteSpace: 'nowrap' }}>{formatMoney(correctTotal - i.paidAmount)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="panel">
            <div className="panel-hd">
              <h2>Phương án thanh toán</h2>
            </div>
            <div className="panel-bd stack">
              {unpaid.filter(i => selected.includes(i.id)).map(i => {
                const { deposit, rent } = getInvoiceBreakdown(i);
                const vat = rent * 0.1;
                const correctTotal = deposit + rent + vat;
                const opt = payOptions[i.id] || (deposit > 0 ? 'DEPOSIT_ONLY' : 'FULL');
                
                return (
                  <div key={i.id} style={{ padding: 16, border: '1px solid var(--border)', borderRadius: 8, background: 'var(--bg-card, #fff)' }}>
                    <div style={{ fontWeight: 'bold', marginBottom: 12, fontSize: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: 6 }}>
                      Hóa đơn: {i.number}
                    </div>
                    {i.paidAmount > 0 ? (
                      <div style={{ padding: '10px 14px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 6 }}>
                        <div style={{ color: 'var(--ok)', fontWeight: 'bold', marginBottom: 4 }}>
                          ✓ Đã thanh toán tiền cọc: {formatMoney(i.paidAmount)}
                        </div>
                        <div style={{ color: 'var(--primary)', fontWeight: 'bold' }}>
                          ➜ Thanh toán tiền thuê kho & thuế VAT còn lại: {formatMoney(correctTotal - i.paidAmount)}
                        </div>
                      </div>
                    ) : deposit > 0 ? (
                      <div className="stack" style={{ gap: 10 }}>
                        <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', padding: 8, borderRadius: 6, border: opt === 'FULL' ? '1px solid var(--primary)' : '1px solid transparent', background: opt === 'FULL' ? 'var(--bg-subtle, #f0fdf4)' : 'transparent' }}>
                          <input
                            type="radio"
                            name={`pay_opt_${i.id}`}
                            checked={opt === 'FULL'}
                            onChange={() => setPayOptions(p => ({ ...p, [i.id]: 'FULL' }))}
                            style={{ marginTop: 3 }}
                          />
                          <div>
                            <strong>Thanh toán toàn bộ</strong> (100% Tiền cọc + 100% Tiền thuê & Dịch vụ + Thuế VAT = {formatMoney(correctTotal)})
                          </div>
                        </label>
                        <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', padding: 8, borderRadius: 6, border: (opt === 'DEPOSIT_ONLY' || opt === 'SPLIT') ? '1px solid var(--primary)' : '1px solid transparent', background: (opt === 'DEPOSIT_ONLY' || opt === 'SPLIT') ? 'var(--bg-subtle, #f0fdf4)' : 'transparent' }}>
                          <input
                            type="radio"
                            name={`pay_opt_${i.id}`}
                            checked={opt === 'DEPOSIT_ONLY' || opt === 'SPLIT'}
                            onChange={() => setPayOptions(p => ({ ...p, [i.id]: 'DEPOSIT_ONLY' }))}
                            style={{ marginTop: 3 }}
                          />
                          <div>
                            <strong>Thanh toán tiền cọc</strong> (100% Tiền cọc = {formatMoney(deposit)} để giữ chỗ & kích hoạt hợp đồng)
                            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: 4 }}>
                              * Tiền thuê kho & thuế VAT ({formatMoney(rent + vat)}) sẽ thanh toán trước khi nhận bàn giao kho.
                            </div>
                          </div>
                        </label>
                      </div>
                    ) : (
                      <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                        <input type="radio" checked readOnly />
                        <span><strong>Thanh toán toàn bộ</strong> ({formatMoney(correctTotal)})</span>
                      </label>
                    )}
                  </div>
                );
              })}
              
              {total > 0 && (
                <div style={{ textAlign: 'center', margin: '24px 0' }}>
                  <img
                    src={`https://img.vietqr.io/image/vietcombank-1012345678-compact2.png?amount=${total}&addInfo=Thanh toan tien thue kho`}
                    alt="Mã QR thanh toán"
                    style={{ maxWidth: 200, border: '1px solid var(--border)', borderRadius: 8 }}
                  />
                  <p style={{ marginTop: 8, color: 'var(--text-muted)' }}>Quét mã QR để thanh toán: <strong>{formatMoney(total)}</strong></p>
                </div>
              )}
              <div className="summary-box" style={{ marginTop: 16 }}>
                <div className="row">
                  <span>Tiền thuê kho & Dịch vụ</span>
                  <strong>{formatMoney(unpaid.filter(i => selected.includes(i.id)).reduce((s, i) => s + getInvoiceBreakdown(i).rent, 0))}</strong>
                </div>
                <div className="row">
                  <span>Tiền đặt cọc (Không tính thuế)</span>
                  <strong>{formatMoney(unpaid.filter(i => selected.includes(i.id)).reduce((s, i) => s + getInvoiceBreakdown(i).deposit, 0))}</strong>
                </div>
                <div className="row">
                  <span>Thuế VAT (10% của tiền thuê)</span>
                  <strong>{formatMoney(unpaid.filter(i => selected.includes(i.id)).reduce((s, i) => {
                     const { rent } = getInvoiceBreakdown(i);
                     return s + (rent * 0.1);
                  }, 0))}</strong>
                </div>
                <div className="row" style={{ marginTop: 8, paddingTop: 8, borderTop: '1px dotted var(--border)' }}>
                  <span>Tổng giá trị hóa đơn</span>
                  <strong>{formatMoney(unpaid.filter(i => selected.includes(i.id)).reduce((s, i) => {
                     const { deposit, rent } = getInvoiceBreakdown(i);
                     return s + deposit + rent + (rent * 0.1);
                  }, 0))}</strong>
                </div>
                <hr style={{ margin: '12px 0', border: 'none', borderTop: '1px dashed var(--border)' }} />
                {unpaid.filter(i => selected.includes(i.id)).some(i => i.paidAmount > 0) && (
                  <div className="row">
                    <span>Tiền đã đặt cọc / Đã thanh toán trước</span>
                    <strong style={{ color: 'var(--ok)' }}>{formatMoney(unpaid.filter(i => selected.includes(i.id)).reduce((s, i) => s + i.paidAmount, 0))}</strong>
                  </div>
                )}
                <div className="row total">
                  <span>SỐ TIỀN CẦN THANH TOÁN ĐỢT NÀY</span>
                  <strong style={{ fontSize: '1.3rem', color: 'var(--primary)' }}>{formatMoney(total)}</strong>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-primary" disabled={!selected.length} onClick={() => {
                  const saved = localStorage.getItem('mock_invoices');
                  const source = saved ? JSON.parse(saved) : seed;
                  
                  const rawContracts = localStorage.getItem('mock_contracts');
                  let localContracts = rawContracts ? JSON.parse(rawContracts) : contracts;
                  let contractUpdated = false;
                  
                  const rawTrans = localStorage.getItem('mock_transactions');
                  const allTrans = rawTrans ? JSON.parse(rawTrans) : [];
                  
                  for (const inv of source) {
                    if (selected.includes(inv.id)) {
                      const opt = payOptions[inv.id] || 'FULL';
                      const bc = billingCycles.find(b => b.id === inv.billingCycleId);
                      const contract = contracts.find(c => c.id === bc?.contractId || c.id === inv.billingCycleId);
                      let dep = 0;
                      let r = inv.amountBeforeTax || 0;
                      if (inv?.content?.toLowerCase()?.includes('cọc') && contract) {
                        dep = contract.deposit || 0;
                        r = (inv.amountBeforeTax || 0) - dep;
                      }
                      const correctTotal = dep + r + (r * 0.1);
                      let payAmt = correctTotal - inv.paidAmount;

                      if (opt === 'SPLIT' && inv.paidAmount === 0) {
                        const splitAmt = dep + (r / 2);
                        const splitVat = (r / 2) * 0.1;
                        payAmt = splitAmt + splitVat;
                      } else if (opt === 'DEPOSIT_ONLY' && inv.paidAmount === 0) {
                        payAmt = dep;
                      }
                      
                      inv.paidAmount += payAmt;
                      inv.total = correctTotal; // fix invoice total to correct total without deposit tax
                      inv.vat = r * 0.1; // fix vat on invoice
                      inv.debtAmount = Math.max(0, inv.total - inv.paidAmount);
                      inv.status = inv.paidAmount >= inv.total ? 'DaThanhToan' : 'ThanhToanMotPhan';
                      
                      // Create Transaction
                      allTrans.unshift({
                        id: `t${Date.now()}-${inv.id}`,
                        date: new Date().toISOString().slice(0, 10),
                        type: 'Thu',
                        category: 'ThuTien',
                        amount: payAmt,
                        method: 'ChuyenKhoan',
                        content: `Thanh toán HĐ ${inv.number}`,
                        customerId: inv.customerId,
                        invoiceId: inv.id,
                        status: 'XacNhan',
                      });
                      
                      // Activate contract if deposit is fully paid
                      if (inv.paidAmount >= dep && dep > 0) {
                         const targetContractId = bc ? bc.contractId : inv.billingCycleId;
                         const found = localContracts.find((c: any) => c.id === targetContractId);
                         if (found && found.status === 'ChoHieuLuc') {
                           found.status = 'DangHieuLuc';
                           contractUpdated = true;
                         }
                      } else if (inv.status === 'DaThanhToan') {
                         // Fallback in case there is no deposit
                         const targetContractId = bc ? bc.contractId : inv.billingCycleId;
                         const found = localContracts.find((c: any) => c.id === targetContractId);
                         if (found && found.status === 'ChoHieuLuc') {
                           found.status = 'DangHieuLuc';
                           contractUpdated = true;
                         }
                      }
                    }
                  }
                  
                  localStorage.setItem('mock_invoices', JSON.stringify(source));
                  localStorage.setItem('mock_transactions', JSON.stringify(allTrans));
                  if (contractUpdated) {
                    localStorage.setItem('mock_contracts', JSON.stringify(localContracts));
                  }

                  // Update customer debt
                  const rawCust = localStorage.getItem('mock_customers');
                  if (rawCust) {
                    const custs = JSON.parse(rawCust);
                    const updatedCusts = custs.map((c: any) =>
                      c.id === customerId ? { ...c, debt: Math.max(0, (c.debt || 0) - total) } : c
                    );
                    localStorage.setItem('mock_customers', JSON.stringify(updatedCusts));
                  }
                  
                  window.dispatchEvent(new Event('storage'));
                  setDone(true);
                }}>
                  Xác nhận thanh toán
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
