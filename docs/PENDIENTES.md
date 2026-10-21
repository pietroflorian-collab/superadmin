# 📋 PENDIENTES — Panel Superadmin

> Listado consolidado de pendientes vivos. Actualizar al cierre de cada sesión.
> **Última actualización:** 15 oct 2026

---

## 🔴 Seguridad

| # | Item | Contexto | Estado |
|---|---|---|---|
| S0 | **Worker: validación de rol real** | El Worker consulta `usuarios/{uid}.rol` en Firestore. Admin y producción pueden publicar. Ventas solo accede a clientes. | ✅ Cerrado |
| S1 | **Worker con Firestore Admin SDK** | Permite crear usuarios desde el panel sin hardcodear UIDs. Requiere plan Blaze o adaptar Worker con Admin SDK. | Bloqueado hasta tener 2+ admins reales |
| S2 | **Tokens en claro en Firestore** | Aceptado como riesgo. Los tokens viven en `clientes_agencia/{id}/secretos/*` protegidos por reglas. Solución futura: mover a Cloudflare secrets por cliente. | Aceptado |
| S3 | **API key de Firebase en el código** | Pública por diseño. Evaluado, no es problema. | ✅ Cerrado |
| S4 | **Limpiar historial de git** | El commit `c810347` todavía contiene `service-account.json` en el historial. La clave fue invalidada y el archivo removido de la rama actual, pero sigue en el historial. Solución: `git filter-repo` + `push --force`. | Pendiente (opcional, repo privado) |

---

## 🟡 Funcionalidad

| # | Item | Contexto |
|---|---|---|
| F1 | **Sección "Usuarios"** | ✅ Cerrado — drawer con listado, cambio de rol inline, revocar, filtros. |
| F2 | **Schema completo de `usuarios`** | ✅ Cerrado — docs con `nombre`, `apellido`, `tipoDocumento`, `numeroDocumento`, `email`, `rol`. |
| F3 | **Guardar `creadoPorTipoDoc` y `creadoPorNumDoc`** | ✅ Cerrado y verificado en backup. |
| F4 | **Mostrar Comercial con nombre + apellido + tipo + nº doc** | ✅ Cerrado — formato nombre arriba, "PPT 1746765" abajo en gris. |
| F5 | **Fix `backup.js` para ventas/producción** | ✅ Cerrado — cada colección con try/catch, `usuarios` solo para admin. |
| F6 | **Kill Switch end-to-end** | ✅ Cerrado — al suspender/reactivar un cliente desde Gestión de Pagos, el Worker actualiza `config.estado_servicio` en `menu.json`. El menú muestra pantalla de mantenimiento (con el tema del cliente) al estar suspendido. |

---

## 🟡 Cosmético / UX

| # | Item | Contexto |
|---|---|---|
| U1 | **Animaciones de transición (7D)** | Transiciones entre vistas, apertura de modales, etc. Pendiente desde sesión 22-sep. |
| U2 | **FOUC del tema del menú** | Flash del tema al cargar el menú público. Descartado conscientemente. |

---

## 🟢 Circuito multi-cliente (COMPLETADO 6 oct 2026)

Primera implementación funcional del flujo SaaS end-to-end para un cliente.

| Pieza | Estado |
|---|---|
| Cuenta GitHub del cliente (`pietrofloriano23`) | ✅ |
| Repo privado de código (`menu-test-private`) | ✅ |
| Repo público de assets (`menu-test-assets`) | ✅ |
| Cloudflare Pages para la web (`menu-test-code.pages.dev`) | ✅ |
| Cloudflare Pages para los assets (`menu-test-assets.pages.dev`) | ✅ |
| Worker del superadmin deployado (`superadmin-worker.pietro-florian.workers.dev`) | ✅ |
| Superadmin deployado en Cloudflare Pages (`superadmin-3eb.pages.dev`) | ✅ |
| Cliente de prueba registrado en el panel | ✅ |
| CORS resuelto (Pages ≠ Workers) | ✅ |
| Fix de Tailwind v4 (`--size-*` → `--fs-*`) | ✅ |
| Cambios de apariencia en tiempo real | ✅ |
| Kill Switch funcional (suspender/reactivar) | ✅ |

**URLs del cliente de prueba:**
- Web: `https://menu-test-code.pages.dev`
- Assets: `https://menu-test-assets.pages.dev`
- Worker: `https://superadmin-worker.pietro-florian.workers.dev`
- Panel Maestro: `https://superadmin-3eb.pages.dev`

**Lo que quedó pendiente de este flujo:**
- Arreglar la imagen `bg-layout.png` (no existe; usar `fondo-ondas.png` o fondo liso).
- Limpiar el `.dev.vars` del Worker (solo tiene placeholder).
- Implementar los otros 3 sistemas visuales (Material, Ant, Cloudscape).

---

## 🟢 Sistemas visuales (COMPLETADO 15 oct 2026)

**Objetivo:** Cada cliente tiene UN sistema visual asignado (`sistemaVisual` en Firestore). El panel carga dinámicamente el módulo correspondiente y muestra SOLO los controles de ese sistema. Arquitectura de plugins: agregar un sistema nuevo = agregar un archivo en `js/modulos/sistemas/{key}.js` + una entrada en `sistemas-visuales.js`.

**Sistemas actuales:**
- `sukidesu` — Clásico Oscuro: 10 colores + 27 tipografías + 27 tamaños + radio
- `shadcn` — Shadcn Elegante: 5 colores + 2 tipografías + radio

**Fase 1 (COMPLETADA):**
- ✅ Campo `sistemaVisual` agregado a los 2 clientes en Firestore
- ✅ Registro `js/config/sistemas-visuales.js` con metadata + loader dinámico

**Fase 2 (COMPLETADA 15 oct 2026):**
- ✅ Refactor de `gestionar.js` → orquestador puro (no conoce ningún sistema)
- ✅ Cada sistema vive en `js/modulos/sistemas/{key}.js` con contrato `{ meta, render, leer }`
- ✅ Render dinámico: los controles se generan desde el schema del módulo
- ✅ Bloqueo cruzado automático: `leer()` solo devuelve campos del schema propio
- ✅ `gestionar-page.js` limpio: sin listeners de color/tipografía hardcodeados

**Fase 3 (COMPLETADA 15 oct 2026):**
- ✅ Selector de sistemas cuando el cliente no tiene `sistemaVisual` asignado
- ✅ Acción `seleccionarSistema(key)`: escribe en Firestore + recarga el panel
- ✅ Botón "Cambiar sistema" con confirmación y aviso de borrado de apariencia
- ✅ Recarga directa al panel si el cliente ya tiene sistema asignado
- ✅ Probado con sukidesu y shadcn: diseño no se rompe al cambiar colores

---

## ⚪ Producto grande (roadmap)

| # | Item | Contexto |
|---|---|---|
| P1 | **Portafolio de sistemas visuales** | ✅ Cerrado 15 oct 2026 — 5 sistemas disponibles: `sukidesu` (oscuro clásico), `shadcn` (claro elegante), `material` (Google), `editorial` (revista), `minimal` (Apple). Cada uno vive en `js/modulos/sistemas/{key}.js`. |
| P2 | **Panel multi-sistema** | ✅ Cerrado 16 oct 2026 — selector de sistema visual en el drawer "Nuevo Cliente" (admin + ventas). Filtro por sistema en la tabla principal. Apariencia inicializa vacía. |
| P3 | **IA de onboarding** | Analizar Instagram/URL del cliente → extraer paleta + tipografía → pre-rellenar el Motor de Apariencia. |
| P4 | **Usuario de ventas y producción reales** | Actualmente hay usuarios de prueba. Falta crear los definitivos con sus datos completos. |

---

## 🟡 Documentación

| # | Item | Contexto |
|---|---|---|
| D1 | **`PENDIENTES.md`** | ✅ Este archivo. |
| D2 | **README del `menu-configurable`** | ✅ Cerrado — en `docs/MENU-CONFIGURABLE.md` (con algunos pasos por completar). |
| D3 | **Proceso de alta de usuarios** | ✅ Cerrado — en `docs/ALTA-USUARIOS.md`. |
| D4 | **README de sistemas visuales** | ⚪ Pendiente — documentar el contrato `{ meta, render, leer }` y cómo agregar un sistema nuevo. |

---

## 🟡 Limpieza técnica

| # | Item | Contexto |
|---|---|---|
| L1 | **`admin-claim-tool/`** | ✅ Borrado del repo y del disco. Era tool de un solo uso. |
| L2 | **`backup.js`** | ✅ Verificado y arreglado. |
| L3 | **`focus-trap.js`** | ✅ Verificado — sigue siendo necesario en 3 lugares. |
| L4 | **`admins/{uid}`** | ✅ Doc eliminado en Firestore. Colección obsoleta. |
| L5 | **Código legacy de apariencia** | ✅ Eliminado en el refactor del 15 oct — `leerAparienciaDelDOM` viejo, `ZONAS_TIPOGRAFIA`, `construirTipografia`, listeners de color hardcodeados. |

---

## 📊 Métricas

- **Pendientes vivos:** 5 (2 seguridad, 0 funcionales, 2 UX, 1 producto, 1 documentación)
- **Sistemas visuales disponibles:** 5 (sukidesu, shadcn, material, editorial, minimal)
- **Circuitos completados:** 3 (cliente end-to-end + arquitectura plugins + creación multi-sistema)
- **Bugs activos:** 0
- **Deuda técnica:** historial de git (S4), Worker Admin SDK (S1)

---

## 🎯 Orden sugerido de próximas sesiones

1. **Sesión 1:** S1 (Worker con Firestore Admin SDK) — desbloquea P4 y automatiza el alta de usuarios. Es el mayor cuello de botella operativo actual.
2. **Sesión 2:** D4 (README de sistemas visuales) + U1 (animaciones de transición). Ambas tareas de calidad de vida.
3. **Sesión 3:** P3 (IA de onboarding) — el gancho comercial más fuerte.
4. **Cuando haya tiempo:** S4 (limpiar historial de git).

---

## 🔴 Seguridad

| # | Item | Contexto | Estado |
|---|---|---|---|
| S0 | **Worker: validación de rol real** | El Worker consulta `usuarios/{uid}.rol` en Firestore. Admin y producción pueden publicar. Ventas solo accede a clientes. | ✅ Cerrado |
| S1 | **Worker con Firestore Admin SDK** | Permite crear usuarios desde el panel sin hardcodear UIDs. Requiere plan Blaze o adaptar Worker con Admin SDK. | Bloqueado hasta tener 2+ admins reales || S1 | **Creación de usuarios desde el panel** | ✅ Cerrado 16 oct 2026 — Implementado vía *Secondary App* en el frontend (sin necesidad de Worker ni plan Blaze). El admin crea cuentas desde el drawer de Usuarios sin perder su sesión. |
| S2 | **Tokens en claro en Firestore** | Aceptado como riesgo. Los tokens viven en `clientes_agencia/{id}/secretos/*` protegidos por reglas. Solución futura: mover a Cloudflare secrets por cliente. | Aceptado |
| S3 | **API key de Firebase en el código** | Pública por diseño. Evaluado, no es problema. | ✅ Cerrado |
| S4 | **Limpiar historial de git** | ✅ Cerrado 20 oct 2026 — Archivo `service-account.json` eliminado de todo el historial usando `git filter-branch` y `push --force`. Repo limpio. |

---

## 🟡 Funcionalidad

| # | Item | Contexto |
|---|---|---|
| F1 | **Sección "Usuarios"** | ✅ Cerrado — drawer con listado, cambio de rol inline, revocar, filtros. |
| F2 | **Schema completo de `usuarios`** | ✅ Cerrado — docs con `nombre`, `apellido`, `tipoDocumento`, `numeroDocumento`, `email`, `rol`. |
| F3 | **Guardar `creadoPorTipoDoc` y `creadoPorNumDoc`** | ✅ Cerrado y verificado en backup. |
| F4 | **Mostrar Comercial con nombre + apellido + tipo + nº doc** | ✅ Cerrado — formato nombre arriba, "PPT 1746765" abajo en gris. |
| F5 | **Fix `backup.js` para ventas/producción** | ✅ Cerrado — cada colección con try/catch, `usuarios` solo para admin. |
| F6 | **Kill Switch end-to-end** | ✅ Cerrado — al suspender/reactivar un cliente desde Gestión de Pagos, el Worker actualiza `config.estado_servicio` en `menu.json`. El menú muestra pantalla de mantenimiento (con el tema del cliente) al estar suspendido. |

---

## 🟡 Cosmético / UX

| # | Item | Contexto |
|---|---|---|
| U1 | **Animaciones de transición (7D)** | ✅ Cerrado 19 oct 2026 — Fade-in en pestañas, scale-up en modales, hover effects en botones. |
| U2 | **FOUC del tema del menú** | Flash del tema al cargar el menú público. Descartado conscientemente. |
| U3 | **Fondo visual global** | ✅ Cerrado 19 oct 2026 — Imagen de hexágonos en login, superadmin y gestionar con efecto Glassmorphism en las barras. |

---

## 🟢 Circuito multi-cliente (COMPLETADO 6 oct 2026)

Primera implementación funcional del flujo SaaS end-to-end para un cliente.

| Pieza | Estado |
|---|---|
| Cuenta GitHub del cliente (`pietrofloriano23`) | ✅ |
| Repo privado de código (`menu-test-private`) | ✅ |
| Repo público de assets (`menu-test-assets`) | ✅ |
| Cloudflare Pages para la web (`menu-test-code.pages.dev`) | ✅ |
| Cloudflare Pages para los assets (`menu-test-assets.pages.dev`) | ✅ |
| Worker del superadmin deployado (`superadmin-worker.pietro-florian.workers.dev`) | ✅ |
| Superadmin deployado en Cloudflare Pages (`superadmin-3eb.pages.dev`) | ✅ |
| Cliente de prueba registrado en el panel | ✅ |
| CORS resuelto (Pages ≠ Workers) | ✅ |
| Fix de Tailwind v4 (`--size-*` → `--fs-*`) | ✅ |
| Cambios de apariencia en tiempo real | ✅ |
| Kill Switch funcional (suspender/reactivar) | ✅ |

**URLs del cliente de prueba:**
- Web: `https://menu-test-code.pages.dev`
- Assets: `https://menu-test-assets.pages.dev`
- Worker: `https://superadmin-worker.pietro-florian.workers.dev`
- Panel Maestro: `https://superadmin-3eb.pages.dev`

**Lo que quedó pendiente de este flujo:**
- Arreglar la imagen `bg-layout.png` (no existe; usar `fondo-ondas.png` o fondo liso).
- Limpiar el `.dev.vars` del Worker (solo tiene placeholder).
- Implementar los otros 3 sistemas visuales (Material, Ant, Cloudscape).

---

## 🟢 Sistemas visuales (COMPLETADO 15 oct 2026)

**Objetivo:** Cada cliente tiene UN sistema visual asignado (`sistemaVisual` en Firestore). El panel carga dinámicamente el módulo correspondiente y muestra SOLO los controles de ese sistema. Arquitectura de plugins: agregar un sistema nuevo = agregar un archivo en `js/modulos/sistemas/{key}.js` + una entrada en `sistemas-visuales.js`.

**Sistemas actuales:**
- `sukidesu` — Clásico Oscuro: 10 colores + 27 tipografías + 27 tamaños + radio
- `shadcn` — Shadcn Elegante: 5 colores + 2 tipografías + radio

**Fase 1 (COMPLETADA):**
- ✅ Campo `sistemaVisual` agregado a los 2 clientes en Firestore
- ✅ Registro `js/config/sistemas-visuales.js` con metadata + loader dinámico

**Fase 2 (COMPLETADA 15 oct 2026):**
- ✅ Refactor de `gestionar.js` → orquestador puro (no conoce ningún sistema)
- ✅ Cada sistema vive en `js/modulos/sistemas/{key}.js` con contrato `{ meta, render, leer }`
- ✅ Render dinámico: los controles se generan desde el schema del módulo
- ✅ Bloqueo cruzado automático: `leer()` solo devuelve campos del schema propio
- ✅ `gestionar-page.js` limpio: sin listeners de color/tipografía hardcodeados

**Fase 3 (COMPLETADA 15 oct 2026):**
- ✅ Selector de sistemas cuando el cliente no tiene `sistemaVisual` asignado
- ✅ Acción `seleccionarSistema(key)`: escribe en Firestore + recarga el panel
- ✅ Botón "Cambiar sistema" con confirmación y aviso de borrado de apariencia
- ✅ Recarga directa al panel si el cliente ya tiene sistema asignado
- ✅ Probado con sukidesu y shadcn: diseño no se rompe al cambiar colores

---

## ⚪ Producto grande (roadmap)

| # | Item | Contexto |
|---|---|---|
| P1 | **3 sistemas visuales nuevos** | Material, Ant, Cloudscape. Cada uno es un archivo en `js/modulos/sistemas/` + entrada en el registro. El template base ya está resuelto (contrato `{ meta, render, leer }`). |
| P2 | **Panel multi-sistema** | 🟡 Parcial — la asignación y cambio de sistema funciona desde `gestionar.html`. Falta: permitir elegir el sistema **al crear** un cliente (en `superadmin.html` → drawer "Nuevo Cliente"). |
| P3 | **IA de onboarding** | Analizar Instagram/URL del cliente → extraer paleta + tipografía → pre-rellenar el Motor de Apariencia. |
| P4 | **Usuario de ventas y producción reales** | Actualmente hay usuarios de prueba. Falta crear los definitivos con sus datos completos. |

---

## 🟡 Documentación

| # | Item | Contexto |
|---|---|---|
| D1 | **`PENDIENTES.md`** | ✅ Este archivo. |
| D2 | **README del `menu-configurable`** | ✅ Cerrado — en `docs/MENU-CONFIGURABLE.md` (con algunos pasos por completar). |
| D3 | **Proceso de alta de usuarios** | ✅ Cerrado — en `docs/ALTA-USUARIOS.md`. |
| D4 | **README de sistemas visuales** | ⚪ Pendiente — documentar el contrato `{ meta, render, leer }` y cómo agregar un sistema nuevo. |

---

## 🟡 Limpieza técnica

| # | Item | Contexto |
|---|---|---|
| L1 | **`admin-claim-tool/`** | ✅ Borrado del repo y del disco. Era tool de un solo uso. |
| L2 | **`backup.js`** | ✅ Verificado y arreglado. |
| L3 | **`focus-trap.js`** | ✅ Verificado — sigue siendo necesario en 3 lugares. |
| L4 | **`admins/{uid}`** | ✅ Doc eliminado en Firestore. Colección obsoleta. |
| L5 | **Código legacy de apariencia** | ✅ Eliminado en el refactor del 15 oct — `leerAparienciaDelDOM` viejo, `ZONAS_TIPOGRAFIA`, `construirTipografia`, listeners de color hardcodeados. |

---

## 📊 Métricas

## 📊 Métricas

- **Pendientes vivos:** 1 (0 seguridad, 0 funcionales, 0 UX, 1 producto, 0 documentación)
- **Sistemas visuales disponibles:** 5 (sukidesu, shadcn, material, editorial, minimal)
- **Circuitos completados:** 6 (end-to-end, plugins visuales, multi-sistema, alta usuarios, UI polish, limpieza git)
- **Bugs activos:** 0
- **Deuda técnica:** 0

---

## 🎯 Orden sugerido de próximas sesiones

1. **Sesión 1:** P3 (IA de Onboarding) — El gancho comercial más fuerte para el portafolio.
2. **Cuando haya tiempo:** S4 (limpiar historial de git).