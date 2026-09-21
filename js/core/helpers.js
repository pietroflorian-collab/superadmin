// ==========================================
// HELPERS
// ==========================================

/**
 * Escapa caracteres peligrosos para prevenir XSS cuando
 * inyectamos datos de Firestore dentro de HTML.
 */
export function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

/**
 * Refresca los iconos de Lucide.
 * Llamar SIEMPRE después de inyectar HTML dinámico.
 */
export function refrescarIconos() {
  if (typeof window.lucide !== 'undefined') {
    window.lucide.createIcons();
  }
}

/**
 * Parsea fecha respetando zona horaria local.
 * Evita el bug de "un día antes" con fechas ISO.
 */
export function parseFechaLocal(fecha) {
  if (!fecha) return null;
  if (typeof fecha === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
    const [y, m, d] = fecha.split('-').map(Number);
    return new Date(y, m - 1, d);
  }
  if (fecha.toDate) return fecha.toDate();
  const dt = new Date(fecha);
  return isNaN(dt.getTime()) ? null : dt;
}

export function formatearFecha(fecha) {
  const d = parseFechaLocal(fecha);
  if (!d) return fecha ? String(fecha) : 'No definida';
  return d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatearFechaHora(ts) {
  if (!ts) return '—';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleString('es-CO', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function sumarDias(fechaISO, dias) {
  const d = parseFechaLocal(fechaISO);
  if (!d) return null;
  const nd = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  nd.setDate(nd.getDate() + dias);
  return nd;
}

export function inicialesCliente(data) {
  const nombre = data.nombreComercial || data.nombreCliente || 'Sin nombre';
  return nombre.substring(0, 2).toUpperCase();
}

export function obtenerRedMeta(tipo, REDES_DISPONIBLES) {
  return REDES_DISPONIBLES.find((r) => r.tipo === tipo) || REDES_DISPONIBLES[0];
}