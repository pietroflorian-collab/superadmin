// ==========================================
// LOGIN — Firebase Auth
// ==========================================
import { auth, db } from './config/firebase.js';
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

const ROLES_VALIDOS = ['admin', 'ventas', 'produccion'];

if (localStorage.getItem('superadmin.darkMode') === '1') {
  document.documentElement.classList.add('dark');
}

const form = document.getElementById('form-login');
const emailInput = document.getElementById('login-email');
const passInput = document.getElementById('login-password');
const btnLogin = document.getElementById('btn-login');
const btnGoogle = document.getElementById('btn-login-google');
const btnTogglePass = document.getElementById('btn-toggle-pass');
const status = document.getElementById('login-status');

function mostrarStatus(msg, tipo = 'info') {
  const colores = {
    info:  'text-zinc-500',
    error: 'text-red-500',
    exito: 'text-emerald-600'
  };
  status.className = `text-[11px] font-mono min-h-[1rem] ${colores[tipo] || colores.info}`;
  status.textContent = msg;
}

// Obtiene el rol del usuario desde usuarios/{uid}
async function obtenerRol(user) {
  try {
    const snap = await getDoc(doc(db, 'usuarios', user.uid));
    if (!snap.exists()) return null;
    const rol = snap.data().rol;
    return ROLES_VALIDOS.includes(rol) ? rol : null;
  } catch (e) {
    console.error('Error al verificar rol:', e);
    return null;
  }
}

// Si ya hay sesión válida, redirige
onAuthStateChanged(auth, async (user) => {
  if (user && (await obtenerRol(user))) {
    const retorno = new URLSearchParams(location.search).get('return');
    window.location.href = retorno ? decodeURIComponent(retorno) : 'superadmin.html';
  }
});

// Toggle contraseña
btnTogglePass.addEventListener('click', () => {
  passInput.type = passInput.type === 'password' ? 'text' : 'password';
});

// Email + Password
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = emailInput.value.trim();
  const pass = passInput.value;
  if (!email || !pass) { mostrarStatus('Completa correo y contraseña.', 'error'); return; }

  btnLogin.disabled = true;
  const orig = btnLogin.textContent;
  btnLogin.textContent = 'Entrando...';
  mostrarStatus('');

  try {
    const cred = await signInWithEmailAndPassword(auth, email, pass);
    if (!(await obtenerRol(cred.user))) {
      await auth.signOut();
      mostrarStatus('✗ Esta cuenta no tiene permisos.', 'error');
      return;
    }
    mostrarStatus('✓ Acceso concedido', 'exito');
  } catch (err) {
    console.error(err);
    const mensajes = {
      'auth/invalid-credential': 'Correo o contraseña incorrectos.',
      'auth/user-not-found':     'Usuario no encontrado.',
      'auth/wrong-password':     'Contraseña incorrecta.',
      'auth/too-many-requests':  'Demasiados intentos. Espera un momento.'
    };
    mostrarStatus(`✗ ${mensajes[err.code] || 'No se pudo iniciar sesión.'}`, 'error');
  } finally {
    btnLogin.disabled = false;
    btnLogin.textContent = orig;
  }
});

// Google
btnGoogle.addEventListener('click', async () => {
  btnGoogle.disabled = true;
  mostrarStatus('');
  try {
    const provider = new GoogleAuthProvider();
    const cred = await signInWithPopup(auth, provider);
    if (!(await obtenerRol(cred.user))) {
      await auth.signOut();
      mostrarStatus('✗ Esta cuenta no tiene permisos.', 'error');
      return;
    }
    mostrarStatus('✓ Acceso concedido', 'exito');
  } catch (err) {
    console.error(err);
    if (err.code === 'auth/popup-closed-by-user') return;
    mostrarStatus('✗ No se pudo iniciar con Google.', 'error');
  } finally {
    btnGoogle.disabled = false;
  }
});