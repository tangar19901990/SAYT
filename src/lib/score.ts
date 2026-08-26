import type { Condition, DealStatus, Source } from '../types'
import { scoreStatus } from './format'

const BRAND_WEIGHT: Record<string, number> = {
  MICHELIN: 12,
  BRIDGESTONE: 11,
  GOODYEAR: 11,
  CONTINENTAL: 10,
  PIRELLI: 10,
  HANKOOK: 8,
  DUNLOP: 8,
  KORMORAN: 5,
  TRIANGLE: 4,
}

const CITY_WEIGHT: Record<string, number> = {
  Київ: 6,
  Львів: 5,
  Одеса: 4,
  Дніпро: 4,
  Харків: 3,
  Вінниця: 3,
  Полтава: 2,
  Запоріжжя: 2,
  Черкаси: 2,
  Рівне: 2,
  Житомир: 3,
  'Біла Церква': 4,
  Бровари: 5,
  Чернігів: 3,
  Ірпінь: 5,
  Бориспіль: 5,
  Умань: 2,
  Фастів: 4,
}

export function calcScore(input: {
  brand: string
  remaining: number
  dot: number
  condition: Condition
  city: string
  source: Source
  price: number
  sellPrice: number
  delivery: number
}): { score: number; status: DealStatus; cost: number; profit: number; roi: number } {
  const cost = input.price + input.delivery
  const profit = input.sellPrice - cost
  const roi = cost > 0 ? (profit / cost) * 100 : 0

  let score = 42
  score += BRAND_WEIGHT[input.brand] ?? 3
  score += Math.round(input.remaining * 0.28)
  score += Math.max(0, 8 - (2026 - input.dot) * 2)
  score += input.condition === 'Нова' ? 8 : 2
  score += CITY_WEIGHT[input.city] ?? 1
  score += input.source === 'OLX' || input.source === 'Autoline' ? 3 : 1
  score += Math.min(18, Math.max(-12, Math.round(roi * 0.35)))
  if (profit < 800) score -= 12
  if (profit >= 2500) score += 6
  if (input.remaining < 55) score -= 10
  if (input.dot < 2020) score -= 8

  const clamped = Math.max(38, Math.min(99, Math.round(score)))
  return {
    score: clamped,
    status: scoreStatus(clamped),
    cost,
    profit,
    roi: Number(roi.toFixed(1)),
  }
}
