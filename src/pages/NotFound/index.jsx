import React from 'react'
import { Link } from 'react-router-dom'
import { appRoutes } from '../../shared/routes'

export function NotFoundPage() {
  return (
    <section className="not-found-page">
      <p className="eyebrow">404</p>
      <h1>Page not found</h1>
      <p className="lede">The page you requested is not part of this starter.</p>
      <Link className="button button-primary" to={appRoutes.home}>Go home</Link>
    </section>
  )
}
