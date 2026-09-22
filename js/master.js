// ==========================================
// IMPORTS
// ==========================================
import { db } from './config/firebase.js';
import {
  doc, updateDoc, getDoc, getDocs, collection, setDoc
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";
import { refrescarIconos } from './core/helpers.js';
import { cargarClientes } from './modulos/clientes.js';
import {
  abrirNuevoCliente, cerrarNuevoCliente, registrarNuevoCliente,
  addRedNuevo, rmRedNuevo, addDireccionNuevo, rmDireccionNuevo
} from './modulos/nuevo-cliente.js';
import {
  abrirPanelCliente, cerrarPanel,
  guardarConfiguracion, guardarRedes, guardarDirecciones, guardarFechas,
  guardarFechaProduccion,
  toggleEditarRedes, toggleEditarDirecciones,
  addRedGestionar, rmRedGestionar,
  addDireccionGestionar, rmDireccionGestionar, publicarEnGitHub,
  } from './modulos/gestionar.js';
import { getState, setState } from './core/state.js';
import {
  cambiarTabBoveda, cargarCredenciales, guardarCredenciales,
  probarConexion, toggleVisibilidadToken,
  inicializarBoveda, limpiarBoveda
} from './modulos/boveda.js';
import {
  abrirGestionPagos, cerrarGestionPagos,
  gpBuscarCliente, seleccionarCliente,
  toggleCliente, validarConfirmacion,
  confirmarRetiro, reactivarCliente, toggleServicio,
  cancelarRetiro, inicializarPagos
} from './modulos/pagos.js';
import { auth } from './config/firebase.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";

// ==========================================s
// DOM
// ==========================================
const backdrop = document.getElementById('backdrop');
const drawerNuevo = document.getElementById('drawer-nuevo-cliente');
const drawer = document.getElementById('client-drawer');

// ==========================================
// WRAPPER: abrir panel + inicializar bóveda
// ==========================================
async function abrirPanelClienteConBoveda(id) {
  await abrirPanelCliente(id);
  inicializarBoveda();
}

// ==========================================
// DELEGACIÓN
// ==========================================
const ACCIONES = {
  // Nuevo Cliente
  'abrir-nuevo-cliente': () => abrirNuevoCliente(),
  'cerrar-nuevo-cliente': () => cerrarNuevoCliente(),
  'add-red': () => addRedNuevo(),
  'add-direccion': () => addDireccionNuevo(),
  'nc-rm-red': (el) => rmRedNuevo(el),
  'nc-rm-dir': (el) => rmDireccionNuevo(el),

  // Gestionar
  'abrir-panel-cliente': (el) => abrirPanelClienteConBoveda(el.dataset.clienteId),
  'cerrar-panel': () => { limpiarBoveda(); cerrarPanel(); },
  'guardar-apariencia': () => guardarConfiguracion(),
  'guardar-redes': () => guardarRedes(),
  'guardar-direcciones': () => guardarDirecciones(),
  'guardar-fechas': () => guardarFechas(),
  'guardar-fecha-produccion': () => guardarFechaProduccion(),
  'toggle-redes': () => toggleEditarRedes(),
  'toggle-direcciones': () => toggleEditarDirecciones(),
  'add-red-gestionar': () => addRedGestionar(),
  'add-direccion-gestionar': () => addDireccionGestionar(),
  'gd-rm-red': (el) => rmRedGestionar(el),
  'gd-rm-dir': (el) => rmDireccionGestionar(el),
  'publicar-github': () => publicarEnGitHub(),
  
  // Bóveda
  'boveda-tab': (el) => cambiarTabBoveda(el.dataset.provider),
  'guardar-credenciales': () => guardarCredenciales(),
  'probar-conexion': () => probarConexion(),
  'toggle-token': (el) => toggleVisibilidadToken(el.dataset.target),

    // Gestión de Pagos
  'abrir-gestion-pagos': () => abrirGestionPagos(),
  'cerrar-gestion-pagos': () => cerrarGestionPagos(),
  'gp-seleccionar': (el) => seleccionarCliente(el.dataset.clienteId),
  'gp-toggle-cliente': () => toggleCliente(),
  'gp-toggle-servicio': () => toggleServicio(),
  'gp-confirmar-retiro': () => confirmarRetiro(),
  'gp-cancelar-retiro': () => cancelarRetiro(),
  'cerrar-sesion': async () => {
    await signOut(auth);
    window.location.href = 'login.html';
  },
};
  

document.addEventListener('click', (event) => {
  const trigger = event.target.closest('[data-action]');
  if (!trigger) return;
  const action = trigger.dataset.action;
  const handler = ACCIONES[action];
  if (handler) { event.preventDefault(); handler(trigger); }
});

// ==========================================
// TIPO DE PERSONA → TIPO DE DOC
// ==========================================
document.addEventListener('change', (e) => {
  if (e.target.name === 'tipoPersona') {
    const tipo = e.target.value;
    const sel = document.getElementById('nc-tipo-doc');
    if (!sel) return;
    const NAT = ['CC', 'Pasaporte', 'PPT', 'Otro'];
    const JUR = ['NIT'];
    const opciones = tipo === 'juridica' ? JUR : NAT;
    sel.innerHTML = opciones.map((t) => `<option value="${t}">${t}</option>`).join('');
  }
});

// ==========================================
// PREVIEW EN VIVO
// ==========================================
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

// ==========================================
// ESCAPE
// ==========================================
document.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape') return;
  const modal = document.getElementById('modal-gestion-pagos');
  if (modal && !modal.classList.contains('hidden')) { cerrarGestionPagos(); return; }
  if (!drawerNuevo.classList.contains('-translate-x-full')) { cerrarNuevoCliente(); return; }
  if (!drawer.classList.contains('translate-x-full')) cerrarPanel();
});

// ==========================================
// BACKDROP
// ==========================================
if (backdrop) {
  backdrop.addEventListener('click', () => {
    cerrarNuevoCliente();
    cerrarPanel();
  });
}

// ==========================================
// FORM
// ==========================================
document.getElementById('form-nuevo-cliente').addEventListener('submit', registrarNuevoCliente);

// ==========================================
// GUARD DE SESIÓN
// ==========================================
const UID_ADMIN = 'hb8ziusuzMeVYflWjsXn43VkcuT2';
let initHecho = false;

onAuthStateChanged(auth, (user) => {
  if (!user || user.uid !== UID_ADMIN) {
    // No autorizado → vuelve al login
    window.location.href = 'login.html';
    return;
  }

  // Autorizado → quitar overlay de arranque
  const overlay = document.getElementById('boot-overlay');
  if (overlay) overlay.remove();

    // Arranca el panel (solo una vez)
  if (!initHecho) {
    initHecho = true;
    refrescarIconos();
    cargarClientes();
    inicializarPagos();
    window.addEventListener('load', refrescarIconos);
  }
});
