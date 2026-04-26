import { renderAppToString } from '../../src/entry-server.jsx'
import { buildDocumentMetadata, injectDocumentMetadata } from '../../src/shared/documentMetadata.js'
import { appRoutes } from '../../src/shared/routes.js'
import { SSR_DATA_SCRIPT_ID, serializeSsrData } from '../../src/shared/ssr.js'

const ROOT_PATTERN = /<div id="root">\s*<\/div>/
const BODY_END_PATTERN = /<\/body>/i

function html(data, status = 200, headers = new Headers()) {
  const responseHeaders = new Headers(headers)
  responseHeaders.delete('Content-Length')
  responseHeaders.delete('ETag')
  responseHeaders.set('Content-Type', 'text/html; charset=utf-8')

  return new Response(data, {
    status,
    headers: responseHeaders,
  })
}

function injectRenderedMarkup(documentHtml, appHtml, initialData) {
  const withRoot = documentHtml.replace(ROOT_PATTERN, `<div id="root">${appHtml}</div>`)
  const payloadScript = `<script id="${SSR_DATA_SCRIPT_ID}" type="application/json">${serializeSsrData(initialData)}</script>`

  if (BODY_END_PATTERN.test(withRoot)) {
    return withRoot.replace(BODY_END_PATTERN, `${payloadScript}</body>`)
  }

  return `${withRoot}${payloadScript}`
}

async function getDocumentTemplate(request, env) {
  const assetUrl = new URL(request.url)
  assetUrl.pathname = appRoutes.home
  assetUrl.search = ''
  const assetRequest = new Request(assetUrl.toString(), {
    method: 'GET',
    headers: request.headers,
  })
  const response = await env.ASSETS.fetch(assetRequest)

  let htmlDocument = await response.text()
  let headers = response.headers

  if (!ROOT_PATTERN.test(htmlDocument) && assetUrl.hostname === 'localhost') {
    const viteResponse = await fetch('http://localhost:5173/index.html')
    if (viteResponse.ok) {
      htmlDocument = await viteResponse.text()
      headers = viteResponse.headers
    }
  }

  return {
    htmlDocument,
    headers,
  }
}

export async function renderAppDocument(request, env, status = 200) {
  const url = new URL(request.url)
  const initialData = {}
  const renderedApp = renderAppToString({
    location: `${url.pathname}${url.search}`,
    initialData,
  })
  const { htmlDocument, headers } = await getDocumentTemplate(request, env)
  const htmlWithMetadata = injectDocumentMetadata(htmlDocument, buildDocumentMetadata(url))
  const responseHtml = injectRenderedMarkup(htmlWithMetadata, renderedApp, initialData)

  return html(request.method === 'HEAD' ? '' : responseHtml, status, headers)
}
