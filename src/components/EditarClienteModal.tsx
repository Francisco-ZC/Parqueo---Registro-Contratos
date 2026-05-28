/**
 * COMPONENTE: EditarClienteModal
 * ================================
 * Modal para editar los datos personales de un cliente existente.
 * No edita alquileres — eso se hace desde ClienteDetailPage directamente.
 *
 * FLUJO:
 * 1. Se abre con los datos actuales del cliente pre-cargados
 * 2. El admin modifica los campos que necesita
 * 3. Al guardar → llama actualizarCliente() en Firestore
 * 4. El padre llama recargarClientes() para reflejar el cambio
 *
 * Props:
 * - open: si el modal está visible
 * - cliente: el cliente a editar (sus datos se pre-cargan en el form)
 * - onClose: cierra sin guardar
 * - onGuardado: callback que el padre usa para recargar datos y mostrar toast
 */

import { useState, useEffect } from "react";
import "../css/components.css";
import "../css/EditarClienteModal.css";
import { ConfirmDialog } from "./Uicomponents";
import { actualizarCliente } from "../services/clienteService";
import type { Cliente } from "../models/Types";

interface EditarClienteModalProps {
  open: boolean;
  cliente: Cliente | null;
  onClose: () => void;
  onGuardado: (nombre: string) => void; // el padre muestra el toast con el nombre
}

interface FormState {
  nombre: string;
  cedula: string;
  telefono: string;
  correo: string;
}

export default function EditarClienteModal({
  open,
  cliente,
  onClose,
  onGuardado,
}: EditarClienteModalProps) {
  const [form, setForm]       = useState<FormState>({ nombre: "", cedula: "", telefono: "", correo: "" });
  const [loading, setLoading] = useState(false);
  const [confirmGuardar, setConfirmGuardar] = useState(false);

  /**
   * Cada vez que el modal se abre con un cliente diferente,
   * pre-cargamos el formulario con sus datos actuales.
   *
   * useEffect con [cliente, open] como dependencias significa:
   * "ejecutá esto cada vez que `cliente` u `open` cambien".
   */
  useEffect(() => {
    if (cliente && open) {
      setForm({
        nombre:   cliente.nombre          ?? "",
        cedula:   cliente.cedula          ?? "",
        telefono: cliente.telefono        ?? "",
        correo:   cliente.correo          ?? "",
      });
    }
  }, [cliente, open]);

  /**
   * Detecta si el admin realmente cambió algo respecto al valor original.
   * Si no cambió nada, deshabilitamos el botón de guardar.
   * Comparamos string a string — null del cliente se trata como "".
   */
  function haycambios(): boolean {
    if (!cliente) return false;
    return (
      form.nombre   !== (cliente.nombre    ?? "") ||
      form.cedula   !== (cliente.cedula    ?? "") ||
      form.telefono !== (cliente.telefono  ?? "") ||
      form.correo   !== (cliente.correo    ?? "")
    );
  }

  async function doGuardar() {
    if (!cliente) return;
    setLoading(true);
    setConfirmGuardar(false);

    try {
      /**
       * Construimos el objeto de actualización solo con campos que tienen valor.
       * Firestore no acepta undefined — usamos spread condicional igual que
       * en handleGuardarCliente del App.tsx.
       *
       * Si el campo quedó vacío, enviamos explícitamente null para
       * borrar el valor anterior en Firestore (a diferencia de omitirlo,
       * que dejaría el valor viejo intacto).
       */
      await actualizarCliente(cliente.id, {
        nombre:   form.nombre.trim(),
        cedula:   form.cedula.trim()   || "",
        telefono: form.telefono.trim() || "",
        correo:   form.correo.trim()   || "",
      });

      onGuardado(form.nombre.trim());
      onClose();
    } catch (err) {
      console.error("Error actualizando cliente:", err);
    } finally {
      setLoading(false);
    }
  }

  // Determina si un campo fue modificado para aplicar estilo visual
  function isModified(field: keyof FormState): boolean {
    if (!cliente) return false;
    const original = (cliente[field as keyof Cliente] as string) ?? "";
    return form[field] !== original;
  }

  if (!open || !cliente) return null;

  const canSave = form.nombre.trim().length > 0 && haycambios() && !loading;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-md" onClick={(e) => e.stopPropagation()}>

        <div className="modal-header">
          <div>
            <div className="modal-title">Editar cliente</div>
            <div className="modal-sub">{cliente.nombre}</div>
          </div>
          <button className="close-btn" onClick={onClose} disabled={loading}>✕</button>
        </div>

        <div className="modal-body">
          <div className="form-grid form-grid-2">

            {/* Nombre */}
            <div className="form-group" style={{ gridColumn: "1 / -1" }}>
              <label className="form-label">Nombre completo <span>*</span></label>
              <input
                className={`form-input ${isModified("nombre") ? "modified" : ""}`}
                placeholder="Nombre completo"
                value={form.nombre}
                disabled={loading}
                onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
              />
            </div>

            {/* Cédula */}
            <div className="form-group">
              <label className="form-label">Cédula</label>
              <input
                className={`form-input ${isModified("cedula") ? "modified" : ""}`}
                placeholder="Ej: 1-0852-0341"
                value={form.cedula}
                disabled={loading}
                onChange={(e) => setForm((f) => ({ ...f, cedula: e.target.value }))}
              />
            </div>

            {/* Teléfono */}
            <div className="form-group">
              <label className="form-label">Teléfono</label>
              <input
                className={`form-input ${isModified("telefono") ? "modified" : ""}`}
                placeholder="Ej: 8845-2211"
                value={form.telefono}
                disabled={loading}
                onChange={(e) => setForm((f) => ({ ...f, telefono: e.target.value }))}
              />
            </div>

            {/* Correo */}
            <div className="form-group" style={{ gridColumn: "1 / -1" }}>
              <label className="form-label">Correo electrónico</label>
              <input
                className={`form-input ${isModified("correo") ? "modified" : ""}`}
                placeholder="Ej: cliente@correo.com"
                type="email"
                value={form.correo}
                disabled={loading}
                onChange={(e) => setForm((f) => ({ ...f, correo: e.target.value }))}
              />
            </div>
          </div>

          {/* Preview de cambios pendientes */}
          {haycambios() && (
            <div className="changes-preview">
              <div className="changes-preview-title">Cambios pendientes</div>
              {isModified("nombre")   && <div>• Nombre: <strong>{form.nombre}</strong></div>}
              {isModified("cedula")   && <div>• Cédula: <strong>{form.cedula   || "—"}</strong></div>}
              {isModified("telefono") && <div>• Teléfono: <strong>{form.telefono || "—"}</strong></div>}
              {isModified("correo")   && <div>• Correo: <strong>{form.correo   || "—"}</strong></div>}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose} disabled={loading}>
            Cancelar
          </button>
          <button
            className="btn btn-primary"
            disabled={!canSave}
            onClick={() => setConfirmGuardar(true)}
          >
            {loading ? "Guardando…" : "Guardar cambios"}
          </button>
        </div>
      </div>

      <ConfirmDialog
        open={confirmGuardar}
        icon="✏️"
        title="¿Guardar cambios?"
        msg={`Se actualizarán los datos de <strong>${cliente.nombre}</strong>.`}
        acceptLabel="Guardar"
        cancelLabel="Revisar"
        onAccept={doGuardar}
        onCancel={() => setConfirmGuardar(false)}
      />
    </div>
  );
}