import type { Source, SourceProgress, SourceStatus } from '../src/types'

interface ProbeTarget {
  name: Source
  url: string
}

const TARGETS: ProbeTarget[] = [
  { name: 'OLX', url: 'https://www.olx.ua/' },
  { name: 'Prom', url: 'https://prom.ua/' },
  { name: 'Autoline', url: 'https://autoline.ua/-/vantazhni-shini--c375' },
  { name: 'Truck1', url: 'https://www.truck1.eu/spare-parts/tires/' },
  { name: 'TyreClub', url: 'https://tyreclub.com.ua/catalog/tyre/cargo/' },
  { name: 'Atlant', url: 'https://atlantshina.com.ua/' },
]

const BROWSER_HEADERS = {
  Accept: 'text/html,application/json;q=0.9,*/*;q=0.8',
  'Accept-Language': 'uk-UA,uk;q=0.9,en;q=0.8',
}

function classify(name: Source, status: number, body: string): Omit<SourceStatus, 'name'> {
  if (status === 403 || status === 401) {
    return {
      state: 'blocked',
      httpStatus: status,
      detail: `${name} відхилив запит Worker (${status}). Каталог D1.`,
    }
  }
  if (status === 404) {
    return {
      state: 'fallback',
      httpStatus: status,
      detail: `${name} не віддав публічний search API. Каталог D1.`,
    }
  }
  if (status >= 200 && status < 300) {
    if (body.includes('Dealer not found') || body.includes('"error"')) {
      return {
        state: 'fallback',
        httpStatus: status,
        detail: `${name} відповів, але без відкритого каталогу шин.`,
      }
    }
    return {
      state: 'fallback',
      httpStatus: status,
      detail: `${name} відкривається, живий JSON-каталог недоступний. Каталог D1.`,
    }
  }
  return {
    state: 'fallback',
    httpStatus: status || null,
    detail: `${name} недоступний (${status || 'timeout'}). Каталог D1.`,
  }
}

async function probeOne(target: ProbeTarget): Promise<SourceStatus> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 3500)
  try {
    const response = await fetch(target.url, {
      method: 'GET',
      redirect: 'follow',
      headers: BROWSER_HEADERS,
      signal: controller.signal,
    })
    const body = await response.text().catch(() => '')
    return { name: target.name, ...classify(target.name, response.status, body.slice(0, 400)) }
  } catch {
    return {
      name: target.name,
      state: 'blocked',
      httpStatus: null,
      detail: `${target.name} не відповідає з цього середовища. Каталог D1.`,
    }
  } finally {
    clearTimeout(timer)
  }
}

const PROBE_TTL_MS = 45_000
const probeCache = new Map<string, { at: number; statuses: SourceStatus[] }>()

function cacheKey(wanted: Source[]): string {
  return [...wanted].sort().join(',')
}

export async function probeSources(wanted: Source[], options?: { fresh?: boolean }): Promise<SourceStatus[]> {
  const key = cacheKey(wanted)
  const cached = probeCache.get(key)
  if (!options?.fresh && cached && Date.now() - cached.at < PROBE_TTL_MS) {
    return cached.statuses
  }
  const selected = TARGETS.filter((item) => wanted.includes(item.name))
  const probed = await Promise.all(selected.map(probeOne))
  if (wanted.includes('Інші')) {
    probed.push({
      name: 'Інші',
      state: 'ok',
      httpStatus: 200,
      detail: 'Внутрішній каталог і локальні джерела.',
    })
  }
  probeCache.set(key, { at: Date.now(), statuses: probed })
  return probed
}

export function sourceProgress(statuses: SourceStatus[]): SourceProgress[] {
  return statuses.map((item) => ({
    name: item.name,
    progress: item.state === 'ok' ? 100 : item.state === 'fallback' ? 70 : 40,
    state: item.state,
    detail: item.detail,
  }))
}
