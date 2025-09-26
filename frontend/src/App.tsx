import { useEffect, useMemo, useState } from 'react';
import './App.css';
import { GetSourcedFilePaths, GetConfigFilesPath, GetFileContent } from "../wailsjs/go/main/App";
import SourcedFilesList from './components/SourcedFilesList';
import FileViewer from './components/FileViewer';
import FileViewerSimplified from './components/FileViewerSimplified';

function App() {
    const [paths, setPaths] = useState<string[] | null>(null);
    const [defaultConfigPath, setDefaultConfigPath] = useState<string | null>(null);
    const [selectedPath, setSelectedPath] = useState<string | null>(null);
    const [fileContent, setFileContent] = useState<string>("Loading file...");
    const [error, setError] = useState<string | null>(null);
    const [refreshTick, setRefreshTick] = useState<number>(0);

    const VIEW_MODE_KEY = 'hyprsettings:viewMode';
    const [viewMode, setViewMode] = useState<'advanced' | 'simplified'>(() => {
        try {
            const v = localStorage.getItem(VIEW_MODE_KEY);
            return v === 'simplified' ? 'simplified' : 'advanced';
        } catch {
            return 'advanced';
        }
    });
    useEffect(() => {
        try {
            localStorage.setItem(VIEW_MODE_KEY, viewMode);
        } catch {
            console.error('Failed to save view mode');
        }
    }, [viewMode]);

    // Load paths and default config path
    useEffect(() => {
        let isMounted = true;
        GetSourcedFilePaths()
            .then((r: string[]) => { if (isMounted) setPaths(r); })
            .catch(() => { if (isMounted) setError('Failed to load sourced files'); });

        GetConfigFilesPath()
            .then((r: string) => { if (isMounted) setDefaultConfigPath(r); })
            .catch(() => { if (isMounted) setError('Failed to load config files'); });

        return () => { isMounted = false; };
    }, []);


    const combinedPaths = useMemo(() => {
        const list: string[] = [];
        if (defaultConfigPath) list.push(defaultConfigPath);
        if (paths && paths.length) list.push(...paths);
        return list;
    }, [defaultConfigPath, paths]);

    // preselect first path to avoid empty view
    useEffect(() => {
        if (!selectedPath && combinedPaths.length > 0) {
            setSelectedPath(combinedPaths[0]);
        }
    }, [combinedPaths, selectedPath]);


    useEffect(() => {
        let isMounted = true;
        if (!selectedPath) return;
        setFileContent('Loading file...');
        GetFileContent(selectedPath)
            .then((content: string) => { if (isMounted) setFileContent(content); })
            .catch(() => { if (isMounted) setFileContent('Failed to load file content'); });
        return () => { isMounted = false; };
    }, [selectedPath, refreshTick]);

    return (
        <div style={{ padding: 12, display: 'grid', gridTemplateColumns: '1fr 4fr', gap: 6, alignItems: 'start' }}>
            {error ? (
                <div style={{ color: 'crimson' }}>{error}</div>
            ) : (
                <>
                    <SourcedFilesList
                        paths={combinedPaths}
                        onSelect={(p) => setSelectedPath(p)}
                    />
                    <div style={{ border: '1px solid rgba(0,0,0,0.1)', borderRadius: 8, padding: 8, background: 'rgba(0,0,0,0.03)' }}>
                        <div style={{ marginBottom: 8, fontSize: 12, color: '#555' }}>{selectedPath || 'No file selected'}</div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
                            <button
                                className="btn btn--ghost"
                                onClick={() => setViewMode(viewMode === 'advanced' ? 'simplified' : 'advanced')}
                            >
                                {viewMode === 'advanced' ? 'Switch to simplified view' : 'Switch to advanced view'}
                            </button>
                        </div>
                        {viewMode === 'advanced' ? (
                            <FileViewer path={selectedPath} content={fileContent} onSaved={() => setRefreshTick(t => t + 1)} />
                        ) : (
                            <FileViewerSimplified path={selectedPath} content={fileContent} onSaved={() => setRefreshTick(t => t + 1)} />
                        )}
                    </div>
                </>
            )}
        </div>
    )
}

export default App
