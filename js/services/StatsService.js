/**
 * StatsService.js — Cálculos: totales, categorías, semanas, meses y presupuestos.
 * Funciones puras: reciben datos y devuelven resultados, sin tocar la pantalla.
 */

import { round2, daysInMonth } from '../core/format.js';

const MONTH_LETTERS = ['E', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];

export const StatsService = {
  /** Totales de ingresos, gastos y balance */
  summarize(movements) {
    let ingresos = 0;
    let gastos = 0;
    for (const m of movements) {
      if (m.tipo === 'ingreso') ingresos += m.monto;
      else gastos += m.monto;
    }
    return { ingresos: round2(ingresos), gastos: round2(gastos), balance: round2(ingresos - gastos) };
  },

  /** Total por categoría, de mayor a menor, con su porcentaje */
  byCategory(movements, categoryModel, tipo = 'gasto') {
    const totals = new Map();
    let sum = 0;
    for (const m of movements) {
      if (m.tipo !== tipo) continue;
      totals.set(m.categoria, (totals.get(m.categoria) || 0) + m.monto);
      sum += m.monto;
    }
    return [...totals.entries()]
      .map(([id, total]) => ({
        category: categoryModel.byId(id),
        total: round2(total),
        pct: sum ? total / sum : 0,
      }))
      .sort((a, b) => b.total - a.total);
  },

  /** Gasto por semana del mes: S1 (1–7), S2 (8–14)... */
  weekly(movements, month) {
    const lastDay = daysInMonth(month);
    const weeks = [];
    for (let start = 1, i = 1; start <= lastDay; start += 7, i += 1) {
      weeks.push({ label: `S${i}`, from: start, to: Math.min(start + 6, lastDay), total: 0 });
    }
    for (const m of movements) {
      if (m.tipo !== 'gasto') continue;
      const day = Number(m.fecha.slice(8, 10));
      const week = weeks[Math.min(Math.floor((day - 1) / 7), weeks.length - 1)];
      week.total += m.monto;
    }
    weeks.forEach((w) => (w.total = round2(w.total)));
    return weeks;
  },

  /** Gasto por mes de un año */
  monthly(movements, year) {
    const months = MONTH_LETTERS.map((label, i) => ({
      label,
      month: `${year}-${String(i + 1).padStart(2, '0')}`,
      total: 0,
    }));
    for (const m of movements) {
      if (m.tipo !== 'gasto') continue;
      months[Number(m.month.slice(5, 7)) - 1].total += m.monto;
    }
    months.forEach((m) => (m.total = round2(m.total)));
    return months;
  },

  /** Ordena del más reciente al más antiguo */
  sortByDate(movements) {
    return [...movements].sort(
      (a, b) => b.fecha.localeCompare(a.fecha) || String(b.creado).localeCompare(String(a.creado)),
    );
  },

  /** Agrupa por día para el historial */
  groupByDay(movements) {
    const groups = new Map();
    for (const m of this.sortByDate(movements)) {
      if (!groups.has(m.fecha)) groups.set(m.fecha, { fecha: m.fecha, items: [], neto: 0 });
      const group = groups.get(m.fecha);
      group.items.push(m);
      group.neto += m.tipo === 'ingreso' ? m.monto : -m.monto;
    }
    return [...groups.values()].map((g) => ({ ...g, neto: round2(g.neto) }));
  },

  /** Estado de un presupuesto: ok, casi al límite (85%+) o excedido */
  budgetStatus(spent, limit) {
    if (!limit) return { pct: 0, level: 'none' };
    const pct = spent / limit;
    let level = 'ok';
    if (pct > 1) level = 'over';
    else if (pct >= 0.85) level = 'warn';
    return { pct, level };
  },
};
