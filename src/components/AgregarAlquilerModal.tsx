/**
 * COMPONENTE: AgregarAlquilerModal
 * =================================
 * Modal para agregar un nuevo alquiler a un cliente existente.
 * Se abre desde ClienteDetailPage cuando el cliente ya existe en Firestore.
 *
 * DIFERENCIA CON NuevoClienteModal:
 * En NuevoClienteModal el clienteId aún no existe — se crea junto al cliente.
 * Aquí el clienteId ya existe en Firestore, así que solo creamos el alquiler.
 *
 * VALIDACIONES:
 * - La placa es obligatoria
 * - La fecha de primer pago es obligatoria
 * - No se puede agregar si el cliente ya tiene 4 alquileres (activos o no)
 *
 * Props:
 * - open: si el modal está visible
 * - cliente: el cliente al que se agrega el alquiler
 * - onClose: cierra sin guardar
 * - onGuardado: callback tras guardar exitosamente (el padre recarga y muestra toast)
 */

import { useState } from 'react';
import '../css/components.css';
import '../css/NuevoClienteModal.css';
import '../css/AgregarAlquilerModal.css';
import { ConfirmDialog } from './Uicomponents';
import { calcTarifa, formatMonto, formatFecha, labelVehiculo, labelContrato, labelPeriodo } from '../utils/Formatters';
import { calcularProximaFechaUI, isoATimestamp } from '../utils/DateUtils'; // ← centralizado
import { crearAlquiler } from '../services/alquilerService';
import type { Cliente, TipoVehiculo, TipoContrato, PeriodoCobro } from '../models/Types';

interface AgregarAlquilerModalProps {
  open: boolean;
  cliente: Cliente | null;
  onClose: () => void;
  onGuardado: () => void;
}

interface AlquilerForm {
  placa: string;
  tipoVehiculo: TipoVehiculo;
  tipoContrato: TipoContrato;
  periodo: PeriodoCobro;
  monto: number;
  fechaPrimerPago: string;
}

function emptyForm(): AlquilerForm {
  return { placa: '', tipoVehiculo: 'liviano', tipoContrato: 'diurno',
    periodo: 'mensual', monto: calcTarifa('liviano', 'mensual', 'diurno'), fechaPrimerPago: '' };
}

export default function AgregarAlquilerModal({ open, cliente, onClose, onGuardado }: AgregarAlquilerModalProps) {
  const [form, setForm]       = useState<AlquilerForm>(emptyForm());
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const [confirmGuardar, setConfirmGuardar] = useState(false);

  function reset() { setForm(emptyForm()); setError(null); }

  function update<K extends keyof AlquilerForm>(field: K, value: AlquilerForm[K]) {
    setForm(prev => {
      const next = { ...prev, [field]: value };
      if (field === 'tipoVehiculo' || field === 'tipoContrato' || field === 'periodo') {
        next.monto = calcTarifa(next.tipoVehiculo, next.periodo, next.tipoContrato);
      }
      return next;
    });
  }

  async function doGuardar() {
    if (!cliente) return;
    if (!form.placa.trim())       { setError('La placa es obligatoria.'); setConfirmGuardar(false); return; }
    if (!form.fechaPrimerPago)    { setError('La fecha de primer pago es obligatoria.'); setConfirmGuardar(false); return; }
    if (cliente.alquileres.some(a => a.placa.toLowerCase() === form.placa.trim().toLowerCase())) {
      setError(`La placa ${form.placa} ya está registrada.`); setConfirmGuardar(false); return;
    }

    setLoading(true); setError(null); setConfirmGuardar(false);
    try {
      await crearAlquiler({
        placa:           form.placa.trim().toUpperCase(),
        clienteId:       cliente.id,
        tipoVehiculo:    form.tipoVehiculo,
        tipoContrato:    form.tipoContrato,
        periodo:         form.periodo,
        monto:           form.monto,
        // isoATimestamp usa T00:00:00 internamente — sin desfase de zona horaria
        fechaPrimerPago: isoATimestamp(form.fechaPrimerPago),
      });
      reset(); onGuardado();
    } catch (err) {
      console.error('Error creando alquiler:', err);
      setError('Ocurrió un error al guardar. Intentá de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  if (!open || !cliente) return null;

  const totalAlquileres = cliente.alquileres.length;

  // Preview centralizado — mismo cálculo que el servicio usa al confirmar pago
  const proximaFechaISO = form.fechaPrimerPago
    ? calcularProximaFechaUI(form.fechaPrimerPago, form.periodo)
    : null;

  const canSave = form.placa.trim().length > 0 && form.fechaPrimerPago.length > 0 && !loading;

  return (
    <div className="modal-overlay" onClick={() => { reset(); onClose(); }}>
      <div className="modal modal-md" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <div className="modal-title">Agregar alquiler</div>
            <div className="modal-sub">{cliente.nombre} · {totalAlquileres}/4 alquileres</div>
          </div>
          <button className="close-btn" onClick={() => { reset(); onClose(); }} disabled={loading}>✕</button>
        </div>

        <div className="modal-body">
          {totalAlquileres >= 4 && (
            <div style={{ padding: '12px 16px', background: 'var(--warn-bg)', border: '1px solid var(--warn-bd)',
              borderRadius: 'var(--radius-sm)', color: 'var(--warn)', fontSize: 13, fontWeight: 600 }}>
              ⚠ Este cliente ya tiene 4 alquileres registrados (el máximo permitido).
            </div>
          )}

          {totalAlquileres < 4 && (
            <div className="form-grid form-grid-2">
              <div className="form-group">
                <label className="form-label">Placa <span>*</span></label>
                <input className="form-input" placeholder="Ej: AAA-123" value={form.placa} disabled={loading}
                  onChange={e => update('placa', e.target.value.toUpperCase())} />
              </div>
              <div className="form-group">
                <label className="form-label">Tipo de vehículo</label>
                <select className="form-select" value={form.tipoVehiculo} disabled={loading}
                  onChange={e => update('tipoVehiculo', e.target.value as TipoVehiculo)}>
                  <option value="liviano">🚗 Liviano</option>
                  <option value="moto">🏍 Moto</option>
                  <option value="pesado">🚛 Pesado</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Contrato</label>
                <select className="form-select" value={form.tipoContrato} disabled={loading}
                  onChange={e => update('tipoContrato', e.target.value as TipoContrato)}>
                  <option value="diurno">☀ Diurno</option>
                  <option value="nocturno">🌙 Nocturno</option>
                  <option value="ambos">☀🌙 Ambos (x2)</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Periodo</label>
                <select className="form-select" value={form.periodo} disabled={loading}
                  onChange={e => update('periodo', e.target.value as PeriodoCobro)}>
                  <option value="semanal">Semanal</option>
                  <option value="quincenal">Quincenal</option>
                  <option value="mensual">Mensual</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Monto (₡)</label>
                <input className="form-input" type="number" min={0} step={500} value={form.monto} disabled={loading}
                  onChange={e => update('monto', Number(e.target.value))} />
                <span className="form-hint">
                  Tarifa base: {formatMonto(calcTarifa(form.tipoVehiculo, form.periodo, form.tipoContrato))}
                </span>
              </div>
              <div className="form-group">
                <label className="form-label">Fecha primer pago <span>*</span></label>
                <input className="form-input" type="date" value={form.fechaPrimerPago} disabled={loading}
                  onChange={e => update('fechaPrimerPago', e.target.value)} />
              </div>
            </div>
          )}

          {/* Preview centralizado */}
          {proximaFechaISO && (
            <div className="next-payment-preview" style={{ marginTop: 14 }}>
              🗓 El próximo pago (2da cuota) será el <strong>{formatFecha(proximaFechaISO)}</strong>
            </div>
          )}

          {canSave && totalAlquileres < 4 && (
            <div className="alquiler-resumen" style={{ marginTop: 14 }}>
              <div className="alquiler-resumen-title">Resumen</div>
              <div className="alquiler-resumen-row">
                <span className="alquiler-resumen-label">Placa</span>
                <span className="alquiler-resumen-value">{form.placa}</span>
              </div>
              <div className="alquiler-resumen-row">
                <span className="alquiler-resumen-label">Vehículo</span>
                <span className="alquiler-resumen-value">{labelVehiculo(form.tipoVehiculo)}</span>
              </div>
              <div className="alquiler-resumen-row">
                <span className="alquiler-resumen-label">Contrato</span>
                <span className="alquiler-resumen-value">{labelContrato(form.tipoContrato)}</span>
              </div>
              <div className="alquiler-resumen-row">
                <span className="alquiler-resumen-label">Periodo</span>
                <span className="alquiler-resumen-value">{labelPeriodo(form.periodo)}</span>
              </div>
              <div className="alquiler-resumen-row">
                <span className="alquiler-resumen-label">Monto</span>
                <span>{formatMonto(form.monto)}</span>
              </div>
            </div>
          )}

          {error && (
            <div style={{ marginTop: 12, padding: '10px 14px', background: 'var(--danger-bg)',
              border: '1px solid var(--danger-bd)', borderRadius: 'var(--radius-sm)',
              color: 'var(--danger)', fontSize: 13 }}>
              ⚠ {error}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={() => { reset(); onClose(); }} disabled={loading}>Cancelar</button>
          {totalAlquileres < 4 && (
            <button className="btn btn-primary" disabled={!canSave} onClick={() => setConfirmGuardar(true)}>
              {loading ? 'Guardando…' : 'Agregar alquiler'}
            </button>
          )}
        </div>
      </div>

      <ConfirmDialog open={confirmGuardar} icon="🚗" title="¿Agregar alquiler?"
        msg={`Se registrará la placa <strong>${form.placa}</strong> para <strong>${cliente?.nombre}</strong>.`}
        acceptLabel="Agregar" cancelLabel="Revisar"
        onAccept={doGuardar} onCancel={() => setConfirmGuardar(false)} />
    </div>
  );
}