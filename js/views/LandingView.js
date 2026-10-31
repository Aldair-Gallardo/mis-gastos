/**
 * LandingView.js — Partes dinámicas de la página de bienvenida:
 * guías de instalación y aviso de "instalada con éxito".
 */

import { openSheet } from './ui/Sheet.js';
import { icon } from '../core/icons.js';

const SHARE_ICON = `<span class="ios-share-icon">${icon('share', 20, 2)}</span>`;

export const LandingView = {
  /** Conecta todos los botones "Instalar app" */
  bindInstallButtons(onClick) {
    document.querySelectorAll('[data-install]').forEach((button) => {
      button.addEventListener('click', onClick);
    });
  },

  /** Guía para iPhone / iPad */
  showIOSGuide({ isSafari }) {
    const safariWarning = isSafari
      ? ''
      : `<div class="banner" style="margin-bottom:12px">${icon('alert', 20)}<span class="banner__text">En iPhone y iPad la instalación se hace desde <strong>Safari</strong>. Copia esta dirección y ábrela allí.</span></div>`;

    openSheet({
      title: 'Instalar en iPhone o iPad',
      body: `
        ${safariWarning}
        <ol class="ios-steps">
          <li><span class="ios-steps__num">1</span><span>Toca el botón <strong>Compartir</strong> ${SHARE_ICON} en la barra de Safari.</span></li>
          <li><span class="ios-steps__num">2</span><span>Desliza y elige <strong>Agregar a inicio</strong>.</span></li>
          <li><span class="ios-steps__num">3</span><span>Toca <strong>Agregar</strong>. Al abrir la app desde su ícono verás la confirmación.</span></li>
        </ol>`,
      footer: `<button type="button" class="btn btn--primary btn--block" data-sheet-close>Entendido</button>`,
    });
  },

  /** Guía cuando el navegador no ofrece el botón automático */
  showGenericGuide() {
    openSheet({
      title: 'Instalar la app',
      body: `
        <ol class="ios-steps">
          <li><span class="ios-steps__num">1</span><span>Abre el menú del navegador ${icon('dots', 18)} (arriba a la derecha).</span></li>
          <li><span class="ios-steps__num">2</span><span>Elige <strong>Instalar app</strong> o <strong>Agregar a pantalla de inicio</strong>.</span></li>
          <li><span class="ios-steps__num">3</span><span>Confirma, y el ícono aparecerá en tu pantalla de inicio o escritorio.</span></li>
        </ol>
        <p class="note" style="margin-top:12px;text-align:center">Funciona mejor en Chrome, Edge o Safari. Si no ves la opción, puedes usar la app desde el navegador.</p>`,
      footer: `
        <a class="btn btn--primary btn--block" href="app.html">Usar en el navegador</a>
        <button type="button" class="btn btn--secondary btn--block" data-sheet-close>Cerrar</button>`,
    });
  },

  /** La app ya estaba instalada en este dispositivo */
  showAlreadyInstalled() {
    openSheet({
      title: 'La app ya está instalada',
      body: `<p class="welcome__text" style="text-align:center">Búscala en tu pantalla de inicio como <strong>Mis Gastos</strong>. También puedes usarla aquí en el navegador.</p>`,
      footer: `
        <a class="btn btn--primary btn--block" href="app.html">Abrir en el navegador</a>
        <button type="button" class="btn btn--secondary btn--block" data-sheet-close>Cerrar</button>`,
    });
  },

  /** Mensaje "Su aplicación fue instalada con éxito" */
  showInstalledSuccess() {
    document.querySelector('.install-success')?.remove();
    const banner = document.createElement('div');
    banner.className = 'install-success';
    banner.setAttribute('role', 'status');
    banner.innerHTML = `
      <span class="toast__icon" style="width:40px;height:40px;border-radius:20px">${icon('check', 20, 2.6)}</span>
      <span class="install-success__text">
        <strong>Su aplicación fue instalada con éxito</strong>
        <span>Búsquela en su pantalla de inicio.</span>
      </span>
      <button type="button" class="icon-btn" aria-label="Cerrar aviso" style="color:#C7C4F2">${icon('x', 18, 2)}</button>`;
    banner.querySelector('button').addEventListener('click', () => banner.remove());
    document.body.appendChild(banner);
    setTimeout(() => banner.remove(), 12000);
  },
};
