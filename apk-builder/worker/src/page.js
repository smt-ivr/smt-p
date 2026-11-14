const LOGO = "https://smti.uk/smt.png";

export function renderPage() {
  return `<!doctype html>
<html lang="he" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>SMT · יוצר אפליקציות</title>
<meta name="description" content="הופכים אתר אחד או כמה אתרים לאפליקציית אנדרואיד סגורה">
<link rel="icon" href="${LOGO}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Heebo:wght@400;500;700;800&display=swap" rel="stylesheet">
<style>
:root{
  --bg:#f4f6fb; --card:#ffffff; --field:#f8f9fd; --text:#141a2e; --muted:#5d6785;
  --line:#e2e7f2; --accent:#2f6bff; --accent-ink:#ffffff; --ok:#14804a; --danger:#d93036;
  --shadow:0 1px 2px rgba(20,26,46,.05),0 8px 24px rgba(20,26,46,.07);
}
@media (prefers-color-scheme: dark){
  :root{
    --bg:#0b0f1c; --card:#141b30; --field:#0f1527; --text:#eef1fb; --muted:#9aa4c4;
    --line:#26304d; --accent:#5b8cff; --accent-ink:#0b0f1c; --ok:#3ccf83; --danger:#ff6369;
    --shadow:0 1px 2px rgba(0,0,0,.3),0 8px 24px rgba(0,0,0,.25);
  }
}
*{box-sizing:border-box}
html,body{margin:0}
body{font-family:"Heebo",system-ui,-apple-system,"Segoe UI",Arial,sans-serif;background:var(--bg);color:var(--text);line-height:1.5}
.wrap{max-width:680px;margin:0 auto;padding:28px 16px 64px}
header{text-align:center;margin-bottom:22px}
header h1{font-size:30px;font-weight:800;margin:0 0 6px}
header p{color:var(--muted);margin:0}
.card{background:var(--card);border:1px solid var(--line);border-radius:16px;box-shadow:var(--shadow);padding:20px;margin-bottom:16px}
.card h2{font-size:18px;margin:0 0 4px}
.hint{color:var(--muted);font-size:14px;margin:0 0 14px}
label.f{display:block;font-weight:500;margin:12px 0 6px}
input[type=text],input[type=url],input[type=password],input[type=tel],select,textarea{
  width:100%;font:inherit;color:var(--text);background:var(--field);border:1px solid var(--line);
  border-radius:10px;padding:10px 12px;outline:none}
input:focus,select:focus,textarea:focus{border-color:var(--accent);box-shadow:0 0 0 3px color-mix(in srgb,var(--accent) 22%,transparent)}
.ltr{direction:ltr;text-align:left}
textarea{min-height:84px;resize:vertical}
.site{border:1px solid var(--line);border-radius:12px;padding:12px;margin-bottom:10px;background:var(--field)}
.site .row{display:grid;grid-template-columns:1fr 1.4fr auto;gap:8px;align-items:center}
.site input{background:var(--card)}
.site .opts{display:flex;align-items:center;gap:6px;margin-top:8px;font-size:14px;color:var(--muted)}
.icon-btn{border:0;background:transparent;color:var(--muted);font-size:20px;cursor:pointer;padding:4px 8px;border-radius:8px}
.icon-btn:hover{background:color-mix(in srgb,var(--danger) 12%,transparent);color:var(--danger)}
@media (max-width:520px){.site .row{grid-template-columns:1fr auto}.site .row .url{grid-column:1 / -1;order:3}}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;font:inherit;font-weight:700;border-radius:12px;
  border:1px solid var(--line);background:var(--card);color:var(--text);padding:10px 16px;cursor:pointer;text-decoration:none}
.btn:hover{border-color:var(--accent)}
.btn.primary{background:var(--accent);color:var(--accent-ink);border-color:var(--accent);width:100%;padding:14px;font-size:18px}
.btn.primary:disabled{opacity:.6;cursor:default}
.icon-pick{display:flex;align-items:center;gap:14px}
.icon-prev{width:72px;height:72px;border-radius:18px;border:1px dashed var(--line);background:var(--field);
  display:flex;align-items:center;justify-content:center;color:var(--muted);font-size:12px;overflow:hidden;flex:none}
.icon-prev img{width:100%;height:100%;object-fit:cover}
.grid2{display:grid;grid-template-columns:1fr 1fr;gap:12px}
@media (max-width:520px){.grid2{grid-template-columns:1fr}}
.err{color:var(--danger);font-weight:500;min-height:1.5em;margin:10px 0 0;text-align:center}
#status{display:none;text-align:center}
.spinner{width:44px;height:44px;border-radius:50%;border:4px solid var(--line);border-top-color:var(--accent);
  animation:spin 1s linear infinite;margin:6px auto 14px}
@keyframes spin{to{transform:rotate(360deg)}}
@media (prefers-reduced-motion: reduce){.spinner{animation-duration:3s}}
.steps{list-style:none;padding:0;margin:14px auto 0;max-width:280px;text-align:right}
.steps li{padding:4px 0;color:var(--muted)}
.steps li.on{color:var(--text);font-weight:700}
.steps li.ok{color:var(--ok)}
.done-mark{font-size:44px;color:var(--ok);line-height:1}
.small{font-size:14px;color:var(--muted)}
details summary{cursor:pointer;color:var(--accent);font-weight:500}
footer{text-align:center;color:var(--muted);font-size:13px;margin-top:20px}
</style>
</head>
<body>
<div class="wrap">
  <header>
    <h1>יוצר אפליקציות</h1>
    <p>אפליקציית אנדרואיד שמציגה רק את האתרים שתבחר, ושום דבר אחר.</p>
  </header>

  <form id="form" novalidate>
    <div class="card">
      <h2>פרטי האפליקציה</h2>
      <label class="f" for="appName">שם האפליקציה</label>
      <input type="text" id="appName" maxlength="40" required placeholder="למשל: שיעורי תורה">

      <label class="f">סמל</label>
      <div class="icon-pick">
        <div class="icon-prev" id="iconPrev">אוטומטי</div>
        <div>
          <input type="file" id="iconFile" accept="image/*" hidden>
          <button type="button" class="btn" id="iconBtn">בחירת תמונה</button>
          <button type="button" class="btn" id="iconClear" hidden>הסרה</button>
          <p class="small" style="margin:6px 0 0">בלי תמונה ננסה לקחת את הסמל של האתר הראשון.</p>
        </div>
      </div>
    </div>

    <div class="card">
      <h2>אתרים</h2>
      <p class="hint">אם יש יותר מאתר אחד, באפליקציה יופיע מסך בית עם כפתור לכל אתר. תתי-האתרים של כל אתר מותרים גם הם.</p>
      <div id="sites"></div>
      <button type="button" class="btn" id="addSite">+ הוספת אתר</button>
    </div>

    <div class="card">
      <h2>הגדרות נוספות</h2>

      <label class="f" for="extra">כתובות נוספות מורשות <span class="small">(לא חובה)</span></label>
      <p class="hint" style="margin-bottom:6px">לא יופיעו במסך הבית, אבל מותר יהיה לעבור אליהן, למשל אתר התחברות או תשלום. שורה לכל כתובת.</p>
      <textarea id="extra" class="ltr" placeholder="login.example.com"></textarea>

      <div class="grid2">
        <div>
          <label class="f" for="pin">קוד להגדרות <span class="small">(לא חובה)</span></label>
          <input type="password" id="pin" class="ltr" inputmode="numeric" maxlength="8" placeholder="4–8 ספרות" autocomplete="new-password">
        </div>
        <div>
          <label class="f" for="orientation">מצב מסך</label>
          <select id="orientation">
            <option value="auto">אוטומטי</option>
            <option value="portrait">תמיד לאורך</option>
            <option value="landscape">תמיד לרוחב</option>
          </select>
        </div>
      </div>
      <p class="hint" style="margin-top:8px">עם קוד, בתפריט האפליקציה יהיה מסך הגדרות שבו אפשר להוסיף ולהסיר אתרים בלי לבנות אפליקציה חדשה. בלי קוד, הרשימה קבועה.</p>
    </div>

    <button type="submit" class="btn primary" id="submit">יצירת אפליקציה</button>
    <p class="err" id="err" role="alert"></p>
  </form>

  <div class="card" id="status" aria-live="polite">
    <div id="stBusy">
      <div class="spinner"></div>
      <h2 id="stTitle">מכין את האפליקציה…</h2>
      <p class="small">זה לוקח בדרך כלל 2–4 דקות. אפשר להשאיר את העמוד פתוח, או לחזור אליו אחר כך.</p>
      <ul class="steps">
        <li id="s1">שליחת הבקשה</li>
        <li id="s2">בתור לבנייה</li>
        <li id="s3">בונה את האפליקציה</li>
      </ul>
      <p class="small" id="stTime"></p>
    </div>
    <div id="stDone" hidden>
      <div class="done-mark">✓</div>
      <h2 id="doneTitle">האפליקציה מוכנה</h2>
      <p class="small" id="doneInfo"></p>
      <p><a class="btn primary" id="dl" href="#">הורדת קובץ ה-APK</a></p>
      <details>
        <summary>איך מתקינים?</summary>
        <ol style="text-align:right" class="small">
          <li>פותחים את הקישור בטלפון ומורידים את הקובץ.</li>
          <li>פותחים את הקובץ מההורדות.</li>
          <li>אם הטלפון מבקש, מאשרים "התקנה ממקורות לא ידועים" לדפדפן או לאפליקציית הקבצים.</li>
          <li>בנייה חוזרת עם אותו שם ואותו אתר ראשון תותקן כעדכון לאפליקציה הקיימת.</li>
        </ol>
      </details>
      <p class="small">הקישור זמין לשבוע.</p>
    </div>
    <div id="stErr" hidden>
      <h2 style="color:var(--danger)">משהו השתבש</h2>
      <p id="errMsg"></p>
    </div>
    <button type="button" class="btn" id="again" style="margin-top:12px" hidden>יצירת אפליקציה נוספת</button>
  </div>

  <footer>SMT · הקוד של האפליקציה פתוח ומבוסס על AndroidRestrictedWebView (GPL-3.0)</footer>
</div>

<script>
(function () {
  const $ = (id) => document.getElementById(id);
  const API = location.pathname.replace(/\\/$/, "") + "/api";
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch {} },
  };

  // ---------- sites list ----------
  function addSite(title = "", url = "", restrict = false) {
    const box = document.createElement("div");
    box.className = "site";
    box.innerHTML =
      '<div class="row">' +
      '<input type="text" class="title" maxlength="40" placeholder="שם הכפתור">' +
      '<input type="url" class="url ltr" placeholder="example.com" inputmode="url">' +
      '<button type="button" class="icon-btn" title="הסרה" aria-label="הסרת אתר">✕</button>' +
      '</div>' +
      '<label class="opts"><input type="checkbox" class="restrict"> רק הנתיב שבכתובת, לא כל האתר</label>';
    box.querySelector(".title").value = title;
    box.querySelector(".url").value = url;
    box.querySelector(".restrict").checked = restrict;
    box.querySelector(".icon-btn").onclick = () => {
      if ($("sites").children.length > 1) box.remove();
      else { box.querySelector(".url").value = ""; box.querySelector(".title").value = ""; }
    };
    $("sites").appendChild(box);
    return box;
  }
  $("addSite").onclick = () => addSite().querySelector(".url").focus();
  addSite();

  // ---------- icon: center-crop to a 512px square PNG ----------
  let iconData = "";
  $("iconBtn").onclick = () => $("iconFile").click();
  $("iconClear").onclick = () => {
    iconData = "";
    $("iconPrev").textContent = "אוטומטי";
    $("iconClear").hidden = true;
    $("iconFile").value = "";
  };
  $("iconFile").onchange = function () {
    const file = this.files[0];
    if (!file) return;
    const img = new Image();
    img.onload = () => {
      const side = Math.min(img.naturalWidth, img.naturalHeight);
      const size = Math.min(512, side);
      const c = document.createElement("canvas");
      c.width = c.height = size;
      c.getContext("2d").drawImage(img,
        (img.naturalWidth - side) / 2, (img.naturalHeight - side) / 2, side, side, 0, 0, size, size);
      iconData = c.toDataURL("image/png");
      $("iconPrev").innerHTML = "";
      const p = new Image();
      p.src = iconData;
      p.alt = "";
      $("iconPrev").appendChild(p);
      $("iconClear").hidden = false;
      URL.revokeObjectURL(img.src);
    };
    img.onerror = () => showErr("לא הצלחנו לקרוא את התמונה");
    img.src = URL.createObjectURL(file);
  };

  // ---------- submit ----------
  function showErr(t) { $("err").textContent = t || ""; }

  function looksLikeUrl(s) {
    return /^(https?:\\/\\/)?([a-z0-9-]+\\.)+[a-z0-9-]{2,}(:\\d+)?(\\/\\S*)?$/i.test(s.trim());
  }

  $("form").onsubmit = async (e) => {
    e.preventDefault();
    showErr("");
    const appName = $("appName").value.trim();
    if (!appName) { $("appName").focus(); return showErr("נא להזין שם לאפליקציה"); }

    const sites = [];
    for (const box of $("sites").children) {
      const url = box.querySelector(".url").value.trim();
      if (!url) continue;
      if (!looksLikeUrl(url)) { box.querySelector(".url").focus(); return showErr('הכתובת "' + url + '" לא תקינה'); }
      sites.push({ title: box.querySelector(".title").value.trim(), url, restrictPath: box.querySelector(".restrict").checked });
    }
    if (!sites.length) { $("sites").querySelector(".url").focus(); return showErr("נא להזין לפחות כתובת אתר אחת"); }

    const extraDomains = $("extra").value.split(/[\\s,]+/).map((s) => s.trim()).filter(Boolean);
    for (const d of extraDomains) if (!looksLikeUrl(d)) return showErr('הכתובת הנוספת "' + d + '" לא תקינה');

    const pin = $("pin").value.trim();
    if (pin && !/^\\d{4,8}$/.test(pin)) { $("pin").focus(); return showErr("הקוד צריך להיות 4 עד 8 ספרות"); }

    $("submit").disabled = true;
    try {
      const r = await fetch(API + "/build", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ appName, sites, extraDomains, pin, orientation: $("orientation").value, icon: iconData }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok || !data.ok) throw new Error(data.error || "השליחה נכשלה");
      store.set("apkJob", data.id);
      track(data.id);
    } catch (err) {
      showErr(err.message);
    } finally {
      $("submit").disabled = false;
    }
  };

  // ---------- progress ----------
  let timer = null;
  function setStep(n) {
    ["s1", "s2", "s3"].forEach((id, i) => {
      $(id).className = i + 1 < n ? "ok" : i + 1 === n ? "on" : "";
      $(id).textContent = $(id).textContent.replace(/^✓ /, "");
      if (i + 1 < n) $(id).textContent = "✓ " + $(id).textContent;
    });
  }
  function view(which) {
    $("form").style.display = which ? "none" : "";
    $("status").style.display = which ? "block" : "none";
    $("stBusy").hidden = which !== "busy";
    $("stDone").hidden = which !== "done";
    $("stErr").hidden = which !== "err";
    $("again").hidden = which === "busy" || !which;
  }
  function track(id) {
    view("busy");
    setStep(2);
    clearTimeout(timer);
    const poll = async () => {
      try {
        const r = await fetch(API + "/jobs/" + id, { cache: "no-store" });
        const d = await r.json();
        if (!d.ok) throw new Error(d.error || "שגיאה");
        if (d.status === "done") {
          view("done");
          $("doneTitle").textContent = "האפליקציה \\u201C" + d.appName + "\\u201D מוכנה";
          $("doneInfo").textContent = "גרסה " + d.version + " · " + Math.max(1, Math.round(d.size / 1024)) + " KB";
          $("dl").href = d.download;
          return;
        }
        if (d.status === "error") {
          view("err");
          $("errMsg").textContent = d.error || "הבנייה נכשלה";
          store.set("apkJob", null);
          return;
        }
        setStep(d.status === "building" ? 3 : 2);
        $("stTime").textContent = "עברו " + Math.floor(d.elapsed / 60) + ":" + String(d.elapsed % 60).padStart(2, "0") + " דקות";
      } catch (err) {
        if (String(err.message).includes("לא נמצאה")) { store.set("apkJob", null); view(null); return; }
      }
      timer = setTimeout(poll, 4000);
    };
    poll();
  }
  $("again").onclick = () => { clearTimeout(timer); store.set("apkJob", null); view(null); };

  const last = store.get("apkJob");
  if (last && /^[a-f0-9]{24}$/.test(last)) track(last);
})();
</script>
</body>
</html>`;
}
