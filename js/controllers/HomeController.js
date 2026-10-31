/**
 * HomeController.js — Controla la pantalla de inicio.
 */

import { Controller } from './Controller.js';
import { HomeView } from '../views/HomeView.js';
import { StatsService } from '../services/StatsService.js';
import { EVENTS } from '../core/events.js';
import { daysSince, monthLabel, shiftMonth, currentMonth } from '../core/format.js';
import { BACKUP_REMINDER_DAYS } from '../config.js';

export class HomeController extends Controller {
  async mount(container) {
    const { state, movementController, budgetController } = this.ctx;

    this.view = new HomeView(container, {
      prevMonth: () => state.shiftMonth(-1),
      nextMonth: () => state.shiftMonth(1),
      addMovement: () => movementController.openNew(),
      editMovement: (e, el) => movementController.openEdit(el.dataset.id),
      editBudgets: () => budgetController.open(),
    });

    this.refreshOn(
      EVENTS.MOVEMENTS_CHANGED,
      EVENTS.CATEGORIES_CHANGED,
      EVENTS.BUDGETS_CHANGED,
      EVENTS.SETTINGS_CHANGED,
      EVENTS.MONTH_CHANGED,
    );
    await this.refresh();
  }

  async refresh() {
    const token = this.nextToken();
    const { models, state } = this.ctx;
    const month = state.month;
    const movements = await models.movements.getByMonth(month);
    if (this.isStale(token)) return;

    this.view.render({
      month,
      canGoNext: !state.isCurrentMonth,
      currency: models.settings.get('currency'),
      totals: StatsService.summarize(movements),
      budget: models.budgets.total,
      categories: StatsService.byCategory(movements, models.categories, 'gasto'),
      recent: StatsService.sortByDate(movements)
        .slice(0, 6)
        .map((movement) => ({ movement, category: models.categories.byId(movement.categoria) })),
      reminder: await this.backupReminder(),
    });
  }

  /** Texto del recordatorio de respaldo, o null si no hace falta */
  async backupReminder() {
    const { settings, movements } = this.ctx.models;
    if (!settings.get('reminder')) return null;
    if (daysSince(settings.get('lastBackup')) < BACKUP_REMINDER_DAYS) return null;
    const months = await movements.monthsWithData();
    if (!months.length) return null;
    const previous = shiftMonth(currentMonth(), -1);
    return months.includes(previous)
      ? `Terminó ${monthLabel(previous).split(' ')[0].toLowerCase()}. Guarda tu respaldo en Excel.`
      : 'Hace tiempo que no respaldas tus datos en Excel.';
  }
}
