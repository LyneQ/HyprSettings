HyprSettings

Overview
- HyprSettings is a desktop GUI built with Wails (Go + WebView) to view and edit your Hyprland configuration files.
- It discovers your main Hyprland config at ~/.config/hypr/hyprland.conf, scans it for source directives, and lets you browse and edit those files from a simple interface.
- The UI is written in React + TypeScript (Vite). The backend is Go, exposing functions to the frontend through Wails bindings.

Tech Stack
- Language: Go (module name: HyprSettings)
- Framework: Wails v2 (github.com/wailsapp/wails/v2)
- Frontend: React 18, TypeScript, Vite 3
- Package manager (frontend): npm

Requirements
- OS: Linux (Wayland) with Hyprland if you want to work with real configs
- Go: 1.23 (see go.mod)
- Wails CLI: v2 (install via `go install github.com/wailsapp/wails/v2/cmd/wails@latest`)
- Node.js + npm: required for building/running the frontend (Vite 3). TODO: Confirm the minimum Node.js version you use in development/CI

Permissions and File Safety
- The app reads your Hyprland config file at `~/.config/hypr/hyprland.conf` and any files matched by `source` directives.
- Saving files uses permission mode 0600 (owner read/write) in `App.SaveFile`.
- Always back up important configuration files before large edits.

Testing
- No automated tests were found in this repository.
- TODO: Add tests

Common Issuesd any files
- "config file does not exist": The app expects `~/.config/hypr/hyprland.conf` to exist. Normally this is created by Hyprland.
- Wayland/Hyprland specifics: This app is intended for Hyprland users; on other .conf file will works, but file discovery may fail.

License
- MIT License. See the LICENSE file for details.

Contributing
- Install prerequisites
- Use `wails dev` during development
- Open pull requests for fixes and features; please include details and screenshots for UI changes

Credits
- Author LyneQ <Hey@lyneq.tech>
- Built with Wails v2, React, TypeScript, and Vite


Routing
- A highly customizable React Router has been integrated (react-router-dom v6). The app uses a router wrapper that supports modes (hash/browser/memory), route guards, per-route layouts, lazy loading, not-found pages, and navigation hooks (beforeEach/afterEach).

Basics
- Entry: frontend/src/App.tsx configures routes and RouterRoot.
- Modes: default is hash (good for Wails). You can override via env variables in Vite:
  - VITE_ROUTER_MODE=hash|browser|memory
  - VITE_ROUTER_BASENAME=/your/base

Add a new route (example)
- Edit frontend/src/App.tsx and append to the routes array:

  {
    path: '/about',
    element: <About />,
    layout: AppLayout,
    meta: { title: 'About' },
    guards: [async ({ to }) => {
      // Return false to deny navigation
      return true
    }]
  }

- For large pages, prefer lazy loading:

  {
    path: '/heavy',
    lazy: () => import('./pages/HeavyPage'),
    layout: AppLayout,
  }

Hooks
- Use beforeEach/afterEach props on RouterRoot to run code around navigations.
- Example in App.tsx updates document.title based on route meta.

API overview
- src/router/types.ts contains the RouteDefinition and Guard types.
- Layout: any component receiving { children } can be provided per route.
- Guards: functions receiving { from, to } returning boolean or Promise<boolean>.

Notes for Wails
- HashRouter is recommended (no server config needed). BrowserRouter may work if your setup handles deep links.
