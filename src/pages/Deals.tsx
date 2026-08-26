import { Eye, Flame } from 'lucide-react'
import { formatSignedUah, formatUah } from '../lib/format'
import { listingPlaceLabel } from '../lib/geo'
import { useHunter } from '../store'
import { ScoreBadge } from '../components/ScoreBadge'

export function DealsPage() {
  const { all, setSelected, openListing, takeToWork, workIds, settings, agent } = useHunter()
  const pool = agent?.hunted?.length ? agent.hunted : all
  const deals = [...pool].filter((item) => item.score >= settings.minScore).sort((a, b) => b.profit - a.profit)

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <div>
        <p className="text-[11px] uppercase tracking-[0.22em] text-[#8b90a0]">Deal Finder</p>
        <h1 className="mt-1 flex items-center gap-2 text-3xl font-bold">
          <Flame className="h-7 w-7 text-[#f5c518]" /> Найкращі угоди
        </h1>
        <p className="mt-1 text-sm text-[#8b90a0]">Пропозиції з найбільшим потенційним прибутком.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {deals.map((item) => (
          <article key={item.id} className="rounded-2xl border border-[#262a33] bg-[#16181f] p-5">
            <div className="flex gap-4">
              <img src={item.image} alt="" className="h-24 w-24 rounded-xl object-cover" />
              <div className="min-w-0 flex-1">
                <p className="text-[11px] uppercase tracking-[0.16em] text-[#8b90a0]">{item.brand}</p>
                <h3 className="text-lg font-semibold">{item.model}</h3>
                <p className="text-sm text-[#8b90a0]">{item.size} · {listingPlaceLabel(item, settings.defaultRegion)}</p>
                <div className="mt-2">
                  <ScoreBadge score={item.score} status={item.status} />
                </div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
              <Metric label="Купівля" value={formatUah(item.price)} />
              <Metric label="Доставка" value={formatUah(item.delivery)} />
              <Metric label="Собівартість" value={formatUah(item.cost)} />
              <Metric label="Орієнтир продажу" value={formatUah(item.sellPrice)} />
              <Metric label="ПРИБУТОК" value={formatSignedUah(item.profit)} accent />
              <Metric label="ROI" value={`${item.roi}%`} />
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
              <button
                type="button"
                onClick={() => openListing(item)}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#f5c518] px-4 py-3 text-sm font-bold text-black"
              >
                <Eye className="h-4 w-4" /> Відкрити
              </button>
              <button
                type="button"
                onClick={() => takeToWork(item.id)}
                className="rounded-xl border border-[#f5c518]/40 px-4 py-3 text-sm font-bold text-[#f5c518]"
              >
                {workIds.includes(item.id) ? 'ЗНЯТИ З РОБОТИ' : 'ЗАБРАТИ В РОБОТУ'}
              </button>
              <button
                type="button"
                onClick={() => setSelected(item)}
                className="rounded-xl border border-[#323743] px-4 py-3 text-sm"
              >
                Деталі
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}

function Metric({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-xl border border-[#262a33] bg-[#111318] p-3">
      <p className="text-[11px] text-[#8b90a0]">{label}</p>
      <p className={`mt-1 font-semibold tabular-nums ${accent ? 'text-[#3ddc97]' : 'text-white'}`}>{value}</p>
    </div>
  )
}
