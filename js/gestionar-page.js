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
  toggleEditarDatos, cancelarEditarDatos, guardarDatosCliente,
  seleccionarSistema, cambiarSistemaVisual,
  setOnCambioApariencia, setOnGuardadoExitoso
} from './modulos/gestionar.js';
import {
  cambiarTabBoveda, guardarCredenciales, probarConexion,
  toggleVisibilidadToken, inicializarBoveda
} from './modulos/boveda.js';

const ROLES_VALIDOS = ['admin', 'ventas', 'produccion'];

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
    const esActivo = sec.dataset.tabContent === nombre;
    sec.classList.toggle('hidden', !esActivo);
    
    // --- ANIMACIÓN U1 (Paso 3) ---
    if (esActivo) {
      sec.classList.remove('animate-tab-in'); // Resetea la animación
      void sec.offsetWidth;                   // Truco de reflow
      sec.classList.add('animate-tab-in');    // Vuelve a animar
    }
  });
  
  if (window.lucide) window.lucide.createIcons();
}

function inicializarTabs() {
  document.querySelectorAll('.tab-btn').forEach((btn) => {
    btn.addEventListener('click', () => activarTab(btn.dataset.tab));
  });
  const primerVisible = Array.from(document.querySelectorAll('.tab-btn'))
    .find((btn) => btn.style.display !== 'none');
  if (primerVisible) activarTab(primerVisible.dataset.tab);
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

function limpiarCambios() {
  cambiosSinGuardar = false;
  const btn = document.getElementById('btn-guardar-apariencia');
  if (!btn) return;
  btn.textContent = btn.dataset.textoOriginal || 'Guardar Apariencia';
  delete btn.dataset.textoOriginal;
  btn.style.backgroundColor = '';
  btn.style.color = '';
  btn.style.fontWeight = '';
}

// Conectar el orquestador con el estado de la página
setOnCambioApariencia(marcarCambiosSinGuardar);
setOnGuardadoExitoso(limpiarCambios);

// ==========================================
// DELEGACIÓN DE CLICKS
// ==========================================
const ACCIONES_PAGINA = {
  'guardar-apariencia':      () => guardarConfiguracion(),
  'publicar-github':         () => publicarEnGitHub(),
  'seleccionar-sistema':     (el) => seleccionarSistema(el.dataset.key),
  'cambiar-sistema-visual':  () => cambiarSistemaVisual(),
  'boveda-tab':              (el) => cambiarTabBoveda(el.dataset.provider),
  'guardar-credenciales':    () => guardarCredenciales(),
  'probar-conexion':         () => probarConexion(),
  'toggle-token':            (el) => toggleVisibilidadToken(el.dataset.target),
  'guardar-redes':           () => guardarRedes(),
  'toggle-redes':            () => toggleEditarRedes(),
  'add-red-gestionar':       () => addRedGestionar(),
  'gd-rm-red':               (el) => rmRedGestionar(el),
  'guardar-direcciones':     () => guardarDirecciones(),
  'toggle-direcciones':      () => toggleEditarDirecciones(),
  'add-direccion-gestionar': () => addDireccionGestionar(),
  'gd-rm-dir':               (el) => rmDireccionGestionar(el),
  'guardar-fechas':          () => guardarFechas(),
  'guardar-fecha-produccion':() => guardarFechaProduccion(),
  'toggle-editar-datos':     () => toggleEditarDatos(),
  'cancelar-editar-datos':   () => cancelarEditarDatos(),
  'guardar-datos-cliente':   () => guardarDatosCliente(),
};

document.addEventListener('click', (event) => {
  const trigger = event.target.closest('[data-action]');
  if (!trigger) return;
  const handler = ACCIONES_PAGINA[trigger.dataset.action];
  if (handler) { event.preventDefault(); handler(trigger); }
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

  let datosUsuario;
  try {
    const snap = await getDoc(doc(db, 'usuarios', user.uid));
    if (!snap.exists()) {
      await signOut(auth);
      window.location.href = 'login.html?return=' + retorno;
      return;
    }
    const data = snap.data();
    rolActual = data.rol;
    if (!ROLES_VALIDOS.includes(rolActual)) {
      await signOut(auth);
      window.location.href = 'login.html?return=' + retorno;
      return;
    }
    datosUsuario = {
      uid: user.uid,
      email: user.email,
      nombre: data.nombre || '',
      apellido: data.apellido || '',
      tipoDocumento: data.tipoDocumento || '',
      numeroDocumento: data.numeroDocumento || '',
      rol: rolActual
    };
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

    setState({ clienteSeleccionado: c, rolActual, usuarioActual: datosUsuario });
    renderHeader(c);
    aplicarPermisos(rolActual);
    inicializarTabs();

    await cargarDatosCliente(c);

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