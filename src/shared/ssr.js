export const SSR_DATA_SCRIPT_ID = 'starter-ssr-data'

export function readSsrData() {
  if (typeof document === 'undefined') return {}

  const script = document.getElementById(SSR_DATA_SCRIPT_ID)
  if (!script?.textContent) return {}

  try {
    return JSON.parse(script.textContent)
  } catch (err) {
    console.warn('Unable to parse SSR payload', err)
    return {}
  }
}

export function serializeSsrData(data) {
  return JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029')
}
