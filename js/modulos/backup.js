// ==========================================
// MÓDULO: BACKUP — Descarga completa de Firestore como JSON
// ==========================================
import { db } from '../config/firebase.js';
import { collection, getDocs, doc, getDoc } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";
import { getState } from '../core/state.js';
import { toast } from '../ui/notificaciones.js';

const COLECCIONES_RAIZ = ['clientes_agencia', 'admins', 'usuarios'];
const SUBCOLECCIONES_CLIENTE = ['secretos'];

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

  // Primero intentar desde el state
  let clientes = getState().clientes || [];

  // Si no hay en el state, traer de Firestore
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
      for (const nombreCol of COLECCIONES_RAIZ) {
        backup.colecciones[nombreCol] = {};
        const snap = await getDocs(collection(db, nombreCol));

        for (const docSnap of snap.docs) {
          const docBackup = { ...docSnap.data() };

          if (nombreCol === 'clientes_agencia') {
            docBackup._subcolecciones = {};
            for (const subCol of SUBCOLECCIONES_CLIENTE) {
              const subSnap = await getDocs(collection(db, nombreCol, docSnap.id, subCol));
              if (!subSnap.empty) {
                docBackup._subcolecciones[subCol] = {};
                subSnap.forEach(subDoc => {
                  docBackup._subcolecciones[subCol][subDoc.id] = subDoc.data();
                });
              }
            }
          }

          backup.colecciones[nombreCol][docSnap.id] = docBackup;
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
          const subSnap = await getDocs(collection(db, 'clientes_agencia', clienteId, subCol));
          if (!subSnap.empty) {
            docBackup._subcolecciones[subCol] = {};
            subSnap.forEach(subDoc => {
              docBackup._subcolecciones[subCol][subDoc.id] = subDoc.data();
            });
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