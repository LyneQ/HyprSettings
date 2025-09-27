import React from 'react'
import {Link} from 'react-router-dom'
import './Layout.css'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  // TODO: add LucideIcon and preconfigure all routes
    return (
    <div className="app-layout">
      <header className="app-header">
        <strong>HyprSettings</strong>
          <hr/>
        <nav className="app-nav">
          <Link to="/">General</Link>
        </nav>
      </header>
      <main className="app-main">{children}</main>
    </div>
  )
}
