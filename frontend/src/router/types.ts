import { ReactNode, ComponentType } from 'react';
import { Location, To } from 'react-router-dom';

export type RouterMode = 'hash' | 'browser' | 'memory';

export type GuardContext = {
    from?: Location | null;
    to: Location;
};

export type GuardResult = boolean | Promise<boolean>;
export type GuardFn = (ctx: GuardContext) => GuardResult;

export type LayoutComponent = ComponentType<{ children: ReactNode }>;

export type RouteMeta = Record<string, any>;

export type RouteDefinition = {
    path: string;
    element?: ReactNode;
    // Optional redirection
    redirectTo?: To;
    // Optional layout that wraps this route and its children
    layout?: LayoutComponent;
    // Route level guards
    guards?: GuardFn[];
    // Arbitrary metadata associated with route
    meta?: RouteMeta;
    // Nested routes
    children?: RouteDefinition[];
    // Lazy element loader
    lazy?: () => Promise<{ default: ComponentType<any> }>;
};

export type RouterHooks = {
    // Called before navigation is considered confirmed; return false to cancel.
    beforeEach?: (ctx: GuardContext) => GuardResult;
    // Called after navigation happens.
    afterEach?: (ctx: GuardContext) => void | Promise<void>;
};

export type AppRouterProps = RouterHooks & {
    mode?: RouterMode;
    basename?: string;
    routes: RouteDefinition[];
    notFound?: ReactNode;
    // Fallback element while lazy components load
    loadingFallback?: ReactNode;
    // What to render if any guard denies access
    deniedFallback?: ReactNode;
};
