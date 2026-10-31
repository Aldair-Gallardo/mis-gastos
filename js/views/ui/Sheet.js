/**
 * Sheet.js — Hoja inferior (en celular) o ventana centrada (en tablet).
 * Se usa para el formulario de movimientos, presupuestos, confirmaciones, etc.
 */

import { esc } from '../../core/dom.js';
import { icon } from '../../core/icons.js';

let sheetCount = 0;

/**
 * @param {Object} options
 * @param {string} options.title
 * @param {string} options.body      HTML del contenido
 * @param {string} [options.footer]  HTML de los botones inferiores
 * @param {(root: HTMLElement, close: Function) => void} [options.onMount]
 * @param {Function} [options.onClose]
 * @returns {{ root: HTMLElement, close: Function }}
 */
export function openSheet({ title, body, footer = '', onMount, onClose }) {
  const id = `sheet-title-${++sheetCount}`;
  const previousFocus = document.activeElement;

  const backdrop = document.createElement('div');
  backdrop.className = 'sheet-backdrop';
  backdrop.innerHTML = `
    <div class="sheet" role="dialog" aria-modal="true" aria-labelledby="${id}">
      <div class="sheet__grabber" aria-hidden="true"></div>
      <div class="sheet__header">
        <button type="button" class="icon-btn icon-btn--boxed" data-sheet-close aria-label="Cerrar">${icon('x', 18, 2)}</button>
        <h2 class="sheet__title" id="${id}">${esc(title)}</h2>
        <span style="width:44px" aria-hidden="true"></span>
      </div>
      <div class="sheet__body">${body}</div>
      ${footer ? `<div class="sheet__footer">${footer}</div>` : ''}
    </div>`;

  const sheet = backdrop.querySelector('.sheet');
  let closed = false;

  const close = () => {
    if (closed) return;
    closed = true;
    document.removeEventListener('keydown', onKey);
    backdrop.remove();
    if (!document.querySelector('.sheet-backdrop')) document.body.style.overflow = '';
    previousFocus?.focus?.();
    onClose?.();
  };

  const onKey = (event) => {
    if (event.key === 'Escape' && backdrop === [...document.querySelectorAll('.sheet-backdrop')].pop()) close();
  };

  backdrop.addEventListener('click', (event) => {
    if (event.target === backdrop || event.target.closest('[data-sheet-close]')) close();
  });
  document.addEventListener('keydown', onKey);

  document.body.appendChild(backdrop);
  document.body.style.overflow = 'hidden';
  onMount?.(sheet, close);

  // Enfoca el primer campo útil (sin abrir el teclado en celulares táctiles)
  const autofocus = sheet.querySelector('[autofocus]') || sheet.querySelector('[data-sheet-close]');
  autofocus?.focus({ preventScroll: true });

  return { root: sheet, close };
}

/**
 * Pregunta de confirmación. Devuelve true si la persona acepta.
 */
export function confirmSheet({ title, message, confirmLabel = 'Aceptar', danger = false }) {
  return new Promise((resolve) => {
    let answer = false;
    openSheet({
      title,
      body: `<p class="welcome__text" style="text-align:center">${esc(message)}</p>`,
      footer: `
        <button type="button" class="btn ${danger ? 'btn--danger' : 'btn--primary'} btn--block" data-confirm>${esc(confirmLabel)}</button>
        <button type="button" class="btn btn--secondary btn--block" data-sheet-close>Cancelar</button>`,
      onMount: (root, close) => {
        root.querySelector('[data-confirm]').addEventListener('click', () => {
          answer = true;
          close();
        });
      },
      onClose: () => resolve(answer),
    });
  });
}
