// ==========================================
// MÓDULO: CLIENTES — Listado en tabla principal
// ==========================================
import { db } from '../config/firebase.js';
import { collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";
import { DIAS_PRORROGA } from '../config/constantes.js';
import { esc, refrescarIconos, formatearFecha, sumarDias, inicialesCliente } from '../core/helpers.js';
import { estadoVencimiento } from '../core/estado-cliente.js';

export async function cargarClientes() {
  const tbody = document.getElementById('tabla-clientes-body');
  if (!tbody) return;

  tbody.innerHTML = '<tr><td colspan="4" class="px-6 py-4 text-center text-zinc-500">Sincronizando con Firestore...</td></tr>';

  try {
    const q = query(collection(db, "clientes_agencia"), where("estadoCliente", "==", "Activo"));
    const snap = await getDocs(q);
    tbody.innerHTML = '';

    if (snap.empty) {
      tbody.innerHTML = '<tr><td colspan="4" class="px-6 py-4 text-center text-zinc-500">No hay clientes registrados.</td></tr>';
      return;
    }

    snap.forEach((docSnap) => {
      const data = docSnap.data();
      const nombre = data.nombreComercial || data.nombreCliente || 'Sin nombre';
      const iniciales = inicialesCliente(data);
      const ev = estadoVencimiento(data);
      const prorroga = data.fechaVencimiento ? sumarDias(data.fechaVencimiento, DIAS_PRORROGA) : null;
      const estadoTachado = (data.estadoCliente === 'Retirado') ? 'line-through text-zinc-400' : '';

      const filaHTML = `
        <tr class="hover:bg-zinc-50/70 transition-colors">
          <td class="px-6 py-4">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-md bg-zinc-100 border border-zinc-200 text-zinc-700 flex items-center justify-center font-medium text-xs">
                ${esc(iniciales)}
              </div>
              <div>
                <span class="font-medium text-zinc-900 ${estadoTachado}">${esc(nombre)}</span>
                <span class="text-[11px] text-zinc-400 font-mono mt-0.5 block">${esc(data.nombreCliente || '')}</span>
              </div>
            </div>
          </td>
          <td class="px-6 py-4">
            <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-zinc-100 text-zinc-700 border border-zinc-200">
              <span class="w-2 h-2 rounded-full" style="background:${ev.color}"></span>${esc(ev.label)}
            </span>
          </td>
          <td class="px-6 py-4 text-zinc-500 font-mono text-[11px]">
            <div>${esc(formatearFecha(data.fechaVencimiento))}</div>
            ${prorroga ? `<div class="text-[10px] text-amber-600">Prórroga: ${esc(prorroga.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' }))}</div>` : ''}
          </td>
          <td class="px-6 py-4 text-right">
            <button data-action="abrir-panel-cliente" data-cliente-id="${esc(docSnap.id)}" class="px-3 py-1.5 rounded-md border border-zinc-200 text-zinc-700 text-xs font-medium hover:bg-zinc-100">
              Gestionar
            </button>
          </td>
        </tr>
      `;
      tbody.insertAdjacentHTML('beforeend', filaHTML);
    });

    refrescarIconos();
  } catch (error) {
    console.error("Error al cargar clientes:", error);
    tbody.innerHTML = '<tr><td colspan="4" class="px-6 py-4 text-center text-red-500">Error de conexión con Firestore.</td></tr>';
  }
}