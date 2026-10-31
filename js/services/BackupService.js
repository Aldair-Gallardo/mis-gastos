/**
 * BackupService.js — Une los modelos con el Excel:
 * exportar meses a archivos e importar archivos a la base de datos.
 */

import { ExcelService } from './ExcelService.js';

export class BackupService {
  constructor({ movements, categories }) {
    this.movements = movements;
    this.categories = categories;
  }

  /** Crea un archivo .xlsx por cada mes elegido */
  async exportMonths(months) {
    const files = [];
    for (const month of [...months].sort()) {
      const list = await this.movements.getByMonth(month);
      files.push(await ExcelService.buildMonthFile(month, list, this.categories));
    }
    return files;
  }

  /**
   * Lee varios .xlsx y guarda los movimientos nuevos.
   * @returns {Promise<{added:number, skipped:number, invalid:number, errors:Array<string>, files:number}>}
   */
  async importFiles(fileList) {
    const result = { added: 0, skipped: 0, invalid: 0, errors: [], files: 0 };
    const pending = [];

    for (const file of fileList) {
      try {
        const { rows, invalid } = await ExcelService.parseFile(file);
        result.invalid += invalid;
        result.files += 1;
        pending.push(...rows);
      } catch (error) {
        console.error(error);
        result.errors.push(error.message || `No se pudo leer "${file.name}".`);
      }
    }

    // Convertir el nombre de la categoría en su id (creándola si no existe)
    const movements = [];
    for (const row of pending) {
      const category = await this.categories.ensure(row.categoriaNombre, row.tipo);
      movements.push({
        id: row.id,
        fecha: row.fecha,
        tipo: row.tipo,
        categoria: category.id,
        monto: row.monto,
        nota: row.nota,
        recurrente: row.recurrente,
        origen: row.origen,
      });
    }

    if (movements.length) {
      const { added, skipped } = await this.movements.addMany(movements);
      result.added = added;
      result.skipped = skipped;
    }
    return result;
  }
}
