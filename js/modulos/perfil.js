// ==========================================
// MÓDULO: PERFIL ADMIN
// ==========================================
import { auth } from '../config/firebase.js';
import { sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";
import { toast, confirmar } from '../ui/notificaciones.js';
import { getTimeoutConfigurado, setTimeoutConfigurado } from '../core/sesion.js';

// ---------- Modo oscuro ----------
const DARK_KEY = 'superadmin.darkMode';

function aplicarTema(oscuro) {
  const html = document.documentElement;
  if (oscuro) html.classList.add('dark');
  else html.classList.remove('dark');

  const icono = document.getElementById('icon-dark-toggle');
  if (icono) {
    icono.setAttribute('data-lucide', oscuro ? 'sun' : 'moon');
    if (window.lucide) window.lucide.createIcons();
  }
}

export function getDarkMode() {
  return localStorage.getItem(DARK_KEY) === '1';
}

export function toggleDarkMode() {
  const nuevo = !getDarkMode();
  localStorage.setItem(DARK_KEY, nuevo ? '1' : '0');
  aplicarTema(nuevo);
  toast(nuevo ? 'Modo oscuro activado' : 'Modo claro activado', 'info', 2000);
}

// ---------- Init perfil ----------
export function initPerfil() {
  const user = auth.currentUser;
  if (!user) return;

  // Email + iniciales del avatar
  const elEmail = document.getElementById('perfil-email');
  if (elEmail) elEmail.textContent = user.email || '—';

  const elAvatar = document.getElementById('perfil-avatar');
  if (elAvatar && user.email) {
    elAvatar.textContent = user.email.slice(0, 2).toUpperCase();
  }

  // Dropdown timeout
  const select = document.getElementById('perfil-timeout');
  if (select) {
    select.value = String(getTimeoutConfigurado());
    select.addEventListener('change', (e) => {
      const min = parseInt(e.target.value, 10);
      setTimeoutConfigurado(min);
      toast(min === 0 ? 'Expiración desactivada' : `Expiración: ${min} min`, 'exito');
    });
  }

  // Aplicar tema guardado al cargar
  aplicarTema(getDarkMode());
}

export async function solicitarCambioPassword() {
  const user = auth.currentUser;
  if (!user || !user.email) return;

  const ok = await confirmar({
    titulo: 'Cambiar contraseña',
    mensaje: `Se enviará un correo a "${user.email}" con un enlace para restablecer tu contraseña.`,
    textoConfirmar: 'Enviar correo'
  });
  if (!ok) return;

  try {
    await sendPasswordResetEmail(auth, user.email);
    toast('Correo enviado. Revisa tu bandeja.', 'exito');
  } catch (e) {
    console.error(e);
    toast('No se pudo enviar el correo.', 'error');
  }
}