import { useState, useEffect } from 'react';
import { areas as seedAreas, rentalRequests as seedRentalRequests } from '../../du-lieu/duLieuMau';
import { taiYeuCau } from '../../du-lieu/yeuCauLocal';
import type { Area, RentalRequest } from '../../kieu';
import { NhanTrangThaiKhuVuc, NhanTrangThaiYeuCau } from '../../thanh-phan/NhanTrangThai';
import { BangDieuKhien, TheThongKe } from '../../thanh-phan/TheThongKe';
import { areaTypeLabel, formatDate } from '../../thu-vien/dinhDang';

export function TongQuan() {
  const [areas, setAreas] = useState<Area[]>(seedAreas);
  const [rentalRequests, setRentalRequests] = useState<RentalRequest[]>(seedRentalRequests);

  useEffect(() => {
    const lAreas = localStorage.getItem('mock_areas');
    if (lAreas) setAreas(JSON.parse(lAreas));
    // Tải yêu cầu thuê từ localStorage (bao gồm cả yêu cầu mới từ khách hàng)
    const localReqs = taiYeuCau();
    if (localReqs.length > 0) setRentalRequests(localReqs);
  }, []);

  const total = areas.length;
  const rented = areas.filter((a) => a.status === 'DaThue').length;
  const empty = areas.filter((a) => a.status === 'Trong').length;
  const maintenance = areas.filter((a) => a.status === 'BaoTri').length;

  const newRequests = rentalRequests.filter((r) => r.status === 'Moi');

  return (
    <div className="stack">
      <div className="stats">
        <TheThongKe label="Tổng KV" value={total} />
        <TheThongKe label="Đã thuê" value={rented} tone="ok" />
        <TheThongKe label="Còn trống" value={empty} />
        <TheThongKe label="Bảo trì" value={maintenance} tone="warn" />
      </div>

      <div className="grid-2">
        <BangDieuKhien title="Khu vực cần xử lý">
          <div className="list-alert">
            {areas
              .filter((a) => a.status === 'BaoTri')
              .map((a) => (
                <div className="alert-item" key={a.id}>
                  <div>
                    <strong>{a.code} · {a.name}</strong>
                    <span>Đang bảo trì — cần kiểm tra sau sửa chữa</span>
                  </div>
                  <NhanTrangThaiKhuVuc status={a.status} />
                </div>
              ))}
            {areas
              .filter((a) => a.status === 'Trong')
              .slice(0, 2)
              .map((a) => (
                <div className="alert-item" key={a.id}>
                  <div>
                    <strong>{a.code} · {a.name}</strong>
                    <span>Còn trống — sẵn sàng bàn giao</span>
                  </div>
                  <NhanTrangThaiKhuVuc status={a.status} />
                </div>
              ))}
            {maintenance === 0 && empty === 0 && (
              <div className="empty">Tất cả khu vực đang hoạt động bình thường</div>
            )}
          </div>
        </BangDieuKhien>

        <BangDieuKhien title="Lịch kiểm kê định kỳ">
          <div className="list-alert">
            <div className="alert-item">
              <div>
                <strong>Kiểm kê tháng 9/2026</strong>
                <span>Tầng 1–2 · Dự kiến 10/09/2026</span>
              </div>
              <span className="badge badge-info">Sắp tới</span>
            </div>
            <div className="alert-item">
              <div>
                <strong>Yêu cầu thuê mới</strong>
                <span>{newRequests.length} yêu cầu chờ tiếp nhận</span>
              </div>
              <NhanTrangThaiYeuCau status="Moi" />
            </div>
          </div>
        </BangDieuKhien>
      </div>

      <BangDieuKhien title="Yêu cầu thuê gần đây">
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Mã YC</th>
                <th>Khách hàng</th>
                <th>Diện tích</th>
                <th>Loại</th>
                <th>Ngày gửi</th>
                <th>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {rentalRequests.slice(0, 5).map((r) => (
                <tr key={r.id}>
                  <td>{r.code}</td>
                  <td>{r.customerName}</td>
                  <td>{r.requestedCapacity} {r.rentalUnit}</td>
                  <td>{areaTypeLabel[r.preferredType]}</td>
                  <td>{formatDate(r.date)}</td>
                  <td>
                    <NhanTrangThaiYeuCau status={r.status} />
                  </td>
                </tr>
              ))}
              {rentalRequests.length === 0 && (
                <tr>
                  <td colSpan={6}>
                    <div className="empty">Chưa có yêu cầu thuê nào</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </BangDieuKhien>
    </div>
  );
}
