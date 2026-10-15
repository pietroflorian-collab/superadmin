// ==========================================
// REGISTRO DE SISTEMAS VISUALES
// ==========================================
// Metadata pura. La lógica de cada sistema vive en
// `js/modulos/sistemas/{key}.js` y se carga dinámicamente.

export const SISTEMAS_VISUALES = {
  sukidesu: {
    key: 'sukidesu',
    nombre: 'Clásico Oscuro',
    descripcion: 'Menú oscuro con 10 colores, 27 tipografías y control de radio.',
    icon: 'utensils',
    accent: '#AD2020'
  },
  shadcn: {
    key: 'shadcn',
    nombre: 'Shadcn Elegante',
    descripcion: 'Menú claro y minimalista con acento dorado.',
    icon: 'sparkles',
    accent: '#B8934A'
  }
};

export function listaSistemas() {
  return Object.values(SISTEMAS_VISUALES);
}

export function obtenerMeta(key) {
  return SISTEMAS_VISUALES[key] || null;
}

// Carga dinámica del módulo del sistema (code-splitting por UI)
export async function cargarModuloSistema(key) {
  if (!SISTEMAS_VISUALES[key]) throw new Error(`Sistema desconocido: ${key}`);
  return await import(`../modulos/sistemas/${key}.js`);
}