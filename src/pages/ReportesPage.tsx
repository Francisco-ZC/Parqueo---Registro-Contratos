/**
 * PÁGINA: ReportesPage
 * ====================
 * Vista de historial de pagos. Muestra todos los pagos registrados,
 * del más reciente al más antiguo, con filtros por texto y por período.
 *
 * FILTROS:
 * - Por texto: nombre del cliente, placa o email del usuario que registró
 * - Por tiempo: todos / hoy / esta semana / este mes
 *
 * NOTA DE INTEGRACIÓN:
 * Cuando conectes con Firestore, reemplazá `pagos` por la respuesta de
 * `obtenerTodosLosPagos()` de pagoService. El campo `clienteNombre`
 * está denormalizado en el documento de Pago para evitar joins.
 *
 * Props:
 * - pagos: lista de pagos a mostrar
 * - onBack: vuelve al dashboard
 */

import { useState } from 'react';
import '../css/Components.css';
import { formatMonto, formatFecha } from '../utils/Formatters';
import { daysUntil } from '../utils/DateUtils';
import type { Pago } from '../models/Types';

interface ReportesPageProps {
  pagos: Pago[];
  onBack: () => void;
}

type TimeFiltro = 'todos' | 'hoy' | 'semana' | 'mes';

const FILTRO_LABELS: Record<TimeFiltro, string> = {
  todos:  'Todos',
  hoy:    'Hoy',
  semana: 'Esta semana',
  mes:    'Este mes',
};

export default function ReportesPage({ pagos, onBack }: ReportesPageProps) {
  const [search, setSearch]   = useState('');
  const [filtro, setFiltro]   = useState<TimeFiltro>('todos');

  // Aplicar filtros
  const filtered = pagos
    .filter((p) => {
      const s = search.toLowerCase();
      return (
        p.clienteNombre.toLowerCase().includes(s) ||
        p.placa.toLowerCase().includes(s) ||
        p.registradoPor.toLowerCase().includes(s)
      );
    })
    .filter((p) => {
      const dias = daysUntil(p.fechaPago); // negativo = en el pasado
      if (filtro === 'hoy')    return dias === 0;
      if (filtro === 'semana') return dias >= -7;
      if (filtro === 'mes')    return dias >= -30;
      return true;
    })
    // Más reciente primero
    .sort((a, b) => b.fechaPago.localeCompare(a.fechaPago));

  const totalFiltrado = filtered.reduce((s, p) => s + p.monto, 0);

  return (
    <>
      {/* Botón volver */}
      <button className="back-btn" onClick={onBack}>
        ← Volver al dashboard
      </button>

      <div className="table-card">
        {/* Header */}
        <div className="table-header">
          <div className="table-header-left">
            <div className="table-title">Historial de pagos</div>
            <div className="search-box">
              <span className="search-icon">🔍</span>
              <input
                placeholder="Buscar por cliente, placa o usuario…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {/* Total dinámico */}
          <div
            style={{
              fontFamily: 'var(--font-head)',
              fontSize: 13,
              fontWeight: 700,
              color: 'var(--blue)',
            }}
          >
            Total: {formatMonto(totalFiltrado)}
            <div style={{ fontSize: 10, fontWeight: 500, color: 'var(--text-3)', textAlign: 'right' }}>
              {filtered.length} registro(s)
            </div>
          </div>
        </div>

        {/* Filtros de tiempo */}
        <div
          style={{
            padding: '12px 20px',
            borderBottom: '1px solid var(--border)',
          }}
        >
          <div className="filter-bar" style={{ margin: 0 }}>
            {(Object.keys(FILTRO_LABELS) as TimeFiltro[]).map((f) => (
              <button
                key={f}
                className={`filter-chip ${filtro === f ? 'active' : ''}`}
                onClick={() => setFiltro(f)}
              >
                {FILTRO_LABELS[f]}
              </button>
            ))}
          </div>
        </div>

        {/* Tabla o empty state */}
        {filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <div className="empty-title">Sin registros</div>
            <div className="empty-sub">
              No hay pagos que coincidan con el criterio seleccionado
            </div>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th className="no-sort">Cliente</th>
                <th className="no-sort">Placa</th>
                <th className="no-sort">Monto</th>
                <th className="no-sort">Fecha de pago</th>
                <th className="no-sort">Registrado por</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const diasAtras = Math.abs(daysUntil(p.fechaPago));
                return (
                  <tr key={p.id} className="no-hover">
                    <td>
                      <div className="client-name">{p.clienteNombre}</div>
                    </td>
                    <td>
                      <span className="plate-badge" style={{ fontSize: 11, padding: '2px 7px' }}>
                        {p.placa}
                      </span>
                    </td>
                    <td>
                      <span className="amount-highlight">{formatMonto(p.monto)}</span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 500, fontSize: 13 }}>
                        {formatFecha(p.fechaPago)}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-3)' }}>
                        {diasAtras === 0 ? 'Hoy' : `Hace ${diasAtras}d`}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: 12, color: 'var(--text-2)' }}>
                        👤 {p.registradoPor}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}