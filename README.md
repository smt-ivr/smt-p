# smt-p — כל הפרויקטים של SMT

אתר קישורים לכל הפרויקטים, בכתובת **https://smti.uk/p**.

- Cloudflare Worker (`src/index.js`), בלי שלב build.
- מסד נתונים: D1 הקיים `drive-pro`. הפרויקט משתמש **רק** בטבלה חדשה `p_links` ולא נוגע בשאר הטבלאות.
- ניהול: לחיצה על המנעול → סיסמא (`ADMIN_PASSWORD` ב-`wrangler.toml`) → הוספה/הסרה של קישורים.
- בהוספה: כותבים נתיב (למשל `zmanim` → `https://smti.uk/zmanim`) או כל קישור אחר, והשם, התיאור והאייקון ממולאים אוטומטית מהאתר.

## פריסה

```bash
npm install
npx wrangler deploy
```

או דרך GitHub Actions (`.github/workflows/deploy.yml`) בדחיפה ל-`main`, אם מוגדרים הסודות `CLOUDFLARE_API_TOKEN` ו-`CLOUDFLARE_ACCOUNT_ID`.
