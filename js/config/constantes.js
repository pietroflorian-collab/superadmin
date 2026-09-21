// ==========================================
// CONSTANTES GLOBALES
// ==========================================
export const DIAS_PRORROGA = 5;

export const TIPOS_DOC_NATURAL = ['CC', 'Pasaporte', 'PPT', 'Otro'];
export const TIPOS_DOC_JURIDICA = ['NIT'];

export const REDES_DISPONIBLES = [
  { tipo: 'instagram', label: 'Instagram', icon: 'instagram', placeholder: '@usuario',
    regex: /^@[a-zA-Z0-9._]{1,30}$/, urlFn: (v) => `https://instagram.com/${v.slice(1)}` },
  { tipo: 'facebook', label: 'Facebook', icon: 'facebook', placeholder: '@pagina',
    regex: /^@[a-zA-Z0-9.]{5,50}$/, urlFn: (v) => `https://facebook.com/${v.slice(1)}` },
  { tipo: 'whatsapp', label: 'WhatsApp', icon: 'message-circle', placeholder: '+573001234567',
    regex: /^\+[1-9]\d{7,14}$/, urlFn: (v) => `https://wa.me/${v.replace('+', '')}` },
  { tipo: 'tiktok', label: 'TikTok', icon: 'music-2', placeholder: '@usuario',
    regex: /^@[a-zA-Z0-9._]{1,24}$/, urlFn: (v) => `https://tiktok.com/@${v.slice(1)}` },
  { tipo: 'youtube', label: 'YouTube', icon: 'youtube', placeholder: '@canal',
    regex: /^@[a-zA-Z0-9._-]{3,30}$/, urlFn: (v) => `https://youtube.com/@${v.slice(1)}` },
  { tipo: 'twitter', label: 'X / Twitter', icon: 'twitter', placeholder: '@usuario',
    regex: /^@[a-zA-Z0-9_]{1,15}$/, urlFn: (v) => `https://x.com/${v.slice(1)}` },
  { tipo: 'dominio', label: 'Dominio', icon: 'globe', placeholder: 'https://midominio.com',
    regex: /^https?:\/\/.+\..+/, urlFn: (v) => v }
];

export const REDES_OBLIGATORIAS = ['instagram', 'facebook', 'whatsapp', 'dominio'];

// ---------- WORKER ----------
export const WORKER_URL = "https://superadmin-worker.pietro-florian.workers.dev";
export const WORKER_API_KEY = "fcbae6510b63021691be5eb7ce4ad4c10cfeec6181fb8892b25a8ba7a85526c3";