import { handleApi } from './api'
import type { WorkerBindings } from './env'

const ASSET_EXT = /\.(?:js|css|png|jpe?g|webp|svg|ico|woff2?|map|json|txt|xml)$/i

async function serveSpa(request: Request, env: WorkerBindings): Promise<Response> {
  if (!env.ASSETS) return new Response('Not found', { status: 404 })
  const url = new URL(request.url)
  const asset = await env.ASSETS.fetch(request)
  if (asset.status !== 404 || request.method !== 'GET') return asset
  if (ASSET_EXT.test(url.pathname)) return asset
  const indexUrl = new URL('/', url.origin)
  return env.ASSETS.fetch(new Request(indexUrl.toString(), request))
}

export default {
  async fetch(request: Request, env: WorkerBindings): Promise<Response> {
    const api = await handleApi(request, env.DB)
    if (api) return api
    return serveSpa(request, env)
  },
}
