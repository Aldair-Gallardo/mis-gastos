/**
 * SettingsModel.js — Ajustes de la persona (tema, moneda, respaldo...).
 */

import { bus, EVENTS } from '../core/events.js';

const STORE = 'settings';

const DEFAULTS = {
  theme: 'system',          // 'system' | 'light' | 'dark'
  currency: 'USD',
  lastBackup: null,         // fecha ISO del último respaldo en Excel
  reminder: true,           // recordar respaldar cada mes
  recurrenceSkips: [],      // ids de recurrentes que la persona borró a propósito
};

export class SettingsModel {
  constructor(db) {
    this.db = db;
    this.values = { ...DEFAULTS };
  }

  async init() {
    const rows = await this.db.getAll(STORE);
    rows.forEach(({ key, value }) => {
      this.values[key] = value;
    });
    return this.values;
  }

  get(key) {
    return this.values[key];
  }

  async set(key, value) {
    this.values[key] = value;
    await this.db.put(STORE, { key, value });
    bus.emit(EVENTS.SETTINGS_CHANGED, { key, value });
  }
}
