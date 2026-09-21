// ==========================================
// UI: Renderers compartidos (redes y direcciones)
// ==========================================
import { REDES_DISPONIBLES } from '../config/constantes.js';
import { esc, refrescarIconos, obtenerRedMeta } from '../core/helpers.js';

// ---------- REDES ----------
export function renderRedEditor(container, redes, onChange, prefijo) {
  if (!container) return;
  container.innerHTML = '';

  redes.forEach((red, i) => {
    const meta = obtenerRedMeta(red.tipo, REDES_DISPONIBLES);
    const row = document.createElement('div');
    row.className = 'flex gap-2 items-start';
    row.innerHTML = `
      <div class="flex-1 flex gap-2 items-center bg-zinc-50 border border-zinc-200 rounded-md px-2 py-1.5">
        <i data-lucide="${meta.icon}" class="w-3.5 h-3.5 text-zinc-500 shrink-0" aria-hidden="true"></i>
        <select data-idx="${i}" class="red-tipo flex-1 bg-transparent text-xs focus:outline-none">
          ${REDES_DISPONIBLES.map((r) => `<option value="${r.tipo}" ${r.tipo === red.tipo ? 'selected' : ''}>${r.label}</option>`).join('')}
        </select>
        <input type="text" data-idx="${i}" class="red-valor flex-1 bg-transparent text-xs font-mono focus:outline-none border-l border-zinc-200 pl-2" value="${esc(red.valor || '')}" placeholder="${esc(meta.placeholder)}">
      </div>
      <button type="button" data-action="${prefijo}-rm-red" data-idx="${i}" class="w-7 h-7 rounded-md border border-zinc-200 text-zinc-400 hover:text-red-600 hover:border-red-200 flex items-center justify-center">
        <i data-lucide="trash-2" class="w-3 h-3" aria-hidden="true"></i>
      </button>
    `;
    container.appendChild(row);
  });

  container.querySelectorAll('.red-tipo').forEach((sel) => {
    sel.addEventListener('change', (e) => {
      const i = +e.target.dataset.idx;
      redes[i].tipo = e.target.value;
      onChange(redes);
    });
  });
  container.querySelectorAll('.red-valor').forEach((inp) => {
    inp.addEventListener('input', (e) => {
      const i = +e.target.dataset.idx;
      redes[i].valor = e.target.value;
      onChange(redes);
    });
  });

  refrescarIconos();
}

export function renderRedesGestionar(container, redes) {
  if (!container) return;
  if (!redes || redes.length === 0) {
    container.innerHTML = '<p class="text-[11px] text-zinc-400 italic">Sin redes registradas.</p>';
    return;
  }
  container.innerHTML = redes.map((red) => {
    const meta = obtenerRedMeta(red.tipo, REDES_DISPONIBLES);
    const url = meta.urlFn(red.valor);
    return `
      <a href="${esc(url)}" target="_blank" rel="noopener" class="flex items-center gap-2.5 p-2 border border-zinc-200 rounded-md hover:bg-zinc-50 transition-colors">
        <i data-lucide="${meta.icon}" class="w-4 h-4 text-zinc-600" aria-hidden="true"></i>
        <div class="flex-1 min-w-0">
          <div class="text-[11px] text-zinc-400 font-mono">${esc(meta.label)}</div>
          <div class="text-xs font-medium text-zinc-800 truncate">${esc(red.valor)}</div>
        </div>
        <i data-lucide="external-link" class="w-3.5 h-3.5 text-zinc-300" aria-hidden="true"></i>
      </a>
    `;
  }).join('');
  refrescarIconos();
}

// ---------- DIRECCIONES ----------
export function renderDireccionEditor(container, direcciones, onChange, prefijo) {
  if (!container) return;
  container.innerHTML = '';

  direcciones.forEach((dir, i) => {
    const row = document.createElement('div');
    row.className = 'border border-zinc-200 rounded-md p-3 space-y-2 bg-zinc-50/50';
    row.innerHTML = `
      <div class="flex items-center justify-between gap-2">
        <select data-idx="${i}" class="dir-tipo flex-1 bg-white border border-zinc-200 rounded-md px-2 py-1 text-[11px] focus:outline-none">
          <option value="fiscal" ${dir.tipo === 'fiscal' ? 'selected' : ''}>Fiscal</option>
          <option value="establecimiento" ${dir.tipo === 'establecimiento' ? 'selected' : ''}>Establecimiento</option>
        </select>
        <input type="text" data-idx="${i}" class="dir-nombre flex-1 bg-white border border-zinc-200 rounded-md px-2 py-1 text-[11px] focus:outline-none" value="${esc(dir.nombre || '')}" placeholder="Nombre (si aplica)">
        <button type="button" data-action="${prefijo}-rm-dir" data-idx="${i}" class="w-6 h-6 rounded-md border border-zinc-200 text-zinc-400 hover:text-red-600 flex items-center justify-center">
          <i data-lucide="trash-2" class="w-3 h-3" aria-hidden="true"></i>
        </button>
      </div>
      <input type="text" data-idx="${i}" class="dir-direccion w-full bg-white border border-zinc-200 rounded-md px-2 py-1 text-[11px] focus:outline-none" value="${esc(dir.direccion || '')}" placeholder="Dirección completa">
      <input type="text" data-idx="${i}" class="dir-referencia w-full bg-white border border-zinc-200 rounded-md px-2 py-1 text-[11px] focus:outline-none" value="${esc(dir.referencia || '')}" placeholder="Punto de referencia">
    `;
    container.appendChild(row);
  });

  container.querySelectorAll('.dir-tipo').forEach((s) => s.addEventListener('change', (e) => {
    const i = +e.target.dataset.idx; direcciones[i].tipo = e.target.value; onChange(direcciones);
  }));
  container.querySelectorAll('.dir-nombre').forEach((s) => s.addEventListener('input', (e) => {
    const i = +e.target.dataset.idx; direcciones[i].nombre = e.target.value; onChange(direcciones);
  }));
  container.querySelectorAll('.dir-direccion').forEach((s) => s.addEventListener('input', (e) => {
    const i = +e.target.dataset.idx; direcciones[i].direccion = e.target.value; onChange(direcciones);
  }));
  container.querySelectorAll('.dir-referencia').forEach((s) => s.addEventListener('input', (e) => {
    const i = +e.target.dataset.idx; direcciones[i].referencia = e.target.value; onChange(direcciones);
  }));

  refrescarIconos();
}

export function renderDireccionesGestionar(container, direcciones) {
  if (!container) return;
  if (!direcciones || direcciones.length === 0) {
    container.innerHTML = '<p class="text-[11px] text-zinc-400 italic">Sin direcciones registradas.</p>';
    return;
  }
  container.innerHTML = direcciones.map((dir) => `
    <div class="p-2.5 border border-zinc-200 rounded-md bg-zinc-50/40">
      <div class="flex items-center gap-2 mb-1">
        <span class="text-[10px] font-mono uppercase tracking-wider text-zinc-500">${esc(dir.tipo)}${dir.nombre ? ' · ' + esc(dir.nombre) : ''}</span>
      </div>
      <div class="text-xs text-zinc-800">${esc(dir.direccion || '—')}</div>
      ${dir.referencia ? `<div class="text-[11px] text-zinc-400 mt-0.5">${esc(dir.referencia)}</div>` : ''}
    </div>
  `).join('');
}