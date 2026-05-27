/**
 * UTILIDADES DE FECHAS
 * ====================
 * Funciones puras para cálculos y formato de fechas.
 * No dependen de React ni de Firestore — fáciles de testear.
 */

import type { PeriodoCobro } from '../models/Types';

/**
 * Calcula cuántos días faltan (o pasaron) desde hoy hasta una fecha dada.
 * Devuelve negativo si la fecha ya pasó.
 * Ejemplo: daysUntil('2025-06-01') === 5  (si hoy es 27 mayo)
 */
export function daysUntil(dateStr: string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const d = new Date(dateStr);
  d.setHours(0, 0, 0, 0);
  return Math.round((d.getTime() - now.getTime()) / 86_400_000);
}

/**
 * Agrega el periodo de cobro a una fecha y devuelve la nueva fecha como string ISO.
 * Ejemplo: addPeriod('2025-05-01', 'mensual') === '2025-06-01'
 *
 * Usa setMonth() para meses para manejar correctamente fin de mes y años bisiestos.
 */
export function addPeriod(dateStr: string, periodo: PeriodoCobro): string {
  const d = new Date(dateStr);
  switch (periodo) {
    case 'semanal':          d.setDate(d.getDate() + 7);         break;
    case 'quincenal':        d.setDate(d.getDate() + 14);        break;
    case 'mensual':          d.setMonth(d.getMonth() + 1);       break;
    // case 'cuatrimestral':    d.setMonth(d.getMonth() + 4);       break;
  }
  return d.toISOString().slice(0, 10);
}

/**
 * Cuántos días tiene un periodo en total.
 * Se usa para calcular el porcentaje de tiempo transcurrido (regla del 40%).
 */
export function diasDePeriodo(periodo: PeriodoCobro): number {
  const map: Record<PeriodoCobro, number> = {
    semanal: 7,
    quincenal: 14,
    mensual: 30,
    // cuatrimestral: 120,
  };
  return map[periodo];
}

/**
 * Determina el estado visual de una fila según qué tan cerca está el vencimiento.
 * - 'danger': fecha ya pasó (días <= 0)
 * - 'warn':   queda menos del 40% del periodo
 * - 'ok':     sin urgencia
 */
export function calcRowStatus(
  proximoPago: string,
  periodo: PeriodoCobro
): 'ok' | 'warn' | 'danger' {
  const dias  = daysUntil(proximoPago);
  const total = diasDePeriodo(periodo);
  if (dias <= 0) return 'danger';
  if (dias / total <= 0.4) return 'warn';
  return 'ok';
}

/** Devuelve hoy como string ISO 'YYYY-MM-DD' */
export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}