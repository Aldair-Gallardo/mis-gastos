/**
 * HomeView.js — Pantalla de inicio: balance del mes, categorías y últimos movimientos.
 */

import { View } from './View.js';
import { esc } from '../core/dom.js';
import { icon } from '../core/icons.js';
import { money } from '../core/format.js';
import { monthHeader, movementRow, categoryIcon, progressBar, emptyState } from './partials.js';

export class HomeView extends View {
  constructor(root, handlers) {
    super(root, handlers);
    this.listen();
  }

  /**
   * @param {Object} data
   * @param {string} data.month
   * @param {boolean} data.canGoNext
   * @param {string} data.currency
   * @param {{ingresos:number, gastos:number, balance:number}} data.totals
   * @param {number} data.budget          presupuesto general (0 si no hay)
   * @param {Array} data.categories       [{category, total, pct}]
   * @param {Array} data.recent           [{movement, category}]
   * @param {string|null} data.reminder   texto del recordatorio de respaldo
   */
  render(data) {
    const { totals, currency, budget } = data;
    const used = budget ? totals.gastos / budget : 0;

    const budgetBlock = budget
      ? `<div style="display:flex;flex-direction:column;gap:8px">
           <div class="hero__progress-label"><span>Presupuesto usado</span><span>${Math.round(used * 100)}% de ${money(budget, currency)}</span></div>
           ${progressBar(used)}
         </div>`
      : `<button type="button" class="link-btn" data-action="editBudgets" style="color:var(--hero-bar);align-self:flex-start;padding:0">Definir presupuesto mensual</button>`;

    const maxCategory = data.categories[0]?.total || 1;
    const categoriesHtml = data.categories.length
      ? data.categories
          .slice(0, 5)
          .map(
            (row) => `
          <div class="cat-bar-row">
            ${categoryIcon(row.category, { small: true })}
            <div class="cat-bar-row__body">
              <div class="cat-bar-row__top"><span>${esc(row.category.nombre)}</span><span>${money(row.total, currency)}</span></div>
              <div class="cat-${esc(row.category.color)}">${progressBar(row.total / maxCategory, 'bar__fill--cat', { thin: true })}</div>
            </div>
          </div>`,
          )
          .join('')
      : emptyState('Sin gastos este mes', 'Toca + para anotar tu primer gasto.');

    const recentHtml = data.recent.length
      ? `<ul class="list">${data.recent.map(({ movement, category }) => movementRow(movement, category, currency)).join('')}</ul>`
      : emptyState('Aún no hay movimientos', 'Aquí verás tus últimos gastos e ingresos.',
          '<button type="button" class="btn btn--primary" data-action="addMovement">' + icon('plus', 18, 2.4) + 'Agregar movimiento</button>');

    const reminder = data.reminder
      ? `<div class="banner">
           ${icon('file', 22)}
           <span class="banner__text">${esc(data.reminder)}</span>
           <a class="link-btn" href="#/respaldo">Respaldar</a>
         </div>`
      : '';

    this.setHTML(`
      ${monthHeader({
        month: data.month,
        eyebrow: 'Resumen del mes',
        canGoNext: data.canGoNext,
        extra: `<a href="#/respaldo" class="icon-btn icon-btn--boxed" aria-label="Respaldo y ajustes">${icon('sliders', 20)}</a>`,
      })}

      ${reminder}

      <div class="grid-2">
        <div class="stack">
          <section class="hero" aria-label="Balance del mes">
            <div style="display:flex;flex-direction:column;gap:4px">
              <span class="hero__label">${totals.balance >= 0 ? 'Te queda este mes' : 'Gastaste de más este mes'}</span>
              <span class="hero__amount">${money(totals.balance, currency)}</span>
            </div>
            <div class="hero__tiles">
              <div class="hero__tile">
                <span class="hero__label" style="font-size:12px">Ingresos</span>
                <span class="hero__tile-value hero__tile-value--in">+${money(totals.ingresos, currency)}</span>
              </div>
              <div class="hero__tile">
                <span class="hero__label" style="font-size:12px">Gastos</span>
                <span class="hero__tile-value hero__tile-value--out">−${money(totals.gastos, currency)}</span>
              </div>
            </div>
            ${budgetBlock}
          </section>

          <section class="card" aria-labelledby="home-cat-title">
            <div class="card__header">
              <h2 class="card__title" id="home-cat-title">Por categoría</h2>
              <a class="link-btn" href="#/estadisticas">Ver todo</a>
            </div>
            <div style="display:flex;flex-direction:column;gap:12px">${categoriesHtml}</div>
          </section>
        </div>

        <section class="card" aria-labelledby="home-recent-title" style="padding-bottom:8px">
          <div class="card__header">
            <h2 class="card__title" id="home-recent-title">Últimos movimientos</h2>
            <a class="link-btn" href="#/historial">Historial</a>
          </div>
          ${recentHtml}
        </section>
      </div>
    `);
  }
}
