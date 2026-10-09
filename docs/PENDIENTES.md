# 📋 PENDIENTES — Panel Superadmin

> Listado consolidado de pendientes vivos. Actualizar al cierre de cada sesión.
> **Última actualización:** 8 oct 2026

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

## ⚪ Producto grande (roadmap)

| # | Item | Contexto |
|---|---|---|
| P1 | **4 sistemas visuales nuevos** | Bold, Editorial, Minimal, 5º. Cada uno es un proyecto separado (HTML + CSS + JS). Se clonan desde un template base. |
| P2 | **Panel multi-sistema** | Al crear un cliente, elegir sistema visual. Campo opcional, editable después. |
| P3 | **IA de onboarding** | Analizar Instagram/URL del cliente → extraer paleta + tipografía → pre-rellenar el Motor de Apariencia. |
| P4 | **Usuario de ventas y producción reales** | Actualmente hay usuarios de prueba. Falta crear los definitivos con sus datos completos. |

---

## 🟡 Documentación

| # | Item | Contexto |
|---|---|---|
| D1 | **`PENDIENTES.md`** | ✅ Este archivo. |
| D2 | **README del `menu-configurable`** | ✅ Cerrado — en `docs/MENU-CONFIGURABLE.md` (con algunos pasos por completar). |
| D3 | **Proceso de alta de usuarios** | ✅ Cerrado — en `docs/ALTA-USUARIOS.md`. |

---

## 🟡 Limpieza técnica

| # | Item | Contexto |
|---|---|---|
| L1 | **`admin-claim-tool/`** | ✅ Borrado del repo y del disco. Era tool de un solo uso. |
| L2 | **`backup.js`** | ✅ Verificado y arreglado. |
| L3 | **`focus-trap.js`** | ✅ Verificado — sigue siendo necesario en 3 lugares. |
| L4 | **`admins/{uid}`** | ✅ Doc eliminado en Firestore. Colección obsoleta. |

---

## 📊 Métricas

- **Pendientes vivos:** 5 (2 seguridad, 0 funcionales, 2 UX, 4 producto, 0 documentación)
- **Circuitos completados:** 1 (cliente de prueba end-to-end)
- **Bugs activos:** 0
- **Deuda técnica:** historial de git (S4), Worker Admin SDK (S1)

---

## 🎯 Orden sugerido de próximas sesiones

1. **Sesión 1:** P1 + P2 (primer sistema visual + panel multi-sistema) — diferenciación comercial.
2. **Sesión 2:** S1 (Worker con Firestore Admin SDK) — desbloquea P4 y automatiza el alta de usuarios.
3. **Sesión 3:** U1 (animaciones de transición).
4. **Sesión 4:** P3 (IA de onboarding).
5. **Cuando haya tiempo:** S4 (limpiar historial de git).