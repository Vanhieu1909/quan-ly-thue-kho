import type {
  AreaStatus,
  AreaType,
  ContractStatus,
  CustomerStatus,
  PaymentStatus,
  RequestStatus,
  Role,
} from '../kieu';

export function formatMoney(value: number): string {
  return new Intl.NumberFormat('vi-VN').format(value) + ' đ';
}

export function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

export function formatShortMoney(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}tr`;
  if (value >= 1_000) return `${Math.round(value / 1_000)}k`;
  return String(value);
}

export function getVatRate(): number {
  try {
    const saved = localStorage.getItem('mock_vat_rate');
    if (saved) {
      const val = Number(saved);
      if (!isNaN(val) && val > 0) return val;
    }
  } catch {}
  return 0.1; // Default 10%
}

export function getVatPercentLabel(): string {
  const rate = getVatRate();
  return `${Math.round(rate * 100)}%`;
}

export const roleLabel: Record<Role, string> = {
  admin: 'Quản trị viên',
  staff: 'Nhân viên kho',
  accountant: 'Kế toán',
  customer: 'Khách hàng',
};

export const areaTypeLabel: Record<AreaType, string> = {
  Ke: 'Sàn kho chứa Pallet (Kệ chứa hàng)',
  Treo: 'Sàn kho tiêu chuẩn',
  KeVIP: 'Sàn kho đặc biệt',
};

export const areaStatusLabel: Record<AreaStatus, string> = {
  Trong: 'Đang trống',
  DaThue: 'Đang cho thuê',
  BaoTri: 'Đang bảo dưỡng',
  LoiChoXacNhan: 'Lỗi — Chờ xác nhận',
};

export const contractStatusLabel: Record<ContractStatus, string> = {
  ChoHieuLuc: 'Chờ thanh toán cọc',
  DangHieuLuc: 'Đang hiệu lực',
  SapHetHan: 'Sắp hết hạn',
  DaGiaHan: 'Đã gia hạn',
  DaKetThuc: 'Đã kết thúc',
  DaHuy: 'Đã hủy',
};

export const paymentStatusLabel: Record<PaymentStatus, string> = {
  ChuaThanhToan: 'Chưa thanh toán',
  ThanhToanMotPhan: 'Thanh toán một phần',
  DaThanhToan: 'Đã thanh toán',
  QuaHan: 'Quá hạn',
};

export const requestStatusLabel: Record<RequestStatus, string> = {
  Moi: 'Mới',
  DaTiepNhan: 'Đã tiếp nhận',
  DaDuyet: 'Đã duyệt',
  TuChoi: 'Từ chối',
};

export const customerStatusLabel: Record<CustomerStatus, string> = {
  DangThue: 'Đang thuê',
  NgungThue: 'Ngưng thuê',
};

export function daysUntil(iso: string): number {
  const end = new Date(iso);
  const now = new Date('2026-09-06');
  return Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}
