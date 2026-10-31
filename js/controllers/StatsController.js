/**
 * StatsController.js — Controla la pantalla de estadísticas (por mes o por año).
 */

import { Controller } from './Controller.js';
import { StatsView } from '../views/StatsView.js';
import { StatsService } from '../services/StatsService.js';
import { EVENTS } from '../core/events.js';
import { monthLabel, currentMonth, round2 } from '../core/format.js';

export class StatsController extends Controller {
  constructor(ctx) {
    super(ctx);
    this.period = 'month';
  }

  async mount(container) {
    const { state, budgetController } = this.ctx;

    this.view = new StatsView(container, {
      setPeriod: (e, el) => {
        this.period = el.dataset.value;
        this.refresh();
      },
      prev: () => state.shiftMonth(this.period === 'year' ? -12 : -1),
      next: () => {
        if (this.period === 'month') return state.shiftMonth(1);
        // En modo año no pasamos del mes actual
        const target = Number(state.month.slice(0, 4)) + 1;
        const today = currentMonth();
        state.setMonth(`${target}-${state.month.slice(5)}` > today ? today : `${target}-${state.month.slice(5)}`);
      },
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
    const year = month.slice(0, 4);
    const today = currentMonth();

    const monthMovements = await models.movements.getByMonth(month);
    const periodMovements = this.period === 'year' ? await models.movements.getByYear(year) : monthMovements;
    if (this.isStale(token)) return;

    const totals = StatsService.summarize(periodMovements);
    let bars;
    let average;
    if (this.period === 'month') {
      bars = StatsService.weekly(periodMovements, month);
      average = totals.gastos / bars.length;
    } else {
      bars = StatsService.monthly(periodMovements, year);
      const monthsElapsed = year === today.slice(0, 4) ? Number(today.slice(5)) : 12;
      average = totals.gastos / Math.max(1, monthsElapsed);
    }

    this.view.render({
      period: this.period,
      label: this.period === 'month' ? monthLabel(month) : year,
      canGoNext: this.period === 'month' ? month < today : year < today.slice(0, 4),
      currency: models.settings.get('currency'),
      totals,
      categories: StatsService.byCategory(periodMovements, models.categories, 'gasto'),
      bars,
      average: round2(average),
      budgetTitle: this.period === 'month' ? 'Presupuestos' : `Presupuestos de ${monthLabel(month).split(' ')[0].toLowerCase()}`,
      ...this.budgetData(monthMovements),
    });
  }

  /** Presupuestos del mes: gastado vs. límite */
  budgetData(movements) {
    const { budgets, categories } = this.ctx.models;
    const spentBy = new Map(
      StatsService.byCategory(movements, categories, 'gasto').map((row) => [row.category.id, row.total]),
    );
    const totalSpent = StatsService.summarize(movements).gastos;

    const rows = budgets
      .entries()
      .filter(([id]) => categories.all().some((c) => c.id === id))
      .map(([id, limit]) => {
        const spent = spentBy.get(id) || 0;
        return { category: categories.byId(id), spent, limit, status: StatsService.budgetStatus(spent, limit) };
      })
      .sort((a, b) => b.status.pct - a.status.pct);

    const totalBudget = budgets.total
      ? { spent: totalSpent, limit: budgets.total, status: StatsService.budgetStatus(totalSpent, budgets.total) }
      : null;

    return { budgets: rows, totalBudget };
  }
}
