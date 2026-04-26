export const appRoutes = Object.freeze({
  home: '/',
  terms: '/terms',
  privacy: '/privacy',
})

const appPathSet = new Set(Object.values(appRoutes))
const staticAssetPathSet = new Set(['/favicon.svg', '/robots.txt'])
const staticAssetPrefixes = ['/assets/']

export function getCanonicalPath(pathname) {
  if (typeof pathname === 'string' && pathname.length > 1 && pathname.endsWith('/')) {
    const normalizedPathname = pathname.slice(0, -1)
    if (appPathSet.has(normalizedPathname)) {
      return normalizedPathname
    }
  }

  return pathname
}

export function isAppRoute(pathname) {
  return appPathSet.has(pathname)
}

export function isStaticAssetPath(pathname) {
  if (staticAssetPathSet.has(pathname)) return true
  return staticAssetPrefixes.some((prefix) => pathname.startsWith(prefix))
}
