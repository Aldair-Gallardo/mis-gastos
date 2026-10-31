/**
 * state.js — Estado compartido de la interfaz (no se guarda en la base de datos).
 * Por ahora: el mes que se está viendo.
 */

import { bus, EVENTS } from './events.js';
import { currentMonth, shiftMonth } from './format.js';

class AppState {
  constructor() {
    this.month = currentMonth();
  }

  setMonth(month) {
    if (month === this.month) return;
    this.month = month;
    bus.emit(EVENTS.MONTH_CHANGED, month);
  }

  shiftMonth(delta) {
    this.setMonth(shiftMonth(this.month, delta));
  }

  /** No dejamos avanzar a meses futuros */
  get isCurrentMonth() {
    return this.month >= currentMonth();
  }
}

export const state = new AppState();
