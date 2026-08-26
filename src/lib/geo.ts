import type { HunterSettings, SearchFilters, TireListing } from '../types'

export const CITY_COORDS: Record<string, { lat: number; lng: number }> = {
  Київ: { lat: 50.4501, lng: 30.5234 },
  Львів: { lat: 49.8397, lng: 24.0297 },
  Одеса: { lat: 46.4825, lng: 30.7233 },
  Дніпро: { lat: 48.4647, lng: 35.0462 },
  Харків: { lat: 49.9935, lng: 36.2304 },
  Вінниця: { lat: 49.2331, lng: 28.4682 },
  Полтава: { lat: 49.5883, lng: 34.5514 },
  Запоріжжя: { lat: 47.8388, lng: 35.1396 },
  Черкаси: { lat: 49.4444, lng: 32.0598 },
  Рівне: { lat: 50.6199, lng: 26.2516 },
  Житомир: { lat: 50.2547, lng: 28.6587 },
  'Біла Церква': { lat: 49.7956, lng: 30.1164 },
  Бровари: { lat: 50.511, lng: 30.7909 },
  Чернігів: { lat: 51.4982, lng: 31.2893 },
  Ірпінь: { lat: 50.5218, lng: 30.2505 },
  Бориспіль: { lat: 50.3527, lng: 30.955 },
  Умань: { lat: 48.7484, lng: 30.2218 },
  Фастів: { lat: 50.0769, lng: 29.9177 },
}

export const REGION_HUB: Record<string, string> = {
  Україна: 'Київ',
  Київська: 'Київ',
  Львівська: 'Львів',
  Одеська: 'Одеса',
  Дніпропетровська: 'Дніпро',
  Харківська: 'Харків',
  Вінницька: 'Вінниця',
  Полтавська: 'Полтава',
  Запорізька: 'Запоріжжя',
  Черкаська: 'Черкаси',
  Рівненська: 'Рівне',
  Житомирська: 'Житомир',
  Чернігівська: 'Чернігів',
}

export function hubCity(region: string): string {
  return REGION_HUB[region] || 'Київ'
}

export function distanceKm(fromCity: string, toCity: string): number {
  const from = CITY_COORDS[fromCity]
  const to = CITY_COORDS[toCity]
  if (!from || !to) return Number.POSITIVE_INFINITY
  if (fromCity === toCity) return 0
  const toRad = (value: number) => (value * Math.PI) / 180
  const dLat = toRad(to.lat - from.lat)
  const dLng = toRad(to.lng - from.lng)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(from.lat)) * Math.cos(toRad(to.lat)) * Math.sin(dLng / 2) ** 2
  return Math.round(6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)))
}

export function listingDistance(listing: TireListing, originRegion: string): number {
  return distanceKm(hubCity(originRegion), listing.city)
}

export function withinRadius(listing: TireListing, originRegion: string, radius: number): boolean {
  if (!radius || radius >= 800) return true
  return listingDistance(listing, originRegion) <= radius
}

export function agentSearchFromSettings(settings: HunterSettings): SearchFilters {
  return {
    size: settings.defaultSize,
    brand: 'Будь-який',
    condition: 'Будь-який',
    minRemaining: 0,
    maxPrice: Number.MAX_SAFE_INTEGER,
    quantity: 1,
    region: settings.defaultRegion,
    radius: settings.radius,
    sources: ['OLX', 'Prom', 'Autoline', 'Truck1', 'TyreClub', 'Atlant', 'Інші'],
  }
}

export function huntQueryLabel(settings: HunterSettings): string {
  return `${settings.defaultSize} · ${settings.defaultRegion} · ${settings.radius} км від ${hubCity(settings.defaultRegion)}`
}

export function formatDistanceFromHub(km: number, originRegion: string): string {
  const hub = hubCity(originRegion)
  if (!Number.isFinite(km)) return hub
  if (km <= 0) return `на місці · ${hub}`
  return `${km} км від ${hub}`
}

export function listingPlaceLabel(listing: TireListing, originRegion: string): string {
  const km = listingDistance(listing, originRegion)
  const distance = formatDistanceFromHub(km, originRegion)
  if (!Number.isFinite(km) || km <= 0) return `${listing.city} · ${distance}`
  return `${listing.city} · ${distance}`
}
