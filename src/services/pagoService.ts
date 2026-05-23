/**
 * SERVICIO: pagoService
 * =====================
 * Todas las operaciones de Firestore para la colección /pagos.
 *
 * COLECCIÓN: /pagos/{autoId}
 *
 * Los pagos son registros INMUTABLES — una vez creados, no se modifican.
 * Funcionan como una bitácora contable: solo se agregan, nunca se editan.
 *
 * FLUJO COMPLETO DE CONFIRMACIÓN DE PAGO:
 * Cuando el admin hace clic en "Confirmar pago", el componente debe llamar
 * a AMBAS funciones en orden:
 *
 *   // 1. Avanza la fecha en el alquiler
 *   await confirmarPagoYAvanzar(placa);
 *
 *   // 2. Registra el pago en el historial
 *   await crearPago({ clienteId, placa, monto, registradoPor });
 *
 * Si solo se llama una sin la otra, los datos quedan inconsistentes.
 * Considera envolver ambas en un try/catch para manejar el error juntas.
 */

import {
  collection,
  addDoc,
  getDoc,
  getDocs,
  doc,
  query,
  where,
  orderBy,
  serverTimestamp,
  DocumentSnapshot,
  QueryDocumentSnapshot,
  Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";
import type { Pago, PagoInput } from "../models/Pago";

const COLECCION = "pago";

// ─────────────────────────────────────────────────────────────
// HELPER: Snapshot → Pago
// ─────────────────────────────────────────────────────────────
function snapshotAPago(
  snapshot: DocumentSnapshot | QueryDocumentSnapshot
): Pago {
  return {
    id: snapshot.id,
    ...(snapshot.data() as Omit<Pago, "id">),
  };
}

// ─────────────────────────────────────────────────────────────
// CREATE — Registrar un nuevo pago
// ─────────────────────────────────────────────────────────────
/**
 * Crea un registro de pago en /pagos.
 *
 * `serverTimestamp()` asegura que `fechaPago` sea la hora del servidor,
 * no la del navegador del admin — importante para la consistencia del historial.
 *
 * `monto` se guarda como snapshot del valor actual — si la tarifa cambia
 * en el futuro, el historial seguirá mostrando lo que se cobró en ese momento.
 */
export async function crearPago(input: PagoInput): Promise<Pago> {
  const ref = collection(db, COLECCION);

  const docRef = await addDoc(ref, {
    ...input,
    fechaPago: serverTimestamp(),
  });

  return {
    id: docRef.id,
    ...input,
    fechaPago: Timestamp.now(), // aproximado — el servidor establece el valor real
  };
}

// ─────────────────────────────────────────────────────────────
// READ — Obtener un pago por ID
// ─────────────────────────────────────────────────────────────
export async function obtenerPagoPorId(id: string): Promise<Pago | null> {
  const docRef = doc(db, COLECCION, id);
  const snapshot = await getDoc(docRef);

  if (!snapshot.exists()) return null;
  return snapshotAPago(snapshot);
}

// ─────────────────────────────────────────────────────────────
// READ — Obtener todos los pagos (para la vista de reportes)
// ─────────────────────────────────────────────────────────────
/**
 * Devuelve todos los pagos, del más reciente al más antiguo.
 * Esta es la query principal de la pantalla de Reportes.
 */
export async function obtenerTodosLosPagos(): Promise<Pago[]> {
  const ref = collection(db, COLECCION);
  const q = query(ref, orderBy("fechaPago", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(snapshotAPago);
}

// ─────────────────────────────────────────────────────────────
// READ — Obtener pagos de un cliente específico
// ─────────────────────────────────────────────────────────────
/**
 * Devuelve el historial de pagos de un cliente, del más reciente al más antiguo.
 * Se usa en la vista de detalle del cliente.
 */
export async function obtenerPagosPorCliente(
  clienteId: string
): Promise<Pago[]> {
  const ref = collection(db, COLECCION);
  const q = query(
    ref,
    where("clienteId", "==", clienteId),
    orderBy("fechaPago", "desc")
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(snapshotAPago);
}

// ─────────────────────────────────────────────────────────────
// READ — Obtener pagos de un vehículo específico
// ─────────────────────────────────────────────────────────────
/**
 * Devuelve el historial de pagos de una placa específica.
 * Útil para auditar el historial de un alquiler en particular.
 */
export async function obtenerPagosPorPlaca(placa: string): Promise<Pago[]> {
  const ref = collection(db, COLECCION);
  const q = query(
    ref,
    where("placa", "==", placa),
    orderBy("fechaPago", "desc")
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(snapshotAPago);
}

// ─────────────────────────────────────────────────────────────
// READ — Obtener el último pago de una placa (para auditoría)
// ─────────────────────────────────────────────────────────────
/**
 * Devuelve el pago más reciente de un alquiler específico.
 *
 * NOTA: Esta función existe para auditoría o debugging. En el flujo normal
 * del dashboard NO se usa — `proximoPago` y `ultimaFechaPago` almacenados
 * en /alquileres hacen este lookup innecesario para la operación diaria.
 * Aquí se demuestra que /pagos puede reconstituir esa información si fuera necesario.
 */
export async function obtenerUltimoPagoPorPlaca(
  placa: string
): Promise<Pago | null> {
  const ref = collection(db, COLECCION);
  const q = query(
    ref,
    where("placa", "==", placa),
    orderBy("fechaPago", "desc")
  );
  const snapshot = await getDocs(q);

  if (snapshot.empty) return null;
  return snapshotAPago(snapshot.docs[0]);
}

// ─────────────────────────────────────────────────────────────
// DELETE — Solo para limpieza de datos de prueba
// ─────────────────────────────────────────────────────────────
/**
 * Elimina un pago. Usar ÚNICAMENTE para corregir duplicados accidentales
 * o limpiar datos de prueba. En producción, los registros de pagos deben
 * preservarse para auditoría.
 */
export async function eliminarPago(id: string): Promise<void> {
  const { deleteDoc } = await import("firebase/firestore");
  const docRef = doc(db, COLECCION, id);
  await deleteDoc(docRef);
}