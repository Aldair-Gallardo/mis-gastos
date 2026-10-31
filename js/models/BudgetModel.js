/**
 * BudgetModel.js — Presupuestos mensuales.
 * Hay un presupuesto general (TOTAL) y uno opcional por categoría de gasto.
 * Se aplican igual a todos los meses.
 *
 * { categoryId: "comida", monto: 350 }
 */

import { bus, EVENTS } from '../core/events.js';
import { round2 } from '../core/format.js';

const STORE = 'budgets';
export const TOTAL_BUDGET = '__total';

export class BudgetModel {
  constructor(db) {
    this.db = db;
    this.cache = new Map();
  }

  async init() {
    const rows = await this.db.getAll(STORE);
    this.cache = new Map(rows.map((r) => [r.categoryId, r.monto]));
  }

  get(categoryId) {
    return this.cache.get(categoryId) || 0;
  }

  get total() {
    return this.get(TOTAL_BUDGET);
  }

  /** Presupuestos por categoría (sin el general) */
  entries() {
    return [...this.cache.entries()].filter(([id]) => id !== TOTAL_BUDGET);
  }

  /** Guarda varios presupuestos; 0 o vacío elimina el presupuesto */
  async saveAll(values) {
    for (const [categoryId, raw] of Object.entries(values)) {
      const monto = round2(raw);
      if (monto > 0) {
        await this.db.put(STORE, { categoryId, monto });
        this.cache.set(categoryId, monto);
      } else if (this.cache.has(categoryId)) {
        await this.db.delete(STORE, categoryId);
        this.cache.delete(categoryId);
      }
    }
    bus.emit(EVENTS.BUDGETS_CHANGED);
  }
}
