// ==========================================
// MÓDULO: GESTIONAR — Orquestador
// ==========================================
import { db, auth } from '../config/firebase.js';
import { doc, updateDoc, getDoc } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";
import { DIAS_PRORROGA, REDES_DISPONIBLES, WORKER_URL } from '../config/constantes.js';
import { getState, setState } from '../core/state.js';
import {
  formatearFecha, formatearFechaHora,
  sumarDias, obtenerRedMeta
} from '../core/helpers.js';
import {
  renderRedesGestionar, renderRedEditor,
  renderDireccionesGestionar, renderDireccionEditor
} from '../ui/render.js';
import { toast, confirmar } from '../ui/notificaciones.js';
import { listaSistemas, obtenerMeta, cargarModuloSistema } from '../config/sistemas-visuales.js';

// ---------- Estado local ----------
let redesGestionar = [];
let direccionesGestionar = [];
let editandoRedes = false;
let editandoDirecciones = false;

// Módulo del sistema visual actualmente cargado (sukidesu, shadcn, etc.)
let moduloSistemaActual = null;

// Callbacks que inyecta gestionar-page.js para sincronizar su estado
let onCambioApariencia = () => {};
let onGuardadoExitoso = () => {};

export function setOnCambioApariencia(cb) {
  onCambioApariencia = typeof cb === 'function' ? cb : () => {};
}
export function setOnGuardadoExitoso(cb) {
  onGuardadoExitoso = typeof cb === 'function' ? cb : () => {};
}

const cap = (s) => s[0].toUpperCase() + s.slice(1);

// ==========================================
// APARIENCIA — selector y panel
// ==========================================

function renderSelectorSistemas() {
  const grid = document.getElementById('apariencia-selector-grid');
  if (!grid) return;
  const sistemas = listaSistemas();
  grid.innerHTML = sistemas.map((s) => `
    <div class="border border-zinc-200 dark:border-zinc-800 rounded-lg p-4 bg-white dark:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors space-y-3">
      <div class="flex items-center gap-2.5">
        <div class="w-8 h-8 rounded-md flex items-center justify-center shrink-0"
             style="background:${s.accent}1A; color:${s.accent};">
          <i data-lucide="${s.icon}" class="w-4 h-4" aria-hidden="true"></i>
        </div>
        <div class="min-w-0">
          <h5 class="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">${s.nombre}</h5>
          <p class="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono">${s.key}</p>
        </div>
      </div>
      <p class="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">${s.descripcion}</p>
      <button type="button" data-action="seleccionar-sistema" data-key="${s.key}"
              class="w-full px-3 py-1.5 rounded-md bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-[11px] font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors">
        Seleccionar
      </button>
    </div>
  `).join('');
  if (window.lucide) window.lucide.createIcons();
}

function mostrarSelectorSistemas() {
  const selector = document.getElementById('apariencia-selector');
  const panel = document.getElementById('apariencia-panel');
  if (!selector || !panel) return;
  panel.classList.add('hidden');
  selector.classList.remove('hidden');
  moduloSistemaActual = null;
  renderSelectorSistemas();
}

async function renderPanelApariencia(sistemaKey, apariencia) {
  const selector = document.getElementById('apariencia-selector');
  const panel = document.getElementById('apariencia-panel');
  const contenedor = document.getElementById('apariencia-contenedor');
  const nombre = document.getElementById('apariencia-sistema-nombre');
  if (!panel || !contenedor) return;

  selector?.classList.add('hidden');
  panel.classList.remove('hidden');

  const metaSys = obtenerMeta(sistemaKey);
  if (nombre) nombre.textContent = metaSys ? `${metaSys.nombre} · ${sistemaKey}` : sistemaKey;

  try {
    moduloSistemaActual = await cargarModuloSistema(sistemaKey);
    
    // --- ANIMACIÓN U1 (Paso 4) ---
    contenedor.classList.remove('animate-tab-in'); 
    void contenedor.offsetWidth;                   
    contenedor.classList.add('animate-tab-in');    
    
    moduloSistemaActual.render(contenedor, apariencia || {}, {
      onCambio: () => onCambioApariencia()
    });
  } catch (e) {
    console.error('Error cargando módulo de sistema:', e);
    moduloSistemaActual = null;
    contenedor.innerHTML = `
      <div class="p-4 rounded-md border border-red-200 dark:border-red-900 bg-red-50/50 dark:bg-red-950/20">
        <p class="text-xs text-red-700 dark:text-red-400">
          No se pudo cargar el sistema <code class="font-mono">${sistemaKey}</code>.
          Revisá que exista <code class="font-mono">js/modulos/sistemas/${sistemaKey}.js</code>.
        </p>
      </div>`;
  }
}

// ==========================================
// APARIENCIA — acciones públicas
// ==========================================

export async function seleccionarSistema(key) {
  const c = getState().clienteSeleccionado;
  if (!c) return;
  const meta = obtenerMeta(key);
  if (!meta) { toast('Sistema desconocido.', 'error'); return; }

  const teniaSistema = !!c.sistemaVisual;
  const cambiando = teniaSistema && c.sistemaVisual !== key;

  const ok = await confirmar({
    titulo: cambiando ? 'Cambiar sistema visual' : 'Asignar sistema visual',
    mensaje: cambiando
      ? `Vas a cambiar de "${c.sistemaVisual}" a "${meta.nombre}".\n\nSe borrará la apariencia actual (colores, tipografías, etc.). Esta acción no se puede deshacer.`
      : `Vas a asignar "${meta.nombre}" a este cliente.\n\nUna vez asignado, no se puede cambiar sin perder la apariencia configurada.`,
    confirmarTexto: cambiando ? 'Cambiar y borrar' : 'Asignar'
  });
  if (!ok) return;

  try {
    await updateDoc(doc(db, 'clientes_agencia', c.id), {
      sistemaVisual: key,
      apariencia: {}
    });
    const s = await getDoc(doc(db, 'clientes_agencia', c.id));
    if (s.exists()) {
      const actualizado = { id: c.id, ...s.data() };
      setState({ clienteSeleccionado: actualizado });
      await renderPanelApariencia(key, {});
      onGuardadoExitoso();
      toast(`Sistema "${meta.nombre}" asignado.`, 'exito');
    }
  } catch (e) {
    console.error(e);
    toast('Error al asignar el sistema.', 'error');
  }
}

export async function cambiarSistemaVisual() {
  const c = getState().clienteSeleccionado;
  if (!c || !c.sistemaVisual) return;

  const ok = await confirmar({
    titulo: 'Cambiar sistema visual',
    mensaje: `Vas a volver al selector de sistemas visuales.\n\nSi elegís otro sistema, la apariencia actual se perderá. Si elegís el mismo, no pasa nada.`,
    confirmarTexto: 'Abrir selector'
  });
  if (!ok) return;

  mostrarSelectorSistemas();
}

// ==========================================
// Cargar datos del cliente en el DOM
// ==========================================
export async function cargarDatosCliente(c) {
  if (!c) return;

  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  set('gd-nombre-cliente', c.nombreCliente || '—');
  set('gd-nombre-comercial', c.nombreComercial || '—');
  set('gd-documento', c.numeroDocumento ? `${c.tipoDocumento || ''} ${c.numeroDocumento}` : '—');
  set('gd-telefono', c.telefono || '—');
  set('gd-correo', c.correoOperativo || '—');
  const comercialNombre = document.getElementById('gd-comercial-nombre');
  if (comercialNombre) comercialNombre.textContent = c.creadoPorNombre || '—';
  const comercialDoc = document.getElementById('gd-comercial-doc');
  if (comercialDoc) {
    comercialDoc.textContent = (c.creadoPorTipoDoc && c.creadoPorNumDoc)
      ? `${c.creadoPorTipoDoc} ${c.creadoPorNumDoc}`
      : '';
  }

  // Datos para edición
  const inputNombre = document.getElementById('gd-input-nombre-cliente');
  if (inputNombre) inputNombre.value = c.nombreCliente || '';
  const inputComercial = document.getElementById('gd-input-nombre-comercial');
  if (inputComercial) inputComercial.value = c.nombreComercial || '';
  const inputTipoDoc = document.getElementById('gd-input-tipo-doc');
  if (inputTipoDoc) inputTipoDoc.value = c.tipoDocumento || 'CC';
  const inputNumDoc = document.getElementById('gd-input-num-doc');
  if (inputNumDoc) inputNumDoc.value = c.numeroDocumento || '';
  const inputTel = document.getElementById('gd-input-telefono');
  if (inputTel) inputTel.value = c.telefono || '';
  const inputCorreo = document.getElementById('gd-input-correo');
  if (inputCorreo) inputCorreo.value = c.correoOperativo || '';

  // Resetear a modo lectura
  document.getElementById('gd-datos-lectura')?.classList.remove('hidden');
  document.getElementById('gd-datos-edicion')?.classList.add('hidden');
  const btnToggleDatos = document.getElementById('btn-toggle-editar-datos');
  if (btnToggleDatos) btnToggleDatos.textContent = 'Editar';

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

  // ---------- APARIENCIA: delegada al sistema visual ----------
  if (!c.sistemaVisual) {
    mostrarSelectorSistemas();
  } else {
    await renderPanelApariencia(c.sistemaVisual, c.apariencia || {});
  }

  if (window.lucide) window.lucide.createIcons();
}

// ==========================================
// Guardar: Apariencia
// ==========================================
export async function guardarConfiguracion() {
  const c = getState().clienteSeleccionado;
  if (!c) return;
  if (!moduloSistemaActual) {
    toast('No hay sistema visual activo.', 'aviso');
    return;
  }

  const contenedor = document.getElementById('apariencia-contenedor');
  if (!contenedor) return;

  const btn = document.getElementById('btn-guardar-apariencia');
  const orig = btn?.textContent ?? 'Guardar Apariencia';
  if (btn) { btn.textContent = 'Guardando...'; btn.disabled = true; }

  const nueva = moduloSistemaActual.leer(contenedor);

  try {
    await updateDoc(doc(db, 'clientes_agencia', c.id), { apariencia: nueva });
    const s = await getDoc(doc(db, 'clientes_agencia', c.id));
    if (s.exists()) setState({ clienteSeleccionado: { id: c.id, ...s.data() } });
    toast('Apariencia actualizada.', 'exito');
    onGuardadoExitoso();
  } catch (e) {
    console.error(e);
    toast('Error al guardar.', 'error');
  } finally {
    if (btn) {
      btn.textContent = 'Guardar Apariencia';
      btn.disabled = false;
    }
  }
}

export function limpiarCambiosApariencia() {
  const btn = document.getElementById('btn-guardar-apariencia');
  if (btn) btn.classList.remove('ring-2', 'ring-amber-400', 'dark:ring-amber-500');
}

// ==========================================
// Guardar: Redes
// ==========================================
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
    await updateDoc(doc(db, 'clientes_agencia', c.id), {
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

// ==========================================
// Guardar: Direcciones
// ==========================================
export async function guardarDirecciones() {
  const c = getState().clienteSeleccionado;
  if (!c) return;
  const limpias = direccionesGestionar.filter((d) => d.direccion && d.direccion.trim());
  try {
    await updateDoc(doc(db, 'clientes_agencia', c.id), { direcciones: limpias });
    setState({ clienteSeleccionado: { ...c, direcciones: limpias } });
    toast('Direcciones guardadas.', 'exito');
    editandoDirecciones = false;
    renderDireccionesGestionar(document.getElementById('gd-direcciones'), limpias);
    document.getElementById('gd-direcciones-acciones').classList.add('hidden');
    document.getElementById('gd-direcciones-acciones').classList.remove('flex');
    document.getElementById('btn-toggle-direcciones').textContent = 'Editar';
  } catch (e) { console.error(e); toast('Error al guardar direcciones.', 'error'); }
}

// ==========================================
// Guardar: Fechas
// ==========================================
export async function guardarFechas() {
  const c = getState().clienteSeleccionado;
  if (!c) return;
  const fv = document.getElementById('gd-input-vencimiento').value;
  if (!fv) { toast('Selecciona una fecha de vencimiento.', 'aviso'); return; }
  try {
    await updateDoc(doc(db, 'clientes_agencia', c.id), { fechaVencimiento: fv });
    setState({ clienteSeleccionado: { ...c, fechaVencimiento: fv } });
    document.getElementById('gd-fecha-vencimiento').textContent = formatearFecha(fv);
    const pr = sumarDias(fv, DIAS_PRORROGA);
    document.getElementById('gd-prorroga').textContent = pr ? formatearFecha(pr) : '—';
    toast('Fecha de vencimiento actualizada.', 'exito');
  } catch (e) { console.error(e); toast('Error al guardar.', 'error'); }
}

// ==========================================
// Guardar: Fecha Producción
// ==========================================
export async function guardarFechaProduccion() {
  const c = getState().clienteSeleccionado;
  if (!c) return;
  if (c.fechaProduccion) {
    toast('La fecha de producción ya está fijada y no puede modificarse.', 'aviso'); return;
  }
  const fp = document.getElementById('gd-input-produccion').value;
  if (!fp) { toast('Selecciona una fecha de producción.', 'aviso'); return; }
  try {
    await updateDoc(doc(db, 'clientes_agencia', c.id), { fechaProduccion: fp });
    setState({ clienteSeleccionado: { ...c, fechaProduccion: fp } });
    document.getElementById('gd-fecha-produccion').textContent = formatearFecha(fp);
    document.getElementById('gd-fecha-produccion-edit').classList.add('hidden');
    document.getElementById('gd-fecha-produccion-bloqueada').classList.remove('hidden');
    toast('Fecha de producción fijada.', 'exito');
  } catch (e) { console.error(e); toast('Error al guardar.', 'error'); }
}

// ==========================================
// Toggle edición: Redes
// ==========================================
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
  if (window.lucide) window.lucide.createIcons();
}

// ==========================================
// Toggle edición: Direcciones
// ==========================================
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
  if (window.lucide) window.lucide.createIcons();
}

// ==========================================
// Añadir/Quitar redes
// ==========================================
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

// ==========================================
// Publicar en GitHub
// ==========================================
export async function publicarEnGitHub() {
  const c = getState().clienteSeleccionado;
  if (!c) return;
  if (!moduloSistemaActual) {
    toast('No hay sistema visual activo.', 'aviso');
    return;
  }

  const btn = document.getElementById('btn-publicar-github');
  const orig = btn.innerHTML;
  btn.innerHTML = '<span class="animate-pulse">Publicando...</span>';
  btn.disabled = true;

  try {
    const githubSnap = await getDoc(doc(db, 'clientes_agencia', c.id, 'secretos', 'github'));
    if (!githubSnap.exists()) throw new Error('No hay credenciales de GitHub guardadas');
    const ghData = githubSnap.data();
    if (!ghData.token) throw new Error('Falta el token de GitHub');
    const repoPublico = c.repoPublico;
    if (!repoPublico) throw new Error('El cliente no tiene repo público asignado');

    const contenedor = document.getElementById('apariencia-contenedor');
    const apariencia = moduloSistemaActual.leer(contenedor);

    const idToken = await auth.currentUser.getIdToken();
    const res = await fetch(`${WORKER_URL}/publicar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
      body: JSON.stringify({
        repo: repoPublico,
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
    if (window.lucide) window.lucide.createIcons();
  }
}

// ==========================================
// Toggle edición: Datos
// ==========================================
export function toggleEditarDatos() {
  const c = getState().clienteSeleccionado;
  if (!c) return;
  const lectura = document.getElementById('gd-datos-lectura');
  const edicion = document.getElementById('gd-datos-edicion');
  const btn = document.getElementById('btn-toggle-editar-datos');
  const editando = edicion.classList.contains('hidden');
  lectura.classList.toggle('hidden', editando);
  edicion.classList.toggle('hidden', !editando);
  btn.textContent = editando ? 'Cancelar' : 'Editar';
  if (window.lucide) window.lucide.createIcons();
}

export function cancelarEditarDatos() {
  const c = getState().clienteSeleccionado;
  if (!c) return;
  const inputNombre = document.getElementById('gd-input-nombre-cliente');
  if (inputNombre) inputNombre.value = c.nombreCliente || '';
  const inputComercial = document.getElementById('gd-input-nombre-comercial');
  if (inputComercial) inputComercial.value = c.nombreComercial || '';
  const inputTipoDoc = document.getElementById('gd-input-tipo-doc');
  if (inputTipoDoc) inputTipoDoc.value = c.tipoDocumento || 'CC';
  const inputNumDoc = document.getElementById('gd-input-num-doc');
  if (inputNumDoc) inputNumDoc.value = c.numeroDocumento || '';
  const inputTel = document.getElementById('gd-input-telefono');
  if (inputTel) inputTel.value = c.telefono || '';
  const inputCorreo = document.getElementById('gd-input-correo');
  if (inputCorreo) inputCorreo.value = c.correoOperativo || '';

  document.getElementById('gd-datos-lectura')?.classList.remove('hidden');
  document.getElementById('gd-datos-edicion')?.classList.add('hidden');
  const btn = document.getElementById('btn-toggle-editar-datos');
  if (btn) btn.textContent = 'Editar';
}

// ==========================================
// Guardar: Datos del cliente
// ==========================================
export async function guardarDatosCliente() {
  const c = getState().clienteSeleccionado;
  if (!c) return;
  const btn = document.getElementById('btn-guardar-datos');
  const orig = btn.textContent;
  btn.textContent = 'Guardando...';
  btn.disabled = true;

  const nombre = document.getElementById('gd-input-nombre-cliente').value.trim();
  const comercial = document.getElementById('gd-input-nombre-comercial').value.trim();
  const tipoDoc = document.getElementById('gd-input-tipo-doc').value;
  const numDoc = document.getElementById('gd-input-num-doc').value.trim();
  const tel = document.getElementById('gd-input-telefono').value.trim();
  const correo = document.getElementById('gd-input-correo').value.trim();

  if (!nombre) { toast('El nombre es obligatorio.', 'aviso'); btn.textContent = orig; btn.disabled = false; return; }
  if (!comercial) { toast('El nombre comercial es obligatorio.', 'aviso'); btn.textContent = orig; btn.disabled = false; return; }
  if (!numDoc) { toast('El número de documento es obligatorio.', 'aviso'); btn.textContent = orig; btn.disabled = false; return; }
  if (tel && !/^\+[1-9]\d{7,14}$/.test(tel)) {
    toast('Teléfono inválido. Formato: +573001234567', 'aviso'); btn.textContent = orig; btn.disabled = false; return;
  }
  if (correo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
    toast('Correo inválido.', 'aviso'); btn.textContent = orig; btn.disabled = false; return;
  }

  try {
    await updateDoc(doc(db, 'clientes_agencia', c.id), {
      nombreCliente: nombre,
      nombreComercial: comercial,
      tipoDocumento: tipoDoc,
      numeroDocumento: numDoc,
      telefono: tel,
      correoOperativo: correo
    });

    const s = await getDoc(doc(db, 'clientes_agencia', c.id));
    if (s.exists()) setState({ clienteSeleccionado: { id: c.id, ...s.data() } });

    const cActual = getState().clienteSeleccionado;
    const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    set('gd-nombre-cliente', cActual.nombreCliente || '—');
    set('gd-nombre-comercial', cActual.nombreComercial || '—');
    set('gd-documento', cActual.numeroDocumento ? `${cActual.tipoDocumento || ''} ${cActual.numeroDocumento}` : '—');
    set('gd-telefono', cActual.telefono || '—');
    set('gd-correo', cActual.correoOperativo || '—');
    const comercialNombre2 = document.getElementById('gd-comercial-nombre');
    if (comercialNombre2) comercialNombre2.textContent = cActual.creadoPorNombre || '—';
    const comercialDoc2 = document.getElementById('gd-comercial-doc');
    if (comercialDoc2) {
      comercialDoc2.textContent = (cActual.creadoPorTipoDoc && cActual.creadoPorNumDoc)
        ? `${cActual.creadoPorTipoDoc} ${cActual.creadoPorNumDoc}` : '';
    }

    document.getElementById('gd-datos-lectura')?.classList.remove('hidden');
    document.getElementById('gd-datos-edicion')?.classList.add('hidden');
    const btnToggle = document.getElementById('btn-toggle-editar-datos');
    if (btnToggle) btnToggle.textContent = 'Editar';

    toast('Datos del cliente actualizados.', 'exito');
  } catch (e) {
    console.error(e);
    toast('Error al guardar los datos.', 'error');
  } finally {
    btn.textContent = orig;
    btn.disabled = false;
  }
}