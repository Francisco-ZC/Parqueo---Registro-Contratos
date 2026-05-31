/**
 * COMPONENTE: EditarAlquilerModal
 * ================================
 * Modal para editar un alquiler existente y/o eliminarlo.
 *
 * CAMPOS EDITABLES:
 * - Tipo de vehículo, contrato, periodo, monto
 * - NO se puede cambiar la placa (es el ID del documento en Firestore)
 * - NO se puede cambiar el clienteId
 * - NO se cambia proximoPago ni ultimaFechaPago — esas las maneja confirmarPago
 *
 * ELIMINAR:
 * - Botón rojo con confirmación en dos pasos (ConfirmDialog)
 * - Al eliminar se cierra el modal y el padre recarga
 *
 * NOTA SOBRE CAMBIO DE PERIODO:
 * Si el admin cambia el periodo (ej: mensual → quincenal), mostramos
 * una advertencia: el proximoPago actual quedó calculado con el periodo
 * anterior. El próximo "confirmar pago" recalculará con el nuevo periodo.
 *
 * Props:
 * - open: si el modal está visible
 * - alquiler: el alquiler a editar (datos pre-cargados)
 * - clienteNombre: para mostrarlo en los mensajes de confirmación
 * - onClose: cierra sin guardar
 * - onGuardado: padre recarga y muestra toast de éxito
 * - onEliminado: padre recarga y muestra toast de éxito
 */

import { useState, useEffect } from 'react';
import '../css/components.css';
import '../css/EditarAlquilerModal.css';
import { ConfirmDialog } from './Uicomponents';
import { calcTarifa, formatMonto, labelVehiculo, labelContrato, labelPeriodo } from '../utils/Formatters';
import { actualizarAlquiler, eliminarAlquiler } from '../services/alquilerService';
import type { Alquiler, TipoVehiculo, TipoContrato, PeriodoCobro } from '../models/Types';

interface EditarAlquilerModalProps {
  open: boolean;
  alquiler: Alquiler | null;
  clienteNombre: string;
  onClose: () => void;
  onGuardado: () => void;
  onEliminado: () => void;
}

interface FormState {
  tipoVehiculo: TipoVehiculo;
  tipoContrato: TipoContrato;
  periodo: PeriodoCobro;
  monto: number;
}

export default function EditarAlquilerModal({
  open, alquiler, clienteNombre, onClose, onGuardado, onEliminado,
}: EditarAlquilerModalProps) {
  const [form, setForm]       = useState<FormState | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirmGuardar, setConfirmGuardar] = useState(false);
  const [confirmEliminar, setConfirmEliminar] = useState(false);

  // Pre-cargar el formulario cuando se abre con un alquiler
  useEffect(() => {
    if (alquiler && open) {
      setForm({
        tipoVehiculo: alquiler.tipoVehiculo,
        tipoContrato: alquiler.tipoContrato,
        periodo:      alquiler.periodo,
        monto:        alquiler.monto,
      });
    }
  }, [alquiler, open]);

  if (!open || !alquiler || !form) return null;

  // Detecta si cambió algún campo respecto al original
  function hayCambios(): boolean {
    if (!alquiler || !form) return false;
    return (
      form.tipoVehiculo !== alquiler.tipoVehiculo ||
      form.tipoContrato !== alquiler.tipoContrato ||
      form.periodo      !== alquiler.periodo      ||
      form.monto        !== alquiler.monto
    );
  }
 
  



  // Detecta si cambió el campo específico (para el estilo .modified)
  function isModified(field: keyof FormState): boolean {
    if (!alquiler || !form) return false;
    return form[field] !== alquiler[field];
  }

  // Recalcula monto cuando cambia tipo/contrato/periodo
  function update<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm(prev => {
      if (!prev) return prev;
      const next = { ...prev, [field]: value };
      if (field === 'tipoVehiculo' || field === 'tipoContrato' || field === 'periodo') {
        next.monto = calcTarifa(next.tipoVehiculo, next.periodo, next.tipoContrato);
      }
      return next;
    });
  }

  // ── Guardar cambios ──
  async function doGuardar() {
    if (!alquiler || !form) return;
    setLoading(true);
    setConfirmGuardar(false);
    try {
      await actualizarAlquiler(alquiler.placa, {
        tipoVehiculo: form.tipoVehiculo,
        tipoContrato: form.tipoContrato,
        periodo:      form.periodo,
        monto:        form.monto,
      });
      onGuardado();
      onClose();
    } catch (err) {
      console.error('Error actualizando alquiler:', err);
    } finally {
      setLoading(false);
    }
  }

  // ── Eliminar ──
  async function doEliminar() {
    if (!alquiler || !form) return;
    setLoading(true);
    setConfirmEliminar(false);
    try {
      await eliminarAlquiler(alquiler.placa);
      onEliminado();
      onClose();
    } catch (err) {
      console.error('Error eliminando alquiler:', err);
    } finally {
      setLoading(false);
    }
  }

  const cambioPeriodo = isModified('periodo');
  const tarifa        = calcTarifa(form.tipoVehiculo, form.periodo, form.tipoContrato);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-md" onClick={e => e.stopPropagation()}>

        <div className="modal-header">
          <div>
            <div className="modal-title">Editar alquiler</div>
            <div className="modal-sub">
              <span className="plate-badge" style={{ fontSize: 12, padding: '2px 8px' }}>
                {alquiler.placa}
              </span>
              {' '}· {clienteNombre}
            </div>
          </div>
          <button className="close-btn" onClick={onClose} disabled={loading}>✕</button>
        </div>

        <div className="modal-body">
          <div className="form-grid form-grid-2">

            {/* Placa — solo lectura, es el ID del documento */}
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Placa</label>
              <input
                className="form-input"
                value={alquiler.placa}
                readOnly
                style={{ background: 'var(--surface2)', cursor: 'default', color: 'var(--text-3)' }}
              />
              <span className="form-hint">La placa no se puede modificar — es el identificador del alquiler.</span>
            </div>

            {/* Tipo de vehículo */}
            <div className="form-group">
              <label className="form-label">Tipo de vehículo</label>
              <select
                className={`form-select ${isModified('tipoVehiculo') ? 'modified' : ''}`}
                value={form.tipoVehiculo}
                disabled={loading}
                onChange={e => update('tipoVehiculo', e.target.value as TipoVehiculo)}
              >
                <option value="liviano">🚗 Liviano</option>
                <option value="moto">🏍 Moto</option>
                <option value="pesado">🚛 Pesado</option>
              </select>
            </div>

            {/* Contrato */}
            <div className="form-group">
              <label className="form-label">Contrato</label>
              <select
                className={`form-select ${isModified('tipoContrato') ? 'modified' : ''}`}
                value={form.tipoContrato}
                disabled={loading}
                onChange={e => update('tipoContrato', e.target.value as TipoContrato)}
              >
                <option value="diurno">☀ Diurno</option>
                <option value="nocturno">🌙 Nocturno</option>
                <option value="ambos">☀🌙 Ambos (x2)</option>
              </select>
            </div>

            {/* Periodo */}
            <div className="form-group">
              <label className="form-label">Periodo de cobro</label>
              <select
                className={`form-select ${isModified('periodo') ? 'modified' : ''}`}
                value={form.periodo}
                disabled={loading}
                onChange={e => update('periodo', e.target.value as PeriodoCobro)}
              >
                <option value="semanal">Semanal</option>
                <option value="quincenal">Quincenal</option>
                <option value="mensual">Mensual</option>
              </select>
              {/* Advertencia si cambia el periodo */}
              {cambioPeriodo && (
                <div className="periodo-warning">
                  ⚠ Al cambiar el periodo, la próxima fecha de pago se recalculará
                  automáticamente la próxima vez que se confirme un pago.
                </div>
              )}
            </div>

            {/* Monto editable */}
            <div className="form-group">
              <label className="form-label">Monto (₡)</label>
              <input
                className={`form-input ${isModified('monto') ? 'modified' : ''}`}
                type="number"
                min={0}
                step={500}
                value={form.monto}
                disabled={loading}
                onChange={e => update('monto', Number(e.target.value))}
              />
              <span className="form-hint">
                Tarifa base calculada: {formatMonto(tarifa)}
              </span>
            </div>
          </div>

          {/* Resumen de cambios */}
          {hayCambios() && (
            <div className="changes-preview" style={{ marginTop: 16 }}>
              <div className="changes-preview-title">Cambios pendientes</div>
              {isModified('tipoVehiculo') && (
                <div>• Vehículo: <strong>{labelVehiculo(alquiler.tipoVehiculo)}</strong> → <strong>{labelVehiculo(form.tipoVehiculo)}</strong></div>
              )}
              {isModified('tipoContrato') && (
                <div>• Contrato: <strong>{labelContrato(alquiler.tipoContrato)}</strong> → <strong>{labelContrato(form.tipoContrato)}</strong></div>
              )}
              {isModified('periodo') && (
                <div>• Periodo: <strong>{labelPeriodo(alquiler.periodo)}</strong> → <strong>{labelPeriodo(form.periodo)}</strong></div>
              )}
              {isModified('monto') && (
                <div>• Monto: <strong>{formatMonto(alquiler.monto)}</strong> → <strong>{formatMonto(form.monto)}</strong></div>
              )}
            </div>
          )}
        </div>

        <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
          {/* Eliminar — lado izquierdo del footer */}
          <button
            className="btn btn-danger-soft"
            disabled={loading}
            onClick={() => setConfirmEliminar(true)}
          >
            🗑 Eliminar alquiler
          </button>

          {/* Cancelar y Guardar — lado derecho */}
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-ghost" onClick={onClose} disabled={loading}>
              Cancelar
            </button>
            <button
              className="btn btn-primary"
              disabled={!hayCambios() || loading}
              onClick={() => setConfirmGuardar(true)}
            >
              {loading ? 'Guardando…' : 'Guardar cambios'}
            </button>
          </div>
        </div>
      </div>

      {/* Confirmar guardar */}
      <ConfirmDialog
        open={confirmGuardar}
        icon="✏️"
        title="¿Guardar cambios?"
        msg={`Se actualizará el alquiler de la placa <strong>${alquiler.placa}</strong>.`}
        acceptLabel="Guardar"
        cancelLabel="Revisar"
        onAccept={doGuardar}
        onCancel={() => setConfirmGuardar(false)}
      />

      {/* Confirmar eliminar — más severo */}
      <ConfirmDialog
        open={confirmEliminar}
        icon="🗑"
        title="¿Eliminar alquiler?"
        msg={`Se eliminará permanentemente el alquiler de la placa <strong>${alquiler.placa}</strong> de <strong>${clienteNombre}</strong>. El historial de pagos se conserva.`}
        acceptLabel="Sí, eliminar"
        cancelLabel="Cancelar"
        danger
        onAccept={doEliminar}
        onCancel={() => setConfirmEliminar(false)}
      />
    </div>
  );
}