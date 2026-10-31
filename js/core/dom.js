/**
 * dom.js — Utilidades pequeñas para trabajar con el HTML.
 */

/** Escapa texto del usuario antes de ponerlo dentro de HTML (evita inyecciones). */
export function esc(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export const qs = (selector, root = document) => root.querySelector(selector);
export const qsa = (selector, root = document) => [...root.querySelectorAll(selector)];

/**
 * Delegación de eventos por atributo.
 * Clic:     <button data-action="save">    → handlers.save(event, element)
 * Escribir: <input data-input="search">    → delegate(root, 'input', handlers, 'input')
 * Cambiar:  <select data-change="currency"> → delegate(root, 'change', handlers, 'change')
 */
export function delegate(root, eventName, handlers, attribute = 'action') {
  const listener = (event) => {
    const target = event.target.closest(`[data-${attribute}]`);
    if (!target || !root.contains(target)) return;
    const handler = handlers[target.dataset[attribute]];
    if (handler) handler(event, target);
  };
  root.addEventListener(eventName, listener);
  return () => root.removeEventListener(eventName, listener);
}

/** Pequeña espera, útil para escalonar descargas */
export const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
