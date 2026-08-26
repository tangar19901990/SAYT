import { TireCard } from '../components/TireCard'
import { useHunter } from '../store'

export function SavedPage() {
  const { all, savedIds, unsaveListing } = useHunter()
  const saved = all.filter((item) => savedIds.includes(item.id))

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <div>
        <p className="text-[11px] uppercase tracking-[0.22em] text-[#8b90a0]">Watchlist</p>
        <h1 className="mt-1 text-3xl font-bold">Збережені</h1>
        <p className="mt-1 text-sm text-[#8b90a0]">{saved.length} у D1 пайплайні</p>
      </div>
      {saved.length === 0 ? (
        <div className="rounded-2xl border border-[#262a33] p-10 text-center text-[#8b90a0]">
          Немає збережених оголошень.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {saved.map((item) => (
            <div key={item.id} className="space-y-2">
              <TireCard listing={item} />
              <button
                type="button"
                onClick={() => unsaveListing(item.id)}
                className="w-full rounded-xl border border-[#323743] px-4 py-2 text-sm text-[#8b90a0]"
              >
                Прибрати зі збережених
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
