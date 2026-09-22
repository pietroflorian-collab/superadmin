// ==========================================
// MÓDULO: PERFIL ADMIN
// ==========================================
import { auth } from '../config/firebase.js';
import { sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";
import { toast, confirmar } from '../ui/notificaciones.js';
import { getTimeoutConfigurado, setTimeoutConfigurado } from '../core/sesion.js';

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