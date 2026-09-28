// ==========================================
// PÁGINA: GESTIONAR CLIENTE
// ==========================================
import { db, auth } from './config/firebase.js';
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";
import { setState } from './core/state.js';
import {
  guardarConfiguracion, publicarEnGitHub,
  guardarRedes, guardarDirecciones, guardarFechas, guardarFechaProduccion,
  toggleEditarRedes, toggleEditarDirecciones,
  addRedGestionar, rmRedGestionar,
  addDireccionGestionar, rmDireccionGestionar,
  cargarDatosCliente,
  toggleEditarDatos, cancelarEditarDatos, guardarDatosCliente
} from './modulos/gestionar.js';
import {
  cambiarTabBoveda, guardarCredenciales, probarConexion,
  toggleVisibilidadToken, inicializarBoveda
} from './modulos/boveda.js';

const ROLES_VALIDOS = ['admin', 'ventas', 'produccion'];

const FUENTES_DISPONIBLES = [
  'Inter','Playfair Display','Archivo','Fraunces','Space Grotesk','Lato',
  'Raleway','Playwrite Belgique','Playwrite Cuba','Edu QLD Hand','Caveat','Parisienne'
];

const ZONAS_TIPOGRAFIA = {
  marca: [
    { key: 'navNegocio', label: 'Nombre del negocio', sub: 'Nav superior', font: 'Anybody', size: 46, preview: 'SUKIDESU SUSHI' },
    { key: 'navLink', label: 'Link "Inicio"', sub: 'Nav superior', font: 'Space Grotesk', size: 14, preview: 'Inicio' },
    { key: 'heroEslogan', label: 'Eslogan', sub: 'Hero / banner', font: 'Anybody', size: 46, preview: '¡QUÉ CHIMBA DE SUSHI!' },
    { key: 'heroDescripcion', label: 'Descripción del negocio', sub: 'Hero / banner', font: 'Plus Jakarta Sans', size: 16, preview: 'Experimenta los sabores más audaces' }
  ],
  navegacion: [
    { key: 'catTitulo', label: 'Título de categoría', sub: 'Encabezado de sección', font: 'Space Grotesk', size: 24, preview: 'Rollos Clásicos' },
    { key: 'catBoton', label: 'Botón de categoría', sub: 'Barra superior', font: 'Plus Jakarta Sans', size: 14, preview: 'Entradas' }
  ],
  contenido: [
    { key: 'platoNombre', label: 'Nombre del plato', sub: 'Tarjeta del plato', font: 'Anybody', size: 20, preview: 'California Roll' },
    { key: 'platoPrecio', label: 'Precio', sub: 'Tarjeta del plato', font: 'Space Grotesk', size: 14, preview: '$37.900' },
    { key: 'platoDescripcion', label: 'Descripción del plato', sub: 'Tarjeta del plato', font: 'Plus Jakarta Sans', size: 14, preview: 'Kanikama, aguacate, pepino' },
    { key: 'platoTag', label: 'Tag de categoría', sub: 'Esquina de la foto', font: 'Plus Jakarta Sans', size: 10, preview: 'ENTRADAS' },
    { key: 'platoPromo', label: 'Tag de promo', sub: 'Esquina de la foto', font: 'Space Grotesk', size: 10, preview: '2x1 HOY' },
    { key: 'platoPicante', label: 'Etiqueta "Picante"', sub: 'Tarjeta del plato', font: 'Plus Jakarta Sans', size: 9, preview: 'PICANTE' },
    { key: 'platoFoto', label: '"Foto referencial"', sub: 'Pie de la tarjeta', font: 'Plus Jakarta Sans', size: 11, preview: 'Foto referencial' }
  ],
  interaccion: [
    { key: 'modalTitulo', label: 'Título del carrito', sub: 'Modal carrito', font: 'Space Grotesk', size: 18, preview: 'Selección' },
    { key: 'modalItem', label: 'Ítem del carrito', sub: 'Modal carrito', font: 'Plus Jakarta Sans', size: 14, preview: 'California Roll' },
    { key: 'modalCantidad', label: 'Cantidad', sub: 'Modal carrito', font: 'Space Grotesk', size: 14, preview: '3' },
    { key: 'modalBotones', label: 'Botones del carrito', sub: 'Modal carrito', font: 'Plus Jakarta Sans', size: 12, preview: 'Cerrar' },
    { key: 'modalVacio', label: 'Carrito vacío', sub: 'Modal carrito', font: 'Plus Jakarta Sans', size: 14, preview: 'No has agregado platos' },
    { key: 'fabTexto', label: 'Texto del FAB', sub: 'Botón flotante', font: 'Plus Jakarta Sans', size: 14, preview: 'Ver mi lista' },
    { key: 'fabBadge', label: 'Badge del FAB', sub: 'Botón flotante', font: 'Space Grotesk', size: 12, preview: '5' },
    { key: 'mantTitulo', label: 'Título mantenimiento', sub: 'Overlay mantenimiento', font: 'Space Grotesk', size: 24, preview: 'Servicio Inactivo' },
    { key: 'mantDescripcion', label: 'Descripción mantenimiento', sub: 'Overlay mantenimiento', font: 'Plus Jakarta Sans', size: 14, preview: 'Menú en mantenimiento' },
    { key: 'promoTexto', label: 'Texto del promo', sub: 'Modal promo', font: 'Plus Jakarta Sans', size: 14, preview: 'Promo del día' },
    { key: 'promoBotones', label: 'Botones del promo', sub: 'Modal promo', font: 'Plus Jakarta Sans', size: 12, preview: '¡Ver el Menú!' },
    { key: 'footerTexto', label: 'Texto del footer', sub: 'Pie de página', font: 'Plus Jakarta Sans', size: 12, preview: '© 2026 Sukidesu' },
    { key: 'footerLinks', label: 'Links del footer', sub: 'Pie de página', font: 'Plus Jakarta Sans', size: 12, preview: 'Privacidad' },
    { key: 'toast', label: 'Notificaciones toast', sub: 'Avisos flotantes', font: 'Inter', size: 12, preview: 'Menú actualizado' }
  ]
};

const TODAS_LAS_ZONAS = Object.values(ZONAS_TIPOGRAFIA).flat();
const cap = (s) => s[0].toUpperCase() + s.slice(1);

let clienteActual = null;
let cambiosSinGuardar = false;
let rolActual = null;

if (localStorage.getItem('superadmin.darkMode') === '1') {
  document.documentElement.classList.add('dark');
}

// ==========================================
// HELPERS
// ==========================================
function getIdCliente() {
  return new URLSearchParams(location.search).get('id');
}

function volverAlPanel() {
  window.location.href = 'superadmin.html';
}

async function cargarCliente(id) {
  const snap = await getDoc(doc(db, 'clientes_agencia', id));
  if (!snap.exists()) return null;
  return { id, ...snap.data() };
}

function renderHeader(c) {
  const nombre = c.nombreComercial || c.nombreCliente || 'Sin nombre';
  const iniciales = nombre.split(' ').slice(0, 2).map((p) => p[0]).join('').toUpperCase();
  document.getElementById('cliente-nombre').textContent = nombre;
  document.getElementById('cliente-sub').textContent = c.nombreCliente || 'Panel de Gestión';
  document.getElementById('cliente-avatar').textContent = iniciales || '--';
  const ec = c.estadoCliente === 'Retirado' ? 'Retirado' : 'Activo';
  const elEC = document.getElementById('cliente-estado');
  elEC.className = `inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium border ${
    ec === 'Activo'
      ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900'
      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700'
  }`;
  elEC.innerHTML = `<span class="w-2 h-2 rounded-full ${ec === 'Activo' ? 'bg-emerald-500' : 'bg-zinc-400'}"></span>${ec}`;
}

// ==========================================
// PERMISOS SEGÚN ROL
// ==========================================
function aplicarPermisos(rol) {
  const esAdmin = rol === 'admin';
  const esVentas = rol === 'ventas';
  const esProduccion = rol === 'produccion';

  const tabsPermitidos = {
    apariencia:  esAdmin || esProduccion,
    boveda:      esAdmin || esProduccion,
    datos:       esAdmin || esVentas,
    redes:       esAdmin || esVentas,
    direcciones: esAdmin || esVentas,
    fechas:      esAdmin || esProduccion
  };

  Object.entries(tabsPermitidos).forEach(([tab, permitido]) => {
    const btn = document.querySelector(`.tab-btn[data-tab="${tab}"]`);
    if (btn) btn.style.display = permitido ? '' : 'none';
  });

  // Producción: no puede editar vencimiento (solo fecha de producción)
  if (esProduccion) {
    document.getElementById('gd-vencimiento-edit')?.classList.add('hidden');
    document.getElementById('gd-guardar-fechas-wrap')?.classList.add('hidden');
  }
}

// ==========================================
// TABS PRINCIPALES
// ==========================================
function activarTab(nombre) {
  document.querySelectorAll('.tab-btn').forEach((btn) => {
    const activo = btn.dataset.tab === nombre;
    btn.classList.toggle('border-zinc-900', activo);
    btn.classList.toggle('dark:border-zinc-100', activo);
    btn.classList.toggle('text-zinc-900', activo);
    btn.classList.toggle('dark:text-zinc-100', activo);
    btn.classList.toggle('border-transparent', !activo);
    btn.classList.toggle('text-zinc-500', !activo);
    btn.classList.toggle('dark:text-zinc-400', !activo);
  });
  document.querySelectorAll('.tab-content').forEach((sec) => {
    sec.classList.toggle('hidden', sec.dataset.tabContent !== nombre);
  });
  if (window.lucide) window.lucide.createIcons();
}

function inicializarTabs() {
  document.querySelectorAll('.tab-btn').forEach((btn) => {
    btn.addEventListener('click', () => activarTab(btn.dataset.tab));
  });
  // Activar el primer tab visible
  const primerVisible = Array.from(document.querySelectorAll('.tab-btn'))
    .find(btn => btn.style.display !== 'none');
  if (primerVisible) activarTab(primerVisible.dataset.tab);
}

// ==========================================
// SUB-TABS DE TIPOGRAFÍA
// ==========================================
function construirFilaTipografia(zona) {
  const options = FUENTES_DISPONIBLES.map(f => `<option value="${f}">${f}</option>`).join('');
  return `
    <div class="flex items-center gap-3 py-2 border-b border-zinc-100 dark:border-zinc-800 last:border-0">
      <div class="w-44 shrink-0">
        <div class="text-[11px] font-medium text-zinc-700 dark:text-zinc-300">${zona.label}</div>
        <div class="text-[9px] text-zinc-400 dark:text-zinc-500 font-mono">${zona.sub}</div>
      </div>
      <select class="fuente-select w-40 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded px-2 py-1 text-[11px] text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-400" data-zona="${zona.key}">
        <option value="">— Default —</option>
        ${options}
      </select>
      <input type="number" min="8" max="120" class="tamaño-input w-16 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded px-2 py-1 text-[11px] text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-zinc-400" placeholder="${zona.size}" data-zona="${zona.key}" />
      <div class="flex-1 min-w-0 text-right">
        <span class="preview-tipografia text-zinc-500 dark:text-zinc-400 truncate block" data-zona="${zona.key}" style="font-family: '${zona.font}', sans-serif; font-size: 16px;">${zona.preview}</span>
      </div>
    </div>
  `;
}

function construirTipografia() {
  Object.entries(ZONAS_TIPOGRAFIA).forEach(([subtitulo, zonas]) => {
    const contenedor = document.querySelector(`.subtab-content[data-subtab-content="${subtitulo}"]`);
    if (contenedor) contenedor.innerHTML = zonas.map(z => construirFilaTipografia(z)).join('');
  });
}

function actualizarPreviewZona(key, fuente) {
  const preview = document.querySelector(`.preview-tipografia[data-zona="${key}"]`);
  if (!preview) return;
  const zona = TODAS_LAS_ZONAS.find(z => z.key === key);
  if (!zona) return;
  const fuenteFinal = fuente || zona.font;
  preview.style.fontFamily = `'${fuenteFinal}', sans-serif`;
}

function activarSubTab(nombre) {
  document.querySelectorAll('.subtab-btn').forEach((btn) => {
    const activo = btn.dataset.subtab === nombre;
    btn.classList.toggle('bg-white', activo);
    btn.classList.toggle('dark:bg-zinc-900', activo);
    btn.classList.toggle('text-zinc-900', activo);
    btn.classList.toggle('dark:text-zinc-100', activo);
    btn.classList.toggle('shadow-sm', activo);
    btn.classList.toggle('text-zinc-500', !activo);
    btn.classList.toggle('dark:text-zinc-400', !activo);
  });
  document.querySelectorAll('.subtab-content').forEach((sec) => {
    sec.classList.toggle('hidden', sec.dataset.subtabContent !== nombre);
  });
}

function inicializarSubTabs() {
  document.querySelectorAll('.subtab-btn').forEach((btn) => {
    btn.addEventListener('click', () => activarSubTab(btn.dataset.subtab));
  });
  activarSubTab('marca');
}

// ==========================================
// CAMBIOS SIN GUARDAR
// ==========================================
function marcarCambiosSinGuardar() {
  if (cambiosSinGuardar) return;
  cambiosSinGuardar = true;
  const btn = document.getElementById('btn-guardar-apariencia');
  if (!btn) return;
  btn.dataset.textoOriginal = btn.textContent;
  btn.textContent = '● Guardar Apariencia';
  btn.style.backgroundColor = '#f59e0b';
  btn.style.color = '#18181b';
  btn.style.fontWeight = '600';
}

export function limpiarCambios() {
  cambiosSinGuardar = false;
  const btn = document.getElementById('btn-guardar-apariencia');
  if (!btn) return;
  btn.textContent = btn.dataset.textoOriginal || 'Guardar Apariencia';
  delete btn.dataset.textoOriginal;
  btn.style.backgroundColor = '';
  btn.style.color = '';
  btn.style.fontWeight = '';
}

// ==========================================
// DELEGACIÓN DE CLICKS
// ==========================================
const ACCIONES_PAGINA = {
  'guardar-apariencia': () => guardarConfiguracion(),
  'publicar-github': () => publicarEnGitHub(),
  'boveda-tab': (el) => cambiarTabBoveda(el.dataset.provider),
  'guardar-credenciales': () => guardarCredenciales(),
  'probar-conexion': () => probarConexion(),
  'toggle-token': (el) => toggleVisibilidadToken(el.dataset.target),
  'guardar-redes': () => guardarRedes(),
  'toggle-redes': () => toggleEditarRedes(),
  'add-red-gestionar': () => addRedGestionar(),
  'gd-rm-red': (el) => rmRedGestionar(el),
  'guardar-direcciones': () => guardarDirecciones(),
  'toggle-direcciones': () => toggleEditarDirecciones(),
  'add-direccion-gestionar': () => addDireccionGestionar(),
  'gd-rm-dir': (el) => rmDireccionGestionar(el),
  'guardar-fechas': () => guardarFechas(),
  'guardar-fecha-produccion': () => guardarFechaProduccion(),
  'toggle-editar-datos': () => toggleEditarDatos(),
  'cancelar-editar-datos': () => cancelarEditarDatos(),
  'guardar-datos-cliente': () => guardarDatosCliente(),
};

document.addEventListener('click', (event) => {
  const trigger = event.target.closest('[data-action]');
  if (!trigger) return;
  const handler = ACCIONES_PAGINA[trigger.dataset.action];
  if (handler) { event.preventDefault(); handler(trigger); }
});

// ==========================================
// LISTENERS DE INPUT/CHANGE
// ==========================================
document.addEventListener('input', (event) => {
  const live = event.target.dataset.live;
  const coloresLive = ['color-primario', 'color-fondo', 'color-texto', 'color-texto-suave', 'color-tarjetas', 'color-carrito', 'color-bordes', 'color-acento', 'color-subtitulo', 'color-hover'];
  if (coloresLive.includes(live)) {
    const textoInput = document.getElementById('texto-' + live);
    if (textoInput) textoInput.value = event.target.value.toUpperCase();
    marcarCambiosSinGuardar();
  }
  if (live === 'radio-bordes') {
    const s = document.getElementById('valor-radio-bordes');
    if (s) s.textContent = event.target.value + 'px';
    marcarCambiosSinGuardar();
  }
  const zona = event.target.dataset.zona;
  if (zona && (event.target.classList.contains('tamaño-input') || event.target.classList.contains('fuente-select'))) {
    const fuente = document.querySelector(`.fuente-select[data-zona="${zona}"]`)?.value || '';
    actualizarPreviewZona(zona, fuente);
    marcarCambiosSinGuardar();
  }
});

function aplicarTextoColor(input) {
  let val = input.value.trim().toUpperCase();
  if (!val) return;
  if (!val.startsWith('#')) val = '#' + val;
  if (/^#[0-9A-F]{3}$/.test(val)) {
    val = '#' + val[1] + val[1] + val[2] + val[2] + val[3] + val[3];
  }
  const key = input.dataset.colorInput;
  const picker = document.getElementById('drawer-' + key);
  if (/^#[0-9A-F]{6}$/.test(val)) {
    if (picker) picker.value = val;
    input.value = val;
    marcarCambiosSinGuardar();
  } else {
    input.value = picker ? picker.value.toUpperCase() : '';
  }
}

document.addEventListener('blur', (event) => {
  if (event.target.dataset.colorInput) aplicarTextoColor(event.target);
}, true);

document.addEventListener('keydown', (event) => {
  if (event.target.dataset.colorInput && event.key === 'Enter') {
    event.preventDefault();
    aplicarTextoColor(event.target);
    event.target.blur();
  }
});

document.addEventListener('change', (event) => {
  const zona = event.target.dataset.zona;
  if (zona && event.target.classList.contains('fuente-select')) {
    actualizarPreviewZona(zona, event.target.value);
    marcarCambiosSinGuardar();
  }
});

// ==========================================
// GUARD + CARGA
// ==========================================
function mostrarOverlay(mostrar) {
  const overlay = document.getElementById('boot-overlay');
  if (!overlay) return;
  if (mostrar) overlay.style.display = 'flex';
  else overlay.remove();
}

let initHecho = false;

onAuthStateChanged(auth, async (user) => {
  const retorno = encodeURIComponent('gestionar.html?id=' + getIdCliente());

  if (!user) {
    window.location.href = 'login.html?return=' + retorno;
    return;
  }

  try {
    const snap = await getDoc(doc(db, 'usuarios', user.uid));
    if (!snap.exists()) {
      await signOut(auth);
      window.location.href = 'login.html?return=' + retorno;
      return;
    }
    rolActual = snap.data().rol;
    if (!ROLES_VALIDOS.includes(rolActual)) {
      await signOut(auth);
      window.location.href = 'login.html?return=' + retorno;
      return;
    }
  } catch (e) {
    console.error('Error al verificar rol:', e);
    window.location.href = 'login.html?return=' + retorno;
    return;
  }

  if (initHecho) return;
  initHecho = true;

  const id = getIdCliente();
  if (!id) { volverAlPanel(); return; }

  try {
    const c = await cargarCliente(id);
    if (!c) { volverAlPanel(); return; }
    clienteActual = c;

    setState({ clienteSeleccionado: c, rolActual });
    construirTipografia();
    inicializarSubTabs();
    renderHeader(c);
    aplicarPermisos(rolActual);
    inicializarTabs();
        cargarDatosCliente(c);
    // Bóveda solo para admin y produccion
    if (rolActual === 'admin' || rolActual === 'produccion') {
      inicializarBoveda();
    }
    mostrarOverlay(false);
    if (window.lucide) window.lucide.createIcons();
    limpiarCambios();
  } catch (e) {
    console.error('Error al cargar cliente:', e);
    volverAlPanel();
  }
});

document.getElementById('btn-volver')?.addEventListener('click', volverAlPanel);