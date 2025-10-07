import React from 'react';
import './HyprEmbed.scss';

export type HyprEmbedStatus = 'info' | 'warning' | 'error' | 'success';

export interface HyprEmbedProps extends React.HTMLAttributes<HTMLDivElement> {
    status?: HyprEmbedStatus;
    src?: string;
    title?: string;
    width?: string | number;
    height?: string | number;
    allowFullScreen?: boolean;
    loading?: 'lazy' | 'eager';
    sandbox?: string;
    className?: string;
    children?: React.ReactNode;
}

export default function HyprEmbed({
    status,
    src,
    title = 'Embedded content',
    width = '100%',
    height = '400px',
    allowFullScreen = true,
    loading = 'lazy',
    sandbox,
    className,
    children,
    ...rest
}: HyprEmbedProps) {
    const containerStyle: React.CSSProperties = {
        width: typeof width === 'number' ? `${width}px` : width,
    };

    // Only set height for iframe embeds, not for content embeds
    if (src && !children) {
        containerStyle.height = typeof height === 'number' ? `${height}px` : height;
    }

    const classes = [
        'hypr-embed',
        status ? `hypr-embed--${status}` : '',
        src && !children ? 'hypr-embed--iframe' : 'hypr-embed--content',
        className
    ].filter(Boolean).join(' ');

    return (
        <div
            className={classes}
            style={containerStyle}
            {...rest}
        >
            {src && !children ? (
                <iframe
                    src={src}
                    title={title}
                    loading={loading}
                    allowFullScreen={allowFullScreen}
                    sandbox={sandbox}
                    className="hypr-embed__iframe"
                />
            ) : (
                <div className="hypr-embed__content">
                    {children}
                </div>
            )}
        </div>
    );
}
