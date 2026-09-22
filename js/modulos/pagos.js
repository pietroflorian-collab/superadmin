// ==========================================
// MÓDULO: GESTIÓN DE PAGOS (modal centrado)
// ==========================================
import { db } from '../config/firebase.js';
import {
  doc, updateDoc, getDocs, collection
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";
import { getState, setState } from '../core/state.js';
import { esc, refrescarIconos } from '../core/helpers.js';
import { cargarClientes } from './clientes.js';
import { toast, confirmar } from '../ui/notificaciones.js';


// ---------- Abrir ----------
export async function abrirGestionPagos() {
  const modal = document.getElementById('modal-gestion-pagos');
  const gpBuscar = document.getElementById('gp-buscar');
  const gpResultados = document.getElementById('gp-resultados');

  modal.classList.remove('hidden');
  setState({ gpClienteSeleccionado: null, gpClientesCache: [] });
  gpBuscar.value = '';
  document.getElementById('gp-cliente-box').classList.add('hidden');
  document.getElementById('gp-confirmar-retiro').classList.add('hidden');
  gpResultados.classList.add('hidden');
  refrescarIconos();

  try {
    const snap = await getDocs(collection(db, "clientes_agencia"));
    setState({ gpClientesCache: snap.docs.map((d) => ({ id: d.id, ...d.data() })) });
  } catch (e) {
    console.error(e);
  }
}

// ---------- Cerrar ----------
export function cerrarGestionPagos() {
  const modal = document.getElementById('modal-gestion-pagos');
  const gpBuscar = document.getElementById('gp-buscar');
  const gpResultados = document.getElementById('gp-resultados');

  modal.classList.add('hidden');
  setState({ gpClienteSeleccionado: null });
  gpBuscar.value = '';
  gpResultados.classList.add('hidden');
  document.getElementById('gp-cliente-box').classList.add('hidden');
  document.getElementById('gp-confirmar-retiro').classList.add('hidden');
}

// ---------- Buscador ----------
export function gpBuscarCliente(query) {
  const gpResultados = document.getElementById('gp-resultados');
  const q = query.trim().toLowerCase();
  if (!q) { gpResultados.classList.add('hidden'); return; }

  const cache = getState().gpClientesCache;
  const matches = cache.filter((c) => {
    const nc = (c.nombreComercial || '').toLowerCase();
    const np = (c.nombreCliente || '').toLowerCase();
    return nc.includes(q) || np.includes(q);
  }).slice(0, 8);

  if (matches.length === 0) {
  gpResultados.innerHTML = '<div class="px-4 py-3 text-xs text-zinc-400 italic">Sin resultados</div>';
} else {
  gpResultados.innerHTML = matches.map((c) => `
    <button data-action="gp-seleccionar" data-cliente-id="${esc(c.id)}" class="w-full text-left px-4 py-3 hover:bg-zinc-50 transition-colors border-b border-zinc-100 last:border-0">
      <div class="flex items-center justify-between gap-3">
        <div class="min-w-0">
          <div class="text-xs font-medium text-zinc-900 truncate">${esc(c.nombreComercial || c.nombreCliente || 'Sin nombre')}</div>
          <div class="text-[11px] text-zinc-400 font-mono truncate">${esc(c.nombreCliente || '')}</div>
        </div>
        <span class="text-[10px] font-mono px-2 py-0.5 rounded-full shrink-0 ${
          c.estadoCliente === 'Retirado' ? 'bg-zinc-100 text-zinc-500' : 'bg-emerald-50 text-emerald-700'
        }">${c.estadoCliente === 'Retirado' ? 'Retirado' : 'Activo'}</span>
      </div>
    </button>
  `).join('');
}
gpResultados.classList.remove('hidden');
 
}

export function seleccionarCliente(id) {
  const c = getState().gpClientesCache.find((x) => x.id === id);
  if (!c) return;

  setState({ gpClienteSeleccionado: c });
  document.getElementById('gp-buscar').value = c.nombreComercial || c.nombreCliente || '';
  document.getElementById('gp-resultados').classList.add('hidden');
  document.getElementById('gp-cliente-box').classList.remove('hidden');
  document.getElementById('gp-confirmar-retiro').classList.add('hidden');
  refrescarUI();
}

// ---------- Refrescar UI ----------
function refrescarUI() {
  const c = getState().gpClienteSeleccionado;
  if (!c) return;

  document.getElementById('gp-nombre').textContent = c.nombreComercial || c.nombreCliente || 'Sin nombre';
  document.getElementById('gp-sub').textContent = c.nombreCliente || '';

  const ec = c.estadoCliente === 'Retirado' ? 'Retirado' : 'Activo';
  const es = c.estadoServicio === 'Suspendido' ? 'Suspendido' : 'Activo';

  const elEC = document.getElementById('gp-estado-cliente');
  elEC.textContent = ec;
  elEC.className = 'text-xs font-medium mt-0.5 ' + (ec === 'Activo' ? 'text-emerald-600' : 'text-zinc-500');

  const elES = document.getElementById('gp-estado-servicio');
  elES.textContent = es;
  elES.className = 'text-xs font-medium mt-0.5 ' + (es === 'Activo' ? 'text-emerald-600' : 'text-red-600');

  const btnC = document.getElementById('gp-btn-cliente');
  btnC.textContent = ec === 'Activo' ? 'Retirar Cliente' : 'Reactivar Cliente';
  btnC.className = 'px-3 py-1.5 text-xs font-medium rounded-md transition-colors ' +
    (ec === 'Activo'
      ? 'border border-red-200 text-red-600 hover:bg-red-50'
      : 'border border-emerald-200 text-emerald-600 hover:bg-emerald-50');

  const btnS = document.getElementById('gp-btn-servicio');
  btnS.textContent = es === 'Activo' ? 'Suspender Servicio' : 'Reactivar Servicio';
  btnS.className = 'px-3 py-1.5 text-xs font-medium rounded-md transition-colors ' +
    (es === 'Activo'
      ? 'border border-red-200 text-red-600 hover:bg-red-50'
      : 'border border-emerald-200 text-emerald-600 hover:bg-emerald-50');

  if (ec === 'Retirado') {
    btnS.disabled = true;
    btnS.className = 'px-3 py-1.5 text-xs font-medium rounded-md border border-zinc-200 text-zinc-400 cursor-not-allowed';
  } else {
    btnS.disabled = false;
  }
}

// ---------- Toggle Cliente (Retirar / Reactivar) ----------
export function toggleCliente() {
  const c = getState().gpClienteSeleccionado;
  if (!c) return;
  const ec = c.estadoCliente === 'Retirado' ? 'Retirado' : 'Activo';

  if (ec === 'Activo') {
    document.getElementById('gp-confirmar-retiro').classList.remove('hidden');
    document.getElementById('gp-nombre-a-escribir').textContent = c.nombreComercial || c.nombreCliente || '';
    document.getElementById('gp-input-confirmar').value = '';
    document.getElementById('gp-btn-confirmar').disabled = true;
  } else {
    reactivarCliente();
  }
}

// ---------- Validar confirmación ----------
export function validarConfirmacion() {
  const c = getState().gpClienteSeleccionado;
  if (!c) return;
  const esperado = c.nombreComercial || c.nombreCliente || '';
  const escrito = document.getElementById('gp-input-confirmar').value.trim();
  document.getElementById('gp-btn-confirmar').disabled = escrito !== esperado;
}

// ---------- Confirmar retiro ----------
export async function confirmarRetiro() {
  const c = getState().gpClienteSeleccionado;
  if (!c) return;

  try {
    await updateDoc(doc(db, "clientes_agencia", c.id), {
      estadoCliente: 'Retirado',
      estadoServicio: 'Suspendido'
    });
    setState({ gpClienteSeleccionado: { ...c, estadoCliente: 'Retirado', estadoServicio: 'Suspendido' } });
    document.getElementById('gp-confirmar-retiro').classList.add('hidden');
    refrescarUI();
    await cargarClientes();
    toast('Cliente retirado.', 'exito');
  } catch (e) {
    console.error(e);
    toast('No se pudo retirar el cliente.', 'error');
  }
}

// ---------- Reactivar cliente ----------
export async function reactivarCliente() {
  const c = getState().gpClienteSeleccionado;
  if (!c) return;
  const nombre = c.nombreComercial || c.nombreCliente || 'este cliente';

  const ok = await confirmar({
    titulo: 'Reactivar cliente',
    mensaje: `Se reactivará a "${nombre}".\nQuedará activo con su servicio Suspendido.`,
    textoConfirmar: 'Reactivar'
  });
  if (!ok) return;

  try {
    await updateDoc(doc(db, "clientes_agencia", c.id), {
      estadoCliente: 'Activo',
      estadoServicio: 'Suspendido'
    });
    setState({ gpClienteSeleccionado: { ...c, estadoCliente: 'Activo', estadoServicio: 'Suspendido' } });
    refrescarUI();
    await cargarClientes();
    toast('Cliente reactivado.', 'exito');
  } catch (e) {
    console.error(e);
    toast('No se pudo reactivar.', 'error');
  }
}

// ---------- Toggle servicio ----------
export async function toggleServicio() {
  const c = getState().gpClienteSeleccionado;
  if (!c) return;
  if (c.estadoCliente === 'Retirado') return;

  const es = c.estadoServicio === 'Suspendido' ? 'Suspendido' : 'Activo';
  const nuevo = es === 'Activo' ? 'Suspendido' : 'Activo';
  const accion = nuevo === 'Suspendido' ? 'Suspender' : 'Reactivar';

  const ok = await confirmar({
    titulo: `${accion} servicio`,
    mensaje: `${accion} el servicio de "${c.nombreComercial || c.nombreCliente || ''}"?`,
    textoConfirmar: accion,
    peligro: nuevo === 'Suspendido'
  });
  if (!ok) return;

  try {
    await updateDoc(doc(db, "clientes_agencia", c.id), { estadoServicio: nuevo });
    setState({ gpClienteSeleccionado: { ...c, estadoServicio: nuevo } });
    refrescarUI();
    await cargarClientes();
    toast(`Servicio ${nuevo.toLowerCase()}.`, 'exito');
  } catch (e) {
    console.error(e);
    toast('No se pudo actualizar el servicio.', 'error');
  }
}

// ---------- Cancelar retiro ----------
export function cancelarRetiro() {
  document.getElementById('gp-confirmar-retiro').classList.add('hidden');
  document.getElementById('gp-input-confirmar').value = '';
}

// ---------- Inicializar listeners del módulo ----------
export function inicializarPagos() {
  const gpBuscar = document.getElementById('gp-buscar');
  const gpResultados = document.getElementById('gp-resultados');
  const gpInput = document.getElementById('gp-input-confirmar');

  if (gpBuscar) {
    gpBuscar.addEventListener('input', (e) => gpBuscarCliente(e.target.value));
    gpBuscar.addEventListener('focus', (e) => { if (e.target.value.trim()) gpBuscarCliente(e.target.value); });
  }

  document.addEventListener('click', (e) => {
    if (gpResultados && !gpResultados.contains(e.target) && e.target !== gpBuscar) {
      gpResultados.classList.add('hidden');
    }
  });

  if (gpInput) gpInput.addEventListener('input', validarConfirmacion);
}