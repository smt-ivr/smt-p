const LOGO = "https://smti.uk/smt.png";

export function renderPage() {
  return `<!doctype html>
<html lang="he" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>SMT · הפרויקטים</title>
<meta name="description" content="כל הפרויקטים של SMT במקום אחד">
<link rel="icon" href="${LOGO}">
<link rel="apple-touch-icon" href="${LOGO}">
<meta property="og:title" content="SMT · הפרויקטים">
<meta property="og:image" content="${LOGO}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Heebo:wght@400;500;700;800&display=swap" rel="stylesheet">
<style>
:root{
  --bg:#f4f6fb; --bg2:#e9eefb; --card:#ffffff; --text:#141a2e; --muted:#5d6785;
  --line:#e2e7f2; --accent:#2f6bff; --accent2:#7a4dff; --danger:#e5484d;
  --shadow:0 1px 2px rgba(20,26,46,.05),0 8px 24px rgba(20,26,46,.07);
  --shadow-hover:0 2px 4px rgba(20,26,46,.06),0 18px 40px rgba(47,107,255,.18);
}
@media (prefers-color-scheme: dark){
  :root{
    --bg:#0b0f1c; --bg2:#121935; --card:#141b30; --text:#eef1fb; --muted:#9aa4c4;
    --line:#232c48; --accent:#5b8cff; --accent2:#9b7bff; --danger:#ff6369;
    --shadow:0 1px 2px rgba(0,0,0,.3),0 8px 24px rgba(0,0,0,.25);
    --shadow-hover:0 2px 4px rgba(0,0,0,.3),0 18px 40px rgba(91,140,255,.22);
  }
}
*{box-sizing:border-box}
html,body{margin:0}
body{
  font-family:"Heebo",system-ui,-apple-system,"Segoe UI",Arial,sans-serif;
  color:var(--text); min-height:100vh;
  background:
    radial-gradient(1000px 500px at 85% -10%, color-mix(in srgb,var(--accent) 18%,transparent), transparent 60%),
    radial-gradient(900px 500px at 0% 0%, color-mix(in srgb,var(--accent2) 14%,transparent), transparent 60%),
    var(--bg);
  background-attachment:fixed;
}
.wrap{max-width:1120px;margin:0 auto;padding:0 16px 64px}
header{display:flex;flex-direction:column;align-items:center;text-align:center;padding:48px 0 28px}
.logo{width:96px;height:96px;object-fit:contain;border-radius:24px;background:var(--card);padding:10px;box-shadow:var(--shadow)}
h1{margin:18px 0 6px;font-size:clamp(28px,5vw,40px);font-weight:800;letter-spacing:-.5px}
h1 span{background:linear-gradient(90deg,var(--accent),var(--accent2));-webkit-background-clip:text;background-clip:text;color:transparent}
.sub{margin:0;color:var(--muted);font-size:17px}
.toolbar{display:flex;gap:10px;align-items:center;margin:8px auto 26px;max-width:640px}
.search{flex:1;position:relative}
.search input{width:100%;padding:13px 44px 13px 16px;border-radius:14px;border:1px solid var(--line);background:var(--card);color:var(--text);font:inherit;font-size:16px;box-shadow:var(--shadow);outline:none}
.search input:focus{border-color:var(--accent)}
.search svg{position:absolute;right:14px;top:50%;transform:translateY(-50%);color:var(--muted)}
.btn{border:0;border-radius:12px;padding:12px 16px;font:inherit;font-weight:600;font-size:15px;cursor:pointer;display:inline-flex;align-items:center;gap:8px;transition:transform .1s,opacity .15s}
.btn:active{transform:scale(.97)}
.btn-primary{background:linear-gradient(90deg,var(--accent),var(--accent2));color:#fff}
.btn-ghost{background:var(--card);color:var(--text);border:1px solid var(--line);box-shadow:var(--shadow)}
.btn-icon{padding:12px}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:16px}
.card{position:relative;display:flex;flex-direction:column;gap:12px;padding:20px;background:var(--card);border:1px solid var(--line);border-radius:18px;box-shadow:var(--shadow);color:inherit;text-decoration:none;transition:transform .18s,box-shadow .18s,border-color .18s;min-height:150px}
.card:hover{transform:translateY(-3px);box-shadow:var(--shadow-hover);border-color:color-mix(in srgb,var(--accent) 40%,var(--line))}
.card-top{display:flex;align-items:center;gap:12px}
.ico{width:48px;height:48px;border-radius:12px;flex:none;display:grid;place-items:center;overflow:hidden;background:var(--bg2);font-weight:800;font-size:20px;color:var(--accent)}
.ico img{width:100%;height:100%;object-fit:contain}
.title{font-weight:700;font-size:17px;line-height:1.3;overflow:hidden;text-overflow:ellipsis;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}
.desc{color:var(--muted);font-size:14px;line-height:1.5;margin:0;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}
.go{margin-top:auto;display:flex;align-items:center;justify-content:space-between;gap:8px;font-size:13px;color:var(--muted)}
.host{direction:ltr;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.arrow{width:32px;height:32px;border-radius:10px;display:grid;place-items:center;background:var(--bg2);color:var(--accent);flex:none;transition:background .18s,color .18s}
.card:hover .arrow{background:var(--accent);color:#fff}
.acts{position:absolute;top:10px;left:10px;display:none;gap:6px}
body.admin .acts{display:flex}
body.admin .card-top{padding-left:76px}
.act{width:32px;height:32px;border-radius:10px;border:1px solid var(--line);background:var(--card);color:var(--accent);cursor:pointer;display:grid;place-items:center}
.act:hover{background:var(--accent);color:#fff;border-color:var(--accent)}
.act.del{color:var(--danger)}
.act.del:hover{background:var(--danger);border-color:var(--danger);color:#fff}
.empty{text-align:center;color:var(--muted);padding:60px 16px;border:2px dashed var(--line);border-radius:18px}
.add-card{display:none;align-items:center;justify-content:center;flex-direction:column;gap:8px;border:2px dashed color-mix(in srgb,var(--accent) 45%,var(--line));background:transparent;box-shadow:none;color:var(--accent);font-weight:700;cursor:pointer;font:inherit;font-weight:700}
body.admin .add-card{display:flex}
.admin-bar{display:none;flex-wrap:wrap;justify-content:center;gap:12px;align-items:center;margin:-10px 0 18px;color:var(--muted);font-size:14px}
body.admin .admin-bar{display:flex}
.pill{background:color-mix(in srgb,var(--accent) 14%,transparent);color:var(--accent);padding:4px 10px;border-radius:99px;font-weight:600}
.linkish{background:none;border:0;color:var(--muted);text-decoration:underline;cursor:pointer;font:inherit}
dialog{border:0;border-radius:20px;padding:0;width:min(480px,calc(100% - 32px));background:var(--card);color:var(--text);box-shadow:0 30px 80px rgba(0,0,0,.35)}
dialog::backdrop{background:rgba(8,12,24,.55);backdrop-filter:blur(3px)}
.dlg{padding:24px}
.dlg h2{margin:0 0 4px;font-size:21px}
.dlg p.hint{margin:0 0 18px;color:var(--muted);font-size:14px}
label{display:block;font-size:14px;font-weight:600;margin:14px 0 6px}
.field{width:100%;padding:12px 14px;border-radius:12px;border:1px solid var(--line);background:var(--bg);color:var(--text);font:inherit;font-size:16px;outline:none}
.field:focus{border-color:var(--accent)}
.ltr{direction:ltr;text-align:left}
.row{display:flex;gap:8px}
.row .field{flex:1}
.preview{display:flex;align-items:center;gap:12px;margin-top:16px;padding:12px;border-radius:14px;background:var(--bg);border:1px solid var(--line)}
.actions{display:flex;gap:10px;justify-content:flex-start;margin-top:22px}
.err{color:var(--danger);font-size:14px;min-height:20px;margin-top:10px}
.spin{width:16px;height:16px;border:2px solid currentColor;border-right-color:transparent;border-radius:50%;animation:s .7s linear infinite;display:none}
.loading .spin{display:inline-block}
@keyframes s{to{transform:rotate(360deg)}}
.toast{position:fixed;bottom:20px;left:50%;transform:translateX(-50%) translateY(20px);background:var(--text);color:var(--bg);padding:12px 18px;border-radius:12px;opacity:0;transition:.25s;pointer-events:none;font-weight:600;z-index:10}
.toast.show{opacity:1;transform:translateX(-50%)}
footer{text-align:center;color:var(--muted);font-size:13px;margin-top:40px}
@media (max-width:520px){header{padding-top:32px}.logo{width:80px;height:80px}.grid{grid-template-columns:1fr 1fr;gap:12px}.card{padding:14px;min-height:130px}.ico{width:40px;height:40px}.title{font-size:15px}.desc{display:none}}
@media (max-width:340px){.grid{grid-template-columns:1fr}}
</style>
</head>
<body>
<div class="wrap">
  <header>
    <img class="logo" src="${LOGO}" alt="SMT">
    <h1>הפרויקטים של <span>SMT</span></h1>
    <p class="sub">כל האתרים והמערכות במקום אחד</p>
  </header>

  <div class="toolbar">
    <div class="search">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
      <input id="q" type="search" placeholder="חיפוש פרויקט..." autocomplete="off">
    </div>
    <button class="btn btn-ghost btn-icon" id="lockBtn" title="ניהול" aria-label="ניהול">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>
    </button>
  </div>

  <div class="admin-bar"><span class="pill">מצב ניהול</span><button class="linkish" id="refreshAll">רענון פרטים לכל האתרים</button><button class="linkish" id="logout">יציאה</button></div>

  <div class="grid" id="grid"></div>
  <footer>smti.uk</footer>
</div>

<dialog id="loginDlg">
  <form class="dlg" id="loginForm" method="dialog">
    <h2>כניסה לניהול</h2>
    <p class="hint">הזן סיסמא כדי להוסיף ולהסיר קישורים</p>
    <input class="field ltr" id="pass" type="password" inputmode="numeric" autocomplete="current-password" placeholder="סיסמא" required>
    <div class="err" id="loginErr"></div>
    <div class="actions">
      <button class="btn btn-primary" type="submit"><span class="spin"></span>כניסה</button>
      <button class="btn btn-ghost" type="button" data-close>ביטול</button>
    </div>
  </form>
</dialog>

<dialog id="addDlg">
  <form class="dlg" id="addForm" method="dialog">
    <h2 id="addTitle">הוספת פרויקט</h2>
    <p class="hint">כתוב שם נתיב (למשל <b>zmanim</b>) לאתר ב-smti.uk, או הדבק כל קישור אחר. הפרטים ימולאו אוטומטית.</p>
    <label for="fUrl">קישור</label>
    <div class="row">
      <input class="field ltr" id="fUrl" placeholder="smti.uk/project או https://..." required autocomplete="off">
      <button class="btn btn-ghost" type="button" id="fetchBtn"><span class="spin"></span>מלא</button>
    </div>
    <label for="fTitle">שם</label>
    <input class="field" id="fTitle" placeholder="שם הפרויקט">
    <label for="fDesc">תיאור</label>
    <input class="field" id="fDesc" placeholder="תיאור קצר (לא חובה)">
    <label for="fIcon">אייקון</label>
    <input class="field ltr" id="fIcon" placeholder="https://.../icon.png (לא חובה)">
    <div class="preview" id="preview"></div>
    <div class="err" id="addErr"></div>
    <div class="actions">
      <button class="btn btn-primary" type="submit"><span class="spin"></span><span id="addSubmit">הוספה</span></button>
      <button class="btn btn-ghost" type="button" data-close>ביטול</button>
    </div>
  </form>
</dialog>

<div class="toast" id="toast"></div>

<script>
(function(){
  var LOGO = ${JSON.stringify(LOGO)};
  var ORIGIN = "https://smti.uk";
  var links = [];
  var pass = "";
  try { pass = sessionStorage.getItem("smt-p-pass") || ""; } catch(e) {}

  var $ = function(id){ return document.getElementById(id); };
  var grid = $("grid");

  function api(path, opts){
    opts = opts || {};
    opts.headers = Object.assign({"content-type":"application/json"}, opts.headers || {});
    if (pass) opts.headers["x-password"] = pass;
    return fetch("api/" + path, opts).then(function(r){
      return r.json().catch(function(){ return {}; }).then(function(d){
        if (!r.ok) { var e = new Error(d.error || "שגיאה"); e.status = r.status; throw e; }
        return d;
      });
    });
  }

  function toast(msg){
    var t = $("toast"); t.textContent = msg; t.classList.add("show");
    clearTimeout(toast._t); toast._t = setTimeout(function(){ t.classList.remove("show"); }, 2200);
  }

  function el(tag, cls, text){
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  function prettyHost(url){
    try { var u = new URL(url); return (u.host + u.pathname).replace(/\\/$/, ""); } catch(e){ return url; }
  }

  function iconEl(link){
    var box = el("div", "ico");
    var letter = (link.title || "?").trim().charAt(0).toUpperCase() || "?";
    var src = link.icon;
    if (!src) {
      try { if (new URL(link.url).hostname.endsWith("smti.uk")) src = LOGO; } catch(e){}
    }
    if (src) {
      var img = new Image(); img.alt = ""; img.loading = "lazy"; img.referrerPolicy = "no-referrer";
      img.onerror = function(){ box.textContent = letter; };
      img.src = src; box.appendChild(img);
    } else box.textContent = letter;
    return box;
  }

  var arrowSvg = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M15 6l-6 6 6 6"/></svg>';
  var trashSvg = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg>';

  var editSvg = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h4L19 9l-4-4L4 16v4z"/><path d="M13.5 6.5l4 4"/></svg>';

  function render(){
    var q = $("q").value.trim().toLowerCase();
    grid.innerHTML = "";
    var shown = links.filter(function(l){
      return !q || (l.title + " " + l.description + " " + l.url).toLowerCase().indexOf(q) !== -1;
    });
    shown.forEach(function(l){
      var a = el("a", "card"); a.href = l.url; a.target = "_blank"; a.rel = "noopener";
      var top = el("div", "card-top");
      top.appendChild(iconEl(l));
      top.appendChild(el("div", "title", l.title));
      a.appendChild(top);
      if (l.description) a.appendChild(el("p", "desc", l.description));
      var go = el("div", "go");
      go.appendChild(el("span", "host", prettyHost(l.url)));
      var ar = el("span", "arrow"); ar.innerHTML = arrowSvg; go.appendChild(ar);
      a.appendChild(go);
      var acts = el("div", "acts");
      var ed = el("button", "act"); ed.type = "button"; ed.title = "עריכה"; ed.setAttribute("aria-label", "עריכה"); ed.innerHTML = editSvg;
      ed.onclick = function(ev){ ev.preventDefault(); ev.stopPropagation(); openAdd(l); };
      var d = el("button", "act del"); d.type = "button"; d.title = "הסרה"; d.setAttribute("aria-label", "הסרה"); d.innerHTML = trashSvg;
      d.onclick = function(ev){ ev.preventDefault(); ev.stopPropagation(); removeLink(l); };
      acts.appendChild(ed); acts.appendChild(d);
      a.appendChild(acts);
      grid.appendChild(a);
    });
    var add = el("button", "card add-card"); add.type = "button";
    add.innerHTML = '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg><span>הוספת פרויקט</span>';
    add.onclick = function(){ openAdd(); };
    grid.appendChild(add);
    if (!shown.length && !document.body.classList.contains("admin")) {
      var empty = el("div", "empty", q ? "לא נמצאו פרויקטים" : "עדיין אין פרויקטים. לחץ על המנעול כדי להוסיף.");
      empty.style.gridColumn = "1 / -1";
      grid.insertBefore(empty, add);
    }
  }

  function load(){
    api("links").then(function(d){ links = d; render(); })
      .catch(function(){ grid.innerHTML = ""; var e = el("div","empty","שגיאה בטעינת הפרויקטים"); e.style.gridColumn="1 / -1"; grid.appendChild(e); });
  }

  function setAdmin(on){
    document.body.classList.toggle("admin", on);
    if (!on) { pass = ""; try { sessionStorage.removeItem("smt-p-pass"); } catch(e){} }
    render();
  }

  function busy(btn, on){ btn.classList.toggle("loading", on); btn.disabled = on; }

  // Login
  $("lockBtn").onclick = function(){
    if (document.body.classList.contains("admin")) { openAdd(); return; }
    $("loginErr").textContent = ""; $("pass").value = "";
    $("loginDlg").showModal(); $("pass").focus();
  };
  $("loginForm").onsubmit = function(ev){
    ev.preventDefault();
    var btn = ev.submitter || this.querySelector("[type=submit]");
    var candidate = $("pass").value;
    busy(btn, true);
    fetch("api/login", { method:"POST", headers:{ "x-password": candidate } }).then(function(r){
      busy(btn, false);
      if (!r.ok) { $("loginErr").textContent = "סיסמא שגויה"; return; }
      pass = candidate; try { sessionStorage.setItem("smt-p-pass", pass); } catch(e){}
      $("loginDlg").close(); setAdmin(true); toast("נכנסת למצב ניהול");
    }).catch(function(){ busy(btn, false); $("loginErr").textContent = "שגיאת תקשורת"; });
  };
  $("logout").onclick = function(){ setAdmin(false); toast("יצאת ממצב ניהול"); };

  // Add
  var editingId = null;
  function openAdd(link){
    editingId = link ? link.id : null;
    $("addTitle").textContent = link ? "עריכת פרויקט" : "הוספת פרויקט";
    $("addSubmit").textContent = link ? "שמירה" : "הוספה";
    $("fUrl").value = link ? link.url : "";
    $("fTitle").value = link ? link.title : "";
    $("fDesc").value = link ? (link.description || "") : "";
    $("fIcon").value = link ? (link.icon || "") : "";
    ["fTitle","fDesc","fIcon"].forEach(function(id){ $(id).dataset.touched = link && $(id).value ? "1" : ""; });
    $("addErr").textContent = ""; lastFetched = link ? link.url : ""; updatePreview();
    $("addDlg").showModal(); $("fUrl").focus();
  }

  function normalize(s){
    s = (s || "").trim(); if (!s) return "";
    if (!/^[a-z][a-z0-9+.-]*:\\/\\//i.test(s)) {
      if (s.charAt(0) === "/") s = ORIGIN + s;
      else if (/^[^\\s\\/]+\\.[a-z]{2,}(\\/|$)/i.test(s)) s = "https://" + s;
      else s = ORIGIN + "/" + s;
    }
    return s;
  }

  function updatePreview(){
    var p = $("preview"); p.innerHTML = "";
    var url = normalize($("fUrl").value);
    if (!url) { p.style.display = "none"; return; }
    p.style.display = "flex";
    var l = { url:url, title:$("fTitle").value || prettyHost(url), icon:$("fIcon").value };
    p.appendChild(iconEl(l));
    var t = el("div"); t.style.minWidth = "0";
    t.appendChild(el("div", "title", l.title));
    var h = el("div", "host", prettyHost(url)); h.style.fontSize = "13px"; h.style.color = "var(--muted)";
    t.appendChild(h); p.appendChild(t);
  }

  // Pages on smti.uk are read directly by the browser (same site). A Worker
  // cannot fetch other Workers on its own domain, so the server is used only
  // for other domains.
  function fallbackMeta(url){
    var t = url;
    try { var u = new URL(url); t = decodeURIComponent(u.pathname.split("/").filter(Boolean).pop() || u.hostname); } catch(e){}
    return { url: url, title: t, description: "", icon: "" };
  }
  function parseHtmlMeta(html, base, url){
    var doc = new DOMParser().parseFromString(html, "text/html");
    var m = function(sel){ var e = doc.querySelector(sel); return e ? (e.getAttribute("content") || "").trim() : ""; };
    var out = fallbackMeta(url);
    var title = m('meta[property="og:title"]') || m('meta[name="twitter:title"]') || (doc.title || "").trim();
    if (title) out.title = title.slice(0, 120);
    out.description = (m('meta[name="description"]') || m('meta[property="og:description"]')).slice(0, 300);
    var ic = doc.querySelector('link[rel~="apple-touch-icon"]') || doc.querySelector('link[rel~="icon"]');
    var icon = ic ? (ic.getAttribute("href") || "").trim() : "";
    if (!icon) icon = m('meta[property="og:image"]');
    if (/^data:/i.test(icon)) { if (!/^data:image\//i.test(icon)) icon = ""; }
    else if (icon) { try { icon = new URL(icon, base).toString(); } catch(e){ icon = ""; } }
    out.icon = icon.length <= 20000 ? icon : "";
    return out;
  }
  function getMeta(url){
    var same = false;
    try { same = new URL(url).origin === location.origin; } catch(e){}
    if (!same) return api("meta?url=" + encodeURIComponent(url));
    return fetch(url, { credentials: "same-origin" }).then(function(r){
      if (!r.ok) return fallbackMeta(url);
      var base = r.url || url;
      return r.text().then(function(h){ return parseHtmlMeta(h, base, url); });
    }).catch(function(){ return fallbackMeta(url); });
  }

  var lastFetched = "";
  function autofill(force){
    var url = normalize($("fUrl").value);
    if (!url || (!force && url === lastFetched)) return;
    lastFetched = url;
    var btn = $("fetchBtn"); busy(btn, true);
    getMeta(url).then(function(m){
      busy(btn, false);
      if (normalize($("fUrl").value) !== url) return;
      $("fUrl").value = m.url;
      if (force || !$("fTitle").dataset.touched) $("fTitle").value = m.title || "";
      if (force || !$("fDesc").dataset.touched) $("fDesc").value = m.description || "";
      if (force || !$("fIcon").dataset.touched) $("fIcon").value = m.icon || "";
      updatePreview();
    }).catch(function(e){ busy(btn, false); if (e.status === 401) setAdmin(false); });
  }

  ["fTitle","fDesc","fIcon"].forEach(function(id){
    $(id).addEventListener("input", function(){ this.dataset.touched = this.value ? "1" : ""; updatePreview(); });
  });
  var urlTimer;
  $("fUrl").addEventListener("input", function(){
    updatePreview(); clearTimeout(urlTimer);
    urlTimer = setTimeout(function(){ autofill(false); }, 700);
  });
  $("fUrl").addEventListener("blur", function(){ autofill(false); });
  $("fetchBtn").onclick = function(){ autofill(true); };

  $("addForm").onsubmit = function(ev){
    ev.preventDefault();
    var btn = ev.submitter || this.querySelector("[type=submit]");
    var body = { url: normalize($("fUrl").value), title: $("fTitle").value, description: $("fDesc").value, icon: $("fIcon").value };
    if (!body.url) { $("addErr").textContent = "יש להזין קישור"; return; }
    busy(btn, true);
    var id = editingId;
    var req = id ? api("links/" + id, { method:"PUT", body: JSON.stringify(body) })
                 : api("links", { method:"POST", body: JSON.stringify(body) });
    req.then(function(row){
      busy(btn, false);
      if (id) links = links.map(function(x){ return x.id === id ? row : x; });
      else links.push(row);
      render();
      $("addDlg").close(); toast(id ? "נשמר" : "הפרויקט נוסף");
    }).catch(function(e){
      busy(btn, false); $("addErr").textContent = e.message;
      if (e.status === 401) { $("addDlg").close(); setAdmin(false); }
    });
  };

  function removeLink(l){
    if (!confirm("להסיר את \\"" + l.title + "\\"?")) return;
    api("links/" + l.id, { method:"DELETE" }).then(function(){
      links = links.filter(function(x){ return x.id !== l.id; }); render(); toast("הוסר");
    }).catch(function(e){ toast(e.message); if (e.status === 401) setAdmin(false); });
  }

  $("refreshAll").onclick = function(){
    if (!links.length) return;
    if (!confirm("לטעון מחדש שם, תיאור ואייקון לכל האתרים? שינויים ידניים יוחלפו.")) return;
    var btn = this, done = 0, list = links.slice();
    btn.disabled = true;
    (function next(i){
      if (i >= list.length) { btn.disabled = false; render(); toast("עודכנו " + done + " אתרים"); return; }
      var l = list[i];
      toast("מעדכן " + (i + 1) + "/" + list.length + "...");
      getMeta(l.url).then(function(m){
        var body = { url: l.url, title: m.title || l.title, description: m.description || l.description, icon: m.icon || l.icon };
        return api("links/" + l.id, { method:"PUT", body: JSON.stringify(body) });
      }).then(function(row){
        links = links.map(function(x){ return x.id === row.id ? row : x; }); done++;
      }).catch(function(e){ if (e && e.status === 401) { setAdmin(false); i = list.length; } })
        .then(function(){ next(i + 1); });
    })(0);
  };

  document.querySelectorAll("[data-close]").forEach(function(b){
    b.onclick = function(){ b.closest("dialog").close(); };
  });

  $("q").addEventListener("input", render);

  if (pass) {
    fetch("api/login", { method:"POST", headers:{ "x-password": pass } })
      .then(function(r){ setAdmin(r.ok); }).catch(function(){});
  }
  load();
})();
</script>
</body>
</html>`;
}
