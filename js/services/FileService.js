/**
 * FileService.js — Entregar archivos a la persona.
 * En celulares abre el menú "Compartir" del sistema (Guardar en Archivos, iCloud Drive,
 * Google Drive...). Si no se puede, descarga los archivos.
 */

import { wait } from '../core/dom.js';

export const FileService = {
  canShare(files) {
    try {
      return Boolean(navigator.canShare && navigator.canShare({ files }));
    } catch {
      return false;
    }
  },

  /**
   * Debe llamarse directamente desde un toque/clic de la persona.
   * @returns {Promise<'shared'|'downloaded'|'cancelled'>}
   */
  async deliver(files, title = 'Respaldo de Mis Gastos') {
    if (this.canShare(files)) {
      try {
        await navigator.share({ files, title });
        return 'shared';
      } catch (error) {
        if (error?.name === 'AbortError') return 'cancelled';
        // Si compartir falla por otro motivo, intentamos descargar
      }
    }
    await this.download(files);
    return 'downloaded';
  },

  async download(files) {
    for (const file of files) {
      const url = URL.createObjectURL(file);
      const link = document.createElement('a');
      link.href = url;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
      await wait(400); // algunos navegadores bloquean varias descargas seguidas
    }
  },
};
