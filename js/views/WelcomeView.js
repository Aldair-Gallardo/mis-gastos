/**
 * WelcomeView.js — Pantalla "Su aplicación fue instalada con éxito".
 * Se muestra la primera vez que se abre la app desde el ícono de inicio.
 */

import { icon } from '../core/icons.js';
import { APP_NAME } from '../config.js';

export class WelcomeView {
  /**
   * @param {{ start: Function, importExcel: Function }} handlers
   */
  constructor(handlers) {
    this.handlers = handlers;
    this.el = null;
  }

  show() {
    this.el = document.createElement('div');
    this.el.className = 'welcome';
    this.el.setAttribute('role', 'dialog');
    this.el.setAttribute('aria-modal', 'true');
    this.el.setAttribute('aria-labelledby', 'welcome-title');
    this.el.innerHTML = `
      <div class="welcome__body">
        <div class="welcome__badge" aria-hidden="true">
          <span class="welcome__ring welcome__ring--outer"></span>
          <span class="welcome__ring welcome__ring--inner"></span>
          <span class="welcome__check">${icon('check', 44, 2.6)}</span>
        </div>
        <div style="display:flex;flex-direction:column;gap:12px">
          <h1 class="welcome__title" id="welcome-title">Su aplicación fue instalada con éxito</h1>
          <p class="welcome__text">Ya puede abrir ${APP_NAME} desde su pantalla de inicio, incluso sin conexión.</p>
        </div>
      </div>
      <div class="welcome__actions">
        <button type="button" class="btn btn--primary btn--block" data-start>Empezar</button>
        <button type="button" class="btn btn--secondary btn--block" data-import>${icon('download', 18, 2)}Importar mis Excel anteriores</button>
      </div>`;

    this.el.querySelector('[data-start]').addEventListener('click', () => {
      this.hide();
      this.handlers.start();
    });
    this.el.querySelector('[data-import]').addEventListener('click', () => {
      this.hide();
      this.handlers.importExcel();
    });

    document.body.appendChild(this.el);
    this.el.querySelector('[data-start]').focus();
  }

  hide() {
    this.el?.remove();
    this.el = null;
  }
}
