export const SCHEMA_SQL = [
  `CREATE TABLE IF NOT EXISTS listings (
    id TEXT PRIMARY KEY,
    brand TEXT NOT NULL,
    model TEXT NOT NULL,
    size TEXT NOT NULL,
    price REAL NOT NULL,
    remaining INTEGER NOT NULL,
    dot INTEGER NOT NULL,
    city TEXT NOT NULL,
    region TEXT NOT NULL,
    source TEXT NOT NULL,
    condition TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    delivery REAL NOT NULL,
    cost REAL NOT NULL,
    sell_price REAL NOT NULL,
    profit REAL NOT NULL,
    roi REAL NOT NULL,
    score INTEGER NOT NULL,
    status TEXT NOT NULL,
    image TEXT NOT NULL,
    url TEXT NOT NULL,
    notes TEXT NOT NULL,
    found_at TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS searches (
    id TEXT PRIMARY KEY,
    query_json TEXT NOT NULL,
    last_query TEXT NOT NULL,
    created_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS user_items (
    listing_id TEXT NOT NULL,
    kind TEXT NOT NULL CHECK (kind IN ('saved', 'stock', 'work')),
    created_at TEXT NOT NULL,
    PRIMARY KEY (listing_id, kind)
  )`,
  `CREATE TABLE IF NOT EXISTS agent_logs (
    id TEXT PRIMARY KEY,
    text TEXT NOT NULL,
    done INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS app_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS idx_listings_size ON listings(size)`,
  `CREATE INDEX IF NOT EXISTS idx_listings_score ON listings(score)`,
  `CREATE INDEX IF NOT EXISTS idx_user_items_kind ON user_items(kind)`,
  `CREATE INDEX IF NOT EXISTS idx_searches_created ON searches(created_at)`,
]
