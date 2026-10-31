/**
 * CategoryModel.js — Modelo de categorías.
 *
 * { id: "comida", nombre: "Comida", tipo: "gasto" | "ingreso", color: "orange", icono: "cart" }
 */

import { bus, EVENTS } from '../core/events.js';
import { DEFAULT_CATEGORIES, CATEGORY_COLORS } from '../config.js';

const STORE = 'categories';

/** "Café & Postres" → "cafe-postres" */
export function slugify(text) {
  return String(text)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'categoria';
}

const sameName = (a, b) => slugify(a) === slugify(b);

export class CategoryModel {
  constructor(db) {
    this.db = db;
    this.cache = [];
  }

  /** Carga las categorías; si es la primera vez, crea las predeterminadas */
  async init() {
    this.cache = await this.db.getAll(STORE);
    if (!this.cache.length) {
      await this.db.putMany(STORE, DEFAULT_CATEGORIES);
      this.cache = [...DEFAULT_CATEGORIES];
    }
    return this.cache;
  }

  all() {
    return this.cache;
  }

  byType(tipo) {
    return this.cache.filter((c) => c.tipo === tipo);
  }

  byId(id) {
    return (
      this.cache.find((c) => c.id === id) || {
        id,
        nombre: 'Sin categoría',
        tipo: 'gasto',
        color: 'gray',
        icono: 'dots',
      }
    );
  }

  findByName(nombre, tipo) {
    return this.cache.find((c) => sameName(c.nombre, nombre) && (!tipo || c.tipo === tipo));
  }

  async add({ nombre, tipo, color, icono }) {
    const name = String(nombre || '').trim().slice(0, 30);
    if (!name) throw new Error('Escribe un nombre para la categoría.');
    if (this.findByName(name, tipo)) throw new Error('Ya existe una categoría con ese nombre.');

    let id = slugify(name);
    if (this.cache.some((c) => c.id === id)) id = `${id}-${tipo}`;
    let n = 2;
    while (this.cache.some((c) => c.id === id)) id = `${slugify(name)}-${n++}`;

    const category = {
      id,
      nombre: name,
      tipo: tipo === 'ingreso' ? 'ingreso' : 'gasto',
      color: CATEGORY_COLORS.includes(color) ? color : 'gray',
      icono: icono || 'dots',
    };
    await this.db.put(STORE, category);
    this.cache.push(category);
    bus.emit(EVENTS.CATEGORIES_CHANGED, category);
    return category;
  }

  /** Devuelve la categoría con ese nombre o la crea (usado al importar Excel) */
  async ensure(nombre, tipo) {
    const found = this.findByName(nombre, tipo) || this.findByName(nombre);
    if (found) return found;
    const colors = CATEGORY_COLORS;
    const color = colors[this.cache.length % colors.length];
    return this.add({ nombre, tipo, color, icono: tipo === 'ingreso' ? 'arrow-in' : 'dots' });
  }
}
