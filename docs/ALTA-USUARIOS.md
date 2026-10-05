# Alta de usuarios — Proceso manual

> Cómo crear un usuario nuevo en el sistema mientras el Worker con Admin SDK (S1) no esté listo.
> **Última actualización:** 4 oct 2026

---

## Contexto

Un "usuario" en el sistema tiene **2 partes**:

1. **Cuenta de Authentication** (Firebase Auth) → email + contraseña.
2. **Doc en Firestore** (`usuarios/{uid}`) → nombre, documento, rol.

Ambas están ligadas por el **UID** (el mismo ID). Si el doc no existe o el UID no matchea, el usuario no puede entrar al panel.

**El alta manual requiere hacer los dos pasos a mano.**

---

## Roles disponibles

| Rol | Qué puede hacer |
|---|---|
| `admin` | Todo. Crear/editar clientes, gestionar usuarios, ver pagos, backups. |
| `ventas` | Crear clientes, editar datos comerciales, ver pagos. **No** puede cambiar roles ni ver la sección Usuarios. |
| `produccion` | Editar apariencia, fechas de producción y repos. **No** puede crear clientes ni ver pagos. |
| `nulo` | Sin acceso. El usuario existe pero no puede entrar al panel. |

---

## Pasos

### Paso 1 — Crear la cuenta en Firebase Auth

1. Ir a [Firebase Console](https://console.firebase.google.com/) → proyecto `cuentas-cop`.
2. Menú izquierdo → **Authentication**.
3. Pestaña **Users**.
4. Click en **"Add user"**.
5. Completar:
   - **Email**: el correo del usuario (ej: `juan@ejemplo.com`).
   - **Password**: una contraseña temporal (el usuario la puede cambiar después desde el panel con "Contraseña").
6. Click en **"Add user"**.
7. **Copiar el UID** que aparece en la lista (columna "User UID"). Es un string largo tipo `hb8ziusuzMeVYflWjsXn43VkcuT2`.

> ⚠️ **Anotá el UID en un lugar temporal.** Lo vas a necesitar en el paso 2.

---

### Paso 2 — Crear el doc en Firestore

1. En Firebase Console, menú izquierdo → **Firestore Database**.
2. Buscar la colección **`usuarios`**. Si no existe, crear una con ese nombre exacto.
3. Click en **"Add document"**.
4. En **Document ID**, pegar el UID copiado en el paso 1. **Tiene que ser exactamente el mismo.**
5. Agregar los siguientes **campos** (uno por uno):

| Campo | Tipo | Valor |
|---|---|---|
| `nombre` | string | Nombre del usuario |
| `apellido` | string | Apellido del usuario |
| `tipoDocumento` | string | `CC`, `PPT`, `Pasaporte`, `NIT`, etc. |
| `numeroDocumento` | string | Número sin puntos ni espacios |
| `email` | string | El mismo email del paso 1 |
| `rol` | string | `admin`, `ventas` o `produccion` |

6. Click en **"Save"**.

**Verificar:** el doc debe tener como ID **exactamente** el UID de Authentication. Si no coincide, el usuario no va a poder entrar al panel.

---

### Paso 3 — Verificar

1. Cerrar sesión en el panel `superadmin` (si estás logueado).
2. Loguearse con el nuevo usuario (email + contraseña temporal).
3. Verificar que:
   - Entra al panel sin errores.
   - El sidebar muestra los ítems según su rol.
   - El email aparece en la parte inferior del sidebar.

Si algo falla, ver la sección **"Troubleshooting"** abajo.

---

## Cambiar el rol de un usuario

Hay dos formas:

### Opción A — Desde el panel (recomendado)

1. Abrir `superadmin` con una cuenta admin.
2. Sidebar → **Usuarios**.
3. Buscar al usuario en la lista.
4. Cambiar el dropdown de rol al nuevo valor.
5. Si el nuevo rol es **"nulo"**, pide confirmación (porque revoca todos los permisos).

### Opción B — Directo en Firestore (avanzado)

1. Firebase Console → Firestore → `usuarios/{uid}`.
2. Editar el campo `rol` al nuevo valor.
3. Guardar.

> ⚠️ **No hacer esto salvo urgencia.** El panel valida que no te bajes tu propio rol, y Firestore también.

---

## Revocar acceso

Revocar = cambiar el rol a **`nulo`**.

**Qué pasa:**
- El usuario **sigue existiendo** en Auth y en Firestore.
- Al loguearse, el panel lo **rechaza y cierra la sesión** automáticamente (regla en `master.js`).
- No puede hacer nada hasta que se le asigne un rol válido.

**Cómo hacerlo:** desde el panel (sección Usuarios) → dropdown → "Revocado" → confirmar.

> ⚠️ **No borrar al usuario** de Auth ni de Firestore. Revocar es suficiente y reversible. Borrar deja registros huérfanos (por ejemplo, si creó clientes, esos clientes van a quedar con un `creadoPorUid` que ya no existe).

---

## Troubleshooting

### El usuario se loguea pero no entra al panel

**Causa probable:** el `rol` no es válido o el doc no existe.

**Verificar:**
1. En Firestore, `usuarios/{uid}` debe existir.
2. El campo `rol` debe ser **exactamente** uno de: `admin`, `ventas`, `produccion`. No `Admin`, no `ADMIN`, no `ventas ` (con espacio).
3. Si el doc no existe, crearlo (paso 2).

### El usuario entra pero no ve nada

**Causa probable:** el rol es correcto pero las reglas de Firestore bloquean por otro motivo.

**Verificar:**
- En la consola del navegador (F12) → buscar errores tipo `permission-denied`. Copiarlos.

### El dropdown de rol en la sección Usuarios está deshabilitado

**Es correcto.** No podés cambiar tu propio rol. Necesitás que otro admin lo haga.

---

## Pendiente futuro (S1)

Cuando el Worker con Firestore Admin SDK esté listo (pendiente **S1** en `PENDIENTES.md`), el alta se va a poder hacer **desde el panel** con un botón "Nuevo Usuario" que:

1. Crea la cuenta en Auth.
2. Crea el doc en Firestore con los datos que cargues en un formulario.
3. Asigna el rol automáticamente.

Ese botón **no existe hoy**. Este documento queda como referencia del proceso manual, y como "antes" para cuando llegue S1.

---

## Ver también

- [`PENDIENTES.md`](./PENDIENTES.md) — Listado consolidado.
- [`MENU-CONFIGURABLE.md`](./MENU-CONFIGURABLE.md) — Guía del template de menú.