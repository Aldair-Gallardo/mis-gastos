/**
 * BackupController.js — Exportar/importar Excel y ajustes de la app.
 */

import { Controller } from './Controller.js';
import { BackupView } from '../views/BackupView.js';
import { ExportReadyView } from '../views/ExportReadyView.js';
import { openSheet, confirmSheet } from '../views/ui/Sheet.js';
import { showToast } from '../views/ui/Toast.js';
import { FileService } from '../services/FileService.js';
import { InstallService } from '../services/InstallService.js';
import { EVENTS } from '../core/events.js';
import { currentMonth } from '../core/format.js';

export class BackupController extends Controller {
  async mount(container) {
    const { models, services } = this.ctx;

    this.view = new BackupView(container, {
      toggleMonth: () => this.view.updateExportButton(),
      export: () => this.prepareExport(),
      pickFiles: () => this.view.openFilePicker(),
      importFiles: (e, input) => this.importFiles([...input.files]),
      toggleReminder: (e, el) => {
        const value = el.getAttribute('aria-checked') !== 'true';
        el.setAttribute('aria-checked', String(value));
        models.settings.set('reminder', value);
      },
      setTheme: (e, el) => {
        services.theme.apply(el.dataset.value);
        models.settings.set('theme', el.dataset.value);
      },
      currency: (e, el) => {
        models.settings.set('currency', el.value);
        showToast('Moneda actualizada');
      },
      wipe: () => this.wipe(),
    });

    // Solo redibujamos con cambios que afectan esta pantalla
    this.subscriptions.push(
      this.ctx.bus.on(EVENTS.MOVEMENTS_CHANGED, () => this.refresh()),
      this.ctx.bus.on(EVENTS.SETTINGS_CHANGED, ({ key }) => {
        if (key === 'theme' || key === 'lastBackup') this.refresh();
      }),
    );
    await this.refresh();
  }

  async refresh() {
    const token = this.nextToken();
    const { movements, settings } = this.ctx.models;
    const all = await movements.getAll();
    if (this.isStale(token)) return;

    const counts = new Map();
    all.forEach((m) => counts.set(m.month, (counts.get(m.month) || 0) + 1));
    const today = currentMonth();
    const months = [...counts.keys()]
      .sort()
      .reverse()
      .map((month) => ({ month, count: counts.get(month), current: month === today }));

    this.view.render({
      months,
      lastBackup: settings.get('lastBackup'),
      reminder: settings.get('reminder'),
      theme: settings.get('theme'),
      currency: settings.get('currency'),
      standalone: InstallService.isStandalone(),
    });
  }

  /** Paso 1: crear los archivos. Paso 2 (con un toque): guardarlos o compartirlos. */
  async prepareExport() {
    const months = this.view.selectedMonths();
    if (!months.length) return;

    this.view.setBusy('[data-export-btn]', true, 'Preparando archivos…');
    let files;
    try {
      files = await this.ctx.services.backup.exportMonths(months);
    } catch (error) {
      console.error(error);
      showToast(error.message || 'No se pudieron crear los archivos.', { type: 'error' });
      return;
    } finally {
      if (this.view) {
        this.view.setBusy('[data-export-btn]', false);
        this.view.updateExportButton();
      }
    }

    const canShare = FileService.canShare(files);
    openSheet({
      title: files.length === 1 ? 'Archivo listo' : `${files.length} archivos listos`,
      body: ExportReadyView.body(files, canShare),
      footer: ExportReadyView.footer(canShare),
      onMount: (root, close) => {
        root.querySelector('[data-deliver]').addEventListener('click', async () => {
          const result = await FileService.deliver(files);
          if (result === 'cancelled') return;
          await this.ctx.models.settings.set('lastBackup', new Date().toISOString());
          close();
          showToast(result === 'shared' ? 'Respaldo listo' : 'Archivos descargados');
        });
      },
    });
  }

  /**
   * Abre el selector de archivos desde fuera de esta pantalla
   * (por ejemplo, desde la bienvenida). Debe llamarse dentro de un toque.
   */
  pickAndImport() {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = '.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    input.addEventListener('change', () => this.importFiles([...input.files]));
    input.click();
  }

  async importFiles(files) {
    if (!files.length) return;
    this.view?.setBusy('[data-action="pickFiles"]', true, 'Importando…');
    try {
      const result = await this.ctx.services.backup.importFiles(files);
      result.errors.forEach((message) => showToast(message, { type: 'error', duration: 5000 }));
      if (result.files) {
        const parts = [`Se importaron ${result.added} movimientos`];
        if (result.skipped) parts.push(`${result.skipped} ya existían`);
        if (result.invalid) parts.push(`${result.invalid} filas con datos incompletos`);
        showToast(parts.join(' · '), { duration: 5000 });
      }
      // Recalcular gastos mensuales por si se importaron plantillas
      if (result.added) await this.ctx.services.recurrence.run();
    } finally {
      this.view?.setBusy('[data-action="pickFiles"]', false);
    }
  }

  async wipe() {
    const ok = await confirmSheet({
      title: '¿Borrar todos los datos?',
      message: 'Se eliminarán todos tus movimientos y presupuestos de este dispositivo. Te recomendamos exportar un respaldo antes.',
      confirmLabel: 'Sí, borrar todo',
      danger: true,
    });
    if (!ok) return;
    const { movements, budgets, settings } = this.ctx.models;
    await movements.clearAll();
    await budgets.saveAll(Object.fromEntries(budgets.entries().map(([id]) => [id, 0]).concat([['__total', 0]])));
    await settings.set('recurrenceSkips', []);
    showToast('Datos borrados');
  }
}
