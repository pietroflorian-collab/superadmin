// ==========================================
// UI: FOCUS TRAP — Pila de traps (último gana)
// ==========================================

const SELECTOR_FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])'
].join(',');

const stack = [];   // pila de traps activos

export function activarFocusTrap(contenedor, autoFocus = true) {
  if (!contenedor) return () => {};

  const entrada = { contenedor, activo: false };

  entrada.handler = (e) => {
    if (!entrada.activo) return;                         // solo el trap topmost actúa
    if (e.key !== 'Tab') return;
    if (contenedor.classList.contains('hidden')) return;

    const focusables = Array.from(contenedor.querySelectorAll(SELECTOR_FOCUSABLE))
      .filter((el) => el.offsetWidth > 0 && el.offsetHeight > 0);

    if (focusables.length === 0) return;

    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    const active = document.activeElement;
    const dentro = contenedor.contains(active);

    if (e.shiftKey) {
      if (active === first || !dentro) {
        e.preventDefault();
        e.stopPropagation();
        last.focus();
      }
    } else {
      if (active === last || !dentro) {
        e.preventDefault();
        e.stopPropagation();
        first.focus();
      }
    }
  };

  document.addEventListener('keydown', entrada.handler, true);
  stack.push(entrada);

  // Solo el último entra en juego
  stack.forEach((t, i) => { t.activo = (i === stack.length - 1); });

  // Auto-focus al primer focusable
  if (autoFocus) {
    setTimeout(() => {
      const focusables = Array.from(contenedor.querySelectorAll(SELECTOR_FOCUSABLE))
        .filter((el) => el.offsetWidth > 0 && el.offsetHeight > 0);
      if (focusables.length > 0 && !contenedor.contains(document.activeElement)) {
        focusables[0].focus();
      }
    }, 30);
  }

  return () => {
    document.removeEventListener('keydown', entrada.handler, true);
    const idx = stack.indexOf(entrada);
    if (idx >= 0) stack.splice(idx, 1);
    // Reactivar el que queda arriba
    if (stack.length > 0) stack[stack.length - 1].activo = true;
  };
}