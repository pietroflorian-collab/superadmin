// ==========================================
// CONSTANTES GLOBALES
// ==========================================
export const DIAS_PRORROGA = 5;

export const TIPOS_DOC_NATURAL = ['CC', 'Pasaporte', 'PPT', 'Otro'];
export const TIPOS_DOC_JURIDICA = ['NIT'];

export const REDES_DISPONIBLES = [
  { tipo: 'instagram', label: 'Instagram', icon: 'camera', placeholder: '@usuario',
    regex: /^@[a-zA-Z0-9._]{1,30}$/, urlFn: (v) => `https://instagram.com/${v.slice(1)}` },
  { tipo: 'facebook', label: 'Facebook', icon: 'users', placeholder: '@pagina',
    regex: /^@[a-zA-Z0-9.]{5,50}$/, urlFn: (v) => `https://facebook.com/${v.slice(1)}` },
  { tipo: 'whatsapp', label: 'WhatsApp', icon: 'message-circle', placeholder: '+573001234567',
    regex: /^\+[1-9]\d{7,14}$/, urlFn: (v) => `https://wa.me/${v.replace('+', '')}` },
  { tipo: 'tiktok', label: 'TikTok', icon: 'music-2', placeholder: '@usuario',
    regex: /^@[a-zA-Z0-9._]{1,24}$/, urlFn: (v) => `https://tiktok.com/@${v.slice(1)}` },
  { tipo: 'youtube', label: 'YouTube', icon: 'play-circle', placeholder: '@canal',
    regex: /^@[a-zA-Z0-9._-]{3,30}$/, urlFn: (v) => `https://youtube.com/@${v.slice(1)}` },
  { tipo: 'twitter', label: 'X / Twitter', icon: 'at-sign', placeholder: '@usuario',
    regex: /^@[a-zA-Z0-9_]{1,15}$/, urlFn: (v) => `https://x.com/${v.slice(1)}` },
  { tipo: 'dominio', label: 'Dominio', icon: 'globe', placeholder: 'https://midominio.com',
    regex: /^https?:\/\/.+\..+/, urlFn: (v) => v }
];

export const REDES_OBLIGATORIAS = ['instagram', 'facebook', 'whatsapp', 'dominio'];

// ---------- WORKER ----------
export const WORKER_URL = "https://superadmin-worker.pietro-florian.workers.dev";
