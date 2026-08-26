import { applyResultFilters, sortListings } from '../src/lib/filter'
import type { HunterSettings, SearchFilters, SortKey, Source } from '../src/types'
import { huntQueryLabel } from '../src/lib/geo'
import {
  addUserItem,
  filterListings,
  getListing,
  getSettings,
  huntListings,
  initDb,
  kpiFromDb,
  tickAgent,
  listAll,
  listVisible,
  maybeRefreshLiveHunt,
  refreshLiveHunt,
  pipelineIds,
  recentLogs,
  recordSearch,
  removeUserItem,
  saveSettings,
  searchCount,
  setAgentRunning,
  writeAgentLogs,
} from './db'
import type { D1Database } from './env'
import { aiAnalyzeListings } from './ai'
import { probeSources, sourceProgress } from './sources'
import { suppliersWithLiveStatus } from './suppliers'

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    },
  })

function parseSources(value: string | null): Source[] | undefined {
  if (!value) return undefined
  const parts = value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean) as Source[]
  return parts.length ? parts : undefined
}

function asSearch(body: Partial<SearchFilters> | null): SearchFilters {
  return {
    size: body?.size || '385/65 R22.5',
    brand: body?.brand || 'Будь-який',
    condition: body?.condition === 'Нова' || body?.condition === 'Б/В' ? body.condition : 'Будь-який',
    minRemaining: Number(body?.minRemaining ?? 70),
    maxPrice: Number(body?.maxPrice ?? 10000),
    quantity: Number(body?.quantity ?? 4),
    region: body?.region || 'Україна',
    radius: Number(body?.radius ?? 200),
    sources: (body?.sources?.length
      ? body.sources
      : ['OLX', 'Prom', 'Autoline', 'Truck1', 'TyreClub', 'Atlant', 'Інші']) as Source[],
  }
}

async function readJson<T>(request: Request): Promise<T | null> {
  try {
    return (await request.json()) as T
  } catch {
    return null
  }
}

export async function handleApi(request: Request, db: D1Database): Promise<Response | null> {
  const url = new URL(request.url)
  if (!url.pathname.startsWith('/api/')) return null

  await initDb(db)

  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'access-control-allow-origin': '*',
        'access-control-allow-methods': 'GET,POST,DELETE,OPTIONS',
        'access-control-allow-headers': 'content-type',
      },
    })
  }

  if (url.pathname === '/api/health' && request.method === 'GET') {
    const listings = await listAll(db)
    const settings = await getSettings(db)
    return json({
      ok: true,
      service: 'gt-tires-hunter',
      listings: listings.length,
      db: true,
      agentRunning: settings.agentRunning,
    })
  }

  if (url.pathname === '/api/listings' && request.method === 'GET') {
    const size = url.searchParams.get('size') || '385/65 R22.5'
    await maybeRefreshLiveHunt(db, size)
    const listings = filterListings(await listVisible(db), {
      size: url.searchParams.get('size') ?? undefined,
      brand: url.searchParams.get('brand') ?? undefined,
      condition: url.searchParams.get('condition') ?? undefined,
      minRemaining: url.searchParams.get('minRemaining')
        ? Number(url.searchParams.get('minRemaining'))
        : undefined,
      maxPrice: url.searchParams.get('maxPrice') ? Number(url.searchParams.get('maxPrice')) : undefined,
      region: url.searchParams.get('region') ?? undefined,
      radius: url.searchParams.get('radius') ? Number(url.searchParams.get('radius')) : undefined,
      sources: parseSources(url.searchParams.get('sources')),
      sort: (url.searchParams.get('sort') as SortKey) || 'best',
    })
    return json({ listings, total: listings.length })
  }

  const listingMatch = url.pathname.match(/^\/api\/listings\/([^/]+)(?:\/(save|stock|work|unsave|unstock|unwork))?$/)
  if (listingMatch && request.method === 'GET' && !listingMatch[2]) {
    const listing = await getListing(db, decodeURIComponent(listingMatch[1]))
    if (!listing) return json({ error: 'not_found' }, 404)
    return json({ listing })
  }

  if (listingMatch && request.method === 'POST' && listingMatch[2]) {
    const action = listingMatch[2]
    const mapped =
      action === 'save' || action === 'unsave'
        ? 'saved'
        : action === 'stock' || action === 'unstock'
          ? 'stock'
          : 'work'
    const listingId = decodeURIComponent(listingMatch[1])
    const listing = action.startsWith('un')
      ? await removeUserItem(db, listingId, mapped)
      : await addUserItem(db, listingId, mapped)
    if (!listing) return json({ error: 'not_found' }, 404)
    const pipeline = await pipelineIds(db)
    return json({ ok: true, action, listing, ...pipeline })
  }

  if (url.pathname === '/api/search' && request.method === 'POST') {
    const filters = asSearch(await readJson<Partial<SearchFilters>>(request))
    const liveHunt = await refreshLiveHunt(db, filters.size)
    const catalog = await listAll(db)
    const liveMatched = sortListings(
      filterListings(liveHunt.listings, {
        size: filters.size,
        brand: filters.brand,
        condition: filters.condition,
        minRemaining: 0,
        maxPrice: Number.MAX_SAFE_INTEGER,
        region: 'Україна',
        radius: 800,
        sources: filters.sources,
        sort: 'best',
      }),
      'best',
    )
    const seedMatched = sortListings(
      applyResultFilters(filterListings(catalog.filter((item) => !item.id.startsWith('live-')), filters), {
        priceMax: null,
        brand: '',
        remainingMin: null,
        dotMin: null,
        region: '',
        source: '',
        rating: '',
      }),
      'best',
    )
    const matched = liveMatched.length ? liveMatched : seedMatched
    const sourceStatuses = await probeSources(filters.sources)
    for (const src of liveHunt.sources) {
      const row = sourceStatuses.find((item) => item.name === src.name)
      if (!row) continue
      if (src.found > 0) {
        row.state = 'ok'
        row.httpStatus = 200
        row.detail = src.detail
      } else {
        row.detail = `${row.detail} · ${src.detail}`
      }
    }
    const lastQuery = `${filters.size} · ${filters.region} · ${filters.radius} км`
    await recordSearch(db, filters, lastQuery)
    await writeAgentLogs(db, [
      `Живий пошук ${lastQuery} · ${filters.sources.join(', ')}`,
      `Живі картки: ${liveMatched.length} · записано ${liveHunt.saved} · каталог ${catalog.length}`,
      ...sourceStatuses.map((item) => `${item.name}: ${item.state.toUpperCase()} — ${item.detail}`),
    ])
    return json({
      listings: matched,
      total: matched.length,
      catalogTotal: catalog.length,
      sourceStatuses,
      lastQuery,
      fallback: liveMatched.length === 0,
    })
  }

  if (url.pathname === '/api/ai/analyze' && request.method === 'POST') {
    const body = await readJson<{ size?: string; listingIds?: string[] }>(request)
    const size = body?.size || '385/65 R22.5'
    // Хантимо свіжі живі картки цього розміру (з 45s-кешем), аналізуємо їх
    const liveHunt = await maybeRefreshLiveHunt(db, size)
    let pool = liveHunt.listings
    if (!pool.length) {
      // Хант пропущено кешем — беремо живі картки з бази за цим розміром
      const all = await listAll(db)
      pool = all.filter((item) => item.id.startsWith('live-') && item.size === size)
      if (!pool.length) pool = all.filter((item) => item.size === size)
    }
    if (body?.listingIds?.length) {
      const wanted = new Set(body.listingIds)
      const all = await listAll(db)
      const picked = all.filter((item) => wanted.has(item.id))
      if (picked.length) pool = picked
    }
    pool = sortListings(pool, 'best')
    const result = await aiAnalyzeListings(pool, size)
    await writeAgentLogs(db, [
      `AI Genspark аналіз ${size}: ${pool.length} оголошень · модель ${result.model}`,
    ])
    return json({ ...result, size, analyzed: Math.min(pool.length, 14) })
  }

  if (url.pathname === '/api/suppliers' && request.method === 'GET') {
    const fresh = url.searchParams.get('fresh') === '1'
    const { suppliers, checkedLive } = await suppliersWithLiveStatus({ fresh })
    const type = url.searchParams.get('type')
    const filtered =
      type && type !== 'всі' ? suppliers.filter((item) => item.type === type) : suppliers
    return json({
      suppliers: filtered,
      total: filtered.length,
      catalogTotal: suppliers.length,
      checkedLive,
      checkedAt: new Date().toISOString(),
    })
  }

  if (url.pathname === '/api/pipeline' && request.method === 'GET') {
    const listings = await listAll(db)
    const ids = await pipelineIds(db)
    const pick = (wanted: string[]) => listings.filter((item) => wanted.includes(item.id))
    return json({
      ...ids,
      saved: pick(ids.savedIds),
      stock: pick(ids.stockIds),
      work: pick(ids.workIds),
    })
  }

  if (url.pathname === '/api/kpi' && request.method === 'GET') {
    return json(await kpiFromDb(db))
  }

  if (url.pathname === '/api/agent' && request.method === 'GET') {
    const hunt = await tickAgent(db)
    const statuses = await probeSources(['OLX', 'Prom', 'Autoline', 'Truck1', 'TyreClub', 'Atlant', 'Інші'])
    const logs = await recentLogs(db, 16)
    const searches = await searchCount(db)
    return json({
      running: hunt.settings.agentRunning,
      lastQuery: hunt.lastQuery,
      found: hunt.hunted.length,
      duplicates: 0,
      rejected: hunt.rejected.length,
      suitable: hunt.suitable.length,
      top: hunt.hunted.filter((item) => item.score >= 90).length,
      hunted: hunt.hunted,
      nextAction: hunt.nextAction,
      scannedAt: hunt.scannedAt,
      ticked: hunt.ticked,
      cycle: hunt.cycle,
      searches,
      sources: sourceProgress(statuses),
      logs,
      sourceStatuses: statuses,
      settings: hunt.settings,
    })
  }

  if (url.pathname === '/api/agent/start' && request.method === 'POST') {
    const settings = await setAgentRunning(db, true)
    const hunt = await tickAgent(db, { force: true })
    return json({
      ok: true,
      running: true,
      settings,
      hunted: hunt.hunted,
      nextAction: hunt.nextAction,
      scannedAt: hunt.scannedAt,
      ticked: hunt.ticked,
      cycle: hunt.cycle,
    })
  }

  if (url.pathname === '/api/agent/stop' && request.method === 'POST') {
    const settings = await setAgentRunning(db, false)
    await writeAgentLogs(db, ['Агент зупинено користувачем.'])
    return json({ ok: true, running: false, settings })
  }

  if (url.pathname === '/api/settings' && request.method === 'GET') {
    return json({ settings: await getSettings(db) })
  }

  if (url.pathname === '/api/settings' && request.method === 'POST') {
    const body = await readJson<Partial<HunterSettings>>(request)
    const settings = await saveSettings(db, body ?? {})
    const hunt = await huntListings(db)
    await writeAgentLogs(db, [
      `Налаштування: ${huntQueryLabel(settings)} · minScore ${settings.minScore}`,
      `Полювання оновлено: ${hunt.hunted.length} у радіусі, ${hunt.suitable.length} підходять`,
    ])
    return json({ ok: true, settings, hunted: hunt.hunted, nextAction: hunt.nextAction })
  }

  return json({ error: 'not_found', path: url.pathname }, 404)
}
