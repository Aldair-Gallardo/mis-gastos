/**
 * db.js — Acceso a IndexedDB (la base de datos interna del navegador).
 * Los datos se guardan solo en este dispositivo.
 *
 * Almacenes (stores):
 *   movements   → gastos e ingresos       (clave: id, índice: month)
 *   categories  → categorías              (clave: id)
 *   budgets     → presupuestos            (clave: categoryId)
 *   settings    → ajustes clave/valor     (clave: key)
 */

import { DB_NAME, DB_VERSION } from '../config.js';

const promisify = (request) =>
  new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

export class Database {
  constructor(name = DB_NAME, version = DB_VERSION) {
    this.name = name;
    this.version = version;
    this.db = null;
  }

  open() {
    if (this.db) return Promise.resolve(this.db);
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.name, this.version);

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains('movements')) {
          const store = db.createObjectStore('movements', { keyPath: 'id' });
          store.createIndex('month', 'month', { unique: false });
        }
        if (!db.objectStoreNames.contains('categories')) {
          db.createObjectStore('categories', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('budgets')) {
          db.createObjectStore('budgets', { keyPath: 'categoryId' });
        }
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }
      };

      request.onsuccess = () => {
        this.db = request.result;
        // Si otra pestaña actualiza la base de datos, cerramos esta conexión
        this.db.onversionchange = () => this.db.close();
        resolve(this.db);
      };
      request.onerror = () => reject(request.error);
      request.onblocked = () => reject(new Error('La base de datos está abierta en otra pestaña.'));
    });
  }

  store(name, mode = 'readonly') {
    return this.db.transaction(name, mode).objectStore(name);
  }

  get(storeName, key) {
    return promisify(this.store(storeName).get(key));
  }

  getAll(storeName) {
    return promisify(this.store(storeName).getAll());
  }

  getAllByIndex(storeName, indexName, query) {
    return promisify(this.store(storeName).index(indexName).getAll(query));
  }

  getAllKeys(storeName) {
    return promisify(this.store(storeName).getAllKeys());
  }

  put(storeName, value) {
    return promisify(this.store(storeName, 'readwrite').put(value));
  }

  delete(storeName, key) {
    return promisify(this.store(storeName, 'readwrite').delete(key));
  }

  clear(storeName) {
    return promisify(this.store(storeName, 'readwrite').clear());
  }

  /** Guarda muchos registros en una sola transacción (más rápido) */
  putMany(storeName, values) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      values.forEach((value) => store.put(value));
      tx.oncomplete = () => resolve(values.length);
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  }
}

/** Pide al navegador que no borre los datos aunque falte espacio */
export async function requestPersistentStorage() {
  try {
    if (navigator.storage?.persist && !(await navigator.storage.persisted())) {
      await navigator.storage.persist();
    }
  } catch {
    /* No todos los navegadores lo permiten; no es grave. */
  }
}
