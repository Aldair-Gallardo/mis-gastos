/**
 * HistoryController.js — Historial: filtros, búsqueda y grupos por día.
 * Sin búsqueda muestra el mes elegido; al buscar, busca en todos los meses.
 */

import { Controller } from './Controller.js';
import { HistoryView } from '../views/HistoryView.js';
import { StatsService } from '../services/StatsService.js';
import { EVENTS } from '../core/events.js';

const normalize = (text) =>
  String(text ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();

export class HistoryController extends Controller {
  constructor(ctx) {
    super(ctx);
    this.filter = 'all';
    this.query = '';
    this.searchTimer = null;
  }

  async mount(container) {
    const { state, movementController } = this.ctx;

    this.view = new HistoryView(container, {
      prevMonth: () => state.shiftMonth(-1),
      nextMonth: () => state.shiftMonth(1),
      editMovement: (e, el) => movementController.openEdit(el.dataset.id),
      filter: (e, el) => {
        this.filter = el.dataset.value;
        this.refresh();
      },
      search: (e, el) => {
        clearTimeout(this.searchTimer);
        this.searchTimer = setTimeout(() => {
          this.query = el.value.trim();
          this.refresh();
        }, 180);
      },
    });

    this.refreshOn(EVENTS.MOVEMENTS_CHANGED, EVENTS.CATEGORIES_CHANGED, EVENTS.SETTINGS_CHANGED, EVENTS.MONTH_CHANGED);
    await this.refresh();
  }

  unmount() {
    clearTimeout(this.searchTimer);
    super.unmount();
  }

  async refresh() {
    const token = this.nextToken();
    const { models, state } = this.ctx;
    const searching = this.query.length > 0;

    const base = searching ? await models.movements.getAll() : await models.movements.getByMonth(state.month);
    if (this.isStale(token)) return;

    // Chips de categoría: solo las que aparecen en los datos visibles
    const usedIds = new Set(base.map((m) => m.categoria));
    const usedCategories = models.categories.all().filter((c) => usedIds.has(c.id));
    if (this.filter.startsWith('cat:') && !usedIds.has(this.filter.slice(4))) this.filter = 'all';

    const term = normalize(this.query);
    const filtered = base.filter((m) => {
      if (this.filter === 'gasto' || this.filter === 'ingreso') {
        if (m.tipo !== this.filter) return false;
      } else if (this.filter === 'recurring') {
        if (!m.recurrente && !m.origen) return false;
      } else if (this.filter.startsWith('cat:')) {
        if (m.categoria !== this.filter.slice(4)) return false;
      }
      if (!term) return true;
      const category = models.categories.byId(m.categoria);
      return normalize(`${m.nota} ${category.nombre} ${m.monto}`).includes(term);
    });

    const groups = StatsService.groupByDay(filtered).map((group) => ({
      ...group,
      items: group.items.map((movement) => ({ movement, category: models.categories.byId(movement.categoria) })),
    }));

    this.view.renderHeader({ month: state.month, canGoNext: !state.isCurrentMonth, searching });
    this.view.renderFilters({ filter: this.filter, categories: usedCategories });
    this.view.renderResults({ groups, currency: models.settings.get('currency'), searching });
  }
}
