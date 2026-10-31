/**
 * Toast.js — Mensajes cortos que aparecen abajo y se van solos.
 */

import { esc } from '../../core/dom.js';
import { icon } from '../../core/icons.js';

function getRoot() {
  let root = document.getElementById('toast-root');
  if (!root) {
    root = document.createElement('div');
    root.id = 'toast-root';
    document.body.appendChild(root);
  }
  root.className = 'toast-root';
  root.setAttribute('role', 'status');
  root.setAttribute('aria-live', 'polite');
  return root;
}

/**
 * @param {string} message
 * @param {{ type?: 'success'|'error', duration?: number }} [options]
 */
export function showToast(message, { type = 'success', duration = 3200 } = {}) {
  const root = getRoot();
  const toast = document.createElement('div');
  toast.className = `toast ${type === 'error' ? 'toast--error' : ''}`;
  toast.innerHTML = `
    <span class="toast__icon">${icon(type === 'error' ? 'alert' : 'check', 18, 2.4)}</span>
    <span>${esc(message)}</span>`;
  while (root.children.length >= 2) root.firstElementChild.remove();
  root.appendChild(toast);
  setTimeout(() => toast.remove(), duration);
}
