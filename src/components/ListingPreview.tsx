import { useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft,
  Bookmark,
  Calendar,
  CheckCircle2,
  ExternalLink,
  Eye,
  MapPin,
  MessageCircle,
  Phone,
  ShieldCheck,
  Sparkles,
  Star,
  Warehouse,
} from 'lucide-react'
import { listingHref } from '../lib/listingUrl'
import { formatUah } from '../lib/format'
import { listingPlaceLabel } from '../lib/geo'
import {
  SOURCE_THEME,
  getSeller,
  listingDescription,
  listingNumber,
  listingTitle,
  listingViews,
} from '../lib/listingMeta'
import { useHunter } from '../store'

export function ListingPreview() {
  const { preview, closeListing, setSelected, saveListing, addToStock, takeToWork, pushToast, settings } = useHunter()
  const [photo, setPhoto] = useState(0)
  const [phoneOpen, setPhoneOpen] = useState(false)

  const listing = preview
  const seller = listing ? getSeller(listing) : null
  const theme = listing ? SOURCE_THEME[listing.source] : SOURCE_THEME.OLX
  const photos = useMemo(() => {
    if (!listing) return []
    return [
      { src: listing.image, pos: 'center' },
      { src: listing.image, pos: 'top' },
      { src: listing.image, pos: 'bottom' },
    ]
  }, [listing])

  useEffect(() => {
    setPhoto(0)
    setPhoneOpen(false)
  }, [listing?.id])

  useEffect(() => {
    if (!listing) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeListing()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [listing, closeListing])

  if (!listing || !seller) return null

  const specs: [string, string][] = [
    ['Бренд', listing.brand],
    ['Модель', listing.model],
    ['Розмір', listing.size],
    ['Стан', listing.condition],
    ['Залишок протектора', `${listing.remaining}%`],
    ['DOT / рік', String(listing.dot)],
    ['Кількість', `${listing.quantity} шт.`],
    ['Місто', listingPlaceLabel(listing, settings.defaultRegion)],
    ['Область', listing.region],
    ['Доставка', listing.delivery > 0 ? formatUah(listing.delivery) : 'Самовивіз'],
  ]

  const showPhone = () => {
    setPhoneOpen(true)
    pushToast({
      title: 'Контакт продавця',
      message: seller.phone,
      tone: 'info',
    })
  }

  return (
    <div className={`fixed inset-0 z-[70] overflow-y-auto ${theme.page}`}>
      <div className="sticky top-0 z-20" style={{ background: theme.bar, color: theme.barText }}>
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={closeListing}
              className="inline-flex items-center gap-2 rounded-lg px-2 py-1 text-sm opacity-90 hover:opacity-100"
            >
              <ArrowLeft className="h-4 w-4" /> Назад
            </button>
            <div className="min-w-0">
              <p className="text-sm font-black tracking-wide">{theme.short}</p>
              <p className="truncate text-[11px] opacity-70">ID {listingNumber(listing)} · знайдено {listing.foundAt}</p>
            </div>
          </div>
          <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${theme.chip}`}>
            {theme.name}
          </span>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-4 pb-28 sm:py-6">
        <div className={`mb-4 rounded-2xl border px-4 py-3 text-sm ${theme.line} ${theme.card}`}>
          <p className={`flex items-center gap-2 font-semibold ${theme.muted}`}>
            <ShieldCheck className="h-4 w-4" />
            Превʼю оголошення всередині GT TIRES HUNTER
          </p>
          <p className={`mt-1 text-xs ${theme.muted}`}>
            Робоча картка Hunter. «Відкрити» веде на цю картку товару на {theme.short}, а не на категорію.
          </p>
        </div>

        <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-4">
            <div className={`overflow-hidden rounded-2xl border ${theme.line} ${theme.card}`}>
              <img
                src={photos[photo].src}
                alt={listingTitle(listing)}
                className="h-72 w-full object-cover sm:h-[420px]"
                style={{ objectPosition: photos[photo].pos }}
              />
              <div className="grid grid-cols-3 gap-2 p-3">
                {photos.map((item, index) => (
                  <button
                    key={`${item.pos}-${index}`}
                    type="button"
                    onClick={() => setPhoto(index)}
                    className={`overflow-hidden rounded-xl border ${index === photo ? 'border-current' : theme.line}`}
                    style={index === photo ? { borderColor: theme.accent } : undefined}
                  >
                    <img src={item.src} alt="" className="h-20 w-full object-cover" style={{ objectPosition: item.pos }} />
                  </button>
                ))}
              </div>
            </div>

            <section className={`rounded-2xl border p-5 ${theme.line} ${theme.card}`}>
              <h2 className="text-lg font-bold">Опис</h2>
              <p className="mt-3 text-sm leading-7 opacity-90">{listingDescription(listing)}</p>
            </section>

            <section className={`rounded-2xl border p-5 ${theme.line} ${theme.card}`}>
              <h2 className="text-lg font-bold">Характеристики</h2>
              <div className="mt-3 grid gap-x-8 sm:grid-cols-2">
                {specs.map(([label, value]) => (
                  <div key={label} className={`flex items-center justify-between gap-4 border-b py-2.5 text-sm ${theme.line}`}>
                    <span className={theme.muted}>{label}</span>
                    <span className="font-semibold">{value}</span>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
            <section className={`rounded-2xl border p-5 ${theme.line} ${theme.card}`}>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className={`inline-flex items-center gap-1 ${theme.muted}`}>
                  <Calendar className="h-3.5 w-3.5" /> {listing.foundAt}
                </span>
                <span className={`inline-flex items-center gap-1 ${theme.muted}`}>
                  <Eye className="h-3.5 w-3.5" /> {listingViews(listing)} переглядів
                </span>
              </div>
              <h1 className="mt-3 text-2xl font-black leading-tight">{listingTitle(listing)}</h1>
              <p className={`mt-1 text-sm ${theme.muted}`}>{listing.condition} · {listing.source}</p>
              <p className="mt-4 text-4xl font-black tabular-nums">
                {formatUah(listing.price)}
              </p>
              <p className={`mt-2 inline-flex items-center gap-1 text-sm ${theme.muted}`}>
                <MapPin className="h-4 w-4" /> {listingPlaceLabel(listing, settings.defaultRegion)}
              </p>

              <div className="mt-5 grid gap-2">
                <a
                  href={listingHref(listing)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold"
                  style={{ background: theme.accent, color: theme.accentText }}
                >
                  <ExternalLink className="h-4 w-4" />
                  Відкрити на {theme.short}
                </a>
                <button
                  type="button"
                  onClick={showPhone}
                  className={`inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-bold ${theme.line}`}
                >
                  <Phone className="h-4 w-4" />
                  {phoneOpen ? seller.phone : 'Показати телефон'}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    pushToast({
                      title: 'Повідомлення продавцю',
                      message: 'Чат буде доступний після підключення джерела',
                      tone: 'info',
                    })
                  }
                  className={`inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold ${theme.line}`}
                >
                  <MessageCircle className="h-4 w-4" /> Написати
                </button>
              </div>
            </section>

            <section className={`rounded-2xl border p-5 ${theme.line} ${theme.card}`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className={`text-xs uppercase tracking-wide ${theme.muted}`}>Продавець</p>
                  <p className="mt-1 text-lg font-bold">{seller.name}</p>
                  <p className={`text-xs ${theme.muted}`}>{seller.since}</p>
                </div>
                <div className="text-right">
                  <p className="inline-flex items-center gap-1 text-sm font-bold">
                    <Star className="h-4 w-4 fill-current" style={{ color: theme.accent }} /> {seller.rating}
                  </p>
                  <p className={`text-xs ${theme.muted}`}>{seller.deals} угод</p>
                </div>
              </div>
              <p className={`mt-3 inline-flex items-center gap-1 text-xs ${theme.muted}`}>
                <CheckCircle2 className="h-3.5 w-3.5" />
                {seller.online ? 'Зараз онлайн' : 'Був сьогодні'}
              </p>
            </section>

            <section className={`rounded-2xl border p-5 ${theme.line} ${theme.card}`}>
              <p className="text-sm font-bold">Дії Hunter</p>
              <div className="mt-3 grid gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSelected(listing)
                  }}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#111318] px-4 py-3 text-sm font-semibold text-[#f5c518]"
                >
                  <Sparkles className="h-4 w-4" /> AI аналіз угоди
                </button>
                <button
                  type="button"
                  onClick={() => takeToWork(listing.id)}
                  className="rounded-xl border border-[#f5c518]/50 px-4 py-3 text-sm font-semibold text-[#b8860b]"
                >
                  Забрати в роботу
                </button>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => saveListing(listing.id)}
                    className={`inline-flex items-center justify-center gap-2 rounded-xl border px-3 py-3 text-sm ${theme.line}`}
                  >
                    <Bookmark className="h-4 w-4" /> Зберегти
                  </button>
                  <button
                    type="button"
                    onClick={() => addToStock(listing.id)}
                    className={`inline-flex items-center justify-center gap-2 rounded-xl border px-3 py-3 text-sm ${theme.line}`}
                  >
                    <Warehouse className="h-4 w-4" /> На склад
                  </button>
                </div>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </div>
  )
}
