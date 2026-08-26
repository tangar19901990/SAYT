import { useMemo, useState } from 'react'
import { ScoreBadge } from '../components/ScoreBadge'
import { formatUah } from '../lib/format'
import { listingPlaceLabel } from '../lib/geo'
import { useHunter } from '../store'

export function TiresPage() {
  const { all, setSelected, settings } = useHunter()
  const [q, setQ] = useState('')
  const [brand, setBrand] = useState('')
  const [status, setStatus] = useState('')

  const rows = useMemo(() => {
    return all.filter((item) => {
      const hay = `${item.brand} ${item.model} ${item.size} ${item.city}`.toLowerCase()
      if (q && !hay.includes(q.toLowerCase())) return false
      if (brand && item.brand !== brand) return false
      if (status && item.status !== status) return false
      return true
    })
  }, [all, q, brand, status])

  const brands = [...new Set(all.map((item) => item.brand))]

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <div>
        <p className="text-[11px] uppercase tracking-[0.22em] text-[#8b90a0]">База</p>
        <h1 className="mt-1 text-3xl font-bold">Шини</h1>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Пошук: бренд, розмір, місто"
          className="field"
        />
        <select value={brand} onChange={(e) => setBrand(e.target.value)} className="field">
          <option value="">Усі бренди</option>
          {brands.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="field">
          <option value="">Усі статуси</option>
          <option>ВІДМІННА УГОДА</option>
          <option>ВИГІДНО</option>
          <option>ПЕРЕВІРИТИ</option>
          <option>НЕВИГІДНО</option>
        </select>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-[#262a33]">
        <table className="min-w-[980px] w-full text-left text-sm">
          <thead className="bg-[#16181f] text-xs uppercase tracking-wide text-[#8b90a0]">
            <tr>
              <th className="px-4 py-3">Фото</th>
              <th className="px-4 py-3">Бренд</th>
              <th className="px-4 py-3">Розмір</th>
              <th className="px-4 py-3">DOT</th>
              <th className="px-4 py-3">Залишок</th>
              <th className="px-4 py-3">Ціна</th>
              <th className="px-4 py-3">Місто / км</th>
              <th className="px-4 py-3">Score</th>
              <th className="px-4 py-3">Статус</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((item) => (
              <tr
                key={item.id}
                onClick={() => setSelected(item)}
                className="cursor-pointer border-t border-[#262a33] hover:bg-[#16181f]"
              >
                <td className="px-4 py-3">
                  <img src={item.image} alt="" className="h-12 w-12 rounded-lg object-cover" />
                </td>
                <td className="px-4 py-3">
                  <p className="font-semibold">{item.brand}</p>
                  <p className="text-xs text-[#8b90a0]">{item.model}</p>
                </td>
                <td className="px-4 py-3">{item.size}</td>
                <td className="px-4 py-3">{item.dot}</td>
                <td className="px-4 py-3">{item.remaining}%</td>
                <td className="px-4 py-3 tabular-nums">{formatUah(item.price)}</td>
                <td className="px-4 py-3">{listingPlaceLabel(item, settings.defaultRegion)}</td>
                <td className="px-4 py-3">{item.score}</td>
                <td className="px-4 py-3">
                  <ScoreBadge score={item.score} status={item.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-sm text-[#8b90a0]">{rows.length} позицій</p>
    </div>
  )
}
