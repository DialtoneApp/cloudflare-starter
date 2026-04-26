import { readFile } from 'node:fs/promises'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { buildDocumentMetadata, injectDocumentMetadata } from './src/shared/documentMetadata.js'
import {
  appRoutes,
  getCanonicalPath,
  isAppRoute,
  isStaticAssetPath,
} from './src/shared/routes.js'
import { SSR_DATA_SCRIPT_ID, serializeSsrData } from './src/shared/ssr.js'

const DEFAULT_DEV_WORKER_ORIGIN = 'http://localhost:8787'
const ssrRoutes = new Set([appRoutes.home, appRoutes.terms, appRoutes.privacy])

function hasFileExtension(pathname) {
  return /\.[^/]+$/.test(pathname)
}

function getDevWorkerOrigin() {
  return (process.env.VITE_DEV_WORKER_ORIGIN || DEFAULT_DEV_WORKER_ORIGIN).replace(/\/+$/, '')
}

function isViteInternalPath(pathname) {
  return (
    pathname.startsWith('/@vite/') ||
    pathname === '/@react-refresh' ||
    pathname.startsWith('/@id/') ||
    pathname.startsWith('/@fs/') ||
    pathname.startsWith('/__vite_')
  )
}

function injectRenderedMarkup(documentHtml, appHtml, initialData) {
  const payloadScript = `<script id="${SSR_DATA_SCRIPT_ID}" type="application/json">${serializeSsrData(initialData)}</script>`

  return documentHtml
    .replace('<div id="root"></div>', `<div id="root">${appHtml}</div>`)
    .replace('</body>', `${payloadScript}</body>`)
}

function ssrRoutesPlugin() {
  const indexHtmlUrl = new URL('./src/index.html', import.meta.url)

  async function renderRoute(req, res, next, transformIndexHtml, ssrLoadModule) {
    try {
      const method = req.method || 'GET'
      if (method !== 'GET' && method !== 'HEAD') {
        next()
        return
      }

      const requestUrl = new URL(req.url || '/', 'http://localhost')
      const { pathname, search } = requestUrl

      if (
        pathname.startsWith('/api/') ||
        isViteInternalPath(pathname) ||
        isStaticAssetPath(pathname) ||
        hasFileExtension(pathname)
      ) {
        next()
        return
      }

      const canonicalPath = getCanonicalPath(pathname)
      if (canonicalPath !== pathname) {
        res.statusCode = 308
        res.setHeader('Location', `${canonicalPath}${search}`)
        res.end()
        return
      }

      const isKnownRoute = ssrRoutes.has(pathname) || isAppRoute(pathname)
      const html = await readFile(indexHtmlUrl, 'utf8')
      const transformedHtml = transformIndexHtml ? await transformIndexHtml(pathname, html) : html
      const { renderAppToString } = await ssrLoadModule('/entry-server.jsx')
      const initialData = {}
      const appHtml = renderAppToString({
        location: `${pathname}${search}`,
        initialData,
      })
      const htmlWithMetadata = injectDocumentMetadata(
        transformedHtml,
        buildDocumentMetadata(requestUrl)
      )

      res.statusCode = isKnownRoute ? 200 : 404
      res.setHeader('Content-Type', 'text/html; charset=utf-8')

      if (method === 'HEAD') {
        res.end()
        return
      }

      res.end(injectRenderedMarkup(htmlWithMetadata, appHtml, initialData))
    } catch (error) {
      next(error)
    }
  }

  return {
    name: 'starter-ssr-routes',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        renderRoute(
          req,
          res,
          next,
          server.transformIndexHtml.bind(server),
          server.ssrLoadModule.bind(server)
        )
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), ssrRoutesPlugin()],
  root: 'src',
  envDir: '..',
  publicDir: 'public',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
  },
  server: {
    proxy: {
      '/api': getDevWorkerOrigin(),
    },
  },
})
