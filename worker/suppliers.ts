import { SUPPLIERS } from '../src/data/suppliers'
import type { Supplier, SupplierVerify } from '../src/types'

const HEADERS = {
  Accept: 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'uk-UA,uk;q=0.9,en;q=0.8',
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
}

interface LiveCheck {
  status: SupplierVerify
  http: number | null
}

async function checkOne(url: string): Promise<LiveCheck> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 6000)
  try {
    const response = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      headers: HEADERS,
      signal: controller.signal,
    })
    if (response.status >= 200 && response.status < 400) {
      return { status: 'online', http: response.status }
    }
    if (response.status === 403 || response.status === 429 || response.status === 503) {
      // Анти-бот (Cloudflare тощо): сайт живий, у браузері відкривається.
      return { status: 'protected', http: response.status }
    }
    return { status: 'offline', http: response.status }
  } catch {
    return { status: 'offline', http: null }
  } finally {
    clearTimeout(timer)
  }
}

const CACHE_TTL_MS = 10 * 60 * 1000
let cache: { at: number; suppliers: Supplier[] } | null = null

export async function suppliersWithLiveStatus(options?: { fresh?: boolean }): Promise<{
  suppliers: Supplier[]
  checkedLive: boolean
}> {
  if (!options?.fresh && cache && Date.now() - cache.at < CACHE_TTL_MS) {
    return { suppliers: cache.suppliers, checkedLive: true }
  }
  try {
    const checks = await Promise.all(SUPPLIERS.map((item) => checkOne(item.url)))
    const suppliers = SUPPLIERS.map((item, index) => {
      const live = checks[index]
      // Якщо запит впав, але при курації сайт був живий/захищений — довіряємо курації:
      // Worker-середовище часто блокується жорсткіше, ніж браузер.
      const merged: SupplierVerify =
        live.status === 'offline' && item.verify !== 'offline' ? item.verify : live.status
      return { ...item, liveStatus: merged, liveHttp: live.http }
    })
    cache = { at: Date.now(), suppliers }
    return { suppliers, checkedLive: true }
  } catch {
    return {
      suppliers: SUPPLIERS.map((item) => ({ ...item, liveStatus: item.verify, liveHttp: null })),
      checkedLive: false,
    }
  }
}
