import { useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  customers as seedCustomers,
  fillRateByMonth,
  invoices as seedInvoices,
  revenueByMonth,
  transactions as seedTransactions,
} from '../../du-lieu/duLieuMau';
import { formatMoney } from '../../thu-vien/dinhDang';
import { BangDieuKhien } from '../../thanh-phan/TheThongKe';

const expensePie = [
  { name: 'Điện nước', value: 8.5 },
  { name: 'Bảo trì', value: 4.2 },
  { name: 'Bảo vệ', value: 12 },
  { name: 'Vệ sinh', value: 3.5 },
  { name: 'Khác', value: 2 },
];
const COLORS = ['#1f6b5a', '#d4a017', '#3d4a5c', '#6b7a8d', '#b45309'];

export function BaoCao() {
  const [tab, setTab] = useState<'summary' | 'debt' | 'cash' | 'tax' | 'fill'>('summary');
  const [customers] = useState(() => {
    const raw = localStorage.getItem('mock_customers');
    return raw ? JSON.parse(raw) : seedCustomers;
  });
  const [invoices] = useState(() => {
    const raw = localStorage.getItem('mock_invoices');
    return raw ? JSON.parse(raw) : seedInvoices;
  });
  const [transactions] = useState(() => {
    const raw = localStorage.getItem('mock_transactions');
    return raw ? JSON.parse(raw) : seedTransactions;
  });

  interface DebtRow {
    name: string;
    must: number;
    paid: number;
    remain: number;
    overdue: number;
    rate: number;
  }

  const debtRows: DebtRow[] = customers.map((c: any) => {
    const list = invoices.filter((i: any) => i.customerId === c.id);
    const must = list.reduce((s: number, i: any) => s + (i.total || 0), 0);
    const paid = list.reduce((s: number, i: any) => s + (i.paidAmount || 0), 0);
    const overdue = list.filter((i: any) => i.status === 'QuaHan').reduce((s: number, i: any) => s + ((i.total || 0) - (i.paidAmount || 0)), 0);
    return { name: c.name, must, paid, remain: must - paid, overdue, rate: must ? Math.round((paid / must) * 100) : 100 };
  });

  return (
    <div>
      <div className="tabs">
        {[
          ['summary', 'Doanh thu – Chi phí'],
          ['debt', 'Công nợ'],
          ['cash', 'Thu – Chi'],
          ['tax', 'Thuế'],
          ['fill', 'Tỷ lệ lấp đầy'],
        ].map(([id, label]) => (
          <button key={id} className={`tab${tab === id ? ' active' : ''}`} onClick={() => setTab(id as typeof tab)}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'summary' && (
        <div className="stack">
          <div className="toolbar">
            <div className="toolbar-left">
              <input className="filter-select" type="date" defaultValue="2026-07-01" />
              <input className="filter-select" type="date" defaultValue="2026-09-30" />
            </div>
            <button className="btn btn-secondary" onClick={() => window.print()}>Xuất báo cáo</button>
          </div>
          <BangDieuKhien title="Doanh thu theo tháng (triệu đồng)">
            <div className="chart-box">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={(() => {
                    const today = new Date();
                    const months = [];
                    for (let i = 5; i >= 0; i--) {
                      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
                      months.push({ month: `T${d.getMonth() + 1}`, year: d.getFullYear(), revenue: 0 });
                    }
                    transactions.forEach((t: any) => {
                      if (t.type === 'Thu' && t.status === 'XacNhan' && t.date) {
                        const tDate = new Date(t.date);
                        const m = `T${tDate.getMonth() + 1}`;
                        const y = tDate.getFullYear();
                        const bucket = months.find(x => x.month === m && x.year === y);
                        if (bucket) {
                          bucket.revenue += (t.amount / 1000000);
                        }
                      }
                    });
                    return months;
                  })()}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e8eef5" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="revenue" fill="#1f6b5a" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </BangDieuKhien>
          <div className="panel">
            <div className="table-wrap">
              <table className="data">
                <thead>
                  <tr>
                    <th>Khoản mục</th>
                    <th>Quý 2</th>
                    <th>Quý 3 (ước)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Doanh thu chưa thuế</td>
                    <td>{formatMoney(1_445_000_000)}</td>
                    <td>{formatMoney(555_000_000)}</td>
                  </tr>
                  <tr>
                    <td>Thuế GTGT</td>
                    <td>{formatMoney(144_500_000)}</td>
                    <td>{formatMoney(55_500_000)}</td>
                  </tr>
                  <tr>
                    <td>Chi phí vận hành</td>
                    <td>{formatMoney(210_000_000)}</td>
                    <td>{formatMoney(75_000_000)}</td>
                  </tr>
                  <tr>
                    <td>
                      <strong>Lợi nhuận trước thuế</strong>
                    </td>
                    <td>
                      <strong>{formatMoney(1_235_000_000)}</strong>
                    </td>
                    <td>
                      <strong>{formatMoney(480_000_000)}</strong>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === 'debt' && (
        <div className="panel">
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>Khách hàng</th>
                  <th>Tổng phải thu</th>
                  <th>Đã thanh toán</th>
                  <th>Còn nợ</th>
                  <th>Quá hạn</th>
                  <th>Tỷ lệ %</th>
                </tr>
              </thead>
              <tbody>
                {debtRows.map((r) => (
                  <tr key={r.name}>
                    <td>{r.name}</td>
                    <td>{formatMoney(r.must)}</td>
                    <td>{formatMoney(r.paid)}</td>
                    <td>{formatMoney(r.remain)}</td>
                    <td>{formatMoney(r.overdue)}</td>
                    <td>{r.rate}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'cash' && (
        <div className="grid-2">
          <BangDieuKhien title="Thu – chi theo tháng (minh họa)">
            <div className="table-wrap">
              <table className="data">
                <thead>
                  <tr>
                    <th>Tháng</th>
                    <th>Tổng thu</th>
                    <th>Tổng chi</th>
                    <th>Chênh lệch</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['T6', 510, 68],
                    ['T7', 535, 72],
                    ['T8', 555, 75],
                  ].map(([m, thu, chi]) => (
                    <tr key={m as string}>
                      <td>{m}</td>
                      <td>{thu} tr</td>
                      <td>{chi} tr</td>
                      <td>{(thu as number) - (chi as number)} tr</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </BangDieuKhien>
          <BangDieuKhien title="Chi phí theo loại">
            <div className="chart-box">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={expensePie} dataKey="value" nameKey="name" outerRadius={90} label>
                    {expensePie.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => [`${v} triệu`, 'Chi phí']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </BangDieuKhien>
        </div>
      )}

      {tab === 'tax' && (
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
          <div className="grid-2 equal">
            <div className="panel">
              <div className="panel-hd">
                <h2>Thuế GTGT</h2>
              </div>
              <div className="panel-bd stack">
                <div className="detail-item">
                  <label>Doanh thu chịu thuế</label>
                  <strong>{formatMoney(555_000_000)}</strong>
                </div>
                <div className="detail-item">
                  <label>GTGT đầu ra (10%)</label>
                  <strong>{formatMoney(55_500_000)}</strong>
                </div>
                <div className="detail-item">
                  <label>GTGT đầu vào được khấu trừ</label>
                  <strong>{formatMoney(7_500_000)}</strong>
                </div>
                <div className="detail-item">
                  <label>GTGT phải nộp</label>
                  <strong>{formatMoney(48_000_000)}</strong>
                </div>
              </div>
            </div>
            <div className="panel">
              <div className="panel-hd">
                <h2>Thuế TNDN tạm tính</h2>
              </div>
              <div className="panel-bd stack">
                <div className="detail-item">
                  <label>Doanh thu</label>
                  <strong>{formatMoney(555_000_000)}</strong>
                </div>
                <div className="detail-item">
                  <label>Chi phí hợp lý</label>
                  <strong>{formatMoney(75_000_000)}</strong>
                </div>
                <div className="detail-item">
                  <label>Thu nhập chịu thuế</label>
                  <strong>{formatMoney(480_000_000)}</strong>
                </div>
                <div className="detail-item">
                  <label>Thuế TNDN 20%</label>
                  <strong>{formatMoney(96_000_000)}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'fill' && (
        <BangDieuKhien title="Tỷ lệ lấp đầy kho theo tháng">
          <div className="chart-box">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={fillRateByMonth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e8eef5" />
                <XAxis dataKey="month" />
                <YAxis unit="%" />
                <Tooltip />
                <Bar dataKey="rate" name="Tỷ lệ %" fill="#d4a017" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="table-wrap" style={{ marginTop: 16 }}>
            <table className="data">
              <thead>
                <tr>
                  <th>Tháng</th>
                  <th>Tổng SC</th>
                  <th>Đã thuê</th>
                  <th>Còn trống</th>
                  <th>Tỷ lệ</th>
                </tr>
              </thead>
              <tbody>
                {fillRateByMonth.map((r) => (
                  <tr key={r.month}>
                    <td>{r.month}</td>
                    <td>{r.total} Pallet</td>
                    <td>{r.rented} Pallet</td>
                    <td>{r.total - r.rented} Pallet</td>
                    <td>{r.rate}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </BangDieuKhien>
      )}

      {/* keep transactions referenced for future API wiring */}
      <span style={{ display: 'none' }}>{transactions.length}</span>
    </div>
  );
}
