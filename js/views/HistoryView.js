/**
 * HistoryView.js — Historial con buscador, filtros y grupos por día.
 * El buscador se dibuja una sola vez (para no perder el foco al escribir);
 * solo se vuelven a dibujar los filtros y los resultados.
 */

import { View } from './View.js';
import { esc } from '../core/dom.js';
import { icon } from '../core/icons.js';
import { money, dayHeading } from '../core/format.js';
import { monthHeader, movementRow, emptyState } from './partials.js';

const FILTERS = [
  { id: 'all', label: 'Todo' },
  { id: 'gasto', label: 'Gastos' },
  { id: 'ingreso', label: 'Ingresos' },
  { id: 'recurring', label: 'Mensuales' },
];

export class HistoryView extends View {
  constructor(root, handlers) {
    super(root, handlers);
    this.setHTML(`
      <div data-header></div>
      <label class="search">
        <span style="color:var(--muted);display:flex">${icon('search', 20)}</span>
        <span class="sr-only">Buscar movimientos</span>
        <input type="search" placeholder="Buscar por nota o categoría" autocomplete="off" data-input="search" enterkeyhint="search">
      </label>
      <div class="chips" role="group" aria-label="Filtros" data-filters></div>
      <div class="stack" data-results aria-live="polite"></div>
    `);
    this.listen();
    this.listen('input', 'input');
  }

  renderHeader({ month, canGoNext, searching }) {
    this.root.querySelector('[data-header]').innerHTML = searching
      ? `<header class="page-header"><div><span class="page-header__eyebrow">Historial</span><h1 class="page-title">Todos los meses</h1></div></header>`
      : monthHeader({ month, eyebrow: 'Historial', canGoNext });
  }

  renderFilters({ filter, categories }) {
    const chips = [
      ...FILTERS.map((f) => ({ ...f })),
      ...categories.map((c) => ({ id: `cat:${c.id}`, label: c.nombre })),
    ];
    this.root.querySelector('[data-filters]').innerHTML = chips
      .map(
        (chip) => `<button type="button" class="chip" aria-pressed="${chip.id === filter}" data-action="filter" data-value="${esc(chip.id)}">${esc(chip.label)}</button>`,
      )
      .join('');
  }

  /**
   * @param {Object} data
   * @param {Array} data.groups   [{fecha, neto, items:[{movement, category}]}]
   * @param {string} data.currency
   * @param {boolean} data.searching
   */
  renderResults({ groups, currency, searching }) {
    const results = this.root.querySelector('[data-results]');
    if (!groups.length) {
      results.innerHTML = `<div class="card">${
        searching
          ? emptyState('Sin resultados', 'Prueba con otra palabra o quita los filtros.')
          : emptyState('No hay movimientos', 'Este mes aún no tiene movimientos con este filtro.')
      }</div>`;
      return;
    }

    results.innerHTML = groups
      .map(
        (group) => `
      <section class="day-group" aria-label="${esc(dayHeading(group.fecha))}">
        <div class="day-group__header">
          <h2 style="font-size:13px;font-weight:700;margin:0">${esc(dayHeading(group.fecha))}${searching ? ` · ${group.fecha.slice(0, 4)}` : ''}</h2>
          <span style="${group.neto > 0 ? 'color:var(--income)' : ''}">${money(group.neto, currency, { sign: true })}</span>
        </div>
        <div class="day-group__body">
          <ul class="list">
            ${group.items.map(({ movement, category }) => movementRow(movement, category, currency, { showDate: false })).join('')}
          </ul>
        </div>
      </section>`,
      )
      .join('');
  }
}
