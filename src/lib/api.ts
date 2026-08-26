import { LISTINGS } from '../data/listings'
import { SUPPLIERS } from '../data/suppliers'
import { applySearch, sortListings } from './filter'
import type {
  AgentSnapshot,
  HunterSettings,
  KpiData,
  PipelineAction,
  SearchFilters,
  SearchResponse,
  SortKey,
  Source,
  Supplier,
  TireListing,
} from '../types'
import { DEFAULT_SETTINGS } from '../types'

export class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: {
      accept: 'application/json',
      ...(init?.body ? { 'content-type': 'application/json' } : {}),
      ...init?.headers,
    },
  })
  if (!response.ok) {
    throw new ApiError(`${path} ${response.status}`, response.status)
  }
  return (await response.json()) as T
}

export async function fetchHealth(): Promise<{ ok: boolean; listings: number } | null> {
  try {
    return await request('/api/health')
  } catch {
    return null
  }
}

export async function fetchListings(query?: {
  size?: string
  brand?: string
  condition?: string
  minRemaining?: number
  maxPrice?: number
  region?: string
  radius?: number
  sources?: Source[]
  sort?: SortKey
}): Promise<TireListing[]> {
  const params = new URLSearchParams()
  if (query?.size) params.set('size', query.size)
  if (query?.brand) params.set('brand', query.brand)
  if (query?.condition) params.set('condition', query.condition)
  if (query?.minRemaining != null) params.set('minRemaining', String(query.minRemaining))
  if (query?.maxPrice != null) params.set('maxPrice', String(query.maxPrice))
  if (query?.region) params.set('region', query.region)
  if (query?.radius != null) params.set('radius', String(query.radius))
  if (query?.sources?.length) params.set('sources', query.sources.join(','))
  if (query?.sort) params.set('sort', query.sort)
  const qs = params.toString()
  const data = await request<{ listings: TireListing[] }>(`/api/listings${qs ? `?${qs}` : ''}`)
  return data.listings
}

export async function fetchListing(id: string): Promise<TireListing> {
  const data = await request<{ listing: TireListing }>(`/api/listings/${id}`)
  return data.listing
}

export async function postSearch(filters: SearchFilters): Promise<SearchResponse> {
  return request<SearchResponse>('/api/search', {
    method: 'POST',
    body: JSON.stringify(filters),
  })
}

export async function postListingAction(id: string, kind: PipelineAction) {
  return request<{
    ok: boolean
    action: PipelineAction
    listing: TireListing
    savedIds: string[]
    stockIds: string[]
    workIds: string[]
  }>(`/api/listings/${id}/${kind}`, { method: 'POST' })
}

export async function fetchSettings(): Promise<HunterSettings> {
  const data = await request<{ settings: HunterSettings }>('/api/settings')
  return data.settings
}

export async function postSettings(patch: Partial<HunterSettings>): Promise<HunterSettings> {
  const data = await request<{ ok: boolean; settings: HunterSettings }>('/api/settings', {
    method: 'POST',
    body: JSON.stringify(patch),
  })
  return data.settings
}

export async function postAgentPower(running: boolean): Promise<{ running: boolean; settings: HunterSettings }> {
  const path = running ? '/api/agent/start' : '/api/agent/stop'
  return request(path, { method: 'POST' })
}

export async function fetchPipeline() {
  return request<{
    savedIds: string[]
    stockIds: string[]
    workIds: string[]
    saved: TireListing[]
    stock: TireListing[]
    work: TireListing[]
  }>('/api/pipeline')
}

export async function fetchKpi(): Promise<KpiData> {
  return request<KpiData>('/api/kpi')
}

export async function fetchAgent(): Promise<AgentSnapshot & { sourceStatuses?: SearchResponse['sourceStatuses'] }> {
  return request('/api/agent')
}

export interface AiAnalyzeResponse {
  ok: boolean
  model: string
  analysis: string
  fallback: boolean
  size: string
  analyzed: number
}

export async function postAiAnalyze(size: string, listingIds?: string[]): Promise<AiAnalyzeResponse> {
  return request<AiAnalyzeResponse>('/api/ai/analyze', {
    method: 'POST',
    body: JSON.stringify({ size, listingIds }),
  })
}

export interface SuppliersResponse {
  suppliers: Supplier[]
  total: number
  catalogTotal: number
  checkedLive: boolean
  checkedAt: string
}

export async function fetchSuppliers(options?: { fresh?: boolean; type?: string }): Promise<SuppliersResponse> {
  const params = new URLSearchParams()
  if (options?.fresh) params.set('fresh', '1')
  if (options?.type && options.type !== 'всі') params.set('type', options.type)
  const qs = params.toString()
  return request<SuppliersResponse>(`/api/suppliers${qs ? `?${qs}` : ''}`)
}

export function fallbackSuppliers(): SuppliersResponse {
  return {
    suppliers: SUPPLIERS.map((item) => ({ ...item, liveStatus: item.verify, liveHttp: null })),
    total: SUPPLIERS.length,
    catalogTotal: SUPPLIERS.length,
    checkedLive: false,
    checkedAt: new Date().toISOString(),
  }
}

export function fallbackListings(): TireListing[] {
  return LISTINGS
}

export function fallbackSearch(filters: SearchFilters): SearchResponse {
  const listings = sortListings(applySearch(LISTINGS, filters), 'best')
  return {
    listings,
    total: listings.length,
    catalogTotal: LISTINGS.length,
    sourceStatuses: [
      { name: 'OLX', state: 'fallback', httpStatus: null, detail: 'API недоступний. Каталог локальний.' },
      { name: 'Prom', state: 'fallback', httpStatus: null, detail: 'API недоступний. Каталог локальний.' },
      { name: 'Autoline', state: 'fallback', httpStatus: null, detail: 'API недоступний. Каталог локальний.' },
      { name: 'Truck1', state: 'fallback', httpStatus: null, detail: 'API недоступний. Каталог локальний.' },
      { name: 'TyreClub', state: 'fallback', httpStatus: null, detail: 'API недоступний. Каталог локальний.' },
      { name: 'Atlant', state: 'fallback', httpStatus: null, detail: 'API недоступний. Каталог локальний.' },
      { name: 'Інші', state: 'ok', httpStatus: 200, detail: 'Локальний каталог.' },
    ],
    lastQuery: `${filters.size} · ${filters.region} · ${filters.radius} км`,
    fallback: true,
  }
}

export function fallbackSettings(): HunterSettings {
  return { ...DEFAULT_SETTINGS }
}

export function fallbackKpi(listings: TireListing[], settings: HunterSettings = DEFAULT_SETTINGS): KpiData {
  const hunted = sortListings(applySearch(listings, {
    size: settings.defaultSize,
    brand: 'Будь-який',
    condition: 'Будь-який',
    minRemaining: 0,
    maxPrice: Number.MAX_SAFE_INTEGER,
    quantity: 1,
    region: settings.defaultRegion,
    radius: settings.radius,
    sources: ['OLX', 'Prom', 'Autoline', 'Truck1', 'TyreClub', 'Atlant', 'Інші'],
  }), 'best')
  const best = hunted.filter((item) => item.score >= 90)
  const suitable = hunted.filter((item) => item.score >= settings.minScore)
  return {
    foundToday: hunted.length,
    bestDeals: best.length,
    potentialProfit: suitable.reduce((sum, item) => sum + item.profit, 0),
    activeSearches: settings.agentRunning ? 1 : 0,
  }
}

export function fallbackAgent(listings: TireListing[], settings: HunterSettings = DEFAULT_SETTINGS): AgentSnapshot {
  const hunted = sortListings(applySearch(listings, {
    size: settings.defaultSize,
    brand: 'Будь-який',
    condition: 'Будь-який',
    minRemaining: 0,
    maxPrice: Number.MAX_SAFE_INTEGER,
    quantity: 1,
    region: settings.defaultRegion,
    radius: settings.radius,
    sources: ['OLX', 'Prom', 'Autoline', 'Truck1', 'TyreClub', 'Atlant', 'Інші'],
  }), 'best')
  const suitable = hunted.filter((item) => item.score >= settings.minScore)
  const rejected = hunted.filter((item) => item.score < settings.minScore)
  return {
    running: settings.agentRunning,
    lastQuery: `${settings.defaultSize} · ${settings.defaultRegion} · ${settings.radius} км`,
    found: hunted.length,
    duplicates: 0,
    rejected: rejected.length,
    suitable: suitable.length,
    top: hunted.filter((item) => item.score >= 90).length,
    sources: [],
    logs: [{ id: 'offline', text: 'Офлайн-режим: полювання по локальному каталогу', done: true }],
    hunted,
    nextAction: suitable[0] ?? hunted[0] ?? null,
    scannedAt: new Date().toISOString(),
  }
}
