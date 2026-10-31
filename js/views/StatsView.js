/**
 * StatsView.js — Estadísticas: gráfica por categoría, barras y presupuestos.
 */

import { View } from './View.js';
import { esc } from '../core/dom.js';
import { icon } from '../core/icons.js';
import { money } from '../core/format.js';
import { donutChart, barChart, progressBar, emptyState } from './partials.js';

const STATUS_BADGE = {
  warn: '<span class="badge badge--warn">Casi al límite</span>',
  over: '<span class="badge badge--over">Excedido</span>',
};

const STATUS_BAR = { ok: '', warn: 'bar__fill--warn', over: 'bar__fill--over', none: '' };

export class StatsView extends View {
  constructor(root, handlers) {
    super(root, handlers);
    this.listen();
  }

  render(data) {
    const { currency } = data;

    const donut = data.categories.length
      ? `<div class="donut-wrap">
           ${donutChart(data.categories, { label: 'Gastado', value: money(data.totals.gastos, currency) })}
           <ul class="legend">
             ${data.categories
               .map(
                 (row) => `
               <li class="cat-${esc(row.category.color)}">
                 <span class="dot"></span>
                 <span class="legend__name">${esc(row.category.nombre)}</span>
                 <span>${Math.round(row.pct * 100)}%</span>
               </li>`,
               )
               .join('')}
           </ul>
         </div>`
      : emptyState('Sin gastos en este periodo', 'Cuando anotes gastos verás aquí a dónde va tu dinero.');

    const budgetRow = (name, spent, limit, status, color) => `
      <div style="display:flex;flex-direction:column;gap:7px">
        <div class="cat-bar-row__top">
          <span style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">${esc(name)} ${STATUS_BADGE[status.level] || ''}</span>
          <span>${money(spent, currency)} <span style="color:var(--muted);font-weight:500">/ ${money(limit, currency)}</span></span>
        </div>
        <div class="${color ? `cat-${esc(color)}` : ''}">${progressBar(status.pct, STATUS_BAR[status.level])}</div>
      </div>`;

    const budgets = data.budgets.length || data.totalBudget
      ? [
          data.totalBudget ? budgetRow('General', data.totalBudget.spent, data.totalBudget.limit, data.totalBudget.status) : '',
          ...data.budgets.map((b) => budgetRow(b.category.nombre, b.spent, b.limit, b.status)),
        ].join('')
      : `<p class="note">Pon un límite mensual por categoría y la app te avisará cuando te acerques.</p>`;

    this.setHTML(`
      <header class="page-header">
        <div>
          <span class="page-header__eyebrow">Estadísticas</span>
          <div class="month-nav">
            <button type="button" class="icon-btn" data-action="prev" aria-label="Periodo anterior" style="margin-left:-12px">${icon('chevron-left', 20, 2)}</button>
            <h1 class="page-title">${esc(data.label)}</h1>
            <button type="button" class="icon-btn" data-action="next" aria-label="Periodo siguiente" ${data.canGoNext ? '' : 'disabled'}>${icon('chevron-right', 20, 2)}</button>
          </div>
        </div>
      </header>

      <div class="segmented" role="radiogroup" aria-label="Periodo">
        <button type="button" class="segmented__btn" role="radio" aria-checked="${data.period === 'month'}" data-action="setPeriod" data-value="month">Mes</button>
        <button type="button" class="segmented__btn" role="radio" aria-checked="${data.period === 'year'}" data-action="setPeriod" data-value="year">Año</button>
      </div>

      <div class="grid-2">
        <div class="stack">
          <section class="card" aria-labelledby="st-cat">
            <div class="card__header">
              <h2 class="card__title" id="st-cat">Gastos por categoría</h2>
              <span class="card__hint">Ingresos ${money(data.totals.ingresos, currency)}</span>
            </div>
            ${donut}
          </section>

          <section class="card" aria-labelledby="st-bars">
            <div class="card__header">
              <h2 class="card__title" id="st-bars">${data.period === 'month' ? 'Gasto por semana' : 'Gasto por mes'}</h2>
              <span class="card__hint">Promedio ${money(data.average, currency)}</span>
            </div>
            ${barChart(data.bars, currency, { compact: data.period === 'year' })}
          </section>
        </div>

        <section class="card" aria-labelledby="st-bud">
          <div class="card__header">
            <h2 class="card__title" id="st-bud">${esc(data.budgetTitle)}</h2>
            <button type="button" class="link-btn" data-action="editBudgets">Editar</button>
          </div>
          <div style="display:flex;flex-direction:column;gap:16px">${budgets}</div>
        </section>
      </div>
    `);
  }
}
