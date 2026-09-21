// ==========================================
// MÓDULO: GESTIONAR — Drawer derecho
// ==========================================
import { db } from '../config/firebase.js';
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
import { WORKER_URL, WORKER_API_KEY } from '../config/constantes.js';

// ---------- Estado local del módulo ----------
let redesGestionar = [];
let direccionesGestionar = [];
let editandoRedes = false;
let editandoDirecciones = false;

// ---------- Abrir ----------
export async function abrirPanelCliente(id) {
  const drawer = document.getElementById('client-drawer');
  const backdrop = document.getElementById('backdrop');

  try {
    const docRef = doc(db, "clientes_agencia", id);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return;

    setState({ clienteSeleccionado: { id, ...docSnap.data() } });
    const c = getState().clienteSeleccionado;

    const nombre = c.nombreComercial || c.nombreCliente || 'Sin nombre';
    document.getElementById('drawer-nombre-cliente').textContent = nombre;
    document.getElementById('drawer-avatar').textContent = nombre.substring(0, 2).toUpperCase();

    document.getElementById('gd-nombre-cliente').textContent = c.nombreCliente || '—';
    document.getElementById('gd-nombre-comercial').textContent = c.nombreComercial || '—';
    document.getElementById('gd-documento').textContent = c.numeroDocumento
      ? `${c.tipoDocumento || ''} ${c.numeroDocumento}` : '—';
    document.getElementById('gd-telefono').textContent = c.telefono || '—';
    document.getElementById('gd-correo').textContent = c.correoOperativo || '—';
    document.getElementById('gd-github').textContent = c.githubRepo || '—';

    // Redes — modo lectura
    editandoRedes = false;
    redesGestionar = Array.isArray(c.redes) ? [...c.redes] : [];
    renderRedesGestionar(document.getElementById('gd-redes'), redesGestionar);
    document.getElementById('gd-redes-acciones').classList.add('hidden');
    document.getElementById('gd-redes-acciones').classList.remove('flex');
    document.getElementById('btn-toggle-redes').textContent = 'Editar';

    // Direcciones — modo lectura
    editandoDirecciones = false;
    direccionesGestionar = Array.isArray(c.direcciones) ? [...c.direcciones] : [];
    renderDireccionesGestionar(document.getElementById('gd-direcciones'), direccionesGestionar);
    document.getElementById('gd-direcciones-acciones').classList.add('hidden');
    document.getElementById('gd-direcciones-acciones').classList.remove('flex');
    document.getElementById('btn-toggle-direcciones').textContent = 'Editar';

    // Fechas
    document.getElementById('gd-fecha-creacion').textContent = formatearFechaHora(c.fechaCreacion);
    document.getElementById('gd-fecha-produccion').textContent = formatearFecha(c.fechaProduccion);

    const tieneProd = !!c.fechaProduccion;
    document.getElementById('gd-fecha-produccion-edit').classList.toggle('hidden', tieneProd);
    document.getElementById('gd-fecha-produccion-bloqueada').classList.toggle('hidden', !tieneProd);
    document.getElementById('gd-input-produccion').value = c.fechaProduccion || '';

    document.getElementById('gd-fecha-vencimiento').textContent = formatearFecha(c.fechaVencimiento);
    const prorroga = c.fechaVencimiento ? sumarDias(c.fechaVencimiento, DIAS_PRORROGA) : null;
    document.getElementById('gd-prorroga').textContent = prorroga ? formatearFecha(prorroga) : '—';
    document.getElementById('gd-input-vencimiento').value = c.fechaVencimiento || '';

        // Apariencia
    const ap = c.apariencia || {};
    const colorInput = document.getElementById('drawer-color-primario');
    colorInput.value = ap.colorPrimario || '#18181b';
    document.getElementById('valor-color-primario').textContent = colorInput.value.toUpperCase();
    document.getElementById('drawer-tipografia').value = ap.tipografia || 'Inter';
    const radioInput = document.getElementById('drawer-radio-bordes');
    radioInput.value = ap.radioBordes ?? '8';
    document.getElementById('valor-radio-bordes').textContent = radioInput.value + 'px';

    drawer.classList.remove('translate-x-full');
    backdrop.classList.remove('hidden');
    refrescarIconos();
  } catch (error) {
    console.error("Error al abrir panel:", error);
  }
}

// ---------- Cerrar ----------
export function cerrarPanel() {
  const drawer = document.getElementById('client-drawer');
  const backdrop = document.getElementById('backdrop');

  drawer.classList.add('translate-x-full');
  backdrop.classList.add('hidden');
  setState({ clienteSeleccionado: null });
  editandoRedes = false;
  editandoDirecciones = false;

  // Limpieza de bóveda la hace master.js al cerrar
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
    alert("Apariencia actualizada.");
  } catch (e) { console.error(e); alert("Error al guardar."); }
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
      alert(`Formato inválido en ${meta.label}: ${meta.placeholder}`);
      return;
    }
  }
  try {
    await updateDoc(doc(db, "clientes_agencia", c.id), {
      redes: redesLimp.map((r) => ({ tipo: r.tipo, valor: r.valor.trim() }))
    });
    setState({ clienteSeleccionado: { ...c, redes: redesLimp } });
    alert("Redes guardadas.");
    editandoRedes = false;
    renderRedesGestionar(document.getElementById('gd-redes'), redesLimp);
    document.getElementById('gd-redes-acciones').classList.add('hidden');
    document.getElementById('gd-redes-acciones').classList.remove('flex');
    document.getElementById('btn-toggle-redes').textContent = 'Editar';
  } catch (e) { console.error(e); alert("Error al guardar redes."); }
}

// ---------- Guardar: Direcciones ----------
export async function guardarDirecciones() {
  const c = getState().clienteSeleccionado;
  if (!c) return;
  const limpias = direccionesGestionar.filter((d) => d.direccion && d.direccion.trim());
  try {
    await updateDoc(doc(db, "clientes_agencia", c.id), { direcciones: limpias });
    setState({ clienteSeleccionado: { ...c, direcciones: limpias } });
    alert("Direcciones guardadas.");
    editandoDirecciones = false;
    renderDireccionesGestionar(document.getElementById('gd-direcciones'), limpias);
    document.getElementById('gd-direcciones-acciones').classList.add('hidden');
    document.getElementById('gd-direcciones-acciones').classList.remove('flex');
    document.getElementById('btn-toggle-direcciones').textContent = 'Editar';
  } catch (e) { console.error(e); alert("Error al guardar direcciones."); }
}

// ---------- Guardar: Fechas ----------
export async function guardarFechas() {
  const c = getState().clienteSeleccionado;
  if (!c) return;
  const fv = document.getElementById('gd-input-vencimiento').value;
  if (!fv) { alert("Selecciona una fecha de vencimiento."); return; }
  try {
    await updateDoc(doc(db, "clientes_agencia", c.id), { fechaVencimiento: fv });
    setState({ clienteSeleccionado: { ...c, fechaVencimiento: fv } });
    document.getElementById('gd-fecha-vencimiento').textContent = formatearFecha(fv);
    const pr = sumarDias(fv, DIAS_PRORROGA);
    document.getElementById('gd-prorroga').textContent = pr ? formatearFecha(pr) : '—';
    alert("Fecha de vencimiento actualizada.");
  } catch (e) { console.error(e); alert("Error al guardar."); }
}

// ---------- Guardar: Fecha Producción ----------
export async function guardarFechaProduccion() {
  const c = getState().clienteSeleccionado;
  if (!c) return;
  if (c.fechaProduccion) {
    alert("La fecha de producción ya está fijada y no puede modificarse.");
    return;
  }
  const fp = document.getElementById('gd-input-produccion').value;
  if (!fp) { alert("Selecciona una fecha de producción."); return; }
  try {
    await updateDoc(doc(db, "clientes_agencia", c.id), { fechaProduccion: fp });
    setState({ clienteSeleccionado: { ...c, fechaProduccion: fp } });
    document.getElementById('gd-fecha-produccion').textContent = formatearFecha(fp);
    document.getElementById('gd-fecha-produccion-edit').classList.add('hidden');
    document.getElementById('gd-fecha-produccion-bloqueada').classList.remove('hidden');
    alert("Fecha de producción fijada.");
  } catch (e) { console.error(e); alert("Error al guardar."); }
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

// ---------- Añadir/Quitar redes (modo edición en drawer) ----------
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
    if (!githubSnap.exists()) {
      throw new Error('No hay credenciales de GitHub guardadas');
    }
    const ghData = githubSnap.data();
    if (!ghData.token) throw new Error('Falta el token de GitHub');
    if (!c.githubRepo) throw new Error('El cliente no tiene repo GitHub asignado');

    const apariencia = {
      colorPrimario: document.getElementById('drawer-color-primario').value,
      tipografia: document.getElementById('drawer-tipografia').value,
      radioBordes: document.getElementById('drawer-radio-bordes').value
    };

    const res = await fetch(`${WORKER_URL}/publicar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-API-Key': WORKER_API_KEY },
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
      alert(`✓ ${data.mensaje}\n\nCommit: ${data.commit?.substring(0, 7) || '—'}`);
    } else {
      alert(`✗ Error: ${data.error}`);
    }
  } catch (e) {
    console.error(e);
    alert(`Error: ${e.message}`);
  } finally {
    btn.innerHTML = orig;
    btn.disabled = false;
    if (typeof window.lucide !== 'undefined') window.lucide.createIcons();
  }
}