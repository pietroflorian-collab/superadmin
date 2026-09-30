// ==========================================
// MÓDULO: BACKUP — Descarga completa de Firestore como JSON
// ==========================================
import { db } from '../config/firebase.js';
import { collection, getDocs, doc, getDoc } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";
import { getState } from '../core/state.js';
import { toast } from '../ui/notificaciones.js';

// Colecciones raíz que SIEMPRE se intentan
const COLECCIONES_RAIZ_BASE = ['clientes_agencia'];

// Colecciones raíz solo para admin
const COLECCIONES_RAIZ_ADMIN = ['usuarios'];

const SUBCOLECCIONES_CLIENTE = ['secretos'];

// ---------- Helper: ¿puede leer todo? ----------
function esAdmin() {
  return (getState().rolActual || '') === 'admin';
}

// ---------- Abrir modal ----------
export async function abrirModalBackup() {
  const modal = document.getElementById('modal-backup');
  if (!modal) return;

  // Resetear
  const radioTodos = modal.querySelector('input[name="backup-alcance"][value="todos"]');
  if (radioTodos) radioTodos.checked = true;
  document.getElementById('backup-cliente-selector').classList.add('hidden');

  // Poblar selector de clientes
  await poblarSelectorClientes();

  // Escuchar cambios en los radios
  modal.querySelectorAll('input[name="backup-alcance"]').forEach(radio => {
    radio.onchange = (e) => {
      const selector = document.getElementById('backup-cliente-selector');
      if (e.target.value === 'cliente') selector.classList.remove('hidden');
      else selector.classList.add('hidden');
    };
  });

  modal.classList.remove('hidden');
  if (window.lucide) window.lucide.createIcons();
}

async function poblarSelectorClientes() {
  const select = document.getElementById('backup-cliente-id');
  if (!select) return;

  let clientes = getState().clientes || [];

  if (clientes.length === 0) {
    try {
      const snap = await getDocs(collection(db, 'clientes_agencia'));
      clientes = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (e) {
      console.error('Error al cargar clientes para selector:', e);
    }
  }

  select.innerHTML = clientes
    .map(c => `<option value="${c.id}">${c.nombreComercial || c.nombreCliente || c.id}</option>`)
    .join('');
}

// ---------- Cerrar modal ----------
export function cerrarModalBackup() {
  const modal = document.getElementById('modal-backup');
  if (modal) modal.classList.add('hidden');
}

// ---------- Ejecutar backup ----------
export async function ejecutarBackup() {
  const modal = document.getElementById('modal-backup');
  const alcance = modal?.querySelector('input[name="backup-alcance"]:checked')?.value || 'todos';
  const clienteId = document.getElementById('backup-cliente-id')?.value;

  const btn = document.getElementById('btn-ejecutar-backup');
  const textoOrig = btn?.innerHTML;

  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<span class="animate-pulse">Generando...</span>';
  }

  try {
    const backup = {
      metadata: {
        fecha: new Date().toISOString(),
        version: 1,
        proyecto: 'cuentas-cop',
        alcance: alcance === 'cliente' ? `cliente:${clienteId}` : 'todos'
      },
      colecciones: {}
    };

    // ============ TODOS ============
    if (alcance === 'todos') {
      // Determinar qué colecciones raíz incluir según rol
      const colecciones = [...COLECCIONES_RAIZ_BASE];
      if (esAdmin()) {
        colecciones.push(...COLECCIONES_RAIZ_ADMIN);
      } else {
        backup.metadata.aviso = 'Backup parcial: usuarios omitidos (solo admin).';
      }

      for (const nombreCol of colecciones) {
        try {
          backup.colecciones[nombreCol] = {};
          const snap = await getDocs(collection(db, nombreCol));

          for (const docSnap of snap.docs) {
            const docBackup = { ...docSnap.data() };

            if (nombreCol === 'clientes_agencia') {
              docBackup._subcolecciones = {};
              for (const subCol of SUBCOLECCIONES_CLIENTE) {
                try {
                  const subSnap = await getDocs(collection(db, nombreCol, docSnap.id, subCol));
                  if (!subSnap.empty) {
                    docBackup._subcolecciones[subCol] = {};
                    subSnap.forEach(subDoc => {
                      docBackup._subcolecciones[subCol][subDoc.id] = subDoc.data();
                    });
                  }
                } catch (eSub) {
                  // Si el rol no puede leer secretos, lo saltamos sin morir
                  console.warn(`No se pudo leer subcolección ${subCol} de ${docSnap.id}:`, eSub?.code || eSub);
                }
              }
            }

            backup.colecciones[nombreCol][docSnap.id] = docBackup;
          }
        } catch (eCol) {
          // Si una colección falla, la saltamos y seguimos
          console.warn(`No se pudo leer la colección ${nombreCol}:`, eCol?.code || eCol);
          backup.colecciones[nombreCol] = { _error: eCol?.code || String(eCol) };
        }
      }
    }

    // ============ UN CLIENTE ============
    else if (alcance === 'cliente' && clienteId) {
      backup.colecciones.clientes_agencia = {};

      const docSnap = await getDoc(doc(db, 'clientes_agencia', clienteId));
      if (docSnap.exists()) {
        const docBackup = { ...docSnap.data() };
        docBackup._subcolecciones = {};

        for (const subCol of SUBCOLECCIONES_CLIENTE) {
          try {
            const subSnap = await getDocs(collection(db, 'clientes_agencia', clienteId, subCol));
            if (!subSnap.empty) {
              docBackup._subcolecciones[subCol] = {};
              subSnap.forEach(subDoc => {
                docBackup._subcolecciones[subCol][subDoc.id] = subDoc.data();
              });
            }
          } catch (eSub) {
            console.warn(`No se pudo leer subcolección ${subCol}:`, eSub?.code || eSub);
          }
        }

        backup.colecciones.clientes_agencia[clienteId] = docBackup;
      }
    }

    // ============ Descargar ============
    const json = JSON.stringify(backup, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const ahora = new Date();
    const fecha = ahora.toISOString().slice(0, 10).replace(/-/g, '');
    const hora = ahora.toTimeString().slice(0, 5).replace(':', '');

    const sufijo = alcance === 'cliente' ? `-${clienteId.substring(0, 8)}` : '';
    const nombreArchivo = `backup-cuentas-cop${sufijo}-${fecha}-${hora}.json`;

    const a = document.createElement('a');
    a.href = url;
    a.download = nombreArchivo;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);

    toast('Backup descargado correctamente.', 'exito');
    cerrarModalBackup();
  } catch (e) {
    console.error('Error al generar backup:', e);
    toast('Error al generar el backup.', 'error');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = textoOrig;
    }
  }
}