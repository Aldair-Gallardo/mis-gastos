/**
 * RecurrenceService.js — Gastos e ingresos que se repiten cada mes.
 *
 * Un movimiento marcado como "recurrente" es una plantilla. Cada vez que se abre
 * la app, se crean las copias que falten desde el mes siguiente hasta el mes actual.
 * Cada copia tiene un id fijo ("idPlantilla-AAAA-MM") para no duplicarla nunca.
 */

import { currentMonth, shiftMonth, monthRange, daysInMonth } from '../core/format.js';

export class RecurrenceService {
  constructor(movementModel, settingsModel) {
    this.movements = movementModel;
    this.settings = settingsModel;
  }

  static occurrenceId(templateId, month) {
    return `${templateId}-${month}`;
  }

  async run() {
    const all = await this.movements.getAll();
    const templates = all.filter((m) => m.recurrente && !m.origen);
    if (!templates.length) return 0;

    const skips = new Set(this.settings.get('recurrenceSkips') || []);
    const today = currentMonth();
    const toCreate = [];

    for (const template of templates) {
      const day = Number(template.fecha.slice(8, 10));
      for (const month of monthRange(shiftMonth(template.month, 1), today)) {
        const id = RecurrenceService.occurrenceId(template.id, month);
        if (skips.has(id)) continue;
        const safeDay = String(Math.min(day, daysInMonth(month))).padStart(2, '0');
        toCreate.push({
          id,
          fecha: `${month}-${safeDay}`,
          tipo: template.tipo,
          categoria: template.categoria,
          monto: template.monto,
          nota: template.nota,
          recurrente: false,
          origen: template.id,
        });
      }
    }

    if (!toCreate.length) return 0;
    const { added } = await this.movements.addMany(toCreate);
    return added;
  }

  /** Si la persona borra una copia automática, recordamos no volver a crearla */
  async rememberSkip(movement) {
    if (!movement?.origen) return;
    const skips = new Set(this.settings.get('recurrenceSkips') || []);
    skips.add(movement.id);
    await this.settings.set('recurrenceSkips', [...skips]);
  }
}
