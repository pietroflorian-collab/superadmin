// ==========================================
// MÓDULO: CLIENTES — Listado en tabla principal
// ==========================================
import { db } from '../config/firebase.js';
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";
import { DIAS_PRORROGA } from '../config/constantes.js';
import { esc, refrescarIconos, formatearFecha, sumarDias, inicialesCliente } from '../core/helpers.js';
import { estadoVencimiento } from '../core/estado-cliente.js';
import { getState, setState } from '../core/state.js';

// ==========================================
// CARGA
// ==========================================
export async function cargarClientes() {
  const tbody = document.getElementById('tabla-clientes-body');
  if (!tbody) return;

  tbody.innerHTML = '<tr><td colspan="4" class="px-6 py-4 text-center text-zinc-500 dark:text-zinc-400">Sincronizando con Firestore...</td></tr>';

  try {
    const snap = await getDocs(collection(db, "clientes_agencia"));
    const clientes = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    setState({ clientes });
    aplicarFiltrosClientes();
  } catch (error) {
    console.error("Error al cargar clientes:", error);
    tbody.innerHTML = '<tr><td colspan="4" class="px-6 py-4 text-center text-red-500 dark:text-red-400">Error de conexión con Firestore.</td></tr>';
  }
}

// ==========================================
// APLICAR FILTROS
// ==========================================
export function aplicarFiltrosClientes() {
  const { clientes = [], filtrosClientes = {} } = getState();
  const q = (filtrosClientes.busqueda || '').trim().toLowerCase();
  const fEC = filtrosClientes.estadoCliente || 'todos';
  const fES = filtrosClientes.estadoServicio || 'todos';
  const fV  = filtrosClientes.vencimiento || 'todos';

  const filtrados = clientes.filter((c) => {
    // 1) Búsqueda: nombre, nombre comercial, slug, correo
    if (q) {
      const campos = [
        c.nombreCliente,
        c.nombreComercial,
        c.slug,
        c.correoOperativo
      ].filter(Boolean).map((v) => String(v).toLowerCase());
      if (!campos.some((v) => v.includes(q))) return false;
    }

    // 2) Estado cliente
    if (fEC !== 'todos') {
      const ec = c.estadoCliente || 'Activo';
      if (ec !== fEC) return false;
    }

    // 3) Estado servicio
    if (fES !== 'todos') {
      const es = c.estadoServicio || 'Activo';
      if (es !== fES) return false;
    }

    // 4) Vencimiento (alineado con los badges)
    if (fV !== 'todos') {
      const es = c.estadoServicio || 'Activo';
      // Suspendido no aplica a filtros de vencimiento (ya tiene su propio filtro)
      if (es === 'Suspendido') return false;

      const ev = estadoVencimiento(c);
      let cat;
      switch (ev.label) {
        case 'Activo':           cat = 'al-dia';            break;
        case 'Por vencer':       cat = 'por-vencer';        break;
        case 'En prórroga':      cat = 'en-prorroga';       break;
        case 'Prórroga vencida': cat = 'prorroga-vencida';  break;
        case 'Sin fecha':        cat = 'sin-fecha';         break;
        default:                 cat = 'sin-fecha';
      }
      if (cat !== fV) return false;
    }

    return true;
  });

  renderTablaClientes(filtrados);
}

// ==========================================
// RENDER
// ==========================================
function renderTablaClientes(lista) {
  const tbody = document.getElementById('tabla-clientes-body');
  if (!tbody) return;

  if (lista.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" class="px-6 py-4 text-center text-zinc-500 dark:text-zinc-400">No hay clientes que coincidan con los filtros.</td></tr>';
    refrescarIconos();
    return;
  }

  tbody.innerHTML = '';

  lista.forEach((c) => {
    const nombre = c.nombreComercial || c.nombreCliente || 'Sin nombre';
    const iniciales = inicialesCliente(c);
    const ev = estadoVencimiento(c);
    const prorroga = c.fechaVencimiento ? sumarDias(c.fechaVencimiento, DIAS_PRORROGA) : null;
    const estadoTachado = (c.estadoCliente === 'Retirado') ? 'line-through text-zinc-400 dark:text-zinc-600' : '';

    const filaHTML = `
      <tr class="hover:bg-zinc-50/70 dark:hover:bg-zinc-800/50 transition-colors">
        <td class="px-6 py-4">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-md bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 flex items-center justify-center font-medium text-xs">
              ${esc(iniciales)}
            </div>
            <div>
              <span class="font-medium text-zinc-900 dark:text-zinc-100 ${estadoTachado}">${esc(nombre)}</span>
              <span class="text-[11px] text-zinc-400 dark:text-zinc-500 font-mono mt-0.5 block">${esc(c.nombreCliente || '')}</span>
            </div>
          </div>
        </td>
        <td class="px-6 py-4">
          <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
            <span class="w-2 h-2 rounded-full" style="background:${ev.color}"></span>${esc(ev.label)}
          </span>
        </td>
        <td class="px-6 py-4 text-zinc-500 dark:text-zinc-400 font-mono text-[11px]">
          <div>${esc(formatearFecha(c.fechaVencimiento))}</div>
          ${prorroga ? `<div class="text-[10px] text-amber-600 dark:text-amber-400">Prórroga: ${esc(prorroga.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' }))}</div>` : ''}
        </td>
        <td class="px-6 py-4 text-right">
          <button data-action="ver-cliente" data-cliente-id="${esc(c.id)}" class="px-3 py-1.5 rounded-md border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800">
  Gestionar
</button>
        </td>
      </tr>
    `;
    tbody.insertAdjacentHTML('beforeend', filaHTML);
  });

  refrescarIconos();
}

// ==========================================
// SETTERS DE FILTROS (invocados desde master.js)
// ==========================================
export function setFiltroBusqueda(valor) {
  setState({ filtrosClientes: { ...getState().filtrosClientes, busqueda: valor } });
  aplicarFiltrosClientes();
}
export function setFiltroEstadoCliente(valor) {
  setState({ filtrosClientes: { ...getState().filtrosClientes, estadoCliente: valor } });
  aplicarFiltrosClientes();
}
export function setFiltroEstadoServicio(valor) {
  setState({ filtrosClientes: { ...getState().filtrosClientes, estadoServicio: valor } });
  aplicarFiltrosClientes();
}
export function setFiltroVencimiento(valor) {
  setState({ filtrosClientes: { ...getState().filtrosClientes, vencimiento: valor } });
  aplicarFiltrosClientes();
}