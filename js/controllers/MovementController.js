/**
 * MovementController.js — Agregar, editar y eliminar movimientos.
 * No es una pantalla: abre una hoja con el formulario desde cualquier lugar.
 */

import { openSheet, confirmSheet } from '../views/ui/Sheet.js';
import { showToast } from '../views/ui/Toast.js';
import { MovementFormView } from '../views/MovementFormView.js';
import { CategoryFormView } from '../views/CategoryFormView.js';
import { parseAmount, todayISO, monthOf, currencySymbol } from '../core/format.js';

export class MovementController {
  constructor(ctx) {
    this.ctx = ctx;
  }

  /** Fecha sugerida: hoy, o el día 1 si se está viendo otro mes */
  suggestedDate() {
    const today = todayISO();
    const viewing = this.ctx.state.month;
    return monthOf(today) === viewing ? today : `${viewing}-01`;
  }

  openNew() {
    this.openForm(null);
  }

  async openEdit(id) {
    const movement = await this.ctx.models.movements.getById(id);
    if (!movement) {
      showToast('Ese movimiento ya no existe.', { type: 'error' });
      return;
    }
    this.openForm(movement);
  }

  openForm(movement) {
    const { models } = this.ctx;
    let formView;

    const sheet = openSheet({
      title: movement ? 'Editar movimiento' : 'Nuevo movimiento',
      body: '',
      onMount: (root) => {
        formView = new MovementFormView(
          root.querySelector('.sheet__body'),
          {
            categories: models.categories.all(),
            symbol: currencySymbol(models.settings.get('currency')),
            movement,
            today: this.suggestedDate(),
          },
          {
            submit: (values) => this.save(values, movement, formView, sheet),
            remove: () => this.remove(movement, sheet),
            newCategory: (tipo) => this.openCategoryForm(tipo, formView),
          },
        );
      },
      onClose: () => formView?.destroy(),
    });
  }

  async save(values, original, formView, sheet) {
    const { models, services, state } = this.ctx;
    const monto = parseAmount(values.montoTexto);

    if (!(monto > 0)) return formView.showError('Escribe un monto mayor que cero.');
    if (!values.categoria) return formView.showError('Elige una categoría.');
    if (!values.fecha) return formView.showError('Elige una fecha.');

    try {
      const saved = await models.movements.save({
        ...(original || {}),
        tipo: values.tipo,
        categoria: values.categoria,
        monto,
        fecha: values.fecha,
        nota: values.nota,
        recurrente: original?.origen ? false : values.recurrente,
      });
      sheet.close();

      if (saved.recurrente) await services.recurrence.run();
      if (!original && saved.month !== state.month) state.setMonth(saved.month);

      const noun = saved.tipo === 'ingreso' ? 'Ingreso' : 'Gasto';
      showToast(original ? 'Cambios guardados' : `${noun} guardado`);
    } catch (error) {
      formView.showError(error.message);
    }
  }

  async remove(movement, sheet) {
    const ok = await confirmSheet({
      title: '¿Eliminar movimiento?',
      message: movement.recurrente
        ? 'Se eliminará este movimiento y dejará de repetirse. Las copias de meses anteriores se mantienen.'
        : 'Esta acción no se puede deshacer.',
      confirmLabel: 'Eliminar',
      danger: true,
    });
    if (!ok) return;

    const { models, services } = this.ctx;
    await services.recurrence.rememberSkip(movement);
    await models.movements.remove(movement.id);
    sheet.close();
    showToast('Movimiento eliminado');
  }

  openCategoryForm(tipo, formView) {
    let categoryView;
    const sheet = openSheet({
      title: tipo === 'ingreso' ? 'Nueva categoría de ingreso' : 'Nueva categoría de gasto',
      body: '',
      onMount: (root) => {
        categoryView = new CategoryFormView(root.querySelector('.sheet__body'), { tipo }, {
          submit: async (values) => {
            try {
              const category = await this.ctx.models.categories.add(values);
              sheet.close();
              formView.addCategory(category);
            } catch (error) {
              categoryView.showError(error.message);
            }
          },
        });
      },
      onClose: () => categoryView?.destroy(),
    });
  }
}
