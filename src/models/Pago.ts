/**
 * MODELO: Pago
 * ============
 * Un pago es un registro histórico creado cada vez que se confirma un cobro.
 * Es INMUTABLE — una vez creado, no se modifica. Funciona como un ledger/bitácora.
 *
 * COLECCIÓN: /pagos/{autoId}
 *
 * RELACIÓN CON ALQUILER:
 * Aunque `ultimaFechaPago` y `proximoPago` están almacenados en /alquileres
 * por eficiencia, /pagos es la fuente de verdad histórica. Si necesitás auditar
 * o reconstruir el historial de un vehículo, consultás esta colección.
 *
 * CAMPOS DENORMALIZADOS (repetidos intencionalmente):
 * `clienteId` y `placa` se repiten aquí aunque podrían navegarse desde el alquiler.
 * Esto permite filtrar pagos por cliente O por vehículo con una sola query,
 * sin joins adicionales. Es el patrón estándar en Firestore.
 *
 * `monto` también se guarda como snapshot — si la tarifa cambia en el futuro,
 * el historial refleja lo que SE COBRÓ en ese momento, no la tarifa actual.
 */

import { Timestamp } from "firebase/firestore";

export interface Pago {
  id: string;                   // ID auto-generado por Firestore
  clienteId: string;            // FK → clientes/{id}
  placa: string;                // FK → alquileres/{placa}
  monto: number;                // Monto cobrado en este pago (snapshot en ₡ CRC)
  fechaPago: Timestamp;         // Cuándo se confirmó el pago (timestamp del servidor)
  registradoPor: string;        // Email del admin que confirmó el pago
}

/**
 * PagoInput: datos necesarios para registrar un nuevo pago.
 * Omitimos `id` (auto-generado) y `fechaPago` (lo pone el servidor).
 */
export type PagoInput = Omit<Pago, "id" | "fechaPago">;