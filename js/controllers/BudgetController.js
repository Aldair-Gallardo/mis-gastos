/**
 * BudgetController.js — Abre y guarda el formulario de presupuestos.
 */

import { openSheet } from '../views/ui/Sheet.js';
import { showToast } from '../views/ui/Toast.js';
import { BudgetFormView } from '../views/BudgetFormView.js';
import { TOTAL_BUDGET } from '../models/BudgetModel.js';
import { parseAmount, currencySymbol } from '../core/format.js';

export class BudgetController {
  constructor(ctx) {
    this.ctx = ctx;
  }

  open() {
    const { budgets, categories, settings } = this.ctx.models;
    let view;

    const sheet = openSheet({
      title: 'Presupuestos mensuales',
      body: '',
      onMount: (root) => {
        view = new BudgetFormView(
          root.querySelector('.sheet__body'),
          {
            symbol: currencySymbol(settings.get('currency')),
            total: budgets.total,
            rows: categories.byType('gasto').map((category) => ({ category, value: budgets.get(category.id) })),
          },
          {
            submit: async (raw) => {
              const values = {};
              for (const [key, text] of Object.entries(raw)) {
                const amount = parseAmount(text);
                values[key === '__total' ? TOTAL_BUDGET : key] = Number.isFinite(amount) ? amount : 0;
              }
              await budgets.saveAll(values);
              sheet.close();
              showToast('Presupuestos guardados');
            },
          },
        );
      },
      onClose: () => view?.destroy(),
    });
  }
}
