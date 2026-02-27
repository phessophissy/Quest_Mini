/**
 * Router - Client-side SPA router
 * Quest Mini - Farcaster Mini-App
 */

(function() {
    'use strict';

    // Router state
    const state = {
        routes: new Map(),
        currentRoute: null,
        history: [],
        beforeHooks: [],
        afterHooks: [],
        notFoundHandler: null,
        basePath: '',
        useHash: true
    };

    /**
     * Initialize router
     */
    function init(options = {}) {
        state.basePath = options.basePath || '';
        state.useHash = options.useHash !== false;

        // Listen for navigation events
        if (state.useHash) {
            window.addEventListener('hashchange', handleNavigation);
        } else {
            window.addEventListener('popstate', handleNavigation);
        }

        // Handle link clicks
        document.addEventListener('click', handleLinkClick);

        // Initial route
        if (options.initialRoute !== false) {
            setTimeout(() => navigate(getCurrentPath()), 0);
        }

        console.log('🧭 Router initialized');
    }

    /**
     * Register a route
     */
    function register(path, handler, options = {}) {
        const route = {
            path,
            handler,
            pattern: pathToRegex(path),
            paramNames: extractParamNames(path),
            meta: options.meta || {},
            beforeEnter: options.beforeEnter || null
        };

        state.routes.set(path, route);
        return Router;
    }

    /**
     * Convert path to regex pattern
     */
    function pathToRegex(path) {
        const pattern = path
            .replace(/\//g, '\\/')
            .replace(/:([^/]+)/g, '([^/]+)')
            .replace(/\*/g, '.*');
        return new RegExp(`^${pattern}$`);
    }

    /**
     * Extract parameter names from path
     */
    function extractParamNames(path) {
        const matches = path.match(/:([^/]+)/g) || [];
        return matches.map(m => m.slice(1));
    }

    /**
     * Get current path
     */
    function getCurrentPath() {
        if (state.useHash) {
            const hash = window.location.hash.slice(1);
            return hash || '/';
        }
        return window.location.pathname.replace(state.basePath, '') || '/';
    }

    /**
     * Handle navigation events
     */
    function handleNavigation() {
        const path = getCurrentPath();
        resolve(path);
    }

    /**
     * Handle link clicks
     */
    function handleLinkClick(e) {
        const link = e.target.closest('a[data-route]');
        if (!link) return;

        e.preventDefault();
        const path = link.getAttribute('href') || link.dataset.route;
        navigate(path);
    }

    /**
     * Navigate to path
     */
    async function navigate(path, options = {}) {
        const { replace = false, data = null } = options;

        // Run before hooks
        for (const hook of state.beforeHooks) {
            const result = await hook(path, state.currentRoute);
            if (result === false) return false;
            if (typeof result === 'string') {
                path = result;
            }
        }

        // Update URL
        if (state.useHash) {
            if (replace) {
                window.history.replaceState(data, '', `#${path}`);
            } else {
                window.history.pushState(data, '', `#${path}`);
            }
        } else {
            const fullPath = state.basePath + path;
            if (replace) {
                window.history.replaceState(data, '', fullPath);
            } else {
                window.history.pushState(data, '', fullPath);
            }
        }

        // Resolve route
        await resolve(path, data);
        return true;
    }

    /**
     * Resolve path to route
     */
    async function resolve(path, data = null) {
        // Find matching route
        let matchedRoute = null;
        let params = {};

        for (const [, route] of state.routes) {
            const match = path.match(route.pattern);
            if (match) {
                matchedRoute = route;
                // Extract params
                route.paramNames.forEach((name, i) => {
                    params[name] = match[i + 1];
                });
                break;
            }
        }

        // Build route context
        const context = {
            path,
            params,
            query: parseQuery(),
            data,
            meta: matchedRoute?.meta || {}
        };

        // Route guard
        if (matchedRoute?.beforeEnter) {
            const result = await matchedRoute.beforeEnter(context);
            if (result === false) return;
            if (typeof result === 'string') {
                return navigate(result, { replace: true });
            }
        }

        // Update state
        const previousRoute = state.currentRoute;
        state.currentRoute = context;
        state.history.push(path);

        // Handle route
        if (matchedRoute) {
            await matchedRoute.handler(context, previousRoute);
        } else if (state.notFoundHandler) {
            await state.notFoundHandler(context);
        }

        // Run after hooks
        for (const hook of state.afterHooks) {
            await hook(context, previousRoute);
        }

        // Emit event
        window.dispatchEvent(new CustomEvent('route-change', {
            detail: { route: context, previous: previousRoute }
        }));
    }

    /**
     * Parse query string
     */
    function parseQuery() {
        const search = state.useHash
            ? window.location.hash.split('?')[1]
            : window.location.search.slice(1);

        if (!search) return {};

        const params = {};
        new URLSearchParams(search).forEach((value, key) => {
            if (params[key]) {
                if (!Array.isArray(params[key])) {
                    params[key] = [params[key]];
                }
                params[key].push(value);
            } else {
                params[key] = value;
            }
        });

        return params;
    }

    /**
     * Build query string
     */
    function buildQuery(params) {
        const parts = [];
        for (const [key, value] of Object.entries(params)) {
            if (Array.isArray(value)) {
                value.forEach(v => parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(v)}`));
            } else if (value !== null && value !== undefined) {
                parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
            }
        }
        return parts.length ? `?${parts.join('&')}` : '';
    }

    /**
     * Go back in history
     */
    function back() {
        window.history.back();
    }

    /**
     * Go forward in history
     */
    function forward() {
        window.history.forward();
    }

    /**
     * Go to specific history index
     */
    function go(delta) {
        window.history.go(delta);
    }

    /**
     * Add before navigation hook
     */
    function beforeEach(hook) {
        state.beforeHooks.push(hook);
        return () => {
            const index = state.beforeHooks.indexOf(hook);
            if (index > -1) state.beforeHooks.splice(index, 1);
        };
    }

    /**
     * Add after navigation hook
     */
    function afterEach(hook) {
        state.afterHooks.push(hook);
        return () => {
            const index = state.afterHooks.indexOf(hook);
            if (index > -1) state.afterHooks.splice(index, 1);
        };
    }

    /**
     * Set not found handler
     */
    function notFound(handler) {
        state.notFoundHandler = handler;
        return Router;
    }

    /**
     * Get current route
     */
    function getCurrentRoute() {
        return state.currentRoute;
    }

    /**
     * Check if path matches current route
     */
    function isActive(path) {
        if (!state.currentRoute) return false;
        return state.currentRoute.path === path ||
               state.currentRoute.path.startsWith(path + '/');
    }

    /**
     * Generate path with params
     */
    function generatePath(path, params = {}) {
        let result = path;
        for (const [key, value] of Object.entries(params)) {
            result = result.replace(`:${key}`, String(value));
        }
        return result;
    }

    /**
     * Create route links
     */
    function createLink(path, text, options = {}) {
        const link = document.createElement('a');
        link.href = state.useHash ? `#${path}` : state.basePath + path;
        link.dataset.route = path;
        link.textContent = text;
        
        if (options.class) link.className = options.class;
        if (options.activeClass && isActive(path)) {
            link.classList.add(options.activeClass);
        }

        return link;
    }

    /**
     * View manager - render views into container
     */
    const views = {
        container: null,
        cache: new Map(),
        current: null,

        setContainer(el) {
            this.container = typeof el === 'string' 
                ? document.querySelector(el) 
                : el;
        },

        async render(viewId, content, options = {}) {
            if (!this.container) return;

            const { 
                transition = 'fade',
                cache = false 
            } = options;

            // Get content
            let html = content;
            if (typeof content === 'function') {
                html = await content();
            }

            // Cache if needed
            if (cache) {
                this.cache.set(viewId, html);
            }

            // Animate out current
            if (this.current && transition !== 'none') {
                this.container.style.opacity = '0';
                await new Promise(r => setTimeout(r, 150));
            }

            // Set new content
            this.container.innerHTML = html;
            this.current = viewId;

            // Animate in
            if (transition !== 'none') {
                this.container.style.transition = 'opacity 0.15s ease';
                this.container.style.opacity = '1';
            }
        },

        getCached(viewId) {
            return this.cache.get(viewId);
        },

        clearCache() {
            this.cache.clear();
        }
    };

    // Router API
    const Router = {
        init,
        register,
        navigate,
        back,
        forward,
        go,
        beforeEach,
        afterEach,
        notFound,
        getCurrentRoute,
        getCurrentPath,
        isActive,
        generatePath,
        createLink,
        parseQuery,
        buildQuery,
        views,

        // Shortcuts
        route: register,
        push: navigate,
        replace: (path, data) => navigate(path, { replace: true, data })
    };

    // Export
    window.Router = Router;

    console.log('🧭 Router module loaded');
})();
