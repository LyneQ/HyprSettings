import React from 'react'
import {RouterRoot} from './router/AppRouter'
import type {RouteDefinition} from './router/types'
import General from './pages/settings/General/General'
import AppSettings from './pages/settings/App/App'
import EnvSettings from './pages/settings/Env/Env'
import MonitorSettings from './pages/settings/Monitor/Monitor'
import DebugSettings from './pages/settings/Debug/Debug'
import NotFound from './pages/NotFound/NotFound'
import AppLayout from './layouts/AppLayout'
import Animation from './pages/settings/Animation/Animation'
import Bind from './pages/settings/Bind/Bind'
import Cursor from './pages/settings/Cursor/Cursor'
import Decoration from './pages/settings/Decoration/Decoration'
import Gesture from './pages/settings/Gesture/Gesture'
import Input from './pages/settings/Input/Input'
import LayoutSettings from './pages/settings/Layout/Layout'
import Update from './pages/settings/Update/Update'
import Wallpaper from './pages/settings/Wallpaper/Wallpaper'
import WindowSettings from './pages/settings/Window/Window'
import './App.css'
import Design from "./pages/Design";

const routes: RouteDefinition[] = [
    {path: '/', redirectTo: '/settings/general', layout: AppLayout, meta: {title: 'Home'}},
    {path: '/settings', redirectTo: '/settings/general', layout: AppLayout, meta: {title: 'Settings'}},
    {path: '/settings/general', element: <Design/>, layout: AppLayout, meta: {title: 'General'}},
    {path: '/settings/app', element: <AppSettings/>, layout: AppLayout, meta: {title: 'App'}},
    {path: '/settings/env', element: <EnvSettings/>, layout: AppLayout, meta: {title: 'Env'}},
    {path: '/settings/monitor', element: <MonitorSettings/>, layout: AppLayout, meta: {title: 'Monitor'}},
    {path: '/settings/animation', element: <Animation/>, layout: AppLayout, meta: {title: 'Animation'}},
    {path: '/settings/bind', element: <Bind/>, layout: AppLayout, meta: {title: 'Bind'}},
    {path: '/settings/cursor', element: <Cursor/>, layout: AppLayout, meta: {title: 'Cursor'}},
    {path: '/settings/decoration', element: <Decoration/>, layout: AppLayout, meta: {title: 'Decoration'}},
    {path: '/settings/gesture', element: <Gesture/>, layout: AppLayout, meta: {title: 'Gesture'}},
    {path: '/settings/input', element: <Input/>, layout: AppLayout, meta: {title: 'Input'}},
    {path: '/settings/layout', element: <LayoutSettings/>, layout: AppLayout, meta: {title: 'Layout'}},
    {path: '/settings/update', element: <Update/>, layout: AppLayout, meta: {title: 'Update'}},
    {path: '/settings/wallpaper', element: <Wallpaper/>, layout: AppLayout, meta: {title: 'Wallpaper'}},
    {path: '/settings/window', element: <WindowSettings/>, layout: AppLayout, meta: {title: 'Window'}},
    {
        path: '/settings/debug',
        element: <DebugSettings/>,
        layout: AppLayout,
        meta: {title: 'Debug'},
        guards: [(/*ctx*/) => import.meta.env.DEV]
    },
]

export default function App() {
    return (
        <RouterRoot
            mode={import.meta.env.VITE_ROUTER_MODE as any || 'hash'}
            basename={import.meta.env.VITE_ROUTER_BASENAME}
            routes={routes}
            notFound={<NotFound/>}
            loadingFallback={<div className="app-fallback">Loading…</div>}
            deniedFallback={<div className="app-fallback">Access denied</div>}
            beforeEach={({from, to}) => {
                console.debug('[router beforeEach]', {from, to})
                return true
            }}
            afterEach={({from, to}) => {
                console.debug('[router afterEach]', {from, to})
                const title = routes.find(r => r.path === to.pathname)?.meta?.title
                if (title) {
                    document.title = `HyprSettings • ${title}`
                }
            }}
        />
    )
}
