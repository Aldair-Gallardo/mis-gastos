# Mis Gastos

App web instalable (PWA) para controlar gastos e ingresos, con respaldo en Excel.
Funciona en iPhone, Android, iPad, tabletas y computadoras, y también sin conexión.

- **Sin servidor ni base de datos en la nube**: los datos se guardan en el dispositivo (IndexedDB).
- **Respaldo en Excel**: un archivo `.xlsx` por mes, que se puede volver a importar.
- **Modo claro y modo noche**, automático o elegido a mano.

---

## Cómo abrirla en Visual Studio Code

1. Descomprime el `.zip` y abre la carpeta `mis-gastos` en VS Code (**Archivo → Abrir carpeta**).
2. Instala la extensión **Live Server** (VS Code te la sugerirá al abrir la carpeta).
3. Haz clic derecho sobre `index.html` → **Open with Live Server**.

> No abras los archivos con doble clic (`file://...`). Los módulos de JavaScript y el modo
> sin conexión solo funcionan desde un servidor, aunque sea local.

Para probar en tu celular mientras programas, conecta el celular a la misma red Wi-Fi y abre
la dirección que muestra Live Server cambiando `127.0.0.1` por la IP de tu computadora.
La instalación completa solo funciona con HTTPS, así que pruébala ya publicada.

---

## Estructura del proyecto (MVC)

```
mis-gastos/
├── index.html              Página de bienvenida con el botón "Instalar app"
├── app.html                La aplicación
├── manifest.webmanifest    Nombre, íconos y colores para instalarla
├── sw.js                   Service Worker: modo sin conexión y actualizaciones
│
├── css/
│   ├── base.css            Variables de color (temas claro/noche), reset y tipografía
│   ├── layout.css          Estructura: barra inferior (celular) y menú lateral (tablet)
│   ├── components.css      Tarjetas, botones, listas, gráficas, formularios, hojas, avisos
│   └── landing.css         Estilos de la página de bienvenida
│
├── js/
│   ├── app.js              Arranque de la app: crea modelos, servicios y controladores
│   ├── landing.js          Arranque de la página de bienvenida
│   ├── config.js           Nombre, versión, categorías iniciales, monedas
│   │
│   ├── core/               Herramientas base
│   │   ├── db.js           Acceso a IndexedDB
│   │   ├── router.js       Navegación entre pantallas (#/inicio, #/historial...)
│   │   ├── events.js       Bus de eventos (los modelos avisan cambios)
│   │   ├── state.js        Estado de la interfaz (mes que se está viendo)
│   │   ├── format.js       Dinero y fechas
│   │   ├── icons.js        Íconos SVG
│   │   └── dom.js          Utilidades de HTML
│   │
│   ├── models/             M — Datos
│   │   ├── MovementModel.js    Gastos e ingresos
│   │   ├── CategoryModel.js    Categorías
│   │   ├── BudgetModel.js      Presupuestos
│   │   └── SettingsModel.js    Ajustes (tema, moneda, último respaldo)
│   │
│   ├── views/              V — Lo que se ve (solo HTML, sin lógica de datos)
│   │   ├── View.js, partials.js
│   │   ├── ShellView.js, HomeView.js, StatsView.js, HistoryView.js, BackupView.js
│   │   ├── MovementFormView.js, CategoryFormView.js, BudgetFormView.js
│   │   ├── ExportReadyView.js, WelcomeView.js, LandingView.js
│   │   └── ui/Sheet.js, ui/Toast.js
│   │
│   ├── controllers/        C — Conectan modelos y vistas
│   │   ├── Controller.js           Clase base
│   │   ├── HomeController.js       Inicio
│   │   ├── StatsController.js      Estadísticas
│   │   ├── HistoryController.js    Historial
│   │   ├── BackupController.js     Respaldo y ajustes
│   │   ├── MovementController.js   Agregar / editar / eliminar
│   │   ├── BudgetController.js     Presupuestos
│   │   └── LandingController.js    Botón "Instalar app"
│   │
│   └── services/           Lógica reutilizable
│       ├── ExcelService.js       Crear y leer .xlsx
│       ├── BackupService.js      Exportar meses / importar archivos
│       ├── FileService.js        Compartir o descargar archivos
│       ├── StatsService.js       Totales, categorías, semanas, presupuestos
│       ├── RecurrenceService.js  Gastos que se repiten cada mes
│       ├── ThemeService.js       Modo claro / noche
│       └── InstallService.js     Instalación (PWA) y service worker
│
├── vendor/exceljs.min.js   Librería ExcelJS (licencia MIT)
└── assets/icons/           Íconos de la app
```

**Cómo fluye la información:**
la persona toca algo → la **vista** avisa al **controlador** → el controlador usa el **modelo**
(y los servicios) → el modelo guarda y emite un evento → los controladores que escuchan ese
evento piden datos nuevos y la **vista** se vuelve a dibujar.

---

## Publicar en GitHub Pages (gratis)

1. Crea una cuenta en [github.com](https://github.com) si no tienes.
2. Crea un repositorio nuevo, por ejemplo `mis-gastos` (público).
3. Sube **el contenido** de la carpeta (que `index.html` quede en la raíz del repositorio):
   botón **Add file → Upload files** y arrastra todo.
4. Ve a **Settings → Pages**. En *Source* elige **Deploy from a branch**, rama `main`, carpeta `/ (root)` y guarda.
5. En 1–2 minutos estará en `https://TU-USUARIO.github.io/mis-gastos/`.

Comparte esa dirección: es la página de bienvenida con el botón **Instalar app**.

### Al publicar cambios

En `sw.js` sube el número de versión, por ejemplo `const CACHE_VERSION = 'v2';`.
Si agregas archivos nuevos, añádelos también a la lista `APP_FILES` de `sw.js`.
Los teléfonos descargarán la versión nueva la próxima vez que abran la app.

---

## Cómo funciona la instalación

| Dispositivo | Qué pasa al tocar "Instalar app" | Mensaje de éxito |
|---|---|---|
| Android / tabletas Android (Chrome) | Se abre la ventana de instalación del sistema | Aparece en la página al terminar |
| Computadora (Chrome / Edge) | Igual que Android | Aparece en la página al terminar |
| iPhone / iPad (Safari) | Se muestra una guía: Compartir → Agregar a inicio | Aparece al abrir la app desde su ícono |

Apple no permite que una página web se instale sola con un botón; por eso en iPhone y iPad
se muestra la guía.

---

## Formato del Excel

Cada archivo se llama `Gastos-AAAA-MM.xlsx` y tiene dos hojas:

- **Movimientos**: `ID | Fecha | Tipo | Categoría | Monto | Nota | Recurrente`
- **Resumen**: ingresos, gastos, balance y total por categoría.

Al importar:
- Se pueden elegir varios archivos a la vez.
- Los movimientos con un `ID` que ya existe se omiten (no se duplican).
- Si una categoría no existe, se crea.
- Si editas el archivo en Excel, mantén los nombres de las columnas. La columna `ID` puede
  quedar vacía en filas nuevas.

---

## Personalizar

- **Nombre de la app**: `js/config.js` (`APP_NAME`), `manifest.webmanifest`, y los `<title>` de los HTML.
- **Colores**: variables al inicio de `css/base.css`.
- **Categorías iniciales y monedas**: `js/config.js`.
