import React, { useEffect, useState } from 'react';
import './style.scss';
import HyprGroupsChild from '../../../components/Groups/HyprGroupsChild';

export default function Wallpaper() {
    const [wallpaperPath, setWallpaperPath] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    //======================================================================================
    //NOTE: These modules may not exist during build, so we load them dynamically at runtime
    //======================================================================================
    const [wailsApp, setWailsApp] = useState<any>(null);

    useEffect(() => {
        const loadDynamicImports = async () => {
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
        if (wailsApp) {
            loadHyprpaperConfig().then(console.log);
        }
    }, [wailsApp]);

    const loadHyprpaperConfig = async () => {
        setLoading(true);
        setError(null);
        try {
            if (wailsApp && wailsApp.GetHyprpaperConfig) {
                const config = await wailsApp.GetHyprpaperConfig();

                // Parse the config to extract the wallpaper path
                const lines = config.split('\n');
                for (const line of lines) {
                    const trimmedLine = line.trim();
                    if (trimmedLine.startsWith('preload')) {
                        // Extract path from "preload = ~/Pictures/wallpaper/abs.jpg"
                        const parts = trimmedLine.split('=');
                        if (parts.length >= 2) {
                            const path = parts.slice(1).join('=').trim();
                            setWallpaperPath(path);
                            break;
                        }
                    }
                }
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load hyprpaper config');
        } finally {
            setLoading(false);
        }
    };

    const handlePathChange = async (newPath: string | number | boolean) => {
        const pathStr = String(newPath);
        setWallpaperPath(pathStr);
        setSuccess(null);
        setError(null);

        try {
            if (wailsApp && wailsApp.UpdateHyprpaperWallpaper) {
                await wailsApp.UpdateHyprpaperWallpaper(pathStr);
                setSuccess('Wallpaper path updated successfully!');
                setTimeout(() => setSuccess(null), 3000);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update wallpaper path');
        }
    };

    return (
        <div className="page page--wallpaper">
            <h1>Wallpaper</h1>
            <p>Change wallpaper path in hyprpaper.conf</p>

            {loading && <div className="wallpaper-loading">Loading configuration...</div>}
            {error && <div className="wallpaper-error">Error: {error}</div>}
            {success && <div className="wallpaper-success">{success}</div>}

            <div className="wallpaper-section">
                <h3>Wallpaper Path</h3>
                <p className="wallpaper-help">
                    Enter the path to your wallpaper image (e.g., ~/Pictures/wallpaper/image.jpg)
                </p>
                <div className="wallpaper-input-container">
                    <label htmlFor="wallpaper-path">Path:</label>
                    <HyprGroupsChild
                        type="text"
                        variable={wallpaperPath}
                        onChangeValue={handlePathChange}
                        placeholder="~/Pictures/wallpaper/image.jpg"
                        id="wallpaper-path"
                    />
                </div>
            </div>
        </div>
    );
}
