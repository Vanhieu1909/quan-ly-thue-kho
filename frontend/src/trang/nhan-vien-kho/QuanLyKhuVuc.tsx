import { useMemo, useState, useEffect } from 'react';
import { areas as seed } from '../../du-lieu/duLieuMau';
import type { Area, AreaStatus } from '../../kieu';
import { areaTypeLabel } from '../../thu-vien/dinhDang';
import { NhanTrangThaiKhuVuc } from '../../thanh-phan/NhanTrangThai';
import { BanDoKho } from '../../thanh-phan/BanDoKho';
import { BangYeuCauTrangThaiKho } from '../../thanh-phan/BangYeuCauTrangThaiKho';

export function QuanLyKhuVuc() {
  const [areas, setAreas] = useState<Area[]>(() => {
    const raw = localStorage.getItem('mock_areas');
    return raw ? JSON.parse(raw) : seed;
  });
  const [statusFilter, setStatusFilter] = useState<AreaStatus | 'All'>('All');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [reportModalAreaId, setReportModalAreaId] = useState<string | null>(null);

  useEffect(() => {
    const loadAreas = () => {
      const raw = localStorage.getItem('mock_areas');
      if (raw) setAreas(JSON.parse(raw));
    };
    window.addEventListener('storage', loadAreas);
    return () => window.removeEventListener('storage', loadAreas);
  }, []);

  const filtered = useMemo(
    () => (statusFilter === 'All' ? areas : areas.filter((a) => a.status === statusFilter)),
    [areas, statusFilter],
  );

  function updateStatus(id: string, status: AreaStatus) {
    setAreas((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));
  }

  return (
    <div className="stack">
      <div className="panel">
        <div className="panel-bd">
          <BanDoKho
            areas={areas}
            mode="kiem-ke"
            selectedId={selectedId}
            onSelect={(a) => setSelectedId(a.id)}
            title="Bản đồ kho — chọn ô rồi cập nhật trạng thái hoặc báo lỗi"
          />
        </div>
      </div>

      {selectedId && (
        <div className="summary-box">
          {(() => {
            const a = areas.find((x) => x.id === selectedId)!;
            return (
              <div className="row" style={{ alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <span>
                  Đang chọn: <strong>{a.code}</strong> — {a.name}
                </span>
                <select
                  className="filter-select"
                  value={a.status}
                  onChange={(e) => updateStatus(a.id, e.target.value as AreaStatus)}
                >
                  <option value="Trong">Đang trống</option>
                  <option value="DaThue">Đang cho thuê</option>
                  <option value="BaoTri">Đang bảo dưỡng</option>
                </select>

                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => setReportModalAreaId(a.id)}
                >
                  ⚠️ Báo lỗi kho {a.code} (Gửi Admin duyệt)
                </button>
              </div>
            );
          })()}
        </div>
      )}

      <div className="toolbar">
        <div className="toolbar-left">
          <select className="filter-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as AreaStatus | 'All')}>
            <option value="All">Tất cả trạng thái</option>
            <option value="Trong">Đang trống</option>
            <option value="DaThue">Đang cho thuê</option>
            <option value="BaoTri">Đang bảo dưỡng</option>
            <option value="LoiChoXacNhan">🔴 Lỗi đang chờ xác nhận</option>
          </select>
        </div>
      </div>

      <div className="panel">
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>STT</th>
                <th>Mã khu vực</th>
                <th>Tên khu vực</th>
                <th>Diện tích</th>
                <th>Loại</th>
                <th>Tầng</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a, idx) => (
                <tr
                  key={a.id}
                  onClick={() => setSelectedId(a.id)}
                  style={{ cursor: 'pointer', background: selectedId === a.id ? '#f0f7f4' : undefined }}
                >
                  <td>{idx + 1}</td>
                  <td>{a.code}</td>
                  <td>{a.name}</td>
                  <td>{a.capacity} {a.rentalUnit}</td>
                  <td>{areaTypeLabel[a.type]}</td>
                  <td>Tầng {a.map.floor}</td>
                  <td>
                    <NhanTrangThaiKhuVuc status={a.status} />
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <select
                        className="filter-select"
                        style={{ minWidth: 140 }}
                        value={a.status}
                        onChange={(e) => updateStatus(a.id, e.target.value as AreaStatus)}
                      >
                        <option value="Trong">Đang trống</option>
                        <option value="DaThue">Đang cho thuê</option>
                        <option value="BaoTri">Đang bảo dưỡng</option>
                      </select>
                      <button
                        className="btn btn-primary btn-sm"
                        style={{ fontSize: '0.78rem', whiteSpace: 'nowrap' }}
                        title="Báo lỗi kho này gửi Admin phê duyệt"
                        onClick={(e) => {
                          e.stopPropagation();
                          setReportModalAreaId(a.id);
                        }}
                      >
                        ⚠️ Báo lỗi
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Yêu cầu cập nhật trạng thái kho & Báo lỗi kho cho Admin duyệt */}
      <BangYeuCauTrangThaiKho
        mode="staff"
        areas={areas}
        requestAreaId={reportModalAreaId}
        onRequestModalClose={() => setReportModalAreaId(null)}
      />
    </div>
  );
}
