/**
 * app.js — Punto de entrada de la app (app.html).
 *
 * Arquitectura MVC:
 *   models/       → guardan y leen los datos (IndexedDB)
 *   views/        → dibujan las pantallas (HTML)
 *   controllers/  → conectan modelos y vistas, y responden a la persona
 *   services/     → lógica reutilizable (Excel, estadísticas, tema, instalación)
 *   core/         → herramientas base (base de datos, rutas, eventos, formato)
 */

import { Database, requestPersistentStorage } from './core/db.js';
import { bus } from './core/events.js';
import { state } from './core/state.js';
import { Router } from './core/router.js';

import { MovementModel } from './models/MovementModel.js';
import { CategoryModel } from './models/CategoryModel.js';
import { BudgetModel } from './models/BudgetModel.js';
import { SettingsModel } from './models/SettingsModel.js';

import { RecurrenceService } from './services/RecurrenceService.js';
import { BackupService } from './services/BackupService.js';
import { ThemeService } from './services/ThemeService.js';
import { InstallService, registerServiceWorker } from './services/InstallService.js';

import { HomeController } from './controllers/HomeController.js';
import { StatsController } from './controllers/StatsController.js';
import { HistoryController } from './controllers/HistoryController.js';
import { BackupController } from './controllers/BackupController.js';
import { MovementController } from './controllers/MovementController.js';
import { BudgetController } from './controllers/BudgetController.js';

import { ShellView } from './views/ShellView.js';
import { WelcomeView } from './views/WelcomeView.js';

const WELCOME_KEY = 'mg-welcome-shown';

async function start() {
  const theme = new ThemeService();
  // Aplicamos el tema guardado lo antes posible para evitar parpadeos
  try {
    theme.apply(localStorage.getItem('mg-theme') || 'system');
  } catch {
    theme.apply('system');
  }

  /* ---------- Modelos ---------- */
  const db = new Database();
  await db.open();
  const models = {
    movements: new MovementModel(db),
    categories: new CategoryModel(db),
    budgets: new BudgetModel(db),
    settings: new SettingsModel(db),
  };
  await Promise.all([models.categories.init(), models.budgets.init(), models.settings.init()]);
  theme.apply(models.settings.get('theme'));

  /* ---------- Servicios ---------- */
  const services = {
    theme,
    recurrence: new RecurrenceService(models.movements, models.settings),
    backup: new BackupService(models),
  };
  await services.recurrence.run();

  /* ---------- Controladores ---------- */
  const ctx = { models, services, state, bus };
  ctx.movementController = new MovementController(ctx);
  ctx.budgetController = new BudgetController(ctx);

  const backupController = new BackupController(ctx);
  const routes = {
    inicio: new HomeController(ctx),
    estadisticas: new StatsController(ctx),
    historial: new HistoryController(ctx),
    respaldo: backupController,
  };

  /* ---------- Marco de la app y navegación ---------- */
  const shell = new ShellView({
    add: () => ctx.movementController.openNew(),
  });
  const router = new Router(routes, document.getElementById('view'), 'inicio', (route) => shell.setActive(route));
  ctx.router = router;
  router.start();

  /* ---------- Bienvenida después de instalar ---------- */
  showWelcomeIfInstalled(router, backupController);

  // Si cambia el día (app abierta varios días), generamos los recurrentes del mes nuevo
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') services.recurrence.run();
  });

  requestPersistentStorage();
  registerServiceWorker();
}

function showWelcomeIfInstalled(router, backupController) {
  if (!InstallService.isStandalone()) return;
  try {
    if (localStorage.getItem(WELCOME_KEY)) return;
    localStorage.setItem(WELCOME_KEY, '1');
  } catch {
    return;
  }
  new WelcomeView({
    start: () => router.go('inicio'),
    importExcel: () => {
      router.go('respaldo');
      backupController.pickAndImport();
    },
  }).show();
}

start().catch((error) => {
  console.error(error);
  document.getElementById('view').innerHTML = `
    <div class="card" style="margin-top:40px">
      <div class="empty">
        <span class="empty__title">No se pudo abrir la app</span>
        <span>Revisa que el navegador permita guardar datos (no uses modo privado) y vuelve a intentarlo.</span>
      </div>
    </div>`;
});
