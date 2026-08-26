import { formatSignedUah, formatUah } from '../lib/format'
import { listingPlaceLabel } from '../lib/geo'
import { useHunter } from '../store'
import type { TireListing } from '../types'
import { ScoreBadge } from './ScoreBadge'

export function TireTable({ listings }: { listings: TireListing[] }) {
  const { setSelected, settings } = useHunter()

  return (
    <div className="overflow-x-auto rounded-2xl border border-[#262a33]">
      <table className="min-w-[860px] w-full text-left text-sm">
        <thead className="bg-[#16181f] text-xs uppercase tracking-wide text-[#8b90a0]">
          <tr>
            <th className="px-4 py-3 font-medium">Фото</th>
            <th className="px-4 py-3 font-medium">Бренд</th>
            <th className="px-4 py-3 font-medium">Розмір</th>
            <th className="px-4 py-3 font-medium">DOT</th>
            <th className="px-4 py-3 font-medium">Залишок</th>
            <th className="px-4 py-3 font-medium">Ціна</th>
            <th className="px-4 py-3 font-medium">Місто / км</th>
            <th className="px-4 py-3 font-medium">Score</th>
            <th className="px-4 py-3 font-medium">Статус</th>
          </tr>
        </thead>
        <tbody>
          {listings.map((listing) => (
            <tr
              key={listing.id}
              onClick={() => setSelected(listing)}
              className="cursor-pointer border-t border-[#262a33] hover:bg-[#16181f]"
            >
              <td className="px-4 py-3">
                <img src={listing.image} alt="" className="h-12 w-12 rounded-lg object-cover" />
              </td>
              <td className="px-4 py-3">
                <p className="font-semibold">{listing.brand}</p>
                <p className="text-xs text-[#8b90a0]">{listing.model}</p>
              </td>
              <td className="px-4 py-3">{listing.size}</td>
              <td className="px-4 py-3">{listing.dot}</td>
              <td className="px-4 py-3">{listing.remaining}%</td>
              <td className="px-4 py-3 font-semibold">{formatUah(listing.price)}</td>
              <td className="px-4 py-3">{listingPlaceLabel(listing, settings.defaultRegion)}</td>
              <td className="px-4 py-3 font-bold">{listing.score}</td>
              <td className="px-4 py-3">
                <div className="flex flex-col gap-1">
                  <ScoreBadge score={listing.score} status={listing.status} />
                  <span className="text-xs text-[#3ddc97]">{formatSignedUah(listing.profit)}</span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
