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
  cargarDatosCliente
} from './modulos/gestionar.js';
import {
  cambiarTabBoveda, guardarCredenciales, probarConexion,
  toggleVisibilidadToken, inicializarBoveda
} from './modulos/boveda.js';

// ---------- Estado local ----------
let clienteActual = null;

// ---------- Tema (dark mode) ----------
if (localStorage.getItem('superadmin.darkMode') === '1') {
  document.documentElement.classList.add('dark');
}

// ---------- Helpers ----------
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

// ---------- Render del header ----------
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

// ---------- Tabs ----------
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
  activarTab('apariencia');
}

// ---------- Delegación de clicks ----------
const ACCIONES_PAGINA = {
  // Apariencia
  'guardar-apariencia': () => guardarConfiguracion(),
  'publicar-github': () => publicarEnGitHub(),
  // Bóveda
  'boveda-tab': (el) => cambiarTabBoveda(el.dataset.provider),
  'guardar-credenciales': () => guardarCredenciales(),
  'probar-conexion': () => probarConexion(),
  'toggle-token': (el) => toggleVisibilidadToken(el.dataset.target),
  // Redes
  'guardar-redes': () => guardarRedes(),
  'toggle-redes': () => toggleEditarRedes(),
  'add-red-gestionar': () => addRedGestionar(),
  'gd-rm-red': (el) => rmRedGestionar(el),
  // Direcciones
  'guardar-direcciones': () => guardarDirecciones(),
  'toggle-direcciones': () => toggleEditarDirecciones(),
  'add-direccion-gestionar': () => addDireccionGestionar(),
  'gd-rm-dir': (el) => rmDireccionGestionar(el),
  // Fechas
  'guardar-fechas': () => guardarFechas(),
  'guardar-fecha-produccion': () => guardarFechaProduccion(),
};

document.addEventListener('click', (event) => {
  const trigger = event.target.closest('[data-action]');
  if (!trigger) return;
  const handler = ACCIONES_PAGINA[trigger.dataset.action];
  if (handler) { event.preventDefault(); handler(trigger); }
});

// ---------- Preview en vivo ----------
document.addEventListener('input', (event) => {
  const live = event.target.dataset.live;
  if (live === 'color-primario') {
    const s = document.getElementById('valor-color-primario');
    if (s) s.textContent = event.target.value.toUpperCase();
  }
  if (live === 'radio-bordes') {
    const s = document.getElementById('valor-radio-bordes');
    if (s) s.textContent = event.target.value + 'px';
  }
});

// ---------- Guard + carga ----------
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
    const snap = await getDoc(doc(db, 'admins', user.uid));
    if (!snap.exists()) {
      await signOut(auth);
      window.location.href = 'login.html?return=' + retorno;
      return;
    }
  } catch (e) {
    console.error('Error al verificar admin:', e);
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

    setState({ clienteSeleccionado: c });
    renderHeader(c);
    inicializarTabs();
    cargarDatosCliente(c);          // llena todos los campos del DOM
    inicializarBoveda();            // carga credenciales del cliente
    mostrarOverlay(false);
    if (window.lucide) window.lucide.createIcons();
  } catch (e) {
    console.error('Error al cargar cliente:', e);
    volverAlPanel();
  }
});

// ---------- Botón volver ----------
document.getElementById('btn-volver')?.addEventListener('click', volverAlPanel);