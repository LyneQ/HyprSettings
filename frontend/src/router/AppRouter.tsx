import React, { Suspense, useEffect, useMemo, useRef } from 'react';
import {
    BrowserRouter,
    HashRouter,
    MemoryRouter,
    Navigate,
    Route,
    Routes,
    useLocation,
    matchRoutes,
} from 'react-router-dom';
import type { AppRouterProps, GuardFn, GuardContext, RouteDefinition, RouterMode } from './types';

function useNavigationHooks(beforeEach?: AppRouterProps['beforeEach'], afterEach?: AppRouterProps['afterEach']) {
    const location = useLocation();
    const prev = useRef<typeof location | null>(null);

    useEffect(() => {
        const ctx: GuardContext = { from: prev.current, to: location };
        let cancelled = false;

        const run = async () => {
            if (beforeEach) {
                const ok = await beforeEach(ctx);
                if (ok === false) {
                    cancelled = true;
                    return;
                }
            }
            if (afterEach) {
                await afterEach(ctx);
            }
        };

        run();
        prev.current = location;

        return () => {
            // noop; capture latest prev
        };
    }, [location, beforeEach, afterEach]);
}

function Guarded({
    guards,
    deniedFallback,
    element,
}: {
    guards?: GuardFn[];
    deniedFallback?: React.ReactNode;
    element: React.ReactNode;
}) {
    const location = useLocation();
    const [allowed, setAllowed] = React.useState<boolean | null>(guards && guards.length > 0 ? null : true);

    useEffect(() => {
        let mounted = true;
        const run = async () => {
            if (!guards || guards.length === 0) {
                setAllowed(true);
                return;
            }
            for (const g of guards) {
                const ok = await g({ from: null, to: location });
                if (!ok) {
                    if (mounted) setAllowed(false);
                    return;
                }
            }
            if (mounted) setAllowed(true);
        };
        run();
        return () => {
            mounted = false;
        };
    }, [location, guards]);

    if (allowed === null) return <>{deniedFallback ?? null}</>;
    if (allowed === false) return <>{deniedFallback ?? <div>Access denied</div>}</>;
    return <>{element}</>;
}

function wrapWithLayout(element: React.ReactNode, Layout?: React.ComponentType<{ children: React.ReactNode }>) {
    if (!Layout) return element;
    return <Layout>{element}</Layout>;
}

function buildRouteElements(
    defs: RouteDefinition[],
    deniedFallback?: React.ReactNode,
    loadingFallback?: React.ReactNode
): React.ReactNode {
    return defs.map((def, idx) => {
        const key = (def.path ?? '') + '::' + idx;

        let element: React.ReactNode = def.element;

        if (def.redirectTo !== undefined) {
            element = <Navigate to={def.redirectTo} replace />;
        } else if (def.lazy) {
            const LazyComp = React.lazy(def.lazy);
            element = (
                <Suspense fallback={loadingFallback ?? <div>Loading…</div>}>
                    <LazyComp />
                </Suspense>
            );
        }

        // Guards wrap the element
        element = <Guarded guards={def.guards} deniedFallback={deniedFallback} element={element ?? <div />} />;

        // Layout wraps the guarded element
        element = wrapWithLayout(element, def.layout);

        return (
            <Route key={key} path={def.path} element={element}>
                {def.children ? buildRouteElements(def.children, deniedFallback, loadingFallback) : null}
            </Route>
        );
    });
}

export function RouterRoot({
    mode = 'hash',
    basename,
    routes,
    notFound,
    loadingFallback,
    deniedFallback,
    beforeEach,
    afterEach,
}: AppRouterProps) {
    const RouterImpl = useMemo(() => {
        switch (mode as RouterMode) {
            case 'browser':
                return BrowserRouter;
            case 'memory':
                return MemoryRouter;
            case 'hash':
            default:
                return HashRouter;
        }
    }, [mode]);

    const Elements = (
        <Routes>
            {buildRouteElements(routes, deniedFallback, loadingFallback)}
            {notFound ? <Route path="*" element={notFound} /> : null}
        </Routes>
    );

    // Hook into navigation changes
    const Hooks = () => {
        useNavigationHooks(beforeEach, afterEach);
        return null;
    };

    return (
        <RouterImpl basename={basename}>
            <Hooks />
            {Elements}
        </RouterImpl>
    );
}

export function useRouteMeta(routes: RouteDefinition[]): Record<string, any> | undefined {
    const location = useLocation();
    const matches = matchRoutes(
        routes.map((r) => toReactRouterObject(r)),
        location
    );
    // Return meta of the deepest match
    return matches?.[matches.length - 1]?.route?.meta as any;
}

function toReactRouterObject(def: RouteDefinition): any {
    return {
        path: def.path,
        element: def.element,
        children: def.children?.map(toReactRouterObject),
        meta: def.meta,
    };
}

export default RouterRoot;
