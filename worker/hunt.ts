import { calcScore } from '../src/lib/score'
import type { Condition, Source, TireListing } from '../src/types'

export interface LiveHuntResult {
  listings: TireListing[]
  sources: Array<{ name: Source; found: number; detail: string }>
}

interface RawOffer {
  id: string
  source: Source
  url: string
  title: string
  price: number
  city: string
  region: string
  image: string
  condition: Condition
}

const BROWSER_HEADERS = {
  Accept: 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'uk-UA,uk;q=0.9,en;q=0.8',
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
}

const BRANDS = [
  'MICHELIN',
  'BRIDGESTONE',
  'GOODYEAR',
  'CONTINENTAL',
  'HANKOOK',
  'PIRELLI',
  'DUNLOP',
  'KORMORAN',
  'TRIANGLE',
  'SAILUN',
  'GITI',
  'LANVIGATOR',
  'JOYALL',
  'HIFLY',
  'BARUM',
  'APOLLO',
  'OTANI',
  'ONYX',
  'TORQUE',
  'FRONWAY',
  'MATADOR',
  'FALKEN',
  'NOKIAN',
  'TAURUS',
  'LEAO',
  'BARKLEY',
  'LONG MARCH',
  'TRAZANO',
  'ALLIANCE',
]

const CITY_ALIASES: Record<string, { city: string; region: string }> = {
  Київ: { city: 'Київ', region: 'Київська' },
  Киев: { city: 'Київ', region: 'Київська' },
  Львів: { city: 'Львів', region: 'Львівська' },
  Львов: { city: 'Львів', region: 'Львівська' },
  Одеса: { city: 'Одеса', region: 'Одеська' },
  Одесса: { city: 'Одеса', region: 'Одеська' },
  Дніпро: { city: 'Дніпро', region: 'Дніпропетровська' },
  Днепр: { city: 'Дніпро', region: 'Дніпропетровська' },
  Харків: { city: 'Харків', region: 'Харківська' },
  Харьков: { city: 'Харків', region: 'Харківська' },
  Вінниця: { city: 'Вінниця', region: 'Вінницька' },
  Полтава: { city: 'Полтава', region: 'Полтавська' },
  Запоріжжя: { city: 'Запоріжжя', region: 'Запорізька' },
  Черкаси: { city: 'Черкаси', region: 'Черкаська' },
  Рівне: { city: 'Рівне', region: 'Рівненська' },
  Житомир: { city: 'Житомир', region: 'Житомирська' },
  Чернігів: { city: 'Чернігів', region: 'Чернігівська' },
  Бровари: { city: 'Бровари', region: 'Київська' },
  Ірпінь: { city: 'Ірпінь', region: 'Київська' },
  Бориспіль: { city: 'Бориспіль', region: 'Київська' },
  Вишневе: { city: 'Київ', region: 'Київська' },
  Україна: { city: 'Київ', region: 'Київська' },
}

function decodeHtml(value: string): string {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#x2f;/gi, '/')
    .replace(/\s+/g, ' ')
    .trim()
}

function sizeCompact(size: string): string {
  const match = size.match(/(\d+)\s*\/\s*(\d+)\s*R\s*(\d+(?:[.,]\d+)?)/i)
  if (!match) return size.replace(/\s+/g, '').toLowerCase()
  return `${match[1]}${match[2]}r${match[3].replace(',', '').replace('.', '')}`.toLowerCase()
}

function sizePattern(size: string): RegExp {
  const match = size.match(/(\d+)\s*\/\s*(\d+)\s*R\s*(\d+(?:[.,]\d+)?)/i)
  if (!match) return new RegExp(size.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
  const a = match[1]
  const b = match[2]
  const c = match[3].replace(',', '.')
  return new RegExp(`${a}\\s*[/.]?\\s*${b}\\s*R?\\s*${c.replace('.', '[.,]?')}`, 'i')
}

export function promCatalogUrl(size: string): string {
  return `https://prom.ua/Shiny-${sizeCompact(size)}.html`
}

function mapPlace(raw: string): { city: string; region: string } {
  const cleaned = raw.replace(/^м\.\s*/i, '').trim()
  for (const [key, value] of Object.entries(CITY_ALIASES)) {
    if (cleaned.toLowerCase().includes(key.toLowerCase())) return value
  }
  return { city: 'Київ', region: 'Київська' }
}

function parseBrandModel(title: string): { brand: string; model: string } {
  const upper = title.toUpperCase()
  const brand = BRANDS.find((item) => upper.includes(item)) ?? 'NO NAME'
  let rest = title
  if (brand !== 'NO NAME') {
    const idx = upper.indexOf(brand)
    rest = `${title.slice(0, idx)} ${title.slice(idx + brand.length)}`.trim()
  }
  const model =
    rest
      .replace(/шина[иі]?/gi, '')
      .replace(/вантажн\w*/gi, '')
      .replace(/всесезонн\w*/gi, '')
      .replace(/кермов\w*/gi, '')
      .replace(/причіпн\w*|прицепн\w*/gi, '')
      .replace(/\d+\s*\/\s*\d+\s*R\s*\d+(?:[.,]\d+)?/gi, '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 42) || 'Truck tire'
  return { brand, model }
}

function looksUsed(title: string): boolean {
  return /б\/в|б\/у|бу\b|вживан/i.test(title)
}

function toListing(offer: RawOffer, size: string, index: number): TireListing {
  const { brand, model } = parseBrandModel(offer.title)
  const remaining = offer.condition === 'Нова' ? 100 : 78
  const dot = offer.condition === 'Нова' ? 2025 : 2022
  const delivery = 350
  const sellPrice = Math.max(offer.price + 1800, Math.round(offer.price * 1.22))
  const metrics = calcScore({
    brand,
    remaining,
    dot,
    condition: offer.condition,
    city: offer.city,
    source: offer.source,
    price: offer.price,
    sellPrice,
    delivery,
  })
  const now = new Date()
  const foundAt = `сьогодні ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
  return {
    id: offer.id,
    brand,
    model,
    size,
    price: offer.price,
    remaining,
    dot,
    city: offer.city,
    region: offer.region,
    source: offer.source,
    condition: offer.condition,
    quantity: 1,
    delivery,
    sellPrice,
    image: offer.image,
    url: offer.url,
    notes: `Живе оголошення ${offer.source}: ${offer.title.slice(0, 160)}`,
    foundAt,
    ...metrics,
    score: Math.min(99, metrics.score + (index === 0 ? 2 : 0)),
  }
}

async function fetchText(url: string): Promise<{ status: number; body: string }> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 8000)
  try {
    const response = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      headers: BROWSER_HEADERS,
      signal: controller.signal,
    })
    const body = await response.text()
    return { status: response.status, body }
  } finally {
    clearTimeout(timer)
  }
}

function extractNear(html: string, token: string, nearby = 2200): string {
  const idx = html.indexOf(token)
  if (idx < 0) return ''
  return html.slice(Math.max(0, idx - 400), idx + nearby)
}

function parsePrice(chunk: string): number {
  const patterns = [
    /"price"\s*:\s*"?(\d{3,6})/,
    /"minPrice"\s*:\s*"?(\d{3,6})/,
    /"amount"\s*:\s*"?(\d{3,6})/,
    /(\d[\d\s]{2,6})\s*₴/,
    /(\d[\d\s]{2,6})\s*грн/i,
  ]
  for (const pattern of patterns) {
    const match = chunk.match(pattern)
    if (!match) continue
    const value = Number(match[1].replace(/\s+/g, ''))
    if (value >= 800 && value <= 80000) return value
  }
  return 0
}

function parsePromOffers(html: string, size: string, requireSize = true): RawOffer[] {
  const matcher = sizePattern(size)
  const seen = new Map<string, RawOffer>()
  const hrefRe = /\/(?:ua\/)?p(\d{6,})-([a-z0-9-]+)\.html/gi
  let match: RegExpExecArray | null
  while ((match = hrefRe.exec(html))) {
    const productId = match[1]
    if (seen.has(productId)) continue
    const slug = match[2]
    const url = `https://prom.ua/ua/p${productId}-${slug}.html`
    const chunk = extractNear(html, productId)
    const titleMatch =
      chunk.match(/title="([^"]{8,180})"/) ||
      chunk.match(/"name"\s*:\s*"([^"]{8,180})"/) ||
      chunk.match(/alt="([^"]{8,180})"/)
    const title = decodeHtml(titleMatch?.[1] || slug.replace(/-/g, ' '))
    if (
      requireSize &&
      !matcher.test(title) &&
      !matcher.test(slug) &&
      !matcher.test(chunk.slice(0, 800))
    ) {
      continue
    }
    const regionMatch = chunk.match(/"regionName"\s*:\s*"([^"]+)"/)
    const place = mapPlace(regionMatch?.[1] || 'Україна')
    const imageMatch = chunk.match(/https:\/\/images\.prom\.ua\/\d+[^"' \s]+/)
    const image = imageMatch ? imageMatch[0].replace('_w200_h200_', '_w400_h400_') : '/tires/michelin.jpg'
    const price = parsePrice(chunk) || 12500
    seen.set(productId, {
      id: `live-prom-${productId}`,
      source: 'Prom',
      url,
      title,
      price,
      city: place.city,
      region: place.region,
      image,
      condition: looksUsed(title) ? 'Б/В' : 'Нова',
    })
    if (seen.size >= 24) break
  }
  return [...seen.values()]
}

function parseAutolineOffers(html: string, size: string): RawOffer[] {
  const matcher = sizePattern(size)
  const seen = new Map<string, RawOffer>()
  const hrefRe = /(?:https:\/\/autoline\.ua)?\/-\/(prodazh|aukcion)\/[^"?\s<>]+--(\d{10,})/gi
  let match: RegExpExecArray | null
  while ((match = hrefRe.exec(html))) {
    const adId = match[2]
    if (seen.has(adId)) continue
    const path = match[0].replace(/&amp;/g, '&')
    const url = path.startsWith('http') ? path : `https://autoline.ua${path}`
    const chunk = extractNear(html, adId)
    const nameMatch = chunk.match(/data-name="([^"]{6,180})"/) || chunk.match(/alt="([^"]{6,180})"/)
    const title = decodeHtml(nameMatch?.[1] || 'Вантажна шина')
    if (!matcher.test(title) && !matcher.test(url) && !matcher.test(chunk)) continue
    const loc = `${chunk} ${title}`
    if (/німеччин|germany|nederland|poland|франц|італ|чехі/i.test(loc) && !/україн/i.test(loc)) continue
    const imageMatch = chunk.match(/https:\/\/img\.linemedia\.com\/[^"' \s]+/)
    const price = parsePrice(chunk) || 9800
    seen.set(adId, {
      id: `live-autoline-${adId}`,
      source: 'Autoline',
      url,
      title,
      price,
      city: 'Київ',
      region: 'Київська',
      image: imageMatch?.[0] || '/tires/michelin.jpg',
      condition: looksUsed(title) || /occ-|б\/у/i.test(title) ? 'Б/В' : 'Нова',
    })
    if (seen.size >= 16) break
  }
  return [...seen.values()]
}

function sizeParts(size: string): { w: string; h: string; d: string } | null {
  const match = size.match(/(\d+)\s*\/\s*(\d+)\s*R\s*(\d+(?:[.,]\d+)?)/i)
  if (!match) return null
  return { w: match[1], h: match[2], d: match[3].replace(',', '.') }
}

export function atlantSearchUrl(size: string): string {
  const parts = sizeParts(size)
  if (!parts) return 'https://atlantshina.com.ua/'
  // "heigth" — саме так пише сам сайт
  return `https://atlantshina.com.ua/search?width=${parts.w}&heigth=${parts.h}&r=${parts.d}&type=0`
}

export function tyreclubCatalogUrl(size: string): string {
  const parts = sizeParts(size)
  if (!parts) return 'https://tyreclub.com.ua/catalog/tyre/cargo/'
  return `https://tyreclub.com.ua/catalog/tyre/cargo/w-${parts.w}/h-${parts.h}/d-${parts.d}/`
}

function parseAtlantOffers(html: string, size: string): RawOffer[] {
  const seen = new Map<string, RawOffer>()
  const hrefRe = /<h2 class="title-item"><a href="https:\/\/atlantshina\.com\.ua\/item\/(\d+)"[^>]*>([^<]{3,120})<\/a>/gi
  let match: RegExpExecArray | null
  while ((match = hrefRe.exec(html))) {
    const itemId = match[1]
    if (seen.has(itemId)) continue
    const title = decodeHtml(match[2])
    const chunk = html.slice(match.index, match.index + 3500)
    const priceMatch = chunk.match(/href="https:\/\/atlantshina\.com\.ua\/item\/\d+"\s*>\s*([\d\s]{3,8})\s*<font/i)
    const price = priceMatch ? Number(priceMatch[1].replace(/\s+/g, '')) : parsePrice(chunk)
    if (!price || price < 800 || price > 90000) continue
    const axisMatch = chunk.match(/type-osi[^>]*>([^<]{2,20})</i)
    const imageMatch = chunk.match(/image=([^&"']+)/i)
    const image = imageMatch
      ? `https://atlantshina.com.ua/image/?image=${imageMatch[1]}&width=300&height=225`
      : '/tires/michelin.jpg'
    const fullTitle = axisMatch ? `${title} ${size} ${decodeHtml(axisMatch[1])}` : `${title} ${size}`
    seen.set(itemId, {
      id: `live-atlant-${itemId}`,
      source: 'Atlant',
      url: `https://atlantshina.com.ua/item/${itemId}`,
      title: fullTitle,
      price,
      city: 'Київ',
      region: 'Київська',
      image,
      condition: 'Нова',
    })
    if (seen.size >= 20) break
  }
  return [...seen.values()]
}

interface TyreclubItem {
  full_name?: string
  min_price?: number
  max_price?: number
  default_photo?: number
  group?: number
}

function parseTyreclubOffers(html: string, size: string): RawOffer[] {
  const offers = new Map<string, RawOffer>()
  // SSR HTML містить прямі посилання на картки: /catalog/tyre/v-{id}-{slug}/
  const cardRe =
    /<a class="product-card__frame" href="(\/catalog\/tyre\/v-(\d+)-[^"]+\/)">\s*<img class="product-card__image" src="([^"]*)"[^>]*alt="([^"]{3,180})"/gi
  let match: RegExpExecArray | null
  while ((match = cardRe.exec(html))) {
    const id = match[2]
    if (offers.has(id)) continue
    const url = `https://tyreclub.com.ua${match[1]}`
    const image = match[3] || '/tires/michelin.jpg'
    const title = decodeHtml(match[4])
    const chunk = html.slice(match.index, match.index + 1600)
    const priceMatch = chunk.match(/product-card__price">від<!-- --> <!-- -->(\d{3,6})/)
    const price = priceMatch ? Number(priceMatch[1]) : 0
    if (!price || price < 800 || price > 90000) continue
    offers.set(id, {
      id: `live-tyreclub-${id}`,
      source: 'TyreClub',
      url,
      title,
      price,
      city: 'Київ',
      region: 'Київська',
      image,
      condition: looksUsed(title) ? 'Б/В' : 'Нова',
    })
    if (offers.size >= 20) break
  }
  if (offers.size) return [...offers.values()]

  // Резерв: JSON зі стану SSR (window.__INITIAL_STATE__.tyreCatalog.data), лінк — каталог з фільтром
  const stateIdx = html.indexOf('window.__INITIAL_STATE__')
  if (stateIdx < 0) return []
  const jsonStart = html.indexOf('{', stateIdx)
  const jsonEnd = html.indexOf('</script>', jsonStart)
  if (jsonStart < 0 || jsonEnd < 0) return []
  try {
    const state = JSON.parse(html.slice(jsonStart, jsonEnd).replace(/;\s*$/, '')) as {
      tyreCatalog?: { data?: TyreclubItem[] }
    }
    const items = state.tyreCatalog?.data ?? []
    const fallbackUrl = tyreclubCatalogUrl(size)
    for (const item of items.slice(0, 20)) {
      if (!item.full_name || !item.min_price) continue
      const key = String(item.group ?? item.full_name)
      if (offers.has(key)) continue
      offers.set(key, {
        id: `live-tyreclub-${key}`,
        source: 'TyreClub',
        url: fallbackUrl,
        title: item.full_name,
        price: item.min_price,
        city: 'Київ',
        region: 'Київська',
        image: item.default_photo
          ? `https://opt.tyreclub.com.ua/api/public/model_photo/${item.default_photo}.s190.jpg`
          : '/tires/michelin.jpg',
        condition: 'Нова',
      })
    }
  } catch {
    /* SSR JSON не розпарсився */
  }
  return [...offers.values()]
}

async function huntAtlantshina(size: string): Promise<{ offers: RawOffer[]; detail: string }> {
  try {
    const page = await fetchText(atlantSearchUrl(size))
    if (page.status >= 400) return { offers: [], detail: `Atlantshina HTTP ${page.status}` }
    const offers = parseAtlantOffers(page.body, size)
    return {
      offers,
      detail: offers.length
        ? `${offers.length} позицій зі складу Atlantshina`
        : 'Atlantshina без цього розміру в наявності',
    }
  } catch {
    return { offers: [], detail: 'Atlantshina недоступна' }
  }
}

async function huntTyreclub(size: string): Promise<{ offers: RawOffer[]; detail: string }> {
  try {
    const page = await fetchText(tyreclubCatalogUrl(size))
    if (page.status >= 400) return { offers: [], detail: `TyreClub HTTP ${page.status}` }
    const offers = parseTyreclubOffers(page.body, size)
    return {
      offers,
      detail: offers.length
        ? `${offers.length} позицій з каталогу TyreClub`
        : 'TyreClub без цього розміру в каталозі',
    }
  } catch {
    return { offers: [], detail: 'TyreClub недоступний' }
  }
}

async function huntProm(size: string): Promise<{ offers: RawOffer[]; detail: string }> {
  const urls = [promCatalogUrl(size), `https://prom.ua/ua/search?search_term=${encodeURIComponent(size)}`]
  for (const url of urls) {
    try {
      const page = await fetchText(url)
      if (page.status >= 400) continue
      const offers = parsePromOffers(page.body, size, !url.includes('Shiny-'))
      if (offers.length) {
        return { offers, detail: `${offers.length} живих карток Prom` }
      }
    } catch {
      /* try next */
    }
  }
  return { offers: [], detail: 'Prom не віддав картки товарів' }
}

async function huntAutoline(size: string): Promise<{ offers: RawOffer[]; detail: string }> {
  try {
    const page = await fetchText('https://autoline.ua/-/vantazhni-shini--c375')
    if (page.status >= 400) return { offers: [], detail: `Autoline HTTP ${page.status}` }
    const offers = parseAutolineOffers(page.body, size)
    return {
      offers,
      detail: offers.length ? `${offers.length} живих карток Autoline` : 'Autoline без цього розміру в HTML',
    }
  } catch {
    return { offers: [], detail: 'Autoline недоступний' }
  }
}

export async function huntMarketplaces(size: string): Promise<LiveHuntResult> {
  const [prom, autoline, tyreclub, atlant] = await Promise.all([
    huntProm(size),
    huntAutoline(size),
    huntTyreclub(size),
    huntAtlantshina(size),
  ])
  const raw = [...prom.offers, ...autoline.offers, ...tyreclub.offers, ...atlant.offers]
  const listings = raw.map((offer, index) => toListing(offer, size, index))
  return {
    listings,
    sources: [
      { name: 'Prom', found: prom.offers.length, detail: prom.detail },
      { name: 'Autoline', found: autoline.offers.length, detail: autoline.detail },
      { name: 'TyreClub', found: tyreclub.offers.length, detail: tyreclub.detail },
      { name: 'Atlant', found: atlant.offers.length, detail: atlant.detail },
      { name: 'OLX', found: 0, detail: 'OLX блокує Worker, живі картки з інших джерел' },
      { name: 'Truck1', found: 0, detail: 'Truck1 блокує Worker' },
    ],
  }
}
