/**
 * MovementFormView.js — Formulario para agregar o editar un gasto/ingreso.
 * Se dibuja dentro de una hoja (Sheet). Guarda solo el estado visual
 * (tipo y categoría elegidos); el guardado real lo hace el controlador.
 */

import { View } from './View.js';
import { esc } from '../core/dom.js';
import { icon } from '../core/icons.js';

export class MovementFormView extends View {
  /**
   * @param {HTMLElement} root
   * @param {Object} options
   * @param {Array} options.categories  todas las categorías
   * @param {string} options.symbol     símbolo de moneda
   * @param {Object|null} options.movement  movimiento a editar (null = nuevo)
   * @param {Object} handlers  { submit(values), remove(), newCategory(tipo) }
   */
  constructor(root, { categories, symbol, movement, today }, handlers) {
    super(root, {});
    this.categories = categories;
    this.symbol = symbol;
    this.movement = movement;
    this.today = today;
    this.callbacks = handlers;

    this.tipo = movement?.tipo || 'gasto';
    this.categoria = movement?.categoria || null;
    this.recurrente = Boolean(movement?.recurrente);

    this.handlers = {
      setType: (e, el) => this.setType(el.dataset.value),
      pickCategory: (e, el) => {
        this.categoria = el.dataset.id;
        this.renderCategories();
      },
      newCategory: () => this.callbacks.newCategory(this.tipo),
      toggleRecurring: (e, el) => {
        this.recurrente = !this.recurrente;
        el.setAttribute('aria-checked', String(this.recurrente));
      },
      remove: () => this.callbacks.remove(),
    };

    this.render();
    this.listen();
  }

  render() {
    const m = this.movement;
    const isCopy = Boolean(m?.origen);
    const amount = m ? String(m.monto.toFixed(2)) : '';

    this.setHTML(`
      <form class="stack" novalidate data-form>
        <div class="segmented" role="radiogroup" aria-label="Tipo de movimiento" data-type-group>
          ${['gasto', 'ingreso']
            .map(
              (t) => `<button type="button" class="segmented__btn" role="radio" aria-checked="${this.tipo === t}" data-action="setType" data-value="${t}">${t === 'gasto' ? 'Gasto' : 'Ingreso'}</button>`,
            )
            .join('')}
        </div>

        <div class="amount-input">
          <label for="mv-amount" class="page-header__eyebrow">Monto</label>
          <div class="amount-input__row">
            <span class="amount-input__currency">${esc(this.symbol)}</span>
            <input id="mv-amount" name="monto" class="amount-input__field" inputmode="decimal" autocomplete="off" placeholder="0.00" value="${esc(amount)}" ${m ? '' : 'autofocus'} required>
          </div>
        </div>

        <fieldset style="border:0;margin:0;padding:0;display:flex;flex-direction:column;gap:10px">
          <legend class="card__title" style="padding:0;margin-bottom:10px">Categoría</legend>
          <div class="cat-grid" data-categories></div>
        </fieldset>

        <div class="field-group">
          <label class="field">
            <span class="field__icon">${icon('calendar', 20)}</span>
            <span class="field__label">Fecha</span>
            <input class="field__input" type="date" name="fecha" value="${esc(m?.fecha || this.today)}" required>
          </label>
          <label class="field">
            <span class="field__icon">${icon('pencil', 20)}</span>
            <span class="field__label">Nota</span>
            <input class="field__input" type="text" name="nota" maxlength="140" placeholder="Opcional" value="${esc(m?.nota || '')}" autocomplete="off">
          </label>
          ${
            isCopy
              ? `<div class="field"><span class="field__icon">${icon('repeat', 20)}</span><span class="note">Copia automática de un movimiento mensual.</span></div>`
              : `<div class="field">
                   <span class="field__icon">${icon('repeat', 20)}</span>
                   <span class="field__label" id="mv-rep" style="flex:1">Repetir cada mes</span>
                   <button type="button" class="switch" role="switch" aria-checked="${this.recurrente}" aria-labelledby="mv-rep" data-action="toggleRecurring"></button>
                 </div>`
          }
        </div>

        <p class="note" data-error role="alert" style="color:var(--danger);text-align:center;min-height:1em"></p>

        <div class="sheet__footer">
          <button type="submit" class="btn btn--primary btn--block">${icon('check', 20, 2.2)}${m ? 'Guardar cambios' : this.tipo === 'gasto' ? 'Guardar gasto' : 'Guardar ingreso'}</button>
          ${m ? `<button type="button" class="btn btn--danger btn--block" data-action="remove">${icon('trash', 18)}Eliminar</button>` : ''}
        </div>
      </form>
    `);

    this.form = this.root.querySelector('[data-form]');
    this.form.addEventListener('submit', (event) => {
      event.preventDefault();
      this.callbacks.submit(this.values());
    });
    this.renderCategories();
  }

  renderCategories() {
    const list = this.categories.filter((c) => c.tipo === this.tipo);
    if (!list.some((c) => c.id === this.categoria)) this.categoria = null;

    this.root.querySelector('[data-categories]').innerHTML =
      list
        .map(
          (c) => `
        <button type="button" class="cat-tile" aria-pressed="${c.id === this.categoria}" data-action="pickCategory" data-id="${esc(c.id)}">
          <span class="cat-icon cat-icon--sm cat-${esc(c.color)}">${icon(c.icono, 18)}</span>
          ${esc(c.nombre)}
        </button>`,
        )
        .join('') +
      `<button type="button" class="cat-tile cat-tile--new" data-action="newCategory">${icon('plus', 20, 2)}Nueva</button>`;
  }

  setType(tipo) {
    if (tipo === this.tipo) return;
    this.tipo = tipo;
    this.root.querySelectorAll('[data-type-group] [role="radio"]').forEach((btn) => {
      btn.setAttribute('aria-checked', String(btn.dataset.value === tipo));
    });
    const submit = this.root.querySelector('[type="submit"]');
    if (!this.movement) submit.lastChild.textContent = tipo === 'gasto' ? 'Guardar gasto' : 'Guardar ingreso';
    this.renderCategories();
  }

  /** Se llama cuando el controlador crea una categoría nueva */
  addCategory(category) {
    this.categories = [...this.categories, category];
    this.categoria = category.id;
    this.renderCategories();
  }

  showError(message) {
    this.root.querySelector('[data-error]').textContent = message;
  }

  values() {
    const data = new FormData(this.form);
    return {
      tipo: this.tipo,
      categoria: this.categoria,
      montoTexto: data.get('monto'),
      fecha: data.get('fecha'),
      nota: data.get('nota'),
      recurrente: this.recurrente,
    };
  }
}
