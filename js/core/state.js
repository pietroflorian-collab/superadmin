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

  // Lista completa de clientes (todos los estados)
  clientes: [],

  // Filtros activos de la tabla principal
  filtrosClientes: {
    busqueda: '',
    estadoCliente: 'todos',      // todos | Activo | Retirado
    estadoServicio: 'todos',     // todos | Activo | Suspendido
    vencimiento: 'todos'         // todos | al-dia | por-vencer | en-prorroga | prorroga-vencida | sin-fecha
  },
};

export const getState = () => state;

export const setState = (patch) => {
  Object.assign(state, patch);
  return state;
};