import { Bot, Eye } from 'lucide-react'
import { listingPlaceLabel } from '../lib/geo'
import { useHunter } from '../store'

export function AgentPage() {
  const { lastQuery, agent, sourceStatuses, catalogTotal, agentRunning, setAgentPower, settings, takeToWork, workIds, openListing } = useHunter()
  const hunted = agent?.hunted ?? []
  const nextAction = agent?.nextAction ?? hunted[0] ?? null
  const suitable = agent?.suitable ?? hunted.filter((item) => item.score >= settings.minScore).length
  const top = agent?.top ?? hunted.filter((item) => item.score >= 90).length
  const found = agent?.found ?? (hunted.length || catalogTotal)
  const rejected = agent?.rejected ?? hunted.filter((item) => item.score < settings.minScore).length
  const sources = agent?.sources?.length
    ? agent.sources
    : sourceStatuses.map((item) => ({
        name: item.name,
        progress: item.state === 'ok' ? 100 : item.state === 'fallback' ? 70 : 40,
        state: item.state,
        detail: item.detail,
      }))
  const logs = agent?.logs?.length
    ? agent.logs
    : [{ id: 'empty', text: 'Агент чекає перший пошук', done: false }]

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.22em] text-[#8b90a0]">GT HUNTER AI</p>
          <h1 className="mt-1 flex items-center gap-2 text-3xl font-bold">
            <Bot className="h-7 w-7 text-[#f5c518]" /> AI Agent
          </h1>
        </div>
        <button
          type="button"
          onClick={() => void setAgentPower(!agentRunning)}
          className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${
            agentRunning
              ? 'border-[#3ddc97]/30 bg-[#3ddc97]/10 text-[#3ddc97]'
              : 'border-[#8b90a0]/30 bg-[#16181f] text-[#8b90a0]'
          }`}
        >
          <span className={`h-2 w-2 rounded-full ${agentRunning ? 'bg-[#3ddc97] shadow-[0_0_8px_#3ddc97]' : 'bg-[#8b90a0]'}`} />
          {agentRunning ? 'ПРАЦЮЄ · СТОП' : 'НА ПАУЗІ · СТАРТ'}
        </button>
      </div>

      <div className="rounded-2xl border border-[#262a33] bg-[#111318] p-5">
        <p className="text-xs text-[#8b90a0]">Поточний пошук</p>
        <p className="mt-1 text-2xl font-bold">{agent?.lastQuery || lastQuery}</p>
        <p className="mt-2 text-sm text-[#8b90a0]">
          Радіус {settings.radius} км · minScore {settings.minScore} · {settings.defaultRegion}
          {agent?.scannedAt ? ` · скан ${new Date(agent.scannedAt).toLocaleTimeString('uk-UA')}` : ''}
        </p>
      </div>

      {nextAction ? (
        <div className="rounded-2xl border border-[#f5c518]/30 bg-[#f5c518]/5 p-5">
          <p className="text-xs uppercase tracking-[0.16em] text-[#f5c518]">Наступна дія</p>
          <p className="mt-1 text-lg font-semibold">{nextAction.brand} {nextAction.model}</p>
          <p className="mt-1 text-sm text-[#8b90a0]">
            {nextAction.size} · {listingPlaceLabel(nextAction, settings.defaultRegion)} · score {nextAction.score} · +{nextAction.profit.toLocaleString('uk-UA')} ₴
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => openListing(nextAction)}
              className="inline-flex items-center gap-2 rounded-xl bg-[#f5c518] px-4 py-2 text-sm font-semibold text-black"
            >
              <Eye className="h-4 w-4" /> Відкрити оголошення
            </button>
            <button
              type="button"
              onClick={() => takeToWork(nextAction.id)}
              className="rounded-xl border border-[#f5c518]/40 px-4 py-2 text-sm font-semibold text-[#f5c518]"
            >
              {workIds.includes(nextAction.id) ? 'Уже в роботі' : 'Забрати в роботу'}
            </button>
          </div>
        </div>
      ) : null}

      <div className="rounded-2xl border border-[#262a33] bg-[#16181f] p-5">
        <h2 className="mb-4 text-sm font-semibold">Прогрес по джерелах</h2>
        <div className="space-y-4">
          {sources.map((item) => (
            <div key={item.name}>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span>{item.name}</span>
                <span className="tabular-nums text-[#8b90a0]">
                  {item.progress}% · {item.state}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-[#262a33]">
                <div className="h-full rounded-full bg-[#f5c518]" style={{ width: `${item.progress}%` }} />
              </div>
              {'detail' in item && item.detail ? (
                <p className="mt-1 text-[11px] text-[#8b90a0]">{item.detail}</p>
              ) : null}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <Stat label="Знайдено" value={String(found)} />
        <Stat label="Дублікатів" value={String(agent?.duplicates ?? 0)} />
        <Stat label="Відсіяно" value={String(rejected)} />
        <Stat label="Підходить" value={String(suitable)} />
        <Stat label="ТОП" value={String(top)} />
      </div>

      {hunted.length > 0 ? (
        <div className="rounded-2xl border border-[#262a33] bg-[#111318] p-5">
          <h2 className="mb-4 text-sm font-semibold">У радіусі полювання</h2>
          <div className="space-y-2">
            {hunted.slice(0, 6).map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-3 rounded-xl border border-[#262a33] bg-[#16181f] px-3 py-2 text-sm">
                <div>
                  <p className="font-medium">{item.brand} {item.model}</p>
                  <p className="text-xs text-[#8b90a0]">{listingPlaceLabel(item, settings.defaultRegion)} · {item.size} · score {item.score}</p>
                </div>
                <p className="tabular-nums text-[#3ddc97]">+{item.profit.toLocaleString('uk-UA')} ₴</p>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className="rounded-2xl border border-[#262a33] bg-[#111318] p-5">
        <h2 className="mb-4 text-sm font-semibold">Live activity</h2>
        <div className="space-y-3">
          {logs.map((item) => (
            <p key={item.id} className="flex items-center gap-2 text-sm text-[#c5c8d1]">
              <span className={item.done ? 'text-[#3ddc97]' : 'text-[#f5a524]'}>{item.done ? '✓' : '•'}</span>
              {item.text}
            </p>
          ))}
        </div>
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[#262a33] bg-[#16181f] p-4">
      <p className="text-xs text-[#8b90a0]">{label}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums">{value}</p>
    </div>
  )
}
