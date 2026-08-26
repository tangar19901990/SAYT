import type { Source, TireListing } from '../types'

type ListingLink = Pick<TireListing, 'brand' | 'model' | 'size' | 'city' | 'source'>

/** Size token that marketplace search actually indexes, e.g. 385-65-R22.5 */
export function sizeSearchToken(size: string): string {
  return size
    .replace(/\//g, '-')
    .replace(/,/g, '.')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

export function marketplaceQuery(listing: ListingLink): string {
  return listing.size.replace(/\s+/g, ' ').trim()
}

export function marketplaceSearchUrl(listing: ListingLink): string {
  const sizeToken = sizeSearchToken(listing.size)
  const sizeQ = encodeURIComponent(listing.size)
  switch (listing.source) {
    case 'OLX':
      return `https://www.olx.ua/uk/zapchasti-dlya-transporta/shiny-diski-i-kolesa/q-${sizeToken}/`
    case 'Prom':
      return `https://prom.ua/ua/search?search_term=${sizeQ}`
    case 'Autoline':
      return `https://autoline.ua/-/vantazhni-shini--c375`
    case 'Truck1':
      return `https://www.truck1.eu/spare-parts/tires/`
    case 'TyreClub':
      return tyreclubCatalogSearchUrl(listing.size)
    case 'Atlant':
      return atlantSizeSearchUrl(listing.size)
    default:
      return `https://www.olx.ua/uk/zapchasti-dlya-transporta/shiny-diski-i-kolesa/q-${sizeToken}/`
  }
}

function splitSize(size: string): { w: string; h: string; d: string } | null {
  const match = size.match(/(\d+)\s*\/\s*(\d+)\s*R\s*(\d+(?:[.,]\d+)?)/i)
  if (!match) return null
  return { w: match[1], h: match[2], d: match[3].replace(',', '.') }
}

export function tyreclubCatalogSearchUrl(size: string): string {
  const parts = splitSize(size)
  if (!parts) return 'https://tyreclub.com.ua/catalog/tyre/cargo/'
  return `https://tyreclub.com.ua/catalog/tyre/cargo/w-${parts.w}/h-${parts.h}/d-${parts.d}/`
}

export function atlantSizeSearchUrl(size: string): string {
  const parts = splitSize(size)
  if (!parts) return 'https://atlantshina.com.ua/'
  return `https://atlantshina.com.ua/search?width=${parts.w}&heigth=${parts.h}&r=${parts.d}&type=0`
}

/** True only for a concrete ad/product page, not a category or search. */
export function isLiveAdUrl(url?: string): boolean {
  if (!url) return false
  try {
    const parsed = new URL(url)
    const host = parsed.hostname.replace(/^www\./, '')
    const path = parsed.pathname
    if (host === 'olx.ua' || host.endsWith('.olx.ua')) {
      return /ID\d{6,}/i.test(path) || /obyavlenie\/[^/]*-\d{8,}/i.test(path)
    }
    if (host === 'prom.ua' || host.endsWith('.prom.ua')) {
      return /\/p\d{6,}/.test(path)
    }
    if (host === 'autoline.ua' || host.endsWith('.autoline.ua')) {
      return /\/-\/(prodazh|aukcion)\//.test(path) && /--\d{10,}/.test(path)
    }
    if (host === 'truck1.eu' || host.endsWith('.truck1.eu')) {
      return /\/\d{6,}(?:-|$|\/)/.test(path) && !path.includes('/spare-parts/tires')
    }
    if (host === 'atlantshina.com.ua') {
      return /^\/item\/\d+/.test(path)
    }
    if (host === 'tyreclub.com.ua') {
      return /\/catalog\/tyre\/v-\d+/.test(path)
    }
    return false
  } catch {
    return false
  }
}

export function listingHref(listing: ListingLink & { url?: string }): string {
  const url = listing.url?.trim()
  if (url && isLiveAdUrl(url)) return url
  return marketplaceSearchUrl(listing)
}

export function sourceHomeUrl(source: Source): string {
  switch (source) {
    case 'OLX':
      return 'https://www.olx.ua/uk/zapchasti-dlya-transporta/shiny-diski-i-kolesa/'
    case 'Prom':
      return 'https://prom.ua/ua/search?search_term=385%2F65%20R22.5'
    case 'Autoline':
      return 'https://autoline.ua/-/vantazhni-shini--c375'
    case 'Truck1':
      return 'https://www.truck1.eu/spare-parts/tires/'
    case 'TyreClub':
      return 'https://tyreclub.com.ua/catalog/tyre/cargo/'
    case 'Atlant':
      return 'https://atlantshina.com.ua/'
    default:
      return 'https://www.olx.ua/uk/zapchasti-dlya-transporta/shiny-diski-i-kolesa/'
  }
}

export function openMarketplace(listing: ListingLink & { url?: string }): void {
  window.open(listingHref(listing), '_blank', 'noopener,noreferrer')
}
