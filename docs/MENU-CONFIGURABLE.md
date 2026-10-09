# menu-configurable — Template de menú digital

> Guía para crear el menú digital de un cliente nuevo.
> **Última actualización:** 8 oct 2026

---

## ¿Qué es?

`menu-configurable` es un **template repository** de GitHub. Cada vez que se crea un cliente nuevo, se genera un repo privado a partir de este template (botón **"Use this template"**).

El repo privado contiene el **código** del menú (HTML/CSS/JS). Los **datos** (imágenes + `menu.json`) viven en un segundo repo, **público**, separado.

---

## Estructura de repos por cliente

Cada cliente tiene **2 repositorios**, con la siguiente convención de nombres:

| Repo | Visibilidad | Nombre | Contenido |
|---|---|---|---|
| Código | 🔒 Privado | `menu-{slug}-private` | HTML/CSS/JS del menú |
| Assets | 🌐 Público | `menu-{slug}-assets` | Imágenes + `menu.json` |

**Ejemplo** para un cliente "Sukidesu":
- `menu-sukidesu-private` (privado)
- `menu-sukidesu-assets` (público)

**Ejemplo real** para el cliente de prueba "Menu Test":
- `menu-test-private`
- `menu-test-assets`

---

## Cómo crear un cliente nuevo

### Paso 1 — Crear los 2 repos en GitHub

1. Ir al template `menu-configurable` en GitHub.
2. Click en **"Use this template"** → **"Create a new repository"**.
3. Nombre: `menu-{slug}-private`. Visibilidad: **Privado**.
4. Crear un segundo repo **vacío**: nombre `menu-{slug}-assets`. Visibilidad: **Público**.

### Paso 2 — Configurar el proyecto de Firebase del cliente

Cada cliente tiene **su propio proyecto Firebase** (aislado de la agencia):
- Crear proyecto en [Firebase Console](https://console.firebase.google.com/).
- Habilitar Firestore.
- Habilitar Authentication (email/contraseña).
- Crear usuario admin del cliente (si aplica).

### Paso 3 — Deploy a Cloudflare Pages

**⚠️ Importante:** se usa **Cloudflare Pages** (NO Workers). Pages envía CORS automáticamente; Workers no.

Para cada uno de los 2 repos:

1. Cloudflare Dashboard → **Workers & Pages**.
2. **Create application** → pestaña **Pages** → **Import an existing Git repository**.
3. Seleccionar el repo.
4. Configurar:
   - **Project name:** igual al nombre del repo (ej: `menu-{slug}-private`).
   - **Production branch:** `main`.
   - **Framework preset:** `None`.
   - **Build command:** (vacío).
   - **Build output directory:** `/`.
5. **Save and Deploy**.

**Resultado:**
- `menu-{slug}-private.pages.dev` → web que ve el comensal
- `menu-{slug}-assets.pages.dev` → repo de assets

### Paso 4 — Crear el `menu.json` semilla en el repo de assets

En el repo `menu-{slug}-assets`, crear un archivo `menu.json` en la **raíz** con:

```json
{
  "items": [],
  "categories": [],
  "config": {
    "estado_servicio": "activo",
    "promo_activa": "false"
  },
  "tema": {}
}


//También crear un index.html mínimo (para que Cloudflare detecte archivos estáticos al deployar).

Paso 5 — Editar js/config.js en el repo privado
En el repo menu-{slug}-private, editar js/config.js con los datos del cliente:

cliente.* — nombre, eslogan, WhatsApp, correo, datos legales.

firebase.* — credenciales del proyecto Firebase del cliente.

urls.produccion — https://menu-{slug}-private.pages.dev

urls.recursosCdn — https://menu-{slug}-assets.pages.dev

github.repoPath — {usuario-github}/{menu-{slug}-assets}

ui.app_prefix — prefijo único por cliente (para localStorage).

Paso 6 — Registrar el cliente en superadmin
Abrir el panel superadmin.

Click en "Nuevo Cliente".

Completar el formulario (nombre, documento, teléfono, correo).

Guardar.

Paso 7 — Cargar credenciales en la Bóveda
En superadmin, ficha del cliente → tab Bóveda:

GitHub: token (con scope repo), repo privado, repo público, branch (main), path del menu.json (menu.json).

Firebase: project ID, API key, contraseña.

Cloudflare: account ID, API token, zone ID, contraseña.

Google: correo, contraseña.

Paso 8 — Configurar apariencia y publicar
Ficha del cliente → tab Apariencia.

Elegir colores, tipografías, tamaños.

Guardar Apariencia → guarda en Firestore.

Publicar en GitHub → el Worker escribe el menu.json en el repo público con la apariencia elegida.

Paso 9 — Verificar
Abrir la URL del cliente: https://menu-{slug}-private.pages.dev.
Debe cargar el menú con los colores y tipografías configurados.

¿Qué archivos se editan a mano?
Solo js/config.js. Todo lo demás (apariencia, colores, tipografía) se configura desde el panel superadmin.

Nota sobre el config.js: es el único archivo que hay que tocar por cliente. Contiene AppConfig con datos del cliente + credenciales de Firebase + URLs + repos.

Notas
El proyecto usa Tailwind v4 con @theme y @layer utilities. En Tailwind v4, las variables --size-* colisionan con las utilidades nativas size-* (que generan width + height). Por eso las variables de tamaño de fuente se llaman --fs-*.

Los cambios de apariencia se aplican al menu.json vía Worker y viajan al cliente en tiempo real (sin redeploy manual).

Ver también
PENDIENTES.md — Listado consolidado de pendientes vivos.

ALTA-USUARIOS.md — Cómo crear usuarios.



