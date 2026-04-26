import React from 'react'
import { Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout/Layout'
import { HomePage } from './pages/Home/index'
import { LegalPage } from './pages/Legal/index'
import { NotFoundPage } from './pages/NotFound/index'
import { appRoutes } from './shared/routes'

export function App() {
  return (
    <Layout>
      <Routes>
        <Route path={appRoutes.home} element={<HomePage />} />
        <Route
          path={appRoutes.terms}
          element={<LegalPage kind="terms" title="Terms of Service" />}
        />
        <Route
          path={appRoutes.privacy}
          element={<LegalPage kind="privacy" title="Privacy Policy" />}
        />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Layout>
  )
}
