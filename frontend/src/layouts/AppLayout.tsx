import React from 'react'
import './Layout.css'
import HyprLink from '../components/Base/HyprLink'

export default function AppLayout({children}: { children: React.ReactNode }) {
    return (
        <div className="app-layout">
            <header className="app-header">
                <strong>HyprSettings</strong>
                <hr/>
                <nav className="app-nav">
                    <HyprLink to="/settings/general" icon="Cog">General</HyprLink>
                    <HyprLink to="/settings/decoration" icon="Paintbrush">Decoration</HyprLink>
                    <HyprLink to="/settings/animation" icon="Sparkles">Animation</HyprLink>
                    <HyprLink to="/settings/input" icon="SlidersHorizontal">Input</HyprLink>
                    <HyprLink to="/settings/gesture" icon="Hand">Gesture</HyprLink>
                    <HyprLink to="/settings/bind" icon="Keyboard">Bind</HyprLink>
                    <HyprLink to="/settings/layout" icon="LayoutDashboard">Layout</HyprLink>
                    <HyprLink to="/settings/window" icon="PanelsTopLeft">Window</HyprLink>
                    <HyprLink to="/settings/wallpaper" icon="Image">Wallpaper</HyprLink>
                    <HyprLink to="/settings/cursor" icon="MousePointer">Cursor</HyprLink>
                    <HyprLink to="/settings/app" icon="AppWindow">App</HyprLink>
                    <HyprLink to="/settings/env" icon="FileCog">Env</HyprLink>
                    <HyprLink to="/settings/monitor" icon="Monitor">Monitor</HyprLink>
                    <HyprLink to="/settings/update" icon="RefreshCcw">Update</HyprLink>
                    {import.meta.env.DEV ? (
                        <HyprLink to="/settings/debug" icon="Bug">Debug</HyprLink>
                    ) : null}
                </nav>
            </header>
            <main className="app-main">{children}</main>
        </div>
    )
}
