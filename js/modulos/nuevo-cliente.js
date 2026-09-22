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

  // ---- Validaciones (todas con toast) ----
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
    toast(`Cliente "${nombreComercial}" registrado.`, 'exito');
  } catch (error) {
    console.error("Error al registrar cliente:", error);
    toast('No se pudo registrar el cliente.', 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = textoOrig;
  }
}
