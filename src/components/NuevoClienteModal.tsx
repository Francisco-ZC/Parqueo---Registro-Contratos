/**
 * COMPONENTE: NuevoClienteModal
 * ==============================
 * FIX 2: el campo de monto ahora es editable.
 * Se auto-calcula al cambiar tipo/contrato/periodo,
 * pero el admin puede sobreescribirlo si necesita una tarifa especial.
 */

import { useState } from "react";
import "../css/components.css";
import "../css/NuevoClienteModal.css";
import { ConfirmDialog } from "./Uicomponents";
import { calcTarifa, formatMonto, formatFecha } from "../utils/Formatters";
import { addPeriod } from "../utils/DateUtils";
import type {
  ClienteInput,
  AlquilerInput,
  TipoVehiculo,
  TipoContrato,
  PeriodoCobro,
} from "../models/Types";

interface NuevoClienteModalProps {
  open: boolean;
  onClose: () => void;
  onGuardar: (data: ClienteInput) => void;
}

const EMPTY_CLIENTE = { nombre: "", cedula: "", telefono: "", correo: "" };

function emptyAlquiler(): AlquilerInput {
  return {
    placa: "",
    tipoVehiculo: "liviano",
    tipoContrato: "diurno",
    periodo: "mensual",
    monto: calcTarifa("liviano", "mensual", "diurno"),
    fechaPrimerPago: "",
  };
}

export default function NuevoClienteModal({
  open,
  onClose,
  onGuardar,
}: NuevoClienteModalProps) {
  const [form, setForm]             = useState(EMPTY_CLIENTE);
  const [alquileres, setAlquileres] = useState<AlquilerInput[]>([]);
  const [confirmCancel, setConfirmCancel]   = useState(false);
  const [confirmGuardar, setConfirmGuardar] = useState(false);

  function reset() {
    setForm(EMPTY_CLIENTE);
    setAlquileres([]);
  }

  /**
   * FIX 2 — monto editable
   * =======================
   * Antes: el monto siempre se recalculaba al cambiar tipo/contrato/periodo,
   * sobreescribiendo cualquier edición manual.
   *
   * Ahora: el monto se recalcula automáticamente SOLO cuando cambia
   * tipo de vehículo, tipo de contrato o periodo.
   * Si el admin cambia el monto directamente (field === 'monto'),
   * guardamos el valor que escribió sin tocar nada más.
   *
   * Esto permite tarifas especiales por cliente sin cambiar las tarifas base.
   */
  function updateAlquiler(i: number, field: keyof AlquilerInput, value: string | number) {
    setAlquileres((prev) => {
      const next = [...prev];
      const updated = { ...next[i], [field]: value };

      // Solo recalcular monto si cambia un campo que afecta la tarifa,
      // no cuando el admin edita el monto directamente
      if (field === "tipoVehiculo" || field === "tipoContrato" || field === "periodo") {
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
    if (alquileres.length < 4) setAlquileres((prev) => [...prev, emptyAlquiler()]);
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

  function tryClose() {
    const hayDatos = form.nombre || alquileres.length > 0;
    if (hayDatos) setConfirmCancel(true);
    else { reset(); onClose(); }
  }

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

        <div className="modal-header">
          <div>
            <div className="modal-title">Nuevo cliente</div>
            <div className="modal-sub">Ingresá los datos del cliente y sus alquileres</div>
          </div>
          <button className="close-btn" onClick={tryClose}>✕</button>
        </div>

        <div className="modal-body">
          {/* ── Datos del cliente ── */}
          <div className="section-divider">
            <div className="section-divider-label">Datos del cliente</div>
            <div className="section-divider-line" />
          </div>

          <div className="form-grid form-grid-2" style={{ marginTop: 12 }}>
            <div className="form-group">
              <label className="form-label">Nombre completo <span>*</span></label>
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
            <div className="section-divider-label">Alquileres ({alquileres.length}/4)</div>
            <div className="section-divider-line" />
          </div>

          {alquileres.length === 0 && (
            <div style={{ padding: "20px 0", textAlign: "center", color: "var(--text-3)", fontSize: 13 }}>
              Sin alquileres registrados. Podés guardar el cliente sin alquileres.
            </div>
          )}

          {alquileres.map((v, i) => {
            const proxima = v.fechaPrimerPago
              ? formatFecha(addPeriod(v.fechaPrimerPago, v.periodo))
              : null;

            return (
              <div key={i} className="vehicle-block">
                <div className="vehicle-block-header">
                  <div className="vehicle-block-title">🚗 Vehículo {i + 1}</div>
                  <div className="vehicle-block-actions">
                    <button className="btn btn-ghost btn-xs" onClick={() => clearAlquiler(i)}>
                      🗑 Limpiar
                    </button>
                    <button className="btn btn-danger-soft btn-xs" onClick={() => removeAlquiler(i)}>
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
                      onChange={(e) => updateAlquiler(i, "placa", e.target.value.toUpperCase())}
                    />
                  </div>

                  {/* Tipo de vehículo */}
                  <div className="form-group">
                    <label className="form-label">Tipo de vehículo</label>
                    <select
                      className="form-select"
                      value={v.tipoVehiculo}
                      onChange={(e) => updateAlquiler(i, "tipoVehiculo", e.target.value as TipoVehiculo)}
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
                      className="form-select"
                      value={v.tipoContrato}
                      onChange={(e) => updateAlquiler(i, "tipoContrato", e.target.value as TipoContrato)}
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
                      onChange={(e) => updateAlquiler(i, "periodo", e.target.value as PeriodoCobro)}
                    >
                      <option value="semanal">Semanal</option>
                      <option value="quincenal">Quincenal</option>
                      <option value="mensual">Mensual</option>
                    </select>
                  </div>

                  {/* FIX 2: Monto editable */}
                  <div className="form-group">
                    <label className="form-label">Monto (₡)</label>
                    <input
                      className="form-input"
                      type="number"
                      min={0}
                      step={500}
                      value={v.monto}
                      onChange={(e) => updateAlquiler(i, "monto", Number(e.target.value))}
                    />
                    {/* Hint que muestra la tarifa base para referencia */}
                    <span className="form-hint">
                      Tarifa base: {formatMonto(calcTarifa(v.tipoVehiculo, v.periodo, v.tipoContrato))}
                    </span>
                  </div>

                  {/* Fecha primer pago */}
                  <div className="form-group">
                    <label className="form-label">Fecha primer pago <span>*</span></label>
                    <input
                      className="form-input"
                      type="date"
                      value={v.fechaPrimerPago}
                      onChange={(e) => updateAlquiler(i, "fechaPrimerPago", e.target.value)}
                    />
                  </div>
                </div>

                {proxima && (
                  <div className="next-payment-preview">
                    🗓 El próximo pago (2da cuota) será el <strong>{proxima}</strong>
                  </div>
                )}
              </div>
            );
          })}

          {alquileres.length < 4 && (
            <button className="add-vehicle-btn" onClick={addAlquiler}>
              + Agregar alquiler
            </button>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={tryClose}>Cancelar</button>
          <button className="btn btn-primary" disabled={!canSave} onClick={() => setConfirmGuardar(true)}>
            Guardar cliente
          </button>
        </div>
      </div>

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