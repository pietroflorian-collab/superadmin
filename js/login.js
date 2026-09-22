// ==========================================
// LOGIN — Firebase Auth
// ==========================================
import { auth } from './config/firebase.js';
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";

const UID_ADMIN = 'hb8ziusuzMeVYflWjsXn43VkcuT2';

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

function verificarAdmin(user) {
  if (user.uid !== UID_ADMIN) {
    mostrarStatus('✗ Esta cuenta no tiene permisos de administrador.', 'error');
    return false;
  }
  return true;
}

// Si ya hay sesión válida, redirige
onAuthStateChanged(auth, (user) => {
  if (user && user.uid === UID_ADMIN) {
    window.location.href = 'superadmin.html';
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
    if (!verificarAdmin(cred.user)) {
      await auth.signOut();
      return;
    }
    mostrarStatus('✓ Acceso concedido', 'exito');
    // onAuthStateChanged redirige
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
    if (!verificarAdmin(cred.user)) {
      await auth.signOut();
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