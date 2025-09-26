import React, { CSSProperties } from 'react';

export type SourcedFilesListProps = {
  paths: string[] | null | undefined;
  className?: string;
  style?: CSSProperties;
  onSelect?: (path: string) => void;
};

/**
 * SourcedFilesList renders a list of file paths (e.g., Hyprland sourced files).
 * The editing experience is handled in FileViewer; this list only selects a file to edit.
 */
export default function SourcedFilesList({ paths, className, style, onSelect }: SourcedFilesListProps) {
  const filename = (p: string) => p.replace(/^.*[\\\/]/, '') || 'Untitled';

  const containerStyle: CSSProperties = {
    fontFamily:
      'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
    fontSize: '0.9rem',
    lineHeight: 1.4,
    background: 'var(--panel)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
    boxShadow: 'var(--shadow)',
    padding: 10,
    overflow: 'auto',
    ...style,
  };

  const listStyle: CSSProperties = {
    listStyle: 'none',
    margin: 0,
    padding: 0,
    display: 'grid',
    gap: 6,
  };

  const stateStyle: CSSProperties = {
    color: 'var(--muted)',
    textAlign: 'center',
    padding: '8px 4px',
  };

  if (!paths) {
    return (
      <div className={className} style={containerStyle}>
        <div style={stateStyle}>Loading sourced files…</div>
      </div>
    );
  }

  if (paths.length === 0) {
    return (
      <div className={className} style={containerStyle}>
        <div style={stateStyle}>No sourced files found.</div>
      </div>
    );
  }

  return (
    <div className={className} style={containerStyle}>
      <ul style={listStyle}>
        {paths.map((p, idx) => (
          <li key={p + idx} title={p}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 8,
                padding: '6px 8px',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                background: 'linear-gradient(180deg, rgba(255,255,255,0.02), rgba(0,0,0,0.05))',
                transition: 'background 0.15s ease, border-color 0.15s ease',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.background = '#111319';
                (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--focus)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.background = 'linear-gradient(180deg, rgba(255,255,255,0.02), rgba(0,0,0,0.05))';
                (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border)';
              }}
            >
              <span style={{
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                userSelect: 'text',
              }}>
                {filename(p)}
              </span>
              <button
                className="btn btn--ghost"
                onClick={() => onSelect && onSelect(p)}
                style={{ padding: '6px 10px' }}
              >
                Edit
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
