import { LISTINGS } from '../src/data/listings'
import { applySearch, sortListings } from '../src/lib/filter'
import { agentSearchFromSettings, huntQueryLabel } from '../src/lib/geo'
import { isLiveAdUrl } from '../src/lib/listingUrl'
import { listingToRow, rowToListing, type ListingRow } from '../src/lib/listingMap'
import {
  DEFAULT_SETTINGS,
  type HunterSettings,
  type SearchFilters,
  type SortKey,
  type TireListing,
} from '../src/types'
import type { D1Database } from './env'
import { huntMarketplaces } from './hunt'
import { SCHEMA_SQL } from './schema'

const SEED_ITEMS: Array<{ listing_id: string; kind: 'saved' | 'stock' | 'work' }> = [
  { listing_id: 'gt-001', kind: 'saved' },
  { listing_id: 'gt-006', kind: 'saved' },
  { listing_id: 'gt-010', kind: 'saved' },
  { listing_id: 'gt-012', kind: 'stock' },
  { listing_id: 'gt-001', kind: 'work' },
]

const INSERT_LISTING = `INSERT OR IGNORE INTO listings (
  id, brand, model, size, price, remaining, dot, city, region, source, condition,
  quantity, delivery, cost, sell_price, profit, roi, score, status, image, url, notes,
  found_at, created_at, updated_at
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`

const UPSERT_LIVE_LISTING = `INSERT INTO listings (
  id, brand, model, size, price, remaining, dot, city, region, source, condition,
  quantity, delivery, cost, sell_price, profit, roi, score, status, image, url, notes,
  found_at, created_at, updated_at
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
ON CONFLICT(id) DO UPDATE SET
  brand = excluded.brand,
  model = excluded.model,
  size = excluded.size,
  price = excluded.price,
  remaining = excluded.remaining,
  dot = excluded.dot,
  city = excluded.city,
  region = excluded.region,
  source = excluded.source,
  condition = excluded.condition,
  quantity = excluded.quantity,
  delivery = excluded.delivery,
  cost = excluded.cost,
  sell_price = excluded.sell_price,
  profit = excluded.profit,
  roi = excluded.roi,
  score = excluded.score,
  status = excluded.status,
  image = excluded.image,
  url = excluded.url,
  notes = excluded.notes,
  found_at = excluded.found_at,
  updated_at = excluded.updated_at`

export async function ensureSchema(db: D1Database): Promise<void> {
  for (const sql of SCHEMA_SQL) {
    await db.prepare(sql).run()
  }
}

async function insertListing(db: D1Database, listing: TireListing, now: string): Promise<boolean> {
  const mapped = listingToRow(listing, now)
  const result = await db
    .prepare(INSERT_LISTING)
    .bind(
      mapped.id,
      mapped.brand,
      mapped.model,
      mapped.size,
      mapped.price,
      mapped.remaining,
      mapped.dot,
      mapped.city,
      mapped.region,
      mapped.source,
      mapped.condition,
      mapped.quantity,
      mapped.delivery,
      mapped.cost,
      mapped.sell_price,
      mapped.profit,
      mapped.roi,
      mapped.score,
      mapped.status,
      mapped.image,
      mapped.url,
      mapped.notes,
      mapped.found_at,
      mapped.created_at,
      mapped.updated_at,
    )
    .run()
  return Number(result.meta?.changes ?? 0) > 0
}

export async function seedMissingListings(db: D1Database): Promise<number> {
  const now = new Date().toISOString()
  let added = 0
  for (const listing of LISTINGS) {
    if (await insertListing(db, listing, now)) added += 1
  }
  return added
}

function listingBindValues(listing: TireListing, now: string) {
  const mapped = listingToRow(listing, now)
  return [
    mapped.id,
    mapped.brand,
    mapped.model,
    mapped.size,
    mapped.price,
    mapped.remaining,
    mapped.dot,
    mapped.city,
    mapped.region,
    mapped.source,
    mapped.condition,
    mapped.quantity,
    mapped.delivery,
    mapped.cost,
    mapped.sell_price,
    mapped.profit,
    mapped.roi,
    mapped.score,
    mapped.status,
    mapped.image,
    mapped.url,
    mapped.notes,
    mapped.found_at,
    mapped.created_at,
    mapped.updated_at,
  ]
}

export async function upsertLiveListings(db: D1Database, listings: TireListing[]): Promise<number> {
  const now = new Date().toISOString()
  let saved = 0
  for (const listing of listings) {
    if (!listing.id.startsWith('live-') || !isLiveAdUrl(listing.url)) continue
    const result = await db.prepare(UPSERT_LIVE_LISTING).bind(...listingBindValues(listing, now)).run()
    if (Number(result.meta?.changes ?? 0) > 0) saved += 1
  }
  return saved
}

export async function syncListingUrls(db: D1Database): Promise<number> {
  const now = new Date().toISOString()
  let updated = 0
  for (const listing of LISTINGS) {
    if (listing.id.startsWith('live-') || isLiveAdUrl(listing.url)) continue
    const result = await db
      .prepare(
        `UPDATE listings SET url = ?, updated_at = ?
         WHERE id = ? AND url != ?
           AND id NOT LIKE 'live-%'
           AND url NOT LIKE '%/ua/p%'
           AND url NOT LIKE '%/--%'
           AND url NOT LIKE '%/obyavlenie/%ID%'`,
      )
      .bind(listing.url, now, listing.id, listing.url)
      .run()
    if (Number(result.meta?.changes ?? 0) > 0) updated += 1
  }
  return updated
}

export async function seedIfEmpty(db: D1Database): Promise<void> {
  const row = await db.prepare('SELECT COUNT(*) AS count FROM listings').first<{ count: number }>()
  const count = Number(row?.count ?? 0)
  const now = new Date().toISOString()
  const added = await seedMissingListings(db)
  const synced = await syncListingUrls(db)
  if (count > 0) {
    const notes: string[] = []
    if (added > 0) notes.push(`+${added} оголошень`)
    if (synced > 0) notes.push(`${synced} живих посилань`)
    if (notes.length) {
      await writeAgentLogs(db, [`Каталог оновлено: ${notes.join(', ')}, разом ${count + added}`])
    }
    return
  }

  for (const item of SEED_ITEMS) {
    await db
      .prepare('INSERT OR IGNORE INTO user_items (listing_id, kind, created_at) VALUES (?, ?, ?)')
      .bind(item.listing_id, item.kind, now)
      .run()
  }

  const starterLogs = [
    'Каталог D1 засіяно: 36 перевірені оголошення',
    'gt-001 MICHELIN X MULTIWAY зафіксовано як hero-угоду',
    'Живі маркетплейси: спроба fetch + чесний фолбек у каталог',
    'Збережено 3 позиції, склад 1, у роботі 1',
  ]
  for (const [index, text] of starterLogs.entries()) {
    await db
      .prepare('INSERT OR IGNORE INTO agent_logs (id, text, done, created_at) VALUES (?, ?, 1, ?)')
      .bind(`seed-${index + 1}`, text, now)
      .run()
  }

  await seedDefaultSettings(db, now)
}

async function seedDefaultSettings(db: D1Database, now = new Date().toISOString()): Promise<void> {
  const entries: Array<[string, string]> = [
    ['radius', String(DEFAULT_SETTINGS.radius)],
    ['minScore', String(DEFAULT_SETTINGS.minScore)],
    ['notify', DEFAULT_SETTINGS.notify ? '1' : '0'],
    ['agentRunning', DEFAULT_SETTINGS.agentRunning ? '1' : '0'],
    ['defaultSize', DEFAULT_SETTINGS.defaultSize],
    ['defaultRegion', DEFAULT_SETTINGS.defaultRegion],
  ]
  for (const [key, value] of entries) {
    await db
      .prepare('INSERT OR IGNORE INTO app_settings (key, value, updated_at) VALUES (?, ?, ?)')
      .bind(key, value, now)
      .run()
  }
}

export async function initDb(db: D1Database): Promise<void> {
  await ensureSchema(db)
  await seedIfEmpty(db)
  await seedDefaultSettings(db)
}

export async function listAll(db: D1Database): Promise<TireListing[]> {
  const result = await db.prepare('SELECT * FROM listings').all<ListingRow>()
  return (result.results ?? []).map(rowToListing)
}

export function filterListings(
  listings: TireListing[],
  query: {
    size?: string
    brand?: string
    condition?: string
    minRemaining?: number
    maxPrice?: number
    region?: string
    radius?: number
    sources?: string[]
    sort?: SortKey
  },
): TireListing[] {
  const search: SearchFilters = {
    size: query.size ?? '',
    brand: query.brand && query.brand !== 'Будь-який' ? query.brand : 'Будь-який',
    condition:
      query.condition === 'Нова' || query.condition === 'Б/В' ? query.condition : 'Будь-який',
    minRemaining: query.minRemaining ?? 0,
    maxPrice: query.maxPrice ?? Number.MAX_SAFE_INTEGER,
    quantity: 1,
    region: query.region && query.region !== 'Україна' ? query.region : 'Україна',
    radius: query.radius ?? 800,
    sources: (query.sources?.length
      ? query.sources
      : ['OLX', 'Prom', 'Autoline', 'Truck1', 'TyreClub', 'Atlant', 'Інші']) as SearchFilters['sources'],
  }
  return sortListings(applySearch(listings, search), query.sort ?? 'best')
}

export async function getListing(db: D1Database, id: string): Promise<TireListing | null> {
  const row = await db.prepare('SELECT * FROM listings WHERE id = ?').bind(id).first<ListingRow>()
  return row ? rowToListing(row) : null
}

export async function addUserItem(
  db: D1Database,
  listingId: string,
  kind: 'saved' | 'stock' | 'work',
): Promise<TireListing | null> {
  const listing = await getListing(db, listingId)
  if (!listing) return null
  await db
    .prepare('INSERT OR IGNORE INTO user_items (listing_id, kind, created_at) VALUES (?, ?, ?)')
    .bind(listingId, kind, new Date().toISOString())
    .run()
  return listing
}

export async function removeUserItem(
  db: D1Database,
  listingId: string,
  kind: 'saved' | 'stock' | 'work',
): Promise<TireListing | null> {
  const listing = await getListing(db, listingId)
  if (!listing) return null
  await db.prepare('DELETE FROM user_items WHERE listing_id = ? AND kind = ?').bind(listingId, kind).run()
  return listing
}

function clamp(value: number, min: number, max: number, fallback: number): number {
  if (!Number.isFinite(value)) return fallback
  return Math.min(max, Math.max(min, value))
}

export async function getSettings(db: D1Database): Promise<HunterSettings> {
  const result = await db.prepare('SELECT key, value FROM app_settings').all<{ key: string; value: string }>()
  const map = new Map((result.results ?? []).map((row) => [row.key, row.value]))
  return {
    radius: clamp(Number(map.get('radius')), 50, 800, DEFAULT_SETTINGS.radius),
    minScore: clamp(Number(map.get('minScore')), 50, 95, DEFAULT_SETTINGS.minScore),
    notify: (map.get('notify') ?? '1') !== '0',
    agentRunning: (map.get('agentRunning') ?? '1') !== '0',
    defaultSize: map.get('defaultSize') || DEFAULT_SETTINGS.defaultSize,
    defaultRegion: map.get('defaultRegion') || DEFAULT_SETTINGS.defaultRegion,
  }
}

export async function saveSettings(db: D1Database, patch: Partial<HunterSettings>): Promise<HunterSettings> {
  const current = await getSettings(db)
  const next: HunterSettings = {
    radius: clamp(Number(patch.radius ?? current.radius), 50, 800, current.radius),
    minScore: clamp(Number(patch.minScore ?? current.minScore), 50, 95, current.minScore),
    notify: typeof patch.notify === 'boolean' ? patch.notify : current.notify,
    agentRunning: typeof patch.agentRunning === 'boolean' ? patch.agentRunning : current.agentRunning,
    defaultSize: (patch.defaultSize || current.defaultSize).trim() || current.defaultSize,
    defaultRegion: (patch.defaultRegion || current.defaultRegion).trim() || current.defaultRegion,
  }
  const now = new Date().toISOString()
  const entries: Array<[string, string]> = [
    ['radius', String(next.radius)],
    ['minScore', String(next.minScore)],
    ['notify', next.notify ? '1' : '0'],
    ['agentRunning', next.agentRunning ? '1' : '0'],
    ['defaultSize', next.defaultSize],
    ['defaultRegion', next.defaultRegion],
  ]
  for (const [key, value] of entries) {
    await db
      .prepare(
        'INSERT INTO app_settings (key, value, updated_at) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at',
      )
      .bind(key, value, now)
      .run()
  }
  return next
}

export async function setAgentRunning(db: D1Database, running: boolean): Promise<HunterSettings> {
  return saveSettings(db, { agentRunning: running })
}

export async function pipelineIds(db: D1Database): Promise<{
  savedIds: string[]
  stockIds: string[]
  workIds: string[]
}> {
  const result = await db.prepare('SELECT listing_id, kind FROM user_items').all<{
    listing_id: string
    kind: string
  }>()
  const savedIds: string[] = []
  const stockIds: string[] = []
  const workIds: string[] = []
  for (const row of result.results ?? []) {
    if (row.kind === 'saved') savedIds.push(row.listing_id)
    if (row.kind === 'stock') stockIds.push(row.listing_id)
    if (row.kind === 'work') workIds.push(row.listing_id)
  }
  return { savedIds, stockIds, workIds }
}

export async function recordSearch(db: D1Database, filters: SearchFilters, lastQuery: string): Promise<void> {
  await db
    .prepare('INSERT INTO searches (id, query_json, last_query, created_at) VALUES (?, ?, ?, ?)')
    .bind(crypto.randomUUID(), JSON.stringify(filters), lastQuery, new Date().toISOString())
    .run()
}

export async function lastSearchQuery(db: D1Database): Promise<string> {
  const row = await db
    .prepare('SELECT last_query FROM searches ORDER BY created_at DESC LIMIT 1')
    .first<{ last_query: string }>()
  if (row?.last_query) return row.last_query
  return huntQueryLabel(await getSettings(db))
}

export async function searchCount(db: D1Database): Promise<number> {
  const row = await db.prepare('SELECT COUNT(*) AS count FROM searches').first<{ count: number }>()
  return Number(row?.count ?? 0)
}

export async function writeAgentLogs(db: D1Database, lines: string[]): Promise<void> {
  const now = Date.now()
  for (const [index, text] of lines.entries()) {
    await db
      .prepare('INSERT INTO agent_logs (id, text, done, created_at) VALUES (?, ?, 1, ?)')
      .bind(`run-${now}-${index}`, text, new Date(now + index).toISOString())
      .run()
  }
}

export async function recentLogs(db: D1Database, limit = 12): Promise<Array<{ id: string; text: string; done: boolean }>> {
  const result = await db
    .prepare('SELECT id, text, done, created_at FROM agent_logs ORDER BY created_at DESC LIMIT ?')
    .bind(limit)
    .all<{ id: string; text: string; done: number }>()
  return (result.results ?? []).reverse().map((row) => ({
    id: row.id,
    text: row.text,
    done: Boolean(row.done),
  }))
}

const AGENT_TICK_MS = 8_000

export async function getSettingValue(db: D1Database, key: string): Promise<string | null> {
  const row = await db.prepare('SELECT value FROM app_settings WHERE key = ?').bind(key).first<{ value: string }>()
  return row?.value ?? null
}

export async function putSettingValue(db: D1Database, key: string, value: string): Promise<void> {
  await db
    .prepare(
      'INSERT INTO app_settings (key, value, updated_at) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at',
    )
    .bind(key, value, new Date().toISOString())
    .run()
}

const LIVE_HUNT_MS = 45_000

export async function refreshLiveHunt(db: D1Database, size: string) {
  const hunted = await huntMarketplaces(size || '385/65 R22.5')
  const saved = await upsertLiveListings(db, hunted.listings)
  return { ...hunted, saved }
}

export async function maybeRefreshLiveHunt(db: D1Database, size: string, options?: { force?: boolean }) {
  const last = await getSettingValue(db, 'lastLiveHuntAt')
  const age = last ? Date.now() - Date.parse(last) : Number.POSITIVE_INFINITY
  if (!options?.force && Number.isFinite(age) && age < LIVE_HUNT_MS) {
    return { listings: [] as TireListing[], sources: [], saved: 0, skipped: true }
  }
  const result = await refreshLiveHunt(db, size)
  await putSettingValue(db, 'lastLiveHuntAt', new Date().toISOString())
  return { ...result, skipped: false }
}

export async function huntListings(db: D1Database) {
  const current = await getSettings(db)
  const catalog = await listAll(db)
  const huntedAll = sortListings(applySearch(catalog, agentSearchFromSettings(current)), 'best')
  const live = huntedAll.filter((item) => item.id.startsWith('live-') && isLiveAdUrl(item.url))
  const hunted = live.length ? live : huntedAll
  const suitable = hunted.filter((item) => item.score >= current.minScore)
  const rejected = hunted.filter((item) => item.score < current.minScore)
  const scannedAt = (await getSettingValue(db, 'lastScanAt')) || new Date().toISOString()
  return {
    settings: current,
    hunted,
    suitable,
    rejected,
    nextAction: suitable[0] ?? hunted[0] ?? null,
    catalog,
    scannedAt,
    lastQuery: huntQueryLabel(current),
  }
}

export async function tickAgent(db: D1Database, options?: { force?: boolean }) {
  const settings = await getSettings(db)
  if (!settings.agentRunning && !options?.force) {
    const hunt = await huntListings(db)
    return { ...hunt, ticked: false, cycle: Number((await getSettingValue(db, 'agentCycle')) || 0) }
  }

  const lastScanAt = await getSettingValue(db, 'lastScanAt')
  const age = lastScanAt ? Date.now() - Date.parse(lastScanAt) : Number.POSITIVE_INFINITY
  if (!options?.force && Number.isFinite(age) && age < AGENT_TICK_MS) {
    const hunt = await huntListings(db)
    return { ...hunt, scannedAt: lastScanAt || hunt.scannedAt, ticked: false, cycle: Number((await getSettingValue(db, 'agentCycle')) || 0) }
  }

  const live = await maybeRefreshLiveHunt(db, settings.defaultSize, { force: options?.force })
  const hunt = await huntListings(db)
  const now = new Date().toISOString()
  const cycle = Number((await getSettingValue(db, 'agentCycle')) || 0) + 1
  const next = hunt.nextAction
  const nextLabel = next
    ? `${next.brand} ${next.model} · ${next.city} · score ${next.score}`
    : 'немає наступної дії'
  const liveNote = live.skipped
    ? 'живий hunt пропущено (свіжий кеш)'
    : `живих карток ${live.listings.length}, записано ${live.saved}`
  await writeAgentLogs(db, [
    `Скан #${cycle}: ${hunt.lastQuery}`,
    `Маркетплейси: ${liveNote}`,
    `Знайдено ${hunt.hunted.length} · підходить ${hunt.suitable.length} · відсіяно ${hunt.rejected.length}`,
    `Наступна дія: ${nextLabel}`,
  ])
  await putSettingValue(db, 'lastScanAt', now)
  await putSettingValue(db, 'agentCycle', String(cycle))
  return { ...hunt, scannedAt: now, ticked: true, cycle }
}

export async function listVisible(db: D1Database): Promise<TireListing[]> {
  const catalog = await listAll(db)
  const live = catalog.filter((item) => item.id.startsWith('live-') && isLiveAdUrl(item.url))
  return live.length ? live : catalog
}

export async function kpiFromDb(db: D1Database) {
  const hunt = await huntListings(db)
  const best = hunt.hunted.filter((item) => item.score >= 90)
  return {
    foundToday: hunt.hunted.length,
    bestDeals: best.length,
    potentialProfit: hunt.suitable.reduce((sum, item) => sum + item.profit, 0),
    activeSearches: hunt.settings.agentRunning ? Math.max(1, await searchCount(db)) : 0,
  }
}
