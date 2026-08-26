import { formatSignedUah, formatUah } from '../lib/format'
import { useHunter } from '../store'

export function ProfitPage() {
  const { all, workIds, stockIds, releaseWork, removeFromStock } = useHunter()
  const work = all.filter((item) => workIds.includes(item.id))
  const stock = all.filter((item) => stockIds.includes(item.id))
  const pipeline = [...work, ...stock.filter((item) => !workIds.includes(item.id))]
  const total = pipeline.reduce((sum, item) => sum + item.profit, 0)
  const invested = pipeline.reduce((sum, item) => sum + item.cost, 0)

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <p className="text-[11px] uppercase tracking-[0.22em] text-[#8b90a0]">P&L</p>
        <h1 className="mt-1 text-3xl font-bold">Прибуток</h1>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Tile label="Потенційний прибуток" value={formatSignedUah(total)} />
        <Tile label="Інвестиція" value={formatUah(invested)} />
        <Tile label="У роботі" value={String(pipeline.length)} />
      </div>

      <div className="space-y-3">
        {pipeline.length === 0 ? (
          <div className="rounded-2xl border border-[#262a33] p-8 text-center text-[#8b90a0]">
            Поки немає шин у роботі. Заберіть угоду з Deal Finder.
          </div>
        ) : (
          pipeline.map((item) => (
            <div key={item.id} className="flex items-center justify-between gap-4 rounded-2xl border border-[#262a33] bg-[#16181f] p-4">
              <div>
                <p className="font-semibold">{item.brand} {item.model}</p>
                <p className="text-sm text-[#8b90a0]">{item.size} · {item.city}</p>
              </div>
              <div className="flex items-center gap-3">
                <p className="text-lg font-bold tabular-nums text-[#3ddc97]">{formatSignedUah(item.profit)}</p>
                <button
                  type="button"
                  onClick={() => (workIds.includes(item.id) ? releaseWork(item.id) : removeFromStock(item.id))}
                  className="rounded-lg border border-[#323743] px-3 py-1.5 text-xs text-[#8b90a0]"
                >
                  Зняти
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[#262a33] bg-[#16181f] p-5">
      <p className="text-xs text-[#8b90a0]">{label}</p>
      <p className="mt-2 text-2xl font-bold tabular-nums">{value}</p>
    </div>
  )
}
