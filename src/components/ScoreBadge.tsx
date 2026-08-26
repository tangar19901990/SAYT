import { scoreLabel } from '../lib/format'
import type { DealStatus } from '../types'

const TONE: Record<string, string> = {
  excellent: 'bg-[#f5c518]/12 text-[#f5c518] border-[#f5c518]/30',
  good: 'bg-[#3ddc97]/12 text-[#3ddc97] border-[#3ddc97]/30',
  check: 'bg-[#f5a524]/12 text-[#f5a524] border-[#f5a524]/30',
  bad: 'bg-[#ff5c5c]/12 text-[#ff5c5c] border-[#ff5c5c]/30',
}

const DOT: Record<string, string> = {
  excellent: 'bg-[#f5c518]',
  good: 'bg-[#3ddc97]',
  check: 'bg-[#f5a524]',
  bad: 'bg-[#ff5c5c]',
}

export function ScoreBadge({ score, status }: { score: number; status?: DealStatus }) {
  const tone = scoreLabel(score)
  return (
    <div className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs font-semibold ${TONE[tone]}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${DOT[tone]}`} />
      {status ?? `${score}/100`}
    </div>
  )
}

export function ScoreMeter({ score }: { score: number }) {
  const tone = scoreLabel(score)
  const color =
    tone === 'excellent'
      ? '#f5c518'
      : tone === 'good'
        ? '#3ddc97'
        : tone === 'check'
          ? '#f5a524'
          : '#ff5c5c'
  return (
    <div className="flex items-center gap-3">
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#262a33]">
        <div className="h-full rounded-full" style={{ width: `${score}%`, background: color }} />
      </div>
      <span className="text-sm font-bold tabular-nums" style={{ color }}>
        {score}
      </span>
    </div>
  )
}
