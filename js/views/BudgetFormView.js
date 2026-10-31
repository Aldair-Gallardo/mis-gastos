/**
 * BudgetFormView.js — Editar el presupuesto general y por categoría.
 */

import { View } from './View.js';
import { esc } from '../core/dom.js';
import { icon } from '../core/icons.js';

export class BudgetFormView extends View {
  /**
   * @param {Object} data
   * @param {string} data.symbol
   * @param {number} data.total
   * @param {Array<{category, value}>} data.rows
   */
  constructor(root, data, callbacks) {
    super(root, {});
    this.callbacks = callbacks;
    this.render(data);
  }

  render({ symbol, total, rows }) {
    const input = (id, value) =>
      `<input class="field__input" name="${esc(id)}" inputmode="decimal" placeholder="Sin límite" value="${value ? value.toFixed(2) : ''}" autocomplete="off" style="max-width:130px">`;

    this.setHTML(`
      <form class="stack" novalidate data-form>
        <p class="note">Los presupuestos se aplican a todos los meses. Deja vacío para no poner límite. Montos en ${esc(symbol)}.</p>
        <div class="field-group">
          <label class="field">
            <span class="field__icon">${icon('chart', 20)}</span>
            <span class="field__label" style="flex:1">Presupuesto general</span>
            ${input('__total', total)}
          </label>
        </div>
        <div class="field-group">
          ${rows
            .map(
              ({ category, value }) => `
            <label class="field">
              <span class="cat-icon cat-icon--sm cat-${esc(category.color)}">${icon(category.icono, 16)}</span>
              <span class="field__label" style="flex:1">${esc(category.nombre)}</span>
              ${input(category.id, value)}
            </label>`,
            )
            .join('')}
        </div>
        <button type="submit" class="btn btn--primary btn--block">Guardar presupuestos</button>
      </form>`);

    const form = this.root.querySelector('[data-form]');
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      this.callbacks.submit(Object.fromEntries(new FormData(form)));
    });
  }
}
