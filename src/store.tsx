import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { DEFAULT_SEARCH, LISTINGS } from './data/listings'
import { applyResultFilters, EMPTY_RESULT_FILTERS, sortListings } from './lib/filter'
import {
  fetchAgent,
  fetchKpi,
  fetchListings,
  fetchPipeline,
  fetchSettings,
  fallbackAgent,
  fallbackKpi,
  fallbackListings,
  fallbackSearch,
  fallbackSettings,
  postAgentPower,
  postListingAction,
  postSearch,
  postSettings,
} from './lib/api'
import { huntQueryLabel } from './lib/geo'
import { isLiveAdUrl } from './lib/listingUrl'
import type {
  AgentSnapshot,
  HunterSettings,
  KpiData,
  PageId,
  PipelineAction,
  ResultFilters,
  SearchFilters,
  SortKey,
  SourceStatus,
  TireListing,
  ToastItem,
  ViewMode,
} from './types'
import { DEFAULT_SETTINGS } from './types'

interface HunterStore {
  page: PageId
  setPage: (page: PageId) => void
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  search: SearchFilters
  setSearch: (search: SearchFilters) => void
  resultFilters: ResultFilters
  setResultFilters: (filters: ResultFilters) => void
  sort: SortKey
  setSort: (sort: SortKey) => void
  view: ViewMode
  setView: (view: ViewMode) => void
  hasSearched: boolean
  searching: boolean
  results: TireListing[]
  resultTotal: number
  catalogTotal: number
  sourceStatuses: SourceStatus[]
  all: TireListing[]
  savedIds: string[]
  stockIds: string[]
  workIds: string[]
  selected: TireListing | null
  setSelected: (listing: TireListing | null) => void
  preview: TireListing | null
  openListing: (listing: TireListing) => void
  closeListing: () => void
  toasts: ToastItem[]
  pushToast: (toast: Omit<ToastItem, 'id'>) => void
  dismissToast: (id: string) => void
  runSearch: (next?: SearchFilters) => void
  saveListing: (id: string) => void
  unsaveListing: (id: string) => void
  addToStock: (id: string) => void
  removeFromStock: (id: string) => void
  takeToWork: (id: string) => void
  releaseWork: (id: string) => void
  agentRunning: boolean
  lastQuery: string
  kpi: KpiData
  apiOnline: boolean
  usingFallback: boolean
  agent: AgentSnapshot | null
  settings: HunterSettings
  saveSettingsLocal: (patch: Partial<HunterSettings>) => Promise<void>
  setAgentPower: (running: boolean) => Promise<void>
  refreshAll: () => Promise<void>
}

const StoreContext = createContext<HunterStore | null>(null)

const EMPTY_KPI: KpiData = {
  foundToday: 0,
  bestDeals: 0,
  potentialProfit: 0,
  activeSearches: 0,
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [page, setPage] = useState<PageId>('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [search, setSearch] = useState<SearchFilters>(DEFAULT_SEARCH)
  const [resultFilters, setResultFilters] = useState<ResultFilters>(EMPTY_RESULT_FILTERS)
  const [sort, setSort] = useState<SortKey>('best')
  const [view, setView] = useState<ViewMode>('cards')
  const [hasSearched, setHasSearched] = useState(false)
  const [searching, setSearching] = useState(false)
  const [all, setAll] = useState<TireListing[]>(LISTINGS)
  const [rawResults, setRawResults] = useState<TireListing[]>([])
  const [resultTotal, setResultTotal] = useState(0)
  const [catalogTotal, setCatalogTotal] = useState(LISTINGS.length)
  const [sourceStatuses, setSourceStatuses] = useState<SourceStatus[]>([])
  const [savedIds, setSavedIds] = useState<string[]>(['gt-001', 'gt-006', 'gt-010'])
  const [stockIds, setStockIds] = useState<string[]>(['gt-012'])
  const [workIds, setWorkIds] = useState<string[]>(['gt-001'])
  const [selected, setSelected] = useState<TireListing | null>(null)
  const [preview, setPreview] = useState<TireListing | null>(null)
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const [agentRunning, setAgentRunning] = useState(true)
  const [lastQuery, setLastQuery] = useState(huntQueryLabel(DEFAULT_SETTINGS))
  const [kpi, setKpi] = useState<KpiData>(EMPTY_KPI)
  const [apiOnline, setApiOnline] = useState(false)
  const [usingFallback, setUsingFallback] = useState(true)
  const [agent, setAgent] = useState<AgentSnapshot | null>(null)
  const [settings, setSettings] = useState<HunterSettings>(DEFAULT_SETTINGS)

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((item) => item.id !== id))
  }, [])

  const pushToast = useCallback(
    (toast: Omit<ToastItem, 'id'>) => {
      const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`
      setToasts((prev) => [...prev, { ...toast, id }])
      window.setTimeout(() => dismissToast(id), 3200)
    },
    [dismissToast],
  )

  const applyPipeline = (payload: { savedIds: string[]; stockIds: string[]; workIds: string[] }) => {
    setSavedIds(payload.savedIds)
    setStockIds(payload.stockIds)
    setWorkIds(payload.workIds)
  }

  const applySettings = (next: HunterSettings) => {
    setSettings(next)
    setAgentRunning(next.agentRunning)
    setSearch((prev) => ({
      ...prev,
      radius: next.radius,
      size: prev.size || next.defaultSize,
      region: prev.region || next.defaultRegion,
    }))
  }

  const refreshAll = useCallback(async () => {
    try {
      const [listings, pipeline, nextKpi, nextAgent, nextSettings] = await Promise.all([
        fetchListings({ sort: 'best' }),
        fetchPipeline(),
        fetchKpi(),
        fetchAgent(),
        fetchSettings(),
      ])
      setAll(listings)
      setCatalogTotal(listings.length)
      applyPipeline(pipeline)
      setKpi(nextKpi)
      setAgent(nextAgent)
      applySettings(nextSettings)
      setAgentRunning(nextSettings.agentRunning)
      setLastQuery(nextAgent.lastQuery || huntQueryLabel(nextSettings))
      setSourceStatuses(nextAgent.sourceStatuses ?? [])
      setApiOnline(true)
      setUsingFallback(false)
    } catch {
      const listings = fallbackListings()
      const nextSettings = fallbackSettings()
      const nextAgent = fallbackAgent(listings, nextSettings)
      setAll(listings)
      setCatalogTotal(listings.length)
      setKpi(fallbackKpi(listings, nextSettings))
      setAgent(nextAgent)
      applySettings(nextSettings)
      setLastQuery(nextAgent.lastQuery)
      setApiOnline(false)
      setUsingFallback(true)
    }
  }, [])

  useEffect(() => {
    void refreshAll()
  }, [refreshAll])

  useEffect(() => {
    if (!agentRunning) return
    let cancelled = false
    const poll = async () => {
      if (cancelled || searching) return
      try {
        const [nextAgent, nextKpi] = await Promise.all([fetchAgent(), fetchKpi()])
        if (cancelled) return
        setAgent(nextAgent)
        setKpi(nextKpi)
        setAgentRunning(nextAgent.running)
        if (nextAgent.lastQuery) setLastQuery(nextAgent.lastQuery)
        if (nextAgent.sourceStatuses?.length) setSourceStatuses(nextAgent.sourceStatuses)
        setApiOnline(true)
        setUsingFallback(false)
      } catch {
        if (cancelled) return
        setApiOnline(false)
      }
    }
    const timer = window.setInterval(() => {
      void poll()
    }, 6000)
    return () => {
      cancelled = true
      window.clearInterval(timer)
    }
  }, [agentRunning, searching])

  const runSearch = (next?: SearchFilters) => {
    const payload = next ?? search
    if (next) setSearch(next)
    setLastQuery(`${payload.size} · ${payload.region} · ${payload.radius} км`)
    setHasSearched(true)
    setResultFilters(EMPTY_RESULT_FILTERS)
    setSort('best')
    setPage('search')
    setSearching(true)
    pushToast({
      title: 'AI пошук запущено',
      message: `Шукаємо ${payload.size} · ${payload.region} · ${payload.radius} км`,
      tone: 'info',
    })

    void (async () => {
      try {
        const response = await postSearch(payload)
        setRawResults(response.listings)
        setResultTotal(response.total)
        setCatalogTotal(response.catalogTotal)
        setSourceStatuses(response.sourceStatuses)
        setLastQuery(response.lastQuery)
        setUsingFallback(response.fallback)
        setApiOnline(true)
        const nextKpi = await fetchKpi().catch(() => fallbackKpi(all, settings))
        setKpi(nextKpi)
        const nextAgent = await fetchAgent().catch(() => null)
        if (nextAgent) {
          setAgent(nextAgent)
          setAgentRunning(nextAgent.running)
          if (nextAgent.lastQuery) setLastQuery(nextAgent.lastQuery)
        }
      } catch {
        const response = fallbackSearch(payload)
        setRawResults(response.listings)
        setResultTotal(response.total)
        setCatalogTotal(response.catalogTotal)
        setSourceStatuses(response.sourceStatuses)
        setUsingFallback(true)
        setApiOnline(false)
        pushToast({
          title: 'Каталог офлайн',
          message: 'API недоступний, показуємо локальний seed',
          tone: 'warn',
        })
      } finally {
        setSearching(false)
      }
    })()
  }

  const mutateItem = (id: string, kind: PipelineAction, success: { title: string; message: string }) => {
    const listing = all.find((item) => item.id === id)
    if (kind === 'save') setSavedIds((prev) => (prev.includes(id) ? prev : [...prev, id]))
    if (kind === 'unsave') setSavedIds((prev) => prev.filter((item) => item !== id))
    if (kind === 'stock') setStockIds((prev) => (prev.includes(id) ? prev : [...prev, id]))
    if (kind === 'unstock') setStockIds((prev) => prev.filter((item) => item !== id))
    if (kind === 'work') setWorkIds((prev) => (prev.includes(id) ? prev : [...prev, id]))
    if (kind === 'unwork') setWorkIds((prev) => prev.filter((item) => item !== id))
    pushToast({ ...success, tone: 'success' })
    void postListingAction(id, kind)
      .then((payload) => {
        applyPipeline(payload)
        setApiOnline(true)
      })
      .catch(() => {
        if (listing) setUsingFallback(true)
      })
  }

  const saveListing = (id: string) => {
    if (savedIds.includes(id)) {
      unsaveListing(id)
      return
    }
    const listing = all.find((item) => item.id === id)
    mutateItem(id, 'save', {
      title: 'Збережено',
      message: listing ? `${listing.brand} ${listing.size}` : 'Оголошення додано в збережені',
    })
  }

  const unsaveListing = (id: string) => {
    const listing = all.find((item) => item.id === id)
    mutateItem(id, 'unsave', {
      title: 'Прибрано зі збережених',
      message: listing ? `${listing.brand} ${listing.size}` : 'Оголошення прибрано',
    })
  }

  const addToStock = (id: string) => {
    if (stockIds.includes(id)) {
      removeFromStock(id)
      return
    }
    const listing = all.find((item) => item.id === id)
    mutateItem(id, 'stock', {
      title: 'Додано до складу',
      message: listing ? `${listing.brand} ${listing.model}` : 'Шина додана до складу',
    })
  }

  const removeFromStock = (id: string) => {
    const listing = all.find((item) => item.id === id)
    mutateItem(id, 'unstock', {
      title: 'Знято зі складу',
      message: listing ? `${listing.brand} ${listing.model}` : 'Шина знята зі складу',
    })
  }

  const takeToWork = (id: string) => {
    if (workIds.includes(id)) {
      releaseWork(id)
      return
    }
    const listing = all.find((item) => item.id === id)
    mutateItem(id, 'work', {
      title: 'Взято в роботу',
      message: listing ? `Потенційний прибуток ${listing.profit.toLocaleString('uk-UA')} ₴` : 'Угоду додано',
    })
  }

  const releaseWork = (id: string) => {
    const listing = all.find((item) => item.id === id)
    mutateItem(id, 'unwork', {
      title: 'Знято з роботи',
      message: listing ? `${listing.brand} ${listing.model}` : 'Угоду прибрано з пайплайну',
    })
  }

  const saveSettingsLocal = async (patch: Partial<HunterSettings>) => {
    const optimistic = { ...settings, ...patch }
    applySettings(optimistic)
    try {
      const next = await postSettings(patch)
      applySettings(next)
      setApiOnline(true)
      pushToast({ title: 'Збережено', message: 'Налаштування агента оновлено', tone: 'success' })
    } catch {
      setUsingFallback(true)
      pushToast({ title: 'Локально', message: 'API недоступний, тримаємо зміни в сесії', tone: 'warn' })
    }
  }

  const setAgentPower = async (running: boolean) => {
    setAgentRunning(running)
    setSettings((prev) => ({ ...prev, agentRunning: running }))
    try {
      const payload = await postAgentPower(running)
      applySettings(payload.settings)
      setAgentRunning(payload.running)
      setApiOnline(true)
      const nextAgent = await fetchAgent().catch(() => null)
      if (nextAgent) setAgent(nextAgent)
      pushToast({
        title: running ? 'Агент запущено' : 'Агент зупинено',
        message: running ? 'Каталог D1 + чесний probe джерел' : 'Пошук на паузі, каталог лишається',
        tone: running ? 'success' : 'info',
      })
    } catch {
      setUsingFallback(true)
      pushToast({ title: 'Офлайн', message: 'Стан агента змінено лише в цій сесії', tone: 'warn' })
    }
  }

  const openListing = (listing: TireListing) => {
    setSelected(null)
    if (isLiveAdUrl(listing.url)) {
      // Є прямий URL саме цього оголошення — відкриваємо його одразу.
      window.open(listing.url, '_blank', 'noopener,noreferrer')
      return
    }
    // Прямого URL нема — показуємо повний in-app перегляд з посиланням на пошук.
    setPreview(listing)
  }

  const closeListing = () => {
    setPreview(null)
  }

  const results = useMemo(() => {
    const source = hasSearched ? rawResults : all
    return sortListings(applyResultFilters(source, resultFilters), sort)
  }, [hasSearched, rawResults, all, resultFilters, sort])

  const value: HunterStore = {
    page,
    setPage,
    sidebarOpen,
    setSidebarOpen,
    search,
    setSearch,
    resultFilters,
    setResultFilters,
    sort,
    setSort,
    view,
    setView,
    hasSearched,
    searching,
    results,
    resultTotal: hasSearched ? resultTotal : all.length,
    catalogTotal,
    sourceStatuses,
    all,
    savedIds,
    stockIds,
    workIds,
    selected,
    setSelected,
    preview,
    openListing,
    closeListing,
    toasts,
    pushToast,
    dismissToast,
    runSearch,
    saveListing,
    unsaveListing,
    addToStock,
    removeFromStock,
    takeToWork,
    releaseWork,
    agentRunning,
    lastQuery,
    kpi,
    apiOnline,
    usingFallback,
    agent,
    settings,
    saveSettingsLocal,
    setAgentPower,
    refreshAll,
  }

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useHunter() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useHunter must be used inside StoreProvider')
  return ctx
}
