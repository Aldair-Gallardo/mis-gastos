/**
 * BackupView.js — Respaldo en Excel y ajustes (tema, moneda, recordatorio).
 */

import { View } from './View.js';
import { esc } from '../core/dom.js';
import { icon } from '../core/icons.js';
import { monthLabel, agoLabel } from '../core/format.js';
import { fileNameForMonth } from '../services/ExcelService.js';
import { CURRENCIES, APP_VERSION } from '../config.js';

const THEMES = [
  { id: 'system', label: 'Automático' },
  { id: 'light', label: 'Claro' },
  { id: 'dark', label: 'Noche' },
];

export class BackupView extends View {
  constructor(root, handlers) {
    super(root, handlers);
    this.listen();
    this.listen('change', 'change');
  }

  /**
   * @param {Object} data
   * @param {Array<{month, count, current}>} data.months
   * @param {string|null} data.lastBackup
   * @param {boolean} data.reminder
   * @param {string} data.theme
   * @param {string} data.currency
   * @param {boolean} data.standalone
   */
  render(data) {
    const backedUp = Boolean(data.lastBackup);
    const preselected = data.months.slice(0, 2).map((m) => m.month);

    const monthsHtml = data.months.length
      ? data.months
          .map(
            (m) => `
        <label class="check-row">
          <input type="checkbox" name="months" value="${esc(m.month)}" ${preselected.includes(m.month) ? 'checked' : ''} data-change="toggleMonth">
          <span class="row__main">
            <span class="row__title">${monthLabel(m.month)}${m.current ? ' <span class="note">· en curso</span>' : ''}</span>
            <span class="row__meta">${fileNameForMonth(m.month)} · ${m.count} ${m.count === 1 ? 'movimiento' : 'movimientos'}</span>
          </span>
        </label>`,
          )
          .join('')
      : '<p class="note">Todavía no hay movimientos para exportar.</p>';

    this.setHTML(`
      <header class="page-header">
        <div>
          <span class="page-header__eyebrow">Tus datos</span>
          <h1 class="page-title">Respaldo y ajustes</h1>
        </div>
      </header>

      <section class="card" aria-label="Estado del respaldo">
        <div style="display:flex;align-items:center;gap:12px">
          <span class="cat-icon ${backedUp ? 'cat-sky' : 'cat-orange'}">${icon(backedUp ? 'check' : 'alert', 20, 2.2)}</span>
          <div class="row__main">
            <span class="row__title">${backedUp ? `Último respaldo ${agoLabel(data.lastBackup)}` : 'Aún no has hecho un respaldo'}</span>
            <span class="row__meta">Tus datos viven solo en este dispositivo. Guarda tus Excel en la nube.</span>
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:12px;padding-top:12px;border-top:1px solid var(--border)">
          <span id="bk-rem" style="flex:1;font-size:14px;font-weight:600">Recordarme respaldar cada mes</span>
          <button type="button" class="switch" role="switch" aria-checked="${data.reminder}" aria-labelledby="bk-rem" data-action="toggleReminder"></button>
        </div>
      </section>

      <div class="grid-2">
        <section class="card" aria-labelledby="bk-exp">
          <h2 class="card__title" id="bk-exp">Exportar a Excel</h2>
          <p class="note">Se crea un archivo por mes.</p>
          <form data-export-form>${monthsHtml}</form>
          <button type="button" class="btn btn--primary btn--block" data-action="export" data-export-btn ${data.months.length ? '' : 'disabled'}>
            ${icon('upload', 20, 2)}<span data-export-label>${this.exportLabel(Math.min(2, data.months.length))}</span>
          </button>
          <p class="note" style="text-align:center">Después elige <strong>Guardar en Archivos</strong> → iCloud Drive o Google Drive.</p>
        </section>

        <div class="stack">
          <section class="card" aria-labelledby="bk-imp">
            <h2 class="card__title" id="bk-imp">Importar desde Excel</h2>
            <button type="button" class="btn btn--outline btn--block" data-action="pickFiles">${icon('download', 20, 2)}Elegir archivos .xlsx</button>
            <input type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" multiple hidden data-change="importFiles" data-file-input>
            <p class="note">Puedes elegir varios meses a la vez. Los movimientos repetidos se omiten automáticamente.</p>
            <table class="mini-table" aria-label="Formato del archivo">
              <thead><tr><th>ID</th><th>Fecha</th><th>Tipo</th><th>Categoría</th><th>Monto</th><th>Nota</th></tr></thead>
              <tbody>
                <tr><td>a7f2</td><td>31/10/2026</td><td>Gasto</td><td>Comida</td><td>24.50</td><td>Súper</td></tr>
              </tbody>
            </table>
          </section>

          <section class="card" aria-labelledby="bk-set">
            <h2 class="card__title" id="bk-set">Ajustes</h2>
            <div style="display:flex;flex-direction:column;gap:8px">
              <span class="page-header__eyebrow">Apariencia</span>
              <div class="segmented" role="radiogroup" aria-label="Apariencia">
                ${THEMES.map(
                  (t) => `<button type="button" class="segmented__btn" role="radio" aria-checked="${data.theme === t.id}" data-action="setTheme" data-value="${t.id}">${t.label}</button>`,
                ).join('')}
              </div>
            </div>
            <div class="field-group">
              <label class="field">
                <span class="field__label" style="flex:1">Moneda</span>
                <select class="field__select" data-change="currency">
                  ${CURRENCIES.map((c) => `<option value="${c.code}" ${c.code === data.currency ? 'selected' : ''}>${esc(c.label)}</option>`).join('')}
                </select>
              </label>
            </div>
            ${
              data.standalone
                ? ''
                : `<a class="btn btn--secondary btn--block" href="index.html#instalar">${icon('download', 18, 2)}Instalar en este dispositivo</a>`
            }
            <button type="button" class="btn btn--danger btn--block" data-action="wipe">${icon('trash', 18)}Borrar todos los datos</button>
            <p class="note" style="text-align:center">Mis Gastos · versión ${APP_VERSION}</p>
          </section>
        </div>
      </div>
    `);
  }

  exportLabel(count) {
    if (!count) return 'Elige al menos un mes';
    return count === 1 ? 'Exportar 1 archivo' : `Exportar ${count} archivos`;
  }

  selectedMonths() {
    return [...this.root.querySelectorAll('[data-export-form] input[name="months"]:checked')].map((i) => i.value);
  }

  updateExportButton() {
    const count = this.selectedMonths().length;
    this.root.querySelector('[data-export-label]').textContent = this.exportLabel(count);
    this.root.querySelector('[data-export-btn]').disabled = count === 0;
  }

  setBusy(selector, busy, text) {
    const button = this.root.querySelector(selector);
    if (!button) return;
    button.disabled = busy;
    if (text) button.dataset.originalHtml ??= button.innerHTML;
    if (busy && text) button.textContent = text;
    if (!busy && button.dataset.originalHtml) {
      button.innerHTML = button.dataset.originalHtml;
      delete button.dataset.originalHtml;
    }
  }

  openFilePicker() {
    const input = this.root.querySelector('[data-file-input]');
    input.value = '';
    input.click();
  }
}
