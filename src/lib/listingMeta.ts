import type { Source, TireListing } from '../types'

export interface SellerProfile {
  name: string
  since: string
  rating: string
  deals: number
  phone: string
  online: boolean
}

const SELLERS: SellerProfile[] = [
  { name: 'Сергій Т.', since: 'на сайті з 2019', rating: '4.9', deals: 86, phone: '+380 67 214 88 31', online: true },
  { name: 'Олександр К.', since: 'на сайті з 2021', rating: '4.7', deals: 41, phone: '+380 50 933 12 08', online: true },
  { name: 'Володимир П.', since: 'на сайті з 2018', rating: '5.0', deals: 124, phone: '+380 63 441 77 90', online: false },
  { name: 'Ігор М.', since: 'на сайті з 2020', rating: '4.8', deals: 57, phone: '+380 93 228 64 15', online: true },
  { name: 'Андрій Ш.', since: 'на сайті з 2017', rating: '4.6', deals: 203, phone: '+380 97 512 30 44', online: true },
  { name: 'Микола Р.', since: 'на сайті з 2022', rating: '4.9', deals: 29, phone: '+380 66 781 09 52', online: false },
]

function hashId(id: string): number {
  return id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
}

export function listingNumber(listing: TireListing): string {
  const n = 180000 + hashId(listing.id) * 37
  return String(n)
}

export function listingViews(listing: TireListing): number {
  return 18 + (hashId(listing.id) % 140)
}

export function getSeller(listing: TireListing): SellerProfile {
  return SELLERS[hashId(listing.id) % SELLERS.length]
}

export function listingTitle(listing: TireListing): string {
  return `${listing.brand} ${listing.model} ${listing.size}`
}

export function listingDescription(listing: TireListing): string {
  const pair = listing.quantity === 1 ? '1 шт.' : `${listing.quantity} шт.`
  return [
    `${listing.brand} ${listing.model}, розмір ${listing.size}.`,
    `${listing.condition}, залишок протектора ${listing.remaining}%, DOT ${listing.dot}.`,
    listing.notes,
    `Кількість: ${pair}. Місто: ${listing.city}, ${listing.region}.`,
    listing.delivery > 0
      ? `Можлива відправка по Україні. Орієнтовна доставка ${listing.delivery} ₴.`
      : 'Самовивіз.',
    'Фото актуальні. Можна подивитись наживо, заміряти протектор.',
  ].join(' ')
}

export const SOURCE_THEME: Record<
  Source,
  {
    name: string
    short: string
    accent: string
    accentText: string
    bar: string
    barText: string
    chip: string
    page: string
    card: string
    muted: string
    line: string
  }
> = {
  OLX: {
    name: 'OLX',
    short: 'OLX.ua',
    accent: '#23e5db',
    accentText: '#002f34',
    bar: '#002f34',
    barText: '#ffffff',
    chip: 'bg-[#23e5db] text-[#002f34]',
    page: 'bg-[#f2f4f5] text-[#002f34]',
    card: 'bg-white',
    muted: 'text-[#406367]',
    line: 'border-[#d8dfe0]',
  },
  Prom: {
    name: 'Prom',
    short: 'Prom.ua',
    accent: '#ff6a00',
    accentText: '#ffffff',
    bar: '#1a1a1a',
    barText: '#ffffff',
    chip: 'bg-[#ff6a00] text-white',
    page: 'bg-[#f6f7f9] text-[#1a1a1a]',
    card: 'bg-white',
    muted: 'text-[#6b7280]',
    line: 'border-[#e5e7eb]',
  },
  Autoline: {
    name: 'Autoline',
    short: 'Autoline.ua',
    accent: '#1565c0',
    accentText: '#ffffff',
    bar: '#0d47a1',
    barText: '#ffffff',
    chip: 'bg-[#1565c0] text-white',
    page: 'bg-[#eef3f8] text-[#102a43]',
    card: 'bg-white',
    muted: 'text-[#486581]',
    line: 'border-[#d9e2ec]',
  },
  Truck1: {
    name: 'Truck1',
    short: 'Truck1.eu',
    accent: '#c62828',
    accentText: '#ffffff',
    bar: '#1b1b1b',
    barText: '#ffffff',
    chip: 'bg-[#c62828] text-white',
    page: 'bg-[#f3f3f3] text-[#1b1b1b]',
    card: 'bg-white',
    muted: 'text-[#616161]',
    line: 'border-[#e0e0e0]',
  },
  TyreClub: {
    name: 'TyreClub',
    short: 'TyreClub.com.ua',
    accent: '#2e7d32',
    accentText: '#ffffff',
    bar: '#1b5e20',
    barText: '#ffffff',
    chip: 'bg-[#2e7d32] text-white',
    page: 'bg-[#f1f6f2] text-[#12331a]',
    card: 'bg-white',
    muted: 'text-[#4c6b52]',
    line: 'border-[#d7e5da]',
  },
  Atlant: {
    name: 'Atlantshina',
    short: 'Atlantshina.com.ua',
    accent: '#7b1fa2',
    accentText: '#ffffff',
    bar: '#4a148c',
    barText: '#ffffff',
    chip: 'bg-[#7b1fa2] text-white',
    page: 'bg-[#f6f2f8] text-[#2a1233]',
    card: 'bg-white',
    muted: 'text-[#6b4c7a]',
    line: 'border-[#e3d7ea]',
  },
  Інші: {
    name: 'Marketplace',
    short: 'Оголошення',
    accent: '#f5c518',
    accentText: '#111318',
    bar: '#111318',
    barText: '#f4f5f7',
    chip: 'bg-[#f5c518] text-black',
    page: 'bg-[#0b0c0e] text-[#f4f5f7]',
    card: 'bg-[#16181f]',
    muted: 'text-[#8b90a0]',
    line: 'border-[#262a33]',
  },
}
