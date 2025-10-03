import React, { useEffect, useMemo, useState } from 'react';
import './Layout.css';
import HyprLink from '../components/Link/HyprLink';
import HyprStarfield from '../components/Background/HyprStarfield';
import HyprGroupsChild from '../components/Groups/HyprGroupsChild';

export default function AppLayout({ children }: { children: React.ReactNode }) {
    const storageKey = 'hypr:starfield:enabled';
    const [bgEnabled, setBgEnabled] = useState<boolean>(() => {
        try {
            const raw = localStorage.getItem(storageKey);
            if (raw === null) return true;
            return raw === '1' || raw === 'true';
        } catch {
            return true;
        }
    });

    useEffect(() => {
        try {
            localStorage.setItem(storageKey, bgEnabled ? '1' : '0');
        } catch {}
    }, [bgEnabled]);

    const switchId = useMemo(() => 'bg-toggle-' + Math.random().toString(36).slice(2), []);

    return (
        <div className="app-layout">
            <header className="app-header">
                <div className="app-header-title">
                    <strong>HyprSettings</strong>
                </div>
                <nav className="app-nav">
                    <HyprLink to="/settings/general" icon="Cog">
                        General
                    </HyprLink>
                    <HyprLink to="/settings/decoration" icon="Paintbrush">
                        Decoration
                    </HyprLink>
                    <HyprLink to="/settings/animation" icon="Sparkles">
                        Animation
                    </HyprLink>
                    <HyprLink to="/settings/input" icon="SlidersHorizontal">
                        Input
                    </HyprLink>
                    <HyprLink to="/settings/gesture" icon="Hand">
                        Gesture
                    </HyprLink>
                    <HyprLink to="/settings/bind" icon="Keyboard">
                        Bind
                    </HyprLink>
                    <HyprLink to="/settings/layout" icon="LayoutDashboard">
                        Layout
                    </HyprLink>
                    <HyprLink to="/settings/window" icon="PanelsTopLeft">
                        Window
                    </HyprLink>
                    <HyprLink to="/settings/wallpaper" icon="Image">
                        Wallpaper
                    </HyprLink>
                    <HyprLink to="/settings/cursor" icon="MousePointer">
                        Cursor
                    </HyprLink>
                    <HyprLink to="/settings/app" icon="AppWindow">
                        App
                    </HyprLink>
                    <HyprLink to="/settings/env" icon="FileCog">
                        Env
                    </HyprLink>
                    <HyprLink to="/settings/monitor" icon="Monitor">
                        Monitor
                    </HyprLink>
                    <HyprLink to="/settings/update" icon="RefreshCcw">
                        Update
                    </HyprLink>
                    {import.meta.env.DEV ? (
                        <HyprLink to="/settings/debug" icon="Bug">
                            Debug
                        </HyprLink>
                    ) : null}
                </nav>
                <div className="app-nav-bottom">
                    <label htmlFor={switchId} className="app-nav-bottom__label">
                        Animated background
                    </label>
                    <HyprGroupsChild
                        type="switch"
                        variable={bgEnabled}
                        onChangeValue={(v) => setBgEnabled(Boolean(v))}
                        id={switchId}
                        className="app-nav-bottom__switch"
                        aria-label="Toggle animated background"
                    />
                </div>
            </header>
            <main className="app-main">
                {bgEnabled ? <HyprStarfield /> : null}
                {children}
            </main>
        </div>
    );
}
