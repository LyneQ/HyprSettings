import React from 'react';
import './style.css';

export default function DebugSettings() {
    return (
        <div className="page page--settings-debug">
            <h1>Debug</h1>
            <p>Developer tools and diagnostics. Available only in development mode.</p>
            {!import.meta.env.DEV && (
                <div className="debug-warning">This section is only available in development builds.</div>
            )}
        </div>
    );
}
