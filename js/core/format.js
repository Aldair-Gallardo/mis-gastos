/**
 * format.js — Formato de dinero y manejo de fechas.
 * Las fechas se guardan como texto "AAAA-MM-DD" y los meses como "AAAA-MM",
 * así no hay problemas de zona horaria.
 */

const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const MONTHS_SHORT = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const WEEKDAYS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

const pad = (n) => String(n).padStart(2, '0');
const capitalize = (text) => text.charAt(0).toUpperCase() + text.slice(1);

/* ---------------- Dinero ---------------- */

const formatters = new Map();

export function money(amount, currency = 'USD', { sign = false } = {}) {
  if (!formatters.has(currency)) {
    let formatter;
    try {
      formatter = new Intl.NumberFormat('es-US', { style: 'currency', currency, minimumFractionDigits: 2, maximumFractionDigits: 2 });
    } catch {
      formatter = new Intl.NumberFormat('es-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    formatters.set(currency, formatter);
  }
  const value = Number(amount) || 0;
  const text = formatters.get(currency).format(Math.abs(value));
  if (!sign) return value < 0 ? `−${text}` : text;
  return `${value < 0 ? '−' : '+'}${text}`;
}

/** Símbolo de la moneda, por ejemplo "$" o "€" */
export function currencySymbol(currency = 'USD') {
  try {
    const parts = new Intl.NumberFormat('es-US', { style: 'currency', currency }).formatToParts(0);
    return parts.find((p) => p.type === 'currency')?.value || '$';
  } catch {
    return '$';
  }
}

/** Convierte lo que escribe la persona ("1.234,50", "24,5", "24.50") a número */
export function parseAmount(text) {
  let clean = String(text ?? '').trim().replace(/[^\d.,-]/g, '');
  if (!clean) return NaN;
  const lastComma = clean.lastIndexOf(',');
  const lastDot = clean.lastIndexOf('.');
  if (lastComma > lastDot) {
    clean = clean.replace(/\./g, '').replace(',', '.');
  } else {
    clean = clean.replace(/,/g, '');
  }
  return Math.round(parseFloat(clean) * 100) / 100;
}

/** Redondea a 2 decimales para evitar errores como 0.1 + 0.2 */
export const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;

/* ---------------- Fechas ---------------- */

export function toISODate(date = new Date()) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export const todayISO = () => toISODate(new Date());
export const currentMonth = () => todayISO().slice(0, 7);
export const monthOf = (isoDate) => String(isoDate).slice(0, 7);

/** "2026-10-31" → Date local (mediodía para evitar saltos de horario) */
export function parseISODate(iso) {
  const [y, m, d] = String(iso).split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1, 12);
}

export function daysInMonth(month) {
  const [y, m] = month.split('-').map(Number);
  return new Date(y, m, 0).getDate();
}

export function shiftMonth(month, delta) {
  const [y, m] = month.split('-').map(Number);
  const date = new Date(y, m - 1 + delta, 1);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;
}

/** Lista de meses entre dos meses, ambos incluidos */
export function monthRange(fromMonth, toMonth) {
  const months = [];
  let cursor = fromMonth;
  while (cursor <= toMonth && months.length < 600) {
    months.push(cursor);
    cursor = shiftMonth(cursor, 1);
  }
  return months;
}

/** "2026-10" → "Octubre 2026" */
export function monthLabel(month) {
  const [y, m] = month.split('-').map(Number);
  return `${capitalize(MONTHS[m - 1])} ${y}`;
}

/** "2026-10" → "Oct" */
export function monthShort(month) {
  const m = Number(month.split('-')[1]);
  return capitalize(MONTHS_SHORT[m - 1]);
}

/** "2026-10-31" → "31 oct" */
export function shortDate(iso) {
  const date = parseISODate(iso);
  return `${date.getDate()} ${MONTHS_SHORT[date.getMonth()]}`;
}

/** "Hoy", "Ayer" o "28 oct" */
export function relativeDay(iso) {
  const today = todayISO();
  if (iso === today) return 'Hoy';
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  if (iso === toISODate(yesterday)) return 'Ayer';
  return shortDate(iso);
}

/** Encabezado de grupo: "Hoy · 31 oct", "Martes · 28 oct" */
export function dayHeading(iso) {
  const rel = relativeDay(iso);
  if (rel === 'Hoy' || rel === 'Ayer') return `${rel} · ${shortDate(iso)}`;
  const date = parseISODate(iso);
  return `${capitalize(WEEKDAYS[date.getDay()])} · ${shortDate(iso)}`;
}

/** Días transcurridos desde una fecha ISO con hora */
export function daysSince(isoDateTime) {
  if (!isoDateTime) return Infinity;
  return Math.floor((Date.now() - new Date(isoDateTime).getTime()) / 86400000);
}

/** Texto amigable: "hoy", "hace 3 días" */
export function agoLabel(isoDateTime) {
  const days = daysSince(isoDateTime);
  if (days === Infinity) return 'nunca';
  if (days <= 0) return 'hoy';
  if (days === 1) return 'ayer';
  return `hace ${days} días`;
}
