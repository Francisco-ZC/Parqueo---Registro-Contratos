/**
 * TIPOS GLOBALES DE LA APLICACIÓN
 * ================================
 * Un solo archivo con todos los tipos compartidos entre páginas y componentes.
 * Importá desde aquí: import type { Cliente, Alquiler, Pago } from '../models/types';
 *
 * NOTA: Estos tipos son para la UI (usan string para fechas en lugar de Timestamp
 * de Firestore). Los modelos de Firestore (con Timestamp) están en sus propios
 * archivos en esta misma carpeta (Cliente.ts, Alquiler.ts, Pago.ts).
 */

// ─── ALQUILER ───────────────────────────────────────────────
export type TipoVehiculo  = 'pesado' | 'liviano' | 'moto';
export type TipoContrato  = 'diurno' | 'nocturno' | 'ambos';
export type PeriodoCobro  = 'semanal' | 'quincenal' | 'mensual' ; //| 'cuatrimestral';
export type EstadoAlquiler = 'activo' | 'suspendido';

export interface Alquiler {
  placa: string;
  clienteId: string;
  tipoVehiculo: TipoVehiculo;
  tipoContrato: TipoContrato;
  periodo: PeriodoCobro;
  monto: number;
  proximoPago: string;      // ISO date string 'YYYY-MM-DD' (en UI)
  ultimaFechaPago: string;  // ISO date string 'YYYY-MM-DD' (en UI)
  estado: EstadoAlquiler;
}

// ─── CLIENTE ────────────────────────────────────────────────
export interface Cliente {
  id: string;
  nombre: string;
  cedula?: string | null;
  telefono?: string | null;
  correo?: string | null;
  createdAt: string;        // ISO date string
  alquileres: Alquiler[];   // cargados junto al cliente en la UI
}

// ─── PAGO ───────────────────────────────────────────────────
export interface Pago {
  id: string;
  clienteId: string;
  placa: string;
  monto: number;
  fechaPago: string;        // ISO date string
  registradoPor: string;    // email del usuario que confirmó
  clienteNombre: string;    // denormalizado para mostrar en reportes sin join
}

// ─── USUARIO (colección /usuario en Firestore) ──────────────
export interface Usuario {
  email: string;    // doc ID en Firestore
  nombre: string;   // nombre real del administrador
  usuario: string;  // nombre de usuario para mostrar
}

// ─── FORM TYPES (para formularios de creación) ──────────────
export interface AlquilerInput {
  placa: string;
  tipoVehiculo: TipoVehiculo;
  tipoContrato: TipoContrato;
  periodo: PeriodoCobro;
  monto: number;
  fechaPrimerPago: string;  // ISO date string seleccionado por el usuario
}

export interface ClienteInput {
  nombre: string;
  cedula: string;
  telefono: string;
  correo: string;
  alquileres: AlquilerInput[];
}

// ─── UI HELPER TYPES ─────────────────────────────────────────
export type ToastType = 'success' | 'error' | 'warn';

export interface ToastItem {
  id: number;
  msg: string;
  type: ToastType;
}

/** Cliente enriquecido con campos calculados para el dashboard */
export interface ClienteRow extends Cliente {
  montoTotal: number;
  proximoPagoMin: string;   // la fecha más próxima entre sus alquileres activos
  diasRestantes: number;
  periodoDisplay: PeriodoCobro;
  rowStatus: 'ok' | 'warn' | 'danger';
}