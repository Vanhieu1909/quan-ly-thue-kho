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
                    <th>Quý trước</th>
                    <th>Quý này</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    let revQPrev = 0; let revQThis = 0;
                    let expQPrev = 0; let expQThis = 0;
                    let vatQPrev = 0; let vatQThis = 0;
                    const today = new Date();
                    const currentQ = Math.floor(today.getMonth() / 3);
                    const currentY = today.getFullYear();
                    
                    transactions.forEach((t: any) => {
                      if (t.status === 'XacNhan' && t.date) {
                        const tDate = new Date(t.date);
                        const q = Math.floor(tDate.getMonth() / 3);
                        const y = tDate.getFullYear();
                        
                        let isThisQ = (q === currentQ && y === currentY);
                        let isPrevQ = (y === currentY && q === currentQ - 1) || (y === currentY - 1 && currentQ === 0 && q === 3);
                        
                        if (isThisQ) {
                          if (t.type === 'Thu') revQThis += t.amount / 1.1; // Estimate before tax
                          if (t.type === 'Thu') vatQThis += (t.amount - (t.amount / 1.1));
                          if (t.type === 'Chi') expQThis += t.amount;
                        } else if (isPrevQ) {
                          if (t.type === 'Thu') revQPrev += t.amount / 1.1;
                          if (t.type === 'Thu') vatQPrev += (t.amount - (t.amount / 1.1));
                          if (t.type === 'Chi') expQPrev += t.amount;
                        }
                      }
                    });

                    return (
                      <>
                        <tr>
                          <td>Doanh thu chưa thuế</td>
                          <td>{formatMoney(revQPrev)}</td>
                          <td>{formatMoney(revQThis)}</td>
                        </tr>
                        <tr>
                          <td>Thuế GTGT</td>
                          <td>{formatMoney(vatQPrev)}</td>
                          <td>{formatMoney(vatQThis)}</td>
                        </tr>
                        <tr>
                          <td>Chi phí vận hành</td>
                          <td>{formatMoney(expQPrev)}</td>
                          <td>{formatMoney(expQThis)}</td>
                        </tr>
                        <tr>
                          <td><strong>Lợi nhuận trước thuế</strong></td>
                          <td><strong>{formatMoney(revQPrev - expQPrev)}</strong></td>
                          <td><strong>{formatMoney(revQThis - expQThis)}</strong></td>
                        </tr>
                      </>
                    );
                  })()}
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
          <BangDieuKhien title="Thu – chi theo tháng (thực tế)">
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
                  {(() => {
                    const today = new Date();
                    const months = [];
                    for (let i = 2; i >= 0; i--) {
                      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
                      months.push({ label: `T${d.getMonth() + 1}`, m: d.getMonth() + 1, y: d.getFullYear(), thu: 0, chi: 0 });
                    }
                    transactions.forEach((t: any) => {
                      if (t.status === 'XacNhan' && t.date) {
                        const tDate = new Date(t.date);
                        const b = months.find(x => x.m === tDate.getMonth() + 1 && x.y === tDate.getFullYear());
                        if (b) {
                          if (t.type === 'Thu') b.thu += t.amount;
                          if (t.type === 'Chi') b.chi += t.amount;
                        }
                      }
                    });
                    return months.map((b) => (
                      <tr key={b.label}>
                        <td>{b.label}</td>
                        <td>{formatMoney(b.thu)}</td>
                        <td>{formatMoney(b.chi)}</td>
                        <td>{formatMoney(b.thu - b.chi)}</td>
                      </tr>
                    ));
                  })()}
                </tbody>
              </table>
            </div>
          </BangDieuKhien>
          <BangDieuKhien title="Chi phí theo loại (thực tế)">
            <div className="chart-box">
              <ResponsiveContainer width="100%" height="100%">
                {(() => {
                  const expenses: Record<string, number> = {};
                  transactions.forEach((t: any) => {
                    if (t.type === 'Chi' && t.status === 'XacNhan') {
                      expenses[t.category] = (expenses[t.category] || 0) + t.amount;
                    }
                  });
                  const data = Object.keys(expenses).map(k => ({ name: k, value: expenses[k] }));
                  if (data.length === 0) {
                     return <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-light)'}}>Chưa có dữ liệu chi phí</div>;
                  }
                  return (
                    <PieChart>
                      <Pie data={data} dataKey="value" nameKey="name" outerRadius={90} label>
                        {data.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v) => [formatMoney(v as number), 'Chi phí']} />
                    </PieChart>
                  );
                })()}
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
            {(() => {
              let rev = 0;
              let exp = 0;
              transactions.forEach((t: any) => {
                if (t.status === 'XacNhan') {
                  if (t.type === 'Thu') rev += t.amount / 1.1;
                  if (t.type === 'Chi') exp += t.amount;
                }
              });
              const vatOut = rev * 0.1;
              const vatIn = exp * 0.1; // roughly assume 10% VAT on expenses
              
              return (
                <>
                  <div className="panel">
                    <div className="panel-hd">
                      <h2>Thuế GTGT</h2>
                    </div>
                    <div className="panel-bd stack">
                      <div className="detail-item">
                        <label>Doanh thu chịu thuế</label>
                        <strong>{formatMoney(rev)}</strong>
                      </div>
                      <div className="detail-item">
                        <label>GTGT đầu ra (10%)</label>
                        <strong>{formatMoney(vatOut)}</strong>
                      </div>
                      <div className="detail-item">
                        <label>GTGT đầu vào được khấu trừ</label>
                        <strong>{formatMoney(vatIn)}</strong>
                      </div>
                      <div className="detail-item">
                        <label>GTGT phải nộp</label>
                        <strong>{formatMoney(Math.max(0, vatOut - vatIn))}</strong>
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
                        <strong>{formatMoney(rev)}</strong>
                      </div>
                      <div className="detail-item">
                        <label>Chi phí hợp lý</label>
                        <strong>{formatMoney(exp)}</strong>
                      </div>
                      <div className="detail-item">
                        <label>Thu nhập chịu thuế</label>
                        <strong>{formatMoney(Math.max(0, rev - exp))}</strong>
                      </div>
                      <div className="detail-item">
                        <label>Thuế TNDN 20%</label>
                        <strong>{formatMoney(Math.max(0, rev - exp) * 0.2)}</strong>
                      </div>
                    </div>
                  </div>
                </>
              );
            })()}
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
