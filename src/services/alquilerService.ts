/**
 * SERVICIO: alquilerService
 * =========================
 * Todas las operaciones de Firestore para la colección /alquileres.
 *
 * COLECCIÓN: /alquileres/{placa}
 * El ID del documento ES la placa del vehículo.
 *
 * PATRÓN DE DATOS DUAL:
 * - /alquileres almacena `proximoPago` y `ultimaFechaPago` como cache eficiente.
 * - /pagos es la fuente de verdad histórica.
 * Cuando se confirma un pago, ambas colecciones se actualizan juntas en
 * `confirmarPagoYAvanzar()`. Nunca se actualiza una sin la otra.
 */

import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
  DocumentSnapshot,
  QueryDocumentSnapshot,
} from "firebase/firestore";
import { db } from "./firebase";
import type {
  Alquiler,
  AlquilerInput,
  EstadoAlquiler,
  PeriodoCobro,
} from "../models/Alquiler";

const COLECCION = "alquiler";

// ─────────────────────────────────────────────────────────────
// HELPER: Snapshot → Alquiler
// ─────────────────────────────────────────────────────────────
function snapshotAAlquiler(
  snapshot: DocumentSnapshot | QueryDocumentSnapshot
): Alquiler {
  return {
    placa: snapshot.id,
    ...(snapshot.data() as Omit<Alquiler, "placa">),
  };
}

// ─────────────────────────────────────────────────────────────
// HELPER: Calcular la próxima fecha de pago
// ─────────────────────────────────────────────────────────────
/**
 * Dado un Timestamp base y un periodo de cobro, devuelve el siguiente Timestamp.
 *
 * Usamos `.toDate()` para convertir el Timestamp a un Date de JavaScript,
 * le sumamos el tiempo según el periodo, y lo convertimos de vuelta a Timestamp.
 *
 * Para mensual/cuatrimestral usamos `setMonth()` que maneja correctamente
 * los saltos entre meses (enero → febrero, años bisiestos, etc.).
 *
 * Esta función también se exporta para que la UI pueda mostrar una preview
 * de la próxima fecha sin necesitar guardar nada en Firestore.
 */
export function calcularProximoPago(
  desde: Timestamp,
  periodo: PeriodoCobro
): Timestamp {
  const fecha = desde.toDate();

  switch (periodo) {
    case "semanal":
      fecha.setDate(fecha.getDate() + 7);
      break;
    case "quincenal":
      fecha.setDate(fecha.getDate() + 14);
      break;
    case "mensual":
      fecha.setMonth(fecha.getMonth() + 1);
      break;
  }

  return Timestamp.fromDate(fecha);
}

// ─────────────────────────────────────────────────────────────
// CREATE — Crear un nuevo alquiler
// ─────────────────────────────────────────────────────────────
/**
 * Crea un alquiler usando la placa como ID del documento.
 *
 * Usamos `setDoc` en lugar de `addDoc` porque queremos que el ID del documento
 * sea la placa, no un ID aleatorio generado por Firestore.
 * `setDoc(doc(db, COLECCION, placa), datos)` nos permite especificar el ID.
 *
 * Estado inicial:
 * - proximoPago = fechaPrimerPago (el usuario define cuándo inicia)
 * - ultimaFechaPago = fechaPrimerPago (línea base para el historial)
 * - estado = "activo"
 */
export async function crearAlquiler(input: AlquilerInput): Promise<Alquiler> {
  const { placa, fechaPrimerPago, ...resto } = input;

  const datos: Omit<Alquiler, "placa"> = {
    ...resto,
    proximoPago: fechaPrimerPago,
    ultimaFechaPago: fechaPrimerPago,
    estado: "activo"
  };

  const docRef = doc(db, COLECCION, placa);
  await setDoc(docRef, datos);

  return { placa, ...datos };
}

// ─────────────────────────────────────────────────────────────
// READ — Obtener un alquiler por placa
// ─────────────────────────────────────────────────────────────
export async function obtenerAlquilerPorPlaca(
  placa: string
): Promise<Alquiler | null> {
  const docRef = doc(db, COLECCION, placa);
  const snapshot = await getDoc(docRef);

  if (!snapshot.exists()) return null;
  return snapshotAAlquiler(snapshot);
}

// ─────────────────────────────────────────────────────────────
// READ — Obtener todos los alquileres de un cliente
// ─────────────────────────────────────────────────────────────
/**
 * Devuelve todos los alquileres (activos + suspendidos) de un cliente.
 * Se usa en la vista de detalle del cliente.
 *
 * `where("clienteId", "==", id)` filtra en el servidor — solo nos devuelve
 * los documentos que coinciden, no toda la colección.
 */
export async function obtenerAlquileresPorCliente(
  clienteId: string
): Promise<Alquiler[]> {
  const ref = collection(db, COLECCION);
  const q = query(ref, where("clienteId", "==", clienteId));
  const snapshot = await getDocs(q);

  const alquileres = snapshot.docs.map(snapshotAAlquiler);

  // Ordenamos en JS para evitar necesitar un índice compuesto en Firestore por ahora.
  return alquileres.sort(
    (a, b) => a.proximoPago.toMillis() - b.proximoPago.toMillis()
  );
}

// ─────────────────────────────────────────────────────────────
// READ — Obtener todos los alquileres activos (para el dashboard)
// ─────────────────────────────────────────────────────────────
/**
 * Devuelve todos los alquileres activos, ordenados por proximoPago ascendente.
 * Esta es la query principal que alimenta la tabla del dashboard.
 *
 * Una sola query, sin imports adicionales 
 */
export async function obtenerAlquileresActivos(): Promise<Alquiler[]> {
  const ref = collection(db, COLECCION);
  const q = query(
    ref,
    where("estado", "==", "activo"),
    orderBy("proximoPago", "asc")
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(snapshotAAlquiler);
}

// ─────────────────────────────────────────────────────────────
// UPDATE — Actualizar campos de un alquiler
// ─────────────────────────────────────────────────────────────
/**
 * Actualiza campos editables de un alquiler (tipo, contrato, periodo, monto).
 * No se permite cambiar `placa`, `clienteId` ni `creadoEn` desde aquí.
 */
export async function actualizarAlquiler(
  placa: string,
  cambios: Partial<Omit<Alquiler, "placa" | "clienteId" | "creadoEn">>
): Promise<void> {
  const docRef = doc(db, COLECCION, placa);
  await updateDoc(docRef, cambios);
}

// ─────────────────────────────────────────────────────────────
// CONFIRMAR PAGO → Avanzar a la siguiente fecha
// ─────────────────────────────────────────────────────────────
/**
 * Se llama cuando el admin hace clic en "Confirmar pago" en el dashboard.
 *
 * QUÉ HACE:
 * 1. Lee el alquiler actual para obtener `proximoPago` y `periodo`.
 * 2. Calcula el nuevo `proximoPago` sumando el periodo.
 * 3. Mueve el `proximoPago` actual a `ultimaFechaPago`.
 * 4. Escribe el nuevo `proximoPago` en Firestore.
 *
 * IMPORTANTE: Esta función solo actualiza /alquileres.
 * El llamador DEBE también llamar a `crearPago()` de pagoService
 * para registrar el historial. Ambas operaciones forman una confirmación completa:
 *
 *   await confirmarPagoYAvanzar(placa);
 *   await crearPago({ clienteId, placa, monto, registradoPor });
 */
export async function confirmarPagoYAvanzar(placa: string): Promise<void> {
  const alquiler = await obtenerAlquilerPorPlaca(placa);
  if (!alquiler) throw new Error(`Alquiler con placa ${placa} no encontrado.`);

  const nuevaFecha = calcularProximoPago(alquiler.proximoPago, alquiler.periodo);

  const docRef = doc(db, COLECCION, placa);
  await updateDoc(docRef, {
    ultimaFechaPago: alquiler.proximoPago, // la fecha que acaba de vencer
    proximoPago: nuevaFecha,               // la nueva fecha próxima
  });
}

// ─────────────────────────────────────────────────────────────
// SUSPENDER / REACTIVAR
// ─────────────────────────────────────────────────────────────
/**
 * Cambia el estado del alquiler entre "activo" y "suspendido".
 * Los alquileres suspendidos no suman al monto total del cliente.
 */
export async function cambiarEstadoAlquiler(
  placa: string,
  estado: EstadoAlquiler
): Promise<void> {
  const docRef = doc(db, COLECCION, placa);
  await updateDoc(docRef, { estado });
}

// ─────────────────────────────────────────────────────────────
// DELETE — Eliminar un alquiler
// ─────────────────────────────────────────────────────────────
/**
 * Elimina permanentemente un alquiler.
 * Los registros de /pagos que referenciaban esta placa siguen existiendo
 * en el historial — esto es intencional para mantener la auditoría.
 */
export async function eliminarAlquiler(placa: string): Promise<void> {
  const docRef = doc(db, COLECCION, placa);
  await deleteDoc(docRef);
}