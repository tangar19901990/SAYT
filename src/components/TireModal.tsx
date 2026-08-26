import { Bookmark, Eye, X, Warehouse } from 'lucide-react'
import { formatSignedUah, formatUah } from '../lib/format'
import { listingPlaceLabel } from '../lib/geo'
import { useHunter } from '../store'
import { ScoreBadge, ScoreMeter } from './ScoreBadge'

export function TireModal() {
  const { selected, setSelected, openListing, saveListing, addToStock, takeToWork, savedIds, stockIds, workIds, settings } = useHunter()
  if (!selected) return null

  const listing = selected
  const factors = [
    ['Ціна', formatUah(listing.price)],
    ['Бренд', listing.brand],
    ['Модель', listing.model],
    ['Залишок', `${listing.remaining}%`],
    ['DOT', String(listing.dot)],
    ['Стан', listing.condition],
    ['Регіон', listingPlaceLabel(listing, settings.defaultRegion)],
    ['Доставка', formatUah(listing.delivery)],
    ['Середня ціна ринку', formatUah(listing.sellPrice - 400)],
    ['Орієнтир продажу', formatUah(listing.sellPrice)],
    ['Маржа', formatSignedUah(listing.profit)],
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 sm:items-center sm:p-6" onClick={() => setSelected(null)}>
      <div
        className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-t-3xl border border-[#262a33] bg-[#111318] sm:rounded-3xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="grid gap-0 lg:grid-cols-[1.1fr_1fr]">
          <img src={listing.image} alt="" className="h-64 w-full object-cover lg:h-full" />
          <div className="space-y-5 p-5 sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] uppercase tracking-[0.18em] text-[#8b90a0]">{listing.brand}</p>
                <h2 className="mt-1 text-2xl font-bold text-white">{listing.model}</h2>
                <p className="text-[#8b90a0]">{listing.size}</p>
              </div>
              <button type="button" onClick={() => setSelected(null)} className="rounded-full border border-[#323743] p-2 text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <ScoreBadge score={listing.score} status={listing.status} />
              <span className="text-sm text-[#8b90a0]">{listing.source} · {listing.foundAt}</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-[#262a33] bg-[#16181f] p-4">
                <p className="text-xs text-[#8b90a0]">Купівля</p>
                <p className="mt-1 text-2xl font-bold tabular-nums">{formatUah(listing.price)}</p>
              </div>
              <div className="rounded-2xl border border-[#262a33] bg-[#16181f] p-4">
                <p className="text-xs text-[#8b90a0]">Прибуток</p>
                <p className="mt-1 text-2xl font-bold tabular-nums text-[#3ddc97]">{formatSignedUah(listing.profit)}</p>
              </div>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="text-[#8b90a0]">AI SCORE</span>
                <span className="font-bold">{listing.score}/100</span>
              </div>
              <ScoreMeter score={listing.score} />
            </div>

            <p className="text-sm leading-6 text-[#c5c8d1]">{listing.notes}</p>

            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              {factors.map(([label, value]) => (
                <div key={label} className="flex items-center justify-between gap-3 border-b border-[#1c1f28] py-1.5">
                  <span className="text-[#8b90a0]">{label}</span>
                  <span className="font-medium text-white">{value}</span>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => openListing(listing)}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#f5c518] px-4 py-3 text-sm font-semibold text-black"
              >
                <Eye className="h-4 w-4" /> Відкрити оголошення
              </button>
              <button
                type="button"
                onClick={() => takeToWork(listing.id)}
                className="rounded-xl border border-[#f5c518]/40 px-4 py-3 text-sm font-semibold text-[#f5c518]"
              >
                {workIds.includes(listing.id) ? 'Зняти з роботи' : 'Забрати в роботу'}
              </button>
              <button
                type="button"
                onClick={() => saveListing(listing.id)}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#323743] px-4 py-3 text-sm"
              >
                <Bookmark className="h-4 w-4" /> {savedIds.includes(listing.id) ? 'У збережених' : 'Зберегти'}
              </button>
              <button
                type="button"
                onClick={() => addToStock(listing.id)}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#323743] px-4 py-3 text-sm"
              >
                <Warehouse className="h-4 w-4" /> {stockIds.includes(listing.id) ? 'На складі' : 'Додати до складу'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
