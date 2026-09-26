// ==========================================
// MÓDULO: GESTIONAR — Lógica de secciones
// ==========================================
import { db, auth } from '../config/firebase.js';
import { doc, updateDoc, getDoc } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";
import { DIAS_PRORROGA, REDES_DISPONIBLES } from '../config/constantes.js';
import { getState, setState } from '../core/state.js';
import {
  esc, refrescarIconos, formatearFecha, formatearFechaHora,
  sumarDias, obtenerRedMeta
} from '../core/helpers.js';
import {
  renderRedesGestionar, renderRedEditor,
  renderDireccionesGestionar, renderDireccionEditor
} from '../ui/render.js';
import { cargarClientes } from './clientes.js';
import { WORKER_URL } from '../config/constantes.js';
import { toast, confirmar } from '../ui/notificaciones.js';

// ---------- Estado local ----------
let redesGestionar = [];
let direccionesGestionar = [];
let editandoRedes = false;
let editandoDirecciones = false;

// ---------- Cargar datos del cliente en el DOM ----------
export function cargarDatosCliente(c) {
  if (!c) return;

  // Datos básicos
  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  set('gd-nombre-cliente', c.nombreCliente || '—');
  set('gd-nombre-comercial', c.nombreComercial || '—');
  set('gd-documento', c.numeroDocumento ? `${c.tipoDocumento || ''} ${c.numeroDocumento}` : '—');
  set('gd-telefono', c.telefono || '—');
  set('gd-correo', c.correoOperativo || '—');
  set('gd-github', c.githubRepo || '—');

  // Redes — modo lectura
  editandoRedes = false;
  redesGestionar = Array.isArray(c.redes) ? [...c.redes] : [];
  const gdRedes = document.getElementById('gd-redes');
  if (gdRedes) renderRedesGestionar(gdRedes, redesGestionar);
  const redesAcc = document.getElementById('gd-redes-acciones');
  if (redesAcc) { redesAcc.classList.add('hidden'); redesAcc.classList.remove('flex'); }
  const btnRedes = document.getElementById('btn-toggle-redes');
  if (btnRedes) btnRedes.textContent = 'Editar';

  // Direcciones — modo lectura
  editandoDirecciones = false;
  direccionesGestionar = Array.isArray(c.direcciones) ? [...c.direcciones] : [];
  const gdDir = document.getElementById('gd-direcciones');
  if (gdDir) renderDireccionesGestionar(gdDir, direccionesGestionar);
  const dirAcc = document.getElementById('gd-direcciones-acciones');
  if (dirAcc) { dirAcc.classList.add('hidden'); dirAcc.classList.remove('flex'); }
  const btnDir = document.getElementById('btn-toggle-direcciones');
  if (btnDir) btnDir.textContent = 'Editar';

  // Fechas
  set('gd-fecha-creacion', formatearFechaHora(c.fechaCreacion));
  set('gd-fecha-produccion', formatearFecha(c.fechaProduccion));

  const tieneProd = !!c.fechaProduccion;
  document.getElementById('gd-fecha-produccion-edit')?.classList.toggle('hidden', tieneProd);
  document.getElementById('gd-fecha-produccion-bloqueada')?.classList.toggle('hidden', !tieneProd);
  const inpProd = document.getElementById('gd-input-produccion');
  if (inpProd) inpProd.value = c.fechaProduccion || '';

  set('gd-fecha-vencimiento', formatearFecha(c.fechaVencimiento));
  const prorroga = c.fechaVencimiento ? sumarDias(c.fechaVencimiento, DIAS_PRORROGA) : null;
  set('gd-prorroga', prorroga ? formatearFecha(prorroga) : '—');
  const inpVenc = document.getElementById('gd-input-vencimiento');
  if (inpVenc) inpVenc.value = c.fechaVencimiento || '';

  // Apariencia
  const ap = c.apariencia || {};
  const colorInput = document.getElementById('drawer-color-primario');
  if (colorInput) {
    colorInput.value = ap.colorPrimario || '#18181b';
    const vcp = document.getElementById('valor-color-primario');
    if (vcp) vcp.textContent = colorInput.value.toUpperCase();
  }
  const tipoSelect = document.getElementById('drawer-tipografia');
  if (tipoSelect) tipoSelect.value = ap.tipografia || 'Inter';
  const radioInput = document.getElementById('drawer-radio-bordes');
  if (radioInput) {
    radioInput.value = ap.radioBordes ?? '8';
    const vrb = document.getElementById('valor-radio-bordes');
    if (vrb) vrb.textContent = radioInput.value + 'px';
  }

  refrescarIconos();
}

// ---------- Guardar: Apariencia ----------
export async function guardarConfiguracion() {
  const c = getState().clienteSeleccionado;
  if (!c) return;
  const btn = document.getElementById('btn-guardar-apariencia');
  const orig = btn.textContent;
  btn.textContent = 'Guardando...'; btn.disabled = true;

  const nueva = {
    colorPrimario: document.getElementById('drawer-color-primario').value,
    tipografia: document.getElementById('drawer-tipografia').value,
    radioBordes: document.getElementById('drawer-radio-bordes').value
  };

  try {
    await updateDoc(doc(db, "clientes_agencia", c.id), { apariencia: nueva });
    const s = await getDoc(doc(db, "clientes_agencia", c.id));
    if (s.exists()) setState({ clienteSeleccionado: { id: c.id, ...s.data() } });
    toast('Apariencia actualizada.', 'exito');
  } catch (e) { console.error(e); toast('Error al guardar.', 'error'); }
  finally { btn.textContent = orig; btn.disabled = false; }
}

// ---------- Guardar: Redes ----------
export async function guardarRedes() {
  const c = getState().clienteSeleccionado;
  if (!c) return;
  const redesLimp = redesGestionar.filter((r) => r.valor && r.valor.trim());
  for (const r of redesLimp) {
    const meta = obtenerRedMeta(r.tipo, REDES_DISPONIBLES);
    if (!meta.regex.test(r.valor.trim())) {
      toast(`Formato inválido en ${meta.label}: ${meta.placeholder}`, 'aviso'); return;
    }
  }
  try {
    await updateDoc(doc(db, "clientes_agencia", c.id), {
      redes: redesLimp.map((r) => ({ tipo: r.tipo, valor: r.valor.trim() }))
    });
    setState({ clienteSeleccionado: { ...c, redes: redesLimp } });
    toast('Redes guardadas.', 'exito');
    editandoRedes = false;
    renderRedesGestionar(document.getElementById('gd-redes'), redesLimp);
    document.getElementById('gd-redes-acciones').classList.add('hidden');
    document.getElementById('gd-redes-acciones').classList.remove('flex');
    document.getElementById('btn-toggle-redes').textContent = 'Editar';
  } catch (e) { console.error(e); toast('Error al guardar redes.', 'error'); }
}

// ---------- Guardar: Direcciones ----------
export async function guardarDirecciones() {
  const c = getState().clienteSeleccionado;
  if (!c) return;
  const limpias = direccionesGestionar.filter((d) => d.direccion && d.direccion.trim());
  try {
    await updateDoc(doc(db, "clientes_agencia", c.id), { direcciones: limpias });
    setState({ clienteSeleccionado: { ...c, direcciones: limpias } });
    toast('Direcciones guardadas.', 'exito');
    editandoDirecciones = false;
    renderDireccionesGestionar(document.getElementById('gd-direcciones'), limpias);
    document.getElementById('gd-direcciones-acciones').classList.add('hidden');
    document.getElementById('gd-direcciones-acciones').classList.remove('flex');
    document.getElementById('btn-toggle-direcciones').textContent = 'Editar';
  } catch (e) { console.error(e); toast('Error al guardar direcciones.', 'error'); }
}

// ---------- Guardar: Fechas ----------
export async function guardarFechas() {
  const c = getState().clienteSeleccionado;
  if (!c) return;
  const fv = document.getElementById('gd-input-vencimiento').value;
  if (!fv) { toast('Selecciona una fecha de vencimiento.', 'aviso'); return; }
  try {
    await updateDoc(doc(db, "clientes_agencia", c.id), { fechaVencimiento: fv });
    setState({ clienteSeleccionado: { ...c, fechaVencimiento: fv } });
    document.getElementById('gd-fecha-vencimiento').textContent = formatearFecha(fv);
    const pr = sumarDias(fv, DIAS_PRORROGA);
    document.getElementById('gd-prorroga').textContent = pr ? formatearFecha(pr) : '—';
    toast('Fecha de vencimiento actualizada.', 'exito');
  } catch (e) { console.error(e); toast('Error al guardar.', 'error'); }
}

// ---------- Guardar: Fecha Producción ----------
export async function guardarFechaProduccion() {
  const c = getState().clienteSeleccionado;
  if (!c) return;
  if (c.fechaProduccion) {
    toast('La fecha de producción ya está fijada y no puede modificarse.', 'aviso'); return;
  }
  const fp = document.getElementById('gd-input-produccion').value;
  if (!fp) { toast('Selecciona una fecha de producción.', 'aviso'); return; }
  try {
    await updateDoc(doc(db, "clientes_agencia", c.id), { fechaProduccion: fp });
    setState({ clienteSeleccionado: { ...c, fechaProduccion: fp } });
    document.getElementById('gd-fecha-produccion').textContent = formatearFecha(fp);
    document.getElementById('gd-fecha-produccion-edit').classList.add('hidden');
    document.getElementById('gd-fecha-produccion-bloqueada').classList.remove('hidden');
    toast('Fecha de producción fijada.', 'exito');
  } catch (e) { console.error(e); toast('Error al guardar.', 'error');}
}

// ---------- Toggle edición: Redes ----------
export function toggleEditarRedes() {
  const c = getState().clienteSeleccionado;
  if (!c) return;
  editandoRedes = !editandoRedes;

  if (editandoRedes) {
    redesGestionar = Array.isArray(c.redes) ? [...c.redes] : [];
    renderRedEditor(document.getElementById('gd-redes'), redesGestionar, (r) => { redesGestionar = r; }, 'gd');
  } else {
    redesGestionar = Array.isArray(c.redes) ? [...c.redes] : [];
    renderRedesGestionar(document.getElementById('gd-redes'), redesGestionar);
  }

  document.getElementById('gd-redes-acciones').classList.toggle('hidden', !editandoRedes);
  document.getElementById('gd-redes-acciones').classList.toggle('flex', editandoRedes);
  document.getElementById('btn-toggle-redes').textContent = editandoRedes ? 'Cancelar' : 'Editar';
  refrescarIconos();
}

// ---------- Toggle edición: Direcciones ----------
export function toggleEditarDirecciones() {
  const c = getState().clienteSeleccionado;
  if (!c) return;
  editandoDirecciones = !editandoDirecciones;

  if (editandoDirecciones) {
    direccionesGestionar = Array.isArray(c.direcciones) ? [...c.direcciones] : [];
    renderDireccionEditor(document.getElementById('gd-direcciones'), direccionesGestionar, (d) => { direccionesGestionar = d; }, 'gd');
  } else {
    direccionesGestionar = Array.isArray(c.direcciones) ? [...c.direcciones] : [];
    renderDireccionesGestionar(document.getElementById('gd-direcciones'), direccionesGestionar);
  }

  document.getElementById('gd-direcciones-acciones').classList.toggle('hidden', !editandoDirecciones);
  document.getElementById('gd-direcciones-acciones').classList.toggle('flex', editandoDirecciones);
  document.getElementById('btn-toggle-direcciones').textContent = editandoDirecciones ? 'Cancelar' : 'Editar';
  refrescarIconos();
}

// ---------- Añadir/Quitar redes ----------
export function addRedGestionar() {
  redesGestionar.push({ tipo: 'instagram', valor: '' });
  renderRedEditor(document.getElementById('gd-redes'), redesGestionar, (r) => { redesGestionar = r; }, 'gd');
}

export function rmRedGestionar(el) {
  redesGestionar.splice(+el.dataset.idx, 1);
  renderRedEditor(document.getElementById('gd-redes'), redesGestionar, (r) => { redesGestionar = r; }, 'gd');
}

export function addDireccionGestionar() {
  direccionesGestionar.push({ tipo: 'establecimiento', nombre: '', direccion: '', referencia: '' });
  renderDireccionEditor(document.getElementById('gd-direcciones'), direccionesGestionar, (d) => { direccionesGestionar = d; }, 'gd');
}

export function rmDireccionGestionar(el) {
  direccionesGestionar.splice(+el.dataset.idx, 1);
  renderDireccionEditor(document.getElementById('gd-direcciones'), direccionesGestionar, (d) => { direccionesGestionar = d; }, 'gd');
}

// ---------- Publicar en GitHub ----------
export async function publicarEnGitHub() {
  const c = getState().clienteSeleccionado;
  if (!c) return;

  const btn = document.getElementById('btn-publicar-github');
  const orig = btn.innerHTML;
  btn.innerHTML = '<span class="animate-pulse">Publicando...</span>';
  btn.disabled = true;

  try {
    const githubSnap = await getDoc(doc(db, 'clientes_agencia', c.id, 'secretos', 'github'));
    if (!githubSnap.exists()) throw new Error('No hay credenciales de GitHub guardadas');
    const ghData = githubSnap.data();
    if (!ghData.token) throw new Error('Falta el token de GitHub');
    if (!c.githubRepo) throw new Error('El cliente no tiene repo GitHub asignado');

    const apariencia = {
      colorPrimario: document.getElementById('drawer-color-primario').value,
      tipografia: document.getElementById('drawer-tipografia').value,
      radioBordes: document.getElementById('drawer-radio-bordes').value
    };

    const idToken = await auth.currentUser.getIdToken();
    const res = await fetch(`${WORKER_URL}/publicar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
      body: JSON.stringify({
        repo: c.githubRepo,
        branch: ghData.branch || 'main',
        path: ghData.pathMenuJson || 'data/menu.json',
        token: ghData.token,
        apariencia
      })
    });
    const data = await res.json();

    if (data.ok) {
      toast(`✓ ${data.mensaje}\nCommit: ${data.commit?.substring(0, 7) || '—'}`, 'exito');
    } else {
      toast(`✗ Error: ${data.error}`, 'error');
    }
  } catch (e) {
    console.error(e);
    toast(`Error: ${e.message}`, 'error');
  } finally {
    btn.innerHTML = orig;
    btn.disabled = false;
    if (typeof window.lucide !== 'undefined') window.lucide.createIcons();
  }
}