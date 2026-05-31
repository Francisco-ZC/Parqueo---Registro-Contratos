import { useState } from 'react';
import '../css/components.css';
import '../css/NuevoClienteModal.css';
import { ConfirmDialog } from './Uicomponents';
import { calcTarifa, formatMonto, formatFecha } from '../utils/Formatters';
import { calcularProximaFechaUI } from '../utils/DateUtils'; // ← centralizado
import type {
  ClienteInput, AlquilerInput, TipoVehiculo, TipoContrato, PeriodoCobro,
} from '../models/Types';

interface NuevoClienteModalProps {
  open: boolean;
  onClose: () => void;
  onGuardar: (data: ClienteInput) => void;
}

const EMPTY_CLIENTE = { nombre: '', cedula: '', telefono: '', correo: '' };

function emptyAlquiler(): AlquilerInput {
  return {
    placa: '', tipoVehiculo: 'liviano', tipoContrato: 'diurno',
    periodo: 'mensual', monto: calcTarifa('liviano', 'mensual', 'diurno'),
    fechaPrimerPago: '',
  };
}

export default function NuevoClienteModal({ open, onClose, onGuardar }: NuevoClienteModalProps) {
  const [form, setForm]         = useState(EMPTY_CLIENTE);
  const [alquileres, setAlquileres] = useState<AlquilerInput[]>([]);
  const [confirmCancel, setConfirmCancel]   = useState(false);
  const [confirmGuardar, setConfirmGuardar] = useState(false);

  function reset() { setForm(EMPTY_CLIENTE); setAlquileres([]); }

  function updateAlquiler(i: number, field: keyof AlquilerInput, value: string | number) {
    setAlquileres(prev => {
      const next    = [...prev];
      const updated = { ...next[i], [field]: value };
      if (field === 'tipoVehiculo' || field === 'tipoContrato' || field === 'periodo') {
        updated.monto = calcTarifa(updated.tipoVehiculo, updated.periodo, updated.tipoContrato);
      }
      next[i] = updated;
      return next;
    });
  }

  function tryClose() {
    if (form.nombre || alquileres.length > 0) setConfirmCancel(true);
    else { reset(); onClose(); }
  }

  function doGuardar() { onGuardar({ ...form, alquileres }); reset(); onClose(); setConfirmGuardar(false); }

  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={tryClose}>
      <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <div className="modal-title">Nuevo cliente</div>
            <div className="modal-sub">Ingresá los datos del cliente y sus alquileres</div>
          </div>
          <button className="close-btn" onClick={tryClose}>✕</button>
        </div>

        <div className="modal-body">
          {/* Datos del cliente */}
          <div className="section-divider">
            <div className="section-divider-label">Datos del cliente</div>
            <div className="section-divider-line" />
          </div>
          <div className="form-grid form-grid-2" style={{ marginTop: 12 }}>
            <div className="form-group">
              <label className="form-label">Nombre completo <span>*</span></label>
              <input className="form-input" placeholder="Ej: Carlos Mora Jiménez"
                value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Cédula</label>
              <input className="form-input" placeholder="Ej: 1-0852-0341"
                value={form.cedula} onChange={e => setForm(f => ({ ...f, cedula: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Teléfono</label>
              <input className="form-input" placeholder="Ej: 8845-2211"
                value={form.telefono} onChange={e => setForm(f => ({ ...f, telefono: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Correo electrónico</label>
              <input className="form-input" type="email" placeholder="Ej: cliente@correo.com"
                value={form.correo} onChange={e => setForm(f => ({ ...f, correo: e.target.value }))} />
            </div>
          </div>

          {/* Alquileres */}
          <div className="section-divider" style={{ marginTop: 24 }}>
            <div className="section-divider-label">Alquileres ({alquileres.length}/4)</div>
            <div className="section-divider-line" />
          </div>

          {alquileres.length === 0 && (
            <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>
              Sin alquileres registrados. Podés guardar el cliente sin alquileres.
            </div>
          )}

          {alquileres.map((v, i) => {
            /**
             * CÁLCULO CENTRALIZADO del preview.
             * calcularProximaFechaUI usa la MISMA lógica que confirmarPagoYAvanzar.
             * Lo que se muestra aquí es exactamente lo que se va a guardar.
             */
            const proximaFechaISO = v.fechaPrimerPago
              ? calcularProximaFechaUI(v.fechaPrimerPago, v.periodo)
              : null;

            return (
              <div key={i} className="vehicle-block">
                <div className="vehicle-block-header">
                  <div className="vehicle-block-title">🚗 Vehículo {i + 1}</div>
                  <div className="vehicle-block-actions">
                    <button className="btn btn-ghost btn-xs"
                      onClick={() => setAlquileres(prev => { const n=[...prev]; n[i]=emptyAlquiler(); return n; })}>
                      🗑 Limpiar
                    </button>
                    <button className="btn btn-danger-soft btn-xs"
                      onClick={() => setAlquileres(prev => prev.filter((_, j) => j !== i))}>
                      ✕ Eliminar
                    </button>
                  </div>
                </div>

                <div className="form-grid form-grid-3">
                  <div className="form-group">
                    <label className="form-label">Placa <span>*</span></label>
                    <input className="form-input" placeholder="Ej: AAA-123" value={v.placa}
                      onChange={e => updateAlquiler(i, 'placa', e.target.value.toUpperCase())} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Tipo de vehículo</label>
                    <select className="form-select" value={v.tipoVehiculo}
                      onChange={e => updateAlquiler(i, 'tipoVehiculo', e.target.value as TipoVehiculo)}>
                      <option value="liviano">🚗 Liviano</option>
                      <option value="moto">🏍 Moto</option>
                      <option value="pesado">🚛 Pesado</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Contrato</label>
                    <select className="form-select" value={v.tipoContrato}
                      onChange={e => updateAlquiler(i, 'tipoContrato', e.target.value as TipoContrato)}>
                      <option value="diurno">☀ Diurno</option>
                      <option value="nocturno">🌙 Nocturno</option>
                      <option value="ambos">☀🌙 Ambos (x2)</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Periodo</label>
                    <select className="form-select" value={v.periodo}
                      onChange={e => updateAlquiler(i, 'periodo', e.target.value as PeriodoCobro)}>
                      <option value="semanal">Semanal</option>
                      <option value="quincenal">Quincenal</option>
                      <option value="mensual">Mensual</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Monto (₡)</label>
                    <input className="form-input" type="number" min={0} step={500} value={v.monto}
                      onChange={e => updateAlquiler(i, 'monto', Number(e.target.value))} />
                    <span className="form-hint">
                      Tarifa base: {formatMonto(calcTarifa(v.tipoVehiculo, v.periodo, v.tipoContrato))}
                    </span>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Fecha primer pago <span>*</span></label>
                    <input className="form-input" type="date" value={v.fechaPrimerPago}
                      onChange={e => updateAlquiler(i, 'fechaPrimerPago', e.target.value)} />
                  </div>
                </div>

                {/* Preview con cálculo centralizado */}
                {proximaFechaISO && (
                  <div className="next-payment-preview">
                    🗓 El próximo pago (2da cuota) será el{' '}
                    <strong>{formatFecha(proximaFechaISO)}</strong>
                  </div>
                )}
              </div>
            );
          })}

          {alquileres.length < 4 && (
            <button className="add-vehicle-btn"
              onClick={() => setAlquileres(prev => [...prev, emptyAlquiler()])}>
              + Agregar alquiler
            </button>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={tryClose}>Cancelar</button>
          <button className="btn btn-primary" disabled={!form.nombre.trim()}
            onClick={() => setConfirmGuardar(true)}>
            Guardar cliente
          </button>
        </div>
      </div>

      <ConfirmDialog open={confirmCancel} icon="⚠️" title="¿Cancelar registro?"
        msg="Se perderán todos los datos ingresados."
        acceptLabel="Sí, cancelar" cancelLabel="Seguir editando" danger
        onAccept={() => { reset(); onClose(); setConfirmCancel(false); }}
        onCancel={() => setConfirmCancel(false)} />

      <ConfirmDialog open={confirmGuardar} icon="✅" title="¿Confirmar registro?"
        msg={`Se guardará el cliente <strong>${form.nombre}</strong> con <strong>${alquileres.length}</strong> alquiler(es).`}
        acceptLabel="Aceptar" cancelLabel="Seguir editando"
        onAccept={doGuardar} onCancel={() => setConfirmGuardar(false)} />
    </div>
  );
}