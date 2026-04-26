import { appRoutes } from './routes.js'

const siteName = 'Cloudflare React Starter'

const metadataByPath = {
  [appRoutes.home]: {
    title: siteName,
    description: 'A generic React and Cloudflare Workers starter with SSR, D1, and R2 examples.',
  },
  [appRoutes.terms]: {
    title: `Terms of Service | ${siteName}`,
    description: 'Generic starter terms of service placeholder copy.',
  },
  [appRoutes.privacy]: {
    title: `Privacy Policy | ${siteName}`,
    description: 'Generic starter privacy policy placeholder copy.',
  },
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function upsertTitle(html, title) {
  const tag = `<title>${escapeHtml(title)}</title>`
  if (/<title>.*?<\/title>/is.test(html)) {
    return html.replace(/<title>.*?<\/title>/is, tag)
  }
  return html.replace('</head>', `${tag}</head>`)
}

function upsertDescription(html, description) {
  const tag = `<meta name="description" content="${escapeHtml(description)}">`
  if (/<meta\s+name=["']description["'][^>]*>/i.test(html)) {
    return html.replace(/<meta\s+name=["']description["'][^>]*>/i, tag)
  }
  return html.replace('</head>', `${tag}</head>`)
}

export function buildDocumentMetadata(url) {
  const metadata = metadataByPath[url.pathname] || {
    title: `Not Found | ${siteName}`,
    description: 'The requested page was not found.',
  }

  return {
    ...metadata,
    canonicalUrl: `${url.origin}${url.pathname}`,
  }
}

export function injectDocumentMetadata(html, metadata) {
  return upsertDescription(upsertTitle(html, metadata.title), metadata.description)
}
