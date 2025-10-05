import React, { useEffect, useState } from 'react';
import './style.scss';

// Extend Performance interface for Chrome-specific memory API
interface PerformanceMemory {
    jsHeapSizeLimit: number;
    totalJSHeapSize: number;
    usedJSHeapSize: number;
}

// Type definitions for Wails runtime
interface WailsRuntime {
    Environment: () => Promise<{ buildType: string; platform: string; arch: string }>;
    WindowGetSize: () => Promise<{ w: number; h: number }>;
    WindowGetPosition: () => Promise<{ x: number; y: number }>;
    WindowIsFullscreen: () => Promise<boolean>;
    WindowIsMaximised: () => Promise<boolean>;
    WindowIsMinimised: () => Promise<boolean>;
    ScreenGetAll: () => Promise<Array<{ isCurrent: boolean; isPrimary: boolean; width: number; height: number }>>;
    ClipboardGetText: () => Promise<string>;
}

interface DebugData {
    wailsEnv?: {
        buildType: string;
        platform: string;
        arch: string;
    };
    window?: {
        size: { w: number; h: number };
        position: { x: number; y: number };
        isFullscreen: boolean;
        isMaximised: boolean;
        isMinimised: boolean;
    };
    screens?: Array<{
        isCurrent: boolean;
        isPrimary: boolean;
        width: number;
        height: number;
    }>;
    coreFiles?: Array<any>;
    clipboard?: string;
}

export default function DebugSettings() {
    const [debugData, setDebugData] = useState<DebugData>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    //======================================================================================
    //NOTE: These modules may not exist during build, so we load them dynamically at runtime
    //======================================================================================
    const [wailsRuntime, setWailsRuntime] = useState<WailsRuntime | null>(null);
    const [wailsApp, setWailsApp] = useState<any>(null);

    useEffect(() => {
        const loadDynamicImports = async () => {
            try {
                const runtime = (await import('../../../../wailsjs/runtime/runtime')) as any;
                setWailsRuntime(runtime);
            } catch (e) {
                console.warn('Wails runtime not available');
            }

            try {
                const app = await import('../../../../wailsjs/go/main/App');
                setWailsApp(app);
            } catch (e) {
                console.warn('Wails App module not available');
            }
        };

        loadDynamicImports().then(console.log);
    }, []);

    useEffect(() => {
        if (wailsRuntime || wailsApp) {
            fetchDebugData().then(console.log);
        }
    }, [wailsRuntime, wailsApp]);

    const fetchDebugData = async () => {
        setLoading(true);
        setError(null);
        try {
            let env = null;
            let size = null;
            let position = null;
            let fullscreen = false;
            let maximised = false;
            let minimised = false;
            let screens: any[] = [];
            let coreFiles: any[] = [];

            if (wailsRuntime) {
                [env, size, position, fullscreen, maximised, minimised, screens] = await Promise.all([
                    wailsRuntime.Environment().catch(() => null),
                    wailsRuntime.WindowGetSize().catch(() => null),
                    wailsRuntime.WindowGetPosition().catch(() => null),
                    wailsRuntime.WindowIsFullscreen().catch(() => false),
                    wailsRuntime.WindowIsMaximised().catch(() => false),
                    wailsRuntime.WindowIsMinimised().catch(() => false),
                    wailsRuntime.ScreenGetAll().catch(() => []),
                ]);
            }

            if (wailsApp && wailsApp.GetCoreFiles) {
                coreFiles = await wailsApp.GetCoreFiles().catch(() => []);
                console.log(coreFiles);
            }

            setDebugData({
                wailsEnv: env || undefined,
                window:
                    size && position
                        ? {
                              size,
                              position,
                              isFullscreen: fullscreen,
                              isMaximised: maximised,
                              isMinimised: minimised,
                          }
                        : undefined,
                screens: screens.length > 0 ? screens : undefined,
                coreFiles: coreFiles.length > 0 ? coreFiles : undefined,
            });
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error');
        } finally {
            setLoading(false);
        }
    };

    const renderSection = (title: string, content: React.ReactNode) => (
        <div className="debug-section">
            <h3>{title}</h3>
            <div className="debug-content">{content}</div>
        </div>
    );

    const renderKeyValue = (key: string, value: any) => (
        <div className="debug-item" key={key}>
            <span className="debug-key">{key}:</span>
            <span className="debug-value">{JSON.stringify(value, null, 2)}</span>
        </div>
    );

    return (
        <div className="page page--settings-debug">
            <h1>Debug Information</h1>
            <p>Comprehensive developer tools and diagnostics.</p>

            {!import.meta.env.DEV && (
                <div className="debug-warning">This section is only available in development builds.</div>
            )}

            {loading && <div className="debug-loading">Loading debug information...</div>}
            {error && <div className="debug-error">Error: {error}</div>}

            <button className="debug-refresh-btn" onClick={fetchDebugData}>
                🔄 Refresh Data
            </button>

            {/* Wails Environment */}
            {debugData.wailsEnv &&
                renderSection(
                    'Wails Environment',
                    <>
                        {renderKeyValue('Build Type', debugData.wailsEnv.buildType)}
                        {renderKeyValue('Platform', debugData.wailsEnv.platform)}
                        {renderKeyValue('Architecture', debugData.wailsEnv.arch)}
                    </>
                )}

            {/* Window Information */}
            {debugData.window &&
                renderSection(
                    'Window Information',
                    <>
                        {renderKeyValue('Width', debugData.window.size.w)}
                        {renderKeyValue('Height', debugData.window.size.h)}
                        {renderKeyValue('Position X', debugData.window.position.x)}
                        {renderKeyValue('Position Y', debugData.window.position.y)}
                        {renderKeyValue('Fullscreen', debugData.window.isFullscreen)}
                        {renderKeyValue('Maximised', debugData.window.isMaximised)}
                        {renderKeyValue('Minimised', debugData.window.isMinimised)}
                    </>
                )}

            {/* Hyprland Config Files */}
            {debugData.coreFiles &&
                debugData.coreFiles.length > 0 &&
                renderSection(
                    'Hyprland Configuration Files',
                    <>
                        {debugData.coreFiles.map((file, idx) => (
                            <div key={idx} className="debug-subsection">
                                <h4>{file.Name || `File ${idx + 1}`}</h4>
                                {renderKeyValue('Path', file.Path)}
                                {renderKeyValue('Size', `${file.Size} bytes`)}
                                {renderKeyValue('Permission', file.Permission)}
                            </div>
                        ))}
                    </>
                )}

            {/* Timestamps */}
            {renderSection(
                'System Time',
                <>
                    {renderKeyValue('Current Time', new Date().toISOString())}
                    {renderKeyValue('Current Timestamp', Date.now())}
                    {renderKeyValue('Timezone', Intl.DateTimeFormat().resolvedOptions().timeZone)}
                    {renderKeyValue('Timezone Offset', new Date().getTimezoneOffset())}
                </>
            )}
        </div>
    );
}
