import type {
  Account,
  Area,
  BillingCycle,
  Contract,
  Customer,
  Inspection,
  Invoice,
  PriceRow,
  RentalRequest,
  Transaction,
  Warehouse,
} from '../kieu';

export const accounts: Account[] = [
  {
    id: 'a1',
    username: 'admin',
    passwordHash: '123456',
    name: 'Hoàng Thu Huyền',
    role: 'admin',
    email: 'admin@thuekho.vn',
    status: 'ACTIVE',
  },
  {
    id: 'a2',
    username: 'staff',
    passwordHash: '123456',
    name: 'Lê Văn Hiếu',
    role: 'staff',
    email: 'kho@thuekho.vn',
    status: 'ACTIVE',
  },
  {
    id: 'a3',
    username: 'ketoan',
    passwordHash: '123456',
    name: 'Lê Ngọc Ánh',
    role: 'accountant',
    email: 'ketoan@thuekho.vn',
    status: 'ACTIVE',
  },
  {
    id: 'a4',
    username: '0901234567',
    passwordHash: '123456',
    name: 'Shop Thời Trang Luna',
    role: 'customer',
    phone: '0901234567',
    email: 'luna@shop.vn',
    status: 'ACTIVE',
  },
];

export const warehouses: Warehouse[] = [
  { id: 'w1', code: 'KHO-HN', name: 'Kho Trung Tâm Hà Nội', totalAreaM2: 5000, status: 'ACTIVE' },
  { id: 'w2', code: 'KHO-SG', name: 'Kho Trung Tâm Sài Gòn', totalAreaM2: 8000, status: 'ACTIVE' },
];

export const areas: Area[] = [
  { id: 'ar1', warehouseId: 'w1', code: 'A1', name: 'Dãy A1', capacity: 100, rentalUnit: 'Pallet', type: 'Ke', status: 'Trong', location: 'Dãy A', map: { floor: 1, row: 1, col: 1, rowSpan: 2, colSpan: 3 } },
  { id: 'ar2', warehouseId: 'w1', code: 'A2', name: 'Dãy A2', capacity: 80, rentalUnit: 'Pallet', type: 'Ke', status: 'Trong', location: 'Dãy A', map: { floor: 1, row: 3, col: 1, rowSpan: 2, colSpan: 3 } },
  { id: 'ar9', warehouseId: 'w1', code: 'A3', name: 'Dãy A3', capacity: 80, rentalUnit: 'Pallet', type: 'Ke', status: 'Trong', location: 'Dãy A', map: { floor: 1, row: 5, col: 1, rowSpan: 2, colSpan: 3 } },
  { id: 'ar10', warehouseId: 'w1', code: 'A4', name: 'Dãy A4', capacity: 60, rentalUnit: 'Pallet', type: 'Ke', status: 'Trong', location: 'Dãy A', map: { floor: 1, row: 7, col: 1, rowSpan: 2, colSpan: 3 } },
  { id: 'ar3', warehouseId: 'w1', code: 'B1', name: 'Dãy B1', capacity: 60, rentalUnit: 'Pallet', type: 'Ke', status: 'Trong', location: 'Dãy B', map: { floor: 1, row: 1, col: 4, rowSpan: 2, colSpan: 3 } },
  { id: 'ar11', warehouseId: 'w1', code: 'B2', name: 'Dãy B2', capacity: 60, rentalUnit: 'Pallet', type: 'Ke', status: 'Trong', location: 'Dãy B', map: { floor: 1, row: 3, col: 4, rowSpan: 2, colSpan: 3 } },
  { id: 'ar12', warehouseId: 'w1', code: 'B3', name: 'Dãy B3', capacity: 50, rentalUnit: 'Pallet', type: 'Ke', status: 'Trong', location: 'Dãy B', map: { floor: 1, row: 5, col: 4, rowSpan: 2, colSpan: 3 } },
  { id: 'ar13', warehouseId: 'w1', code: 'B4', name: 'Dãy B4', capacity: 50, rentalUnit: 'Pallet', type: 'Ke', status: 'Trong', location: 'Dãy B', map: { floor: 1, row: 7, col: 4, rowSpan: 2, colSpan: 3 } },
  { id: 'ar4', warehouseId: 'w1', code: 'C1', name: 'Dãy C1', capacity: 50, rentalUnit: 'Pallet', type: 'Ke', status: 'Trong', location: 'Dãy C', map: { floor: 1, row: 1, col: 7, rowSpan: 2, colSpan: 3 } },
  { id: 'ar5', warehouseId: 'w1', code: 'C2', name: 'Dãy C2', capacity: 50, rentalUnit: 'Pallet', type: 'Ke', status: 'Trong', location: 'Dãy C', map: { floor: 1, row: 3, col: 7, rowSpan: 2, colSpan: 3 } },
  { id: 'ar6', warehouseId: 'w1', code: 'C3', name: 'Dãy C3', capacity: 40, rentalUnit: 'Pallet', type: 'Ke', status: 'Trong', location: 'Dãy C', map: { floor: 1, row: 5, col: 7, rowSpan: 2, colSpan: 3 } },
  { id: 'ar7', warehouseId: 'w1', code: 'D1', name: 'Dãy D1', capacity: 90, rentalUnit: 'Pallet', type: 'Ke', status: 'Trong', location: 'Dãy D', map: { floor: 1, row: 1, col: 10, rowSpan: 2, colSpan: 3 } },
  { id: 'ar8', warehouseId: 'w1', code: 'D2', name: 'Dãy D2', capacity: 45, rentalUnit: 'Pallet', type: 'Ke', status: 'Trong', location: 'Dãy D', map: { floor: 1, row: 3, col: 10, rowSpan: 2, colSpan: 3 } },
];

export const customers: Customer[] = [];

export const contracts: Contract[] = [];

export const billingCycles: BillingCycle[] = [];

export const invoices: Invoice[] = [];

export const transactions: Transaction[] = [];

export const rentalRequests: RentalRequest[] = [];

export const priceTable: PriceRow[] = [
  { id: 'p1', type: 'Ke', unitPrice: 120000, unit: 'đồng/Pallet/tháng', effectiveFrom: '2026-01-01', status: 'DangApDung' },
];

export const inspections: Inspection[] = [
  {
    id: 'insp1',
    warehouseId: 'w1',
    inspectorId: 'a2',
    month: '09/2026',
    date: '2026-09-06',
    confirmed: false,
    items: [
      { areaId: 'ar1', systemStatus: 'DaThue', actualStatus: 'DaThue', match: true },
      { areaId: 'ar2', systemStatus: 'Trong', actualStatus: 'Trong', match: true },
    ]
  }
];

export const revenueByMonth = [
  { month: 'T3', revenue: 420 },
  { month: 'T4', revenue: 455 },
  { month: 'T5', revenue: 480 },
  { month: 'T6', revenue: 510 },
  { month: 'T7', revenue: 535 },
  { month: 'T8', revenue: 555 },
];

export const fillRateByMonth = [
  { month: 'T3', total: 815, rented: 0, rate: 0 },
  { month: 'T4', total: 815, rented: 0, rate: 0 },
  { month: 'T5', total: 815, rented: 0, rate: 0 },
  { month: 'T6', total: 815, rented: 0, rate: 0 },
  { month: 'T7', total: 815, rented: 0, rate: 0 },
  { month: 'T8', total: 815, rented: 0, rate: 0 },
];
