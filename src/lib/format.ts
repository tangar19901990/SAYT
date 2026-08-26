export function formatUah(value: number): string {
  return `${value.toLocaleString('uk-UA')} ₴`
}

export function formatSignedUah(value: number): string {
  const sign = value > 0 ? '+' : ''
  return `${sign}${value.toLocaleString('uk-UA')} ₴`
}

export function scoreLabel(score: number): 'excellent' | 'good' | 'check' | 'bad' {
  if (score >= 90) return 'excellent'
  if (score >= 75) return 'good'
  if (score >= 60) return 'check'
  return 'bad'
}

export function scoreStatus(score: number): 'ВІДМІННА УГОДА' | 'ВИГІДНО' | 'ПЕРЕВІРИТИ' | 'НЕВИГІДНО' {
  if (score >= 90) return 'ВІДМІННА УГОДА'
  if (score >= 75) return 'ВИГІДНО'
  if (score >= 60) return 'ПЕРЕВІРИТИ'
  return 'НЕВИГІДНО'
}
