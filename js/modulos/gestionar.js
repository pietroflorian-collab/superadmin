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

const cap = (s) => s[0].toUpperCase() + s.slice(1);

// Lee todos los valores de apariencia desde el DOM
function leerAparienciaDelDOM() {
  const leerColor = (id) => {
    const v = document.getElementById(id)?.value;
    return v && /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(v) ? v : undefined;
  };

  const apariencia = {
    colorPrimario:   leerColor('drawer-color-primario'),
    colorFondo:      leerColor('drawer-color-fondo'),
    colorTexto:      leerColor('drawer-color-texto'),
    colorTextoSuave: leerColor('drawer-color-texto-suave'),
    colorTarjetas:   leerColor('drawer-color-tarjetas'),
    colorCarrito:    leerColor('drawer-color-carrito'),
    colorBordes:     leerColor('drawer-color-bordes'),
    colorAcento:     leerColor('drawer-color-acento'),
    colorSubtitulo:  leerColor('drawer-color-subtitulo'),
    colorHover:      leerColor('drawer-color-hover'),
    radioBordes:     document.getElementById('drawer-radio-bordes')?.value
  };

  // Quitar undefined
  Object.keys(apariencia).forEach(k => apariencia[k] === undefined && delete apariencia[k]);

  const zonas = new Set();
  document.querySelectorAll('[data-zona]').forEach(el => zonas.add(el.dataset.zona));

  zonas.forEach(zona => {
    const fKey = 'fuente' + cap(zona);
    const sKey = 'tamaño' + cap(zona);

    const fuenteInput = document.querySelector(`.fuente-select[data-zona="${zona}"]`);
    if (fuenteInput && fuenteInput.value) apariencia[fKey] = fuenteInput.value;

    const sizeInput = document.querySelector(`.tamaño-input[data-zona="${zona}"]`);
    if (sizeInput && sizeInput.value) {
      const n = parseInt(sizeInput.value, 10);
      if (!isNaN(n) && n >= 8 && n <= 120) apariencia[sKey] = n;
    }
  });

  return apariencia;
}

// ---------- Cargar datos del cliente en el DOM ----------
export function cargarDatosCliente(c) {
  if (!c) return;

    const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  set('gd-nombre-cliente', c.nombreCliente || '—');
  set('gd-nombre-comercial', c.nombreComercial || '—');
  set('gd-documento', c.numeroDocumento ? `${c.tipoDocumento || ''} ${c.numeroDocumento}` : '—');
  set('gd-telefono', c.telefono || '—');
  set('gd-correo', c.correoOperativo || '—');

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

   // Apariencia — colores y formas
  const ap = c.apariencia || {};

  const colorDefault = {
    'color-primario':   '#AD2020',
    'color-fondo':      '#000000',
    'color-texto':      '#e2e2e2',
    'color-texto-suave':'#e3beba',
    'color-tarjetas':   '#0a0a0a',
    'color-carrito':    '#1a1a1a',
    'color-bordes':     '#5b403e',
    'color-acento':     '#ACC677',
    'color-subtitulo':  '#ffb3b1',
    'color-hover':      '#393939'
  };

  const coloresFirestore = {
    'color-primario':   ap.colorPrimario,
    'color-fondo':      ap.colorFondo,
    'color-texto':      ap.colorTexto,
    'color-texto-suave':ap.colorTextoSuave,
    'color-tarjetas':   ap.colorTarjetas,
    'color-carrito':    ap.colorCarrito,
    'color-bordes':     ap.colorBordes,
    'color-acento':     ap.colorAcento,
    'color-subtitulo':  ap.colorSubtitulo,
    'color-hover':      ap.colorHover
  };

    Object.entries(coloresFirestore).forEach(([key, valor]) => {
    const picker = document.getElementById('drawer-' + key);
    const texto = document.getElementById('texto-' + key);
    if (picker) picker.value = valor || colorDefault[key];
    if (texto) texto.value = (valor || colorDefault[key]).toUpperCase();
  });

  const radioInput = document.getElementById('drawer-radio-bordes');
  if (radioInput) {
    radioInput.value = ap.radioBordes ?? '8';
    const vrb = document.getElementById('valor-radio-bordes');
    if (vrb) vrb.textContent = radioInput.value + 'px';
  }

  // Apariencia — tipografía por zonas (27 fuentes + 27 tamaños)
  const zonas = new Set();
  document.querySelectorAll('[data-zona]').forEach(el => zonas.add(el.dataset.zona));

  zonas.forEach(zona => {
    const fKey = 'fuente' + cap(zona);
    const sKey = 'tamaño' + cap(zona);

    const fuenteInput = document.querySelector(`.fuente-select[data-zona="${zona}"]`);
    if (fuenteInput) fuenteInput.value = ap[fKey] || '';

    const sizeInput = document.querySelector(`.tamaño-input[data-zona="${zona}"]`);
    if (sizeInput) sizeInput.value = ap[sKey] ?? '';

    // Actualizar preview
    const preview = document.querySelector(`.preview-tipografia[data-zona="${zona}"]`);
    if (preview && ap[fKey]) {
      preview.style.fontFamily = `'${ap[fKey]}', sans-serif`;
    }
  });

  refrescarIconos();
}

// ---------- Guardar: Apariencia ----------
export async function guardarConfiguracion() {
  const c = getState().clienteSeleccionado;
  if (!c) return;
  const btn = document.getElementById('btn-guardar-apariencia');
  const orig = btn.textContent;
  btn.textContent = 'Guardando...'; btn.disabled = true;

  const nueva = leerAparienciaDelDOM();

  try {
    await updateDoc(doc(db, "clientes_agencia", c.id), { apariencia: nueva });
    const s = await getDoc(doc(db, "clientes_agencia", c.id));
    if (s.exists()) setState({ clienteSeleccionado: { id: c.id, ...s.data() } });
       toast('Apariencia actualizada.', 'exito');
    // Limpiar indicador (estilo inline para que funcione con Tailwind CDN)
    const btnAfter = document.getElementById('btn-guardar-apariencia');
    if (btnAfter) {
      btnAfter.textContent = 'Guardar Apariencia';
      btnAfter.style.backgroundColor = '';
      btnAfter.style.color = '';
      btnAfter.style.fontWeight = '';
    }
  } catch (e) { console.error(e); toast('Error al guardar.', 'error'); }
  finally { btn.textContent = orig; btn.disabled = false; }
}

export function limpiarCambiosApariencia() {
  const btn = document.getElementById('btn-guardar-apariencia');
  if (btn) btn.classList.remove('ring-2', 'ring-amber-400', 'dark:ring-amber-500');
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
    const repoPublico = c.repoPublico;
    if (!repoPublico) throw new Error('El cliente no tiene repo público asignado');

    // Enviar apariencia completa (colores + tipografía completa)
    const apariencia = leerAparienciaDelDOM();

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
    if (typeof window.lucide !== 'undefined') window.lucide.createIcons();
  }
}

// ---------- Toggle edición: Datos ----------
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
  refrescarIconos();
}

// ---------- Cancelar edición: Datos ----------
export function cancelarEditarDatos() {
  const c = getState().clienteSeleccionado;
  if (!c) return;

  // Restaurar valores originales
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

// ---------- Guardar: Datos del cliente ----------
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

    // Refrescar vista lectura
    const cActual = getState().clienteSeleccionado;
    const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    set('gd-nombre-cliente', cActual.nombreCliente || '—');
    set('gd-nombre-comercial', cActual.nombreComercial || '—');
    set('gd-documento', cActual.numeroDocumento ? `${cActual.tipoDocumento || ''} ${cActual.numeroDocumento}` : '—');
    set('gd-telefono', cActual.telefono || '—');
    set('gd-correo', cActual.correoOperativo || '—');

    // Volver a modo lectura
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