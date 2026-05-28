/**
 * MODELO: Pago
 * ============
 * Registro histórico e inmutable de cada cobro confirmado.
 *
 * COLECCIÓN: /pago/{autoId}
 *
 * CAMBIO RESPECTO A LA VERSIÓN ANTERIOR:
 * Se agregó `clienteNombre` como campo denormalizado.
 *
 * Por qué denormalizar clienteNombre aquí:
 * La vista de Reportes necesita mostrar el nombre del cliente junto a cada pago.
 * Si no lo guardamos acá, tendríamos que hacer una query extra a /cliente por
 * cada pago para obtener el nombre — eso son N queries adicionales.
 * Guardándolo en el momento de crear el pago, Reportes carga con una sola query.
 * El tradeoff: si el nombre del cliente cambia, los pagos viejos mostrarán
 * el nombre anterior — aceptable para un sistema de historial contable.
 */

import { Timestamp } from "firebase/firestore";

export interface Pago {
  id: string;               // ID auto-generado por Firestore
  clienteId: string;        // FK → cliente/{id}
  placa: string;            // FK → alquiler/{placa}
  monto: number;            // Snapshot del monto cobrado en ₡ CRC
  fechaPago: Timestamp;     // Timestamp del servidor al confirmar
  registradoPor: string;    // Email del admin que confirmó (de Firebase Auth)
  clienteNombre: string;    // Denormalizado desde cliente.nombre para reportes
}

/**
 * PagoInput: lo que se necesita para registrar un nuevo pago.
 * Omitimos `id` (auto-generado) y `fechaPago` (lo pone el servidor con serverTimestamp).
 */
export type PagoInput = Omit<Pago, "id" | "fechaPago">;