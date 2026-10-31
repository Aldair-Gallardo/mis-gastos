/**
 * ThemeService.js — Aplica el tema claro u oscuro (noche).
 * 'system' sigue la configuración del dispositivo y cambia sola.
 */

const THEME_COLORS = { light: '#F3F4F8', dark: '#0B0A10' };

export class ThemeService {
  constructor() {
    this.preference = 'system';
    this.media = window.matchMedia('(prefers-color-scheme: dark)');
    this.media.addEventListener?.('change', () => {
      if (this.preference === 'system') this.apply('system');
    });
  }

  resolve(preference) {
    if (preference === 'light' || preference === 'dark') return preference;
    return this.media.matches ? 'dark' : 'light';
  }

  apply(preference) {
    this.preference = preference || 'system';
    const theme = this.resolve(this.preference);
    document.documentElement.dataset.theme = theme;
    document.querySelectorAll('meta[name="theme-color"]').forEach((meta) => {
      meta.setAttribute('content', THEME_COLORS[theme]);
    });
    try {
      localStorage.setItem('mg-theme', this.preference);
    } catch {
      /* modo privado: no pasa nada */
    }
    return theme;
  }
}
