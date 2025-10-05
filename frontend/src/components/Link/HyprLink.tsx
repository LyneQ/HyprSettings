import React from 'react';
import { Link } from 'react-router-dom';
import * as Icons from 'lucide-react';
import './HyprLink.scss';

export type LucideIconName = keyof typeof Icons;

export interface HyprLinkProps extends React.HTMLAttributes<HTMLAnchorElement> {
    to: string;
    icon?: LucideIconName | null;
    children?: React.ReactNode;
    label?: string;
    iconSize?: number;
    external?: boolean; // override auto-detection when provided
    underline?: boolean;
    className?: string;
}

function isExternalHref(href: string): boolean {
    // Consider absolute protocols and protocol-relative URLs as external
    if (!href) return false;
    const lower = href.toLowerCase();
    if (lower.startsWith('http://') || lower.startsWith('https://')) return true;
    if (lower.startsWith('mailto:') || lower.startsWith('tel:')) return true;
    if (/^[a-z][a-z0-9+.-]*:\/\//i.test(href)) return true; // any scheme://
    return false;
}

export default function HyprLink({
    to,
    icon,
    children,
    label,
    iconSize = 16,
    external,
    underline = false,
    className,
    ...rest
}: HyprLinkProps) {
    const actuallyExternal = external ?? isExternalHref(to);

    // Choose icon: use ExternalLink for external targets, otherwise the requested icon
    const IconComp: React.ComponentType<any> | undefined = (() => {
        if (actuallyExternal) return (Icons as any)['ExternalLink'] as any;
        if (!icon) return undefined;
        const found = (Icons as any)[icon as string];
        return found ? (found as any) : undefined;
    })();

    const content = (
        <span className="hypr-link__content">
            {IconComp ? <IconComp size={iconSize} aria-hidden focusable={false} /> : null}
            <span className="hypr-link__label">{children ?? label}</span>
        </span>
    );

    const commonProps = {
        className: ['hypr-link', underline ? 'hypr-link--underline' : '', className].filter(Boolean).join(' '),
        ...rest,
    } as const;

    if (actuallyExternal) {
        return (
            <a href={to} target="_blank" rel="noopener noreferrer" {...commonProps}>
                {content}
            </a>
        );
    }

    // Internal link
    return (
        <Link to={to} {...(commonProps as any)}>
            {content}
        </Link>
    );
}
