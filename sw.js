/**
 * sw.js — Service Worker: permite usar la app sin internet.
 *
 * IMPORTANTE: cada vez que publiques cambios, sube el número de CACHE_VERSION
 * (por ejemplo 'v2'). Así los teléfonos descargan la versión nueva.
 */

const CACHE_VERSION = 'v1';
const CACHE_NAME = `mis-gastos-${CACHE_VERSION}`;

// Archivos que se guardan al instalar
const APP_FILES = [
  './',
  './index.html',
  './app.html',
  './manifest.webmanifest',
  './css/base.css',
  './css/layout.css',
  './css/components.css',
  './css/landing.css',
  './js/app.js',
  './js/landing.js',
  './js/config.js',
  './js/core/db.js',
  './js/core/dom.js',
  './js/core/events.js',
  './js/core/format.js',
  './js/core/icons.js',
  './js/core/router.js',
  './js/core/state.js',
  './js/models/MovementModel.js',
  './js/models/CategoryModel.js',
  './js/models/BudgetModel.js',
  './js/models/SettingsModel.js',
  './js/services/BackupService.js',
  './js/services/ExcelService.js',
  './js/services/FileService.js',
  './js/services/InstallService.js',
  './js/services/RecurrenceService.js',
  './js/services/StatsService.js',
  './js/services/ThemeService.js',
  './js/views/View.js',
  './js/views/partials.js',
  './js/views/ShellView.js',
  './js/views/HomeView.js',
  './js/views/StatsView.js',
  './js/views/HistoryView.js',
  './js/views/BackupView.js',
  './js/views/MovementFormView.js',
  './js/views/CategoryFormView.js',
  './js/views/BudgetFormView.js',
  './js/views/ExportReadyView.js',
  './js/views/WelcomeView.js',
  './js/views/LandingView.js',
  './js/views/ui/Sheet.js',
  './js/views/ui/Toast.js',
  './js/controllers/Controller.js',
  './js/controllers/HomeController.js',
  './js/controllers/StatsController.js',
  './js/controllers/HistoryController.js',
  './js/controllers/BackupController.js',
  './js/controllers/MovementController.js',
  './js/controllers/BudgetController.js',
  './js/controllers/LandingController.js',
  './vendor/exceljs.min.js',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
  './assets/icons/icon-maskable-512.png',
  './assets/icons/apple-touch-icon.png',
  './assets/icons/favicon-32.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_FILES))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key.startsWith('mis-gastos-') && key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

/**
 * Estrategia: responder rápido desde la caché y, en segundo plano,
 * actualizarla con la versión de internet (stale-while-revalidate).
 */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cached = await cache.match(request, { ignoreSearch: true });
      const network = fetch(request)
        .then((response) => {
          if (response.ok) cache.put(request, response.clone());
          return response;
        })
        .catch(() => null);

      if (cached) {
        event.waitUntil(network);
        return cached;
      }
      const fresh = await network;
      if (fresh) return fresh;
      if (request.mode === 'navigate') return (await cache.match('./app.html')) || Response.error();
      return Response.error();
    }),
  );
});
