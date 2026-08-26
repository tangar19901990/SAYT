import type { ReactNode } from 'react'
import { LayoutGrid, Rocket, Table2 } from 'lucide-react'
import { BRANDS, CITIES, REGIONS, SIZES } from '../data/listings'
import { EMPTY_RESULT_FILTERS } from '../lib/filter'
import { useHunter } from '../store'
import { AiAdvisor } from '../components/AiAdvisor'
import { TireCard } from '../components/TireCard'
import { ScoreBadge } from '../components/ScoreBadge'
import { formatSignedUah, formatUah } from '../lib/format'
import { listingPlaceLabel } from '../lib/geo'
import type { Source } from '../types'

const ALL_SOURCES: Source[] = ['OLX', 'Prom', 'Autoline', 'Truck1', 'TyreClub', 'Atlant', 'Інші']

export function SearchPage() {
  const {
    search,
    setSearch,
    runSearch,
    hasSearched,
    searching,
    results,
    resultTotal,
    catalogTotal,
    sourceStatuses,
    resultFilters,
    setResultFilters,
    sort,
    setSort,
    view,
    setView,
    setSelected,
    settings,
  } = useHunter()

  const toggleSource = (source: Source) => {
    const next = search.sources.includes(source)
      ? search.sources.filter((item) => item !== source)
      : [...search.sources, source]
    setSearch({ ...search, sources: next.length ? next : search.sources })
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <p className="text-[11px] uppercase tracking-[0.22em] text-[#8b90a0]">Пошук</p>
        <h1 className="mt-1 text-3xl font-bold">AI пошук шин</h1>
        <p className="mt-1 text-sm text-[#8b90a0]">Задайте розмір і параметри — агент відфільтрує ринок України.</p>
      </div>

      <section className="rounded-2xl border border-[#262a33] bg-[#111318] p-5 sm:p-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Field label="Розмір">
            <select
              value={search.size}
              onChange={(e) => setSearch({ ...search, size: e.target.value })}
              className="field"
            >
              {SIZES.map((size) => (
                <option key={size}>{size}</option>
              ))}
            </select>
          </Field>
          <Field label="Бренд">
            <select
              value={search.brand}
              onChange={(e) => setSearch({ ...search, brand: e.target.value })}
              className="field"
            >
              <option>Будь-який</option>
              {BRANDS.map((brand) => (
                <option key={brand}>{brand}</option>
              ))}
            </select>
          </Field>
          <Field label="Стан">
            <select
              value={search.condition}
              onChange={(e) => setSearch({ ...search, condition: e.target.value as typeof search.condition })}
              className="field"
            >
              <option>Будь-який</option>
              <option>Нова</option>
              <option>Б/В</option>
            </select>
          </Field>
          <Field label={`Мінімальний залишок: ${search.minRemaining}%`}>
            <input
              type="range"
              min={40}
              max={100}
              value={search.minRemaining}
              onChange={(e) => setSearch({ ...search, minRemaining: Number(e.target.value) })}
              className="w-full"
            />
          </Field>
          <Field label="Максимальна ціна">
            <input
              type="number"
              value={search.maxPrice}
              onChange={(e) => setSearch({ ...search, maxPrice: Number(e.target.value) })}
              className="field"
            />
          </Field>
          <Field label="Кількість">
            <input
              type="number"
              min={1}
              value={search.quantity}
              onChange={(e) => setSearch({ ...search, quantity: Number(e.target.value) })}
              className="field"
            />
          </Field>
          <Field label="Регіон">
            <select
              value={search.region}
              onChange={(e) => setSearch({ ...search, region: e.target.value })}
              className="field"
            >
              <option>Україна</option>
              {REGIONS.map((region) => (
                <option key={region}>{region}</option>
              ))}
            </select>
          </Field>
          <Field label={`Радіус: ${search.radius} км`}>
            <input
              type="range"
              min={50}
              max={800}
              step={50}
              value={search.radius}
              onChange={(e) => setSearch({ ...search, radius: Number(e.target.value) })}
              className="w-full"
            />
          </Field>
        </div>

        <div className="mt-5">
          <p className="mb-2 text-xs text-[#8b90a0]">Джерела</p>
          <div className="flex flex-wrap gap-2">
            {ALL_SOURCES.map((source) => {
              const on = search.sources.includes(source)
              return (
                <button
                  key={source}
                  type="button"
                  onClick={() => toggleSource(source)}
                  className={`rounded-full border px-3 py-1.5 text-sm ${
                    on ? 'border-[#f5c518]/50 bg-[#f5c518]/10 text-[#f5c518]' : 'border-[#323743] text-[#8b90a0]'
                  }`}
                >
                  {on ? '☑' : '☐'} {source}
                </button>
              )
            })}
          </div>
        </div>

        <button
          type="button"
          onClick={() => runSearch()}
          disabled={searching}
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#f5c518] px-6 py-4 text-base font-extrabold tracking-wide text-black sm:w-auto disabled:opacity-60"
        >
          <Rocket className="h-5 w-5" /> {searching ? 'ШУКАЄМО…' : 'ЗАПУСТИТИ AI ПОШУК'}
        </button>
      </section>

      <AiAdvisor />

      {hasSearched && (
        <section className="space-y-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-xl font-semibold">
                {searching ? 'Агент шукає…' : `Знайдено ${resultTotal} пропозицій`}
              </h2>
              <p className="mt-1 text-sm text-[#8b90a0]">
                Показано {results.length} з каталогу {catalogTotal}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} className="field w-auto">
                <option value="best">Найвигідніші</option>
                <option value="profit">Прибуток</option>
                <option value="score">AI Score</option>
                <option value="price-asc">Ціна ↑</option>
                <option value="price-desc">Ціна ↓</option>
                <option value="remaining">Залишок</option>
              </select>
              <div className="flex rounded-xl border border-[#323743] p-1">
                <button
                  type="button"
                  onClick={() => setView('cards')}
                  className={`rounded-lg px-3 py-1.5 text-xs ${view === 'cards' ? 'bg-[#f5c518] text-black' : 'text-[#8b90a0]'}`}
                >
                  <LayoutGrid className="mr-1 inline h-3.5 w-3.5" /> Картки
                </button>
                <button
                  type="button"
                  onClick={() => setView('table')}
                  className={`rounded-lg px-3 py-1.5 text-xs ${view === 'table' ? 'bg-[#f5c518] text-black' : 'text-[#8b90a0]'}`}
                >
                  <Table2 className="mr-1 inline h-3.5 w-3.5" /> Таблиця
                </button>
              </div>
            </div>
          </div>

          {sourceStatuses.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {sourceStatuses.map((item) => (
                <span
                  key={item.name}
                  className={`rounded-full border px-3 py-1 text-xs ${
                    item.state === 'ok'
                      ? 'border-[#3ddc97]/40 text-[#3ddc97]'
                      : item.state === 'blocked'
                        ? 'border-[#ff5c5c]/40 text-[#ff5c5c]'
                        : 'border-[#f5a524]/40 text-[#f5a524]'
                  }`}
                  title={item.detail}
                >
                  {item.name}: {item.state.toUpperCase()}
                </span>
              ))}
            </div>
          )}

          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            <FilterChip
              label="Ціна"
              value={resultFilters.priceMax ? `до ${resultFilters.priceMax}` : ''}
              onClear={() => setResultFilters({ ...resultFilters, priceMax: null })}
            >
              <select
                className="field"
                value={resultFilters.priceMax ?? ''}
                onChange={(e) => setResultFilters({ ...resultFilters, priceMax: e.target.value ? Number(e.target.value) : null })}
              >
                <option value="">Усі</option>
                <option value="6000">до 6 000</option>
                <option value="8000">до 8 000</option>
                <option value="10000">до 10 000</option>
                <option value="12000">до 12 000</option>
              </select>
            </FilterChip>
            <FilterChip label="Бренд" value={resultFilters.brand} onClear={() => setResultFilters({ ...resultFilters, brand: '' })}>
              <select className="field" value={resultFilters.brand} onChange={(e) => setResultFilters({ ...resultFilters, brand: e.target.value })}>
                <option value="">Усі</option>
                {BRANDS.map((brand) => (
                  <option key={brand}>{brand}</option>
                ))}
              </select>
            </FilterChip>
            <FilterChip
              label="Залишок"
              value={resultFilters.remainingMin ? `${resultFilters.remainingMin}%+` : ''}
              onClear={() => setResultFilters({ ...resultFilters, remainingMin: null })}
            >
              <select
                className="field"
                value={resultFilters.remainingMin ?? ''}
                onChange={(e) => setResultFilters({ ...resultFilters, remainingMin: e.target.value ? Number(e.target.value) : null })}
              >
                <option value="">Усі</option>
                <option value="60">60%+</option>
                <option value="70">70%+</option>
                <option value="80">80%+</option>
                <option value="90">90%+</option>
              </select>
            </FilterChip>
            <FilterChip label="DOT" value={resultFilters.dotMin ? String(resultFilters.dotMin) : ''} onClear={() => setResultFilters({ ...resultFilters, dotMin: null })}>
              <select
                className="field"
                value={resultFilters.dotMin ?? ''}
                onChange={(e) => setResultFilters({ ...resultFilters, dotMin: e.target.value ? Number(e.target.value) : null })}
              >
                <option value="">Усі</option>
                <option value="2020">2020+</option>
                <option value="2021">2021+</option>
                <option value="2022">2022+</option>
                <option value="2023">2023+</option>
              </select>
            </FilterChip>
            <FilterChip label="Регіон" value={resultFilters.region} onClear={() => setResultFilters({ ...resultFilters, region: '' })}>
              <select className="field" value={resultFilters.region} onChange={(e) => setResultFilters({ ...resultFilters, region: e.target.value })}>
                <option value="">Усі</option>
                {CITIES.map((city) => (
                  <option key={city}>{city}</option>
                ))}
              </select>
            </FilterChip>
            <FilterChip label="Джерело" value={resultFilters.source} onClear={() => setResultFilters({ ...resultFilters, source: '' })}>
              <select className="field" value={resultFilters.source} onChange={(e) => setResultFilters({ ...resultFilters, source: e.target.value })}>
                <option value="">Усі</option>
                {ALL_SOURCES.map((source) => (
                  <option key={source}>{source}</option>
                ))}
              </select>
            </FilterChip>
            <FilterChip
              label="Рейтинг"
              value={resultFilters.rating}
              onClear={() => setResultFilters({ ...resultFilters, rating: '' })}
            >
              <select className="field" value={resultFilters.rating} onChange={(e) => setResultFilters({ ...resultFilters, rating: e.target.value })}>
                <option value="">Усі</option>
                <option value="excellent">90–100 Відмінна</option>
                <option value="good">75+ Вигідно</option>
                <option value="check">60+ Перевірити</option>
              </select>
            </FilterChip>
            <button
              type="button"
              onClick={() => setResultFilters(EMPTY_RESULT_FILTERS)}
              className="rounded-full border border-[#323743] px-3 py-1.5 text-xs text-[#8b90a0]"
            >
              Скинути
            </button>
          </div>

          {results.length === 0 ? (
            <div className="rounded-2xl border border-[#262a33] bg-[#16181f] p-10 text-center text-[#8b90a0]">
              Нічого не знайдено за цими фільтрами.
            </div>
          ) : view === 'cards' ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {results.map((listing) => (
                <TireCard key={listing.id} listing={listing} />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-[#262a33]">
              <table className="min-w-[860px] w-full text-left text-sm">
                <thead className="bg-[#16181f] text-xs uppercase tracking-wide text-[#8b90a0]">
                  <tr>
                    <th className="px-4 py-3">Шина</th>
                    <th className="px-4 py-3">Ціна</th>
                    <th className="px-4 py-3">Залишок</th>
                    <th className="px-4 py-3">DOT</th>
                    <th className="px-4 py-3">Місто / км</th>
                    <th className="px-4 py-3">Score</th>
                    <th className="px-4 py-3">Прибуток</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((listing) => (
                    <tr
                      key={listing.id}
                      onClick={() => setSelected(listing)}
                      className="cursor-pointer border-t border-[#262a33] hover:bg-[#16181f]"
                    >
                      <td className="px-4 py-3">
                        <p className="font-semibold">{listing.brand} {listing.model}</p>
                        <p className="text-xs text-[#8b90a0]">{listing.size} · {listing.source}</p>
                      </td>
                      <td className="px-4 py-3 tabular-nums">{formatUah(listing.price)}</td>
                      <td className="px-4 py-3">{listing.remaining}%</td>
                      <td className="px-4 py-3">{listing.dot}</td>
                      <td className="px-4 py-3">{listingPlaceLabel(listing, settings.defaultRegion)}</td>
                      <td className="px-4 py-3"><ScoreBadge score={listing.score} /></td>
                      <td className="px-4 py-3 font-semibold text-[#3ddc97]">{formatSignedUah(listing.profit)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </div>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block space-y-1.5 text-sm">
      <span className="text-xs text-[#8b90a0]">{label}</span>
      {children}
    </label>
  )
}

function FilterChip({
  label,
  value,
  onClear,
  children,
}: {
  label: string
  value: string
  onClear: () => void
  children: ReactNode
}) {
  return (
    <div className="min-w-[140px] rounded-xl border border-[#262a33] bg-[#16181f] p-2">
      <div className="mb-1 flex items-center justify-between text-[10px] uppercase tracking-wide text-[#8b90a0]">
        <span>{label}</span>
        {value ? (
          <button type="button" onClick={onClear} className="text-[#f5c518]">
            ×
          </button>
        ) : null}
      </div>
      {children}
    </div>
  )
}
