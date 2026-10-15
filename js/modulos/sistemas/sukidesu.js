// ==========================================
// SISTEMA VISUAL: SUKIDESU (Clásico Oscuro)
// ==========================================

export const meta = {
  key: 'sukidesu',
  nombre: 'Clásico Oscuro',
  descripcion: 'Menú oscuro con 10 colores, 27 tipografías y control de radio.',
  icon: 'utensils',
  accent: '#AD2020'
};

// ---------- Schema ----------
const COLORES = [
  { key: 'colorPrimario',   label: 'Color Primario',     default: '#AD2020' },
  { key: 'colorFondo',      label: 'Color de Fondo',     default: '#000000' },
  { key: 'colorTexto',      label: 'Color de Texto',     default: '#E2E2E2' },
  { key: 'colorTextoSuave', label: 'Texto Suave',        default: '#E3BEBA' },
  { key: 'colorTarjetas',   label: 'Color de Tarjetas',  default: '#0A0A0A' },
  { key: 'colorCarrito',    label: 'Color del Carrito',  default: '#1A1A1A' },
  { key: 'colorBordes',     label: 'Color de Bordes',    default: '#5B403E' },
  { key: 'colorAcento',     label: 'Color de Acento',    default: '#ACC677' },
  { key: 'colorSubtitulo',  label: 'Color de Subtítulo', default: '#FFB3B1' },
  { key: 'colorHover',      label: 'Color Hover',        default: '#393939' }
];

const FUENTES = [
  'Inter','Playfair Display','Archivo','Fraunces','Space Grotesk','Lato','Raleway',
  'Anybody','Plus Jakarta Sans',
  'Playwrite Belgique','Playwrite Cuba','Edu QLD Hand','Caveat','Parisienne'
];

const GRUPOS_TIPOGRAFIA = {
  marca: {
    label: 'Marca',
    zonas: [
      { key: 'navNegocio',      label: 'Nombre del negocio',    sub: 'Nav superior',   fuente: 'Anybody',          tamano: 46, preview: 'SUKIDESU SUSHI' },
      { key: 'navLink',         label: 'Link "Inicio"',         sub: 'Nav superior',   fuente: 'Space Grotesk',    tamano: 14, preview: 'Inicio' },
      { key: 'heroEslogan',     label: 'Eslogan',               sub: 'Hero / banner',  fuente: 'Anybody',          tamano: 46, preview: '¡QUÉ CHIMBA DE SUSHI!' },
      { key: 'heroDescripcion', label: 'Descripción del negocio', sub: 'Hero / banner', fuente: 'Plus Jakarta Sans', tamano: 16, preview: 'Experimenta los sabores más audaces' }
    ]
  },
  navegacion: {
    label: 'Navegación',
    zonas: [
      { key: 'catTitulo',  label: 'Título de categoría',  sub: 'Encabezado de sección', fuente: 'Space Grotesk',    tamano: 24, preview: 'Rollos Clásicos' },
      { key: 'catBoton',   label: 'Botón de categoría',   sub: 'Barra superior',        fuente: 'Plus Jakarta Sans', tamano: 14, preview: 'Entradas' }
    ]
  },
  contenido: {
    label: 'Contenido',
    zonas: [
      { key: 'platoNombre',      label: 'Nombre del plato',       sub: 'Tarjeta del plato',    fuente: 'Anybody',          tamano: 20, preview: 'California Roll' },
      { key: 'platoPrecio',      label: 'Precio',                 sub: 'Tarjeta del plato',    fuente: 'Space Grotesk',    tamano: 14, preview: '$37.900' },
      { key: 'platoDescripcion', label: 'Descripción del plato',  sub: 'Tarjeta del plato',    fuente: 'Plus Jakarta Sans', tamano: 14, preview: 'Kanikama, aguacate, pepino' },
      { key: 'platoTag',         label: 'Tag de categoría',       sub: 'Esquina de la foto',   fuente: 'Plus Jakarta Sans', tamano: 10, preview: 'ENTRADAS' },
      { key: 'platoPromo',       label: 'Tag de promo',           sub: 'Esquina de la foto',   fuente: 'Space Grotesk',    tamano: 10, preview: '2x1 HOY' },
      { key: 'platoPicante',     label: 'Etiqueta "Picante"',     sub: 'Tarjeta del plato',    fuente: 'Plus Jakarta Sans', tamano: 9,  preview: 'PICANTE' },
      { key: 'platoFoto',        label: '"Foto referencial"',     sub: 'Pie de la tarjeta',    fuente: 'Plus Jakarta Sans', tamano: 11, preview: 'Foto referencial' }
    ]
  },
  interaccion: {
    label: 'Interacción',
    zonas: [
      { key: 'modalTitulo',     label: 'Título del carrito',      sub: 'Modal carrito',            fuente: 'Space Grotesk',    tamano: 18, preview: 'Selección' },
      { key: 'modalItem',       label: 'Ítem del carrito',        sub: 'Modal carrito',            fuente: 'Plus Jakarta Sans', tamano: 14, preview: 'California Roll' },
      { key: 'modalCantidad',   label: 'Cantidad',                sub: 'Modal carrito',            fuente: 'Space Grotesk',    tamano: 14, preview: '3' },
      { key: 'modalBotones',    label: 'Botones del carrito',     sub: 'Modal carrito',            fuente: 'Plus Jakarta Sans', tamano: 12, preview: 'Cerrar' },
      { key: 'modalVacio',      label: 'Carrito vacío',           sub: 'Modal carrito',            fuente: 'Plus Jakarta Sans', tamano: 14, preview: 'No has agregado platos' },
      { key: 'fabTexto',        label: 'Texto del FAB',           sub: 'Botón flotante',           fuente: 'Plus Jakarta Sans', tamano: 14, preview: 'Ver mi lista' },
      { key: 'fabBadge',        label: 'Badge del FAB',           sub: 'Botón flotante',           fuente: 'Space Grotesk',    tamano: 12, preview: '5' },
      { key: 'mantTitulo',      label: 'Título mantenimiento',    sub: 'Overlay mantenimiento',    fuente: 'Space Grotesk',    tamano: 24, preview: 'Servicio Inactivo' },
      { key: 'mantDescripcion', label: 'Descripción mantenimiento', sub: 'Overlay mantenimiento',  fuente: 'Plus Jakarta Sans', tamano: 14, preview: 'Menú en mantenimiento' },
      { key: 'promoTexto',      label: 'Texto del promo',         sub: 'Modal promo',              fuente: 'Plus Jakarta Sans', tamano: 14, preview: 'Promo del día' },
      { key: 'promoBotones',    label: 'Botones del promo',       sub: 'Modal promo',              fuente: 'Plus Jakarta Sans', tamano: 12, preview: '¡Ver el Menú!' },
      { key: 'footerTexto',     label: 'Texto del footer',        sub: 'Pie de página',            fuente: 'Plus Jakarta Sans', tamano: 12, preview: '© 2026 Sukidesu' },
      { key: 'footerLinks',     label: 'Links del footer',        sub: 'Pie de página',            fuente: 'Plus Jakarta Sans', tamano: 12, preview: 'Privacidad' },
      { key: 'toast',           label: 'Notificaciones toast',    sub: 'Avisos flotantes',         fuente: 'Inter',            tamano: 12, preview: 'Menú actualizado' }
    ]
  }
};

const RADIO = { default: 8, min: 0, max: 24 };

const cap = (s) => s[0].toUpperCase() + s.slice(1);
const todasLasZonas = () => Object.values(GRUPOS_TIPOGRAFIA).flatMap(g => g.zonas);

// ---------- Render ----------
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

function htmlFilaZona(z, ap) {
  const fKey = 'fuente' + cap(z.key);
  const sKey = 'tamaño' + cap(z.key);
  const fuenteVal = ap[fKey] || '';
  const tamanoVal = ap[sKey] ?? '';
  const previewFont = fuenteVal || z.fuente;
  const options = FUENTES.map(f => `<option value="${f}" ${fuenteVal === f ? 'selected' : ''}>${f}</option>`).join('');
  return `
    <div class="flex items-center gap-3 py-2 border-b border-zinc-100 dark:border-zinc-800 last:border-0">
      <div class="w-44 shrink-0">
        <div class="text-[11px] font-medium text-zinc-700 dark:text-zinc-300">${z.label}</div>
        <div class="text-[9px] text-zinc-400 dark:text-zinc-500 font-mono">${z.sub}</div>
      </div>
      <select class="w-40 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded px-2 py-1 text-[11px] text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-400"
              data-fuente="${z.key}">
        <option value="">— Default —</option>
        ${options}
      </select>
      <input type="number" min="8" max="120" value="${tamanoVal}" placeholder="${z.tamano}"
             data-tamano="${z.key}"
             class="w-16 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded px-2 py-1 text-[11px] text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-400" />
      <div class="flex-1 min-w-0 text-right">
        <span class="text-zinc-500 dark:text-zinc-400 truncate block"
              data-preview="${z.key}"
              style="font-family: '${previewFont}', sans-serif; font-size: 16px;">${z.preview}</span>
      </div>
    </div>`;
}

export function render(container, ap = {}, { onCambio } = {}) {
  const grupos = Object.entries(GRUPOS_TIPOGRAFIA).map(([key, g]) => `
    <div data-subtab-content="${key}" class="subtab-content ${key === 'marca' ? '' : 'hidden'}">
      ${g.zonas.map(z => htmlFilaZona(z, ap)).join('')}
    </div>`).join('');

  container.innerHTML = `
    <div class="space-y-4">
      <!-- COLORES -->
      <div>
        <div class="flex items-center gap-2 mb-3">
          <i data-lucide="palette" class="w-4 h-4 text-zinc-500 dark:text-zinc-400"></i>
          <h5 class="text-xs font-semibold text-zinc-900 dark:text-zinc-100">Colores</h5>
          <span class="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono">10 controles</span>
        </div>
        <div class="grid grid-cols-2 gap-3">
          ${COLORES.map(c => htmlColor(c, ap[c.key])).join('')}
        </div>
      </div>

      <!-- FORMAS -->
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
        </div>
      </div>

      <!-- TIPOGRAFÍA -->
      <div class="pt-4 border-t border-zinc-100 dark:border-zinc-800">
        <div class="flex items-center gap-2 mb-3">
          <i data-lucide="type" class="w-4 h-4 text-zinc-500 dark:text-zinc-400"></i>
          <h5 class="text-xs font-semibold text-zinc-900 dark:text-zinc-100">Tipografía</h5>
          <span class="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono">27 zonas</span>
        </div>
        <div class="flex gap-1 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-md mb-4 overflow-x-auto">
          ${Object.entries(GRUPOS_TIPOGRAFIA).map(([key, g], i) => `
            <button type="button" data-subtab="${key}"
                    class="subtab-btn flex-1 px-3 py-1.5 text-[11px] font-medium rounded whitespace-nowrap transition-colors ${i === 0 ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm' : 'text-zinc-500 dark:text-zinc-400'}">
              ${g.label}
            </button>`).join('')}
        </div>
        <div>${grupos}</div>
      </div>
    </div>
  `;

  // ---- Bindings ----
  const marcar = () => onCambio && onCambio();

  // Color pickers
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
        if (/^#[0-9A-F]{6}$/.test(v)) {
          picker.value = v; texto.value = v; marcar();
        } else {
          texto.value = picker.value.toUpperCase();
        }
      };
      texto.addEventListener('blur', aplicar);
      texto.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); aplicar(); texto.blur(); } });
    }
  });

  // Radio
  const radio = container.querySelector('[data-radio]');
  const radioVal = container.querySelector('[data-radio-valor]');
  if (radio) radio.addEventListener('input', () => {
    if (radioVal) radioVal.textContent = radio.value + 'px';
    marcar();
  });

  // Subtabs
  container.querySelectorAll('.subtab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('.subtab-btn').forEach(b => {
        const activo = b === btn;
        b.classList.toggle('bg-white', activo);
        b.classList.toggle('dark:bg-zinc-900', activo);
        b.classList.toggle('text-zinc-900', activo);
        b.classList.toggle('dark:text-zinc-100', activo);
        b.classList.toggle('shadow-sm', activo);
        b.classList.toggle('text-zinc-500', !activo);
        b.classList.toggle('dark:text-zinc-400', !activo);
      });
      container.querySelectorAll('.subtab-content').forEach(s => {
        s.classList.toggle('hidden', s.dataset.subtabContent !== btn.dataset.subtab);
      });
    });
  });

  // Fuentes y tamaños
  const actualizarPreview = (zonaKey) => {
    const z = todasLasZonas().find(x => x.key === zonaKey);
    if (!z) return;
    const select = container.querySelector(`[data-fuente="${zonaKey}"]`);
    const preview = container.querySelector(`[data-preview="${zonaKey}"]`);
    if (!select || !preview) return;
    preview.style.fontFamily = `'${select.value || z.fuente}', sans-serif`;
  };
  container.querySelectorAll('[data-fuente]').forEach(sel => {
    sel.addEventListener('change', () => { actualizarPreview(sel.dataset.fuente); marcar(); });
  });
  container.querySelectorAll('[data-tamano]').forEach(inp => {
    inp.addEventListener('input', marcar);
  });

  if (window.lucide) window.lucide.createIcons();
}

// ---------- Leer del DOM ----------
export function leer(container) {
  const out = {};

  // Colores
  COLORES.forEach(c => {
    const picker = container.querySelector(`[data-color-picker="${c.key}"]`);
    if (picker && /^#[0-9a-fA-F]{6}$/.test(picker.value)) {
      out[c.key] = picker.value.toUpperCase();
    }
  });

  // Radio
  const radio = container.querySelector('[data-radio]');
  if (radio) {
    const n = parseInt(radio.value, 10);
    if (!isNaN(n)) out.radioBordes = String(n);
  }

  // Tipografías y tamaños
  todasLasZonas().forEach(z => {
    const fKey = 'fuente' + cap(z.key);
    const sKey = 'tamaño' + cap(z.key);

    const sel = container.querySelector(`[data-fuente="${z.key}"]`);
    if (sel && sel.value) out[fKey] = sel.value;

    const inp = container.querySelector(`[data-tamano="${z.key}"]`);
    if (inp && inp.value !== '') {
      const n = parseInt(inp.value, 10);
      if (!isNaN(n) && n >= 8 && n <= 120) out[sKey] = n;
    }
  });

  return out;
}