import { renderPage } from "./page.js";

const BASE = "/p";
const SITE_ORIGIN = "https://smti.uk";

const SCHEMA = `CREATE TABLE IF NOT EXISTS p_links (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  url TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  icon TEXT DEFAULT '',
  sort INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
)`;

let schemaReady = false;
async function ensureSchema(env) {
  if (schemaReady) return;
  await env.DB.prepare(SCHEMA).run();
  schemaReady = true;
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });
}

function safeEqual(a, b) {
  a = String(a ?? "");
  b = String(b ?? "");
  let diff = a.length ^ b.length;
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  }
  return diff === 0;
}

function isAdmin(request, env) {
  const pass = env.ADMIN_PASSWORD || "1631";
  return safeEqual(request.headers.get("x-password"), pass);
}

// Accepts "zmanim", "/zmanim", "smti.uk/zmanim", "sub.smti.uk" or any full URL.
function normalizeUrl(input) {
  let s = String(input || "").trim();
  if (!s) return null;
  if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(s)) {
    if (s.startsWith("/")) s = SITE_ORIGIN + s;
    else if (/^[^\s/]+\.[a-z]{2,}(\/|$)/i.test(s)) s = "https://" + s;
    else s = SITE_ORIGIN + "/" + s;
  }
  try {
    const u = new URL(s);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    return u.toString();
  } catch {
    return null;
  }
}

function decodeEntities(str) {
  return String(str || "")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function attr(tag, name) {
  const m = tag.match(new RegExp(`\\b${name}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s>]+))`, "i"));
  return m ? (m[2] ?? m[3] ?? m[4] ?? "") : null;
}

function fallbackTitle(url) {
  const u = new URL(url);
  const seg = u.pathname.split("/").filter(Boolean).pop();
  return decodeURIComponent(seg || u.hostname.replace(/^www\./, ""));
}

async function fetchMeta(url) {
  const meta = { url, title: fallbackTitle(url), description: "", icon: "" };
  try {
    const res = await fetch(url, {
      redirect: "follow",
      headers: { "user-agent": "Mozilla/5.0 (compatible; smt-p link preview)", accept: "text/html,*/*" },
      cf: { cacheTtl: 0 },
    });
    if (!res.ok) return meta;
    const finalUrl = res.url || url;
    const type = res.headers.get("content-type") || "";
    if (!type.includes("html")) return meta;

    // Read at most ~300KB of the page.
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let html = "";
    while (html.length < 300000) {
      const { value, done } = await reader.read();
      if (done) break;
      html += decoder.decode(value, { stream: true });
      if (/<\/head>/i.test(html)) break;
    }
    reader.cancel().catch(() => {});

    const metas = {};
    for (const tag of html.match(/<meta\b[^>]*>/gi) || []) {
      const key = (attr(tag, "property") || attr(tag, "name") || "").toLowerCase();
      const content = attr(tag, "content");
      if (key && content != null && !(key in metas)) metas[key] = decodeEntities(content);
    }
    const titleTag = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    const title = metas["og:title"] || metas["twitter:title"] || (titleTag && decodeEntities(titleTag[1]));
    if (title) meta.title = title.slice(0, 120);
    const desc = metas["description"] || metas["og:description"] || metas["twitter:description"];
    if (desc) meta.description = desc.slice(0, 300);

    let icon = "";
    const links = html.match(/<link\b[^>]*>/gi) || [];
    const pick = (re) => links.find((l) => re.test(attr(l, "rel") || ""));
    const iconTag = pick(/apple-touch-icon/i) || pick(/(^|\s)icon(\s|$)/i) || pick(/shortcut icon/i);
    if (iconTag) icon = attr(iconTag, "href") || "";
    if (!icon) icon = metas["og:image"] || "";
    if (icon.startsWith("data:") && !/^data:image\//i.test(icon)) icon = "";
    if (icon && !icon.startsWith("data:")) {
      try { icon = new URL(icon, finalUrl).toString(); } catch { icon = ""; }
    }
    meta.icon = icon.length <= 20000 ? icon : "";
  } catch {
    // Keep the fallback values.
  }
  return meta;
}

function cleanLink(body) {
  const url = normalizeUrl(body?.url);
  if (!url) return null;
  const title = String(body.title || "").trim().slice(0, 120) || fallbackTitle(url);
  const description = String(body.description || "").trim().slice(0, 300);
  let icon = String(body.icon || "").trim();
  if (icon.length > 20000 || (icon && !/^(https?:|data:image\/)/i.test(icon))) icon = "";
  return { url, title, description, icon };
}

async function handleApi(request, env, path) {
  await ensureSchema(env);
  const method = request.method;

  if (path === "/api/links" && method === "GET") {
    const { results } = await env.DB.prepare(
      "SELECT id, url, title, description, icon FROM p_links ORDER BY sort ASC, id ASC"
    ).all();
    return json(results || []);
  }

  if (path === "/api/login" && method === "POST") {
    return isAdmin(request, env) ? json({ ok: true }) : json({ error: "סיסמא שגויה" }, 401);
  }

  if (!isAdmin(request, env)) return json({ error: "סיסמא שגויה" }, 401);

  if (path === "/api/meta" && method === "GET") {
    const url = normalizeUrl(new URL(request.url).searchParams.get("url"));
    if (!url) return json({ error: "כתובת לא תקינה" }, 400);
    return json(await fetchMeta(url));
  }

  if (path === "/api/links" && method === "POST") {
    let body;
    try { body = await request.json(); } catch { return json({ error: "בקשה לא תקינה" }, 400); }
    const clean = cleanLink(body);
    if (!clean) return json({ error: "כתובת לא תקינה" }, 400);
    const { url, title, description, icon } = clean;
    const max = await env.DB.prepare("SELECT COALESCE(MAX(sort), 0) AS m FROM p_links").first();
    const row = await env.DB.prepare(
      "INSERT INTO p_links (url, title, description, icon, sort) VALUES (?, ?, ?, ?, ?) RETURNING id, url, title, description, icon"
    ).bind(url, title, description, icon, (max?.m || 0) + 1).first();
    return json(row, 201);
  }

  const del = path.match(/^\/api\/links\/(\d+)$/);
  if (del && method === "PUT") {
    let body;
    try { body = await request.json(); } catch { return json({ error: "בקשה לא תקינה" }, 400); }
    const clean = cleanLink(body);
    if (!clean) return json({ error: "כתובת לא תקינה" }, 400);
    const row = await env.DB.prepare(
      "UPDATE p_links SET url = ?, title = ?, description = ?, icon = ? WHERE id = ? RETURNING id, url, title, description, icon"
    ).bind(clean.url, clean.title, clean.description, clean.icon, +del[1]).first();
    return row ? json(row) : json({ error: "לא נמצא" }, 404);
  }
  if (del && method === "DELETE") {
    await env.DB.prepare("DELETE FROM p_links WHERE id = ?").bind(+del[1]).run();
    return json({ ok: true });
  }

  return json({ error: "לא נמצא" }, 404);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    let path = url.pathname;
    if (path === BASE || path.startsWith(BASE + "/")) path = path.slice(BASE.length) || "/";

    try {
      if (path.startsWith("/api/")) return await handleApi(request, env, path);
    } catch (err) {
      return json({ error: "שגיאת שרת", detail: String(err?.message || err) }, 500);
    }

    if (request.method === "GET" && (path === "/" || path === "")) {
      // Canonical address is /p/ so relative links resolve correctly.
      if (url.pathname === BASE) return Response.redirect(url.origin + BASE + "/", 301);
      return new Response(renderPage(), {
        headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-cache" },
      });
    }

    return new Response("Not found", { status: 404 });
  },
};
