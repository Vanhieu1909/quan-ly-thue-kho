import { useState, useEffect } from 'react';
import {
  Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import {
  areas as seedAreas,
  contracts as seedContracts,
  customers as seedCustomers,
  invoices as seedInvoices,
} from '../../du-lieu/duLieuMau';
import type { Area, Contract, Customer, Invoice } from '../../kieu';
import { daysUntil, formatDate, formatMoney } from '../../thu-vien/dinhDang';
import { BangDieuKhien, TheThongKe } from '../../thanh-phan/TheThongKe';
import { NhanTrangThaiHopDong } from '../../thanh-phan/NhanTrangThai';

export function TongQuan() {
  const [areas, setAreas] = useState<Area[]>(seedAreas);
  const [contracts, setContracts] = useState<Contract[]>(seedContracts);
  const [customers, setCustomers] = useState<Customer[]>(seedCustomers);
  const [invoices, setInvoices] = useState<Invoice[]>(seedInvoices);

  useEffect(() => {
    const lAreas = localStorage.getItem('mock_areas');
    const lContracts = localStorage.getItem('mock_contracts');
    const lCustomers = localStorage.getItem('mock_customers');
    const lInvoices = localStorage.getItem('mock_invoices');
    if (lAreas) setAreas(JSON.parse(lAreas));
    if (lContracts) setContracts(JSON.parse(lContracts));
    if (lCustomers) setCustomers(JSON.parse(lCustomers));
    if (lInvoices) setInvoices(JSON.parse(lInvoices));
  }, []);

  // Thống kê khu vực
  const rentedM2 = areas.filter((a) => a.status === 'DaThue').reduce((s, a) => s + a.capacity, 0);
  const totalM2 = areas.reduce((s, a) => s + a.capacity, 0);
  const fillRate = totalM2 > 0 ? Math.round((rentedM2 / totalM2) * 100) : 0;

  // Hợp đồng
  const activeContracts = contracts.filter((c) => c.status === 'DangHieuLuc' || c.status === 'SapHetHan');
  const rentingCustomersCount = new Set(activeContracts.map(c => c.customerId)).size;

  const expiring = contracts
    .filter((c) => c.status === 'SapHetHan' || (c.status === 'DangHieuLuc' && daysUntil(c.endDate) <= 60))
    .sort((a, b) => daysUntil(a.endDate) - daysUntil(b.endDate));

  // Doanh thu tháng hiện tại
  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
  const monthRevenue = invoices
    .filter((i) => i.date.startsWith(currentMonth) && i.status === 'DaThanhToan')
    .reduce((s, i) => s + i.total, 0);

  // Hàm reset dữ liệu (dành cho demo)
  function handleResetData() {
    if (window.confirm('BẠN CÓ CHẮC CHẮN MUỐN XÓA TOÀN BỘ DỮ LIỆU?\n\nTất cả hợp đồng, khách hàng, hóa đơn sẽ bị xóa sạch. Hệ thống sẽ trở về trạng thái trống ban đầu.')) {
      ['mock_areas','mock_contracts','mock_customers','mock_invoices','mock_billingCycles','mock_transactions', 'mock_rentalRequests', 'thue-kho-rental-requests'].forEach(k => localStorage.removeItem(k));
      window.location.reload();
    }
  }

  // Biểu đồ 6 tháng gần nhất từ hóa đơn thực tế
  const chartData = Array.from({ length: 6 }, (_, idx) => {
    const now = new Date();
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - idx), 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const rev = invoices
      .filter((inv) => inv.date.startsWith(key) && inv.status === 'DaThanhToan')
      .reduce((s, inv) => s + inv.total, 0);
    return { month: `T${d.getMonth() + 1}`, revenue: Math.round(rev / 1_000_000) };
  });

  return (
    <div className="stack">
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '-16px' }}>
        <button className="btn btn-danger btn-sm" onClick={handleResetData} style={{ backgroundColor: 'var(--danger)', color: 'white', fontWeight: 'bold' }}>
          🔄 Reset dữ liệu (Xóa tất cả)
        </button>
      </div>

      <div className="stats">
        <TheThongKe
          label="Tổng khách hàng"
          value={customers.length}
          hint={`${rentingCustomersCount} đang thuê`}
        />
        <TheThongKe label="Diện tích đã thuê" value={`${rentedM2}`} hint={`Tổng ${totalM2}`} />
        <TheThongKe label="Tỷ lệ lấp đầy" value={`${fillRate}%`} tone={fillRate >= 70 ? 'ok' : 'warn'} />
        <TheThongKe
          label="Doanh thu tháng này"
          value={formatMoney(monthRevenue)}
          hint="Đã thanh toán"
        />
        <TheThongKe label="HĐ đang hiệu lực" value={activeContracts.length} />
      </div>

      <div className="grid-2">
        <BangDieuKhien title="Biểu đồ doanh thu theo tháng (triệu đồng)">
          <div className="chart-box">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e8eef5" />
                <XAxis dataKey="month" tick={{ fill: '#6b7a8d', fontSize: 12 }} />
                <YAxis tick={{ fill: '#6b7a8d', fontSize: 12 }} />
                <Tooltip formatter={(v) => [`${v} triệu`, 'Doanh thu']} />
                <Bar dataKey="revenue" fill="#1f6b5a" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </BangDieuKhien>

        <BangDieuKhien title="Hợp đồng sắp hết hạn">
          <div className="list-alert">
            {expiring.map((c) => {
              const customer = customers.find((x) => x.id === c.customerId);
              const d = daysUntil(c.endDate);
              return (
                <div className="alert-item" key={c.id}>
                  <div>
                    <strong>{c.code} · {customer?.name}</strong>
                    <span>Hết hạn {formatDate(c.endDate)} · Còn {d} ngày</span>
                  </div>
                  <NhanTrangThaiHopDong status={c.status} />
                </div>
              );
            })}
            {expiring.length === 0 && <div className="empty">Không có hợp đồng sắp hết hạn</div>}
          </div>
        </BangDieuKhien>
      </div>
    </div>
  );
}
