/**
 * COMPONENTE: NuevoClienteModal
 * ==============================
 * Modal para registrar un nuevo cliente con sus alquileres.
 *
 * Características:
 * - Datos del cliente: nombre (requerido), cédula, teléfono, correo
 * - Hasta 4 bloques de alquiler, cada uno con sus campos
 * - Tarifa se auto-calcula según tipo de vehículo, contrato y periodo
 * - Preview de la próxima fecha de pago al elegir la primera fecha
 * - Confirmación antes de guardar y antes de cancelar (si hay datos)
 *
 * Props:
 * - open: si el modal está visible
 * - onClose: cierra el modal
 * - onGuardar: recibe los datos del formulario para guardarlos
 */

import { useState } from 'react';
import '../css/Components.css';
import '../css/NuevoClienteModal.css';
import { ConfirmDialog } from './Uicomponents';
import { calcTarifa, formatMonto, formatFecha } from '../utils/Formatters';
import { addPeriod } from '../utils/DateUtils';
import type {
  ClienteInput,
  AlquilerInput,
  TipoVehiculo,
  TipoContrato,
  PeriodoCobro,
} from '../models/Types';

interface NuevoClienteModalProps {
  open: boolean;
  onClose: () => void;
  onGuardar: (data: ClienteInput) => void;
}

// Estado vacío para los datos del cliente
const EMPTY_CLIENTE = { nombre: '', cedula: '', telefono: '', correo: '' };

// Estado vacío para un bloque de alquiler
function emptyAlquiler(): AlquilerInput {
  return {
    placa: '',
    tipoVehiculo: 'liviano',
    tipoContrato: 'diurno',
    periodo: 'mensual',
    monto: calcTarifa('liviano', 'mensual', 'diurno'),
    fechaPrimerPago: '',
  };
}

export default function NuevoClienteModal({
  open,
  onClose,
  onGuardar,
}: NuevoClienteModalProps) {
  const [form, setForm]         = useState(EMPTY_CLIENTE);
  const [alquileres, setAlquileres] = useState<AlquilerInput[]>([]);
  const [confirmCancel, setConfirmCancel]   = useState(false);
  const [confirmGuardar, setConfirmGuardar] = useState(false);

  // Resetea el formulario a estado inicial
  function reset() {
    setForm(EMPTY_CLIENTE);
    setAlquileres([]);
  }

  // Actualiza un campo del alquiler en la posición i
  // Si cambia tipo/contrato/periodo, recalcula el monto automáticamente
  function updateAlquiler(
    i: number,
    field: keyof AlquilerInput,
    value: string
  ) {
    setAlquileres((prev) => {
      const next = [...prev];
      const updated = { ...next[i], [field]: value };

      // Recalcular tarifa si cambia alguno de estos tres campos
      if (['tipoVehiculo', 'tipoContrato', 'periodo'].includes(field)) {
        updated.monto = calcTarifa(
          updated.tipoVehiculo,
          updated.periodo,
          updated.tipoContrato
        );
      }

      next[i] = updated;
      return next;
    });
  }

  function addAlquiler() {
    if (alquileres.length < 4) {
      setAlquileres((prev) => [...prev, emptyAlquiler()]);
    }
  }

  function removeAlquiler(i: number) {
    setAlquileres((prev) => prev.filter((_, j) => j !== i));
  }

  function clearAlquiler(i: number) {
    setAlquileres((prev) => {
      const next = [...prev];
      next[i] = emptyAlquiler();
      return next;
    });
  }

  // Intenta cerrar — si hay datos pide confirmación
  function tryClose() {
    const hayDatos = form.nombre || alquileres.length > 0;
    if (hayDatos) setConfirmCancel(true);
    else { reset(); onClose(); }
  }

  // Guarda y cierra
  function doGuardar() {
    onGuardar({ ...form, alquileres });
    reset();
    onClose();
    setConfirmGuardar(false);
  }

  const canSave = form.nombre.trim().length > 0;

  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={tryClose}>
      <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="modal-header">
          <div>
            <div className="modal-title">Nuevo cliente</div>
            <div className="modal-sub">
              Ingresá los datos del cliente y sus alquileres
            </div>
          </div>
          <button className="close-btn" onClick={tryClose}>✕</button>
        </div>

        {/* Body */}
        <div className="modal-body">

          {/* ── Datos personales ── */}
          <div className="section-divider">
            <div className="section-divider-label">Datos del cliente</div>
            <div className="section-divider-line" />
          </div>

          <div className="form-grid form-grid-2" style={{ marginTop: 12 }}>
            <div className="form-group">
              <label className="form-label">
                Nombre completo <span>*</span>
              </label>
              <input
                className="form-input"
                placeholder="Ej: Carlos Mora Jiménez"
                value={form.nombre}
                onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Cédula</label>
              <input
                className="form-input"
                placeholder="Ej: 1-0852-0341"
                value={form.cedula}
                onChange={(e) => setForm((f) => ({ ...f, cedula: e.target.value }))}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Teléfono</label>
              <input
                className="form-input"
                placeholder="Ej: 8845-2211"
                value={form.telefono}
                onChange={(e) => setForm((f) => ({ ...f, telefono: e.target.value }))}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Correo electrónico</label>
              <input
                className="form-input"
                type="email"
                placeholder="Ej: cliente@correo.com"
                value={form.correo}
                onChange={(e) => setForm((f) => ({ ...f, correo: e.target.value }))}
              />
            </div>
          </div>

          {/* ── Alquileres ── */}
          <div className="section-divider" style={{ marginTop: 24 }}>
            <div className="section-divider-label">
              Alquileres ({alquileres.length}/4)
            </div>
            <div className="section-divider-line" />
          </div>

          {alquileres.length === 0 && (
            <div
              style={{
                padding: '20px 0',
                textAlign: 'center',
                color: 'var(--text-3)',
                fontSize: 13,
              }}
            >
              Sin alquileres registrados. Podés guardar el cliente sin alquileres.
            </div>
          )}

          {/* Un bloque por alquiler */}
          {alquileres.map((v, i) => {
            // Calculamos la fecha de la segunda cuota para el preview
            const proxima =
              v.fechaPrimerPago
                ? formatFecha(addPeriod(v.fechaPrimerPago, v.periodo))
                : null;

            return (
              <div key={i} className="vehicle-block">
                <div className="vehicle-block-header">
                  <div className="vehicle-block-title">
                    🚗 Vehículo {i + 1}
                  </div>
                  <div className="vehicle-block-actions">
                    <button
                      className="btn btn-ghost btn-xs"
                      onClick={() => clearAlquiler(i)}
                    >
                      🗑 Limpiar
                    </button>
                    <button
                      className="btn btn-danger-soft btn-xs"
                      onClick={() => removeAlquiler(i)}
                    >
                      ✕ Eliminar
                    </button>
                  </div>
                </div>

                <div className="form-grid form-grid-3">
                  {/* Placa */}
                  <div className="form-group">
                    <label className="form-label">Placa <span>*</span></label>
                    <input
                      className="form-input"
                      placeholder="Ej: AAA-123"
                      value={v.placa}
                      onChange={(e) =>
                        updateAlquiler(i, 'placa', e.target.value.toUpperCase())
                      }
                    />
                  </div>

                  {/* Tipo de vehículo */}
                  <div className="form-group">
                    <label className="form-label">Tipo de vehículo</label>
                    <select
                      className="form-select"
                      value={v.tipoVehiculo}
                      onChange={(e) =>
                        updateAlquiler(i, 'tipoVehiculo', e.target.value as TipoVehiculo)
                      }
                    >
                      <option value="liviano">🚗 Liviano</option>
                      <option value="moto">🏍 Moto</option>
                      <option value="pesado">🚛 Pesado</option>
                    </select>
                  </div>

                  {/* Tipo de contrato */}
                  <div className="form-group">
                    <label className="form-label">Contrato</label>
                    <select
                      className="form-select"
                      value={v.tipoContrato}
                      onChange={(e) =>
                        updateAlquiler(i, 'tipoContrato', e.target.value as TipoContrato)
                      }
                    >
                      <option value="diurno">☀ Diurno</option>
                      <option value="nocturno">🌙 Nocturno</option>
                      <option value="ambos">☀🌙 Ambos (x2)</option>
                    </select>
                  </div>

                  {/* Periodo */}
                  <div className="form-group">
                    <label className="form-label">Periodo</label>
                    <select
                      className="form-select"
                      value={v.periodo}
                      onChange={(e) =>
                        updateAlquiler(i, 'periodo', e.target.value as PeriodoCobro)
                      }
                    >
                      <option value="semanal">Semanal</option>
                      <option value="quincenal">Quincenal</option>
                      <option value="mensual">Mensual</option>
                      <option value="cuatrimestral">Cuatrimestral</option>
                    </select>
                  </div>

                  {/* Tarifa auto-calculada */}
                  <div className="form-group">
                    <label className="form-label">Tarifa calculada</label>
                    <div className="tarifa-display">{formatMonto(v.monto)}</div>
                    <span className="form-hint">Auto-calculada según tipo y contrato</span>
                  </div>

                  {/* Fecha primer pago */}
                  <div className="form-group">
                    <label className="form-label">
                      Fecha primer pago <span>*</span>
                    </label>
                    <input
                      className="form-input"
                      type="date"
                      value={v.fechaPrimerPago}
                      onChange={(e) =>
                        updateAlquiler(i, 'fechaPrimerPago', e.target.value)
                      }
                    />
                  </div>
                </div>

                {/* Preview próxima fecha */}
                {proxima && (
                  <div className="next-payment-preview">
                    🗓 El próximo pago (2da cuota) será el{' '}
                    <strong>{proxima}</strong>
                  </div>
                )}
              </div>
            );
          })}

          {/* Botón agregar alquiler */}
          {alquileres.length < 4 && (
            <button className="add-vehicle-btn" onClick={addAlquiler}>
              + Agregar alquiler
            </button>
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={tryClose}>
            Cancelar
          </button>
          <button
            className="btn btn-primary"
            disabled={!canSave}
            onClick={() => setConfirmGuardar(true)}
          >
            Guardar cliente
          </button>
        </div>
      </div>

      {/* Confirmar cancelar */}
      <ConfirmDialog
        open={confirmCancel}
        icon="⚠️"
        title="¿Cancelar registro?"
        msg="Se perderán todos los datos ingresados. ¿Estás seguro?"
        acceptLabel="Sí, cancelar"
        cancelLabel="Seguir editando"
        danger
        onAccept={() => { reset(); onClose(); setConfirmCancel(false); }}
        onCancel={() => setConfirmCancel(false)}
      />

      {/* Confirmar guardar */}
      <ConfirmDialog
        open={confirmGuardar}
        icon="✅"
        title="¿Confirmar registro?"
        msg={`Se guardará el cliente <strong>${form.nombre}</strong> con <strong>${alquileres.length}</strong> alquiler(es).`}
        acceptLabel="Aceptar"
        cancelLabel="Seguir editando"
        onAccept={doGuardar}
        onCancel={() => setConfirmGuardar(false)}
      />
    </div>
  );
}