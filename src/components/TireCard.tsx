import { Bookmark, Eye, MapPin, Warehouse } from 'lucide-react'
import { formatSignedUah, formatUah } from '../lib/format'
import { listingPlaceLabel } from '../lib/geo'
import { useHunter } from '../store'
import type { TireListing } from '../types'
import { ScoreBadge, ScoreMeter } from './ScoreBadge'

export function TireCard({ listing, compact = false }: { listing: TireListing; compact?: boolean }) {
  const { setSelected, openListing, saveListing, addToStock, savedIds, stockIds, settings } = useHunter()

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-[#262a33] bg-[#16181f]">
      <button type="button" onClick={() => setSelected(listing)} className="relative block overflow-hidden">
        <img src={listing.image} alt={`${listing.brand} ${listing.model}`} className="h-44 w-full object-cover" />
        <div className="absolute left-3 top-3">
          <ScoreBadge score={listing.score} status={listing.status} />
        </div>
        <div className="absolute bottom-3 right-3 rounded-md bg-black/70 px-2 py-1 text-[11px] font-medium text-white">
          {listing.source}
        </div>
      </button>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-[#8b90a0]">{listing.brand}</p>
          <h3 className="mt-1 text-base font-semibold text-white">{listing.model}</h3>
          <p className="mt-0.5 text-sm text-[#8b90a0]">{listing.size}</p>
        </div>

        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-[11px] text-[#8b90a0]">Ціна</p>
            <p className="text-2xl font-bold tabular-nums text-white">{formatUah(listing.price)}</p>
          </div>
          <p className="text-sm font-semibold tabular-nums text-[#3ddc97]">{formatSignedUah(listing.profit)}</p>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs text-[#8b90a0]">
          <span>Залишок {listing.remaining}%</span>
          <span>DOT {listing.dot}</span>
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-3 w-3" /> {listingPlaceLabel(listing, settings.defaultRegion)}
          </span>
          <span>{listing.condition}</span>
        </div>

        {!compact && (
          <div className="space-y-2 rounded-xl border border-[#262a33] bg-[#111318] p-3">
            <div className="flex items-center justify-between text-xs text-[#8b90a0]">
              <span>AI SCORE</span>
              <span className="font-semibold text-white">{listing.score}/100</span>
            </div>
            <ScoreMeter score={listing.score} />
            <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
              <div>
                <p className="text-[#8b90a0]">Собівартість</p>
                <p className="font-medium text-white">{formatUah(listing.cost)}</p>
              </div>
              <div>
                <p className="text-[#8b90a0]">Орієнтир продажу</p>
                <p className="font-medium text-white">{formatUah(listing.sellPrice)}</p>
              </div>
              <div>
                <p className="text-[#8b90a0]">Прибуток</p>
                <p className="font-semibold text-[#3ddc97]">{formatSignedUah(listing.profit)}</p>
              </div>
              <div>
                <p className="text-[#8b90a0]">ROI</p>
                <p className="font-medium text-white">{listing.roi}%</p>
              </div>
            </div>
          </div>
        )}

        <div className="mt-auto grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => openListing(listing)}
            className="inline-flex items-center justify-center gap-1 rounded-lg bg-[#f5c518] px-2 py-2 text-[11px] font-semibold text-black"
          >
            <Eye className="h-3.5 w-3.5" /> Відкрити
          </button>
          <button
            type="button"
            onClick={() => saveListing(listing.id)}
            className="inline-flex items-center justify-center gap-1 rounded-lg border border-[#323743] px-2 py-2 text-[11px] font-medium text-white"
          >
            <Bookmark className="h-3.5 w-3.5" /> {savedIds.includes(listing.id) ? 'В watchlist' : 'Зберегти'}
          </button>
          <button
            type="button"
            onClick={() => addToStock(listing.id)}
            className="inline-flex items-center justify-center gap-1 rounded-lg border border-[#323743] px-2 py-2 text-[11px] font-medium text-white"
          >
            <Warehouse className="h-3.5 w-3.5" /> {stockIds.includes(listing.id) ? 'На складі' : 'Склад'}
          </button>
        </div>
      </div>
    </article>
  )
}
