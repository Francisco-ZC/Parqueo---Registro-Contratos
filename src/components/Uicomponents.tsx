/**
 * COMPONENTES UI COMPARTIDOS
 * ==========================
 * Toast, ConfirmDialog, StatusBadge, PeriodoBadge
 *
 * Todos son componentes pequeños y reutilizables.
 * Se importan donde se necesiten desde cualquier página o componente.
 */

import '../css/components.css';
import type { ToastItem, PeriodoCobro } from '../models/Types';
import { daysUntil, diasDePeriodo } from '../utils/DateUtils';
import { labelPeriodo } from '../utils/Formatters';

// ─── TOAST AREA ───────────────────────────────────────────────
/**
 * Área de notificaciones tipo "snackbar" en la esquina inferior derecha.
 * El componente padre maneja el array de toasts y su timeout.
 *
 * CÓMO USAR (en el componente padre):
 *   const [toasts, setToasts] = useState<ToastItem[]>([]);
 *
 *   function addToast(msg: string, type: ToastType = 'success') {
 *     const id = Date.now();
 *     setToasts(t => [...t, { id, msg, type }]);
 *     setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500);
 *   }
 */
interface ToastAreaProps {
  toasts: ToastItem[];
}

export function ToastArea({ toasts }: ToastAreaProps) {
  const icons: Record<string, string> = {
    success: '✓',
    error: '✕',
    warn: '⚠',
  };

  return (
    <div className="toast-area">
      {toasts.map((t) => (
        <div key={t.id} className={`toast ${t.type}`}>
          <span className="toast-icon">{icons[t.type] ?? '•'}</span>
          <span className="toast-msg">{t.msg}</span>
        </div>
      ))}
    </div>
  );
}

// ─── CONFIRM DIALOG ───────────────────────────────────────────
/**
 * Modal de confirmación genérico.
 * Se usa para acciones destructivas o de alta importancia.
 *
 * CÓMO USAR:
 *   <ConfirmDialog
 *     open={showConfirm}
 *     icon="⚠️"
 *     title="¿Eliminar cliente?"
 *     msg="Esta acción no se puede deshacer."
 *     acceptLabel="Sí, eliminar"
 *     danger
 *     onAccept={() => { doDelete(); setShowConfirm(false); }}
 *     onCancel={() => setShowConfirm(false)}
 *   />
 */
interface ConfirmDialogProps {
  open: boolean;
  icon: string;
  title: string;
  /** Puede incluir HTML básico como <strong> */
  msg: string;
  acceptLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onAccept: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  icon,
  title,
  msg,
  acceptLabel = 'Aceptar',
  cancelLabel = 'Cancelar',
  danger = false,
  onAccept,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal modal-sm" onClick={(e) => e.stopPropagation()}>
        <div className="modal-body" style={{ paddingTop: 28 }}>
          <div className="dialog-icon">{icon}</div>
          <div className="dialog-title">{title}</div>
          {/* dangerouslySetInnerHTML es seguro aquí porque el msg viene de nuestro propio código */}
          <div className="dialog-msg" dangerouslySetInnerHTML={{ __html: msg }} />
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button
            className={`btn ${danger ? 'btn-danger-soft' : 'btn-primary'}`}
            onClick={onAccept}
          >
            {acceptLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── STATUS BADGE ─────────────────────────────────────────────
/**
 * Badge que muestra el estado del próximo pago con color según urgencia.
 * - Verde:  tiempo restante normal
 * - Amarillo: menos del 40% del periodo restante
 * - Rojo:   fecha ya pasó
 */
interface StatusBadgeProps {
  proximoPago: string;   // ISO date 'YYYY-MM-DD'
  periodo: PeriodoCobro;
}

export function StatusBadge({ proximoPago, periodo }: StatusBadgeProps) {
  const days  = daysUntil(proximoPago);
  const total = diasDePeriodo(periodo);

  if (days <= 0) {
    return (
      <span className="badge badge-danger">
        ⚠ Vencido hace {Math.abs(days)}d
      </span>
    );
  }

  if (days / total <= 0.4) {
    return <span className="badge badge-warn">⏳ En {days}d</span>;
  }

  return <span className="badge badge-green">✓ En {days}d</span>;
}

// ─── PERIODO BADGE ────────────────────────────────────────────
/**
 * Badge con color según el periodo de cobro.
 */
interface PeriodoBadgeProps {
  periodo: PeriodoCobro;
}

export function PeriodoBadge({ periodo }: PeriodoBadgeProps) {
  const colorMap: Record<PeriodoCobro, string> = {
    mensual:        'badge-blue',
    quincenal:      'badge-sky',
    semanal:        'badge-purple',
    //cuatrimestral:  'badge-gray',
  };

  return (
    <span className={`badge ${colorMap[periodo] ?? 'badge-gray'}`}>
      {labelPeriodo(periodo)}
    </span>
  );
}