/**
 * partials.js — Trozos de HTML que se repiten en varias pantallas.
 */

import { esc } from '../core/dom.js';
import { icon } from '../core/icons.js';
import { money, monthLabel, relativeDay, currencySymbol } from '../core/format.js';

/** Ícono redondeado con el color de la categoría */
export function categoryIcon(category, { small = false } = {}) {
  return `<span class="cat-icon ${small ? 'cat-icon--sm' : ''} cat-${esc(category.color)}">${icon(category.icono, 18)}</span>`;
}

/** Encabezado con el mes y flechas para cambiar */
export function monthHeader({ month, eyebrow, canGoNext, extra = '' }) {
  return `
    <header class="page-header">
      <div>
        <span class="page-header__eyebrow">${esc(eyebrow)}</span>
        <div class="month-nav">
          <button type="button" class="icon-btn" data-action="prevMonth" aria-label="Mes anterior" style="margin-left:-12px">${icon('chevron-left', 20, 2)}</button>
          <h1 class="page-title">${monthLabel(month)}</h1>
          <button type="button" class="icon-btn" data-action="nextMonth" aria-label="Mes siguiente" ${canGoNext ? '' : 'disabled'}>${icon('chevron-right', 20, 2)}</button>
        </div>
      </div>
      ${extra}
    </header>`;
}

/** Fila de un movimiento (se puede tocar para editar) */
export function movementRow(movement, category, currency, { showDate = true } = {}) {
  const isIncome = movement.tipo === 'ingreso';
  const title = movement.nota || category.nombre;
  const meta = [category.nombre];
  if (showDate) meta.push(relativeDay(movement.fecha));
  const repeat = movement.recurrente || movement.origen
    ? `<span class="badge">${icon('repeat', 11, 2.4)}Mensual</span>`
    : '';

  return `
    <li>
      <button type="button" class="row" data-action="editMovement" data-id="${esc(movement.id)}" aria-label="Editar ${esc(title)}, ${money(movement.monto, currency)}">
        ${categoryIcon(category)}
        <span class="row__main">
          <span class="row__title">${esc(title)}</span>
          <span class="row__meta">${esc(meta.join(' · '))} ${repeat}</span>
        </span>
        <span class="row__amount ${isIncome ? 'row__amount--in' : ''}">${isIncome ? '+' : '−'}${money(movement.monto, currency)}</span>
      </button>
    </li>`;
}

export function emptyState(title, text, actionHtml = '') {
  return `
    <div class="empty">
      <span class="empty__title">${esc(title)}</span>
      <span>${esc(text)}</span>
      ${actionHtml}
    </div>`;
}

/** Barra de progreso; pct entre 0 y 1 */
export function progressBar(pct, modifier = '', { thin = false } = {}) {
  const width = Math.max(0, Math.min(100, pct * 100));
  return `<div class="bar ${thin ? 'bar--thin' : ''}"><div class="bar__fill ${modifier}" style="width:${width.toFixed(1)}%"></div></div>`;
}

/** Gráfica de dona en SVG */
export function donutChart(rows, { label, value }) {
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const gap = rows.length > 1 ? 2 : 0;
  let offset = 0;
  const segments = rows
    .map((row) => {
      const length = Math.max(0, row.pct * circumference - gap);
      const segment = `<circle class="cat-${esc(row.category.color)}" cx="75" cy="75" r="${radius}" fill="none" stroke="var(--c-fg)" stroke-width="18" stroke-dasharray="${length.toFixed(2)} ${(circumference - length).toFixed(2)}" stroke-dashoffset="${(-offset).toFixed(2)}"/>`;
      offset += row.pct * circumference;
      return segment;
    })
    .join('');

  const description = rows.map((r) => `${r.category.nombre} ${Math.round(r.pct * 100)}%`).join(', ');

  return `
    <div class="donut">
      <svg width="150" height="150" viewBox="0 0 150 150" role="img" aria-label="Gráfica por categoría: ${esc(description)}">
        <circle cx="75" cy="75" r="${radius}" fill="none" stroke="var(--surface-2)" stroke-width="18"/>
        ${segments}
      </svg>
      <div class="donut__center">
        <span class="donut__center-label">${esc(label)}</span>
        <span class="donut__center-value">${esc(value)}</span>
      </div>
    </div>`;
}

/** Gráfica de barras (semanas o meses) */
export function barChart(items, currency, { compact = false } = {}) {
  const max = Math.max(...items.map((i) => i.total), 0);
  const symbol = currencySymbol(currency);
  const description = items.map((i) => `${i.label}: ${money(i.total, currency)}`).join(', ');
  const short = (n) => {
    if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k`;
    return String(Math.round(n));
  };

  return `
    <div class="bars" role="img" aria-label="${esc(description)}">
      ${items
        .map((item) => {
          const height = max ? Math.max(3, (item.total / max) * 100) : 3;
          const peak = max > 0 && item.total === max;
          return `
          <div class="bars__col ${peak ? 'bars__col--peak' : ''}">
            <span class="bars__value">${compact ? short(item.total) : `${symbol}${short(item.total)}`}</span>
            <div class="bars__bar" style="height:${height.toFixed(1)}px"></div>
            <span class="bars__label">${esc(item.label)}</span>
          </div>`;
        })
        .join('')}
    </div>`;
}
