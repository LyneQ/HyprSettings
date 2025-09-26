import React, { CSSProperties, useEffect, useState } from 'react';
import { SaveFile, GetFileContent } from '../../wailsjs/go/main/App';

export type FileViewerProps = {
    path: string | null | undefined;
    content: string | null | undefined;
    className?: string;
    onSaved?: () => void;
};


export default function FileViewer({ path, content, className, onSaved }: FileViewerProps) {
    const cacheKey = (p: string) => `hyprsettings:draft:${p}`;
    const normalizeText = (input: string): string => {
        let text = String(input ?? '');
        // Normalize Windows and old Mac newlines to \n
        text = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
        // handle escaped JavaScript sequences like "\\n" and "\\r"
        text = text.replace(/\\r\\n/g, '\n').replace(/\\r/g, '\n').replace(/\\n/g, '\n');

        return text;
    };

    const [draft, setDraft] = useState<string>('');
    const [saving, setSaving] = useState<boolean>(false);
    const [info, setInfo] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);


    useEffect(() => {
        setInfo(null);
        setError(null);
        if (!path) {
            setDraft('');
            return;
        }


        try {
            const cached = localStorage.getItem(cacheKey(path));
            if (cached != null && cached !== '') {
                setDraft(cached);
                return;
            } else if (cached === '') {
                // Clean up empty cache entries to avoid empty content in other views
                try { localStorage.removeItem(cacheKey(path)); } catch (e2) { }
            }
        } catch (e) {
            console.error('Failed to load draft from localStorage', e);
        }

        if (typeof content === 'string') {
            const normalizedFromProp = normalizeText(content);
            setDraft(normalizedFromProp);
        }

        let cancelled = false;
        (async () => {
            try {
                const raw = await GetFileContent(path);
                const normalized = normalizeText(raw);
                if (cancelled) return;
                setDraft(normalized);
            } catch (e) {
                if (cancelled) return;
                setError('Failed to load file');
                setDraft('');
            }
        })();
        return () => { cancelled = true; };
    }, [path]);

    useEffect(() => {
        if (!path) return;
        // Do not persist empty drafts; they can cause advanced view to be empty in other views
        if (draft === '') {
            try { localStorage.removeItem(cacheKey(path)); } catch (e) { }
            return;
        }
        try {
            localStorage.setItem(cacheKey(path), draft);
            setInfo('Draft saved locally');
        } catch (e) {
           console.error('Failed to save draft locally', e);
        }
    }, [draft, path]);



    const textAreaStyle: CSSProperties = {
        width: '100%',
        minHeight: 800,
        fontFamily: 'inherit',
        fontSize: 'inherit',
        lineHeight: 'inherit',
        background: '#0b0d12',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-sm)',
        padding: 8,
        boxSizing: 'border-box',
        resize: 'vertical',
        whiteSpace: 'pre',
    };

    return (
        <div className={className}>
            {!path ? (
                <div style={{ color: 'var(--muted)' }}>No file selected</div>
            ) : (
                <>
                    <textarea
                        spellCheck={false}
                        style={textAreaStyle}
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                    />
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 8 }}>
                        <button
                            className="btn"
                            disabled={saving}
                            onClick={async () => {
                                if (!path) return;
                                setSaving(true);
                                setError(null);
                                setInfo(null);
                                try {
                                    await SaveFile(path, draft);
                                    localStorage.removeItem(cacheKey(path));
                                    setInfo('Saved');
                                    if (typeof onSaved === 'function') onSaved();
                                } catch (e: any) {
                                    setError('Failed to save');
                                } finally {
                                    setSaving(false);
                                }
                            }}
                        >
                            {saving ? 'Saving…' : 'Save'}
                        </button>
                        <button
                            className="btn btn--ghost"
                            onClick={() => { if (path) { localStorage.removeItem(cacheKey(path)); setInfo('Draft cleared'); } }}
                            disabled={saving}
                        >
                            Clear Draft
                        </button>
                        {error && <span style={{ color: 'crimson', fontSize: 12 }}>{error}</span>}
                        {info && !error && <span style={{ color: '#7aa2f7', fontSize: 12 }}>{info}</span>}
                    </div>
                </>
            )}
        </div>
    );
}
