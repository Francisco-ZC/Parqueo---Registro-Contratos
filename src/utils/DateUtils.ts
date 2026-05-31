/**
 * UTILIDADES DE FECHAS — versión centralizada
 * =============================================
 * ÚNICA fuente de verdad para cálculo de fechas en toda la app.
 * Importar SOLO desde aquí — nunca calcular fechas inline en componentes.
 *
 *
 * SEMANAL: siempre +7 días calendario. Simple, no cambia.
 *
 * QUINCENAL: dividir el mes en dos mitades fijas.
 *   - Primera mitad: días 1–15 → siguiente quincena es día 16 del mismo mes
 *     o día 1 del mes siguiente si estamos en la segunda mitad
 *   - Segunda mitad: días 16–fin → siguiente quincena es día 1 del mes siguiente
 *   Esto garantiza exactamente dos quincenas por mes, sin importar cuántos días tenga.
 *
 * MENSUAL: mismo día del mes siguiente, con manejo especial de fin de mes.
 *   - Si el día de pago es el último día del mes (ej: 31 en mayo, 28 en febrero),
 *     se guarda internamente como día 31 (convenio "fin de mes") y siempre cae
 *     en el último día del mes siguiente.
 *   - Si el día es 29 o 30 y el mes siguiente no los tiene, igual cae en el último.
 *   - Cualquier otro día (ej: 15) siempre cae en el 15 del mes siguiente.
 *
 * CÓMO USAR:
 *   import { calcularProximaFechaUI, calcularProximaFechaTimestamp } from '../utils/dateUtils';
 *
 *   // Para mostrar en la UI (preview en formularios):
 *   const preview = calcularProximaFechaUI('2025-05-31', 'mensual'); // '2025-06-30'
 *
 *   // Para guardar en Firestore (al confirmar pago):
 *   const ts = calcularProximaFechaTimestamp(alquiler.proximoPago, alquiler.periodo);
 */

import type { PeriodoCobro } from '../models/Types';
import { Timestamp }         from 'firebase/firestore';

// ─────────────────────────────────────────────────────────────
// HELPERS INTERNOS
// ─────────────────────────────────────────────────────────────

/** Devuelve el último día del mes para un año y mes dados (0-indexed). */
function ultimoDiaDelMes(año: number, mes: number): number {
  // new Date(año, mes+1, 0) da el día 0 del mes siguiente = último día del mes actual
  return new Date(año, mes + 1, 0).getDate();
}

/**
 * Determina si una fecha cae en el "fin de mes" de su mes.
 * Consideramos "fin de mes" si el día ES el último día del mes.
 * Ejemplo: 31 mayo → true, 30 abril → true (abril tiene 30), 30 mayo → false
 */
function esFindeMes(fecha: Date): boolean {
  return fecha.getDate() === ultimoDiaDelMes(fecha.getFullYear(), fecha.getMonth());
}

// ─────────────────────────────────────────────────────────────
// LÓGICA CENTRAL — calcular siguiente fecha
// ─────────────────────────────────────────────────────────────

/**
 * Dado un Date base y un periodo, devuelve el siguiente Date de pago.
 *
 * Esta es la función CORE — todo lo demás la envuelve para convertir
 * entre string ISO, Timestamp y Date.
 */
function siguienteFecha(base: Date, periodo: PeriodoCobro): Date {
  const año  = base.getFullYear();
  const mes  = base.getMonth(); // 0-indexed
  const dia  = base.getDate();

  switch (periodo) {

    case 'semanal': {
      // Simple: +7 días calendario, sin lógica especial
      const r = new Date(base);
      r.setDate(dia + 7);
      return r;
    }

    case 'quincenal': {
      /**
       * Dividimos cada mes en dos quincenas fijas:
       * Quincena 1: días 1–15   → siguiente pago: día 16 del mismo mes
       * Quincena 2: días 16–fin → siguiente pago: día 1 del mes siguiente
       *
       * Esto garantiza exactamente 2 cobros por mes, siempre en las
       * mismas "mitades" del mes, sin importar días entre fechas exactas.
       */
      if (dia <= 15) {
        // Estamos en la primera quincena → siguiente es el 16 de este mes
        return new Date(año, mes, 16);
      } else {
        // Estamos en la segunda quincena → siguiente es el 1 del mes siguiente
        return new Date(año, mes + 1, 1);
      }
    }

    case 'mensual': {
      /**
       * Regla de fin de mes:
       * Si hoy es el último día del mes (ej: 31 mayo, 30 abril, 28 feb en año no bisiesto),
       * el próximo pago también debe caer en el último día del mes siguiente.
       *
       * Para cualquier otro día, simplemente mantenemos el mismo día número.
       * Si ese día no existe en el mes siguiente (ej: 31 en junio que tiene 30),
       * igual caemos en el último día disponible.
       */
      const mesSiguiente  = mes + 1; // JS maneja el overflow: mes 12 → enero del año siguiente
      const maxDiaSig     = ultimoDiaDelMes(año, mesSiguiente);

      let diaDestino: number;
      if (esFindeMes(base)) {
        // Fin de mes → siempre cae en el último día del mes siguiente
        diaDestino = maxDiaSig;
      } else {
        // Día específico → mismo día, ajustado si el mes no lo tiene
        diaDestino = Math.min(dia, maxDiaSig);
      }

      return new Date(año, mesSiguiente, diaDestino);
    }

    default:
      // Fallback seguro — no debería llegar aquí con TypeScript estricto
      const r = new Date(base);
      r.setMonth(r.getMonth() + 1);
      return r;
  }
}

// ─────────────────────────────────────────────────────────────
// API PÚBLICA — tres variantes para los tres contextos de uso
// ─────────────────────────────────────────────────────────────

/**
 * Para la UI: recibe y devuelve string 'YYYY-MM-DD'.
 *
 * Usado en:
 * - Preview "El próximo pago será el..." en NuevoClienteModal y AgregarAlquilerModal
 * - Cualquier componente que calcule fechas para mostrar, sin guardar
 *
 * IMPORTANTE: parseamos con T00:00:00 para evitar desfases de zona horaria.
 * Sin esto, '2025-05-31' se parsea como UTC medianoche, que en UTC-6 es
 * el 30 de mayo a las 18:00 → getDate() devuelve 30 en lugar de 31.
 */
export function calcularProximaFechaUI(
  fechaBase: string,
  periodo: PeriodoCobro
): string {
  const base      = new Date(fechaBase + 'T00:00:00');
  const siguiente = siguienteFecha(base, periodo);
  return siguiente.toISOString().slice(0, 10);
}

/**
 * Para Firestore: recibe Timestamp (el que está guardado en /alquiler),
 * devuelve el nuevo Timestamp para guardar como proximoPago.
 *
 * Usado en:
 * - alquilerService.ts → confirmarPagoYAvanzar()
 * - alquilerService.ts → calcularProximoPago() (helper interno del servicio)
 */
export function calcularProximaFechaTimestamp(
  base: Timestamp,
  periodo: PeriodoCobro
): Timestamp {
  const fecha     = base.toDate();
  const siguiente = siguienteFecha(fecha, periodo);
  return Timestamp.fromDate(siguiente);
}

/**
 * Para convertir una fecha ISO de formulario a Timestamp para Firestore.
 * Usado al crear alquileres (fechaPrimerPago viene como string del input date).
 */
export function isoATimestamp(fechaISO: string): Timestamp {
  return Timestamp.fromDate(new Date(fechaISO + 'T00:00:00'));
}

// ─────────────────────────────────────────────────────────────
// UTILIDADES DISPLAY — sin lógica de negocio
// ─────────────────────────────────────────────────────────────

/** Cuántos días faltan (negativo = venció hace N días) */
export function daysUntil(dateStr: string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const d = new Date(dateStr + 'T00:00:00');
  d.setHours(0, 0, 0, 0);
  return Math.round((d.getTime() - now.getTime()) / 86_400_000);
}

/** Días totales del periodo — para calcular el % de urgencia en el dashboard */
export function diasDePeriodo(periodo: PeriodoCobro): number {
  const map: Record<PeriodoCobro, number> = {
    semanal:   7,
    quincenal: 15,
    mensual:   30,
  };
  return map[periodo];
}

/** Estado visual de la fila (ok / warn / danger) */
export function calcRowStatus(
  proximoPago: string,
  periodo: PeriodoCobro
): 'ok' | 'warn' | 'danger' {
  const dias  = daysUntil(proximoPago);
  const total = diasDePeriodo(periodo);
  if (dias <= 0)              return 'danger';
  if (dias / total <= 0.4)   return 'warn';
  return 'ok';
}

/** Hoy como string ISO 'YYYY-MM-DD' en hora local */
export function todayISO(): string {
  const d = new Date();
  // Construimos manualmente para usar hora local, no UTC
  const y  = d.getFullYear();
  const m  = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}