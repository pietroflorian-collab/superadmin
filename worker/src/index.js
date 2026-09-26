// ==========================================
// SUPERADMIN WORKER — Proxy seguro con Bearer ID Token
// ==========================================

// ---------- CORS ----------
function corsHeaders(env, request) {
  const origin = request?.headers.get("Origin") || "";
  const allowed = (env.ALLOWED_ORIGIN || "").split(",").map((o) => o.trim());
  const allowOrigin = allowed.includes(origin) ? origin : (allowed[0] || "*");
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
  };
}

function jsonResponse(data, status = 200, env, request) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders(env, request) },
  });
}

// ---------- Base64 Unicode-safe ----------
function b64EncodeUnicode(str) {
  const bytes = new TextEncoder().encode(str);
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}

function b64DecodeUnicode(b64) {
  const binary = atob(b64.replace(/\n/g, ""));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

// ==========================================
// VERIFICACIÓN DE ID TOKEN (JWKS)
// ==========================================
let jwksCache = null;

function base64UrlToUint8Array(b64url) {
  const b64 = b64url.replace(/-/g, "+").replace(/_/g, "/")
    .padEnd(b64url.length + (4 - (b64url.length % 4)) % 4, "=");
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function decodeJwtPart(part) {
  const json = new TextDecoder().decode(base64UrlToUint8Array(part));
  return JSON.parse(json);
}

async function getJwks() {
  const now = Date.now();
  if (jwksCache && jwksCache.expiresAt > now) return jwksCache;

  const res = await fetch(
    "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com"
  );
  if (!res.ok) throw new Error(`JWKS fetch falló: ${res.status}`);
  const data = await res.json();

  jwksCache = { keys: data.keys, expiresAt: now + 60 * 60 * 1000 };
  return jwksCache;
}

async function importarClave(jwk) {
  return crypto.subtle.importKey(
    "jwk",
    { kty: jwk.kty, n: jwk.n, e: jwk.e, alg: jwk.alg || "RS256", ext: true },
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["verify"]
  );
}

async function verificarIdToken(idToken, env) {
  try {
    const partes = idToken.split(".");
    if (partes.length !== 3) return { ok: false, error: "JWT mal formado" };

    const header = decodeJwtPart(partes[0]);
    const payload = decodeJwtPart(partes[1]);

    if (header.alg !== "RS256") return { ok: false, error: "Algoritmo no soportado" };

    const projectId = env.FIREBASE_PROJECT_ID;
    if (payload.aud !== projectId) return { ok: false, error: "aud inválido" };
    if (payload.iss !== `https://securetoken.google.com/${projectId}`)
      return { ok: false, error: "iss inválido" };
    if (!payload.exp || payload.exp * 1000 < Date.now())
      return { ok: false, error: "Token expirado" };
    if (payload.sub !== env.ADMIN_UID) return { ok: false, error: "UID no autorizado" };

    const { keys } = await getJwks();
    const jwk = keys.find((k) => k.kid === header.kid);
    if (!jwk) return { ok: false, error: "kid no encontrado" };

    const key = await importarClave(jwk);
    const data = new TextEncoder().encode(`${partes[0]}.${partes[1]}`);
    const firma = base64UrlToUint8Array(partes[2]);

    const valida = await crypto.subtle.verify(
      { name: "RSASSA-PKCS1-v1_5" },
      key,
      firma,
      data
    );

    if (!valida) return { ok: false, error: "Firma inválida" };

    return { ok: true, uid: payload.sub };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

async function verificarAuth(request, env) {
  const auth = request.headers.get("Authorization");
  if (!auth || !auth.startsWith("Bearer ")) {
    return { ok: false, error: "Falta Authorization: Bearer" };
  }
  const idToken = auth.slice(7);
  return verificarIdToken(idToken, env);
}

// ==========================================
// VALIDAR FIREBASE
// ==========================================
async function validarFirebase(request, env) {
  const body = await request.json();
  const { projectId, apiKey } = body;

  if (!projectId || !apiKey) {
    return jsonResponse({ ok: false, error: "Falta projectId o apiKey" }, 400, env, request);
  }

  try {
    const url = `https://www.googleapis.com/identitytoolkit/v3/relyingparty/getProjectConfig?key=${apiKey}`;
    const res = await fetch(url);
    const data = await res.json();

    if (data.projectId) {
      return jsonResponse({ ok: true, mensaje: `API Key válida · ${data.projectId}` }, 200, env, request);
    }

    if (data.error) {
      return jsonResponse({ ok: false, error: data.error.message || "API Key inválida" }, 200, env, request);
    }

    return jsonResponse({ ok: false, error: "Respuesta inesperada de Google" }, 200, env, request);
  } catch (e) {
    return jsonResponse({ ok: false, error: e.message }, 500, env, request);
  }
}

// ==========================================
// VALIDAR CLOUDFLARE
// ==========================================
async function validarCloudflare(request, env) {
  const body = await request.json();
  const { apiToken, zoneId } = body;

  if (!apiToken) {
    return jsonResponse({ ok: false, error: "Falta apiToken" }, 400, env, request);
  }

  try {
    const res = await fetch("https://api.cloudflare.com/client/v4/user/tokens/verify", {
      headers: {
        Authorization: `Bearer ${apiToken}`,
        "Content-Type": "application/json",
      },
    });
    const data = await res.json();

    if (!data.success || data.result?.status !== "active") {
      return jsonResponse({ ok: false, error: "Token inválido o inactivo" }, 200, env, request);
    }

    if (zoneId) {
      const zRes = await fetch(`https://api.cloudflare.com/client/v4/zones/${zoneId}`, {
        headers: { Authorization: `Bearer ${apiToken}` },
      });
      const zData = await zRes.json();
      if (!zData.success) {
        return jsonResponse({
          ok: true,
          mensaje: `Token activo, pero zoneId "${zoneId}" inaccesible`,
        }, 200, env, request);
      }
      return jsonResponse({
        ok: true,
        mensaje: `Token activo · zona: ${zData.result.name}`,
      }, 200, env, request);
    }

    return jsonResponse({ ok: true, mensaje: "Token activo" }, 200, env, request);
  } catch (e) {
    return jsonResponse({ ok: false, error: e.message }, 500, env, request);
  }
}

// ==========================================
// PUBLICAR APARIENCIA EN GITHUB
// ==========================================
async function publicarEnGitHub(request, env) {
  const body = await request.json();
  const { repo, branch, path, token, apariencia } = body;

  if (!repo || !token) {
    return jsonResponse({ ok: false, error: "Falta repo o token" }, 400, env, request);
  }

  const [owner, repoName] = repo.split("/");
  if (!owner || !repoName) {
    return jsonResponse({ ok: false, error: "Formato de repo inválido. Usa owner/repo" }, 400, env, request);
  }

  const ghHeaders = {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "User-Agent": "superadmin-worker",
    "Content-Type": "application/json",
  };

  const apiUrl = `https://api.github.com/repos/${owner}/${repoName}/contents/${path}`;

  try {
    const getRes = await fetch(`${apiUrl}?ref=${branch || "main"}`, { headers: ghHeaders });

    let menuActual = {};
    let sha = null;

    if (getRes.status === 200) {
      const fileData = await getRes.json();
      sha = fileData.sha;
      const contenido = b64DecodeUnicode(fileData.content);
      try {
        menuActual = JSON.parse(contenido);
      } catch {
        menuActual = {};
      }
    } else if (getRes.status !== 404) {
      const err = await getRes.text();
      return jsonResponse({ ok: false, error: `GitHub GET ${getRes.status}: ${err}` }, 200, env, request);
    }

    menuActual.tema = {
      colorPrimario: apariencia.colorPrimario || "#18181b",
      tipografia: apariencia.tipografia || "Inter",
      radioBordes: apariencia.radioBordes || "8",
    };

    const nuevoContenido = b64EncodeUnicode(JSON.stringify(menuActual, null, 2));

    const putBody = {
      message: `[Auto] Actualizar tema ${new Date().toISOString()}`,
      content: nuevoContenido,
      branch: branch || "main",
    };
    if (sha) putBody.sha = sha;

    const putRes = await fetch(apiUrl, {
      method: "PUT",
      headers: ghHeaders,
      body: JSON.stringify(putBody),
    });

    if (!putRes.ok) {
      const err = await putRes.text();
      return jsonResponse({ ok: false, error: `GitHub PUT ${putRes.status}: ${err}` }, 200, env, request);
    }

    const putData = await putRes.json();
    return jsonResponse({
      ok: true,
      mensaje: "Publicado correctamente",
      commit: putData.commit?.sha || null,
      url: putData.commit?.html_url || null,
    }, 200, env, request);
  } catch (e) {
    return jsonResponse({ ok: false, error: e.message }, 500, env, request);
  }
}

// ==========================================
// ENTRY POINT
// ==========================================
export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders(env, request) });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    if (path === "/health") {
      return jsonResponse({ status: "ok", service: "superadmin-worker" }, 200, env, request);
    }

    if (request.method !== "POST") {
      return jsonResponse({ ok: false, error: "Método no permitido" }, 405, env, request);
    }

    const auth = await verificarAuth(request, env);
    if (!auth.ok) {
      return jsonResponse({ ok: false, error: `No autorizado: ${auth.error}` }, 401, env, request);
    }

    if (path === "/validar/firebase") return validarFirebase(request, env);
    if (path === "/validar/cloudflare") return validarCloudflare(request, env);
    if (path === "/publicar") return publicarEnGitHub(request, env);

    return jsonResponse({ ok: false, error: "Ruta no encontrada" }, 404, env, request);
  },
};