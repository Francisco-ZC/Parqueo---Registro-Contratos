/**
 * PÁGINA: ClienteDetailPage — versión final
 * ==========================================
 * Integra EditarAlquilerModal para editar y eliminar alquileres.
 * El botón "Editar" en cada rental card abre el modal con los datos del alquiler.
 */

import { useState } from 'react';
import '../css/components.css';
import '../css/ClienteDetailsPage.css';
import { ConfirmDialog, StatusBadge, PeriodoBadge } from '../components/Uicomponents';
import EditarClienteModal   from '../components/EditarClienteModal';
import AgregarAlquilerModal from '../components/AgregarAlquilerModal';
import EditarAlquilerModal  from '../components/EditarAlquilerModal';
import {
  formatMonto, formatFecha, getInitials, labelVehiculo, labelContrato,
} from '../utils/Formatters';
//import { daysUntil } from '../utils/DateUtils';
import { cambiarEstadoAlquiler } from '../services/alquilerService';
import type { Cliente, Alquiler, ToastType } from '../models/Types';

interface ClienteDetailPageProps {
  cliente: Cliente;
  onBack: () => void;
  onDatosActualizados: () => Promise<void>;
  addToast: (msg: string, type?: ToastType) => void;
}

export default function ClienteDetailPage({
  cliente, onBack, onDatosActualizados, addToast,
}: ClienteDetailPageProps) {
  const [alquilerEnAccion, setAlquilerEnAccion]   = useState<Alquiler | null>(null); // suspender/reactivar
  const [alquilerAEditar, setAlquilerAEditar]     = useState<Alquiler | null>(null); // editar/eliminar
  const [showEditarCliente, setShowEditarCliente] = useState(false);
  const [showAgregar, setShowAgregar]             = useState(false);

  const initials   = getInitials(cliente.nombre);
  const activos    = cliente.alquileres.filter(a => a.estado === 'activo');
  const montoTotal = activos.reduce((s, a) => s + a.monto, 0);

  async function doToggleEstado() {
    if (!alquilerEnAccion) return;
    const nuevoEstado = alquilerEnAccion.estado === 'activo' ? 'suspendido' : 'activo';
    try {
      await cambiarEstadoAlquiler(alquilerEnAccion.placa, nuevoEstado);
      await onDatosActualizados();
      addToast(
        `Alquiler ${alquilerEnAccion.placa} ${nuevoEstado === 'suspendido' ? 'suspendido' : 'reactivado'}.`,
        'success'
      );
    } catch {
      addToast('Error al cambiar el estado del alquiler.', 'error');
    } finally {
      setAlquilerEnAccion(null);
    }
  }

  return (
    <>
      <button className="back-btn" onClick={onBack}>← Volver al dashboard</button>

      {/* Hero */}
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
            <span className="detail-header-badge">{cliente.alquileres.length} alquiler(es)</span>
            {montoTotal > 0 && (
              <span className="detail-header-badge">{formatMonto(montoTotal)} / periodo</span>
            )}
          </div>
        </div>
        <div className="detail-header-actions">
          <button
            className="btn btn-outline btn-sm"
            style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.25)', color: 'white' }}
            onClick={() => setShowEditarCliente(true)}
          >
            ✏ Editar datos
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="detail-grid">

        {/* Datos */}
        <div className="detail-card">
          <div className="detail-card-title">Datos del cliente</div>
          {[
            { icon: '👤', label: 'Nombre',   value: cliente.nombre },
            { icon: '🪪', label: 'Cédula',   value: cliente.cedula },
            { icon: '📞', label: 'Teléfono', value: cliente.telefono },
            { icon: '✉',  label: 'Correo',   value: cliente.correo, small: true },
            { icon: '📅', label: 'Registro', value: formatFecha(cliente.createdAt) },
          ].map(({ icon, label, value, small }) => (
            <div className="info-row" key={label}>
              <span className="info-icon">{icon}</span>
              <span className="info-label">{label}</span>
              <span className="info-value" style={small ? { fontSize: 12 } : {}}>
                {value ?? <span className="info-empty">No registrado</span>}
              </span>
            </div>
          ))}
        </div>

        {/* Alquileres */}
        <div>
          <div className="rentals-header">
            <div className="rentals-header-title">Alquileres</div>
            <button
              className="btn btn-primary btn-sm"
              disabled={cliente.alquileres.length >= 4}
              onClick={() => setShowAgregar(true)}
              title={cliente.alquileres.length >= 4 ? 'Máximo 4 alquileres' : ''}
            >
              + Agregar alquiler
            </button>
          </div>

          {cliente.alquileres.length === 0 ? (
            <div className="empty-state" style={{ padding: 40 }}>
              <div className="empty-icon">🚗</div>
              <div className="empty-title">Sin alquileres</div>
              <div className="empty-sub">Este cliente no tiene campos registrados</div>
            </div>
          ) : (
            <div className="rental-cards-list">
              {cliente.alquileres.map(alq => {
                //const dias      = daysUntil(alq.proximoPago);
                const suspendido = alq.estado === 'suspendido';

                return (
                  <div key={alq.placa} className={`rental-card ${suspendido ? 'suspended' : ''}`}>
                    <div className="rental-card-header">
                      <div className="rental-card-header-left">
                        <span className="plate-badge">{alq.placa}</span>
                        <span className="badge badge-gray">{labelVehiculo(alq.tipoVehiculo)}</span>
                        {suspendido && <span className="badge badge-gray">⏸ Suspendido</span>}
                      </div>
                      <div className="rental-card-header-actions">
                        {/* Botón Editar — abre EditarAlquilerModal */}
                        <button
                          className="btn btn-ghost btn-xs"
                          onClick={() => setAlquilerAEditar(alq)}
                        >
                          ✏ Editar
                        </button>
                        <button
                          className={`btn btn-xs ${suspendido ? 'btn-success-soft' : 'btn-danger-soft'}`}
                          onClick={() => setAlquilerEnAccion(alq)}
                        >
                          {suspendido ? '▶ Reactivar' : '⏸ Suspender'}
                        </button>
                      </div>
                    </div>

                    <div className="rental-card-body">
                      <div>
                        <div className="rental-field-label">Contrato</div>
                        <div className="rental-field-value">{labelContrato(alq.tipoContrato)}</div>
                      </div>
                      <div>
                        <div className="rental-field-label">Periodo</div>
                        <div className="rental-field-value"><PeriodoBadge periodo={alq.periodo} /></div>
                      </div>
                      <div>
                        <div className="rental-field-label">Monto</div>
                        <div className="rental-field-value monto">{formatMonto(alq.monto)}</div>
                      </div>
                      <div>
                        <div className="rental-field-label">Próximo pago</div>
                        <div className="rental-field-value">{formatFecha(alq.proximoPago)}</div>
                      </div>
                      <div>
                        <div className="rental-field-label">Último pago</div>
                        <div className="rental-field-value">{formatFecha(alq.ultimaFechaPago)}</div>
                      </div>
                      <div>
                        <div className="rental-field-label">Estado</div>
                        <div className="rental-field-value">
                          {suspendido
                            ? <span className="badge badge-gray">⏸ Suspendido</span>
                            : <StatusBadge proximoPago={alq.proximoPago} periodo={alq.periodo} />
                          }
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

      {/* Modales */}
      <EditarClienteModal
        open={showEditarCliente}
        cliente={cliente}
        onClose={() => setShowEditarCliente(false)}
        onGuardado={async nombre => {
          await onDatosActualizados();
          addToast(`Datos de ${nombre} actualizados.`, 'success');
          setShowEditarCliente(false);
        }}
      />

      <AgregarAlquilerModal
        open={showAgregar}
        cliente={cliente}
        onClose={() => setShowAgregar(false)}
        onGuardado={async () => {
          await onDatosActualizados();
          addToast('Alquiler agregado correctamente.', 'success');
          setShowAgregar(false);
        }}
      />

      {/* Modal editar/eliminar alquiler */}
      <EditarAlquilerModal
        open={!!alquilerAEditar}
        alquiler={alquilerAEditar}
        clienteNombre={cliente.nombre}
        onClose={() => setAlquilerAEditar(null)}
        onGuardado={async () => {
          await onDatosActualizados();
          addToast(`Alquiler ${alquilerAEditar?.placa} actualizado.`, 'success');
          setAlquilerAEditar(null);
        }}
        onEliminado={async () => {
          await onDatosActualizados();
          addToast(`Alquiler ${alquilerAEditar?.placa} eliminado.`, 'success');
          setAlquilerAEditar(null);
        }}
      />

      {/* Suspender / reactivar */}
      <ConfirmDialog
        open={!!alquilerEnAccion}
        icon={alquilerEnAccion?.estado === 'activo' ? '⏸' : '▶'}
        title={alquilerEnAccion?.estado === 'activo' ? '¿Suspender alquiler?' : '¿Reactivar alquiler?'}
        msg={
          alquilerEnAccion?.estado === 'activo'
            ? `El alquiler de la placa <strong>${alquilerEnAccion?.placa}</strong> quedará suspendido y no sumará al cobro.`
            : `El alquiler de la placa <strong>${alquilerEnAccion?.placa}</strong> volverá a estar activo.`
        }
        acceptLabel={alquilerEnAccion?.estado === 'activo' ? 'Sí, suspender' : 'Sí, reactivar'}
        danger={alquilerEnAccion?.estado === 'activo'}
        onAccept={doToggleEstado}
        onCancel={() => setAlquilerEnAccion(null)}
      />
    </>
  );
}