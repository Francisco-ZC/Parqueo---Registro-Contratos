/**
 * SERVICIO: alquilerService — fechas centralizadas
 * =================================================
 * CAMBIO: calcularProximoPago() ahora importa la lógica de
 * calcularProximaFechaTimestamp() de dateUtils en lugar de
 * tener su propia implementación. Una sola fuente de verdad.
 *
 * COLECCIÓN: /alquiler/{placa}
 */

import {
  collection, doc, setDoc, getDoc, getDocs,
  updateDoc, deleteDoc, query, where, orderBy, DocumentSnapshot, QueryDocumentSnapshot,
} from 'firebase/firestore';
import { db } from './firebase';
import type { Alquiler, AlquilerInput, EstadoAlquiler } from '../models/Alquiler';
import { calcularProximaFechaTimestamp} from '../utils/DateUtils';

const COLECCION = 'alquiler';

function snapshotAAlquiler(s: DocumentSnapshot | QueryDocumentSnapshot): Alquiler {
  return { placa: s.id, ...(s.data() as Omit<Alquiler, 'placa'>) };
}

// ─── CREATE ───────────────────────────────────────────────────
export async function crearAlquiler(input: AlquilerInput): Promise<Alquiler> {
  const { placa, fechaPrimerPago, ...resto } = input;

  const datos: Omit<Alquiler, 'placa'> = {
    ...resto,
    proximoPago:     fechaPrimerPago,
    ultimaFechaPago: fechaPrimerPago,
    estado:          'activo',
  };

  await setDoc(doc(db, COLECCION, placa), datos);
  return { placa, ...datos };
}

// ─── READ: uno ────────────────────────────────────────────────
export async function obtenerAlquilerPorPlaca(placa: string): Promise<Alquiler | null> {
  const snapshot = await getDoc(doc(db, COLECCION, placa));
  if (!snapshot.exists()) return null;
  return snapshotAAlquiler(snapshot);
}

// ─── READ: por cliente ────────────────────────────────────────
export async function obtenerAlquileresPorCliente(clienteId: string): Promise<Alquiler[]> {
  const q = query(collection(db, COLECCION), where('clienteId', '==', clienteId));
  const snapshot = await getDocs(q);
  return snapshot.docs
    .map(snapshotAAlquiler)
    .sort((a, b) => a.proximoPago.toMillis() - b.proximoPago.toMillis());
}

// ─── READ: activos (dashboard) ────────────────────────────────
export async function obtenerAlquileresActivos(): Promise<Alquiler[]> {
  const q = query(
    collection(db, COLECCION),
    where('estado', '==', 'activo'),
    orderBy('proximoPago', 'asc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(snapshotAAlquiler);
}

// ─── UPDATE ───────────────────────────────────────────────────
export async function actualizarAlquiler(
  placa: string,
  cambios: Partial<Omit<Alquiler, 'placa' | 'clienteId'>>
): Promise<void> {
  await updateDoc(doc(db, COLECCION, placa), cambios);
}

// ─── CONFIRMAR PAGO → avanzar fecha ──────────────────────────
/**
 * Usa calcularProximaFechaTimestamp() de dateUtils — misma función
 * que usan los formularios para el preview. Garantiza que lo que
 * se muestra en "próximo pago será el..." coincide con lo que se guarda.
 */
export async function confirmarPagoYAvanzar(placa: string): Promise<void> {
  const alquiler = await obtenerAlquilerPorPlaca(placa);
  if (!alquiler) throw new Error(`Alquiler ${placa} no encontrado.`);

  // La fecha base para calcular la siguiente es el proximoPago actual
  // (la fecha que está venciendo), no la fecha de hoy.
  const nuevaFecha = calcularProximaFechaTimestamp(
    alquiler.proximoPago,
    alquiler.periodo
  );

  await updateDoc(doc(db, COLECCION, placa), {
    ultimaFechaPago: alquiler.proximoPago, // archivamos la fecha que se pagó
    proximoPago:     nuevaFecha,           // avanzamos a la siguiente
  });
}

// ─── SUSPENDER / REACTIVAR ────────────────────────────────────
export async function cambiarEstadoAlquiler(
  placa: string,
  estado: EstadoAlquiler
): Promise<void> {
  await updateDoc(doc(db, COLECCION, placa), { estado });
}

// ─── DELETE ───────────────────────────────────────────────────
export async function eliminarAlquiler(placa: string): Promise<void> {
  await deleteDoc(doc(db, COLECCION, placa));
}