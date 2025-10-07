import React, { useEffect, useState, useRef } from 'react';
import './style.scss';
import HyprGroupsChild from '../../../components/HyprGroups/HyprGroupsChild';
import { useToast } from '../../../components/Toast/Toast';
import HyprLink from '../../../components/Link/HyprLink';
import HyprEmbed from '../../../components/Embed/HyprEmbed';
import ImageGallery from '../../../components/Gallery/ImageGallery';

type Image = {
    Name: string;
    Path: string;
    Ext: string;
    Mime: string;
    Size: number;
    Content: string;
};

export default function Wallpaper() {
    const [wallpaperPath, setWallpaperPath] = useState<string>('');
    const [inputValue, setInputValue] = useState<string>('');
    const [Images, setImages] = useState<Image[] | []>([]);
    const [galeryPath, setGalleryPath] = useState<string>('');
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

        loadDynamicImports();
    }, []);

    useEffect(() => {
        if (wailsApp) {
            loadHyprpaperConfig();
        }
    }, [wailsApp]);

    // Update wallpaper path on input change
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

    const loadWallpaperImages = async (Path: string) => {
        try {
            const images = await wailsApp.GetHyprpaperWallpaper(Path);
            setImages(images || []);
        } catch (e) {
            console.error('Failed to load wallpaper images:', e);
            showToast('Failed to load wallpaper gallery', 'error');
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

    const handleImageSelect = (image: Image) => {
        setInputValue(image.Path);
        showToast(`Selected: ${image.Name}`, 'success', 2000);
    };

    return (
        <div className="page page--wallpaper">
            <h1>Wallpaper</h1>
            <p>
                Manage your desktop wallpaper using Hyprpaper, the Hypr Ecosystem's native wallpaper manager. WARNING:
                This feature requires
                <HyprLink to="https://wiki.hypr.land/Hypr-Ecosystem/hyprpaper/" external>
                    Hyprpaper
                </HyprLink>
                to be installed and running using
                <HyprLink to="https://wiki.hypr.land/Hypr-Ecosystem/hyprpaper/#run-at-startup" external>
                    systemctl
                </HyprLink>{' '}
                to enjoy automatic reload.
            </p>

            <HyprEmbed status="warning">
                <p>
                    <strong>Important:</strong> This feature requires Hyprpaper to be installed and running with
                    systemctl for automatic reload.
                </p>
            </HyprEmbed>

            <div className="wallpaper-section">
                <h3>Wallpaper Path</h3>
                <p className="wallpaper-help">
                    Enter the path to your wallpaper image (e.g., ~/Pictures/wallpaper/image.jpg) or choose a file from
                    the gallery down below.
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

            <div className="wallpaper-section">
                <h3>Wallpaper Gallery</h3>
                <p className="wallpaper-help">
                    Select a wallpaper from the gallery below. Click on an image to preview it, then click "Select" to
                    set it as your wallpaper.
                </p>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px', gap: '10px' }}>
                    <HyprGroupsChild
                        type="text"
                        variable={galeryPath}
                        onChangeValue={(v) => {
                            const path = v.toString();
                            // Check if path is valid and not too deep
                            if (path.length === 0) return;
                            if (path.trim() === '/') {
                                showToast('Path cannot be root directory.', 'error');
                            } else if (path.split('/').length > 10) {
                                showToast('Path is too deep. Please choose a path with fewer subdirectories.', 'error');
                                return;
                            } else if (path.includes('..')) {
                                showToast('Invalid path. Path traversal is not allowed.', 'error');
                                return;
                            } else if (!path.startsWith('~') && !path.startsWith('/')) {
                                showToast('Invalid path. Please use absolute path or path starting with ~', 'error');
                                return;
                            } else {
                                setGalleryPath(path);
                            }
                        }}
                        id="wallpaper-gallery-path"
                    />
                    <button className="wallpaper-gallery-btn" onClick={() => loadWallpaperImages(galeryPath)}>
                        Search
                    </button>
                </div>
                {galeryPath.length > 0 && (
                    <ImageGallery
                        images={Promise.resolve(Images)}
                        onSelect={handleImageSelect}
                        OnSelectAvailable={true}
                    />
                )}
            </div>
        </div>
    );
}
