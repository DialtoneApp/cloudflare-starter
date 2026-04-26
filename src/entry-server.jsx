import React from 'react'
import { renderToString } from 'react-dom/server'
import { StaticRouter } from 'react-router-dom'
import { App } from './App'

export function renderAppToString({ location, initialData = {} }) {
  return renderToString(
    <StaticRouter location={location}>
      <App initialData={initialData} />
    </StaticRouter>
  )
}
