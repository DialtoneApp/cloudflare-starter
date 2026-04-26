import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { App } from './App.client'
import { readSsrData } from './shared/ssr'
import './styles.css'

const rootElement = document.getElementById('root')
const initialData = readSsrData()

const app = (
  <React.StrictMode>
    <BrowserRouter>
      <App initialData={initialData} />
    </BrowserRouter>
  </React.StrictMode>
)

if (rootElement?.hasChildNodes()) {
  ReactDOM.hydrateRoot(rootElement, app)
} else if (rootElement) {
  ReactDOM.createRoot(rootElement).render(app)
}
