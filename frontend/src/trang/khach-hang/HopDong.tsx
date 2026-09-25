import { useMemo, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Eye } from 'lucide-react';
import { areas as seedAreas, contracts as seedContracts } from '../../du-lieu/duLieuMau';
import { dungXacThuc } from '../../boi-canh/BoiCanhXacThuc';
import type { ContractStatus, RentalRequest } from '../../kieu';
import { taiYeuCau, luuYeuCau } from '../../du-lieu/yeuCauLocal';
import { formatDate, formatMoney } from '../../thu-vien/dinhDang';
import { NhanTrangThaiHopDong } from '../../thanh-phan/NhanTrangThai';

export function HopDong() {
  const { account } = dungXacThuc();
  const customerId = account?.customerId;
  const [statusFilter, setStatusFilter] = useState<ContractStatus | 'All'>('All');
  
  const [areas, setAreas] = useState(seedAreas);
  const [contracts, setContracts] = useState(seedContracts);

  useEffect(() => {
    const lAreas = localStorage.getItem('mock_areas');
    const lContracts = localStorage.getItem('mock_contracts');
    if (lAreas) setAreas(JSON.parse(lAreas));
    if (lContracts) setContracts(JSON.parse(lContracts));
  }, []);

  const rows = useMemo(() => {
    const mine = contracts.filter((c) => c.customerId === customerId);
    return statusFilter === 'All' ? mine : mine.filter((c) => c.status === statusFilter);
  }, [contracts, customerId, statusFilter]);

  return (
    <div>
      <div className="toolbar">
        <div className="toolbar-left">
          <select
            className="filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as ContractStatus | 'All')}
          >
            <option value="All">Tất cả trạng thái</option>
            <option value="ChoHieuLuc">Chờ thanh toán cọc</option>
            <option value="DangHieuLuc">Đang hiệu lực</option>
            <option value="SapHetHan">Sắp hết hạn</option>
            <option value="DaKetThuc">Đã kết thúc</option>
          </select>
        </div>
        <button 
          className="btn btn-secondary"
          onClick={() => {
            const activeList = rows.filter(c => c.status === 'DangHieuLuc' || c.status === 'SapHetHan');
            if (activeList.length === 0) {
              alert('Bạn hiện không có hợp đồng nào đang hiệu lực để gia hạn.');
              return;
            }
            alert('Vui lòng bấm vào nút Xem chi tiết (👁) của hợp đồng bạn muốn gia hạn, sau đó chọn nút "Gia hạn".');
          }}
        >
          Gia hạn hợp đồng
        </button>
      </div>

      <div className="panel">
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>STT</th>
                <th>Mã hợp đồng</th>
                <th>Khu vực</th>
                <th>Diện tích</th>
                <th>Ngày bắt đầu</th>
                <th>Ngày kết thúc</th>
                <th>Tiền/tháng</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c, idx) => {
                const allIds = c.areaIds ?? [c.areaId];
                const areaLabel = allIds.map(id => areas.find(a => a.id === id)?.code).filter(Boolean).join(', ') || '—';
                return (
                <tr key={c.id}>
                  <td>{idx + 1}</td>
                  <td>{c.code}</td>
                  <td>{areaLabel}</td>
                  <td>{c.capacity} {c.rentalUnit}</td>
                  <td>{formatDate(c.startDate)}</td>
                  <td>{formatDate(c.endDate)}</td>
                  <td>{formatMoney(c.monthlyRent)}</td>
                  <td>
                    <NhanTrangThaiHopDong status={c.status} />
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <Link className="btn btn-ghost btn-sm" to={`/customer/contracts/${c.id}`} title="Xem chi tiết">
                        <Eye size={14} />
                      </Link>
                      {c.status === 'DangHieuLuc' && (
                        <button 
                          className="btn btn-ghost btn-sm" 
                          title="Hủy hợp đồng"
                          style={{ color: 'var(--danger)' }}
                          onClick={() => {
                            if (window.confirm(`Bạn có chắc chắn muốn hủy hợp đồng này không?\n\nLƯU Ý: Theo quy định, bạn sẽ MẤT TOÀN BỘ tiền đặt cọc (${formatMoney(c.deposit)}).\nThao tác này không thể hoàn tác.`)) {
                              const updatedContracts = contracts.map(ct => ct.id === c.id ? { ...ct, status: 'DaHuy' as const } : ct);
                              setContracts(updatedContracts);
                              localStorage.setItem('mock_contracts', JSON.stringify(updatedContracts));
                              
                              const cAreaIds = c.areaIds ?? [c.areaId];
                              const updatedAreas = areas.map(a => cAreaIds.includes(a.id) ? { ...a, status: 'Trong' as const } : a);
                              setAreas(updatedAreas);
                              localStorage.setItem('mock_areas', JSON.stringify(updatedAreas));
                              
                              
                              // Notify admin and staff
                              const reqs = taiYeuCau();
                              const cancelReq: RentalRequest = {
                                id: `cancel-${Date.now()}`,
                                code: `HỦY-${c.code}`,
                                customerName: account?.name || 'Khách hàng',
                                phone: account?.phone || '',
                                email: account?.email || '',
                                requestedCapacity: c.capacity,
                                rentalUnit: c.rentalUnit,
                                preferredType: 'Ke',
                                areaId: c.areaId,
                                startDate: c.startDate,
                                endDate: c.endDate,
                                date: new Date().toISOString().slice(0, 10),
                                status: 'Moi',
                                specialRequest: `[THÔNG BÁO HỦY HỢP ĐỒNG] Khách hàng đã chủ động hủy hợp đồng ${c.code}. Vui lòng dọn dẹp mặt bằng để đón khách mới.`,
                              };
                              luuYeuCau([cancelReq, ...reqs]);

                              window.dispatchEvent(new Event('storage'));
                              alert('Đã hủy hợp đồng thành công! Thông báo đã được gửi đến ban quản lý.');
                            }
                          }}
                        >
                          Hủy
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
