/**
 * Controller.js — Clase base de los controladores de pantalla.
 *
 * Un controlador:
 *  1. pide datos a los modelos,
 *  2. los prepara (con ayuda de los servicios),
 *  3. se los entrega a su vista para dibujarlos,
 *  4. responde a lo que la persona hace en la vista.
 */

import { bus } from '../core/events.js';

export class Controller {
  /**
   * @param {Object} ctx  contexto compartido: { models, services, state, router, ... }
   */
  constructor(ctx) {
    this.ctx = ctx;
    this.view = null;
    this.subscriptions = [];
    this.renderToken = 0;
  }

  /** Vuelve a dibujar cuando ocurra alguno de estos eventos */
  refreshOn(...events) {
    events.forEach((event) => {
      this.subscriptions.push(bus.on(event, () => this.refresh()));
    });
  }

  /**
   * Evita que una respuesta lenta pise a una más reciente.
   * Uso: const token = this.nextToken(); ... if (this.isStale(token)) return;
   */
  nextToken() {
    this.renderToken += 1;
    return this.renderToken;
  }

  isStale(token) {
    return token !== this.renderToken || !this.view;
  }

  async mount(container) {
    throw new Error('mount() debe implementarse');
  }

  async refresh() {}

  unmount() {
    this.subscriptions.forEach((off) => off());
    this.subscriptions = [];
    this.view?.destroy();
    this.view = null;
  }
}
