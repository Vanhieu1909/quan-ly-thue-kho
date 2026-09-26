import { useMemo } from 'react';
import type { Area, AreaStatus } from '../kieu';
import { areaStatusLabel } from '../thu-vien/dinhDang';
import { contracts as seedContracts, customers as seedCustomers } from '../du-lieu/duLieuMau';

export type CheDoBanDo = 'xem' | 'chon-thue' | 'kiem-ke';

interface BanDoKhoProps {
  areas: Area[];
  /** Trạng thái hiển thị trên ô (mặc định lấy từ area.status) */
  statusById?: Record<string, AreaStatus>;
  selectedId?: string | null;
  selectedIds?: string[];
  onSelect?: (area: Area) => void;
  mode?: CheDoBanDo;
  title?: string;
  /** Chỉ cho chọn các ô có status trong danh sách (vd: ['Trong'] khi thuê) */
  choPhepChon?: AreaStatus[];
  onLegendLoiClick?: () => void;
}



export function BanDoKho({
  areas,
  statusById,
  selectedId,
  selectedIds,
  onSelect,
  mode = 'xem',
  title = 'Bản đồ kho',
  choPhepChon,
  onLegendLoiClick,
}: BanDoKhoProps) {
  const tenantMap = useMemo(() => {
    try {
      const localContracts = localStorage.getItem('mock_contracts');
      const localCustomers = localStorage.getItem('mock_customers');
      
      const contracts = localContracts ? JSON.parse(localContracts) : seedContracts;
      const customers = localCustomers ? JSON.parse(localCustomers) : seedCustomers;
      
      const map: Record<string, { name: string, status: string }> = {};
      for (const a of areas) {
        if (a.status === 'DaThue') {
          // Hỗ trợ cả hợp đồng 1 khu (areaId) lẫn nhiều khu (areaIds)
          const activeContract = contracts.find((c: any) =>
            (c.status === 'DangHieuLuc' || c.status === 'ChoHieuLuc') &&
            (c.areaIds ? c.areaIds.includes(a.id) : c.areaId === a.id)
          );
          if (activeContract) {
            const cus = customers.find((c: any) => c.id === activeContract.customerId);
            if (cus) map[a.id] = { name: cus.name, status: activeContract.status };
          }
        }
      }
      return map;
    } catch (e) {
      return {};
    }
  }, [areas]);
  const floors = useMemo(
    () => [...new Set(areas.map((a) => a.map.floor))].sort((a, b) => a - b),
    [areas],
  );
  const floor = floors[0] ?? 1;
  const onFloor = areas.filter((a) => a.map.floor === floor);

  // 10 warehouse rows * 2 grid spans = 20 grid rows (A1..A10)
  const maxRow = 20;

  function statusOf(a: Area): AreaStatus {
    return statusById?.[a.id] ?? a.status;
  }

  function coTheChon(a: Area): boolean {
    if (!onSelect) return false;
    if (mode === 'kiem-ke') return true;
    if (mode === 'chon-thue') {
      const st = statusOf(a);
      if (choPhepChon) return choPhepChon.includes(st);
      return st === 'Trong';
    }
    return mode === 'xem' ? Boolean(onSelect) : false;
  }

  function handleClick(a: Area) {
    if (!coTheChon(a)) return;
    onSelect?.(a);
  }

  const counts = {
    Trong: areas.filter((a) => statusOf(a) === 'Trong').length,
    DaThue: areas.filter((a) => statusOf(a) === 'DaThue').length,
    BaoTri: areas.filter((a) => statusOf(a) === 'BaoTri').length,
    LoiChoXacNhan: areas.filter((a) => statusOf(a) === 'LoiChoXacNhan').length,
  };

  return (
    <div className="ban-do-kho">
      <div className="ban-do-kho__hd">
        <div>
          <h3>{title}</h3>
          <p className="ban-do-kho__hint">
            {mode === 'chon-thue' && 'Nhấp vào ô đang trống để chọn chỗ thuê.'}
            {mode === 'kiem-ke' && 'Nhấp vào ô trên bản đồ để ghi nhận kiểm kê.'}
            {mode === 'xem' && 'Sơ đồ mặt bằng khu kho; nhấp vào một khu vực để xem chi tiết.'}
          </p>
        </div>
        <span className="ban-do-kho__location">Khu kho · {onFloor.length} khu vực</span>
      </div>

      <div className="ban-do-kho__legend">
        <span className="lg lg-trong">Đang trống ({counts.Trong})</span>
        <span className="lg lg-thue">Đang cho thuê ({counts.DaThue})</span>
        <span className="lg lg-baotri">Đang bảo dưỡng ({counts.BaoTri})</span>
        {counts.LoiChoXacNhan > 0 && (
          <span
            className="lg lg-loichoxacnhan"
            style={{ fontWeight: 700, cursor: onLegendLoiClick ? 'pointer' : undefined }}
            onClick={onLegendLoiClick}
            title="Bấm vào đây để di chuyển xuống bảng Phê duyệt"
          >
            🔴 Lỗi đang chờ xác nhận ({counts.LoiChoXacNhan})
          </span>
        )}
      </div>

      <div className="ban-do-kho__stage">
        <div className="ban-do-kho__warehouse-label">MẶT BẰNG KHU KHO</div>
        <div
          className="ban-do-kho__grid"
          style={{
            gridTemplateColumns: `repeat(15, 1fr)`,
            gridTemplateRows: `repeat(${maxRow}, minmax(54px, auto))`,
            minHeight: 'auto',
          }}
        >
          {onFloor.map((a) => {
            const st = statusOf(a);
            const selectable = coTheChon(a);
            const selected = selectedIds ? selectedIds.includes(a.id) : selectedId === a.id;
            
            // 3 Paths: Between A & B (col 4), B & C (col 8), and C & D (col 12)
            let displayCol = a.map.col;
            if (a.map.col === 4) displayCol = 5;       // B shifted by 1 (cols 5..7)
            else if (a.map.col === 7) displayCol = 9;  // C shifted by 2 (cols 9..11)
            else if (a.map.col === 10) displayCol = 13; // D shifted by 3 (cols 13..15)

            return (
              <button
                key={a.id}
                type="button"
                className={[
                  'ban-do-o',
                  `ban-do-o--${st}`,
                  st === 'DaThue' && tenantMap[a.id]?.status === 'ChoHieuLuc' ? 'ban-do-o--ChoHieuLuc' : '',
                  selectable ? 'ban-do-o--clickable' : 'ban-do-o--locked',
                  selected ? 'ban-do-o--selected' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                style={{
                  gridRow: `${a.map.row} / span ${a.map.rowSpan ?? 1}`,
                  gridColumn: `${displayCol} / span ${a.map.colSpan ?? 1}`,
                }}
                onClick={() => handleClick(a)}
                disabled={!selectable}
                title={`${a.code} · ${areaStatusLabel[st]}`}
              >
                <strong>{a.code}</strong>
                <span className="ban-do-o__name">{a.name}</span>
                <span className="ban-do-o__meta">
                  {a.capacity} {a.rentalUnit}
                </span>
                <span className={`ban-do-o__status ban-do-o__status--${st}`}>
                  {st === 'DaThue' && tenantMap[a.id] 
                    ? (tenantMap[a.id].status === 'ChoHieuLuc' ? `Chờ cọc (${tenantMap[a.id].name})` : `Đang thuê (${tenantMap[a.id].name})`) 
                    : areaStatusLabel[st]}
                </span>
                {a.note && (
                  <span
                    className="ban-do-o__note"
                    title={a.note}
                    style={{
                      fontSize: '0.68rem',
                      fontWeight: 600,
                      color: '#92400e',
                      backgroundColor: '#fef3c7',
                      border: '1px solid #fde68a',
                      borderRadius: '4px',
                      padding: '1px 4px',
                      marginTop: '3px',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: 'block',
                      maxWidth: '100%',
                    }}
                  >
                    📝 {a.note}
                  </span>
                )}
              </button>
            );
          })}

          {[4, 8, 12].map((col) => (
            <div
              key={`aisle-${col}`}
              style={{
                gridRow: `1 / span ${maxRow}`,
                gridColumn: col,
                background: 'linear-gradient(180deg, #f8fafc 0%, #edf2f7 50%, #f8fafc 100%)',
                borderLeft: '2px dashed #cbd5e1',
                borderRight: '2px dashed #cbd5e1',
                borderTop: 'none',
                borderBottom: 'none',
                borderRadius: 6,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                color: '#64748b',
                userSelect: 'none',
                padding: '10px 0',
                boxShadow: 'inset 0 0 6px rgba(0, 0, 0, 0.02)',
              }}
            >
              <span style={{ fontSize: '0.75rem', opacity: 0.65 }}>🚶</span>
              <span
                style={{
                  writingMode: 'vertical-rl',
                  textOrientation: 'upright',
                  letterSpacing: '0.35em',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  color: '#475569',
                  textTransform: 'uppercase',
                }}
              >
                LỐI ĐI
              </span>
              <span style={{ fontSize: '0.75rem', opacity: 0.65 }}>🚶</span>
            </div>
          ))}
        </div>
      </div>
      {selectedId && (
        <div className="ban-do-kho__selected">
          {(() => {
            const a = areas.find((x) => x.id === selectedId);
            if (!a) return null;
            const st = statusOf(a);
            return (
              <>
                Đã chọn: <strong>{a.code}</strong> — {a.name} ({a.capacity} {a.rentalUnit}) ·{' '}
                <em>{st === 'DaThue' && tenantMap[a.id] ? (tenantMap[a.id].status === 'ChoHieuLuc' ? `Chờ cọc (${tenantMap[a.id].name})` : `Đang thuê (${tenantMap[a.id].name})`) : areaStatusLabel[st]}</em>
              </>
            );
          })()}
        </div>
      )}
    </div>
  );
}
