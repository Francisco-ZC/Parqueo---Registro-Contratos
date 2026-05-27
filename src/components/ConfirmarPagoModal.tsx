/**
 * COMPONENTE: ConfirmarPagoModal
 * ================================
 * Modal que aparece cuando el admin hace clic en "Confirmar pago" en el dashboard.
 * Muestra el detalle de todos los alquileres activos del cliente y el monto total.
 *
 * AL CONFIRMAR el padre debe:
 *   1. Llamar confirmarPagoYAvanzar(placa) por cada alquiler activo → alquilerService
 *   2. Llamar crearPago(pagoInput) → pagoService
 *
 * Props:
 * - open: si el modal está abierto
 * - cliente: el cliente a cobrar (null = cerrado)
 * - registradoPor: email del usuario activo (de Firebase Auth)
 * - onClose: cierra el modal sin confirmar
 * - onConfirmar: ejecuta la confirmación de pago
 */

import '../css/components.css';
import type { Cliente } from '../models/Types';
import { formatMonto, formatFecha } from '../utils/Formatters';
import { PeriodoBadge } from './Uicomponents';

interface ConfirmarPagoModalProps {
  open: boolean;
  cliente: Cliente | null;
  registradoPor: string;
  onClose: () => void;
  onConfirmar: (cliente: Cliente, registradoPor: string) => void;
}

export default function ConfirmarPagoModal({
  open,
  cliente,
  registradoPor,
  onClose,
  onConfirmar,
}: ConfirmarPagoModalProps) {
  if (!open || !cliente) return null;

  const activos   = cliente.alquileres.filter((a) => a.estado === 'activo');
  const montoTotal = activos.reduce((sum, a) => sum + a.monto, 0);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-sm" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div>
            <div className="modal-title">Confirmar pago</div>
            <div className="modal-sub">{cliente.nombre}</div>
          </div>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        {/* Body */}
        <div className="modal-body">
          {/* Monto destacado */}
          <div
            style={{
              background: 'var(--sky-pale)',
              border: '1px solid var(--sky-light)',
              borderRadius: 'var(--radius-md)',
              padding: '14px 16px',
              marginBottom: 16,
            }}
          >
            <div
              style={{
                fontSize: 11,
                color: 'var(--text-3)',
                marginBottom: 4,
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                fontFamily: 'var(--font-head)',
              }}
            >
              Monto total a confirmar
            </div>
            <div
              style={{
                fontFamily: 'var(--font-head)',
                fontSize: 30,
                fontWeight: 800,
                color: 'var(--blue)',
              }}
            >
              {formatMonto(montoTotal)}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>
              {activos.length} alquiler(es) activo(s)
            </div>
          </div>

          {/* Detalle por alquiler */}
          {activos.map((a) => (
            <div
              key={a.placa}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '9px 0',
                borderBottom: '1px solid var(--border)',
                gap: 8,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span className="plate-badge" style={{ fontSize: 11, padding: '2px 7px' }}>
                  {a.placa}
                </span>
                <span style={{ fontSize: 12, color: 'var(--text-2)' }}>
                  {a.tipoVehiculo}
                </span>
                <PeriodoBadge periodo={a.periodo} />
              </div>
              <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 13 }}>
                {formatMonto(a.monto)}
              </div>
            </div>
          ))}

          {/* Fechas */}
          <div
            style={{
              marginTop: 14,
              padding: '10px 12px',
              background: 'var(--surface2)',
              borderRadius: 'var(--radius-sm)',
              fontSize: 12,
              color: 'var(--text-3)',
              lineHeight: 1.7,
            }}
          >
            <div>
              📅 Próximo pago actual:{' '}
              <strong style={{ color: 'var(--text-1)' }}>
                {formatFecha(activos[0]?.proximoPago)}
              </strong>
            </div>
            <div style={{ marginTop: 2 }}>
              Al confirmar, se avanzará automáticamente la fecha de cobro según el periodo.
            </div>
            <div style={{ marginTop: 4, fontSize: 11 }}>
              👤 Registrado por: {registradoPor}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>
            Cancelar
          </button>
          <button
            className="btn btn-success-solid"
            onClick={() => onConfirmar(cliente, registradoPor)}
          >
            ✓ Confirmar pago
          </button>
        </div>
      </div>
    </div>
  );
}