import { useEffect, useState } from 'react'
import { REGIONS, SIZES } from '../data/listings'
import { useHunter } from '../store'

export function SettingsPage() {
  const { settings, saveSettingsLocal, setAgentPower, agentRunning, apiOnline } = useHunter()
  const [radius, setRadius] = useState(settings.radius)
  const [minScore, setMinScore] = useState(settings.minScore)
  const [notify, setNotify] = useState(settings.notify)
  const [defaultSize, setDefaultSize] = useState(settings.defaultSize)
  const [defaultRegion, setDefaultRegion] = useState(settings.defaultRegion)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setRadius(settings.radius)
    setMinScore(settings.minScore)
    setNotify(settings.notify)
    setDefaultSize(settings.defaultSize)
    setDefaultRegion(settings.defaultRegion)
  }, [settings])

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <p className="text-[11px] uppercase tracking-[0.22em] text-[#8b90a0]">Система</p>
        <h1 className="mt-1 text-3xl font-bold">Налаштування</h1>
        <p className="mt-1 text-sm text-[#8b90a0]">
          Зберігаються в D1. {apiOnline ? 'API online.' : 'Офлайн — зміни лишаться в сесії.'}
        </p>
      </div>

      <section className="space-y-4 rounded-2xl border border-[#262a33] bg-[#111318] p-5">
        <div className="flex items-center justify-between rounded-xl border border-[#262a33] bg-[#16181f] px-4 py-3">
          <div>
            <p className="text-sm font-semibold">AI Agent</p>
            <p className="text-xs text-[#8b90a0]">{agentRunning ? 'Працює: каталог + probe джерел' : 'На паузі. Каталог лишається.'}</p>
          </div>
          <button
            type="button"
            onClick={() => void setAgentPower(!agentRunning)}
            className={`rounded-xl px-4 py-2 text-sm font-semibold ${
              agentRunning ? 'border border-[#323743] text-white' : 'bg-[#f5c518] text-black'
            }`}
          >
            {agentRunning ? 'Зупинити' : 'Запустити'}
          </button>
        </div>

        <label className="block space-y-2">
          <span className="text-sm text-[#8b90a0]">Радіус пошуку за замовчуванням: {radius} км</span>
          <input type="range" min={50} max={800} step={50} value={radius} onChange={(e) => setRadius(Number(e.target.value))} className="w-full" />
        </label>
        <label className="block space-y-2">
          <span className="text-sm text-[#8b90a0]">Мінімальний AI Score для угод: {minScore}</span>
          <input type="range" min={50} max={95} value={minScore} onChange={(e) => setMinScore(Number(e.target.value))} className="w-full" />
        </label>
        <label className="block space-y-2">
          <span className="text-sm text-[#8b90a0]">Розмір за замовчуванням</span>
          <select value={defaultSize} onChange={(e) => setDefaultSize(e.target.value)} className="field">
            {SIZES.map((size) => (
              <option key={size}>{size}</option>
            ))}
          </select>
        </label>
        <label className="block space-y-2">
          <span className="text-sm text-[#8b90a0]">Регіон за замовчуванням</span>
          <select value={defaultRegion} onChange={(e) => setDefaultRegion(e.target.value)} className="field">
            <option>Україна</option>
            {REGIONS.map((region) => (
              <option key={region}>{region}</option>
            ))}
          </select>
        </label>
        <label className="flex items-center justify-between rounded-xl border border-[#262a33] bg-[#16181f] px-4 py-3 text-sm">
          Сповіщення про вигідні угоди
          <input type="checkbox" checked={notify} onChange={(e) => setNotify(e.target.checked)} />
        </label>
        <button
          type="button"
          disabled={saving}
          onClick={() => {
            setSaving(true)
            void saveSettingsLocal({ radius, minScore, notify, defaultSize, defaultRegion }).finally(() => setSaving(false))
          }}
          className="rounded-xl bg-[#f5c518] px-4 py-3 text-sm font-semibold text-black disabled:opacity-60"
        >
          {saving ? 'Зберігаємо…' : 'Зберегти в D1'}
        </button>
      </section>
    </div>
  )
}
