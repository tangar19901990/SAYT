import type { TireListing } from '../src/types'

export interface AiAnalysis {
  ok: boolean
  model: string
  analysis: string
  fallback: boolean
}

interface ChatResponse {
  choices?: Array<{ message?: { content?: string } }>
}

function llmConfig(): { apiKey: string; baseUrl: string } | null {
  // nodejs_compat: process.env доступний і в Worker, і в локальному API
  const env = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env
  const apiKey = env?.OPENAI_API_KEY
  const baseUrl = env?.OPENAI_BASE_URL || 'https://www.genspark.ai/api/llm_proxy/v1'
  if (!apiKey) return null
  return { apiKey, baseUrl: baseUrl.replace(/\/$/, '') }
}

function listingLine(item: TireListing): string {
  return [
    `${item.brand} ${item.model}`.trim(),
    item.size,
    `${item.price} грн`,
    `прибуток ${item.profit >= 0 ? '+' : ''}${item.profit} грн`,
    `score ${item.score}`,
    item.condition,
    `залишок ${item.remaining}%`,
    `DOT ${item.dot}`,
    `${item.city} (${item.source})`,
    item.url,
  ].join(' · ')
}

/** Евристичний аналіз, якщо LLM ключ недоступний — фіча не падає. */
function heuristicAnalysis(listings: TireListing[], size: string): string {
  const sorted = [...listings].sort((a, b) => b.score - a.score || b.profit - a.profit)
  const top = sorted.slice(0, 3)
  const cheapest = [...listings].sort((a, b) => a.price - b.price)[0]
  const lines = [
    `Локальний аналіз ${size} (AI недоступний, показую евристику):`,
    '',
    ...top.map(
      (item, i) =>
        `${i + 1}. ${item.brand} ${item.model} — ${item.price} грн, score ${item.score}, прибуток +${item.profit} грн (${item.source}, ${item.city}).`,
    ),
  ]
  if (cheapest) {
    lines.push('', `Найдешевша позиція: ${cheapest.brand} ${cheapest.model} за ${cheapest.price} грн (${cheapest.source}).`)
  }
  lines.push('', 'Порада: перевіряйте DOT і фактичний залишок протектора перед купівлею, торгуйтесь від -5..-10%.')
  return lines.join('\n')
}

const SYSTEM_PROMPT = `Ти — AI Genspark, експерт з арбітражу вантажних шин в Україні, вбудований у застосунок GT TIRES HUNTER.
Твоє завдання: проаналізувати живі оголошення, знайдені хантером, і дати чіткі поради з купівлі-перепродажу.
Відповідай українською, стисло і по суті, без води. Формат:
1) ТОП-3 позиції для купівлі — чому саме вони (ціна vs ринок, бренд, прибуток).
2) Ризики — на що звернути увагу (DOT, б/в, "no name" бренди, підозріло низька ціна).
3) Торг — реалістична цільова ціна для 1-2 найкращих позицій.
Не вигадуй даних, працюй лише з переданим списком. Максимум 220 слів.`

export async function aiAnalyzeListings(listings: TireListing[], size: string): Promise<AiAnalysis> {
  const pool = listings.slice(0, 14)
  if (!pool.length) {
    return { ok: false, model: 'none', analysis: 'Немає оголошень для аналізу — запустіть пошук.', fallback: true }
  }
  const config = llmConfig()
  if (!config) {
    return { ok: true, model: 'heuristic', analysis: heuristicAnalysis(pool, size), fallback: true }
  }
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 45_000)
  try {
    const response = await fetch(`${config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey}`,
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: 'gpt-5-mini',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          {
            role: 'user',
            content: `Розмір: ${size}. Живі оголошення (${pool.length} шт):\n${pool.map(listingLine).join('\n')}`,
          },
        ],
      }),
    })
    if (!response.ok) {
      return { ok: true, model: 'heuristic', analysis: heuristicAnalysis(pool, size), fallback: true }
    }
    const data = (await response.json()) as ChatResponse
    const content = data.choices?.[0]?.message?.content?.trim()
    if (!content) {
      return { ok: true, model: 'heuristic', analysis: heuristicAnalysis(pool, size), fallback: true }
    }
    return { ok: true, model: 'gpt-5-mini', analysis: content, fallback: false }
  } catch {
    return { ok: true, model: 'heuristic', analysis: heuristicAnalysis(pool, size), fallback: true }
  } finally {
    clearTimeout(timer)
  }
}
