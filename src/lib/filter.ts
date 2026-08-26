import type { ResultFilters, SearchFilters, SortKey, TireListing } from '../types'
import { withinRadius } from './geo'

export function applySearch(listings: TireListing[], search: SearchFilters): TireListing[] {
  return listings.filter((item) => {
    if (search.size && item.size !== search.size) return false
    if (search.brand !== 'Будь-який' && item.brand !== search.brand) return false
    if (search.condition !== 'Будь-який' && item.condition !== search.condition) return false
    if (item.remaining < search.minRemaining) return false
    if (item.price > search.maxPrice) return false
    if (!withinRadius(item, search.region, search.radius)) return false
    if (!search.sources.includes(item.source)) return false
    return true
  })
}

export function applyResultFilters(listings: TireListing[], filters: ResultFilters): TireListing[] {
  return listings.filter((item) => {
    if (filters.priceMax != null && item.price > filters.priceMax) return false
    if (filters.brand && item.brand !== filters.brand) return false
    if (filters.remainingMin != null && item.remaining < filters.remainingMin) return false
    if (filters.dotMin != null && item.dot < filters.dotMin) return false
    if (filters.region && item.city !== filters.region && item.region !== filters.region) return false
    if (filters.source && item.source !== filters.source) return false
    if (filters.rating === 'excellent' && item.score < 90) return false
    if (filters.rating === 'good' && item.score < 75) return false
    if (filters.rating === 'check' && item.score < 60) return false
    return true
  })
}

export function sortListings(listings: TireListing[], sort: SortKey): TireListing[] {
  const next = [...listings]
  next.sort((a, b) => {
    if (sort === 'best') return b.score - a.score || b.profit - a.profit
    if (sort === 'profit') return b.profit - a.profit
    if (sort === 'price-asc') return a.price - b.price
    if (sort === 'price-desc') return b.price - a.price
    if (sort === 'score') return b.score - a.score
    return b.remaining - a.remaining
  })
  return next
}

export const EMPTY_RESULT_FILTERS: ResultFilters = {
  priceMax: null,
  brand: '',
  remainingMin: null,
  dotMin: null,
  region: '',
  source: '',
  rating: '',
}
