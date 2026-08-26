import type { LucideIcon } from 'lucide-react'
import {
  BarChart3,
  Bookmark,
  Bot,
  Flame,
  Home,
  Menu,
  Search,
  Settings,
  CircleDollarSign,
  Disc,
  Warehouse,
  X,
} from 'lucide-react'
import type { ReactNode } from 'react'
import { useHunter } from '../store'
import type { PageId } from '../types'

const NAV: { id: PageId; label: string; icon: LucideIcon }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: Home },
  { id: 'search', label: 'Пошук', icon: Search },
  { id: 'tires', label: 'Шини', icon: Disc },
  { id: 'deals', label: 'Найкращі угоди', icon: Flame },
  { id: 'agent', label: 'AI Agent', icon: Bot },
  { id: 'analytics', label: 'Аналітика', icon: BarChart3 },
  { id: 'profit', label: 'Прибуток', icon: CircleDollarSign },
  { id: 'saved', label: 'Збережені', icon: Bookmark },
  { id: 'suppliers', label: 'Постачальники', icon: Warehouse },
  { id: 'settings', label: 'Налаштування', icon: Settings },
]

const MOBILE_NAV: PageId[] = ['dashboard', 'search', 'deals', 'agent', 'tires']

export function Layout({ children }: { children: ReactNode }) {
  const { page, setPage, sidebarOpen, setSidebarOpen, agentRunning } = useHunter()

  const go = (id: PageId) => {
    setPage(id)
    setSidebarOpen(false)
  }

  return (
    <div className="min-h-screen bg-[#0b0c0e] text-[#f4f5f7]">
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Закрити меню"
          className="fixed inset-0 z-30 bg-black/60 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-[260px] flex-col border-r border-[#262a33] bg-[#111318] transition-transform duration-200 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
      >
        <div className="flex items-center gap-3 px-5 py-5">
          <img src="/logo.png" alt="GT TIRES HUNTER" className="h-11 w-11 rounded-full" />
          <div>
            <p className="text-sm font-extrabold tracking-[0.14em] text-white">GT TIRES</p>
            <p className="text-xs font-semibold tracking-[0.28em] text-[#f5c518]">HUNTER</p>
          </div>
          <button type="button" className="ml-auto lg:hidden" onClick={() => setSidebarOpen(false)}>
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 px-3">
          {NAV.map((item) => {
            const Icon = item.icon
            const active = page === item.id
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => go(item.id)}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm ${
                  active ? 'bg-[#f5c518]/12 font-semibold text-[#f5c518]' : 'text-[#c5c8d1] hover:bg-[#1c1f28]'
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </button>
            )
          })}
        </nav>

        <div className="border-t border-[#262a33] p-4">
          <div className="flex items-center gap-2 rounded-xl border border-[#262a33] bg-[#16181f] px-3 py-2.5 text-sm">
            <span className={`h-2 w-2 rounded-full ${agentRunning ? 'bg-[#3ddc97] shadow-[0_0_10px_#3ddc97]' : 'bg-[#8b90a0]'}`} />
            <span className="font-medium">{agentRunning ? 'Agent Online' : 'Agent Offline'}</span>
          </div>
          <p className="mt-3 px-1 text-[11px] tracking-[0.16em] text-[#5c6270]">AI FINDS. YOU PROFIT.</p>
        </div>
      </aside>

      <div className="lg:pl-[260px]">
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-[#262a33] bg-[#0b0c0e]/90 px-4 py-3 backdrop-blur lg:hidden">
          <button type="button" onClick={() => setSidebarOpen(true)} className="rounded-lg border border-[#323743] p-2">
            <Menu className="h-4 w-4" />
          </button>
          <img src="/logo.png" alt="" className="h-8 w-8 rounded-full" />
          <div>
            <p className="text-xs font-bold tracking-[0.16em]">GT TIRES HUNTER</p>
            <p className="text-[10px] text-[#8b90a0]">AI FINDS. YOU PROFIT.</p>
          </div>
        </header>
        <main className="px-4 pb-24 pt-5 sm:px-6 lg:px-8 lg:pb-10">{children}</main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-[#262a33] bg-[#111318] px-1 py-2 lg:hidden">
        {NAV.filter((item) => MOBILE_NAV.includes(item.id)).map((item) => {
          const Icon = item.icon
          const active = page === item.id
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => go(item.id)}
              className={`flex flex-col items-center gap-1 py-1 text-[10px] ${active ? 'text-[#f5c518]' : 'text-[#8b90a0]'}`}
            >
              <Icon className="h-4 w-4" />
              {item.label.replace('Найкращі угоди', 'Угоди')}
            </button>
          )
        })}
      </nav>
    </div>
  )
}
