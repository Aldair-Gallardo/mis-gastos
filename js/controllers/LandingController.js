/**
 * LandingController.js — Lógica de la página de bienvenida (index.html).
 * Decide qué hacer al tocar "Instalar app" según el dispositivo.
 */

import { InstallService } from '../services/InstallService.js';
import { LandingView } from '../views/LandingView.js';
import { showToast } from '../views/ui/Toast.js';

export class LandingController {
  constructor() {
    this.install = new InstallService();
  }

  start() {
    LandingView.bindInstallButtons(() => this.onInstallClick());
    this.install.onInstalled(() => LandingView.showInstalledSuccess());
  }

  async onInstallClick() {
    // 1. Android / Chrome / Edge: ventana de instalación nativa
    if (this.install.canPrompt) {
      const outcome = await this.install.prompt();
      if (outcome === 'accepted') showToast('Instalando…');
      return;
    }

    // 2. iPhone / iPad: guía de Safari
    if (InstallService.isIOS()) {
      LandingView.showIOSGuide({ isSafari: InstallService.isIOSSafari() });
      return;
    }

    // 3. Ya instalada antes en este navegador
    let installedBefore = false;
    try {
      installedBefore = localStorage.getItem('mg-installed') === '1';
    } catch {
      /* sin almacenamiento */
    }
    if (installedBefore) {
      LandingView.showAlreadyInstalled();
      return;
    }

    // 4. Otros navegadores: instrucciones generales
    LandingView.showGenericGuide();
  }
}
