# 🎨 Arquitectura de Sistemas Visuales

El panel de superadmin utiliza una **arquitectura de plugins** para gestionar las diferentes estéticas (UI) de los menús de los clientes. 

Cada cliente tiene un campo `sistemaVisual` en Firestore (ej: `material`, `shadcn`). Cuando el administrador entra a gestionar la apariencia de ese cliente, el sistema carga dinámicamente el módulo correspondiente.

---

## 📂 Estructura de archivos

- `js/config/sistemas-visuales.js`: Es el **Registro**. Contiene la metadata de cada sistema y la función que carga el módulo dinámicamente.
- `js/modulos/sistemas/`: Es la carpeta donde vive la lógica de cada sistema. Cada archivo (ej: `material.js`) es independiente.

---

## 📜 El Contrato (¿Qué debe exportar un sistema?)

Cada archivo dentro de `js/modulos/sistemas/` **DEBE** exportar exactamente estas tres cosas:

1. `export const meta = { ... }`
   - Objeto con la metadata del sistema: `key` (id único), `nombre`, `descripcion`, `icon` (de Lucide) y `accent` (color hex principal).
2. `export function render(container, apariencia, { onCambio })`
   - Recibe el `container` (el div donde debe pintar), el objeto `apariencia` actual del cliente (desde Firestore) y un callback `onCambio` (que se ejecuta cada vez que el usuario toca un input).
3. `export function leer(container)`
   - Lee el DOM y devuelve un objeto con las variables de apariencia listas para guardar en Firestore. **Importante:** Este objeto debe contener SOLO los campos de este sistema, garantizando el bloqueo cruzado.

---

## 🛠️ ¿Cómo agregar un sistema visual nuevo? (Ej: Cyberpunk)

1. Crear el archivo `js/modulos/sistemas/cyberpunk.js`.
2. Implementar el contrato (`meta`, `render`, `leer`).
3. Abrir `js/config/sistemas-visuales.js` y agregar la entrada en el objeto `SISTEMAS_VISUALES`:
   ```javascript
   cyberpunk: {
     key: 'cyberpunk',
     nombre: 'Cyberpunk',
     descripcion: 'Estética futurista con neón.',
     icon: 'zap',
     accent: '#FF00FF'
   }