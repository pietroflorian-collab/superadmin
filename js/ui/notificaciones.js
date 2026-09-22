// ==========================================
// UI: NOTIFICACIONES — Toast + Confirm modal
// ==========================================

let toastContainer = null;

function getToastContainer() {
  if (toastContainer) return toastContainer;
  toastContainer = document.getElementById('toast-container');
  return toastContainer;
}

// ---------- Toast ----------
export function toast(mensaje, tipo = 'info', duracion = 3500) {
  const cont = getToastContainer();
  if (!cont) { console.warn('toast-container no encontrado'); return; }

  const cfg = {
    info:  { bg: 'bg-zinc-900',   icon: 'info' },
    exito: { bg: 'bg-emerald-600', icon: 'check-circle' },
    error: { bg: 'bg-red-600',     icon: 'alert-circle' },
    aviso: { bg: 'bg-amber-500',   icon: 'alert-triangle' }
  }[tipo] || { bg: 'bg-zinc-900', icon: 'info' };

  const el = document.createElement('div');
  el.className = `pointer-events-auto flex items-start gap-2.5 px-3.5 py-2.5 rounded-md shadow-lg text-white text-xs font-medium ${cfg.bg} opacity-0 translate-y-2 transition-all duration-200 max-w-sm`;
  el.innerHTML = `
    <i data-lucide="${cfg.icon}" class="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true"></i>
    <span class="flex-1 whitespace-pre-line">${escapeHTML(mensaje)}</span>
  `;
  cont.appendChild(el);

  if (window.lucide) window.lucide.createIcons();

  requestAnimationFrame(() => el.classList.remove('opacity-0', 'translate-y-2'));

  setTimeout(() => {
    el.classList.add('opacity-0', 'translate-y-2');
    setTimeout(() => el.remove(), 250);
  }, duracion);
}

// ---------- Confirm modal ----------
export function confirmar({
  titulo = 'Confirmar',
  mensaje = '',
  textoConfirmar = 'Confirmar',
  textoCancelar = 'Cancelar',
  peligro = false
} = {}) {
  return new Promise((resolve) => {
    const modal = document.getElementById('modal-confirmar');
    if (!modal) { resolve(window.confirm(mensaje)); return; }

    const elTitulo = modal.querySelector('[data-role="titulo"]');
    const elMensaje = modal.querySelector('[data-role="mensaje"]');
    const btnOk = modal.querySelector('[data-role="confirmar"]');
    const btnCancel = modal.querySelector('[data-role="cancelar"]');

    elTitulo.textContent = titulo;
    elMensaje.textContent = mensaje;
    btnOk.textContent = textoConfirmar;
    btnCancel.textContent = textoCancelar;

    btnOk.className = `px-3.5 py-1.5 rounded-md text-xs font-medium shadow-sm ${
      peligro
        ? 'bg-red-600 text-white hover:bg-red-700'
        : 'bg-zinc-900 text-white hover:bg-zinc-800'
    }`;

    modal.classList.remove('hidden');
    if (window.lucide) window.lucide.createIcons();
    setTimeout(() => btnOk.focus(), 50);

    function cerrar(resultado) {
      modal.classList.add('hidden');
      btnOk.removeEventListener('click', onOk);
      btnCancel.removeEventListener('click', onCancel);
      modal.removeEventListener('click', onBackdrop);
      document.removeEventListener('keydown', onKey);
      resolve(resultado);
    }
    function onOk() { cerrar(true); }
    function onCancel() { cerrar(false); }
    function onBackdrop(e) { if (e.target === modal) cerrar(false); }
    function onKey(e) {
      if (e.key === 'Escape') { e.stopPropagation(); cerrar(false); }
      if (e.key === 'Enter')  { cerrar(true); }
    }

    btnOk.addEventListener('click', onOk);
    btnCancel.addEventListener('click', onCancel);
    modal.addEventListener('click', onBackdrop);
    document.addEventListener('keydown', onKey);
  });
}

// ---------- Helpers ----------
function escapeHTML(s) {
  const div = document.createElement('div');
  div.textContent = s;
  return div.innerHTML;
}