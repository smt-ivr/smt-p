import { renderPage } from "./page.js";

const BASE = "/apk";
const CHUNK = 60_000; // characters of base64 per D1 row (D1 statements are limited to ~100KB)
const MAX_SITES = 30;
const MAX_EXTRA = 30;
const MAX_ICON_B64 = 400_000;
const PER_IP_PER_HOUR = 6;
const PER_DAY = 60;
const KEEP_DAYS = 7;
const BUILD_TIMEOUT_MS = 20 * 60 * 1000;

const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS apk_jobs (
    id TEXT PRIMARY KEY,
    status TEXT NOT NULL,
    error TEXT DEFAULT '',
    app_name TEXT NOT NULL,
    app_id TEXT NOT NULL,
    version_code INTEGER NOT NULL DEFAULT 1,
    config TEXT NOT NULL,
    icon TEXT DEFAULT '',
    ip TEXT DEFAULT '',
    apk_size INTEGER DEFAULT 0,
    chunks INTEGER DEFAULT 0,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS apk_jobs_created ON apk_jobs(created_at)`,
  `CREATE TABLE IF NOT EXISTS apk_chunks (
    job_id TEXT NOT NULL,
    idx INTEGER NOT NULL,
    data TEXT NOT NULL,
    PRIMARY KEY (job_id, idx)
  )`,
  `CREATE TABLE IF NOT EXISTS apk_meta (k TEXT PRIMARY KEY, v TEXT NOT NULL)`,
];

let schemaReady = false;
async function ensureSchema(env) {
  if (schemaReady) return;
  await env.DB.batch(SCHEMA.map((s) => env.DB.prepare(s)));
  schemaReady = true;
}

// ---------------------------------------------------------------- helpers

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });
}
const fail = (message, status = 400) => json({ ok: false, error: message }, status);

function safeEqual(a, b) {
  a = String(a ?? "");
  b = String(b ?? "");
  let diff = a.length ^ b.length;
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  }
  return diff === 0;
}

function isBuilder(request, env) {
  const auth = request.headers.get("authorization") || "";
  return !!env.BUILD_SECRET && safeEqual(auth, "Bearer " + env.BUILD_SECRET);
}

async function sha256Hex(text) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function randomHex(bytes) {
  const a = new Uint8Array(bytes);
  crypto.getRandomValues(a);
  return [...a].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** "example.com", "www.example.com/x" or a full URL -> normalized https URL, or null. */
function normalizeUrl(input) {
  let s = String(input || "").trim();
  if (!s) return null;
  if (!/^https?:\/\//i.test(s)) s = "https://" + s;
  try {
    const u = new URL(s);
    if (!/^https?:$/.test(u.protocol)) return null;
    if (!/^([a-z0-9-]+\.)+[a-z0-9-]{2,}$/i.test(u.hostname)) return null;
    if (u.username || u.password) return null;
    return u.toString();
  } catch {
    return null;
  }
}

function cleanText(s, max) {
  return String(s ?? "")
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .trim()
    .slice(0, max);
}

function base64ToBytes(b64) {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function bytesToBase64(bytes) {
  let bin = "";
  for (let i = 0; i < bytes.length; i += 0x8000) {
    bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  }
  return btoa(bin);
}

// ---------------------------------------------------------------- API: create a build

async function createBuild(request, env) {
  if (!env.GH_TOKEN || !env.BUILD_SECRET) {
    return fail("השרת עדיין לא הוגדר (חסרים GH_TOKEN או BUILD_SECRET).", 500);
  }
  let body;
  try {
    body = await request.json();
  } catch {
    return fail("בקשה לא תקינה");
  }

  const appName = cleanText(body.appName, 40);
  if (!appName) return fail("נא להזין שם לאפליקציה");

  const sites = [];
  for (const s of Array.isArray(body.sites) ? body.sites.slice(0, MAX_SITES) : []) {
    const raw = cleanText(s?.url, 500);
    if (!raw) continue;
    const url = normalizeUrl(raw);
    if (!url) return fail(`הכתובת "${raw}" לא תקינה`);
    const title = cleanText(s?.title, 40) || new URL(url).hostname;
    sites.push({ title, url, restrictPath: !!s?.restrictPath });
  }
  if (!sites.length) return fail("נא להזין לפחות כתובת אתר אחת");

  const extraDomains = [];
  for (const d of Array.isArray(body.extraDomains) ? body.extraDomains.slice(0, MAX_EXTRA) : []) {
    const raw = cleanText(d, 300);
    if (!raw) continue;
    if (!normalizeUrl(raw)) return fail(`הכתובת הנוספת "${raw}" לא תקינה`);
    extraDomains.push(raw.replace(/^https?:\/\//i, ""));
  }

  const pin = String(body.pin ?? "").trim();
  if (pin && !/^\d{4,8}$/.test(pin)) return fail("הקוד צריך להיות 4 עד 8 ספרות");
  const pinSalt = pin ? randomHex(16) : "";
  const pinHash = pin ? await sha256Hex(pinSalt + pin) : "";

  const orientation = ["auto", "portrait", "landscape"].includes(body.orientation) ? body.orientation : "auto";

  let icon = "";
  if (body.icon) {
    const m = /^data:image\/png;base64,([A-Za-z0-9+/=]+)$/.exec(String(body.icon));
    if (!m) return fail("הסמל צריך להיות תמונת PNG");
    if (m[1].length > MAX_ICON_B64) return fail("הסמל גדול מדי");
    icon = m[1];
  }

  // Same name + first site -> same package, so a new build installs as an update.
  const firstHost = new URL(sites[0].url).hostname.replace(/^www\./, "");
  const appId = "uk.smti.app.a" + (await sha256Hex(firstHost + "|" + appName)).slice(0, 12);

  const config = { sites, extraDomains, orientation, pinSalt, pinHash };

  await ensureSchema(env);
  const now = Date.now();
  const ip = request.headers.get("cf-connecting-ip") || "";

  // Housekeeping and limits.
  const old = now - KEEP_DAYS * 86400_000;
  await env.DB.batch([
    env.DB.prepare(`DELETE FROM apk_chunks WHERE job_id IN (SELECT id FROM apk_jobs WHERE created_at < ?)`).bind(old),
    env.DB.prepare(`DELETE FROM apk_jobs WHERE created_at < ?`).bind(old),
  ]);
  const counts = await env.DB.prepare(
    `SELECT
       SUM(CASE WHEN ip = ? AND created_at > ? THEN 1 ELSE 0 END) AS mine,
       SUM(CASE WHEN created_at > ? THEN 1 ELSE 0 END) AS day
     FROM apk_jobs`
  ).bind(ip, now - 3600_000, now - 86400_000).first();
  if ((counts?.mine || 0) >= PER_IP_PER_HOUR) return fail("יותר מדי בקשות. נסה שוב בעוד שעה.", 429);
  if ((counts?.day || 0) >= PER_DAY) return fail("הגענו למכסה היומית. נסה שוב מחר.", 429);

  const prev = await env.DB.prepare(`SELECT MAX(version_code) AS v FROM apk_jobs WHERE app_id = ? AND status = 'done'`).bind(appId).first();
  const versionCode = (prev?.v || 0) + 1;

  const id = randomHex(12);
  await env.DB.prepare(
    `INSERT INTO apk_jobs (id, status, app_name, app_id, version_code, config, icon, ip, created_at, updated_at)
     VALUES (?, 'queued', ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(id, appName, appId, versionCode, JSON.stringify(config), icon, ip, now, now).run();

  const gh = await fetch(
    `https://api.github.com/repos/${env.GH_REPO}/actions/workflows/${env.GH_WORKFLOW || "build-apk.yml"}/dispatches`,
    {
      method: "POST",
      headers: {
        authorization: "Bearer " + env.GH_TOKEN,
        accept: "application/vnd.github+json",
        "x-github-api-version": "2022-11-28",
        "user-agent": "apk-builder-worker",
        "content-type": "application/json",
      },
      body: JSON.stringify({ ref: env.GH_REF || "main", inputs: { job_id: id } }),
    }
  );
  if (!gh.ok) {
    const detail = (await gh.text()).slice(0, 300);
    console.log("GitHub dispatch failed", gh.status, detail);
    await setStatus(env, id, "error", "הפעלת הבנייה נכשלה (GitHub " + gh.status + ")");
    return fail("הפעלת הבנייה נכשלה. נסה שוב מאוחר יותר.", 502);
  }

  return json({ ok: true, id });
}

async function setStatus(env, id, status, error = "") {
  await env.DB.prepare(`UPDATE apk_jobs SET status = ?, error = ?, updated_at = ? WHERE id = ?`)
    .bind(status, error, Date.now(), id).run();
}

// ---------------------------------------------------------------- API: public status

async function jobStatus(env, id, origin) {
  await ensureSchema(env);
  const job = await env.DB.prepare(
    `SELECT id, status, error, app_name, version_code, apk_size, created_at, updated_at FROM apk_jobs WHERE id = ?`
  ).bind(id).first();
  if (!job) return fail("הבקשה לא נמצאה", 404);

  if ((job.status === "queued" || job.status === "building") && Date.now() - job.created_at > BUILD_TIMEOUT_MS) {
    job.status = "error";
    job.error = "הבנייה לקחה יותר מדי זמן. נסה שוב.";
    await setStatus(env, id, job.status, job.error);
  }

  return json({
    ok: true,
    status: job.status,
    error: job.error,
    appName: job.app_name,
    version: job.version_code,
    size: job.apk_size,
    elapsed: Math.round((Date.now() - job.created_at) / 1000),
    download: job.status === "done" ? `${origin}${BASE}/download/${job.id}` : null,
  });
}

async function download(env, id) {
  await ensureSchema(env);
  const job = await env.DB.prepare(`SELECT app_name, status, chunks FROM apk_jobs WHERE id = ?`).bind(id).first();
  if (!job || job.status !== "done") return new Response("הקובץ לא נמצא או שפג תוקפו", { status: 404 });
  const { results } = await env.DB.prepare(`SELECT data FROM apk_chunks WHERE job_id = ? ORDER BY idx`).bind(id).all();
  const bytes = base64ToBytes(results.map((r) => r.data).join(""));
  const ascii = job.app_name.replace(/[^A-Za-z0-9._-]+/g, "_").replace(/^_+|_+$/g, "") || "app";
  return new Response(bytes, {
    headers: {
      "content-type": "application/vnd.android.package-archive",
      "content-disposition": `attachment; filename="${ascii}.apk"; filename*=UTF-8''${encodeURIComponent(job.app_name)}.apk`,
      "content-length": String(bytes.length),
      "cache-control": "private, max-age=3600",
    },
  });
}

// ---------------------------------------------------------------- API: for the GitHub workflow

async function builderConfig(env, id) {
  await ensureSchema(env);
  const job = await env.DB.prepare(`SELECT * FROM apk_jobs WHERE id = ?`).bind(id).first();
  if (!job) return fail("not found", 404);
  if (job.status === "queued") await setStatus(env, id, "building");
  const config = JSON.parse(job.config);
  return json({
    appName: job.app_name,
    appId: job.app_id,
    versionCode: job.version_code,
    versionName: "1." + job.version_code,
    firstHost: new URL(config.sites[0].url).hostname,
    icon: job.icon || "",
    config,
  });
}

async function builderStatus(request, env, id) {
  const body = await request.json().catch(() => ({}));
  const status = ["building", "error"].includes(body.status) ? body.status : null;
  if (!status) return fail("bad status");
  await setStatus(env, id, status, cleanText(body.error, 300));
  return json({ ok: true });
}

async function builderUpload(request, env, id) {
  await ensureSchema(env);
  const job = await env.DB.prepare(`SELECT id FROM apk_jobs WHERE id = ?`).bind(id).first();
  if (!job) return fail("not found", 404);
  const bytes = new Uint8Array(await request.arrayBuffer());
  if (bytes.length < 1000 || bytes.length > 20_000_000 || bytes[0] !== 0x50 || bytes[1] !== 0x4b) {
    return fail("not an apk");
  }
  const b64 = bytesToBase64(bytes);
  const stmts = [env.DB.prepare(`DELETE FROM apk_chunks WHERE job_id = ?`).bind(id)];
  let n = 0;
  for (let i = 0; i < b64.length; i += CHUNK, n++) {
    stmts.push(env.DB.prepare(`INSERT INTO apk_chunks (job_id, idx, data) VALUES (?, ?, ?)`).bind(id, n, b64.slice(i, i + CHUNK)));
  }
  stmts.push(
    env.DB.prepare(`UPDATE apk_jobs SET status = 'done', error = '', apk_size = ?, chunks = ?, icon = '', updated_at = ? WHERE id = ?`)
      .bind(bytes.length, n, Date.now(), id)
  );
  await env.DB.batch(stmts);
  return json({ ok: true, size: bytes.length });
}

/** One signing key for every build, so a new version installs over the old one. */
async function keystoreGet(env) {
  await ensureSchema(env);
  const row = await env.DB.prepare(`SELECT v FROM apk_meta WHERE k = 'keystore'`).first();
  return row ? json(JSON.parse(row.v)) : json({ none: true });
}

async function keystorePut(request, env) {
  await ensureSchema(env);
  const body = await request.json().catch(() => null);
  if (!body?.keystore || !body?.password || body.keystore.length > 20_000) return fail("bad keystore");
  // Never overwrite an existing key: that would break updates of every app already installed.
  await env.DB.prepare(`INSERT OR IGNORE INTO apk_meta (k, v) VALUES ('keystore', ?)`)
    .bind(JSON.stringify({ keystore: body.keystore, password: body.password })).run();
  return keystoreGet(env);
}

// ---------------------------------------------------------------- router

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    let path = url.pathname;
    if (path === BASE) return Response.redirect(url.origin + BASE + "/", 301);
    if (path.startsWith(BASE + "/")) path = path.slice(BASE.length);
    const method = request.method;

    try {
      if (path === "/" && method === "GET") {
        return new Response(renderPage(), {
          headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-cache" },
        });
      }
      if (path === "/api/build" && method === "POST") return await createBuild(request, env);

      let m;
      if ((m = /^\/api\/jobs\/([a-f0-9]{24})$/.exec(path)) && method === "GET") {
        return await jobStatus(env, m[1], url.origin);
      }
      if ((m = /^\/download\/([a-f0-9]{24})$/.exec(path)) && method === "GET") {
        return await download(env, m[1]);
      }

      // Everything below is only for the GitHub workflow.
      if (path.startsWith("/builder/")) {
        if (!isBuilder(request, env)) return fail("unauthorized", 401);
        if ((m = /^\/builder\/jobs\/([a-f0-9]{24})$/.exec(path)) && method === "GET") return await builderConfig(env, m[1]);
        if ((m = /^\/builder\/jobs\/([a-f0-9]{24})\/status$/.exec(path)) && method === "POST") return await builderStatus(request, env, m[1]);
        if ((m = /^\/builder\/jobs\/([a-f0-9]{24})\/apk$/.exec(path)) && method === "PUT") return await builderUpload(request, env, m[1]);
        if (path === "/builder/keystore" && method === "GET") return await keystoreGet(env);
        if (path === "/builder/keystore" && method === "PUT") return await keystorePut(request, env);
      }

      return new Response("Not found", { status: 404 });
    } catch (e) {
      console.log("error", e?.stack || e);
      return fail("שגיאה בשרת", 500);
    }
  },
};
