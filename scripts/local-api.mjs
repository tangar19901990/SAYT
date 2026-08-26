import { createServer } from 'node:http'
import { DatabaseSync } from 'node:sqlite'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { existsSync, mkdirSync, readFileSync } from 'node:fs'

const root = dirname(dirname(fileURLToPath(import.meta.url)))

// Підхоплюємо секрети з .dev.vars (той самий файл читає wrangler dev).
// Значення з файлу мають пріоритет — env sandbox може містити застарілий токен.
const devVarsPath = join(root, '.dev.vars')
if (existsSync(devVarsPath)) {
  for (const line of readFileSync(devVarsPath, 'utf8').split('\n')) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.+?)\s*$/)
    if (match) process.env[match[1]] = match[2]
  }
}
const dataDir = join(root, '.data')
mkdirSync(dataDir, { recursive: true })
const sqlite = new DatabaseSync(join(dataDir, 'hunter.sqlite'))

sqlite.exec('PRAGMA journal_mode = WAL')

function wrapDb(db) {
  return {
    prepare(sql) {
      const stmt = db.prepare(sql)
      const bindAll = (...values) => {
        const bound = values.length ? stmt : stmt
        const runBound = () => {
          const info = values.length ? bound.run(...values) : bound.run()
          return {
            success: true,
            meta: {
              changes: info.changes ?? 0,
              last_row_id: Number(info.lastInsertRowid ?? 0),
            },
          }
        }
        const allBound = () => {
          const rows = values.length ? bound.all(...values) : bound.all()
          return { results: rows ?? [], success: true }
        }
        const firstBound = () => {
          const row = values.length ? bound.get(...values) : bound.get()
          return row ?? null
        }
        return {
          bind(...next) {
            return wrapStatement(stmt, next)
          },
          all: allBound,
          first: firstBound,
          run: runBound,
        }
      }
      return wrapStatement(stmt, [])
    },
  }
}

function wrapStatement(stmt, values) {
  return {
    bind(...next) {
      return wrapStatement(stmt, next)
    },
    async all() {
      const rows = values.length ? stmt.all(...values) : stmt.all()
      return { results: rows ?? [], success: true }
    },
    async first() {
      const row = values.length ? stmt.get(...values) : stmt.get()
      return row ?? null
    },
    async run() {
      const info = values.length ? stmt.run(...values) : stmt.run()
      return {
        success: true,
        meta: {
          changes: info.changes ?? 0,
          last_row_id: Number(info.lastInsertRowid ?? 0),
        },
      }
    },
  }
}

const db = wrapDb(sqlite)

async function loadApi() {
  const url = new URL(`../worker/api.ts?t=${Date.now()}`, import.meta.url)
  return import(url.href)
}

const PORT = Number(process.env.API_PORT || 8787)

const server = createServer(async (req, res) => {
  try {
    const host = req.headers.host || `127.0.0.1:${PORT}`
    const chunks = []
    for await (const chunk of req) chunks.push(chunk)
    const body = Buffer.concat(chunks)
    const headers = new Headers()
    for (const [key, value] of Object.entries(req.headers)) {
      if (Array.isArray(value)) headers.set(key, value.join(', '))
      else if (value) headers.set(key, value)
    }
    const request = new Request(`http://${host}${req.url}`, {
      method: req.method,
      headers,
      body: req.method === 'GET' || req.method === 'HEAD' ? undefined : body,
    })
    const { handleApi } = await loadApi()
    const response = (await handleApi(request, db)) ?? new Response('Not found', { status: 404 })
    res.statusCode = response.status
    response.headers.forEach((value, key) => res.setHeader(key, value))
    const buf = Buffer.from(await response.arrayBuffer())
    res.end(buf)
  } catch (error) {
    console.error(error)
    res.statusCode = 500
    res.setHeader('content-type', 'application/json')
    res.end(JSON.stringify({ error: 'local_api_failed', message: String(error) }))
  }
})

server.listen(PORT, '0.0.0.0', () => {
  console.log(`GT TIRES HUNTER API on http://0.0.0.0:${PORT}`)
})
