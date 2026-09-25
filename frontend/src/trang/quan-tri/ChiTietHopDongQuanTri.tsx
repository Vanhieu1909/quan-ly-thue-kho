import { Link, useNavigate, useParams } from 'react-router-dom';
import { areas as seedAreas, contracts as seedContracts, customers as seedCustomers, invoices as seedInvoices, billingCycles as seedBillingCycles } from '../../du-lieu/duLieuMau';
import { areaTypeLabel, formatDate, formatMoney } from '../../thu-vien/dinhDang';
import { NhanTrangThaiHopDong, NhanTrangThaiThanhToan } from '../../thanh-phan/NhanTrangThai';
import { useState, useEffect } from 'react';
import type { Customer } from '../../kieu';

export function ChiTietHopDongQuanTri() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [areas, setAreas] = useState(seedAreas);
  const [contracts, setContracts] = useState(seedContracts);
  const [customers, setCustomers] = useState<Customer[]>(seedCustomers);
  const [invoices, setInvoices] = useState(seedInvoices);
  const [billingCycles, setBillingCycles] = useState(seedBillingCycles);

  useEffect(() => {
    const lAreas = localStorage.getItem('mock_areas');
    const lContracts = localStorage.getItem('mock_contracts');
    const lCustomers = localStorage.getItem('mock_customers');
    const lInvoices = localStorage.getItem('mock_invoices');
    const lBilling = localStorage.getItem('mock_billingCycles');
    if (lAreas) setAreas(JSON.parse(lAreas));
    if (lContracts) setContracts(JSON.parse(lContracts));
    if (lCustomers) setCustomers(JSON.parse(lCustomers));
    if (lInvoices) setInvoices(JSON.parse(lInvoices));
    if (lBilling) setBillingCycles(JSON.parse(lBilling));
  }, []);

  const contract = contracts.find((c) => c.id === id);

  if (!contract) {
    return (
      <div className="stack">
        <div className="panel">
          <div className="panel-bd" style={{ textAlign: 'center', padding: '48px 0' }}>
            <p style={{ color: 'var(--muted)', marginBottom: 16 }}>Không tìm thấy hợp đồng.</p>
            <button className="btn btn-secondary" onClick={() => navigate('/admin/contracts')}>
              Quay lại danh sách
            </button>
          </div>
        </div>
      </div>
    );
  }

  const allAreaIds = contract.areaIds ?? [contract.areaId];
  const contractAreas = allAreaIds.map(id => areas.find(a => a.id === id)).filter(Boolean) as typeof areas;
  const customer = customers.find((c) => c.id === contract.customerId);
  const cycleIds = billingCycles.filter((bc) => bc.contractId === contract.id).map(bc => bc.id);
  const schedule = invoices.filter((i) => cycleIds.includes(i.billingCycleId) || i.billingCycleId === contract.id);

  function handleCancelContract() {
    if (!contract) return;
    if (window.confirm(`Bạn có chắc chắn muốn hủy hợp đồng này không?\n\nThao tác này sẽ giải phóng ${contractAreas.length} khu vực kho.`)) {
      const updatedContracts = contracts.map(c => c.id === contract.id ? { ...c, status: 'DaHuy' as const } : c);
      setContracts(updatedContracts);
      localStorage.setItem('mock_contracts', JSON.stringify(updatedContracts));
      
      // Giải phóng tất cả khu vực
      const updatedAreas = areas.map(a =>
        allAreaIds.includes(a.id) ? { ...a, status: 'Trong' as const } : a
      );
      setAreas(updatedAreas);
      localStorage.setItem('mock_areas', JSON.stringify(updatedAreas));

      window.dispatchEvent(new Event('storage'));
      alert('Đã hủy hợp đồng thành công!');
    }
  }

  return (
    <div className="stack">
      <div style={{ display: 'flex', gap: 8 }}>
        <Link className="btn btn-secondary" to="/admin/contracts">
          Quay lại
        </Link>
        {contract.status === 'DangHieuLuc' && (
          <button className="btn btn-danger" onClick={handleCancelContract} style={{ backgroundColor: 'var(--danger)', color: 'white' }}>
            Hủy hợp đồng
          </button>
        )}
      </div>

      <div className="panel">
        <div className="panel-hd">
          <h2>Thông tin chung · {contract.code}</h2>
          <NhanTrangThaiHopDong status={contract.status} />
        </div>
        <div className="panel-bd detail-grid">
          <div className="detail-item">
            <label>Khách hàng</label>
            <strong>{customer?.name ?? '—'}</strong>
          </div>
          <div className="detail-item">
            <label>Mã KH</label>
            <strong>{customer?.code ?? '—'}</strong>
          </div>
          <div className="detail-item">
            <label>Điện thoại</label>
            <strong>{customer?.phone ?? '—'}</strong>
          </div>
          <div className="detail-item">
            <label>Email</label>
            <strong>{customer?.email ?? '—'}</strong>
          </div>
          <div className="detail-item">
            <label>Khu vực ({contractAreas.length})</label>
            <strong>{contractAreas.map(a => a.code).join(', ') || '—'}</strong>
          </div>
          <div className="detail-item">
            <label>Tổng sức chứa</label>
            <strong>{contract.capacity} {contract.rentalUnit}</strong>
          </div>
          <div className="detail-item">
            <label>Loại khu vực</label>
            <strong>{contractAreas.length > 0 ? areaTypeLabel[contractAreas[0].type] : '—'}</strong>
          </div>
          <div className="detail-item">
            <label>Thời hạn</label>
            <strong>
              {formatDate(contract.startDate)} – {formatDate(contract.endDate)}
            </strong>
          </div>
          <div className="detail-item">
            <label>Chu kỳ TT</label>
            <strong>
              {contract.paymentCycle === 'Thang' ? 'Theo tháng'
                : contract.paymentCycle === 'Quy' ? 'Theo quý'
                : 'Theo năm'}
            </strong>
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-hd">
          <h2>Thông tin tài chính</h2>
        </div>
        <div className="panel-bd">
          <div className="summary-box">
            <div className="row">
              <span>Đơn giá</span>
              <strong>{formatMoney(contract.unitPrice)}/m²/tháng</strong>
            </div>
            <div className="row">
              <span>Tiền thuê</span>
              <strong>{formatMoney(contract.monthlyRent)}</strong>
            </div>
            <div className="row">
              <span>Phí dịch vụ</span>
              <strong>{formatMoney(contract.serviceFee)}</strong>
            </div>
            <div className="row">
              <span>Tiền cọc</span>
              <strong>{formatMoney(contract.deposit)}</strong>
            </div>
            <div className="row total">
              <span>Tổng / kỳ</span>
              <strong>{formatMoney(contract.monthlyRent + contract.serviceFee)}</strong>
            </div>
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-hd">
          <h2>Lịch sử thanh toán</h2>
        </div>
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Kỳ TT</th>
                <th>Ngày đến hạn</th>
                <th>Tiền</th>
                <th>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {schedule.map((i) => (
                <tr key={i.id}>
                  <td>{i.period}</td>
                  <td>{formatDate(i.dueDate)}</td>
                  <td>{formatMoney(i.total)}</td>
                  <td>
                    <NhanTrangThaiThanhToan status={i.status} />
                  </td>
                </tr>
              ))}
              {schedule.length === 0 && (
                <tr>
                  <td colSpan={4}>
                    <div className="empty">Chưa có kỳ thanh toán</div>
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
