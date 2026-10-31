/**
 * events.js — Bus de eventos sencillo.
 * Los modelos avisan cambios con emit() y los controladores escuchan con on().
 */

export class EventBus {
  constructor() {
    this.listeners = new Map();
  }

  /** Escucha un evento. Devuelve una función para dejar de escuchar. */
  on(event, callback) {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event).add(callback);
    return () => this.off(event, callback);
  }

  off(event, callback) {
    this.listeners.get(event)?.delete(callback);
  }

  emit(event, payload) {
    this.listeners.get(event)?.forEach((callback) => {
      try {
        callback(payload);
      } catch (error) {
        console.error(`Error en el evento "${event}":`, error);
      }
    });
  }
}

/** Instancia única compartida por toda la app */
export const bus = new EventBus();

/** Nombres de eventos, para no escribirlos a mano en varios lugares */
export const EVENTS = {
  MOVEMENTS_CHANGED: 'movements:changed',
  CATEGORIES_CHANGED: 'categories:changed',
  BUDGETS_CHANGED: 'budgets:changed',
  SETTINGS_CHANGED: 'settings:changed',
  MONTH_CHANGED: 'month:changed',
};
