// ==========================================
// CORE: SESIÓN — Watchdog de inactividad
// ==========================================
import { auth } from '../config/firebase.js';
import { signOut } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";
import { toast } from '../ui/notificaciones.js';

const EVENTOS = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
const CHECK_INTERVALO_MS = 30 * 1000;   // comprueba cada 30s
const ESPERA_ANTES_SIGNOUT_MS = 2000;   // deja ver el toast antes del redirect

let intervalId = null;
let ultimaActividad = Date.now();
let timeoutMs = 30 * 60 * 1000;         // default 30 min
let expirando = false;

function registrarActividad() {
  if (expirando) return;
  ultimaActividad = Date.now();
}

function alVolverALaPestana() {
  if (!document.hidden) registrarActividad();
}

function vigilar() {
  if (expirando) return;
  if (Date.now() - ultimaActividad >= timeoutMs) expirar();
}

async function expirar() {
  if (expirando) return;
  expirando = true;
  detenerVigilancia();

  toast('Sesión cerrada por expiración de tiempo', 'aviso', 5000);

  await new Promise((r) => setTimeout(r, ESPERA_ANTES_SIGNOUT_MS));

  // onAuthStateChanged en master.js hará el redirect a login.html
  await signOut(auth);
}

export function iniciarVigilancia(minutos = getTimeoutConfigurado()) {
  if (minutos === 0) { detenerVigilancia(); return; }
  detenerVigilancia();                    // idempotente por si acaso
  timeoutMs = minutos * 60 * 1000;
  ultimaActividad = Date.now();
  expirando = false;

  EVENTOS.forEach((ev) =>
    window.addEventListener(ev, registrarActividad, { passive: true })
  );
  document.addEventListener('visibilitychange', alVolverALaPestana);

  intervalId = setInterval(vigilar, CHECK_INTERVALO_MS);
}

export function detenerVigilancia() {
  if (intervalId) { clearInterval(intervalId); intervalId = null; }
  EVENTOS.forEach((ev) =>
    window.removeEventListener(ev, registrarActividad)
  );
  document.removeEventListener('visibilitychange', alVolverALaPestana);
}

// ---------- Configuración persistente ----------
const STORAGE_KEY = 'superadmin.timeoutMin';
const DEFAULT_MIN = 30;

export function getTimeoutConfigurado() {
  const v = parseInt(localStorage.getItem(STORAGE_KEY), 10);
  return isNaN(v) ? DEFAULT_MIN : v;
}

export function setTimeoutConfigurado(minutos) {
  localStorage.setItem(STORAGE_KEY, String(minutos));
  if (minutos === 0) detenerVigilancia();
  else iniciarVigilancia(minutos);
}