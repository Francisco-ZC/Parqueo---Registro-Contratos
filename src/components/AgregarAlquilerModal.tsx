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

import { useState } from "react";
import "../css/components.css";
import "../css/NuevoClienteModal.css";
import "../css/AgregarAlquilerModal.css";
import { ConfirmDialog } from "./Uicomponents";
import { calcTarifa, formatMonto, formatFecha, labelVehiculo, labelContrato, labelPeriodo } from "../utils/Formatters";
import { addPeriod } from "../utils/DateUtils";
import { crearAlquiler } from "../services/alquilerService";
import { Timestamp } from "firebase/firestore";
import type { Cliente, TipoVehiculo, TipoContrato, PeriodoCobro } from "../models/Types";

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
  return {
    placa: "",
    tipoVehiculo: "liviano",
    tipoContrato: "diurno",
    periodo: "mensual",
    monto: calcTarifa("liviano", "mensual", "diurno"),
    fechaPrimerPago: "",
  };
}

export default function AgregarAlquilerModal({
  open,
  cliente,
  onClose,
  onGuardado,
}: AgregarAlquilerModalProps) {
  const [form, setForm]         = useState<AlquilerForm>(emptyForm());
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [confirmGuardar, setConfirmGuardar] = useState(false);

  function reset() {
    setForm(emptyForm());
    setError(null);
  }

  /**
   * Actualiza un campo del formulario.
   * Si cambia tipo/contrato/periodo, recalcula el monto base automáticamente.
   * El admin puede sobreescribir el monto después si necesita tarifa especial.
   */
  function update<K extends keyof AlquilerForm>(field: K, value: AlquilerForm[K]) {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      if (field === "tipoVehiculo" || field === "tipoContrato" || field === "periodo") {
        next.monto = calcTarifa(next.tipoVehiculo, next.periodo, next.tipoContrato);
      }
      return next;
    });
  }

  function tryClose() {
    reset();
    onClose();
  }

  async function doGuardar() {
    if (!cliente) return;

    // Validaciones antes de ir a Firestore
    if (!form.placa.trim()) {
      setError("La placa es obligatoria.");
      setConfirmGuardar(false);
      return;
    }
    if (!form.fechaPrimerPago) {
      setError("La fecha de primer pago es obligatoria.");
      setConfirmGuardar(false);
      return;
    }

    // Verificar que no haya otra placa igual entre los alquileres del cliente
    const placaExiste = cliente.alquileres.some(
      (a) => a.placa.toLowerCase() === form.placa.trim().toLowerCase()
    );
    if (placaExiste) {
      setError(`La placa ${form.placa} ya está registrada para este cliente.`);
      setConfirmGuardar(false);
      return;
    }

    setLoading(true);
    setError(null);
    setConfirmGuardar(false);

    try {
      await crearAlquiler({
        placa:           form.placa.trim().toUpperCase(),
        clienteId:       cliente.id,
        tipoVehiculo:    form.tipoVehiculo,
        tipoContrato:    form.tipoContrato,
        periodo:         form.periodo,
        monto:           form.monto,
        // Convertimos 'YYYY-MM-DD' a Timestamp.
        // T00:00:00 fuerza medianoche local y evita desfases de zona horaria.
        fechaPrimerPago: Timestamp.fromDate(new Date(form.fechaPrimerPago + "T00:00:00")),
      });

      reset();
      onGuardado(); // el padre recarga clientes y muestra toast
    } catch (err) {
      console.error("Error creando alquiler:", err);
      setError("Ocurrió un error al guardar. Intentá de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  if (!open || !cliente) return null;

  const totalAlquileres = cliente.alquileres.length;
  const proximaFecha    = form.fechaPrimerPago
    ? formatFecha(addPeriod(form.fechaPrimerPago, form.periodo))
    : null;
  const canSave = form.placa.trim().length > 0 && form.fechaPrimerPago.length > 0 && !loading;

  return (
    <div className="modal-overlay" onClick={tryClose}>
      <div className="modal modal-md" onClick={(e) => e.stopPropagation()}>

        <div className="modal-header">
          <div>
            <div className="modal-title">Agregar alquiler</div>
            <div className="modal-sub">
              {cliente.nombre} · {totalAlquileres}/4 alquileres
            </div>
          </div>
          <button className="close-btn" onClick={tryClose} disabled={loading}>✕</button>
        </div>

        <div className="modal-body">
          {/* Límite de alquileres */}
          {totalAlquileres >= 4 && (
            <div style={{
              padding: "12px 16px", background: "var(--warn-bg)",
              border: "1px solid var(--warn-bd)", borderRadius: "var(--radius-sm)",
              color: "var(--warn)", fontSize: 13, fontWeight: 600, marginBottom: 16,
            }}>
              ⚠ Este cliente ya tiene 4 alquileres registrados (el máximo permitido).
            </div>
          )}

          {totalAlquileres < 4 && (
            <div className="form-grid form-grid-2">
              {/* Placa */}
              <div className="form-group">
                <label className="form-label">Placa <span>*</span></label>
                <input
                  className="form-input"
                  placeholder="Ej: AAA-123"
                  value={form.placa}
                  disabled={loading}
                  onChange={(e) => update("placa", e.target.value.toUpperCase())}
                />
              </div>

              {/* Tipo vehículo */}
              <div className="form-group">
                <label className="form-label">Tipo de vehículo</label>
                <select
                  className="form-select"
                  value={form.tipoVehiculo}
                  disabled={loading}
                  onChange={(e) => update("tipoVehiculo", e.target.value as TipoVehiculo)}
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
                  value={form.tipoContrato}
                  disabled={loading}
                  onChange={(e) => update("tipoContrato", e.target.value as TipoContrato)}
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
                  className="form-select"
                  value={form.periodo}
                  disabled={loading}
                  onChange={(e) => update("periodo", e.target.value as PeriodoCobro)}
                >
                  <option value="semanal">Semanal</option>
                  <option value="quincenal">Quincenal</option>
                  <option value="mensual">Mensual</option>
                </select>
              </div>

              {/* Monto editable */}
              <div className="form-group">
                <label className="form-label">Monto (₡)</label>
                <input
                  className="form-input"
                  type="number"
                  min={0}
                  step={500}
                  value={form.monto}
                  disabled={loading}
                  onChange={(e) => update("monto", Number(e.target.value))}
                />
                <span className="form-hint">
                  Tarifa base: {formatMonto(calcTarifa(form.tipoVehiculo, form.periodo, form.tipoContrato))}
                </span>
              </div>

              {/* Fecha primer pago */}
              <div className="form-group">
                <label className="form-label">Fecha primer pago <span>*</span></label>
                <input
                  className="form-input"
                  type="date"
                  value={form.fechaPrimerPago}
                  disabled={loading}
                  onChange={(e) => update("fechaPrimerPago", e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Preview de la próxima fecha */}
          {proximaFecha && (
            <div className="next-payment-preview" style={{ marginTop: 14 }}>
              🗓 El próximo pago (2da cuota) será el <strong>{proximaFecha}</strong>
            </div>
          )}

          {/* Resumen del alquiler a crear */}
          {canSave && (
            <div className="alquiler-resumen" style={{ marginTop: 14 }}>
              <div className="alquiler-resumen-title">Resumen del alquiler</div>
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

          {/* Error de validación o Firestore */}
          {error && (
            <div style={{
              marginTop: 12, padding: "10px 14px",
              background: "var(--danger-bg)", border: "1px solid var(--danger-bd)",
              borderRadius: "var(--radius-sm)", color: "var(--danger)", fontSize: 13,
            }}>
              ⚠ {error}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={tryClose} disabled={loading}>
            Cancelar
          </button>
          {totalAlquileres < 4 && (
            <button
              className="btn btn-primary"
              disabled={!canSave}
              onClick={() => setConfirmGuardar(true)}
            >
              {loading ? "Guardando…" : "Agregar alquiler"}
            </button>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={confirmGuardar}
        icon="🚗"
        title="¿Agregar alquiler?"
        msg={`Se registrará la placa <strong>${form.placa}</strong> para <strong>${cliente?.nombre}</strong>.`}
        acceptLabel="Agregar"
        cancelLabel="Revisar"
        onAccept={doGuardar}
        onCancel={() => setConfirmGuardar(false)}
      />
    </div>
  );
}