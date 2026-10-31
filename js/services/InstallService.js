/**
 * InstallService.js — Instalación de la app en la pantalla de inicio (PWA).
 *
 * - Android / Chrome / Edge: el navegador ofrece el evento "beforeinstallprompt",
 *   que permite mostrar la ventana de instalación desde nuestro botón, y avisa con
 *   "appinstalled" cuando terminó.
 * - iPhone / iPad (Safari): Apple no permite instalar desde un botón. Se muestra una
 *   guía (Compartir → Agregar a inicio) y la confirmación aparece al abrir la app.
 */

export class InstallService {
  constructor() {
    // Puede haber llegado antes de cargar este archivo (ver index.html)
    this.deferredPrompt = window.__mgInstallPrompt || null;
    this.listeners = { available: [], installed: [] };

    window.addEventListener('beforeinstallprompt', (event) => {
      event.preventDefault();
      this.deferredPrompt = event;
      this.listeners.available.forEach((fn) => fn());
    });

    window.addEventListener('appinstalled', () => {
      this.deferredPrompt = null;
      try {
        localStorage.setItem('mg-installed', '1');
      } catch {
        /* sin almacenamiento local */
      }
      this.listeners.installed.forEach((fn) => fn());
    });
  }

  onAvailable(fn) {
    this.listeners.available.push(fn);
  }

  onInstalled(fn) {
    this.listeners.installed.push(fn);
  }

  /** ¿La app está abierta como app instalada (sin barra del navegador)? */
  static isStandalone() {
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      window.matchMedia('(display-mode: fullscreen)').matches ||
      window.navigator.standalone === true
    );
  }

  static isIOS() {
    const ua = navigator.userAgent;
    const iPadOS = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
    return /iPad|iPhone|iPod/.test(ua) || iPadOS;
  }

  static isIOSSafari() {
    const ua = navigator.userAgent;
    return InstallService.isIOS() && /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS/.test(ua);
  }

  get canPrompt() {
    return Boolean(this.deferredPrompt);
  }

  /**
   * Muestra la ventana de instalación del navegador.
   * @returns {Promise<'accepted'|'dismissed'|'unavailable'>}
   */
  async prompt() {
    if (!this.deferredPrompt) return 'unavailable';
    const promptEvent = this.deferredPrompt;
    this.deferredPrompt = null;
    promptEvent.prompt();
    const { outcome } = await promptEvent.userChoice;
    return outcome;
  }
}

/** Registra el service worker (necesario para instalar y para funcionar sin internet) */
export function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  if (location.protocol === 'file:') {
    console.warn('Abre la app con un servidor (por ejemplo Live Server) para que funcione el modo sin conexión.');
    return;
  }
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch((error) => {
      console.warn('No se pudo registrar el service worker:', error);
    });
  });
}
