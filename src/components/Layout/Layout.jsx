import React, { useEffect, useRef, useState } from 'react'
import { Moon, Sun } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { appRoutes } from '../../shared/routes'

const THEME_STORAGE_KEY = 'starter-theme'

function applyTheme(theme) {
  if (typeof document === 'undefined') return
  document.documentElement.dataset.theme = theme
}

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
  const [theme, setTheme] = useState('dark')
  const nextTheme = theme === 'dark' ? 'light' : 'dark'

  useEffect(() => {
    const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY)
    const normalizedTheme = storedTheme === 'light' ? 'light' : 'dark'

    setTheme(normalizedTheme)
    applyTheme(normalizedTheme)
  }, [])

  function toggleTheme() {
    setTheme((currentTheme) => {
      const updatedTheme = currentTheme === 'dark' ? 'light' : 'dark'
      window.localStorage.setItem(THEME_STORAGE_KEY, updatedTheme)
      applyTheme(updatedTheme)
      return updatedTheme
    })
  }

  return (
    <div className="app-shell">
      <ScrollToTop />
      <header className="site-header">
        <Link className="brand" to={appRoutes.home} aria-label="Cloudflare React Starter home">
          <span className="brand-icon" aria-hidden="true">CF</span>
          <span>Cloudflare React Starter</span>
        </Link>

        <div className="site-actions" aria-label="Appearance settings">
          <button
            type="button"
            className="theme-toggle"
            aria-label={`Switch to ${nextTheme} theme`}
            title={`Switch to ${nextTheme} theme`}
            onClick={toggleTheme}
          >
            {theme === 'dark' ? (
              <Sun size={18} aria-hidden="true" />
            ) : (
              <Moon size={18} aria-hidden="true" />
            )}
          </button>
        </div>
      </header>

      <main className="page-main">{children}</main>

      <footer className="site-footer">
        <p>Built for a generic Cloudflare Workers application.</p>
        <div className="footer-links">
          <Link to={appRoutes.terms}>Terms</Link>
          <Link to={appRoutes.privacy}>Privacy</Link>
          <a href="https://github.com/DialtoneApp/cloudflare-starter">GitHub</a>
          <a href="https://dialtoneapp.com/cloudflare">Cloudflare guide</a>
        </div>
      </footer>
    </div>
  )
}
