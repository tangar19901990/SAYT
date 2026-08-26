import { useEffect, useMemo, useState } from 'react'
import {
  Building2,
  CheckCircle2,
  ExternalLink,
  Factory,
  Globe,
  MapPin,
  Phone,
  RefreshCw,
  Search,
  ShieldAlert,
  Store,
  Truck,
  Warehouse,
  Wrench,
} from 'lucide-react'
import { fetchSuppliers, fallbackSuppliers, type SuppliersResponse } from '../lib/api'
import { SUPPLIER_TYPES } from '../data/suppliers'
import type { Supplier, SupplierType } from '../types'
import { useHunter } from '../store'

const TYPE_ICON: Record<SupplierType, typeof Store> = {
  виробник: Factory,
  "дистриб'ютор": Building2,
  опт: Warehouse,
  магазин: Store,
  'б/в склад': Warehouse,
  сервіс: Wrench,
  маркетплейс: Globe,
}

const TYPE_COLOR: Record<SupplierType, string> = {
  виробник: 'text-[#f5c518] border-[#f5c518]/40 bg-[#f5c518]/10',
  "дистриб'ютор": 'text-[#7aa2ff] border-[#7aa2ff]/40 bg-[#7aa2ff]/10',
  опт: 'text-[#3ddc97] border-[#3ddc97]/40 bg-[#3ddc97]/10',
  магазин: 'text-[#c5c8d1] border-[#3a3f4c] bg-[#1c1f28]',
  'б/в склад': 'text-[#ffb54d] border-[#ffb54d]/40 bg-[#ffb54d]/10',
  сервіс: 'text-[#d18aff] border-[#d18aff]/40 bg-[#d18aff]/10',
  маркетплейс: 'text-[#5ad0e6] border-[#5ad0e6]/40 bg-[#5ad0e6]/10',
}

function StatusPill({ supplier }: { supplier: Supplier }) {
  const status = supplier.liveStatus ?? supplier.verify
  if (status === 'online') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-[#3ddc97]/40 bg-[#3ddc97]/10 px-2 py-0.5 text-[10px] font-semibold text-[#3ddc97]">
        <CheckCircle2 className="h-3 w-3" /> САЙТ ЖИВИЙ
        {supplier.liveHttp ? ` · ${supplier.liveHttp}` : ''}
      </span>
    )
  }
  if (status === 'protected') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-[#ffb54d]/40 bg-[#ffb54d]/10 px-2 py-0.5 text-[10px] font-semibold text-[#ffb54d]">
        <ShieldAlert className="h-3 w-3" /> АНТИ-БОТ · ВІДКРИЄТЬСЯ У БРАУЗЕРІ
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-[#ff5c5c]/40 bg-[#ff5c5c]/10 px-2 py-0.5 text-[10px] font-semibold text-[#ff5c5c]">
      НЕДОСТУПНИЙ
    </span>
  )
}

export function SuppliersPage() {
  const { pushToast } = useHunter()
  const [data, setData] = useState<SuppliersResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [type, setType] = useState<string>('всі')
  const [q, setQ] = useState('')
  const [onlyUsed, setOnlyUsed] = useState(false)
  const [onlyWholesale, setOnlyWholesale] = useState(false)

  const load = async (fresh = false) => {
    setLoading(true)
    try {
      const next = await fetchSuppliers({ fresh })
      setData(next)
      if (fresh) {
        pushToast({
          title: 'Перевірено наживо',
          message: `${next.suppliers.filter((s) => (s.liveStatus ?? s.verify) === 'online').length} сайтів відповіли 200 OK`,
          tone: 'success',
        })
      }
    } catch {
      setData(fallbackSuppliers())
      pushToast({ title: 'Офлайн', message: 'API недоступний, показуємо перевірений каталог', tone: 'warn' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const suppliers = data?.suppliers ?? []

  const rows = useMemo(() => {
    return suppliers.filter((item) => {
      if (type !== 'всі' && item.type !== type) return false
      if (onlyUsed && !item.used) return false
      if (onlyWholesale && !item.wholesale) return false
      if (q) {
        const hay = `${item.name} ${item.city} ${item.region} ${item.note} ${(item.brands ?? []).join(' ')}`.toLowerCase()
        if (!hay.includes(q.toLowerCase())) return false
      }
      return true
    })
  }, [suppliers, type, q, onlyUsed, onlyWholesale])

  const stats = useMemo(() => {
    const online = suppliers.filter((s) => (s.liveStatus ?? s.verify) === 'online').length
    const protectedN = suppliers.filter((s) => (s.liveStatus ?? s.verify) === 'protected').length
    const used = suppliers.filter((s) => s.used).length
    const wholesale = suppliers.filter((s) => s.wholesale).length
    return { online, protectedN, used, wholesale }
  }, [suppliers])

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.22em] text-[#8b90a0]">Партнери</p>
          <h1 className="mt-1 text-3xl font-bold">Постачальники і склади</h1>
          <p className="mt-1 text-sm text-[#8b90a0]">
            {suppliers.length} перевірених компаній: виробники, дистриб'ютори, опт, б/в склади, сервіси і маркетплейси.
            Кожен сайт перевірено реальним запитом.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load(true)}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl border border-[#f5c518]/50 bg-[#f5c518]/10 px-4 py-2 text-sm font-semibold text-[#f5c518] hover:bg-[#f5c518]/20 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Перевірити наживо
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="rounded-2xl border border-[#262a33] bg-[#111318] p-4">
          <p className="text-xs text-[#8b90a0]">Сайти живі (200 OK)</p>
          <p className="mt-1 text-2xl font-bold text-[#3ddc97]">{stats.online}</p>
        </div>
        <div className="rounded-2xl border border-[#262a33] bg-[#111318] p-4">
          <p className="text-xs text-[#8b90a0]">За анти-ботом</p>
          <p className="mt-1 text-2xl font-bold text-[#ffb54d]">{stats.protectedN}</p>
        </div>
        <div className="rounded-2xl border border-[#262a33] bg-[#111318] p-4">
          <p className="text-xs text-[#8b90a0]">Б/В та розпродажі</p>
          <p className="mt-1 text-2xl font-bold text-white">{stats.used}</p>
        </div>
        <div className="rounded-2xl border border-[#262a33] bg-[#111318] p-4">
          <p className="text-xs text-[#8b90a0]">Працюють з оптом</p>
          <p className="mt-1 text-2xl font-bold text-white">{stats.wholesale}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {SUPPLIER_TYPES.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setType(item)}
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
              type === item
                ? 'border-[#f5c518] bg-[#f5c518]/15 text-[#f5c518]'
                : 'border-[#323743] text-[#c5c8d1] hover:bg-[#1c1f28]'
            }`}
          >
            {item === 'всі' ? `Всі (${suppliers.length})` : item}
          </button>
        ))}
      </div>

      <div className="grid gap-3 md:grid-cols-[1fr_auto_auto]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8b90a0]" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Пошук: назва, місто, бренд"
            className="field pl-9"
          />
        </div>
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-[#323743] px-3 py-2 text-sm text-[#c5c8d1]">
          <input type="checkbox" checked={onlyUsed} onChange={(e) => setOnlyUsed(e.target.checked)} className="accent-[#f5c518]" />
          Б/В склади
        </label>
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-[#323743] px-3 py-2 text-sm text-[#c5c8d1]">
          <input type="checkbox" checked={onlyWholesale} onChange={(e) => setOnlyWholesale(e.target.checked)} className="accent-[#f5c518]" />
          Тільки опт
        </label>
      </div>

      {loading && !data ? (
        <p className="py-10 text-center text-sm text-[#8b90a0]">Перевіряємо сайти постачальників…</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {rows.map((item) => {
            const Icon = TYPE_ICON[item.type]
            return (
              <article
                key={item.id}
                className="flex flex-col rounded-2xl border border-[#262a33] bg-[#111318] p-4 transition hover:border-[#f5c518]/40"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${TYPE_COLOR[item.type]}`}>
                    <Icon className="h-3 w-3" />
                    {item.type}
                  </span>
                  <StatusPill supplier={item} />
                </div>

                <h3 className="mt-3 text-base font-bold leading-snug text-white">{item.name}</h3>
                <p className="mt-1 flex items-center gap-1 text-xs text-[#8b90a0]">
                  <MapPin className="h-3 w-3" />
                  {item.city}{item.region !== item.city ? ` · ${item.region} обл.` : ''}
                </p>

                <p className="mt-2 flex-1 text-sm leading-relaxed text-[#c5c8d1]">{item.note}</p>

                {item.brands?.length ? (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {item.brands.slice(0, 5).map((brand) => (
                      <span key={brand} className="rounded bg-[#1c1f28] px-1.5 py-0.5 text-[10px] font-medium text-[#8b90a0]">
                        {brand}
                      </span>
                    ))}
                  </div>
                ) : null}

                <div className="mt-3 flex flex-wrap gap-1.5 text-[10px] font-semibold">
                  {item.truck && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#1c1f28] px-2 py-0.5 text-[#c5c8d1]">
                      <Truck className="h-3 w-3" /> вантажні
                    </span>
                  )}
                  {item.used && <span className="rounded-full bg-[#1c1f28] px-2 py-0.5 text-[#ffb54d]">б/в</span>}
                  {item.wholesale && <span className="rounded-full bg-[#1c1f28] px-2 py-0.5 text-[#3ddc97]">опт</span>}
                </div>

                <div className="mt-4 flex items-center gap-2 border-t border-[#262a33] pt-3">
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#f5c518] px-3 py-2 text-sm font-bold text-black hover:bg-[#ffd83d]"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Відкрити сайт
                  </a>
                  {item.phone && (
                    <a
                      href={`tel:${item.phone.replace(/[^\d+]/g, '')}`}
                      className="inline-flex items-center justify-center gap-1 rounded-xl border border-[#323743] px-3 py-2 text-sm text-[#c5c8d1] hover:bg-[#1c1f28]"
                    >
                      <Phone className="h-4 w-4" />
                    </a>
                  )}
                </div>
              </article>
            )
          })}
        </div>
      )}

      {!loading && rows.length === 0 && (
        <p className="py-10 text-center text-sm text-[#8b90a0]">Нічого не знайдено за цими фільтрами.</p>
      )}

      <p className="text-xs text-[#5c6270]">
        Мертві та паркові домени (intershina.com.ua, 3000shyn.com.ua, koleso.ua, vseshiny.com та ін.) видалено з каталогу
        після перевірки. Статус «анти-бот» означає, що сайт закритий Cloudflare для серверних запитів, але нормально
        відкривається у браузері.
      </p>
    </div>
  )
}
