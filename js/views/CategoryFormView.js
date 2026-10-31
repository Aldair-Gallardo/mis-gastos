/**
 * CategoryFormView.js — Formulario para crear una categoría nueva.
 */

import { View } from './View.js';
import { esc } from '../core/dom.js';
import { icon } from '../core/icons.js';
import { CATEGORY_COLORS, CATEGORY_ICONS } from '../config.js';

const COLOR_NAMES = {
  blue: 'Azul', orange: 'Naranja', teal: 'Turquesa', purple: 'Morado', pink: 'Rosa',
  sky: 'Celeste', amber: 'Ámbar', indigo: 'Índigo', gray: 'Gris',
};

export class CategoryFormView extends View {
  constructor(root, { tipo }, callbacks) {
    super(root, {});
    this.tipo = tipo;
    this.color = CATEGORY_COLORS[0];
    this.icono = tipo === 'ingreso' ? 'arrow-in' : 'dots';
    this.callbacks = callbacks;

    this.handlers = {
      pickColor: (e, el) => {
        this.color = el.dataset.value;
        this.render();
      },
      pickIcon: (e, el) => {
        this.icono = el.dataset.value;
        this.render();
      },
    };
    this.render();
    this.listen();
  }

  render() {
    const name = this.root.querySelector('[name="nombre"]')?.value || '';
    this.setHTML(`
      <form class="stack" novalidate data-form>
        <div style="display:flex;flex-direction:column;gap:8px">
          <label for="cat-name" class="card__title">Nombre</label>
          <input id="cat-name" name="nombre" class="text-input" maxlength="30" placeholder="${this.tipo === 'ingreso' ? 'Ej. Ventas' : 'Ej. Mascotas'}" value="${esc(name)}" autocomplete="off" required>
        </div>

        <div style="display:flex;flex-direction:column;gap:10px">
          <span class="card__title">Color</span>
          <div class="swatches" role="group" aria-label="Color">
            ${CATEGORY_COLORS.map(
              (c) => `<button type="button" class="swatch cat-${c}" aria-pressed="${c === this.color}" aria-label="${COLOR_NAMES[c]}" data-action="pickColor" data-value="${c}">${c === this.color ? icon('check', 18, 2.4) : ''}</button>`,
            ).join('')}
          </div>
        </div>

        <div style="display:flex;flex-direction:column;gap:10px">
          <span class="card__title">Ícono</span>
          <div class="swatches" role="group" aria-label="Ícono">
            ${CATEGORY_ICONS.map(
              (i) => `<button type="button" class="swatch cat-${this.color}" aria-pressed="${i === this.icono}" aria-label="${i}" data-action="pickIcon" data-value="${i}">${icon(i, 20)}</button>`,
            ).join('')}
          </div>
        </div>

        <p class="note" data-error role="alert" style="color:var(--danger);text-align:center;min-height:1em"></p>
        <button type="submit" class="btn btn--primary btn--block">Crear categoría</button>
      </form>`);

    this.root.querySelector('[data-form]').addEventListener('submit', (event) => {
      event.preventDefault();
      this.callbacks.submit({
        nombre: this.root.querySelector('[name="nombre"]').value,
        tipo: this.tipo,
        color: this.color,
        icono: this.icono,
      });
    });
  }

  showError(message) {
    this.root.querySelector('[data-error]').textContent = message;
  }
}
