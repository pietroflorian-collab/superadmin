# menu-configurable — Template de menú digital

> Guía para crear el menú digital de un cliente nuevo.
> **Última actualización:** 4 oct 2026

---

## ¿Qué es?

`menu-configurable` es un **template repository** de GitHub. Cada vez que se crea un cliente nuevo, se genera un repo privado a partir de este template (botón **"Use this template"**).

El repo privado contiene el **código** del menú (HTML/CSS/JS). Los **datos** (imágenes + `menu.json`) viven en un segundo repo, **público**, separado.

---

## Estructura de repos por cliente

Cada cliente tiene **2 repositorios**:

| Repo | Visibilidad | Contenido | Quién escribe |
|---|---|---|---|
| `menu-{slug-cliente}` | 🔒 Privado | Código del menú (HTML/CSS/JS) | Solo el dev |
| `menu_{slug-cliente}` | 🌐 Público | Imágenes + `menu.json` | El panel `superadmin` vía Worker |

---

## Cómo crear un cliente nuevo

### Paso 1 — Crear los 2 repos en GitHub

1. Ir al template `menu-configurable` en GitHub.
2. Click en **"Use this template"** → **"Create a new repository"**.
3. Nombre: `menu-{slug-cliente}` (ej: `menu-cosa-nostra`). Visibilidad: **Privado**.
4. Crear un segundo repo vacío: nombre `menu_{slug-cliente}`. Visibilidad: **Público**.

### Paso 2 — Configurar el proyecto de Firebase

Cada cliente tiene **su propio proyecto Firebase**:
- Crear proyecto en [Firebase Console](https://console.firebase.google.com/).
- Habilitar Firestore.
- Habilitar Authentication (email/contraseña).
- Crear usuario admin del cliente (si aplica).

### Paso 3 — Deploy del código a Cloudflare Workers

🔧 **Por completar.** Falta documentar:
- Cómo se sube el código al Worker (`wrangler deploy`, dashboard, GitHub Actions…).
- Cómo se asigna el subdominio (`{cliente}.sukidesumenu.workers.dev`).
- Cómo se conecta el Worker al proyecto Firebase del cliente.

### Paso 4 — Cargar el `menu.json` inicial (semilla)

La primera vez, el menú se carga con un **JSON semilla**.

🔧 **Por completar:**
- ¿Dónde vive el JSON semilla? (¿en el template? ¿en un gist? ¿se copia a mano?)
- ¿Tiene estructura mínima o viene con platos de ejemplo?

### Paso 5 — Registrar el cliente en `superadmin`

1. Abrir el panel `superadmin`.
2. Click en **"Nuevo Cliente"**.
3. Completar el formulario (nombre, documento, teléfono, correo).
4. Guardar. El cliente queda con estado `Activo` / `Activo`.

### Paso 6 — Cargar credenciales en la Bóveda

En `superadmin`, ficha del cliente → tab **Bóveda**:

- **GitHub**: token, repo privado, repo público, branch, path del `menu.json`.
- **Firebase**: project ID, API key, contraseña.
- **Cloudflare**: account ID, API token, zone ID, contraseña.
- **Google**: correo, contraseña.

### Paso 7 — Configurar apariencia y publicar

1. Ficha del cliente → tab **Apariencia**.
2. Elegir colores, tipografías, tamaños.
3. **Guardar Apariencia** → guarda en Firestore.
4. **Publicar en GitHub** → el Worker escribe el `menu.json` en el repo público con la apariencia elegida.

### Paso 8 — Verificar

Abrir la URL del cliente: `https://{cliente}.sukidesumenu.workers.dev/`.
Debe cargar el menú con los colores y tipografías configurados.

---

## ¿Qué archivos se editan a mano?

🔧 **Por completar.** El objetivo del panel `superadmin` es **automatizar** esto lo más posible.

Pendiente de definir:
- ¿Qué archivos hay que tocar en el repo privado al crear un cliente? (¿`config.js`? ¿`wrangler.toml`? ¿`firebase.js`?)
- ¿Cómo se inyecta el project ID de Firebase?

**Nota:** este documento se va a actualizar a medida que el panel crezca.

---

## Notas

- El primer setup del template lo hizo el autor del proyecto hace tiempo. Los pasos de Cloudflare y los archivos exactos a editar están pendientes de reconstruir.
- Cuando el panel `superadmin` tenga el **Worker con Admin SDK** (pendiente S1), varios de estos pasos se van a poder hacer desde el panel.

---

## Ver también

- [`PENDIENTES.md`](./PENDIENTES.md) — Listado consolidado de pendientes vivos.
