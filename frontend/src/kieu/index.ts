export type Role = 'admin' | 'staff' | 'accountant' | 'customer';

export type AreaType = 'Ke' | 'Treo' | 'KeVIP';
export type AreaStatus = 'Trong' | 'DaThue' | 'BaoTri';
export type ContractStatus =
  | 'ChoHieuLuc'
  | 'DangHieuLuc'
  | 'SapHetHan'
  | 'DaGiaHan'
  | 'DaKetThuc'
  | 'DaHuy';
export type PaymentStatus = 'ChuaThanhToan' | 'ThanhToanMotPhan' | 'DaThanhToan' | 'QuaHan';
export type RequestStatus = 'Moi' | 'DaTiepNhan' | 'DaDuyet' | 'TuChoi';
export type CustomerStatus = 'DangThue' | 'NgungThue';
export type CustomerType = 'CaNhan' | 'DoanhNghiep';
export type PaymentCycle = 'Thang' | 'Quy' | 'Nam';

export interface Account {
  id: string;
  username: string;
  passwordHash: string;
  name: string;
  role: Role;
  email?: string;
  phone?: string;
  customerId?: string; // Tùy chọn nếu Account thuộc về một Customer
  status: 'ACTIVE' | 'INACTIVE';
}

export interface Warehouse {
  id: string;
  code: string;
  name: string;
  totalAreaM2: number;
  status: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE';
}

/** Vị trí ô trên sơ đồ kho (lưới theo tầng). row/col mô tả đúng vị trí thực tế,
 * không dùng để suy ra diện tích. */
export interface AreaMapPos {
  floor: number;
  row: number;
  col: number;
  rowSpan?: number;
  colSpan?: number;
}

export type RentalUnit = 'Pallet' | 'm2' | 'Bo' | 'Met';

export interface Area {
  id: string;
  warehouseId: string;
  code: string;
  name: string;
  capacity: number;
  rentalUnit: RentalUnit;
  type: AreaType;
  status: AreaStatus;
  location: string;
  note?: string;
  map: AreaMapPos;
  currentContractId?: string;
}

export interface Customer {
  id: string;
  accountId?: string;
  code: string;
  name: string;
  type: CustomerType;
  phone: string;
  email: string;
  taxCode?: string;
  address?: string;
  rentedM2: number;
  debt: number;
  status: CustomerStatus;
}

export interface Contract {
  id: string;
  code: string;
  customerId: string;
  areaId: string;       // khu vực đầu tiên (backward compat)
  areaIds?: string[];   // tất cả khu vực (multi-area)
  capacity: number;
  rentalUnit: RentalUnit;
  startDate: string;
  endDate: string;
  unitPrice: number;
  monthlyRent: number;
  serviceFee: number;
  deposit: number;
  paymentCycle: PaymentCycle;
  status: ContractStatus;
  note?: string;
}

export interface BillingCycle {
  id: string;
  contractId: string;
  startDate: string;
  endDate: string;
  dueDate: string;
  totalAmount: number;
  status: 'PENDING' | 'INVOICED' | 'PAID';
}

export interface Invoice {
  id: string;
  number: string;
  date: string;
  customerId: string; // Vẫn giữ để tiện tra cứu
  billingCycleId: string;
  period: string;
  content: string;
  amountBeforeTax: number;
  vat: number;
  total: number;
  dueDate: string;
  status: PaymentStatus;
  paidAmount: number;
  debtAmount: number;
}

export interface Transaction {
  id: string;
  date: string;
  type: 'Thu' | 'Chi';
  category: string;
  customerId?: string;
  contractId?: string;
  invoiceId?: string;
  amount: number;
  method: string;
  content: string;
  status: 'XacNhan' | 'Huy';
}

export interface RentalRequest {
  id: string;
  code: string;
  customerId?: string;
  customerName: string;
  phone: string;
  email: string;
  requestedCapacity: number;
  rentalUnit: RentalUnit;
  preferredType: AreaType;
  areaId?: string; // Legacy
  areaIds?: string[];
  startDate: string;
  endDate: string;
  specialRequest?: string;
  date: string;
  status: RequestStatus;
  note?: string;
}

export interface PriceRow {
  id: string;
  type: AreaType;
  unitPrice: number;
  unit: string;
  effectiveFrom: string;
  status: 'DangApDung' | 'Ngung';
}

export interface InspectionItem {
  areaId: string;
  systemStatus: AreaStatus;
  actualStatus: AreaStatus;
  match: boolean;
}

export interface Inspection {
  id: string;
  warehouseId: string;
  inspectorId: string;
  month: string;
  date: string;
  items: InspectionItem[];
  confirmed: boolean;
}
