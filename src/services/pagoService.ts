/**
 * SERVICIO: pagoService
 * =====================
 * Operaciones de Firestore para la colección /pago.
 *
 * CAMBIO RESPECTO A LA VERSIÓN ANTERIOR:
 * `PagoInput` ahora incluye `clienteNombre`, que se guarda en el documento
 * para que la vista de Reportes pueda mostrar el nombre sin queries adicionales.
 *
 * COLECCIÓN: /pago/{autoId}
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

function snapshotAPago(
  snapshot: DocumentSnapshot | QueryDocumentSnapshot
): Pago {
  return {
    id: snapshot.id,
    ...(snapshot.data() as Omit<Pago, "id">),
  };
}

// ─── CREATE ───────────────────────────────────────────────────
/**
 * Registra un nuevo pago. Guarda `clienteNombre` para evitar joins en reportes.
 * `fechaPago` la pone el servidor con serverTimestamp() — no el cliente.
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
    fechaPago: Timestamp.now(), // aproximado para la respuesta inmediata
  };
}

// ─── READ: uno por ID ─────────────────────────────────────────
export async function obtenerPagoPorId(id: string): Promise<Pago | null> {
  const docRef = doc(db, COLECCION, id);
  const snapshot = await getDoc(docRef);
  if (!snapshot.exists()) return null;
  return snapshotAPago(snapshot);
}

// ─── READ: todos (para Reportes) ──────────────────────────────
export async function obtenerTodosLosPagos(): Promise<Pago[]> {
  const ref = collection(db, COLECCION);
  const q = query(ref, orderBy("fechaPago", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(snapshotAPago);
}

// ─── READ: por cliente ────────────────────────────────────────
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

// ─── READ: por placa ──────────────────────────────────────────
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

// ─── READ: último pago de una placa (auditoría) ───────────────
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

// ─── DELETE (solo datos de prueba / corrección) ───────────────
export async function eliminarPago(id: string): Promise<void> {
  const docRef = doc(db, COLECCION, id);
  const { deleteDoc } = await import("firebase/firestore");
  await deleteDoc(docRef);
}