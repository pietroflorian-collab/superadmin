// ==========================================
// IMPORTS
// ==========================================
import { db } from './config/firebase.js';
import {
  doc, updateDoc, getDoc, getDocs, collection, setDoc
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";
import { refrescarIconos } from './core/helpers.js';
import { setState } from './core/state.js';
import {
  cargarClientes,
  setFiltroBusqueda,
  setFiltroEstadoCliente,
  setFiltroEstadoServicio,
  setFiltroVencimiento
} from './modulos/clientes.js';
import {
  abrirNuevoCliente, cerrarNuevoCliente, registrarNuevoCliente,
  addRedNuevo, rmRedNuevo, addDireccionNuevo, rmDireccionNuevo
} from './modulos/nuevo-cliente.js';
import {
  abrirGestionPagos, cerrarGestionPagos,
  gpBuscarCliente, seleccionarCliente,
  toggleCliente, validarConfirmacion,
  confirmarRetiro, reactivarCliente, toggleServicio,
  cancelarRetiro, inicializarPagos
} from './modulos/pagos.js';
import { auth } from './config/firebase.js';
import { iniciarVigilancia } from './core/sesion.js';
import { initPerfil, solicitarCambioPassword, toggleDarkMode } from './modulos/perfil.js';
import { abrirModalBackup, cerrarModalBackup, ejecutarBackup } from './modulos/backup.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";

// ==========================================
// DOM
// ==========================================
const backdrop = document.getElementById('backdrop');
const drawerNuevo = document.getElementById('drawer-nuevo-cliente');

// ==========================================
// DELEGACIÓN
// ==========================================
const ACCIONES = {
  'abrir-nuevo-cliente': () => abrirNuevoCliente(),
  'cerrar-nuevo-cliente': () => cerrarNuevoCliente(),
  'add-red': () => addRedNuevo(),
  'add-direccion': () => addDireccionNuevo(),
  'nc-rm-red': (el) => rmRedNuevo(el),
  'nc-rm-dir': (el) => rmDireccionNuevo(el),
  'ver-cliente': (el) => { window.location.href = 'gestionar.html?id=' + el.dataset.clienteId; },
  'abrir-gestion-pagos': () => abrirGestionPagos(),
  'cerrar-gestion-pagos': () => cerrarGestionPagos(),
  'gp-seleccionar': (el) => seleccionarCliente(el.dataset.clienteId),
  'gp-toggle-cliente': () => toggleCliente(),
  'gp-toggle-servicio': () => toggleServicio(),
  'gp-confirmar-retiro': () => confirmarRetiro(),
  'gp-cancelar-retiro': () => cancelarRetiro(),
  'cambiar-password': () => solicitarCambioPassword(),
  'abrir-backup-modal': () => abrirModalBackup(),
  'cerrar-backup': () => cerrarModalBackup(),
  'ejecutar-backup': () => ejecutarBackup(),
  'toggle-dark': () => toggleDarkMode(),
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
  if (e.target.id === 'filtro-estado-cliente')  setFiltroEstadoCliente(e.target.value);
  if (e.target.id === 'filtro-estado-servicio') setFiltroEstadoServicio(e.target.value);
  if (e.target.id === 'filtro-vencimiento')     setFiltroVencimiento(e.target.value);
});

// ==========================================
// FILTROS — BUSCADOR
// ==========================================
document.addEventListener('input', (event) => {
  if (event.target.id === 'filtro-busqueda') setFiltroBusqueda(event.target.value);
});

// ==========================================
// ESCAPE
// ==========================================
document.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape') return;
  const modal = document.getElementById('modal-gestion-pagos');
  if (modal && !modal.classList.contains('hidden')) { cerrarGestionPagos(); return; }
  if (!drawerNuevo.classList.contains('-translate-x-full')) { cerrarNuevoCliente(); return; }
});

// ==========================================
// BACKDROP
// ==========================================
if (backdrop) {
  backdrop.addEventListener('click', () => {
    cerrarNuevoCliente();
  });
}

// ==========================================
// FORM NUEVO CLIENTE
// ==========================================
document.getElementById('form-nuevo-cliente').addEventListener('submit', registrarNuevoCliente);

// ==========================================
// APLICAR PERMISOS AL DOM SEGÚN ROL
// ==========================================
function aplicarPermisos(rol) {
  const esAdmin = rol === 'admin';
  const esVentas = rol === 'ventas';
  const esProduccion = rol === 'produccion';

  // Nuevo Cliente: admin + ventas (ocultar en produccion)
  const btnNuevo = document.querySelector('[data-action="abrir-nuevo-cliente"]');
  if (btnNuevo) btnNuevo.style.display = esProduccion ? 'none' : '';

  // Gestión de Pagos: admin + ventas (ocultar en produccion)
  const btnPagos = document.querySelector('[data-action="abrir-gestion-pagos"]');
  if (btnPagos) btnPagos.style.display = esProduccion ? 'none' : '';

  // Backup: solo admin
  const btnBackup = document.getElementById('btn-backup');
  if (btnBackup) btnBackup.style.display = esAdmin ? '' : 'none';
}

// ==========================================
// GUARD DE SESIÓN
// ==========================================
const ROLES_VALIDOS = ['admin', 'ventas', 'produccion'];
let initHecho = false;

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = 'login.html';
    return;
  }

  let rol;
  try {
    const snap = await getDoc(doc(db, 'usuarios', user.uid));
    if (!snap.exists()) {
      await signOut(auth);
      window.location.href = 'login.html';
      return;
    }
    rol = snap.data().rol;
    if (!ROLES_VALIDOS.includes(rol)) {
      await signOut(auth);
      window.location.href = 'login.html';
      return;
    }
  } catch (e) {
    console.error('Error al verificar rol:', e);
    window.location.href = 'login.html';
    return;
  }

  setState({ rolActual: rol });
  aplicarPermisos(rol);

  const overlay = document.getElementById('boot-overlay');
  if (overlay) overlay.remove();

  if (!initHecho) {
    initHecho = true;
    refrescarIconos();
    cargarClientes();
    inicializarPagos();
    initPerfil();
    window.addEventListener('load', refrescarIconos);
    iniciarVigilancia();
  }
});