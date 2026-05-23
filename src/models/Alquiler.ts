/**
 * MODELO: Alquiler
 * ================
 * Un alquiler es el contrato entre un cliente y el parqueo para un vehículo.
 * Cada cliente puede tener entre 0 y 4 alquileres activos.
 *
 * COLECCIÓN: /alquileres/{placa}
 * El ID del documento ES la placa del vehículo — única por naturaleza.
 *
 * DECISIÓN DE DISEÑO — campos calculables almacenados:
 * `ultimaFechaPago` y `proximoPago` se almacenan directamente en el documento
 * aunque podrían derivarse de /pagos. Razón: el dashboard principal necesita
 * ordenar y filtrar por `proximoPago` sobre TODOS los alquileres activos en
 * una sola consulta. Si calculáramos esto buscando en /pagos cada vez,
 * necesitaríamos N+1 queries (una por alquiler). Almacenarlo aquí = 1 query.
 * Los /pagos siguen siendo la fuente de verdad histórica; este campo es un cache.
 */

import { Timestamp } from "firebase/firestore";

/** Tipos de vehículo aceptados por el sistema. */
export type TipoVehiculo = "pesado" | "liviano" | "moto";

/**
 * Tipo de contrato: cuándo se usa el espacio.
 * "ambos" significa día Y noche — el monto se duplica.
 */
export type TipoContrato = "diurno" | "nocturno" | "ambos";

/**
 * Periodo de cobro: con qué frecuencia paga el cliente.
 */
export type PeriodoCobro = "semanal" | "quincenal" | "mensual" ;

/**
 * Estado del alquiler. "suspendido" significa que el registro existe en la BD
 * pero NO suma al monto total del cliente mientras esté en ese estado.
 */
export type EstadoAlquiler = "activo" | "suspendido";

export interface Alquiler {
  placa: string;                // PK — ID del documento en Firestore
  clienteId: string;            // FK → clientes/{id}
  tipoVehiculo: TipoVehiculo;   // pesado | liviano | moto
  tipoContrato: TipoContrato;   // diurno | nocturno | ambos
  periodo: PeriodoCobro;        // semanal | quincenal | mensual
  monto: number;                // Monto a cobrar por periodo (en ₡ CRC)
  proximoPago: Timestamp;       // Próxima fecha de vencimiento (campo cacheado)
  ultimaFechaPago: Timestamp;   // Última fecha en que se confirmó el pago
  estado: EstadoAlquiler;       // activo | suspendido
}

/**
 * AlquilerInput: datos necesarios del usuario para crear un alquiler.
 *
 * Omitimos `placa` (se provee por separado como doc ID), `ultimaFechaPago`,
 * `estado` porque se establecen automáticamente al crear.
 * Agregamos `fechaPrimerPago` — el usuario elige cuándo inicia el contrato,
 * y de ahí derivamos tanto `ultimaFechaPago` como `proximoPago`.
 */
export type AlquilerInput = Omit<
  Alquiler,
  "placa" | "ultimaFechaPago" | "estado" | "proximoPago"
> & {
  placa: string;               // Requerido en la creación (usado como doc ID)
  fechaPrimerPago: Timestamp;  // El usuario selecciona la primera fecha de pago
};