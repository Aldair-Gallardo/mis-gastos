/**
 * landing.js — Punto de entrada de la página de bienvenida (index.html).
 */

import { LandingController } from './controllers/LandingController.js';
import { registerServiceWorker } from './services/InstallService.js';

new LandingController().start();
registerServiceWorker();
