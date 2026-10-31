/**
 * ExportReadyView.js — Contenido de la hoja "Archivos listos".
 * Compartir un archivo debe hacerse con un toque directo de la persona,
 * por eso primero preparamos los archivos y luego mostramos este botón.
 */

import { esc } from '../core/dom.js';
import { icon } from '../core/icons.js';

export const ExportReadyView = {
  body(files, canShare) {
    return `
      <div class="stack">
        <ul class="list card" style="padding:4px 16px">
          ${files
            .map(
              (file) => `
            <li class="row" style="cursor:default">
              <span class="cat-icon cat-indigo">${icon('file', 18)}</span>
              <span class="row__main">
                <span class="row__title">${esc(file.name)}</span>
                <span class="row__meta">${(file.size / 1024).toFixed(1)} KB</span>
              </span>
            </li>`,
            )
            .join('')}
        </ul>
        <p class="note" style="text-align:center">
          ${
            canShare
              ? 'En el menú que se abre, elige <strong>Guardar en Archivos</strong> y una carpeta como iCloud Drive o Google Drive.'
              : 'Los archivos se descargarán en tu carpeta de descargas.'
          }
        </p>
      </div>`;
  },

  footer(canShare) {
    return `<button type="button" class="btn btn--primary btn--block" data-deliver>${icon(canShare ? 'share' : 'download', 20, 2)}${canShare ? 'Guardar o compartir' : 'Descargar archivos'}</button>`;
  },
};
