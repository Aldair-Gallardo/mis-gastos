/**
 * ExcelService.js — Crear y leer archivos Excel (.xlsx), un archivo por mes.
 * Usa la librería ExcelJS (vendor/exceljs.min.js), que se carga solo cuando hace falta.
 *
 * Formato de la hoja "Movimientos":
 *   ID | Fecha | Tipo | Categoría | Monto | Nota | Recurrente
 */

import { monthLabel, parseAmount, round2 } from '../core/format.js';
import { StatsService } from './StatsService.js';

const LIB_URL = 'vendor/exceljs.min.js';
const XLSX_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
const SHEET_NAME = 'Movimientos';
const HEADERS = ['ID', 'Fecha', 'Tipo', 'Categoría', 'Monto', 'Nota', 'Recurrente'];

let libraryPromise = null;

/** Carga ExcelJS la primera vez que se necesita */
export function loadExcelLibrary() {
  if (window.ExcelJS) return Promise.resolve(window.ExcelJS);
  if (!libraryPromise) {
    libraryPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = LIB_URL;
      script.onload = () => resolve(window.ExcelJS);
      script.onerror = () => {
        libraryPromise = null;
        reject(new Error('No se pudo cargar el módulo de Excel.'));
      };
      document.head.appendChild(script);
    });
  }
  return libraryPromise;
}

export const fileNameForMonth = (month) => `Gastos-${month}.xlsx`;

/* ---------- Fechas de Excel (número de serie) ---------- */

const EXCEL_EPOCH = Date.UTC(1899, 11, 30);

function isoToUTCDate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function utcDateToISO(date) {
  return date.toISOString().slice(0, 10);
}

function serialToISO(serial) {
  return utcDateToISO(new Date(EXCEL_EPOCH + Math.round(serial) * 86400000));
}

/** Acepta 31/10/2026, 31-10-26, 2026-10-31 */
function textToISO(text) {
  const value = String(text).trim();
  let match = value.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (match) return buildISO(match[1], match[2], match[3]);
  match = value.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})$/);
  if (match) {
    const year = match[3].length === 2 ? `20${match[3]}` : match[3];
    return buildISO(year, match[2], match[1]);
  }
  return null;
}

function buildISO(y, m, d) {
  const year = Number(y);
  const month = Number(m);
  const day = Number(d);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCMonth() !== month - 1) return null;
  return utcDateToISO(date);
}

/* ---------- Lectura segura de celdas ---------- */

function cellValue(cell) {
  const value = cell?.value;
  if (value === null || value === undefined) return null;
  if (value instanceof Date) return value;
  if (typeof value === 'object') {
    if ('result' in value) return value.result ?? null;
    if (Array.isArray(value.richText)) return value.richText.map((r) => r.text).join('');
    if ('text' in value) return value.text;
    if ('error' in value) return null;
  }
  return value;
}

const normalizeHeader = (text) =>
  String(text ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();

/** Hash corto y estable para movimientos sin ID */
function hash(text) {
  let h = 5381;
  for (let i = 0; i < text.length; i += 1) h = ((h << 5) + h + text.charCodeAt(i)) >>> 0;
  return h.toString(36);
}

export const ExcelService = {
  /**
   * Crea un archivo .xlsx para un mes.
   * @returns {Promise<File>}
   */
  async buildMonthFile(month, movements, categoryModel) {
    const ExcelJS = await loadExcelLibrary();
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Mis Gastos';
    workbook.created = new Date();

    /* Hoja 1: Movimientos */
    const sheet = workbook.addWorksheet(SHEET_NAME, { views: [{ state: 'frozen', ySplit: 1 }] });
    sheet.columns = [
      { header: HEADERS[0], key: 'id', width: 18 },
      { header: HEADERS[1], key: 'fecha', width: 13, style: { numFmt: 'dd/mm/yyyy' } },
      { header: HEADERS[2], key: 'tipo', width: 11 },
      { header: HEADERS[3], key: 'categoria', width: 20 },
      { header: HEADERS[4], key: 'monto', width: 14, style: { numFmt: '#,##0.00' } },
      { header: HEADERS[5], key: 'nota', width: 36 },
      { header: HEADERS[6], key: 'recurrente', width: 12 },
    ];

    const sorted = [...movements].sort((a, b) => a.fecha.localeCompare(b.fecha));
    for (const m of sorted) {
      sheet.addRow({
        id: m.id,
        fecha: isoToUTCDate(m.fecha),
        tipo: m.tipo === 'ingreso' ? 'Ingreso' : 'Gasto',
        categoria: categoryModel.byId(m.categoria).nombre,
        monto: m.monto,
        nota: m.nota || '',
        recurrente: m.recurrente ? 'Sí' : 'No',
      });
    }
    styleHeader(sheet.getRow(1));

    /* Hoja 2: Resumen */
    const totals = StatsService.summarize(movements);
    const summary = workbook.addWorksheet('Resumen');
    summary.columns = [{ width: 24 }, { width: 14 }, { width: 16 }];
    summary.addRow(['Mes', monthLabel(month)]);
    summary.addRow(['Ingresos', totals.ingresos]);
    summary.addRow(['Gastos', totals.gastos]);
    summary.addRow(['Balance', totals.balance]);
    summary.addRow([]);
    const header = summary.addRow(['Categoría', 'Tipo', 'Total']);
    styleHeader(header);
    for (const tipo of ['gasto', 'ingreso']) {
      for (const row of StatsService.byCategory(movements, categoryModel, tipo)) {
        summary.addRow([row.category.nombre, tipo === 'ingreso' ? 'Ingreso' : 'Gasto', row.total]);
      }
    }
    summary.getColumn(2).numFmt = '#,##0.00';
    summary.getColumn(3).numFmt = '#,##0.00';
    summary.getColumn(1).font = { bold: true };

    const buffer = await workbook.xlsx.writeBuffer();
    return new File([buffer], fileNameForMonth(month), { type: XLSX_TYPE });
  },

  /**
   * Lee un .xlsx y devuelve los movimientos encontrados (sin guardarlos).
   * @returns {Promise<{rows: Array, invalid: number}>}
   */
  async parseFile(file) {
    const ExcelJS = await loadExcelLibrary();
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(await file.arrayBuffer());

    const sheet = workbook.getWorksheet(SHEET_NAME) || workbook.worksheets[0];
    if (!sheet) throw new Error(`"${file.name}" no tiene hojas.`);

    // Ubicar columnas por su encabezado (sin importar mayúsculas ni acentos)
    const columns = {};
    sheet.getRow(1).eachCell((cell, col) => {
      const name = normalizeHeader(cellValue(cell));
      if (name) columns[name] = col;
    });
    if (!columns.fecha || !columns.monto) {
      throw new Error(`"${file.name}" no tiene las columnas Fecha y Monto.`);
    }

    const get = (row, name) => (columns[name] ? cellValue(row.getCell(columns[name])) : null);
    const rows = [];
    const seen = new Map();
    let invalid = 0;

    sheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;

      // Fecha
      const rawDate = get(row, 'fecha');
      let fecha = null;
      if (rawDate instanceof Date) fecha = utcDateToISO(rawDate);
      else if (typeof rawDate === 'number') fecha = serialToISO(rawDate);
      else if (rawDate) fecha = textToISO(rawDate);

      // Monto
      const rawAmount = get(row, 'monto');
      const amount = typeof rawAmount === 'number' ? rawAmount : parseAmount(rawAmount);

      if (!fecha && (rawAmount === null || rawAmount === '')) return; // fila vacía
      if (!fecha || !Number.isFinite(amount) || amount === 0) {
        invalid += 1;
        return;
      }

      // Tipo
      const rawType = normalizeHeader(get(row, 'tipo'));
      const tipo = rawType.startsWith('ing') ? 'ingreso' : 'gasto';

      const categoriaNombre =
        String(get(row, 'categoria') ?? '').trim() || (tipo === 'ingreso' ? 'Otros ingresos' : 'Otros');
      const nota = String(get(row, 'nota') ?? '').trim();
      const monto = round2(Math.abs(amount));
      const recurrente = ['si', 'sí', 'true', '1', 'x'].includes(normalizeHeader(get(row, 'recurrente')));

      // ID: el del archivo, o uno estable calculado con los datos
      let id = String(get(row, 'id') ?? '').trim();
      if (!id) {
        const key = `${fecha}|${tipo}|${categoriaNombre}|${monto}|${nota}`;
        const count = (seen.get(key) || 0) + 1;
        seen.set(key, count);
        id = `x${hash(`${key}|${count}`)}`;
      }
      const occurrence = id.match(/^(.+)-(\d{4}-\d{2})$/);

      rows.push({
        id: id.slice(0, 60),
        fecha,
        tipo,
        categoriaNombre,
        monto,
        nota,
        recurrente,
        origen: occurrence ? occurrence[1] : null,
      });
    });

    return { rows, invalid };
  },
};

function styleHeader(row) {
  row.height = 20;
  row.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FF312E81' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEEF0FF' } };
    cell.alignment = { vertical: 'middle' };
  });
}
