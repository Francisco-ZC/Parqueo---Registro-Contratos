/**
 * HOOK: usePagos
 * ==============
 * Carga el historial de pagos desde /pago y los convierte al tipo UI.
 *
 * CONVERSIÓN Timestamp → string:
 * El modelo Firestore Pago usa `fechaPago: Timestamp`.
 * El tipo UI Pago (types.ts) usa `fechaPago: string`.
 * La conversión ocurre aquí.
 *
 * `clienteNombre` ya viene guardado en el documento /pago (denormalizado
 * al crear el pago en handleConfirmarPago), así que no necesitamos
 * ninguna query extra para mostrarlo en Reportes.
 */

import { useState, useEffect, useCallback } from "react";
import { obtenerTodosLosPagos } from "../services/pagoService";
import type { Pago } from "../models/Types";

interface UsePagosResult {
  pagos: Pago[];
  loading: boolean;
  error: string | null;
  recargar: () => Promise<void>;
}

export function usePagos(): UsePagosResult {
  const [pagos, setPagos]     = useState<Pago[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const pagosFirestore = await obtenerTodosLosPagos();

      const pagosUI: Pago[] = pagosFirestore.map((p) => ({
        id:            p.id,
        clienteId:     p.clienteId,
        placa:         p.placa,
        monto:         p.monto,
        // Timestamp → string ISO
        fechaPago:     p.fechaPago.toDate().toISOString().slice(0, 10),
        registradoPor: p.registradoPor,
        // Ya viene guardado en el documento — sin query extra
        clienteNombre: p.clienteNombre,
      }));

      setPagos(pagosUI);
    } catch (err) {
      console.error("Error cargando pagos:", err);
      setError("No se pudo cargar el historial de pagos.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  return { pagos, loading, error, recargar: cargar };
}