/**
 * HOOK: useClientes
 * =================
 * Carga todos los clientes desde /cliente y sus alquileres desde /alquiler,
 * los combina en un array Cliente[] listo para la UI, y expone recargar().
 *
 * POR QUÉ NO HAY useAlquileres SEPARADO:
 * Los alquileres siempre se muestran pegados a su cliente en la UI.
 * Este hook los une internamente — el resto de la app nunca necesita
 * manejar alquileres sueltos (eso lo hace el servicio directamente).
 *
 * CONVERSIÓN Timestamp → string:
 * Los modelos de Firestore usan Timestamp. Los tipos de UI (types.ts)
 * usan string ISO 'YYYY-MM-DD'. La conversión ocurre aquí, en el límite
 * entre Firestore y la UI, para que ningún componente tenga que importar
 * Timestamp de firebase/firestore.
 */

import { useState, useEffect, useCallback } from "react";
import { obtenerTodosLosClientes } from "../services/clienteService";
import { obtenerAlquileresPorCliente } from "../services/alquilerService";
import type { Cliente } from "../models/Types";

interface UseClientesResult {
  clientes: Cliente[];
  loading: boolean;
  error: string | null;
  recargar: () => Promise<void>;
}

export function useClientes(): UseClientesResult {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // 1. Traer todos los clientes de /cliente, ordenados por nombre
      const clientesFirestore = await obtenerTodosLosClientes();

      // 2. Por cada cliente, traer sus alquileres en paralelo.
      //    Promise.all lanza todas las queries al mismo tiempo — si tenés
      //    20 clientes, hace 20 queries simultáneas en lugar de secuenciales.
      const clientesConAlquileres: Cliente[] = await Promise.all(
        clientesFirestore.map(async (c) => {
          const alquileresFirestore = await obtenerAlquileresPorCliente(c.id);

          // Convertir cada Alquiler (Timestamp) → Alquiler UI (string ISO)
          const alquileresUI = alquileresFirestore.map((a) => ({
            placa:           a.placa,
            clienteId:       a.clienteId,
            tipoVehiculo:    a.tipoVehiculo,
            tipoContrato:    a.tipoContrato,
            periodo:         a.periodo,
            monto:           a.monto,
            // .toDate() convierte Timestamp a Date de JS,
            // .toISOString().slice(0,10) lo convierte a 'YYYY-MM-DD'
            proximoPago:     a.proximoPago.toDate().toISOString().slice(0, 10),
            ultimaFechaPago: a.ultimaFechaPago.toDate().toISOString().slice(0, 10),
            estado:          a.estado,
          }));

          // Construir el Cliente UI combinado.
          // createdAt puede ser null justo después de crearCliente() porque
          // serverTimestamp() no resuelve de inmediato en el cliente.
          // El operador ?. y el fallback a todayISO() protegen contra ese caso.
          return {
            id:        c.id,
            nombre:    c.nombre,
            cedula:    c.cedula   ?? null,
            telefono:  c.telefono ?? null,
            correo:    c.correo   ?? null,
            createdAt: c.createdAt
              ? c.createdAt.toDate().toISOString().slice(0, 10)
              : new Date().toISOString().slice(0, 10), // fallback si es null
            alquileres: alquileresUI,
          } satisfies Cliente;
        })
      );

      setClientes(clientesConAlquileres);
    } catch (err) {
      console.error("Error cargando clientes:", err);
      setError("No se pudieron cargar los clientes. Verificá tu conexión.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  return { clientes, loading, error, recargar: cargar };
}