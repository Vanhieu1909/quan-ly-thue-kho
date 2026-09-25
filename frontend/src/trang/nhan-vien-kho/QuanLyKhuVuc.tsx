import { useMemo, useState } from 'react';
import { areas as seed } from '../../du-lieu/duLieuMau';
import type { Area, AreaStatus } from '../../kieu';
import { areaTypeLabel } from '../../thu-vien/dinhDang';
import { NhanTrangThaiKhuVuc } from '../../thanh-phan/NhanTrangThai';
import { BanDoKho } from '../../thanh-phan/BanDoKho';

export function QuanLyKhuVuc() {
  const [areas, setAreas] = useState<Area[]>(seed);
  const [statusFilter, setStatusFilter] = useState<AreaStatus | 'All'>('All');
  const [selectedId, setSelectedId] = useState<string | null>(null);

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
            title="Bản đồ kho — chọn ô rồi cập nhật trạng thái"
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
                <th>Cập nhật</th>
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
                    <select
                      className="filter-select"
                      style={{ minWidth: 150 }}
                      value={a.status}
                      onChange={(e) => updateStatus(a.id, e.target.value as AreaStatus)}
                    >
                      <option value="Trong">Đang trống</option>
                      <option value="DaThue">Đang cho thuê</option>
                      <option value="BaoTri">Đang bảo dưỡng</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
