/**
 * router.js — Navegación entre pantallas usando el "#" de la dirección.
 * Ejemplo: app.html#/historial
 *
 * Cada ruta apunta a un controlador con los métodos mount(container) y unmount().
 */

export class Router {
  /**
   * @param {Object<string, {mount: Function, unmount?: Function}>} routes
   * @param {HTMLElement} container  donde se dibuja la pantalla
   * @param {string} defaultRoute
   * @param {(route: string) => void} onChange  avisa a la vista principal (menús)
   */
  constructor(routes, container, defaultRoute, onChange) {
    this.routes = routes;
    this.container = container;
    this.defaultRoute = defaultRoute;
    this.onChange = onChange;
    this.current = null;
    this.currentController = null;
    this.handle = this.handle.bind(this);
  }

  start() {
    window.addEventListener('hashchange', this.handle);
    this.handle();
  }

  /** Ruta actual a partir del hash, por ejemplo "#/historial" → "historial" */
  parse() {
    const name = location.hash.replace(/^#\/?/, '').split('?')[0];
    return this.routes[name] ? name : this.defaultRoute;
  }

  go(route) {
    if (location.hash === `#/${route}`) this.handle();
    else location.hash = `#/${route}`;
  }

  async handle() {
    const route = this.parse();
    if (route === this.current) return;

    this.currentController?.unmount?.();
    this.current = route;
    this.currentController = this.routes[route];
    this.onChange?.(route);

    this.container.innerHTML = '';
    window.scrollTo(0, 0);
    try {
      await this.currentController.mount(this.container);
    } catch (error) {
      console.error(error);
      this.container.innerHTML = '<p class="empty">No se pudo cargar esta pantalla.</p>';
    }
  }
}
