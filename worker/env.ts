export interface D1Meta {
  changes: number
  last_row_id: number
}

export interface D1Result<T = Record<string, unknown>> {
  results: T[]
  success?: boolean
  meta?: D1Meta
}

export interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement
  all<T = Record<string, unknown>>(): Promise<D1Result<T>>
  first<T = Record<string, unknown>>(): Promise<T | null>
  run(): Promise<{ success: boolean; meta: D1Meta }>
}

export interface D1Database {
  prepare(query: string): D1PreparedStatement
}

export interface WorkerBindings {
  DB: D1Database
  ASSETS?: { fetch: (request: Request) => Promise<Response> | Response }
}
