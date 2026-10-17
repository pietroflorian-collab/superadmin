// ==========================================
// MÓDULO: NUEVO CLIENTE — Drawer izquierdo
// ==========================================
import { db } from '../config/firebase.js';
import { collection, addDoc } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";
import {
  TIPOS_DOC_NATURAL, REDES_DISPONIBLES, REDES_OBLIGATORIAS
} from '../config/constantes.js';
import { esc, refrescarIconos, obtenerRedMeta } from '../core/helpers.js';
import {
  renderRedEditor, renderDireccionEditor
} from '../ui/render.js';
import { cargarClientes } from './clientes.js';
import { toast } from '../ui/notificaciones.js';
import { activarFocusTrap } from '../ui/focus-trap.js';
import { getState } from '../core/state.js';
import { listaSistemas } from '../config/sistemas-visuales.js';

// ---------- Estado local del módulo (no va al store global) ----------
let redesNuevoCliente = [];
let direccionesNuevoCliente = [];
let ncTrapDesactivar = null;

function renderizarSelectorSistemas() {
  const grid = document.getElementById('nc-sistemas-grid');
  if (!grid) return;
  const sistemas = listaSistemas();
  grid.innerHTML = sistemas.map((s) => `
    <label class="border border-zinc-200 dark:border-zinc-700 rounded-md p-3 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800 has-[:checked]:border-zinc-900 dark:has-[:checked]:border-zinc-100 has-[:checked]:bg-zinc-50 dark:has-[:checked]:bg-zinc-800 transition-colors flex items-start gap-2.5">
      <input type="radio" name="nc-sistema-visual" value="${s.key}" class="mt-0.5 accent-zinc-900 dark:accent-zinc-100">
      <div class="min-w-0 flex-1">
        <div class="flex items-center gap-1.5">
          <i data-lucide="${s.icon}" class="w-3.5 h-3.5" style="color:${s.accent}" aria-hidden="true"></i>
          <span class="text-[11px] font-semibold text-zinc-900 dark:text-zinc-100">${s.nombre}</span>
        </div>
        <p class="text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5 leading-relaxed">${s.descripcion}</p>
      </div>
    </label>
  `).join('');
  if (window.lucide) window.lucide.createIcons();
}

// ---------- Abrir / Cerrar ----------
export function abrirNuevoCliente() {
  const drawerNuevo = document.getElementById('drawer-nuevo-cliente');
  const backdrop = document.getElementById('backdrop');
  const formNuevoCliente = document.getElementById('form-nuevo-cliente');

  redesNuevoCliente = [];
  direccionesNuevoCliente = [{ tipo: 'fiscal', nombre: '', direccion: '', referencia: '' }];

  document.getElementById('nc-tipo-doc').innerHTML = TIPOS_DOC_NATURAL
    .map((t) => `<option value="${t}">${t}</option>`).join('');

  formNuevoCliente.reset();
  document.querySelector('input[name="tipoPersona"][value="natural"]').checked = true;

  renderRedEditor(
    document.getElementById('nc-redes'),
    redesNuevoCliente,
    (r) => { redesNuevoCliente = r; verificarAdvertenciaRedes(); },
    'nc'
  );
  renderDireccionEditor(
    document.getElementById('nc-direcciones'),
    direccionesNuevoCliente,
    (d) => { direccionesNuevoCliente = d; },
    'nc'
  );
  verificarAdvertenciaRedes();

    // Sistema visual: admin y ventas pueden asignar, producción no
  const seccionSistemas = document.getElementById('nc-sistema-visual-section');
  const rolActual = getState().rolActual || 'admin';
  const puedeAsignarSistema = rolActual === 'admin' || rolActual === 'ventas';

  if (puedeAsignarSistema) {
    seccionSistemas?.classList.remove('hidden');
    renderizarSelectorSistemas();
    // Asegurar que no quede ningún radio marcado de un uso anterior
    document.querySelectorAll('input[name="nc-sistema-visual"]').forEach((r) => { r.checked = false; });
  } else {
    seccionSistemas?.classList.add('hidden');
  }

  drawerNuevo.classList.remove('-translate-x-full');
  backdrop.classList.remove('hidden');
  refrescarIconos();

  if (ncTrapDesactivar) ncTrapDesactivar();
  ncTrapDesactivar = activarFocusTrap(drawerNuevo);
}

export function cerrarNuevoCliente() {
  const drawerNuevo = document.getElementById('drawer-nuevo-cliente');
  const backdrop = document.getElementById('backdrop');
  const formNuevoCliente = document.getElementById('form-nuevo-cliente');

  drawerNuevo.classList.add('-translate-x-full');
  backdrop.classList.add('hidden');
  formNuevoCliente.reset();
  redesNuevoCliente = [];
  direccionesNuevoCliente = [];

  // Desactivar focus trap
  if (ncTrapDesactivar) { ncTrapDesactivar(); ncTrapDesactivar = null; }
}

// ---------- Advertencia redes ----------
function verificarAdvertenciaRedes() {
  const adv = document.getElementById('nc-redes-advertencia');
  if (!adv) return;
  const tipos = redesNuevoCliente.map((r) => r.tipo);
  const faltantes = REDES_OBLIGATORIAS.filter((t) => !tipos.includes(t));
  adv.textContent = faltantes.length === 0
    ? ''
    : `⚠ Recuerda cargar las redes sociales (faltan ${faltantes.length} de ${REDES_OBLIGATORIAS.length})`;
}

// ---------- Acciones sobre listas locales ----------
export function addRedNuevo() {
  redesNuevoCliente.push({ tipo: 'instagram', valor: '' });
  renderRedEditor(
    document.getElementById('nc-redes'),
    redesNuevoCliente,
    (r) => { redesNuevoCliente = r; verificarAdvertenciaRedes(); },
    'nc'
  );
}

export function rmRedNuevo(el) {
  redesNuevoCliente.splice(+el.dataset.idx, 1);
  renderRedEditor(
    document.getElementById('nc-redes'),
    redesNuevoCliente,
    (r) => { redesNuevoCliente = r; verificarAdvertenciaRedes(); },
    'nc'
  );
}

export function addDireccionNuevo() {
  direccionesNuevoCliente.push({ tipo: 'establecimiento', nombre: '', direccion: '', referencia: '' });
  renderDireccionEditor(
    document.getElementById('nc-direcciones'),
    direccionesNuevoCliente,
    (d) => { direccionesNuevoCliente = d; },
    'nc'
  );
}

export function rmDireccionNuevo(el) {
  direccionesNuevoCliente.splice(+el.dataset.idx, 1);
  renderDireccionEditor(
    document.getElementById('nc-direcciones'),
    direccionesNuevoCliente,
    (d) => { direccionesNuevoCliente = d; },
    'nc'
  );
}

// ---------- Guardar ----------
export async function registrarNuevoCliente(event) {
  event.preventDefault();
  const btn = document.getElementById('btn-registrar-cliente');
  const textoOrig = btn.textContent;

  const numDoc = document.getElementById('nc-num-doc').value.trim();
  const nombre = document.getElementById('nc-nombre-cliente').value.trim();
  const nombreComercial = document.getElementById('nc-nombre-comercial').value.trim();
  const tel = document.getElementById('nc-telefono').value.trim();
  const correo = document.getElementById('nc-correo').value.trim();

  if (!numDoc)              { toast('Falta el número de documento.', 'aviso'); return; }
  if (!nombre)              { toast('Falta el nombre del cliente.', 'aviso'); return; }
  if (!nombreComercial)     { toast('Falta el nombre comercial.', 'aviso'); return; }
  if (!/^\+[1-9]\d{7,14}$/.test(tel)) {
    toast('Teléfono inválido. Formato: +573001234567', 'aviso'); return;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
    toast('Correo inválido. Ejemplo: cliente@dominio.com', 'aviso'); return;
  }

  const redesLimp = redesNuevoCliente.filter((r) => r.valor && r.valor.trim());
  for (const r of redesLimp) {
    const meta = obtenerRedMeta(r.tipo, REDES_DISPONIBLES);
    if (!meta.regex.test(r.valor.trim())) {
      toast(`Formato inválido en ${meta.label}. Ejemplo: ${meta.placeholder}`, 'aviso');
      return;
    }
  }

  btn.disabled = true;
  btn.textContent = 'Registrando...';

  const tipoPersona = document.querySelector('input[name="tipoPersona"]:checked').value;
  const slug = nombreComercial.toLowerCase().replace(/[^a-z0-9]/g, '-').substring(0, 30);

    // Detectar rol y usuario actual
  const state = getState();
  const rolActual = state.rolActual || 'admin';
  const usuario = state.usuarioActual || {};

    // Datos del creador (denormalizados)
  const nombreCreador = `${usuario.nombre || ''} ${usuario.apellido || ''}`.trim() || usuario.email || 'Desconocido';

  const nuevoCliente = {
    tipoPersona,
    tipoDocumento: document.getElementById('nc-tipo-doc').value,
    numeroDocumento: numDoc,
    nombreCliente: nombre,
    nombreComercial,
    slug,
    telefono: tel,
    correoOperativo: correo,
    direcciones: direccionesNuevoCliente.filter((d) => d.direccion && d.direccion.trim()),
    redes: redesLimp.map((r) => ({ tipo: r.tipo, valor: r.valor.trim() })),
    fechaCreacion: new Date(),
    estadoCliente: 'Activo',
    estadoServicio: 'Activo',
    creadoPorUid: usuario.uid || 'desconocido',
    creadoPorNombre: nombreCreador,
    creadoPorTipoDoc: usuario.tipoDocumento || '',
    creadoPorNumDoc: usuario.numeroDocumento || ''
  };

    // 1. Sistema visual: tanto admin como ventas lo pueden asignar
  const sistemaVisual = document.querySelector('input[name="nc-sistema-visual"]:checked')?.value || null;
  if (sistemaVisual) {
    nuevoCliente.sistemaVisual = sistemaVisual;
    nuevoCliente.apariencia = {}; // Arranca vacío, se llena en gestionar.html
  }

  // 2. Admin agrega fechas y asegura el objeto apariencia
  if (rolActual === 'admin') {
    if (!nuevoCliente.apariencia) nuevoCliente.apariencia = {};
    nuevoCliente.fechaProduccion = null;
    nuevoCliente.fechaVencimiento = null;
  }

  try {
    await addDoc(collection(db, "clientes_agencia"), nuevoCliente);
    cerrarNuevoCliente();
    await cargarClientes();
    toast(`Cliente "${nombreComercial}" registrado.`, 'exito');
  } catch (error) {
    console.error("Error al registrar cliente:", error);
    toast('No se pudo registrar el cliente.', 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = textoOrig;
  }
}

