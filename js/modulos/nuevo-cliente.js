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

// ---------- Estado local del módulo (no va al store global) ----------
let redesNuevoCliente = [];
let direccionesNuevoCliente = [];

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

  drawerNuevo.classList.remove('-translate-x-full');
  backdrop.classList.remove('hidden');
  refrescarIconos();
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
  btn.disabled = true;
  btn.textContent = 'Registrando...';

  const tipoPersona = document.querySelector('input[name="tipoPersona"]:checked').value;

  const redesLimp = redesNuevoCliente.filter((r) => r.valor && r.valor.trim());
  for (const r of redesLimp) {
    const meta = obtenerRedMeta(r.tipo, REDES_DISPONIBLES);
    if (!meta.regex.test(r.valor.trim())) {
      alert(`Formato inválido en ${meta.label}. Ejemplo: ${meta.placeholder}`);
      btn.disabled = false; btn.textContent = textoOrig; return;
    }
  }

  const tel = document.getElementById('nc-telefono').value.trim();
  if (!/^\+[1-9]\d{7,14}$/.test(tel)) {
    alert('Teléfono inválido. Formato: +573001234567');
    btn.disabled = false; btn.textContent = textoOrig; return;
  }

  const nombreComercial = document.getElementById('nc-nombre-comercial').value.trim();
  const slug = nombreComercial.toLowerCase().replace(/[^a-z0-9]/g, '-').substring(0, 30);

  const nuevoCliente = {
    tipoPersona,
    tipoDocumento: document.getElementById('nc-tipo-doc').value,
    numeroDocumento: document.getElementById('nc-num-doc').value.trim(),
    nombreCliente: document.getElementById('nc-nombre-cliente').value.trim(),
    nombreComercial,
    slug,
    telefono: tel,
    correoOperativo: document.getElementById('nc-correo').value.trim(),
    direcciones: direccionesNuevoCliente.filter((d) => d.direccion && d.direccion.trim()),
    redes: redesLimp.map((r) => ({ tipo: r.tipo, valor: r.valor.trim() })),
    fechaCreacion: new Date(),
    fechaProduccion: null,
    fechaVencimiento: null,
    estadoCliente: 'Activo',
    estadoServicio: 'Activo',
    apariencia: { colorPrimario: '#18181b', tipografia: 'Inter', radioBordes: '8' }
  };

  try {
    await addDoc(collection(db, "clientes_agencia"), nuevoCliente);
    cerrarNuevoCliente();
    await cargarClientes();
  } catch (error) {
    console.error("Error al registrar cliente:", error);
    alert("No se pudo registrar el cliente.");
  } finally {
    btn.disabled = false;
    btn.textContent = textoOrig;
  }
}