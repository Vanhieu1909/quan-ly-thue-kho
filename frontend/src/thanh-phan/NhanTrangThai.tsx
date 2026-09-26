import type { AreaStatus, ContractStatus, PaymentStatus, RequestStatus } from '../kieu';
import {
  areaStatusLabel,
  contractStatusLabel,
  paymentStatusLabel,
  requestStatusLabel,
} from '../thu-vien/dinhDang';

type Tone = 'ok' | 'warn' | 'danger' | 'info' | 'muted';

function Nhan({ tone, children }: { tone: Tone; children: string }) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}

export function NhanTrangThaiKhuVuc({ status }: { status: AreaStatus }) {
  const tone: Tone =
    status === 'Trong'
      ? 'ok'
      : status === 'DaThue'
      ? 'info'
      : status === 'LoiChoXacNhan'
      ? 'danger'
      : 'warn';
  return <Nhan tone={tone}>{areaStatusLabel[status]}</Nhan>;
}

export function NhanTrangThaiHopDong({ status }: { status: ContractStatus }) {
  const map: Record<ContractStatus, Tone> = {
    ChoHieuLuc: 'muted',
    DangHieuLuc: 'ok',
    SapHetHan: 'warn',
    DaGiaHan: 'info',
    DaKetThuc: 'muted',
    DaHuy: 'danger',
  };
  return <Nhan tone={map[status]}>{contractStatusLabel[status]}</Nhan>;
}

export function NhanTrangThaiThanhToan({ status }: { status: PaymentStatus }) {
  const map: Record<PaymentStatus, Tone> = {
    ChuaThanhToan: 'warn',
    ThanhToanMotPhan: 'info',
    DaThanhToan: 'ok',
    QuaHan: 'danger',
  };
  return <Nhan tone={map[status]}>{paymentStatusLabel[status]}</Nhan>;
}

export function NhanTrangThaiYeuCau({ status }: { status: RequestStatus }) {
  const map: Record<RequestStatus, Tone> = {
    Moi: 'info',
    DaTiepNhan: 'warn',
    DaDuyet: 'ok',
    TuChoi: 'danger',
  };
  return <Nhan tone={map[status]}>{requestStatusLabel[status]}</Nhan>;
}
