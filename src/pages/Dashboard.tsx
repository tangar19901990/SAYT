import { Flame, Search, Settings, Sparkles } from 'lucide-react'
import { formatUah } from '../lib/format'
import { listingPlaceLabel } from '../lib/geo'
import { useHunter } from '../store'
import { TireCard } from '../components/TireCard'

export function Dashboard() {
  const { setPage, runSearch, agentRunning, all, kpi, lastQuery, apiOnline, usingFallback, settings, setAgentPower, agent, takeToWork, workIds } = useHunter()
  const hunted = agent?.hunted?.length ? agent.hunted : all
  const nextAction = agent?.nextAction ?? hunted.find((item) => item.score >= settings.minScore) ?? hunted[0] ?? null
  const best = hunted.slice(0, 3)

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.22em] text-[#8b90a0]">GT TIRES HUNTER</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-sm text-[#8b90a0]">AI знаходить. Ви заробляєте.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#3ddc97]/30 bg-[#3ddc97]/10 px-3 py-1.5 text-xs font-semibold text-[#3ddc97]">
            <span className="h-2 w-2 rounded-full bg-[#3ddc97] shadow-[0_0_8px_#3ddc97]" />
            {agentRunning ? 'AI AGENT ONLINE' : 'AI AGENT PAUSED'}
          </div>
          <div
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${
              apiOnline && !usingFallback
                ? 'border-[#3ddc97]/30 bg-[#3ddc97]/10 text-[#3ddc97]'
                : 'border-[#f5a524]/30 bg-[#f5a524]/10 text-[#f5a524]'
            }`}
          >
            {apiOnline ? (usingFallback ? 'API · CATALOG FALLBACK' : 'API ONLINE') : 'LOCAL SEED'}
          </div>
          <button
            type="button"
            onClick={() => runSearch()}
            className="rounded-xl bg-[#f5c518] px-4 py-2 text-sm font-semibold text-black"
          >
            Новий пошук
          </button>
          <button
            type="button"
            onClick={() => setPage('settings')}
            className="inline-flex items-center gap-2 rounded-xl border border-[#323743] px-4 py-2 text-sm"
          >
            <Settings className="h-4 w-4" /> Налаштування
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Знайдено сьогодні" value={String(kpi.foundToday)} hint={`у радіусі ${settings.radius} км`} />
        <Kpi label="Найкращих пропозицій" value={String(kpi.bestDeals)} hint="score 90+ у радіусі" />
        <Kpi label="Потенційний прибуток" value={formatUah(kpi.potentialProfit)} hint={`score ≥ ${settings.minScore}`} />
        <Kpi label="Активних пошуків" value={String(kpi.activeSearches)} hint={agentRunning ? 'агент працює' : 'агент на паузі'} />
      </div>

      <section className="rounded-2xl border border-[#262a33] bg-[#111318] p-5">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="h-4 w-4 text-[#f5c518]" />
            <h2 className="text-lg font-semibold">Найкращі угоди</h2>
          </div>
          <button type="button" onClick={() => setPage('deals')} className="text-sm text-[#f5c518]">
            Усі угоди
          </button>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          {best.map((listing) => (
            <TireCard key={listing.id} listing={listing} />
          ))}
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-[#262a33] bg-[#111318] p-5">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <Search className="h-4 w-4 text-[#f5c518]" /> Що шукається зараз
          </div>
          <p className="text-2xl font-bold">{lastQuery}</p>
          <p className="mt-1 text-sm text-[#8b90a0]">OLX · Prom · Autoline · Truck1 · радіус {settings.radius} км</p>
          <button type="button" onClick={() => void setAgentPower(!agentRunning)} className="mt-3 text-sm text-[#f5c518]">
            {agentRunning ? 'Зупинити агента' : 'Запустити агента'}
          </button>
        </div>
        <div className="rounded-2xl border border-[#262a33] bg-[#111318] p-5">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <Sparkles className="h-4 w-4 text-[#f5c518]" /> Наступна дія
          </div>
          {nextAction ? (
            <>
              <p className="text-sm leading-6 text-[#c5c8d1]">
                Відкрийте {nextAction.brand} {nextAction.model} за {formatUah(nextAction.price)}. Score {nextAction.score}, потенційний прибуток {formatUah(nextAction.profit)}.
              </p>
              <p className="mt-1 text-xs text-[#8b90a0]">{listingPlaceLabel(nextAction, settings.defaultRegion)} · {nextAction.size} · {nextAction.source}</p>
              <button
                type="button"
                onClick={() => takeToWork(nextAction.id)}
                className="mt-3 text-sm text-[#f5c518]"
              >
                {workIds.includes(nextAction.id) ? 'Уже в роботі' : 'Забрати в роботу'}
              </button>
            </>
          ) : (
            <p className="text-sm leading-6 text-[#c5c8d1]">У поточному радіусі ще немає угод. Розширте пошук або змініть розмір.</p>
          )}
        </div>
      </div>
    </div>
  )
}

function Kpi({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-2xl border border-[#262a33] bg-[#16181f] p-5">
      <p className="text-xs text-[#8b90a0]">{label}</p>
      <p className="mt-2 text-3xl font-bold tabular-nums tracking-tight">{value}</p>
      <p className="mt-1 text-xs text-[#5c6270]">{hint}</p>
    </div>
  )
}
