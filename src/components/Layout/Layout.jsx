import React, { useEffect, useRef } from 'react'
import { NavLink, Link, useLocation } from 'react-router-dom'
import { appRoutes } from '../../shared/routes'

function ScrollToTop() {
  const location = useLocation()
  const previousPathnameRef = useRef(location.pathname)

  useEffect(() => {
    if (previousPathnameRef.current === location.pathname) return
    previousPathnameRef.current = location.pathname

    if (typeof window !== 'undefined' && !location.hash) {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
    }
  }, [location.pathname, location.hash])

  return null
}

export function Layout({ children }) {
  return (
    <div className="app-shell">
      <ScrollToTop />
      <header className="site-header">
        <Link className="brand" to={appRoutes.home} aria-label="Cloudflare React Starter home">
          <span className="brand-icon" aria-hidden="true">CF</span>
          <span>Cloudflare React Starter</span>
        </Link>

        <nav className="site-nav" aria-label="Primary navigation">
          <NavLink to={appRoutes.home}>Home</NavLink>
          <NavLink to={appRoutes.terms}>Terms</NavLink>
          <NavLink to={appRoutes.privacy}>Privacy</NavLink>
        </nav>
      </header>

      <main className="page-main">{children}</main>

      <footer className="site-footer">
        <p>Built for a generic Cloudflare Workers application.</p>
        <div className="footer-links">
          <Link to={appRoutes.terms}>Terms</Link>
          <Link to={appRoutes.privacy}>Privacy</Link>
        </div>
      </footer>
    </div>
  )
}
