/**
 * SERVICIO: clienteService
 * ========================
 * Todas las operaciones de Firestore relacionadas con la colección /clientes.
 *
 * COLECCIÓN: /clientes/{clienteId}
 *
 * Este es el único archivo del proyecto que debe importar funciones de Firestore
 * para operaciones sobre clientes. Los componentes de React llaman a estas
 * funciones — nunca hablan con Firestore directamente.
 */

import {
  collection,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  query,
  orderBy,
  DocumentSnapshot,
  QueryDocumentSnapshot,
} from "firebase/firestore";
import { db } from "./firebase";
import type { Cliente, ClienteInput } from "../models/Cliente";

// Nombre de la colección — constante para evitar errores de tipeo.
const COLECCION = "cliente";

// ─────────────────────────────────────────────────────────────
// HELPER: Convierte un snapshot de Firestore → objeto Cliente
// ─────────────────────────────────────────────────────────────
/**
 * `snapshot.data()` devuelve los campos del documento.
 * `snapshot.id` devuelve el ID del documento.
 * Los combinamos en un objeto Cliente tipado.
 */
function snapshotACliente(
  snapshot: DocumentSnapshot | QueryDocumentSnapshot
): Cliente {
  return {
    id: snapshot.id,
    ...(snapshot.data() as Omit<Cliente, "id">),
  };
}

// ─────────────────────────────────────────────────────────────
// CREATE — Crear un nuevo cliente
// ─────────────────────────────────────────────────────────────
/**
 * Agrega un cliente nuevo a Firestore.
 *
 * `addDoc` genera automáticamente un ID único para el documento.
 * `serverTimestamp()` le pide al servidor de Firestore que registre
 * la hora exacta — más confiable que usar el reloj del navegador.
 */
export async function crearCliente(input: ClienteInput): Promise<Cliente> {
  const ref = collection(db, COLECCION);

  const docRef = await addDoc(ref, {
    ...input,
    creadoEn: serverTimestamp(),
  });

  return {
    id: docRef.id,
    ...input,
    createdAt: null as unknown as Cliente["createdAt"], // el servidor lo establece
  };
}

// ─────────────────────────────────────────────────────────────
// READ — Obtener un cliente por ID
// ─────────────────────────────────────────────────────────────
/**
 * Busca un documento específico en /clientes/{id}.
 * Devuelve null si no existe — el componente decide cómo manejarlo.
 */
export async function obtenerClientePorId(id: string): Promise<Cliente | null> {
  const docRef = doc(db, COLECCION, id);
  const snapshot = await getDoc(docRef);

  if (!snapshot.exists()) return null;
  return snapshotACliente(snapshot);
}

// ─────────────────────────────────────────────────────────────
// READ — Obtener todos los clientes
// ─────────────────────────────────────────────────────────────
/**
 * Devuelve todos los clientes ordenados por nombre de forma ascendente.
 *
 * `query()` + `orderBy()` le indica a Firestore que ordene los resultados
 * en el servidor antes de enviárnoslos — más eficiente que ordenar en JS.
 */
export async function obtenerTodosLosClientes(): Promise<Cliente[]> {
  const ref = collection(db, COLECCION);
  const q = query(ref, orderBy("nombre", "asc"));
  const snapshot = await getDocs(q);

  return snapshot.docs.map(snapshotACliente);
}

// ─────────────────────────────────────────────────────────────
// UPDATE — Actualizar campos de un cliente
// ─────────────────────────────────────────────────────────────
/**
 * Actualiza uno o varios campos de un cliente existente.
 *
 * `Partial<ClienteInput>` significa "cualquier subconjunto de los campos".
 * Por ejemplo: actualizarCliente("abc", { telefono: "8888-8888" })
 * solo modifica el teléfono — los demás campos no se tocan.
 *
 * `updateDoc` hace una actualización parcial (merge), NO reemplaza el documento.
 */
export async function actualizarCliente(
  id: string,
  cambios: Partial<ClienteInput>
): Promise<void> {
  const docRef = doc(db, COLECCION, id);
  await updateDoc(docRef, cambios);
}

// ─────────────────────────────────────────────────────────────
// DELETE — Eliminar un cliente
// ─────────────────────────────────────────────────────────────
/**
 * Elimina permanentemente un cliente de Firestore.
 *
 * IMPORTANTE: esto NO elimina automáticamente sus alquileres ni pagos.
 * La UI debe verificar que el cliente no tenga alquileres activos antes de
 * permitir la eliminación, o bien eliminarlos en cascada en un paso previo.
 */
export async function eliminarCliente(id: string): Promise<void> {
  const docRef = doc(db, COLECCION, id);
  await deleteDoc(docRef);
}