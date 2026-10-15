// ==========================================
// SISTEMA VISUAL: EDITORIAL (revista impresa)
// ==========================================

export const meta = {
  key: 'editorial',
  nombre: 'Editorial',
  descripcion: 'Estilo revista impresa: serif marcado, alto contraste y curvas mínimas.',
  icon: 'newspaper',
  accent: '#B71C1C'
};

const COLORES = [
  { key: 'colorPrimario',   label: 'Acento (Bermellón)', default: '#B71C1C' },
  { key: 'colorFondo',      label: 'Fondo (Papel)',      default: '#FAF8F5' },
  { key: 'colorTexto',      label: 'Texto (Tinta)',      default: '#0A0A0A' },
  { key: 'colorTextoSuave', label: 'Texto Suave',        default: '#6B6B6B' },
  { key: 'colorBordes',     label: 'Líneas',             default: '#D4CFC7' }
];

const FUENTES = ['Playfair Display','Fraunces','Archivo','Lato','Raleway','Inter','Space Grotesk'];

const TIPOGRAFIAS = [
  { key: 'fuenteTitulos', label: 'Fuente de Títulos', default: 'Playfair Display' },
  { key: 'fuenteCuerpo',  label: 'Fuente de Cuerpo',  default: 'Lato' }
];

const RADIO = { default: 2, min: 0, max: 16 };

function htmlColor(c, valor) {
  const v = valor || c.default;
  return `
    <div class="space-y-1">
      <label for="ap-color-${c.key}" class="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">${c.label}</label>
      <div class="flex items-center gap-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md p-1.5">
        <input id="ap-color-${c.key}" type="color" value="${v}" data-color-picker="${c.key}"
               class="w-7 h-7 rounded border border-zinc-300 dark:border-zinc-700 p-0 cursor-pointer bg-transparent" />
        <input type="text" value="${v.toUpperCase()}" maxlength="7" data-color-text="${c.key}"
               class="flex-1 min-w-0 bg-transparent text-[10px] font-mono font-medium text-zinc-700 dark:text-zinc-300 uppercase focus:outline-none" />
      </div>
    </div>`;
}

export function render(container, ap = {}, { onCambio } = {}) {
  container.innerHTML = `
    <div class="space-y-4">
      <div>
        <div class="flex items-center gap-2 mb-3">
          <i data-lucide="palette" class="w-4 h-4 text-zinc-500 dark:text-zinc-400"></i>
          <h5 class="text-xs font-semibold text-zinc-900 dark:text-zinc-100">Colores</h5>
          <span class="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono">5 controles</span>
        </div>
        <div class="grid grid-cols-2 gap-3">
          ${COLORES.map(c => htmlColor(c, ap[c.key])).join('')}
        </div>
      </div>

      <div class="pt-4 border-t border-zinc-100 dark:border-zinc-800">
        <div class="flex items-center gap-2 mb-3">
          <i data-lucide="square" class="w-4 h-4 text-zinc-500 dark:text-zinc-400"></i>
          <h5 class="text-xs font-semibold text-zinc-900 dark:text-zinc-100">Formas</h5>
        </div>
        <div class="space-y-1">
          <label class="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">Bordes Redondeados</label>
          <div class="flex items-center gap-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md p-1.5">
            <input type="range" min="${RADIO.min}" max="${RADIO.max}" step="2" value="${ap.radioBordes ?? RADIO.default}"
                   data-radio class="flex-1 accent-zinc-900 dark:accent-zinc-100 cursor-pointer" />
            <span data-radio-valor class="text-xs font-mono font-medium text-zinc-700 dark:text-zinc-300">${ap.radioBordes ?? RADIO.default}px</span>
          </div>
          <p class="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono pt-1">Recomendado: 0–4px (esquinas rectas)</p>
        </div>
      </div>

      <div class="pt-4 border-t border-zinc-100 dark:border-zinc-800">
        <div class="flex items-center gap-2 mb-3">
          <i data-lucide="type" class="w-4 h-4 text-zinc-500 dark:text-zinc-400"></i>
          <h5 class="text-xs font-semibold text-zinc-900 dark:text-zinc-100">Tipografía</h5>
          <span class="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono">2 fuentes</span>
        </div>
        <div class="space-y-2">
          ${TIPOGRAFIAS.map(t => {
            const val = ap[t.key] || '';
            const options = FUENTES.map(f => `<option value="${f}" ${val === f ? 'selected' : ''}>${f}</option>`).join('');
            return `
              <div class="flex items-center gap-3 py-1.5">
                <div class="w-40 shrink-0">
                  <div class="text-[11px] font-medium text-zinc-700 dark:text-zinc-300">${t.label}</div>
                  <div class="text-[9px] text-zinc-400 dark:text-zinc-500 font-mono">Default: ${t.default}</div>
                </div>
                <select class="flex-1 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded px-2 py-1 text-[11px] text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-400"
                        data-fuente-simple="${t.key}">
                  <option value="">— Default —</option>
                  ${options}
                </select>
              </div>`;
          }).join('')}
        </div>
      </div>
    </div>
  `;

  const marcar = () => onCambio && onCambio();

  container.querySelectorAll('[data-color-picker]').forEach(picker => {
    const key = picker.dataset.colorPicker;
    const texto = container.querySelector(`[data-color-text="${key}"]`);
    picker.addEventListener('input', () => {
      if (texto) texto.value = picker.value.toUpperCase();
      marcar();
    });
    if (texto) {
      const aplicar = () => {
        let v = texto.value.trim().toUpperCase();
        if (!v.startsWith('#')) v = '#' + v;
        if (/^#[0-9A-F]{3}$/.test(v)) v = '#' + v[1]+v[1]+v[2]+v[2]+v[3]+v[3];
        if (/^#[0-9A-F]{6}$/.test(v)) { picker.value = v; texto.value = v; marcar(); }
        else texto.value = picker.value.toUpperCase();
      };
      texto.addEventListener('blur', aplicar);
      texto.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); aplicar(); texto.blur(); } });
    }
  });

  const radio = container.querySelector('[data-radio]');
  const radioVal = container.querySelector('[data-radio-valor]');
  if (radio) radio.addEventListener('input', () => {
    if (radioVal) radioVal.textContent = radio.value + 'px';
    marcar();
  });

  container.querySelectorAll('[data-fuente-simple]').forEach(sel => {
    sel.addEventListener('change', marcar);
  });

  if (window.lucide) window.lucide.createIcons();
}

export function leer(container) {
  const out = {};
  COLORES.forEach(c => {
    const picker = container.querySelector(`[data-color-picker="${c.key}"]`);
    if (picker && /^#[0-9a-fA-F]{6}$/.test(picker.value)) out[c.key] = picker.value.toUpperCase();
  });
  const radio = container.querySelector('[data-radio]');
  if (radio) {
    const n = parseInt(radio.value, 10);
    if (!isNaN(n)) out.radioBordes = String(n);
  }
  TIPOGRAFIAS.forEach(t => {
    const sel = container.querySelector(`[data-fuente-simple="${t.key}"]`);
    if (sel && sel.value) out[t.key] = sel.value;
  });
  return out;
}