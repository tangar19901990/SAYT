export type PageId =
  | 'dashboard'
  | 'search'
  | 'tires'
  | 'deals'
  | 'agent'
  | 'analytics'
  | 'profit'
  | 'saved'
  | 'suppliers'
  | 'settings'

export type Condition = 'Нова' | 'Б/В'
export type Source = 'OLX' | 'Prom' | 'Autoline' | 'Truck1' | 'TyreClub' | 'Atlant' | 'Інші'
export type DealStatus = 'ВІДМІННА УГОДА' | 'ВИГІДНО' | 'ПЕРЕВІРИТИ' | 'НЕВИГІДНО'
export type ViewMode = 'cards' | 'table'
export type SortKey = 'best' | 'profit' | 'price-asc' | 'price-desc' | 'score' | 'remaining'
export type SourceState = 'ok' | 'blocked' | 'fallback'

export interface TireListing {
  id: string
  brand: string
  model: string
  size: string
  price: number
  remaining: number
  dot: number
  city: string
  region: string
  source: Source
  condition: Condition
  quantity: number
  delivery: number
  cost: number
  sellPrice: number
  profit: number
  roi: number
  score: number
  status: DealStatus
  image: string
  url: string
  notes: string
  foundAt: string
}

export interface SearchFilters {
  size: string
  brand: string
  condition: 'Будь-який' | Condition
  minRemaining: number
  maxPrice: number
  quantity: number
  region: string
  radius: number
  sources: Source[]
}

export interface ResultFilters {
  priceMax: number | null
  brand: string
  remainingMin: number | null
  dotMin: number | null
  region: string
  source: string
  rating: string
}

export interface ToastItem {
  id: string
  title: string
  message: string
  tone: 'success' | 'info' | 'warn'
}

export interface AgentLog {
  id: string
  text: string
  done: boolean
}

export interface SourceProgress {
  name: Source
  progress: number
  state: SourceState
  detail: string
}

export interface SourceStatus {
  name: Source
  state: SourceState
  httpStatus: number | null
  detail: string
}

export interface KpiData {
  foundToday: number
  bestDeals: number
  potentialProfit: number
  activeSearches: number
}

export interface AgentSnapshot {
  running: boolean
  lastQuery: string
  found: number
  duplicates: number
  rejected: number
  suitable: number
  top: number
  sources: SourceProgress[]
  logs: AgentLog[]
  hunted?: TireListing[]
  nextAction?: TireListing | null
  scannedAt?: string
  ticked?: boolean
  cycle?: number
}

export interface SearchResponse {
  listings: TireListing[]
  total: number
  catalogTotal: number
  sourceStatuses: SourceStatus[]
  lastQuery: string
  fallback: boolean
}

export interface HunterSettings {
  radius: number
  minScore: number
  notify: boolean
  agentRunning: boolean
  defaultSize: string
  defaultRegion: string
}

export const DEFAULT_SETTINGS: HunterSettings = {
  radius: 200,
  minScore: 75,
  notify: true,
  agentRunning: true,
  defaultSize: '385/65 R22.5',
  defaultRegion: 'Україна',
}

export type SupplierType =
  | 'виробник'
  | "дистриб'ютор"
  | 'опт'
  | 'магазин'
  | 'б/в склад'
  | 'сервіс'
  | 'маркетплейс'

export type SupplierVerify = 'online' | 'protected' | 'offline'

export interface Supplier {
  id: string
  name: string
  url: string
  type: SupplierType
  city: string
  region: string
  truck: boolean
  used: boolean
  wholesale: boolean
  brands?: string[]
  phone?: string
  note: string
  verify: SupplierVerify
  checkedAt: string
  liveStatus?: SupplierVerify
  liveHttp?: number | null
}

export type PipelineKind = 'save' | 'stock' | 'work'
export type PipelineAction = PipelineKind | 'unsave' | 'unstock' | 'unwork'
