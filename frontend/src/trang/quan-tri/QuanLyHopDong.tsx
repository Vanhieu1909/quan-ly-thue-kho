import { useEffect, useMemo, useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Plus, Eye } from 'lucide-react';
import { areas as seedAreas, contracts as seed, customers, priceTable, invoices, billingCycles } from '../../du-lieu/duLieuMau';
import type { Area, Contract, ContractStatus, PaymentCycle, Customer } from '../../kieu';
import { areaTypeLabel, formatDate, formatMoney } from '../../thu-vien/dinhDang';
import { NhanTrangThaiHopDong } from '../../thanh-phan/NhanTrangThai';
import { HopThoai } from '../../thanh-phan/HopThoai';
import { BanDoKho } from '../../thanh-phan/BanDoKho';

export function QuanLyHopDong() {
  const location = useLocation();
  const [areas, setAreas] = useState<Area[]>(() => {
    const local = localStorage.getItem('mock_areas');
    if (local) {
      const parsed = JSON.parse(local);
      if (parsed.some((a: Area) => a.code.startsWith('KV-')) || (parsed.length > 0 && !parsed[0]?.capacity)) {
        localStorage.setItem('mock_areas', JSON.stringify(seedAreas));
        return seedAreas;
      }
      return parsed;
    }
    return seedAreas;
  });
  const [rows, setRows] = useState<Contract[]>(() => {
    const local = localStorage.getItem('mock_contracts');
    if (local) {
      const parsed = JSON.parse(local);
      if (parsed.length > 0 && !parsed[0]?.capacity) {
        localStorage.setItem('mock_contracts', JSON.stringify(seed));
        return seed;
      }
      return parsed;
    }
    return seed;
  });
  const [statusFilter, setStatusFilter] = useState<ContractStatus | 'All'>('All');
  const [customerFilter, setCustomerFilter] = useState('All');
  const [open, setOpen] = useState(false);
  const [localCustomers, setLocalCustomers] = useState<Customer[]>(() => {
    const saved = localStorage.getItem('mock_customers');
    return saved ? JSON.parse(saved) : customers;
  });
  const [form, setForm] = useState({
    customerId: '',
    areaIds: [] as string[],
    startDate: '2026-09-15',
    endDate: '2027-09-14',
    paymentCycle: 'Thang' as PaymentCycle,
    deposit: '',
    serviceFee: '',
  });

  useEffect(() => {
    const state = location.state as any;
    if (state?.openCreate) {
      let matchedId = '';
      if (state.customerName) {
        let match = localCustomers.find((c: any) => c.name === state.customerName || (state.phone && c.phone === state.phone));
        if (match) {
          matchedId = match.id;
        } else {
          const newCust = {
            id: `c${Date.now()}`,
            code: `KH${String(localCustomers.length + 1).padStart(3, '0')}`,
            name: state.customerName,
            type: 'CaNhan',
            phone: state.phone || '',
            email: state.email || '',
            rentedM2: 0,
            debt: 0,
            status: 'NgungThue'
          };
          setLocalCustomers((prev: any) => {
            const next = [...prev, newCust];
            localStorage.setItem('mock_customers', JSON.stringify(next));
            return next;
          });
          matchedId = newCust.id;
        }
      }

      setForm((current) => ({ 
        ...current, 
        areaIds: state.areaIds || (state.areaId ? [state.areaId] : current.areaIds),
        startDate: state.startDate || current.startDate,
        endDate: state.endDate || current.endDate,
        customerId: matchedId || current.customerId
      }));
      setOpen(true);
      window.history.replaceState({}, document.title, location.pathname);
    }
  }, [location.pathname, location.state]);

  const filtered = useMemo(
    () =>
      rows.filter((c) => {
        if (statusFilter !== 'All' && c.status !== statusFilter) return false;
        if (customerFilter !== 'All' && c.customerId !== customerFilter) return false;
        return true;
      }),
    [rows, statusFilter, customerFilter],
  );

  const selectedAreas = form.areaIds.map(id => areas.find(a => a.id === id)).filter(Boolean) as Area[];
  const totalCapacity = selectedAreas.reduce((sum, a) => sum + a.capacity, 0);
  const commonUnit = selectedAreas.length > 0 ? selectedAreas[0].rentalUnit : 'Pallet';
  const commonType = selectedAreas.length > 0 ? selectedAreas[0].type : 'Ke';

  const unitPrice = selectedAreas.length > 0
    ? priceTable.find((p) => p.type === commonType)?.unitPrice ?? 0
    : 0;
  const monthlyRent = totalCapacity * unitPrice;
  const total = monthlyRent + Number(form.serviceFee || 0);

  // Mã HĐ tiếp theo: lấy max số hiện có + 1, tránh trùng khi có HĐ bị hủy/xóa
  const nextContractCode = useMemo(() => {
    const maxNum = rows.reduce((max, r) => {
      const num = parseInt(r.code.replace(/[^0-9]/g, ''), 10);
      return isNaN(num) ? max : Math.max(max, num);
    }, 0);
    return `HD${String(maxNum + 1).padStart(3, '0')}`;
  }, [rows]);

  function save() {
    if (!form.customerId || selectedAreas.length === 0) return;
    if (!form.deposit || Number(form.deposit) <= 0) {
      alert('Vui lòng nhập tiền cọc (bắt buộc).');
      return;
    }
    const busyAreas = selectedAreas.filter(a => a.status !== 'Trong');
    if (busyAreas.length > 0) {
      alert(`Khu vực ${busyAreas.map(a => a.code).join(', ')} đã được thuê hoặc đang bảo trì. Vui lòng bỏ chọn!`);
      return;
    }

    const rawBilling = localStorage.getItem('mock_billingCycles');
    const allBilling = rawBilling ? JSON.parse(rawBilling) : billingCycles;
    const rawInvoices = localStorage.getItem('mock_invoices');
    const allInvoices = rawInvoices ? JSON.parse(rawInvoices) : invoices;

    // ── Tạo 1 hợp đồng duy nhất cho tất cả khu vực ──
    const cId = `ct${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

    const contract: Contract = {
      id: cId,
      code: nextContractCode,
      customerId: form.customerId,
      areaId: selectedAreas[0].id,          // backward compat
      areaIds: selectedAreas.map(a => a.id), // danh sách đầy đủ
      capacity: totalCapacity,
      rentalUnit: commonUnit,
      startDate: form.startDate,
      endDate: form.endDate,
      unitPrice,
      monthlyRent,                           // tổng tiền thuê của tất cả khu
      serviceFee: Number(form.serviceFee) || 0,
      deposit: Number(form.deposit) || 0,
      paymentCycle: form.paymentCycle,
      status: 'ChoHieuLuc',
    };

    // ── 1 billing cycle ──
    const bcId = `bc${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const rentAmount = monthlyRent + (Number(form.serviceFee) || 0);
    const depositAmt = Number(form.deposit) || 0;
    const amountBeforeTax = depositAmt + rentAmount;
    const vat = Math.round(rentAmount * 0.1);
    const invoiceTotal = amountBeforeTax + vat;

    const newBc = {
      id: bcId,
      contractId: cId,
      startDate: form.startDate,
      endDate: form.startDate,
      dueDate: form.startDate,
      totalAmount: invoiceTotal,
      status: 'INVOICED',
    };

    // ── 1 hóa đơn ──
    const areaNames = selectedAreas.map(a => a.code).join(', ');
    const newInvoice = {
      id: `i${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      number: `HD-${new Date().getFullYear()}-${String(allInvoices.length + 1).padStart(3, '0')}`,
      date: new Date().toISOString().slice(0, 10),
      customerId: form.customerId,
      billingCycleId: bcId,
      period: `Thanh toán lần đầu`,
      content: `Tiền cọc + kỳ thanh toán đầu - ${areaNames}`,
      amountBeforeTax,
      vat,
      total: invoiceTotal,
      dueDate: form.startDate,
      status: 'ChuaThanhToan',
      paidAmount: 0,
      debtAmount: invoiceTotal,
    };

    // ── Lưu vào state & localStorage ──
    setRows(p => {
      const updated = [contract, ...p];
      localStorage.setItem('mock_contracts', JSON.stringify(updated));
      return updated;
    });

    localStorage.setItem('mock_billingCycles', JSON.stringify([newBc, ...allBilling]));
    localStorage.setItem('mock_invoices', JSON.stringify([newInvoice, ...allInvoices]));

    // ── Đánh dấu tất cả khu đã thuê ──
    setAreas(prev => {
      const updatedAreas = prev.map(a => {
        if (selectedAreas.find(sa => sa.id === a.id)) {
          return { ...a, status: 'DaThue' as const, currentContractId: cId };
        }
        return a;
      });
      localStorage.setItem('mock_areas', JSON.stringify(updatedAreas));
      return updatedAreas;
    });

    // ── Cập nhật trạng thái khách hàng thành Đang thuê & nợ ──
    setLocalCustomers(prev => {
      const updated = prev.map(c => 
        c.id === form.customerId 
          ? { ...c, status: 'DangThue' as const, rentedM2: c.rentedM2 + totalCapacity, debt: (c.debt || 0) + invoiceTotal } 
          : c
      );
      localStorage.setItem('mock_customers', JSON.stringify(updated));
      return updated;
    });

    window.dispatchEvent(new Event('storage'));
    setOpen(false);
  }

  return (
    <div>
      <div className="toolbar">
        <div className="toolbar-left">
          <select className="filter-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as ContractStatus | 'All')}>
            <option value="All">Trạng thái HĐ</option>
            <option value="DangHieuLuc">Đang hiệu lực</option>
            <option value="SapHetHan">Sắp hết hạn</option>
            <option value="DaKetThuc">Đã kết thúc</option>
            <option value="DaHuy">Đã hủy</option>
          </select>
          <select className="filter-select" value={customerFilter} onChange={(e) => setCustomerFilter(e.target.value)}>
            <option value="All">Khách hàng</option>
            {localCustomers.map((c: any) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className="toolbar-right">
          <button className="btn btn-primary" onClick={() => setOpen(true)}>
            <Plus size={16} /> Tạo hợp đồng
          </button>
        </div>
      </div>

      <div className="panel" style={{ marginBottom: 16 }}>
        <div className="panel-bd">
          <BanDoKho
            areas={areas}
            mode="chon-thue"
            choPhepChon={['Trong']}
            title="Chọn trực tiếp ô trống để tạo hợp đồng"
            onSelect={(area) => {
              setForm((current) => ({ ...current, areaId: area.id }));
              setOpen(true);
            }}
          />
        </div>
      </div>

      <div className="panel">
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Mã HĐ</th>
                <th>Khách hàng</th>
                <th>Khu vực</th>
                <th>Sức chứa</th>
                <th>Ngày bắt đầu</th>
                <th>Ngày kết thúc</th>
                <th>Tiền thuê/tháng</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => {
                const kh = localCustomers.find((x) => x.id === c.customerId);
                // Hỗ trợ cả hợp đồng cũ (areaId) lẫn mới (areaIds)
                const allAreaIds = c.areaIds ?? [c.areaId];
                const kvList = allAreaIds.map(id => areas.find(x => x.id === id)).filter(Boolean);
                const kvLabel = kvList.map(a => a!.code).join(', ') || '—';
                return (
                  <tr key={c.id}>
                    <td>{c.code}</td>
                    <td>{kh?.name}</td>
                    <td>{kvLabel}</td>
                    <td>{c.capacity} {c.rentalUnit || kvList[0]?.rentalUnit || 'Pallet'}</td>
                    <td>{formatDate(c.startDate)}</td>
                    <td>{formatDate(c.endDate)}</td>
                    <td>{formatMoney(c.monthlyRent)}</td>
                    <td>
                      <NhanTrangThaiHopDong status={c.status} />
                    </td>
                    <td>
                      <Link to={`/admin/contracts/${c.id}`} className="btn btn-ghost btn-sm">
                        <Eye size={14} />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="pagination">
          <span>
            Hiển thị 1–{filtered.length} / {rows.length} hợp đồng
          </span>
        </div>
      </div>

      <HopThoai
        open={open}
        title="Tạo hợp đồng mới"
        wide
        onClose={() => setOpen(false)}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setOpen(false)}>
              Hủy
            </button>
            <button className="btn btn-primary" onClick={() => {
              if (!form.customerId) {
                alert('Vui lòng chọn khách hàng!');
                return;
              }
              if (form.areaIds.length === 0) {
                alert('Vui lòng chọn chỗ thuê trên bản đồ!');
                return;
              }
              save();
            }}>
              Lưu
            </button>
          </>
        }
      >
        <div className="field">
          <label>Mã hợp đồng</label>
          <input value={nextContractCode} disabled />
        </div>
        <div className="field">
          <label>
            Khách hàng <span className="req">*</span>
          </label>
          <select value={form.customerId} onChange={(e) => setForm({ ...form, customerId: e.target.value })}>
            <option value="">Chọn khách hàng</option>
            {localCustomers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label>
            Chọn chỗ thuê trên bản đồ <span className="req">*</span>
          </label>
          <BanDoKho
            areas={areas}
            mode="chon-thue"
            choPhepChon={['Trong']}
            selectedIds={form.areaIds}
            onSelect={(a) => {
              const ids = form.areaIds.includes(a.id) 
                ? form.areaIds.filter(id => id !== a.id) 
                : [...form.areaIds, a.id];
              setForm({ ...form, areaIds: ids });
            }}
            title="Bản đồ kho — chỉ chọn ô đang trống"
          />
        </div>

        {selectedAreas.length > 0 && (
          <div className="field-row">
            <div className="field">
              <label>Tổng sức chứa ({selectedAreas.length} ô)</label>
              <input value={`${totalCapacity} ${commonUnit}`} disabled />
            </div>
            <div className="field">
              <label>Loại khu vực</label>
              <input value={areaTypeLabel[commonType]} disabled />
            </div>
          </div>
        )}
        <div className="field-row">
          <div className="field">
            <label>
              Ngày bắt đầu <span className="req">*</span>
            </label>
            <input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
          </div>
          <div className="field">
            <label>
              Ngày kết thúc <span className="req">*</span>
            </label>
            <input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
          </div>
        </div>
        <div className="field-row">
          <div className="field">
            <label>Chu kỳ thanh toán</label>
            <select
              value={form.paymentCycle}
              onChange={(e) => setForm({ ...form, paymentCycle: e.target.value as PaymentCycle })}
            >
              <option value="Thang">Theo tháng</option>
              <option value="Quy">Theo quý</option>
              <option value="Nam">Theo năm</option>
            </select>
          </div>
          <div className="field">
            <label>Tiền cọc <span style={{ color: 'var(--danger)' }}>*</span></label>
            <input type="number" value={form.deposit} onChange={(e) => setForm({ ...form, deposit: e.target.value })} placeholder="Bắt buộc nhập tiền cọc" style={!form.deposit || Number(form.deposit) <= 0 ? { borderColor: 'var(--danger)' } : {}} />
            {(!form.deposit || Number(form.deposit) <= 0) && <small style={{ color: 'var(--danger)' }}>Bắt buộc nhập tiền cọc</small>}
          </div>
        </div>
        <div className="summary-box">
          <div className="row">
            <span>Đơn giá</span>
            <strong>{formatMoney(unitPrice)}/m²/tháng</strong>
          </div>
          <div className="row">
            <span>Tiền thuê</span>
            <strong>{formatMoney(monthlyRent)}</strong>
          </div>
          <div className="row">
            <span>Phí dịch vụ</span>
            <strong>{formatMoney(Number(form.serviceFee || 0))}</strong>
          </div>
          <div className="row total">
            <span>Tổng / kỳ</span>
            <strong>{formatMoney(total)}</strong>
          </div>
        </div>
      </HopThoai>
    </div>
  );
}
