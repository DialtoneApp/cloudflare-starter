function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...headers,
    },
  })
}

function notFound(message = 'Not found') {
  return json({ error: message }, 404)
}

function badRequest(message) {
  return json({ error: message }, 400)
}

function normalizeObjectKey(value) {
  const key = decodeURIComponent(value || '').replace(/^\/+/, '')
  if (!key || key.includes('..') || key.length > 512) return null
  return key
}

async function readJson(request) {
  try {
    return await request.json()
  } catch (err) {
    return null
  }
}

async function listUsers(env) {
  const { results } = await env.DB.prepare(
    'SELECT id, email, name, created_at FROM users ORDER BY created_at DESC LIMIT 25'
  ).all()

  return json({ users: results ?? [] })
}

async function createUser(request, env) {
  const body = await readJson(request)
  const email = String(body?.email || '').trim().toLowerCase()
  const name = String(body?.name || '').trim()

  if (!email || !email.includes('@')) {
    return badRequest('A valid email is required.')
  }

  if (!name) {
    return badRequest('A name is required.')
  }

  const user = {
    id: crypto.randomUUID(),
    email,
    name,
  }

  try {
    await env.DB.prepare('INSERT INTO users (id, email, name) VALUES (?, ?, ?)')
      .bind(user.id, user.email, user.name)
      .run()
  } catch (err) {
    if (String(err?.message || err).toLowerCase().includes('unique')) {
      return json({ error: 'A user with that email already exists.' }, 409)
    }

    throw err
  }

  return json({ user }, 201)
}

async function listFiles(env) {
  const objects = await env.BUCKET.list({ limit: 25 })
  return json({
    files: objects.objects.map((object) => ({
      key: object.key,
      size: object.size,
      uploaded: object.uploaded,
    })),
  })
}

async function getFile(key, env) {
  const object = await env.BUCKET.get(key)
  if (!object) return notFound('File not found.')

  const headers = new Headers()
  object.writeHttpMetadata(headers)
  headers.set('etag', object.httpEtag)
  headers.set('Cache-Control', 'no-store')

  return new Response(object.body, {
    headers,
  })
}

async function putFile(request, key, env) {
  const contentType = request.headers.get('content-type') || 'text/plain; charset=utf-8'

  await env.BUCKET.put(key, request.body, {
    httpMetadata: {
      contentType,
    },
  })

  return json({ key, stored: true }, 201)
}

async function deleteFile(key, env) {
  await env.BUCKET.delete(key)
  return json({ key, deleted: true })
}

export async function handleApiRequest(request, env) {
  const url = new URL(request.url)

  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    })
  }

  if (url.pathname === '/api/health' && request.method === 'GET') {
    return json({
      ok: true,
      message: 'API is running',
      timestamp: new Date().toISOString(),
    })
  }

  if (url.pathname === '/api/users') {
    if (request.method === 'GET') return listUsers(env)
    if (request.method === 'POST') return createUser(request, env)
    return json({ error: 'Method not allowed' }, 405, { Allow: 'GET, POST' })
  }

  if (url.pathname === '/api/files') {
    if (request.method === 'GET') return listFiles(env)
    return json({ error: 'Method not allowed' }, 405, { Allow: 'GET' })
  }

  if (url.pathname.startsWith('/api/files/')) {
    const key = normalizeObjectKey(url.pathname.slice('/api/files/'.length))
    if (!key) return badRequest('A valid file key is required.')

    if (request.method === 'GET') return getFile(key, env)
    if (request.method === 'PUT' || request.method === 'POST') return putFile(request, key, env)
    if (request.method === 'DELETE') return deleteFile(key, env)
    return json({ error: 'Method not allowed' }, 405, { Allow: 'GET, PUT, POST, DELETE' })
  }

  return notFound()
}
