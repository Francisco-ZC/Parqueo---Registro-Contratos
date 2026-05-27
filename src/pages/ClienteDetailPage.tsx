/**
 * PÁGINA: ClienteDetailPage
 * =========================
 * Vista de detalle de un cliente. Muestra sus datos personales
 * y la lista de alquileres con opciones de editar, suspender y reactivar.
 *
 * Props:
 * - cliente: objeto Cliente a mostrar (se busca actualizado desde la lista)
 * - onBack: vuelve al dashboard
 * - onSuspender: cambia el estado de un alquiler (activo ↔ suspendido)
 * - addToast: muestra notificaciones
 */

import { useState } from 'react';
import '../css/components.css';
import '../css/ClienteDetailsPage.css';
import { ConfirmDialog, StatusBadge, PeriodoBadge } from '../components/Uicomponents';
import { formatMonto, formatFecha, getInitials, labelVehiculo, labelContrato } from '../utils/Formatters';
import { daysUntil } from '../utils/DateUtils';
import type { Cliente, Alquiler, ToastType } from '../models/Types';

interface ClienteDetailPageProps {
  cliente: Cliente;
  onBack: () => void;
  onSuspender: (clienteId: string, placa: string, nuevoEstado: 'activo' | 'suspendido') => void;
  addToast: (msg: string, type?: ToastType) => void;
}

export default function ClienteDetailPage({
  cliente,
  onBack,
  onSuspender,
  addToast,
}: ClienteDetailPageProps) {
  // El alquiler sobre el que se está por confirmar suspensión/reactivación
  const [alquilerEnAccion, setAlquilerEnAccion] = useState<Alquiler | null>(null);

  const initials    = getInitials(cliente.nombre);
  const activos     = cliente.alquileres.filter((a) => a.estado === 'activo');
  const montoTotal  = activos.reduce((s, a) => s + a.monto, 0);

  function handleToggleEstado(alq: Alquiler) {
    setAlquilerEnAccion(alq);
  }

  function doToggleEstado() {
    if (!alquilerEnAccion) return;
    const nuevoEstado = alquilerEnAccion.estado === 'activo' ? 'suspendido' : 'activo';
    onSuspender(cliente.id, alquilerEnAccion.placa, nuevoEstado);
    addToast(
      `Alquiler ${alquilerEnAccion.placa} ${nuevoEstado === 'suspendido' ? 'suspendido' : 'reactivado'}.`,
      'success'
    );
    setAlquilerEnAccion(null);
  }

  return (
    <>
      {/* Botón volver */}
      <button className="back-btn" onClick={onBack}>
        ← Volver al dashboard
      </button>

      {/* ── Header hero ── */}
      <div className="detail-header">
        <div className="client-avatar-lg">{initials}</div>
        <div style={{ flex: 1 }}>
          <div className="detail-name">{cliente.nombre}</div>
          <div className="detail-meta">
            {cliente.cedula   && <span>🪪 {cliente.cedula}</span>}
            {cliente.telefono && <span>📞 {cliente.telefono}</span>}
            {cliente.correo   && <span>✉ {cliente.correo}</span>}
          </div>
          <div className="detail-header-badges">
            <span className="detail-header-badge">
              {cliente.alquileres.length} alquiler(es)
            </span>
            {montoTotal > 0 && (
              <span className="detail-header-badge">
                {formatMonto(montoTotal)} / periodo
              </span>
            )}
          </div>
        </div>
        <div className="detail-header-actions">
          <button
            className="btn btn-outline btn-sm"
            style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.25)', color: 'white' }}
            onClick={() => addToast('Edición de datos del cliente próximamente.', 'warn')}
          >
            ✏ Editar datos
          </button>
        </div>
      </div>

      {/* ── Grid de contenido ── */}
      <div className="detail-grid">

        {/* Columna izquierda: datos personales */}
        <div className="detail-card">
          <div className="detail-card-title">Datos del cliente</div>

          <div className="info-row">
            <span className="info-icon">👤</span>
            <span className="info-label">Nombre</span>
            <span className="info-value">{cliente.nombre}</span>
          </div>

          <div className="info-row">
            <span className="info-icon">🪪</span>
            <span className="info-label">Cédula</span>
            <span className="info-value">
              {cliente.cedula ?? <span className="info-empty">No registrada</span>}
            </span>
          </div>

          <div className="info-row">
            <span className="info-icon">📞</span>
            <span className="info-label">Teléfono</span>
            <span className="info-value">
              {cliente.telefono ?? <span className="info-empty">No registrado</span>}
            </span>
          </div>

          <div className="info-row">
            <span className="info-icon">✉</span>
            <span className="info-label">Correo</span>
            <span className="info-value" style={{ fontSize: 12 }}>
              {cliente.correo ?? <span className="info-empty">No registrado</span>}
            </span>
          </div>

          <div className="info-row">
            <span className="info-icon">📅</span>
            <span className="info-label">Registro</span>
            <span className="info-value">{formatFecha(cliente.createdAt)}</span>
          </div>
        </div>

        {/* Columna derecha: alquileres */}
        <div>
          <div className="rentals-header">
            <div className="rentals-header-title">Alquileres</div>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => addToast('Formulario de nuevo alquiler próximamente.', 'warn')}
            >
              + Agregar alquiler
            </button>
          </div>

          {cliente.alquileres.length === 0 ? (
            <div className="empty-state" style={{ padding: 40 }}>
              <div className="empty-icon">🚗</div>
              <div className="empty-title">Sin alquileres</div>
              <div className="empty-sub">
                Este cliente no tiene campos de parqueo registrados
              </div>
            </div>
          ) : (
            <div className="rental-cards-list">
              {cliente.alquileres.map((alq) => {
                //const dias = 
                daysUntil(alq.proximoPago);
                const suspendido = alq.estado === 'suspendido';

                return (
                  <div
                    key={alq.placa}
                    className={`rental-card ${suspendido ? 'suspended' : ''}`}
                  >
                    {/* Header de la tarjeta */}
                    <div className="rental-card-header">
                      <div className="rental-card-header-left">
                        <span className="plate-badge">{alq.placa}</span>
                        <span className="badge badge-gray">
                          {labelVehiculo(alq.tipoVehiculo)}
                        </span>
                        {suspendido && (
                          <span className="badge badge-gray">⏸ Suspendido</span>
                        )}
                      </div>

                      <div className="rental-card-header-actions">
                        <button
                          className="btn btn-ghost btn-xs"
                          onClick={() =>
                            addToast('Editor de alquiler próximamente.', 'warn')
                          }
                        >
                          ✏ Editar
                        </button>
                        <button
                          className={`btn btn-xs ${
                            suspendido ? 'btn-success-soft' : 'btn-danger-soft'
                          }`}
                          onClick={() => handleToggleEstado(alq)}
                        >
                          {suspendido ? '▶ Reactivar' : '⏸ Suspender'}
                        </button>
                      </div>
                    </div>

                    {/* Cuerpo: campos en grid */}
                    <div className="rental-card-body">
                      <div>
                        <div className="rental-field-label">Contrato</div>
                        <div className="rental-field-value">
                          {labelContrato(alq.tipoContrato)}
                        </div>
                      </div>
                      <div>
                        <div className="rental-field-label">Periodo</div>
                        <div className="rental-field-value">
                          <PeriodoBadge periodo={alq.periodo} />
                        </div>
                      </div>
                      <div>
                        <div className="rental-field-label">Monto</div>
                        <div className="rental-field-value monto">
                          {formatMonto(alq.monto)}
                        </div>
                      </div>
                      <div>
                        <div className="rental-field-label">Próximo pago</div>
                        <div className="rental-field-value">
                          {formatFecha(alq.proximoPago)}
                        </div>
                      </div>
                      <div>
                        <div className="rental-field-label">Último pago</div>
                        <div className="rental-field-value">
                          {formatFecha(alq.ultimaFechaPago)}
                        </div>
                      </div>
                      <div>
                        <div className="rental-field-label">Estado</div>
                        <div className="rental-field-value">
                          {suspendido ? (
                            <span className="badge badge-gray">⏸ Suspendido</span>
                          ) : (
                            <StatusBadge
                              proximoPago={alq.proximoPago}
                              periodo={alq.periodo}
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Diálogo de confirmación suspender/reactivar */}
      <ConfirmDialog
        open={!!alquilerEnAccion}
        icon={alquilerEnAccion?.estado === 'activo' ? '⏸' : '▶'}
        title={
          alquilerEnAccion?.estado === 'activo'
            ? '¿Suspender alquiler?'
            : '¿Reactivar alquiler?'
        }
        msg={
          alquilerEnAccion?.estado === 'activo'
            ? `El alquiler de la placa <strong>${alquilerEnAccion?.placa}</strong> quedará suspendido y no sumará al cobro del periodo.`
            : `El alquiler de la placa <strong>${alquilerEnAccion?.placa}</strong> volverá a estar activo y sumará al cobro.`
        }
        acceptLabel={
          alquilerEnAccion?.estado === 'activo' ? 'Sí, suspender' : 'Sí, reactivar'
        }
        cancelLabel="Cancelar"
        danger={alquilerEnAccion?.estado === 'activo'}
        onAccept={doToggleEstado}
        onCancel={() => setAlquilerEnAccion(null)}
      />
    </>
  );
}