import { useState } from 'react'
import { Loader2, Sparkles } from 'lucide-react'
import { postAiAnalyze, type AiAnalyzeResponse } from '../lib/api'
import { useHunter } from '../store'

export function AiAdvisor() {
  const { search, results, hasSearched, pushToast } = useHunter()
  const [loading, setLoading] = useState(false)
  const [report, setReport] = useState<AiAnalyzeResponse | null>(null)

  const analyze = async () => {
    if (loading) return
    setLoading(true)
    try {
      const ids = hasSearched ? results.slice(0, 14).map((item) => item.id) : undefined
      const data = await postAiAnalyze(search.size, ids)
      setReport(data)
      pushToast({
        title: 'AI Genspark',
        message: data.fallback
          ? `Аналіз готовий (локальна евристика, ${data.analyzed} оголошень)`
          : `Аналіз готовий: ${data.analyzed} оголошень · ${data.model}`,
        tone: 'success',
      })
    } catch {
      pushToast({ title: 'AI Genspark', message: 'Не вдалося отримати аналіз. Спробуйте ще раз.', tone: 'warn' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="rounded-2xl border border-[#7c5cff]/30 bg-gradient-to-br from-[#151226] to-[#111318] p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-[#a78bfa]">
            <Sparkles className="h-3.5 w-3.5" /> AI Genspark
          </p>
          <h2 className="mt-1 text-lg font-semibold text-white">Розумний аналіз хантингу</h2>
          <p className="mt-0.5 text-sm text-[#8b90a0]">
            ШІ перегляне живі оголошення {search.size} і скаже, що купувати, які ризики та як торгуватись.
          </p>
        </div>
        <button
          type="button"
          onClick={analyze}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl bg-[#7c5cff] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {loading ? 'Аналізую ринок…' : report ? 'Оновити аналіз' : 'Запустити AI аналіз'}
        </button>
      </div>

      {report && (
        <div className="mt-4 rounded-xl border border-[#7c5cff]/20 bg-[#0d0b16] p-4">
          <div className="mb-2 flex items-center justify-between text-[11px] text-[#8b90a0]">
            <span>
              {report.analyzed} оголошень · {report.size}
            </span>
            <span className={report.fallback ? 'text-[#f5c518]' : 'text-[#a78bfa]'}>
              {report.fallback ? 'локальна евристика' : `модель ${report.model}`}
            </span>
          </div>
          <div className="whitespace-pre-wrap text-sm leading-relaxed text-[#e4e6ee]">{report.analysis}</div>
        </div>
      )}
    </section>
  )
}
