-- New table only. Does not touch any existing table in drive-pro.
CREATE TABLE IF NOT EXISTS p_links (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  url TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  icon TEXT DEFAULT '',
  sort INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);
