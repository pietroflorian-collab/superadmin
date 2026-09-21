// ==========================================
// STORE — Estado compartido entre módulos
// ==========================================
// Regla: solo lo que cruza módulos vive aquí.
// Lo local (editandoRedes, proveedorActivo, etc.)
// vive dentro del módulo que lo usa.

const state = {
  // Cliente actualmente abierto en el drawer Gestionar
  clienteSeleccionado: null,

  // Cliente seleccionado en el modal Gestión de Pagos
  gpClienteSeleccionado: null,
  gpClientesCache: [],
};

export const getState = () => state;

export const setState = (patch) => {
  Object.assign(state, patch);
  return state;
};