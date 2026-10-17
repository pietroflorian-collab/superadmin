// ==========================================
// MÓDULO: USUARIOS — Gestión de roles y accesos
// ==========================================
import { db, auth, firebaseConfig } from '../config/firebase.js';
import { initializeApp, deleteApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";
import {
  collection, getDocs, doc, updateDoc, setDoc
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";
import { esc } from '../core/helpers.js';
import { toast, confirmar } from '../ui/notificaciones.js';

const ROLES_VALIDOS = ['admin', 'ventas', 'produccion', 'nulo'];

const ROL_LABEL = {
  admin:      'Admin',
  ventas:     'Ventas',
  produccion: 'Producción',
  nulo:       'Revocado'
};

let usuariosCache = [];
let filtroTexto   = '';
let filtroRol     = 'todos';

// ---------- Abrir / Cerrar drawer ----------
export function abrirDrawerUsuarios() {
  const drawer   = document.getElementById('drawer-usuarios');
  const backdrop = document.getElementById('backdrop-usuarios');
  if (!drawer || !backdrop) return;
  drawer.classList.remove('-translate-x-full');
  backdrop.classList.remove('hidden');
  cargarUsuarios();
}

export function cerrarDrawerUsuarios() {
  const drawer   = document.getElementById('drawer-usuarios');
  const backdrop = document.getElementById('backdrop-usuarios');
  if (!drawer || !backdrop) return;
  drawer.classList.add('-translate-x-full');
  backdrop.classList.add('hidden');
}

// ---------- Cargar desde Firestore ----------
async function cargarUsuarios() {
  const tbody = document.getElementById('usuarios-tbody');
  if (!tbody) return;
  tbody.innerHTML = `<tr><td colspan="4" class="px-6 py-4 text-center text-zinc-500 dark:text-zinc-400">Cargando usuarios…</td></tr>`;

  try {
    const snap = await getDocs(collection(db, 'usuarios'));
    usuariosCache = [];
    snap.forEach((d) => usuariosCache.push({ uid: d.id, ...d.data() }));
    usuariosCache.sort((a, b) => {
      const na = (a.nombre || '').toLowerCase();
      const nb = (b.nombre || '').toLowerCase();
      return na.localeCompare(nb);
    });
    renderListaUsuarios();
  } catch (e) {
    console.error('[usuarios] cargarUsuarios:', e);
    tbody.innerHTML = `<tr><td colspan="4" class="px-6 py-4 text-center text-red-600 dark:text-red-400">Error al cargar usuarios.</td></tr>`;
    toast('No se pudieron cargar los usuarios.', 'error');
  }
}

// ---------- Render ----------
function renderListaUsuarios() {
  const tbody = document.getElementById('usuarios-tbody');
  if (!tbody) return;

  const txt = filtroTexto.trim().toLowerCase();
  const filtrados = usuariosCache.filter((u) => {
    if (filtroRol !== 'todos' && (u.rol || 'nulo') !== filtroRol) return false;
    if (!txt) return true;
    const blob = [u.nombre, u.apellido, u.email, u.numeroDocumento]
      .filter(Boolean).join(' ').toLowerCase();
    return blob.includes(txt);
  });

  if (!filtrados.length) {
    tbody.innerHTML = `<tr><td colspan="4" class="px-6 py-4 text-center text-zinc-500 dark:text-zinc-400">Sin usuarios que coincidan.</td></tr>`;
    return;
  }

  const uidActual = auth.currentUser?.uid;

  tbody.innerHTML = filtrados.map((u) => {
    const iniciales = (((u.nombre?.[0] || '') + (u.apellido?.[0] || '')).toUpperCase())
      || (u.email?.[0] || '?').toUpperCase();

    const nombreCompleto = [u.nombre, u.apellido].filter(Boolean).join(' ') || '—';
    const docTxt = u.numeroDocumento
      ? `${u.tipoDocumento || ''} ${u.numeroDocumento}`.trim()
      : '—';

    const rol = u.rol || 'nulo';
    const esUnoMismo = u.uid === uidActual;
    const estaRevocado = rol === 'nulo';

    return `
      <tr class="hover:bg-zinc-50 dark:hover:bg-zinc-800/40">
        <td class="px-6 py-3">
          <div class="flex items-center gap-2.5 min-w-0">
            <div class="w-7 h-7 rounded-full bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 flex items-center justify-center text-[10px] font-medium shrink-0">
              ${esc(iniciales)}
            </div>
            <div class="min-w-0">
              <div class="text-xs font-medium text-zinc-900 dark:text-zinc-100 truncate">
                ${esc(nombreCompleto)}${esUnoMismo ? ' <span class="text-[10px] text-zinc-400">(vos)</span>' : ''}
              </div>
              <div class="text-[11px] text-zinc-400 dark:text-zinc-500 truncate">${esc(u.email || '—')}</div>
            </div>
          </div>
        </td>
        <td class="px-6 py-3 text-[11px] text-zinc-600 dark:text-zinc-400 font-mono">${esc(docTxt)}</td>
        <td class="px-6 py-3">
          <select
            data-uid="${esc(u.uid)}"
            data-rol-actual="${esc(rol)}"
            ${esUnoMismo ? 'disabled title="No puedes cambiar tu propio rol"' : ''}
            class="text-[11px] bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md px-2 py-1 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-400 disabled:opacity-50 disabled:cursor-not-allowed">
            ${ROLES_VALIDOS.map((r) =>
              `<option value="${r}" ${r === rol ? 'selected' : ''}>${ROL_LABEL[r]}</option>`
            ).join('')}
          </select>
        </td>
        <td class="px-6 py-3 text-right">
          ${estaRevocado
            ? `<span class="text-[10px] text-zinc-400 dark:text-zinc-500">—</span>`
            : `<button data-action="usuarios-revocar"
                       data-uid="${esc(u.uid)}"
                       class="text-[11px] font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 px-2 py-1 rounded-md transition-colors">
                 Revocar
               </button>`}
        </td>
      </tr>
    `;
  }).join('');

  // Wire cambios de rol en los dropdowns
  tbody.querySelectorAll('select[data-uid]').forEach((sel) => {
    sel.addEventListener('change', (e) => {
      const uid  = e.target.dataset.uid;
      const prev = e.target.dataset.rolActual;
      const nuevo = e.target.value;
      if (nuevo === prev) return;
      cambiarRolUsuario(uid, nuevo, e.target);
    });
  });
}

// ---------- Cambiar rol (con confirmación si es "nulo") ----------
async function cambiarRolUsuario(uid, nuevoRol, selectEl = null) {
  if (!ROLES_VALIDOS.includes(nuevoRol)) return;

  const u = usuariosCache.find((x) => x.uid === uid);
  const nombre = u
    ? ([u.nombre, u.apellido].filter(Boolean).join(' ') || u.email || uid)
    : uid;

  if (nuevoRol === 'nulo') {
    const ok = await confirmar({
      titulo: 'Revocar acceso',
      mensaje: `¿Revocar el acceso de "${nombre}"? Su rol quedará en "nulo" y perderá todos los permisos.\n\nPodés reactivarlo después cambiando el rol de nuevo.`,
      textoConfirmar: 'Revocar'
    });
    if (!ok) {
      if (selectEl && u) selectEl.value = u.rol || 'nulo';
      return;
    }
  }

  try {
    await updateDoc(doc(db, 'usuarios', uid), { rol: nuevoRol });
    if (u) u.rol = nuevoRol;
    toast(
      nuevoRol === 'nulo'
        ? 'Usuario revocado.'
        : `Rol actualizado: ${ROL_LABEL[nuevoRol]}`,
      'exito'
    );
    renderListaUsuarios();
  } catch (e) {
    console.error('[usuarios] cambiarRol:', e);
    toast('No se pudo actualizar el rol.', 'error');
    if (selectEl && u) selectEl.value = u.rol || 'nulo';
  }
}

// ---------- Handler público para el botón "Revocar" ----------
export function revocarUsuario(uid) {
  cambiarRolUsuario(uid, 'nulo');
}

// ---------- Crear Nuevo Usuario (S1) ----------
export function abrirModalNuevoUsuario() {
  const modal = document.getElementById('modal-nuevo-usuario');
  const form = document.getElementById('form-nuevo-usuario');
  if (!modal || !form) return;
  form.reset();
  modal.classList.remove('hidden');
}

export function cerrarModalNuevoUsuario() {
  const modal = document.getElementById('modal-nuevo-usuario');
  if (!modal) return;
  modal.classList.add('hidden');
}

export async function registrarNuevoUsuario(event) {
  event.preventDefault();
  const btn = document.getElementById('btn-crear-usuario');
  const textoOrig = btn.textContent;
  
  const nombre = document.getElementById('nu-nombre').value.trim();
  const apellido = document.getElementById('nu-apellido').value.trim();
  const tipoDocumento = document.getElementById('nu-tipo-doc').value;
  const numeroDocumento = document.getElementById('nu-num-doc').value.trim();
  const email = document.getElementById('nu-email').value.trim();
  const password = document.getElementById('nu-password').value;
  const rol = document.getElementById('nu-rol').value;

  btn.disabled = true;
  btn.textContent = 'Creando...';

  // Inicializamos la App Secundaria para no desloguear al admin
  const secondaryApp = initializeApp(firebaseConfig, "SecondaryApp");
  const secondaryAuth = getAuth(secondaryApp);

  try {
    // 1. Crear en Firebase Auth
    const userCred = await createUserWithEmailAndPassword(secondaryAuth, email, password);
    const nuevoUid = userCred.user.uid;

    // 2. Crear el documento en Firestore
    await setDoc(doc(db, 'usuarios', nuevoUid), {
      nombre,
      apellido,
      tipoDocumento,
      numeroDocumento,
      email,
      rol
    });

    toast('Usuario creado exitosamente.', 'exito');
    cerrarModalNuevoUsuario();
    cargarUsuarios(); // Recargar la tabla
    
  } catch (error) {
    console.error("Error al crear usuario:", error);
    if (error.code === 'auth/email-already-in-use') {
      toast('El correo ya está en uso.', 'error');
    } else if (error.code === 'auth/weak-password') {
      toast('La contraseña debe tener al menos 6 caracteres.', 'error');
    } else {
      toast(`Error: ${error.message}`, 'error');
    }
  } finally {
    // 3. Cerrar la app secundaria y destruirla
    await deleteApp(secondaryApp);
    btn.disabled = false;
    btn.textContent = textoOrig;
  }
}

// ---------- Filtros y Eventos ----------
export function initUsuarios() {
  const inputBusqueda = document.getElementById('usuarios-busqueda');
  const selectRol     = document.getElementById('usuarios-filtro-rol');
  const formNuevo     = document.getElementById('form-nuevo-usuario');

  if (inputBusqueda) {
    inputBusqueda.addEventListener('input', (e) => {
      filtroTexto = e.target.value;
      renderListaUsuarios();
    });
  }
  if (selectRol) {
    selectRol.addEventListener('change', (e) => {
      filtroRol = e.target.value;
      renderListaUsuarios();
    });
  }
  
  if (formNuevo) {
    formNuevo.addEventListener('submit', registrarNuevoUsuario);
  }

  // Listeners para generación y toggle de contraseña
  document.addEventListener('click', (e) => {
    if (e.target.closest('[data-action="generar-password"]')) {
      const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
      let pass = "";
      for (let i = 0; i < 10; i++) pass += chars.charAt(Math.floor(Math.random() * chars.length));
      const input = document.getElementById('nu-password');
      if (input) {
        input.value = pass;
        input.type = 'text'; // Mostrarla para que el admin la copie
      }
    }
    
    if (e.target.closest('[data-action="toggle-password"]')) {
      const btn = e.target.closest('[data-action="toggle-password"]');
      const input = document.getElementById(btn.dataset.target);
      if (input) {
        input.type = input.type === 'password' ? 'text' : 'password';
      }
    }
  });
}