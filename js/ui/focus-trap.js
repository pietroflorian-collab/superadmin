// ==========================================
// UI: FOCUS TRAP — Pila de traps (último gana) + focus return
// ==========================================

const SELECTOR_FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])'
].join(',');

const stack = [];

export function activarFocusTrap(contenedor, autoFocus = true) {
  if (!contenedor) return () => {};

  // Capturamos el elemento con foco antes de abrir el modal/drawer
  // (normalmente es el botón que disparó la apertura)
  const elementoRetorno = document.activeElement;

  const entrada = { contenedor, activo: false, elementoRetorno };

  entrada.handler = (e) => {
    if (!entrada.activo) return;
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

  stack.forEach((t, i) => { t.activo = (i === stack.length - 1); });

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
    if (stack.length > 0) stack[stack.length - 1].activo = true;

    // Restaurar foco al elemento que abrió el modal/drawer (si sigue en el DOM)
    const retorno = entrada.elementoRetorno;
    if (
      retorno &&
      retorno !== document.body &&
      document.contains(retorno) &&
      typeof retorno.focus === 'function'
    ) {
      setTimeout(() => retorno.focus(), 50);
    }
  };
}