/**
 * PÁGINA: DashboardPage
 * =====================
 * Vista principal del sistema. Muestra la tabla de todos los clientes
 * con sus alquileres activos, ordenada por próxima fecha de pago.
 *
 * LÓGICA DE COLORES DE FILAS:
 * - Rojo:    la fecha de pago ya venció (días <= 0)
 * - Amarillo: queda menos del 40% del periodo (ej: <12 días en mensual)
 * - Blanco:  sin urgencia
 *
 * ORDENAMIENTO:
 * - Por defecto: proximoPago ASC (los más urgentes arriba)
 * - Click en columna: cambia la columna y alterna ASC/DESC
 *
 * Props:
 * - clientes: lista completa de clientes con sus alquileres
 * - onClienteClick: navega a la vista de detalle del cliente
 * - onNuevoCliente: abre el modal de registro
 * - onConfirmarPago: abre el modal de confirmación de pago
 * - onVerReportes: navega a la vista de reportes
 */

import { useState } from 'react';
import '../css/components.css';
import '../css/DashboardPage.css';
import { StatusBadge, PeriodoBadge } from '../components/Uicomponents';
import { formatMonto, formatFecha, getInitials } from '../utils/Formatters';
import { daysUntil, calcRowStatus } from '../utils/DateUtils';
import type { Cliente, ClienteRow, PeriodoCobro } from '../models/Types';

interface DashboardPageProps {
  clientes: Cliente[];
  onClienteClick: (cliente: Cliente) => void;
  onNuevoCliente: () => void;
  onConfirmarPago: (cliente: Cliente) => void;
  onVerReportes: () => void;
}

type SortCol = 'nombre' | 'proximoPagoMin' | 'montoTotal' | 'periodoDisplay';
type SortDir = 'asc' | 'desc';

export default function DashboardPage({
  clientes,
  onClienteClick,
  onNuevoCliente,
  onConfirmarPago,
  onVerReportes,
}: DashboardPageProps) {
  const [search, setSearch]   = useState('');
  const [sortCol, setSortCol] = useState<SortCol>('proximoPagoMin');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  // ── Stats ──
  const montoTotal = clientes.reduce((acc, c) => {
    return acc + c.alquileres
      .filter((a) => a.estado === 'activo')
      .reduce((s, a) => s + a.monto, 0);
  }, 0);

  const vencidos = clientes.filter((c) =>
    c.alquileres.some(
      (a) => a.estado === 'activo' && daysUntil(a.proximoPago) <= 0
    )
  ).length;

  const proximos = clientes.filter((c) => {
    const activos = c.alquileres.filter((a) => a.estado === 'activo');
    return activos.some((a) => {
      const dias  = daysUntil(a.proximoPago);
      const total = a.periodo === 'semanal' ? 7 : a.periodo === 'quincenal' ? 14 : 30;
      return dias > 0 && dias / total <= 0.4;
    });
  }).length;

  // ── Enriquecer clientes con campos calculados ──
  const rows: ClienteRow[] = clientes
    .filter((c) => {
      const s = search.toLowerCase();
      return (
        c.nombre.toLowerCase().includes(s) ||
        c.alquileres.some((a) => a.placa.toLowerCase().includes(s))
      );
    })
    .map((c) => {
      const activos = c.alquileres.filter((a) => a.estado === 'activo');
      const montoTotal = activos.reduce((s, a) => s + a.monto, 0);

      // La fecha más próxima entre todos los alquileres activos
      const proximoPagoMin = activos.length
        ? activos.reduce(
            (min, a) => (a.proximoPago < min ? a.proximoPago : min),
            activos[0].proximoPago
          )
        : '9999-12-31';

      const periodoDisplay: PeriodoCobro = activos[0]?.periodo ?? 'mensual';
      const diasRestantes = daysUntil(proximoPagoMin);
      const rowStatus = activos.length
        ? calcRowStatus(proximoPagoMin, periodoDisplay)
        : 'ok';

      return {
        ...c,
        montoTotal,
        proximoPagoMin,
        diasRestantes,
        periodoDisplay,
        rowStatus,
      };
    })
    .sort((a, b) => {
      const va = a[sortCol];
      const vb = b[sortCol];
      const dir = sortDir === 'asc' ? 1 : -1;

      if (typeof va === 'number' && typeof vb === 'number') {
        return (va - vb) * dir;
      }
      return String(va).localeCompare(String(vb)) * dir;
    });

  function handleSort(col: SortCol) {
    if (sortCol === col) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortCol(col); setSortDir('asc'); }
  }

  function SortArrow({ col }: { col: SortCol }) {
    const active = sortCol === col;
    return (
      <span className={`sort-arrow ${active ? 'active' : ''}`}>
        {active && sortDir === 'desc' ? '↓' : '↑'}
      </span>
    );
  }

  return (
    <>
      {/* ── Stat cards ── */}
      <div className="stat-grid">
        <div className="stat-card">
          <span className="stat-icon">👥</span>
          <div className="stat-label">Total clientes</div>
          <div className="stat-value">{clientes.length}</div>
          <div className="stat-delta">registrados en el sistema</div>
        </div>

        <div className="stat-card">
          <span className="stat-icon">💰</span>
          <div className="stat-label">Cobro del periodo</div>
          <div className="stat-value money">{formatMonto(montoTotal)}</div>
          <div className="stat-delta">suma de alquileres activos</div>
        </div>

        <div className="stat-card warn">
          <span className="stat-icon">⏰</span>
          <div className="stat-label">Por vencer</div>
          <div className="stat-value warn">{proximos}</div>
          <div className="stat-delta">dentro del próximo 40%</div>
        </div>

        <div className="stat-card danger">
          <span className="stat-icon">🚨</span>
          <div className="stat-label">Vencidos</div>
          <div className="stat-value danger">{vencidos}</div>
          <div className="stat-delta">pago no registrado</div>
        </div>
      </div>

      {/* ── Tabla ── */}
      <div className="table-card">
        <div className="table-header">
          <div className="table-header-left">
            <div className="table-title">Clientes</div>
            <div className="search-box">
              <span className="search-icon">🔍</span>
              <input
                placeholder="Buscar por nombre o placa…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-outline btn-sm" onClick={onVerReportes}>
              📋 Reportes
            </button>
            <button className="btn btn-primary btn-sm" onClick={onNuevoCliente}>
              + Nuevo cliente
            </button>
          </div>
        </div>

        {rows.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🅿</div>
            <div className="empty-title">Sin resultados</div>
            <div className="empty-sub">
              No se encontraron clientes con ese criterio de búsqueda
            </div>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th onClick={() => handleSort('nombre')} className={sortCol === 'nombre' ? 'sorted' : ''}>
                  Cliente <SortArrow col="nombre" />
                </th>
                <th className="no-sort">Alquileres</th>
                <th onClick={() => handleSort('periodoDisplay')} className={sortCol === 'periodoDisplay' ? 'sorted' : ''}>
                  Periodo <SortArrow col="periodoDisplay" />
                </th>
                <th onClick={() => handleSort('proximoPagoMin')} className={sortCol === 'proximoPagoMin' ? 'sorted' : ''}>
                  Próximo pago <SortArrow col="proximoPagoMin" />
                </th>
                <th onClick={() => handleSort('montoTotal')} className={sortCol === 'montoTotal' ? 'sorted' : ''}>
                  Monto <SortArrow col="montoTotal" />
                </th>
                <th className="no-sort" style={{ textAlign: 'center' }}>Estado</th>
                <th className="no-sort" />
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => {
                const tieneActivos = c.alquileres.filter(a => a.estado === 'activo').length > 0;
                return (
                  <tr
                    key={c.id}
                    className={
                      c.rowStatus === 'danger' ? 'row-danger' :
                      c.rowStatus === 'warn'   ? 'row-warn'   : ''
                    }
                    onClick={() => onClienteClick(c)}
                  >
                    {/* Nombre */}
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div
                          style={{
                            width: 32, height: 32, borderRadius: '50%',
                            background: 'linear-gradient(135deg, var(--blue-mid), var(--sky))',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontFamily: 'var(--font-head)', fontSize: 11, fontWeight: 700,
                            color: 'white', flexShrink: 0,
                          }}
                        >
                          {getInitials(c.nombre)}
                        </div>
                        <div>
                          <div className="client-name">{c.nombre}</div>
                          {c.cedula && <div className="client-sub">CC: {c.cedula}</div>}
                        </div>
                      </div>
                    </td>

                    {/* Alquileres (placas) */}
                    <td>
                      {c.alquileres.length === 0 ? (
                        <span className="badge badge-gray">Sin alquileres</span>
                      ) : (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                          {c.alquileres.map((a) => (
                            <span key={a.placa}>
                              <span className="plate-badge" style={{ fontSize: 11, padding: '2px 7px' }}>
                                {a.placa}
                              </span>
                              {a.estado === 'suspendido' && (
                                <span className="badge badge-gray" style={{ marginLeft: 3 }}>Susp.</span>
                              )}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>

                    {/* Periodo */}
                    <td>
                      {tieneActivos
                        ? <PeriodoBadge periodo={c.periodoDisplay} />
                        : <span style={{ color: 'var(--text-4)' }}>—</span>
                      }
                    </td>

                    {/* Fecha */}
                    <td>
                      {tieneActivos ? (
                        <>
                          <div style={{ fontWeight: 600, fontSize: 13 }}>
                            {formatFecha(c.proximoPagoMin)}
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--text-3)' }}>
                            {c.diasRestantes <= 0
                              ? `Hace ${Math.abs(c.diasRestantes)} días`
                              : `En ${c.diasRestantes} días`
                            }
                          </div>
                        </>
                      ) : (
                        <span style={{ color: 'var(--text-4)' }}>—</span>
                      )}
                    </td>

                    {/* Monto */}
                    <td>
                      {tieneActivos
                        ? <span className="amount-highlight">{formatMonto(c.montoTotal)}</span>
                        : <span style={{ color: 'var(--text-4)' }}>—</span>
                      }
                    </td>

                    {/* Estado */}
                    <td style={{ textAlign: 'center' }}>
                      {tieneActivos ? (
                        <StatusBadge
                          proximoPago={c.proximoPagoMin}
                          periodo={c.periodoDisplay}
                        />
                      ) : (
                        <span className="badge badge-gray">Sin contrato</span>
                      )}
                    </td>

                    {/* Acción — stopPropagation para no activar onClienteClick */}
                    <td onClick={(e) => e.stopPropagation()}>
                      {tieneActivos && (
                        <button
                          className="confirm-pay-btn"
                          onClick={() => onConfirmarPago(c)}
                        >
                          ✓ Confirmar pago
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Leyenda de colores */}
      <div className="table-legend">
        <div className="legend-item">
          <span className="legend-swatch danger" />
          Pago vencido
        </div>
        <div className="legend-item">
          <span className="legend-swatch warn" />
          Próximo a vencer (menos del 40% del periodo)
        </div>
      </div>
    </>
  );
}