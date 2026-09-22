// ==========================================
// MÓDULO: BÓVEDA DE CREDENCIALES
// ==========================================
import { db, auth } from '../config/firebase.js';
import { doc, getDoc, setDoc, updateDoc } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";
import { getState, setState } from '../core/state.js';
import { WORKER_URL } from '../config/constantes.js';

// ---------- Estado local del módulo ----------
let proveedorActivo = 'google';

// ---------- Cambiar tab ----------
export function cambiarTabBoveda(proveedor) {
  proveedorActivo = proveedor;

  document.querySelectorAll('.boveda-tab').forEach((btn) => {
    const act = btn.dataset.provider === proveedor;
    btn.classList.toggle('bg-white', act);
    btn.classList.toggle('text-zinc-900', act);
    btn.classList.toggle('shadow-sm', act);
    btn.classList.toggle('text-zinc-500', !act);
  });

  document.querySelectorAll('.boveda-panel').forEach((p) => {
    p.classList.toggle('hidden', p.id !== `boveda-panel-${proveedor}`);
  });

  const bp = document.getElementById('btn-probar-conexion');
if (bp) bp.style.display = proveedor === 'google' ? 'none' : '';
}

// ---------- Cargar ----------
export async function cargarCredenciales() {
  const c = getState().clienteSeleccionado;
  if (!c) return;

  const status = document.getElementById('boveda-status');
  if (status) status.textContent = 'Cargando...';

  // Repo top-level (no depende de secretos/github)
  const repoInput = document.getElementById('boveda-github-repo');
  if (repoInput) repoInput.value = c.githubRepo || '';

  try {
    const provs = ['google', 'github', 'firebase', 'cloudflare'];    
    const snaps = await Promise.all(provs.map((p) =>
      getDoc(doc(db, 'clientes_agencia', c.id, 'secretos', p))
    ));

    snaps.forEach((snap, i) => {
      if (!snap.exists()) return;
      const prov = provs[i];
      const d = snap.data();

      if (prov === 'google') {
        document.getElementById('boveda-google-email').value = d.email || '';
        document.getElementById('boveda-google-password').value = d.password || '';
      } else if (prov === 'github') {
        document.getElementById('boveda-github-token').value = d.token || '';
        document.getElementById('boveda-github-password').value = d.password || '';
        document.getElementById('boveda-github-branch').value = d.branch || 'main';
        document.getElementById('boveda-github-path').value = d.pathMenuJson || 'data/menu.json';
      } else if (prov === 'firebase') {
        document.getElementById('boveda-firebase-project').value = d.projectId || '';
        document.getElementById('boveda-firebase-apikey').value = d.apiKey || '';
        document.getElementById('boveda-firebase-password').value = d.password || '';
      } else if (prov === 'cloudflare') {
        document.getElementById('boveda-cloudflare-account').value = d.accountId || '';
        document.getElementById('boveda-cloudflare-token').value = d.apiToken || '';
        document.getElementById('boveda-cloudflare-password').value = d.password || '';
        document.getElementById('boveda-cloudflare-zone').value = d.zoneId || '';
      }
    });

    if (status) status.textContent = 'Sincronizado';
  } catch (e) {
    console.error(e);
    if (status) status.textContent = 'Error al cargar';
  } finally {
    setTimeout(() => { if (status) status.textContent = ''; }, 3000);
  }
}

// ---------- Guardar ----------
export async function guardarCredenciales() {
  const c = getState().clienteSeleccionado;
  if (!c) return;

  const btn = document.getElementById('btn-guardar-credenciales');
  const orig = btn.textContent;
  btn.textContent = 'Guardando...';
  btn.disabled = true;
  const ts = new Date();

  let payload = {};
  let docRef = null;

  try {
    if (proveedorActivo === 'google') {
      docRef = doc(db, 'clientes_agencia', c.id, 'secretos', 'google');
      payload = {
        email: document.getElementById('boveda-google-email').value.trim(),
        password: document.getElementById('boveda-google-password').value,
        actualizadoEn: ts
      };
    
    } else if (proveedorActivo === 'github') {
  const repo = document.getElementById('boveda-github-repo').value.trim();
  if (repo && !/^[\w.-]+\/[\w.-]+$/.test(repo)) {
    throw new Error('Repo inválido. Formato: owner/repo');
  }
  docRef = doc(db, 'clientes_agencia', c.id, 'secretos', 'github');
  payload = {
    token: document.getElementById('boveda-github-token').value.trim(),
    password: document.getElementById('boveda-github-password').value,
    branch: document.getElementById('boveda-github-branch').value.trim() || 'main',
    pathMenuJson: document.getElementById('boveda-github-path').value.trim() || 'data/menu.json',
    actualizadoEn: ts
  };
    } else if (proveedorActivo === 'cloudflare') {
      docRef = doc(db, 'clientes_agencia', c.id, 'secretos', 'cloudflare');
      payload = {
        accountId: document.getElementById('boveda-cloudflare-account').value.trim(),
        apiToken: document.getElementById('boveda-cloudflare-token').value.trim(),
        password: document.getElementById('boveda-cloudflare-password').value,
        zoneId: document.getElementById('boveda-cloudflare-zone').value.trim(),
        actualizadoEn: ts
      };
       } else if (proveedorActivo === 'firebase') {
      docRef = doc(db, 'clientes_agencia', c.id, 'secretos', 'firebase');
      payload = {
        projectId: document.getElementById('boveda-firebase-project').value.trim(),
        apiKey: document.getElementById('boveda-firebase-apikey').value.trim(),
        password: document.getElementById('boveda-firebase-password').value,
        actualizadoEn: ts
      };
    }

    await setDoc(docRef, payload, { merge: true });
     

    // Persistir githubRepo top-level si estamos en GitHub
if (proveedorActivo === 'github') {
  const repo = document.getElementById('boveda-github-repo').value.trim();
  await updateDoc(doc(db, 'clientes_agencia', c.id), { githubRepo: repo });
  setState({ clienteSeleccionado: { ...c, githubRepo: repo } });
  const gdGh = document.getElementById('gd-github');
  if (gdGh) gdGh.textContent = repo || '—';
}

    const st = document.getElementById('boveda-status');
    if (st) {
      st.textContent = `✓ ${proveedorActivo} guardado`;
      st.classList.add('text-emerald-600');
      setTimeout(() => { st.textContent = ''; st.classList.remove('text-emerald-600'); }, 3000);
    }
  } catch (e) {
  console.error(e);
  const st = document.getElementById('boveda-status');
  if (st) st.textContent = `✗ ${e.message || 'Error al guardar'}`;

  } finally {
    btn.textContent = orig;
    btn.disabled = false;
  }
}


export async function probarConexion() {
  const c = getState().clienteSeleccionado;
  const btn = document.getElementById('btn-probar-conexion');
  const status = document.getElementById('boveda-status');
  const orig = btn.textContent;
  btn.textContent = 'Probando...';
  btn.disabled = true;
  status.textContent = '';
  status.className = 'text-[10px] font-mono flex-1';

  try {
    let mensaje = '';
    let ok = false;

    if (proveedorActivo === 'github') {
      // GitHub: llamada directa (ya funciona sin Worker)
      const token = document.getElementById('boveda-github-token').value.trim();
      if (!token) throw new Error('Falta el token');

      const r1 = await fetch('https://api.github.com/user', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!r1.ok) throw new Error(`Token inválido (${r1.status})`);
      const user = await r1.json();

      const repo = c?.githubRepo || '';
      if (repo) {
        const r2 = await fetch(`https://api.github.com/repos/${repo}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        mensaje = r2.ok ? `✓ ${user.login} · repo accesible` : `Token OK, repo inaccesible (${r2.status})`;
        ok = r2.ok;
      } else {
        mensaje = `✓ Token OK: ${user.login}`;
        ok = true;
      }
    } else if (proveedorActivo === 'firebase') {
      // Firebase: vía Worker (evita CORS)
      const projectId = document.getElementById('boveda-firebase-project').value.trim();
      const apiKey = document.getElementById('boveda-firebase-apikey').value.trim();
      if (!projectId || !apiKey) throw new Error('Falta projectId o apiKey');

            const idToken = await auth.currentUser.getIdToken();
      const res = await fetch(`${WORKER_URL}/validar/firebase`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
        body: JSON.stringify({ projectId, apiKey })
      });
      
      const data = await res.json();
      mensaje = data.ok ? `✓ ${data.mensaje}` : `✗ ${data.error}`;
      ok = data.ok;
    } else if (proveedorActivo === 'cloudflare') {
      // Cloudflare: vía Worker (evita CORS)
      const apiToken = document.getElementById('boveda-cloudflare-token').value.trim();
      const zoneId = document.getElementById('boveda-cloudflare-zone').value.trim();
      if (!apiToken) throw new Error('Falta API Token');

      const idToken = await auth.currentUser.getIdToken();
      const res = await fetch(`${WORKER_URL}/validar/cloudflare`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
        body: JSON.stringify({ apiToken, zoneId })
      });
      const data = await res.json();
      mensaje = data.ok ? `✓ ${data.mensaje}` : `✗ ${data.error}`;
      ok = data.ok;
    } else if (proveedorActivo === 'google') {
      mensaje = '⚠ Validación de Google no disponible';
      ok = false;
    }

    status.textContent = mensaje;
    status.classList.add(ok ? 'text-emerald-600' : 'text-amber-600');
  } catch (e) {
    status.textContent = `✗ ${e.message}`;
    status.classList.add('text-red-500');
  } finally {
    btn.textContent = orig;
    btn.disabled = false;
    setTimeout(() => { status.textContent = ''; status.className = 'text-[10px] font-mono flex-1'; }, 8000);
  }
}

// ---------- Toggle visibilidad ----------
export function toggleVisibilidadToken(targetId) {
  const input = document.getElementById(targetId);
  if (!input) return;
  input.type = input.type === 'password' ? 'text' : 'password';
}

// ---------- Inicializar (llamado al abrir el drawer) ----------
export function inicializarBoveda() {
  cambiarTabBoveda('google');
  cargarCredenciales();
}

// ---------- Limpiar (llamado al cerrar el drawer) ----------
export function limpiarBoveda() {
  document.querySelectorAll(
    '#boveda-panel-google input, #boveda-panel-github input, #boveda-panel-firebase input, #boveda-panel-cloudflare input'
  ).forEach((i) => { i.value = ''; });
  const st = document.getElementById('boveda-status');
  if (st) st.textContent = '';
}