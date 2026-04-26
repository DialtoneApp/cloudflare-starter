import React, { useEffect, useState } from 'react'

const featureCards = [
  {
    title: 'Server rendered pages',
    body: 'The Worker renders the React app for the public pages and hydrates it in the browser.',
  },
  {
    title: 'Simple D1 storage',
    body: 'The example API stores users in a small SQL table created by the first migration.',
  },
  {
    title: 'Simple R2 storage',
    body: 'The file API writes and reads private objects through an R2 bucket binding.',
  },
]

export function HomePage() {
  const [health, setHealth] = useState(null)

  useEffect(() => {
    let isMounted = true

    fetch('/api/health')
      .then((response) => response.json())
      .then((payload) => {
        if (isMounted) setHealth(payload)
      })
      .catch(() => {
        if (isMounted) setHealth({ ok: false, message: 'API unavailable' })
      })

    return () => {
      isMounted = false
    }
  }, [])

  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">React, Workers, D1, and R2</p>
          <h1>Generic starter for a Cloudflare web app.</h1>
          <p className="lede">
            Start with three server-rendered pages, a Worker API, a D1 migration flow,
            and a private R2 bucket example.
          </p>
          <div className="hero-actions" aria-label="Starter endpoints">
            <a className="button button-primary" href="/api/health">API health</a>
            <a className="button button-secondary" href="/api/users">Users JSON</a>
          </div>
        </div>

        <div className="status-panel" aria-live="polite">
          <span className={`status-dot${health?.ok ? ' status-dot-ready' : ''}`} />
          <div>
            <p className="status-label">Worker API</p>
            <p className="status-value">
              {health ? health.message : 'Checking local API...'}
            </p>
          </div>
        </div>
      </section>

      <section className="feature-grid" aria-label="Starter pieces">
        {featureCards.map((feature) => (
          <article className="feature-card" key={feature.title}>
            <h2>{feature.title}</h2>
            <p>{feature.body}</p>
          </article>
        ))}
      </section>

      <section className="example-section">
        <div>
          <p className="eyebrow">Backend examples</p>
          <h2>Small endpoints you can replace.</h2>
          <p>
            The API surface is intentionally plain JavaScript. Use it as a place to add
            your own routes, authentication, and data model.
          </p>
        </div>
        <div className="endpoint-list">
          <code>GET /api/health</code>
          <code>GET /api/users</code>
          <code>POST /api/users</code>
          <code>PUT /api/files/hello.txt</code>
          <code>GET /api/files/hello.txt</code>
        </div>
      </section>
    </>
  )
}
