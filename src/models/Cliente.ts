/**
 * MODELO: Cliente
 * ===============
 * Define la "forma" de un cliente en Firestore.
 *
 * COLECCIÓN: /clientes/{clienteId}
 *
 * `id` is the Firestore auto-generated document ID.
 * It is optional in ClienteInput because Firestore assigns it at creation time.
 */

import { Timestamp } from "firebase/firestore";

export interface Cliente {
  id: string;           // ID del documento en Firestore (auto-generado)
  nombre: string;       // Nombre completo — requerido
  cedula?: string;      // Cédula de identidad — opcional
  telefono?: string;    // Teléfono — opcional
  correo?: string;      // Correo electrónico — opcional
  createdAt: Timestamp;  // Fecha de registro del cliente
}

/**
 * ClienteInput: fields the user fills in when creating a new client.
 * We omit `id` (assigned by Firestore) and `createdAt` (set by the server).
 */
export type ClienteInput = Omit<Cliente, "id" | "createdAt">;