import { X } from 'lucide-react'
import { useHunter } from '../store'

const TONE = {
  success: 'border-[#3ddc97]/30 bg-[#111318]',
  info: 'border-[#f5c518]/30 bg-[#111318]',
  warn: 'border-[#f5a524]/30 bg-[#111318]',
}

export function Toasts() {
  const { toasts, dismissToast } = useHunter()
  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[60] flex w-[min(360px,calc(100vw-2rem))] flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto rounded-2xl border px-4 py-3 shadow-2xl ${TONE[toast.tone]}`}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-white">{toast.title}</p>
              <p className="mt-0.5 text-xs text-[#8b90a0]">{toast.message}</p>
            </div>
            <button type="button" onClick={() => dismissToast(toast.id)} className="text-[#8b90a0]">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
