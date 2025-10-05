import React, { useEffect, useState, useRef } from 'react';
import './style.scss';
import HyprGroupsChild from '../../../components/Groups/HyprGroupsChild';
import { useToast } from '../../../components/Utils/Toast';

export default function Wallpaper() {
    const [wallpaperPath, setWallpaperPath] = useState<string>('');
    const [inputValue, setInputValue] = useState<string>('');
    const { showToast } = useToast();
    //@ts-ignore
    const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

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

    // Debounce effect: Update wallpaper after user stops typing for 1 second
    useEffect(() => {
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }
        if (!inputValue || inputValue === wallpaperPath) {
            return;
        }
        debounceTimerRef.current = setTimeout(() => {
            updateWallpaper(inputValue);
        }, 1000);
        return () => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
        };
    }, [inputValue]);

    const loadHyprpaperConfig = async () => {
        showToast('Loading configuration...', 'loading');
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
                            setInputValue(path);
                            break;
                        }
                    }
                }
                showToast('Configuration loaded successfully', 'success', 2000);
            }
        } catch (err) {
            showToast(err instanceof Error ? err.message : 'Failed to load hyprpaper config', 'error');
        }
    };

    const updateWallpaper = async (pathStr: string) => {
        try {
            if (wailsApp && wailsApp.UpdateHyprpaperWallpaper) {
                await wailsApp.UpdateHyprpaperWallpaper(pathStr);
                setWallpaperPath(pathStr);
                showToast('Wallpaper path updated successfully!', 'success');
            }
        } catch (err) {
            showToast(err instanceof Error ? err.message : 'Failed to update wallpaper path', 'error');
        }
    };

    const handlePathChange = (newPath: string | number | boolean) => {
        const pathStr = String(newPath);
        setInputValue(pathStr);
    };

    return (
        <div className="page page--wallpaper">
            <h1>Wallpaper</h1>
            <p>Change wallpaper path in hyprpaper.conf</p>

            <div className="wallpaper-section">
                <h3>Wallpaper Path</h3>
                <p className="wallpaper-help">
                    Enter the path to your wallpaper image (e.g., ~/Pictures/wallpaper/image.jpg)
                </p>
                <div className="wallpaper-input-container">
                    <label htmlFor="wallpaper-path">Path:</label>
                    <HyprGroupsChild
                        type="text"
                        variable={inputValue}
                        onChangeValue={handlePathChange}
                        placeholder="~/Pictures/wallpaper/image.jpg"
                        id="wallpaper-path"
                    />
                </div>
            </div>
        </div>
    );
}
