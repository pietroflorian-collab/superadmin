// ==========================================
// SISTEMAS VISUALES — Schema por plantilla
// ==========================================
// Cada sistema visual define qué controles mostrar en el panel
// y cómo se guardan en Firestore/menu.json.
//
// Al crear/editar un cliente, el panel lee `sistemaVisual` desde
// Firestore y renderiza SOLO los controles del schema correspondiente.

export const SISTEMAS_VISUALES = {
  // ============================================
  // CLÁSICO OSCURO (Sukidesu)
  // ============================================
  sukidesu: {
    nombre: 'Clásico Oscuro',
    descripcion: 'Menú oscuro con 10 colores y 27 tipografías personalizables.',
    colores: [
      { key: 'colorPrimario',    label: 'Color Primario',      default: '#AD2020' },
      { key: 'colorFondo',       label: 'Color de Fondo',      default: '#000000' },
      { key: 'colorTexto',       label: 'Color de Texto',      default: '#e2e2e2' },
      { key: 'colorTextoSuave',  label: 'Texto Suave',         default: '#e3beba' },
      { key: 'colorTarjetas',    label: 'Color de Tarjetas',   default: '#0a0a0a' },
      { key: 'colorCarrito',     label: 'Color del Carrito',   default: '#1a1a1a' },
      { key: 'colorBordes',      label: 'Color de Bordes',     default: '#5b403e' },
      { key: 'colorAcento',      label: 'Color de Acento',     default: '#ACC677' },
      { key: 'colorSubtitulo',   label: 'Color de Subtítulo',  default: '#ffb3b1' },
      { key: 'colorHover',       label: 'Color Hover',         default: '#393939' },
    ],
    tipografias: [
      { key: 'fuenteNavNegocio',       label: 'Nav — Nombre',       default: 'Anybody' },
      { key: 'fuenteNavLink',          label: 'Nav — Link',         default: 'Space Grotesk' },
      { key: 'fuenteHeroEslogan',      label: 'Hero — Eslogan',     default: 'Anybody' },
      { key: 'fuenteHeroDescripcion',  label: 'Hero — Descripción', default: 'Plus Jakarta Sans' },
      { key: 'fuenteCatTitulo',        label: 'Cat — Título',       default: 'Space Grotesk' },
      { key: 'fuenteCatBoton',         label: 'Cat — Botón',        default: 'Plus Jakarta Sans' },
      { key: 'fuentePlatoNombre',      label: 'Plato — Nombre',     default: 'Anybody' },
      { key: 'fuentePlatoPrecio',      label: 'Plato — Precio',     default: 'Space Grotesk' },
      { key: 'fuentePlatoDescripcion', label: 'Plato — Descripción',default: 'Plus Jakarta Sans' },
      { key: 'fuentePlatoTag',         label: 'Plato — Tag',        default: 'Plus Jakarta Sans' },
      { key: 'fuentePlatoPromo',       label: 'Plato — Promo',      default: 'Space Grotesk' },
      { key: 'fuentePlatoPicante',     label: 'Plato — Picante',    default: 'Plus Jakarta Sans' },
      { key: 'fuentePlatoFoto',        label: 'Plato — Foto',       default: 'Plus Jakarta Sans' },
      { key: 'fuenteModalTitulo',      label: 'Modal — Título',     default: 'Space Grotesk' },
      { key: 'fuenteModalItem',        label: 'Modal — Item',       default: 'Plus Jakarta Sans' },
      { key: 'fuenteModalCantidad',    label: 'Modal — Cantidad',   default: 'Space Grotesk' },
      { key: 'fuenteModalBotones',     label: 'Modal — Botones',    default: 'Plus Jakarta Sans' },
      { key: 'fuenteModalVacio',       label: 'Modal — Vacío',      default: 'Plus Jakarta Sans' },
      { key: 'fuenteFabTexto',         label: 'FAB — Texto',        default: 'Plus Jakarta Sans' },
      { key: 'fuenteFabBadge',         label: 'FAB — Badge',        default: 'Space Grotesk' },
      { key: 'fuenteMantTitulo',       label: 'Mantenimiento — Título',     default: 'Space Grotesk' },
      { key: 'fuenteMantDescripcion',  label: 'Mantenimiento — Descripción',default: 'Plus Jakarta Sans' },
      { key: 'fuentePromoTexto',       label: 'Promo — Texto',      default: 'Plus Jakarta Sans' },
      { key: 'fuentePromoBotones',     label: 'Promo — Botones',    default: 'Plus Jakarta Sans' },
      { key: 'fuenteFooterTexto',      label: 'Footer — Texto',     default: 'Plus Jakarta Sans' },
      { key: 'fuenteFooterLinks',      label: 'Footer — Links',     default: 'Plus Jakarta Sans' },
      { key: 'fuenteToast',            label: 'Toast',              default: 'Inter' },
    ],
    tamanos: [
      { key: 'tamañoNavNegocio',       label: 'Nav — Nombre',       default: 30, min: 8, max: 120 },
      { key: 'tamañoNavLink',          label: 'Nav — Link',         default: 14, min: 8, max: 60 },
      { key: 'tamañoHeroEslogan',      label: 'Hero — Eslogan',     default: 30, min: 8, max: 120 },
      { key: 'tamañoHeroDescripcion',  label: 'Hero — Descripción', default: 14, min: 8, max: 60 },
      { key: 'tamañoCatTitulo',        label: 'Cat — Título',       default: 20, min: 8, max: 80 },
      { key: 'tamañoCatBoton',         label: 'Cat — Botón',        default: 13, min: 8, max: 40 },
      { key: 'tamañoPlatoNombre',      label: 'Plato — Nombre',     default: 15, min: 8, max: 80 },
      { key: 'tamañoPlatoPrecio',      label: 'Plato — Precio',     default: 13, min: 8, max: 60 },
      { key: 'tamañoPlatoDescripcion', label: 'Plato — Descripción',default: 12, min: 8, max: 60 },
      { key: 'tamañoPlatoTag',         label: 'Plato — Tag',        default: 10, min: 8, max: 40 },
      { key: 'tamañoPlatoPromo',       label: 'Plato — Promo',      default: 10, min: 8, max: 40 },
      { key: 'tamañoPlatoPicante',     label: 'Plato — Picante',    default: 9,  min: 8, max: 40 },
      { key: 'tamañoPlatoFoto',        label: 'Plato — Foto',       default: 11, min: 8, max: 40 },
      { key: 'tamañoModalTitulo',      label: 'Modal — Título',     default: 18, min: 8, max: 80 },
      { key: 'tamañoModalItem',        label: 'Modal — Item',       default: 14, min: 8, max: 60 },
      { key: 'tamañoModalCantidad',    label: 'Modal — Cantidad',   default: 14, min: 8, max: 60 },
      { key: 'tamañoModalBotones',     label: 'Modal — Botones',    default: 12, min: 8, max: 40 },
      { key: 'tamañoModalVacio',       label: 'Modal — Vacío',      default: 14, min: 8, max: 60 },
      { key: 'tamañoFabTexto',         label: 'FAB — Texto',        default: 14, min: 8, max: 40 },
      { key: 'tamañoFabBadge',         label: 'FAB — Badge',        default: 12, min: 8, max: 40 },
      { key: 'tamañoMantTitulo',       label: 'Mantenimiento — Título',     default: 24, min: 8, max: 80 },
      { key: 'tamañoMantDescripcion',  label: 'Mantenimiento — Descripción',default: 14, min: 8, max: 60 },
      { key: 'tamañoPromoTexto',       label: 'Promo — Texto',      default: 14, min: 8, max: 60 },
      { key: 'tamañoPromoBotones',     label: 'Promo — Botones',    default: 12, min: 8, max: 40 },
      { key: 'tamañoFooterTexto',      label: 'Footer — Texto',     default: 12, min: 8, max: 40 },
      { key: 'tamañoFooterLinks',      label: 'Footer — Links',     default: 12, min: 8, max: 40 },
      { key: 'tamañoToast',            label: 'Toast',              default: 12, min: 8, max: 40 },
    ],
    radio: { default: '8', min: 0, max: 24 },
  },

  // ============================================
  // SHADCN ELEGANTE (La Trattoria)
  // ============================================
  shadcn: {
    nombre: 'Shadcn Elegante',
    descripcion: 'Menú claro y minimalista con acento dorado.',
    colores: [
      { key: 'colorPrimario',   label: 'Dorado (acento)', default: '#B8934A' },
      { key: 'colorFondo',      label: 'Fondo',           default: '#FAFAFA' },
      { key: 'colorTexto',      label: 'Texto',           default: '#18181B' },
      { key: 'colorTextoSuave', label: 'Texto Suave',     default: '#71717A' },
      { key: 'colorBordes',     label: 'Bordes',          default: '#E4E4E7' },
    ],
    tipografias: [
      { key: 'fuenteTitulos', label: 'Fuente de Títulos', default: 'Playfair Display' },
      { key: 'fuenteCuerpo',  label: 'Fuente de Cuerpo',  default: 'Inter' },
    ],
    tamanos: [],
    radio: { default: '12', min: 0, max: 32 },
  },
};

// Helper: obtiene el schema de un sistema visual
export function obtenerSchema(sistema) {
  return SISTEMAS_VISUALES[sistema] || SISTEMAS_VISUALES.sukidesu;
}

// Helper: lista de sistemas visuales disponibles (para un dropdown)
export function listaSistemas() {
  return Object.entries(SISTEMAS_VISUALES).map(([key, val]) => ({
    key,
    nombre: val.nombre,
    descripcion: val.descripcion,
  }));
}