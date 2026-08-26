import type { DealStatus, Source, TireListing } from '../types'

export interface ListingRow {
  id: string
  brand: string
  model: string
  size: string
  price: number
  remaining: number
  dot: number
  city: string
  region: string
  source: string
  condition: string
  quantity: number
  delivery: number
  cost: number
  sell_price: number
  profit: number
  roi: number
  score: number
  status: string
  image: string
  url: string
  notes: string
  found_at: string
  created_at?: string
  updated_at?: string
}

export function listingToRow(listing: TireListing, now = new Date().toISOString()): ListingRow {
  return {
    id: listing.id,
    brand: listing.brand,
    model: listing.model,
    size: listing.size,
    price: listing.price,
    remaining: listing.remaining,
    dot: listing.dot,
    city: listing.city,
    region: listing.region,
    source: listing.source,
    condition: listing.condition,
    quantity: listing.quantity,
    delivery: listing.delivery,
    cost: listing.cost,
    sell_price: listing.sellPrice,
    profit: listing.profit,
    roi: listing.roi,
    score: listing.score,
    status: listing.status,
    image: listing.image,
    url: listing.url,
    notes: listing.notes,
    found_at: listing.foundAt,
    created_at: now,
    updated_at: now,
  }
}

export function rowToListing(row: ListingRow): TireListing {
  return {
    id: row.id,
    brand: row.brand,
    model: row.model,
    size: row.size,
    price: Number(row.price),
    remaining: Number(row.remaining),
    dot: Number(row.dot),
    city: row.city,
    region: row.region,
    source: row.source as Source,
    condition: row.condition as TireListing['condition'],
    quantity: Number(row.quantity),
    delivery: Number(row.delivery),
    cost: Number(row.cost),
    sellPrice: Number(row.sell_price),
    profit: Number(row.profit),
    roi: Number(row.roi),
    score: Number(row.score),
    status: row.status as DealStatus,
    image: row.image,
    url: row.url,
    notes: row.notes,
    foundAt: row.found_at,
  }
}
