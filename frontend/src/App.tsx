import React from 'react'
import {RouterRoot} from './router/AppRouter'
import type {RouteDefinition} from './router/types'
import General from './pages/General/General'
import NotFound from './pages/NotFound/NotFound'
import AppLayout from './layouts/AppLayout'
import './App.css'

const routes: RouteDefinition[] = [
  {
    path: '/',
    element: <General />,
    layout: AppLayout,
    meta: { title: 'General' }
  }
]

export default function App() {
  return (
    <RouterRoot
      mode={import.meta.env.VITE_ROUTER_MODE as any || 'hash'}
      basename={import.meta.env.VITE_ROUTER_BASENAME}
      routes={routes}
      notFound={<NotFound />}
      loadingFallback={<div className="app-fallback">Loading…</div>}
      deniedFallback={<div className="app-fallback">Access denied</div>}
      beforeEach={({ from, to }) => {
        console.debug('[router beforeEach]', { from, to })
        return true
      }}
      afterEach={({ from, to }) => {
        console.debug('[router afterEach]', { from, to })
        const title = routes.find(r => r.path === to.pathname)?.meta?.title
        if (title) {
          document.title = `HyprSettings • ${title}`
        }
      }}
    />
  )
}
