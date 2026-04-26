import { renderAppDocument } from './lib/ssr.js'
import { handleApiRequest } from './routes/api.js'
import {
  appRoutes,
  getCanonicalPath,
  isAppRoute,
  isStaticAssetPath,
} from '../src/shared/routes.js'

function hasFileExtension(pathname) {
  return /\.[^/]+$/.test(pathname)
}

function methodNotAllowed() {
  return new Response(JSON.stringify({ error: 'Method not allowed' }), {
    status: 405,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Allow': 'GET, HEAD',
    },
  })
}

async function handleHttpRequest(request, env) {
  const url = new URL(request.url)

  if (url.pathname.startsWith('/api/')) {
    return handleApiRequest(request, env)
  }

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return methodNotAllowed()
  }

  const canonicalPath = getCanonicalPath(url.pathname)
  if (canonicalPath !== url.pathname) {
    const redirectUrl = new URL(request.url)
    redirectUrl.pathname = canonicalPath
    return Response.redirect(redirectUrl.toString(), 308)
  }

  if (isAppRoute(url.pathname)) {
    return renderAppDocument(request, env)
  }

  if (isStaticAssetPath(url.pathname) || hasFileExtension(url.pathname)) {
    return env.ASSETS.fetch(request)
  }

  return renderAppDocument(request, env, 404)
}

export default {
  async fetch(request, env) {
    return handleHttpRequest(request, env)
  },
}
