package uk.smti.webapp;

import android.content.Context;
import android.content.SharedPreferences;
import android.net.Uri;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

/**
 * The app's settings. Defaults come from assets/config.json (written at build time);
 * changes made in the PIN-protected settings screen are saved in SharedPreferences
 * and take priority. "Restore defaults" just clears those preferences.
 */
public final class Config {

    public static final class Site {
        public String title;
        public String url;
        /** When true only URLs under this site's path are allowed, not the whole domain. */
        public boolean restrictPath;

        public Site(String title, String url, boolean restrictPath) {
            this.title = title;
            this.url = url;
            this.restrictPath = restrictPath;
        }
    }

    /** One allow rule: a host (subdomains included) and an optional path prefix. */
    private static final class Rule {
        final String host;
        final String pathPrefix;

        Rule(String host, String pathPrefix) {
            this.host = host;
            this.pathPrefix = pathPrefix;
        }
    }

    private static final String PREFS = "app_settings";
    private static final String K_SITES = "sites";
    private static final String K_EXTRA = "extra";
    private static final String K_PIN_HASH = "pin_hash";
    private static final String K_PIN_SALT = "pin_salt";
    private static final String K_FAILS = "pin_fails";
    private static final String K_LOCK_UNTIL = "pin_lock_until";

    public final List<Site> sites = new ArrayList<>();
    public final List<String> extraDomains = new ArrayList<>();
    public String orientation = "auto";
    private String pinSalt = "";
    private String pinHash = "";
    private final List<Rule> rules = new ArrayList<>();

    private final SharedPreferences prefs;
    private JSONObject defaults;

    public Config(Context ctx) {
        prefs = ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        try {
            defaults = new JSONObject(readAsset(ctx, "config.json"));
        } catch (Exception e) {
            try {
                defaults = new JSONObject(readAsset(ctx, "config.example.json"));
            } catch (Exception e2) {
                defaults = new JSONObject();
            }
        }
        load();
    }

    private void load() {
        sites.clear();
        extraDomains.clear();
        orientation = defaults.optString("orientation", "auto");

        JSONArray s = parseArray(prefs.getString(K_SITES, null));
        if (s == null) s = defaults.optJSONArray("sites");
        if (s != null) {
            for (int i = 0; i < s.length(); i++) {
                JSONObject o = s.optJSONObject(i);
                if (o == null) continue;
                String url = normalizeUrl(o.optString("url"));
                if (url == null) continue;
                String title = o.optString("title", "").trim();
                if (title.isEmpty()) title = hostOf(url);
                sites.add(new Site(title, url, o.optBoolean("restrictPath", false)));
            }
        }

        JSONArray x = parseArray(prefs.getString(K_EXTRA, null));
        if (x == null) x = defaults.optJSONArray("extraDomains");
        if (x != null) {
            for (int i = 0; i < x.length(); i++) {
                String d = x.optString(i, "").trim();
                if (!d.isEmpty()) extraDomains.add(d);
            }
        }

        pinSalt = prefs.getString(K_PIN_SALT, defaults.optString("pinSalt", ""));
        pinHash = prefs.getString(K_PIN_HASH, defaults.optString("pinHash", ""));
        buildRules();
    }

    private void buildRules() {
        rules.clear();
        for (Site site : sites) {
            Uri u = Uri.parse(site.url);
            String path = site.restrictPath ? dirOf(u.getPath()) : "";
            rules.add(new Rule(baseHost(u.getHost()), path));
        }
        for (String d : extraDomains) {
            String url = normalizeUrl(d);
            if (url == null) continue;
            Uri u = Uri.parse(url);
            String p = u.getPath();
            rules.add(new Rule(baseHost(u.getHost()), p == null || p.equals("/") ? "" : p));
        }
    }

    /** Is this URL inside one of the allowed sites? */
    public boolean isAllowed(String url) {
        if (url == null) return false;
        if (url.startsWith("about:blank") || url.startsWith("data:") || url.startsWith("blob:")) return true;
        Uri u = Uri.parse(url);
        String scheme = u.getScheme();
        if (scheme == null) return false;
        scheme = scheme.toLowerCase(Locale.ROOT);
        if (!scheme.equals("http") && !scheme.equals("https")) return false;
        String host = u.getHost();
        if (host == null) return false;
        host = host.toLowerCase(Locale.ROOT);
        String path = u.getPath() == null ? "/" : u.getPath();
        for (Rule r : rules) {
            boolean hostOk = host.equals(r.host) || host.endsWith("." + r.host);
            if (!hostOk) continue;
            if (r.pathPrefix.isEmpty() || path.startsWith(r.pathPrefix)
                    || (path + "/").equals(r.pathPrefix)) {
                return true;
            }
        }
        return false;
    }

    // ---------- PIN ----------

    public boolean hasPin() {
        return !pinHash.isEmpty();
    }

    /** Milliseconds left before another PIN attempt is allowed, 0 if none. */
    public long lockRemaining() {
        return Math.max(0, prefs.getLong(K_LOCK_UNTIL, 0) - System.currentTimeMillis());
    }

    public boolean checkPin(String pin) {
        if (lockRemaining() > 0) return false;
        boolean ok = hash(pinSalt, pin).equalsIgnoreCase(pinHash);
        if (ok) {
            prefs.edit().putInt(K_FAILS, 0).apply();
        } else {
            int fails = prefs.getInt(K_FAILS, 0) + 1;
            SharedPreferences.Editor e = prefs.edit().putInt(K_FAILS, fails);
            // After every 5 wrong attempts wait one minute, doubling each time.
            if (fails % 5 == 0) {
                long wait = 60_000L << Math.min(6, fails / 5 - 1);
                e.putLong(K_LOCK_UNTIL, System.currentTimeMillis() + wait);
            }
            e.apply();
        }
        return ok;
    }

    public void setPin(String pin) {
        byte[] b = new byte[16];
        new SecureRandom().nextBytes(b);
        String salt = toHex(b);
        prefs.edit().putString(K_PIN_SALT, salt).putString(K_PIN_HASH, hash(salt, pin)).apply();
        pinSalt = salt;
        pinHash = hash(salt, pin);
    }

    // ---------- saving from the settings screen ----------

    public void save(List<Site> newSites, List<String> newExtra) {
        try {
            JSONArray s = new JSONArray();
            for (Site site : newSites) {
                s.put(new JSONObject().put("title", site.title).put("url", site.url)
                        .put("restrictPath", site.restrictPath));
            }
            JSONArray x = new JSONArray();
            for (String d : newExtra) x.put(d);
            prefs.edit().putString(K_SITES, s.toString()).putString(K_EXTRA, x.toString()).apply();
        } catch (Exception ignored) {
        }
        load();
    }

    /** Back to the sites and PIN that were built into the app. */
    public void restoreDefaults() {
        prefs.edit().remove(K_SITES).remove(K_EXTRA).remove(K_PIN_HASH).remove(K_PIN_SALT).apply();
        load();
    }

    // ---------- helpers ----------

    /** Accepts "example.com", "www.example.com/path" or a full URL. Returns null if invalid. */
    public static String normalizeUrl(String in) {
        if (in == null) return null;
        String s = in.trim();
        if (s.isEmpty()) return null;
        if (!s.matches("(?i)^https?://.*")) s = "https://" + s;
        Uri u = Uri.parse(s);
        String host = u.getHost();
        if (host == null || !host.contains(".") || host.contains(" ")) return null;
        if (u.getPath() == null || u.getPath().isEmpty()) s = s + "/";
        return s;
    }

    public static String hostOf(String url) {
        String h = Uri.parse(url).getHost();
        return h == null ? url : h;
    }

    /** "www.example.com" -> "example.com", so the bare domain and all its subdomains are allowed. */
    private static String baseHost(String host) {
        if (host == null) return "";
        host = host.toLowerCase(Locale.ROOT);
        return host.startsWith("www.") ? host.substring(4) : host;
    }

    /** "/shiurim/page.html" -> "/shiurim/" ; "/shiurim" -> "/shiurim" */
    private static String dirOf(String path) {
        if (path == null || path.isEmpty() || path.equals("/")) return "";
        int slash = path.lastIndexOf('/');
        String last = path.substring(slash + 1);
        if (last.contains(".")) return path.substring(0, slash + 1);
        return path;
    }

    private static JSONArray parseArray(String s) {
        if (s == null) return null;
        try {
            return new JSONArray(s);
        } catch (Exception e) {
            return null;
        }
    }

    private static String readAsset(Context ctx, String name) throws Exception {
        try (InputStream in = ctx.getAssets().open(name)) {
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            byte[] buf = new byte[4096];
            int n;
            while ((n = in.read(buf)) > 0) out.write(buf, 0, n);
            return out.toString("UTF-8");
        }
    }

    static String hash(String salt, String pin) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            return toHex(md.digest((salt + pin).getBytes(StandardCharsets.UTF_8)));
        } catch (Exception e) {
            return "";
        }
    }

    private static String toHex(byte[] b) {
        StringBuilder sb = new StringBuilder();
        for (byte x : b) sb.append(String.format("%02x", x));
        return sb.toString();
    }
}
