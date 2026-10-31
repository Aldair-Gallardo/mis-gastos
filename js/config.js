/**
 * config.js — Valores fijos de la aplicación.
 * Cambia aquí el nombre, las categorías iniciales o las monedas.
 */

export const APP_NAME = 'Mis Gastos';
export const APP_VERSION = '1.0.0';

/** Nombre de la base de datos local (IndexedDB) */
export const DB_NAME = 'mis-gastos';
export const DB_VERSION = 1;

/** Días sin respaldo antes de mostrar el recordatorio */
export const BACKUP_REMINDER_DAYS = 30;

/** Colores disponibles para categorías (ver .cat-* en css/base.css) */
export const CATEGORY_COLORS = ['blue', 'orange', 'teal', 'purple', 'pink', 'sky', 'amber', 'indigo', 'gray'];

/** Íconos disponibles para categorías (ver js/core/icons.js) */
export const CATEGORY_ICONS = [
  'home', 'cart', 'car', 'bolt', 'play', 'heart', 'bag', 'book',
  'plane', 'paw', 'gift', 'phone', 'briefcase', 'arrow-in', 'star', 'dots',
];

/** Categorías que se crean la primera vez que se abre la app */
export const DEFAULT_CATEGORIES = [
  { id: 'casa', nombre: 'Casa', tipo: 'gasto', color: 'blue', icono: 'home' },
  { id: 'comida', nombre: 'Comida', tipo: 'gasto', color: 'orange', icono: 'cart' },
  { id: 'transporte', nombre: 'Transporte', tipo: 'gasto', color: 'teal', icono: 'car' },
  { id: 'servicios', nombre: 'Servicios', tipo: 'gasto', color: 'purple', icono: 'bolt' },
  { id: 'ocio', nombre: 'Ocio', tipo: 'gasto', color: 'pink', icono: 'play' },
  { id: 'salud', nombre: 'Salud', tipo: 'gasto', color: 'sky', icono: 'heart' },
  { id: 'compras', nombre: 'Compras', tipo: 'gasto', color: 'amber', icono: 'bag' },
  { id: 'otros', nombre: 'Otros', tipo: 'gasto', color: 'gray', icono: 'dots' },
  { id: 'salario', nombre: 'Salario', tipo: 'ingreso', color: 'indigo', icono: 'briefcase' },
  { id: 'extras', nombre: 'Extras', tipo: 'ingreso', color: 'teal', icono: 'star' },
  { id: 'otros-ingresos', nombre: 'Otros ingresos', tipo: 'ingreso', color: 'gray', icono: 'arrow-in' },
];

/** Monedas que se pueden elegir en Ajustes */
export const CURRENCIES = [
  { code: 'USD', label: 'Dólar (USD)' },
  { code: 'PAB', label: 'Balboa (PAB)' },
  { code: 'EUR', label: 'Euro (EUR)' },
  { code: 'MXN', label: 'Peso mexicano (MXN)' },
  { code: 'COP', label: 'Peso colombiano (COP)' },
  { code: 'CRC', label: 'Colón (CRC)' },
  { code: 'GTQ', label: 'Quetzal (GTQ)' },
  { code: 'PEN', label: 'Sol (PEN)' },
  { code: 'CLP', label: 'Peso chileno (CLP)' },
  { code: 'ARS', label: 'Peso argentino (ARS)' },
  { code: 'DOP', label: 'Peso dominicano (DOP)' },
];
