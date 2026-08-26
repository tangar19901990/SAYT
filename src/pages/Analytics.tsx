import type { ReactNode } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useHunter } from '../store'
import { formatUah } from '../lib/format'

const YELLOW = '#f5c518'

export function AnalyticsPage() {
  const { all } = useHunter()

  const byBrand = Object.values(
    all.reduce<Record<string, { name: string; price: number; count: number }>>((acc, item) => {
      acc[item.brand] ??= { name: item.brand, price: 0, count: 0 }
      acc[item.brand].price += item.price
      acc[item.brand].count += 1
      return acc
    }, {}),
  ).map((item) => ({ name: item.name, price: Math.round(item.price / item.count) }))

  const byRegion = Object.values(
    all.reduce<Record<string, { name: string; count: number; profit: number }>>((acc, item) => {
      acc[item.city] ??= { name: item.city, count: 0, profit: 0 }
      acc[item.city].count += 1
      acc[item.city].profit += item.profit
      return acc
    }, {}),
  )

  const bySize = Object.values(
    all.reduce<Record<string, { name: string; profit: number; count: number }>>((acc, item) => {
      acc[item.size] ??= { name: item.size, profit: 0, count: 0 }
      acc[item.size].profit += item.profit
      acc[item.size].count += 1
      return acc
    }, {}),
  ).map((item) => ({ name: item.name, profit: Math.round(item.profit / item.count) }))

  const avgPrice = all.length ? Math.round(all.reduce((s, i) => s + i.price, 0) / all.length) : 0
  const avgMargin = all.length ? Math.round(all.reduce((s, i) => s + i.profit, 0) / all.length) : 0
  const potential = all.filter((i) => i.score >= 75).reduce((s, i) => s + i.profit, 0)

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <p className="text-[11px] uppercase tracking-[0.22em] text-[#8b90a0]">Аналітика</p>
        <h1 className="mt-1 text-3xl font-bold">Ринок шин</h1>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Tile label="Середня ціна" value={formatUah(avgPrice)} />
        <Tile label="Кількість пропозицій" value={String(all.length)} />
        <Tile label="Середня маржа" value={formatUah(avgMargin)} />
        <Tile label="Потенційний прибуток" value={formatUah(potential)} />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <ChartCard title="Ціна по брендах">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={byBrand}>
              <CartesianGrid stroke="#262a33" vertical={false} />
              <XAxis dataKey="name" stroke="#8b90a0" fontSize={11} />
              <YAxis stroke="#8b90a0" fontSize={11} />
              <Tooltip contentStyle={tooltip} />
              <Bar dataKey="price" radius={[6, 6, 0, 0]}>
                {byBrand.map((item) => (
                  <Cell key={item.name} fill={YELLOW} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Кількість пропозицій по регіонах">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={byRegion}>
              <CartesianGrid stroke="#262a33" vertical={false} />
              <XAxis dataKey="name" stroke="#8b90a0" fontSize={11} />
              <YAxis stroke="#8b90a0" fontSize={11} />
              <Tooltip contentStyle={tooltip} />
              <Bar dataKey="count" fill={YELLOW} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Ціна / прибуток по регіонах">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={byRegion}>
              <CartesianGrid stroke="#262a33" vertical={false} />
              <XAxis dataKey="name" stroke="#8b90a0" fontSize={11} />
              <YAxis stroke="#8b90a0" fontSize={11} />
              <Tooltip contentStyle={tooltip} />
              <Bar dataKey="profit" fill="#3ddc97" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Найвигідніші розміри">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={bySize}>
              <CartesianGrid stroke="#262a33" vertical={false} />
              <XAxis dataKey="name" stroke="#8b90a0" fontSize={11} />
              <YAxis stroke="#8b90a0" fontSize={11} />
              <Tooltip contentStyle={tooltip} />
              <Bar dataKey="profit" fill={YELLOW} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  )
}

const tooltip = {
  background: '#111318',
  border: '1px solid #262a33',
  borderRadius: 12,
  color: '#fff',
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[#262a33] bg-[#16181f] p-5">
      <p className="text-xs text-[#8b90a0]">{label}</p>
      <p className="mt-2 text-2xl font-bold tabular-nums">{value}</p>
    </div>
  )
}

function ChartCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-[#262a33] bg-[#111318] p-5">
      <h2 className="mb-4 text-sm font-semibold">{title}</h2>
      {children}
    </div>
  )
}
