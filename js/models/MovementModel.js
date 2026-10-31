/**
 * MovementModel.js — Modelo de movimientos (gastos e ingresos).
 *
 * Estructura de un movimiento:
 * {
 *   id:          "lq8z3k2a"        identificador único (también va al Excel)
 *   fecha:       "2026-10-31"
 *   month:       "2026-10"         se calcula a partir de la fecha
 *   tipo:        "gasto" | "ingreso"
 *   categoria:   "comida"          id de la categoría
 *   monto:       24.5              siempre positivo
 *   nota:        "Supermercado"
 *   recurrente:  true | false      si es la plantilla de un gasto mensual
 *   origen:      "lq8z3k2a"        si fue creado automáticamente por un recurrente
 *   creado:      "2026-10-31T15:00:00.000Z"
 *   actualizado: "2026-10-31T15:00:00.000Z"
 * }
 */

import { bus, EVENTS } from '../core/events.js';
import { monthOf, round2 } from '../core/format.js';

const STORE = 'movements';

export function generateId() {
  const time = Date.now().toString(36).slice(-5);
  const random = Math.random().toString(36).slice(2, 6);
  return `${time}${random}`;
}

export class MovementModel {
  constructor(db) {
    this.db = db;
  }

  /** Limpia y completa los datos antes de guardarlos */
  normalize(data) {
    const now = new Date().toISOString();
    return {
      id: data.id || generateId(),
      fecha: data.fecha,
      month: monthOf(data.fecha),
      tipo: data.tipo === 'ingreso' ? 'ingreso' : 'gasto',
      categoria: data.categoria,
      monto: Math.abs(round2(data.monto)),
      nota: String(data.nota ?? '').trim().slice(0, 140),
      recurrente: Boolean(data.recurrente),
      origen: data.origen || null,
      creado: data.creado || now,
      actualizado: now,
    };
  }

  validate(data) {
    const errors = [];
    if (!/^\d{4}-\d{2}-\d{2}$/.test(data.fecha || '')) errors.push('La fecha no es válida.');
    if (!(Number(data.monto) > 0)) errors.push('Escribe un monto mayor que cero.');
    if (!data.categoria) errors.push('Elige una categoría.');
    return errors;
  }

  getById(id) {
    return this.db.get(STORE, id);
  }

  getAll() {
    return this.db.getAll(STORE);
  }

  getByMonth(month) {
    return this.db.getAllByIndex(STORE, 'month', month);
  }

  async getByYear(year) {
    const range = IDBKeyRange.bound(`${year}-01`, `${year}-12`);
    return this.db.getAllByIndex(STORE, 'month', range);
  }

  async existingIds() {
    return new Set(await this.db.getAllKeys(STORE));
  }

  /** Meses que tienen al menos un movimiento, del más reciente al más antiguo */
  async monthsWithData() {
    const all = await this.getAll();
    return [...new Set(all.map((m) => m.month))].sort().reverse();
  }

  /** Crea o actualiza un movimiento */
  async save(data) {
    const errors = this.validate(data);
    if (errors.length) throw new Error(errors[0]);
    const movement = this.normalize(data);
    await this.db.put(STORE, movement);
    bus.emit(EVENTS.MOVEMENTS_CHANGED, { type: 'save', movement });
    return movement;
  }

  async remove(id) {
    await this.db.delete(STORE, id);
    bus.emit(EVENTS.MOVEMENTS_CHANGED, { type: 'remove', id });
  }

  /**
   * Guarda varios movimientos de golpe (importación / recurrentes).
   * Los que ya existen (mismo id) se omiten.
   */
  async addMany(list, { silent = false } = {}) {
    const existing = await this.existingIds();
    const fresh = [];
    let skipped = 0;
    for (const item of list) {
      if (existing.has(item.id)) {
        skipped += 1;
        continue;
      }
      existing.add(item.id);
      fresh.push(this.normalize(item));
    }
    if (fresh.length) await this.db.putMany(STORE, fresh);
    if (fresh.length && !silent) bus.emit(EVENTS.MOVEMENTS_CHANGED, { type: 'bulk', count: fresh.length });
    return { added: fresh.length, skipped };
  }

  async clearAll() {
    await this.db.clear(STORE);
    bus.emit(EVENTS.MOVEMENTS_CHANGED, { type: 'clear' });
  }
}
