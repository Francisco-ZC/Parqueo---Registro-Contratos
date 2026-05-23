/**
 * UTILIDADES DE FORMATO
 * =====================
 * Funciones para formatear números, monedas y fechas para mostrar en la UI.
 */

import type { PeriodoCobro, TipoVehiculo, TipoContrato } from '../models/Types';

/** Formatea un número como moneda costarricense: ₡30,000 */
export function formatMonto(monto: number): string {
  return '₡' + monto.toLocaleString('es-CR');
}

/** Formatea una fecha ISO como '01 jun. 2025' */
export function formatFecha(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('es-CR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

/** Devuelve el label en español para cada periodo */
export function labelPeriodo(periodo: PeriodoCobro): string {
  const map: Record<PeriodoCobro, string> = {
    semanal:        'Semanal',
    quincenal:      'Quincenal',
    mensual:        'Mensual',
    // cuatrimestral:  'Cuatrimestral',
  };
  return map[periodo] ?? periodo;
}

/** Devuelve el label del tipo de vehículo */
export function labelVehiculo(tipo: TipoVehiculo): string {
  const map: Record<TipoVehiculo, string> = {
    liviano: 'Liviano',
    moto:    'Moto',
    pesado:  'Pesado',
  };
  return map[tipo] ?? tipo;
}

/** Devuelve el label del tipo de contrato */
export function labelContrato(contrato: TipoContrato): string {
  const map: Record<TipoContrato, string> = {
    diurno:   '☀ Diurno',
    nocturno: '🌙 Nocturno',
    ambos:    '☀🌙 Ambos',
  };
  return map[contrato] ?? contrato;
}

/**
 * Tarifas base por tipo de vehículo y periodo.
 * Si el contrato es 'ambos', la tarifa se duplica.
 */
const TARIFAS: Record<TipoVehiculo, Record<PeriodoCobro, number>> = {
  liviano: { mensual: 30_000, quincenal: 15_000, semanal: 7_500},//  cuatrimestral: 110_000 },
  moto:    { mensual: 15_000, quincenal:  7_500, semanal: 4_000},//  cuatrimestral:  55_000 },
  pesado:  { mensual: 30_000, quincenal: 15_000, semanal: 7_500},// cuatrimestral: 165_000 },
};

export function calcTarifa(
  tipo: TipoVehiculo,
  periodo: PeriodoCobro,
  contrato: TipoContrato
): number {
  const base = TARIFAS[tipo]?.[periodo] ?? 0;
  return contrato === 'ambos' ? base * 2 : base;
}

/** Iniciales de un nombre para el avatar (máx. 2) */
export function getInitials(nombre: string): string {
  return nombre
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? '')
    .join('');
}