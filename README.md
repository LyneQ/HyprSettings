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

Testing
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