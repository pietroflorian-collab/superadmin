// ==========================================
// SUPERADMIN WORKER — Proxy seguro para:
//   - Validar Firebase (evita CORS)
//   - Validar Cloudflare (evita CORS)
//   - Publicar apariencia en GitHub (push real)
// ==========================================

// ---------- CORS ----------
function corsHeaders(env) {
  return {
    "Access-Control-Allow-Origin": env.ALLOWED_ORIGIN || "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-API-Key",
    "Access-Control-Max-Age": "86400",
  };
}

function jsonResponse(data, status = 200, env) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders(env) },
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

// ---------- Auth: API Key simple ----------
function verificarApiKey(request, env) {
  const apiKey = request.headers.get("X-API-Key");
  if (!apiKey || apiKey !== env.API_KEY) return false;
  return true;
}

// ==========================================
// VALIDAR FIREBASE
// ==========================================
async function validarFirebase(request, env) {
  const body = await request.json();
  const { projectId, apiKey } = body;

  if (!projectId || !apiKey) {
    return jsonResponse({ ok: false, error: "Falta projectId o apiKey" }, 400, env);
  }

  try {
    const url = `https://www.googleapis.com/identitytoolkit/v3/relyingparty/getProjectConfig?key=${apiKey}`;
    const res = await fetch(url);
    const data = await res.json();

    // Si devuelve projectId, la key es válida
    if (data.projectId) {
      return jsonResponse({ ok: true, mensaje: `API Key válida · ${data.projectId}` }, 200, env);
    }

    // Si devuelve error de key inválida
    if (data.error) {
      return jsonResponse({ ok: false, error: data.error.message || "API Key inválida" }, 200, env);
    }

    return jsonResponse({ ok: false, error: "Respuesta inesperada de Google" }, 200, env);
  } catch (e) {
    return jsonResponse({ ok: false, error: e.message }, 500, env);
  }
}

// ==========================================
// VALIDAR CLOUDFLARE
// ==========================================
async function validarCloudflare(request, env) {
  const body = await request.json();
  const { apiToken, zoneId } = body;

  if (!apiToken) {
    return jsonResponse({ ok: false, error: "Falta apiToken" }, 400, env);
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
      return jsonResponse({ ok: false, error: "Token inválido o inactivo" }, 200, env);
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
        }, 200, env);
      }
      return jsonResponse({
        ok: true,
        mensaje: `Token activo · zona: ${zData.result.name}`,
      }, 200, env);
    }

    return jsonResponse({ ok: true, mensaje: "Token activo" }, 200, env);
  } catch (e) {
    return jsonResponse({ ok: false, error: e.message }, 500, env);
  }
}

// ==========================================
// PUBLICAR APARIENCIA EN GITHUB
// ==========================================
async function publicarEnGitHub(request, env) {
  const body = await request.json();
  const { repo, branch, path, token, apariencia } = body;

  if (!repo || !token) {
    return jsonResponse({ ok: false, error: "Falta repo o token" }, 400, env);
  }

  const [owner, repoName] = repo.split("/");
  if (!owner || !repoName) {
    return jsonResponse({ ok: false, error: "Formato de repo inválido. Usa owner/repo" }, 400, env);
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
      return jsonResponse({ ok: false, error: `GitHub GET ${getRes.status}: ${err}` }, 200, env);
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
      return jsonResponse({ ok: false, error: `GitHub PUT ${putRes.status}: ${err}` }, 200, env);
    }

    const putData = await putRes.json();
    return jsonResponse({
      ok: true,
      mensaje: "Publicado correctamente",
      commit: putData.commit?.sha || null,
      url: putData.commit?.html_url || null,
    }, 200, env);
  } catch (e) {
    return jsonResponse({ ok: false, error: e.message }, 500, env);
  }
}

// ==========================================
// ENTRY POINT
// ==========================================
export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders(env) });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    if (path === "/health") {
      return jsonResponse({ status: "ok", service: "superadmin-worker" }, 200, env);
    }

    if (!verificarApiKey(request, env)) {
      return jsonResponse({ ok: false, error: "No autorizado" }, 401, env);
    }

    if (request.method !== "POST") {
      return jsonResponse({ ok: false, error: "Método no permitido" }, 405, env);
    }

    if (path === "/validar/firebase") return validarFirebase(request, env);
    if (path === "/validar/cloudflare") return validarCloudflare(request, env);
    if (path === "/publicar") return publicarEnGitHub(request, env);

    return jsonResponse({ ok: false, error: "Ruta no encontrada" }, 404, env);
  },
};