/**
 * ShellView.js — El "marco" de la app: menú lateral (tablet) y barra inferior (celular).
 * El HTML del marco está en app.html; esta vista solo marca la pantalla activa
 * y avisa cuando se toca el botón de agregar.
 */

import { delegate } from '../core/dom.js';

export class ShellView {
  /**
   * @param {{ add: Function }} handlers
   */
  constructor(handlers) {
    this.links = [...document.querySelectorAll('[data-route]')];
    delegate(document.body, 'click', handlers, 'shell');
  }

  setActive(route) {
    this.links.forEach((link) => {
      if (link.dataset.route === route) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
  }
}
