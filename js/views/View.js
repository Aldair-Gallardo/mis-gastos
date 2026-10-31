/**
 * View.js — Clase base de las vistas.
 * Una vista solo dibuja HTML y avisa al controlador cuando la persona hace algo.
 * No guarda datos ni hace cálculos.
 */

import { delegate } from '../core/dom.js';

export class View {
  /**
   * @param {HTMLElement} root  contenedor donde se dibuja
   * @param {Object<string, Function>} handlers  acciones que entrega el controlador
   */
  constructor(root, handlers = {}) {
    this.root = root;
    this.handlers = handlers;
    this.cleanups = [];
  }

  /**
   * Conecta el HTML con los handlers del controlador.
   *   listen()                  → clics en [data-action]
   *   listen('input', 'input')  → escritura en [data-input]
   *   listen('change', 'change')→ cambios en [data-change]
   */
  listen(eventName = 'click', attribute = 'action') {
    this.cleanups.push(delegate(this.root, eventName, this.handlers, attribute));
  }

  setHTML(html) {
    this.root.innerHTML = html;
  }

  destroy() {
    this.cleanups.forEach((fn) => fn());
    this.cleanups = [];
  }
}
