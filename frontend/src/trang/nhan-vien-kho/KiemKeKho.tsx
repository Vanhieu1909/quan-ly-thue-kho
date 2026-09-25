import { useState } from 'react';
import { areas as seed } from '../../du-lieu/duLieuMau';
import type { Area, AreaStatus, InspectionItem } from '../../kieu';
import { areaStatusLabel } from '../../thu-vien/dinhDang';
import { NhanTrangThaiKhuVuc } from '../../thanh-phan/NhanTrangThai';
import { BanDoKho } from '../../thanh-phan/BanDoKho';

export function KiemKeKho() {
  const [areas, setAreas] = useState<Area[]>(() => {
    const raw = localStorage.getItem('mock_areas');
    return raw ? JSON.parse(raw) : seed;
  });
  const [items, setItems] = useState<InspectionItem[]>(() => {
    const raw = localStorage.getItem('mock_areas');
    const sourceAreas: Area[] = raw ? JSON.parse(raw) : seed;
    return sourceAreas.map((a) => ({
      areaId: a.id,
      systemStatus: a.status,
      actualStatus: a.status,
      match: true,
    }));
  });
  const [selectedId, setSelectedId] = useState<string | null>(() => {
    const raw = localStorage.getItem('mock_areas');
    const sourceAreas: Area[] = raw ? JSON.parse(raw) : seed;
    return sourceAreas[0]?.id ?? null;
  });
  const [confirmed, setConfirmed] = useState(false);

  const statusById = Object.fromEntries(items.map((i) => [i.areaId, i.actualStatus])) as Record<
    string,
    AreaStatus
  >;

  function setActual(areaId: string, actualStatus: AreaStatus) {
    setItems((prev) =>
      prev.map((it) =>
        it.areaId === areaId
          ? { ...it, actualStatus, match: it.systemStatus === actualStatus }
          : it,
      ),
    );
    setConfirmed(false);
  }

  const matched = items.filter((i) => i.match).length;
  const mismatched = items.length - matched;
  const selectedItem = items.find((i) => i.areaId === selectedId);
  const selectedArea = areas.find((a) => a.id === selectedId);

  return (
    <div className="stack">
      <div className="stats">
        <div className="stat-card">
          <div className="label">Đợt kiểm kê</div>
          <div className="value" style={{ fontSize: '1.25rem' }}>Tháng 9/2026</div>
          <div className="hint">Ngày kiểm kê: 06/09/2026</div>
        </div>
        <div className="stat-card ok">
          <div className="label">Khớp</div>
          <div className="value">{matched}</div>
        </div>
        <div className="stat-card danger">
          <div className="label">Chênh lệch</div>
          <div className="value">{mismatched}</div>
        </div>
      </div>

      <div className="grid-2">
        <div className="panel">
          <div className="panel-bd">
            <BanDoKho
              areas={areas}
              statusById={statusById}
              mode="kiem-ke"
              selectedId={selectedId}
              onSelect={(a) => setSelectedId(a.id)}
              title="Bản đồ kho — chọn ô để kiểm kê"
            />
          </div>
        </div>

        <div className="panel">
          <div className="panel-hd">
            <h2>Ghi nhận trạng thái thực tế</h2>
          </div>
          <div className="panel-bd">
            {!selectedArea || !selectedItem ? (
              <div className="empty">Chọn một ô trên bản đồ</div>
            ) : (
              <div className="stack">
                <div className="detail-grid">
                  <div className="detail-item">
                    <label>Mã khu vực</label>
                    <strong>{selectedArea.code}</strong>
                  </div>

                  <div className="detail-item">
                    <label>Tên</label>
                    <strong>{selectedArea.name}</strong>
                  </div>
                  <div className="detail-item">
                    <label>Diện tích</label>
                    <strong>{selectedArea.capacity} {selectedArea.rentalUnit}</strong>
                  </div>
                  <div className="detail-item">
                    <label>Trạng thái hệ thống</label>
                    <NhanTrangThaiKhuVuc status={selectedItem.systemStatus} />
                  </div>
                  <div className="detail-item">
                    <label>Kết quả</label>
                    <strong style={{ fontSize: '1.2rem' }}>{selectedItem.match ? '✓ Khớp' : '✗ Chênh lệch'}</strong>
                  </div>
                </div>

                <div className="field">
                  <label>Trạng thái thực tế tại kho</label>
                  <select
                    className="filter-select"
                    style={{ width: '100%' }}
                    value={selectedItem.actualStatus}
                    onChange={(e) => setActual(selectedArea.id, e.target.value as AreaStatus)}
                  >
                    {(Object.keys(areaStatusLabel) as AreaStatus[]).map((s) => (
                      <option key={s} value={s}>
                        {areaStatusLabel[s]}
                      </option>
                    ))}
                  </select>
                </div>

                <p style={{ color: 'var(--muted)', fontSize: '0.85rem', margin: 0 }}>
                  Đổi trạng thái thực tế nếu khác với hệ thống (đang trống / đang cho thuê / đang bảo dưỡng).
                  Bản đồ bên trái cập nhật màu theo trạng thái bạn vừa ghi nhận.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-hd">
          <h2>Bảng đối chiếu kiểm kê</h2>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => {
              const updatedAreas = areas.map(a => {
                const it = items.find(item => item.areaId === a.id);
                return it ? { ...a, status: it.actualStatus } : a;
              });
              setAreas(updatedAreas);
              localStorage.setItem('mock_areas', JSON.stringify(updatedAreas));
              window.dispatchEvent(new Event('storage'));
              setConfirmed(true);
              alert('✅ Đã xác nhận kiểm kê và cập nhật trạng thái kho vào hệ thống thành công!');
            }}
            disabled={confirmed}
          >
            {confirmed ? 'Đã xác nhận kiểm kê' : 'Xác nhận kiểm kê & Cập nhật hệ thống'}
          </button>
        </div>
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Khu vực</th>
                <th>Hệ thống</th>
                <th>Thực tế</th>
                <th>Kết quả</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it) => {
                const area = areas.find((a) => a.id === it.areaId)!;
                return (
                  <tr
                    key={it.areaId}
                    onClick={() => setSelectedId(it.areaId)}
                    style={{
                      cursor: 'pointer',
                      background: selectedId === it.areaId ? '#f0f7f4' : undefined,
                    }}
                  >
                    <td>
                      <strong>{area.code}</strong>
                      <div style={{ color: 'var(--muted)', fontSize: '0.78rem' }}>{area.name}</div>
                    </td>
                    <td>
                      <NhanTrangThaiKhuVuc status={it.systemStatus} />
                    </td>
                    <td>
                      <NhanTrangThaiKhuVuc status={it.actualStatus} />
                    </td>
                    <td style={{ fontSize: '1.1rem' }}>{it.match ? '✓' : '✗'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
