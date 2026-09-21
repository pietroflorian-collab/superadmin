// ==========================================
// ESTADO DE VENCIMIENTO — Lógica de negocio
// ==========================================
import { DIAS_PRORROGA } from '../config/constantes.js';
import { parseFechaLocal, sumarDias } from './helpers.js';

export function estadoVencimiento(data) {
  const estadoServicio = data.estadoServicio || 'Activo';
  if (estadoServicio === 'Suspendido') return { color: '#71717a', label: 'Suspendido', nivel: 'gris' };

  const fv = data.fechaVencimiento;
  if (!fv) return { color: '#71717a', label: 'Sin fecha', nivel: 'gris' };

  const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
  const venc = parseFechaLocal(fv);
  if (!venc) return { color: '#71717a', label: 'Sin fecha', nivel: 'gris' };
  venc.setHours(0, 0, 0, 0);

  const prorroga = sumarDias(fv, DIAS_PRORROGA);
  if (!prorroga) return { color: '#71717a', label: 'Sin fecha', nivel: 'gris' };
  prorroga.setHours(0, 0, 0, 0);

  const diffDias = Math.floor((venc - hoy) / 86400000);
  const diffProrroga = Math.floor((prorroga - hoy) / 86400000);

  if (diffDias > 15) return { color: '#10b981', label: 'Activo', nivel: 'verde' };
  if (diffDias >= 0) return { color: '#f59e0b', label: 'Por vencer', nivel: 'amarillo' };
  if (diffProrroga >= 0) return { color: '#ef4444', label: 'En prórroga', nivel: 'rojo' };
  return { color: '#71717a', label: 'Prórroga vencida', nivel: 'gris' };
}