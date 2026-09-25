// ==========================================
// PÁGINA: GESTIONAR CLIENTE
// ==========================================
import { db, auth } from './config/firebase.js';
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";

// ---------- Estado local ----------
let clienteActual = null;

// ---------- Tema (dark mode) ----------
if (localStorage.getItem('superadmin.darkMode') === '1') {
  document.documentElement.classList.add('dark');
}

// ---------- Helper: obtener id de la URL ----------
function getIdCliente() {
  return new URLSearchParams(location.search).get('id');
}

// ---------- Helper: redirigir a superadmin ----------
function volverAlPanel() {
  window.location.href = 'superadmin.html';
}

// ---------- Cargar cliente ----------
async function cargarCliente(id) {
  const snap = await getDoc(doc(db, 'clientes_agencia', id));
  if (!snap.exists()) return null;
  return { id, ...snap.data() };
}

// ---------- Render básico del header ----------
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

// ---------- Manejo de tabs ----------
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
  activarTab('apariencia');   // Tab por defecto
}

// ---------- Guard de sesión + carga ----------
function mostrarOverlay(mostrar) {
  const overlay = document.getElementById('boot-overlay');
  if (!overlay) return;
  if (mostrar) overlay.style.display = 'flex';
  else overlay.remove();
}

let initHecho = false;

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = 'login.html';
    return;
  }

  // Verificar que el UID esté en admins/{uid}
  try {
    const snap = await getDoc(doc(db, 'admins', user.uid));
    if (!snap.exists()) {
      await signOut(auth);
      window.location.href = 'login.html';
      return;
    }
  } catch (e) {
    console.error('Error al verificar admin:', e);
    window.location.href = 'login.html';
    return;
  }

  // Una sola vez
  if (initHecho) return;
  initHecho = true;

  // Leer ?id=
  const id = getIdCliente();
  if (!id) {
    volverAlPanel();
    return;
  }

  // Cargar cliente
  try {
    const c = await cargarCliente(id);
    if (!c) {
      console.warn('Cliente no encontrado:', id);
      volverAlPanel();
      return;
    }
    clienteActual = c;
    renderHeader(c);
    inicializarTabs();
    mostrarOverlay(false);
    if (window.lucide) window.lucide.createIcons();
  } catch (e) {
    console.error('Error al cargar cliente:', e);
    volverAlPanel();
  }
});

// ---------- Botón volver ----------
document.getElementById('btn-volver')?.addEventListener('click', volverAlPanel);