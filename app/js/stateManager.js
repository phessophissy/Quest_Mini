/**
 * State Manager - Simple reactive state management
 * Quest Mini - Farcaster Mini-App
 */

(function() {
    'use strict';

    /**
     * Create a reactive state store
     */
    function createStore(initialState = {}, options = {}) {
        const {
            persist = false,
            storageKey = 'quest_state',
            middleware = []
        } = options;

        // Internal state
        let state = { ...initialState };
        const subscribers = new Map();
        const watchers = new Map();
        let subscriberId = 0;

        // Load persisted state
        if (persist) {
            try {
                const saved = localStorage.getItem(storageKey);
                if (saved) {
                    state = { ...state, ...JSON.parse(saved) };
                }
            } catch (e) {
                console.warn('Failed to load persisted state:', e);
            }
        }

        /**
         * Get current state or specific property
         */
        function getState(path) {
            if (!path) return { ...state };
            return getNestedValue(state, path);
        }

        /**
         * Set state with optional merge
         */
        function setState(updates, options = {}) {
            const { merge = true, silent = false } = options;
            const prevState = { ...state };

            // Apply middleware
            let processedUpdates = updates;
            for (const fn of middleware) {
                processedUpdates = fn(processedUpdates, prevState) || processedUpdates;
            }

            // Update state
            if (merge) {
                state = deepMerge(state, processedUpdates);
            } else {
                state = { ...processedUpdates };
            }

            // Persist
            if (persist) {
                try {
                    localStorage.setItem(storageKey, JSON.stringify(state));
                } catch (e) {
                    console.warn('Failed to persist state:', e);
                }
            }

            // Notify subscribers
            if (!silent) {
                notifySubscribers(prevState);
                notifyWatchers(prevState);
            }

            return state;
        }

        /**
         * Update specific path in state
         */
        function setPath(path, value, options = {}) {
            const keys = path.split('.');
            const updates = {};
            let current = updates;

            for (let i = 0; i < keys.length - 1; i++) {
                current[keys[i]] = {};
                current = current[keys[i]];
            }
            current[keys[keys.length - 1]] = value;

            return setState(updates, options);
        }

        /**
         * Subscribe to all state changes
         */
        function subscribe(callback) {
            const id = ++subscriberId;
            subscribers.set(id, callback);

            // Return unsubscribe function
            return () => subscribers.delete(id);
        }

        /**
         * Watch specific state path
         */
        function watch(path, callback) {
            const id = ++subscriberId;
            watchers.set(id, { path, callback, prevValue: getNestedValue(state, path) });

            // Return unwatch function
            return () => watchers.delete(id);
        }

        /**
         * Notify all subscribers
         */
        function notifySubscribers(prevState) {
            for (const callback of subscribers.values()) {
                try {
                    callback(state, prevState);
                } catch (e) {
                    console.error('Error in state subscriber:', e);
                }
            }
        }

        /**
         * Notify watchers if their watched paths changed
         */
        function notifyWatchers(prevState) {
            for (const watcher of watchers.values()) {
                const newValue = getNestedValue(state, watcher.path);
                const oldValue = watcher.prevValue;

                if (!deepEqual(newValue, oldValue)) {
                    watcher.prevValue = newValue;
                    try {
                        watcher.callback(newValue, oldValue);
                    } catch (e) {
                        console.error('Error in state watcher:', e);
                    }
                }
            }
        }

        /**
         * Reset state to initial
         */
        function reset() {
            setState(initialState, { merge: false });
        }

        /**
         * Create a selector
         */
        function select(selectorFn) {
            return () => selectorFn(state);
        }

        /**
         * Create an action creator
         */
        function createAction(actionFn) {
            return (...args) => {
                const updates = actionFn(state, ...args);
                if (updates) {
                    setState(updates);
                }
            };
        }

        /**
         * Batch multiple updates
         */
        function batch(updateFn) {
            const updates = updateFn(state);
            if (updates) {
                setState(updates);
            }
        }

        /**
         * Get state snapshot
         */
        function snapshot() {
            return JSON.parse(JSON.stringify(state));
        }

        return {
            getState,
            setState,
            setPath,
            subscribe,
            watch,
            reset,
            select,
            createAction,
            batch,
            snapshot
        };
    }

    /**
     * Deep merge objects
     */
    function deepMerge(target, source) {
        const result = { ...target };

        for (const key of Object.keys(source)) {
            if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                result[key] = deepMerge(target[key] || {}, source[key]);
            } else {
                result[key] = source[key];
            }
        }

        return result;
    }

    /**
     * Get nested value from object using dot notation
     */
    function getNestedValue(obj, path) {
        return path.split('.').reduce((current, key) => 
            current && current[key] !== undefined ? current[key] : undefined, 
            obj
        );
    }

    /**
     * Deep equality check
     */
    function deepEqual(a, b) {
        if (a === b) return true;
        if (a == null || b == null) return false;
        if (typeof a !== 'object' || typeof b !== 'object') return false;

        const keysA = Object.keys(a);
        const keysB = Object.keys(b);

        if (keysA.length !== keysB.length) return false;

        for (const key of keysA) {
            if (!keysB.includes(key)) return false;
            if (!deepEqual(a[key], b[key])) return false;
        }

        return true;
    }

    /**
     * Create computed state
     */
    function computed(store, computeFn) {
        let cachedValue = null;
        let cachedState = null;

        return () => {
            const currentState = store.getState();
            
            if (currentState !== cachedState) {
                cachedState = currentState;
                cachedValue = computeFn(currentState);
            }

            return cachedValue;
        };
    }

    /**
     * Create a slice of state
     */
    function createSlice(store, slicePath) {
        return {
            getState: () => store.getState(slicePath),
            setState: (updates) => store.setPath(slicePath, 
                deepMerge(store.getState(slicePath) || {}, updates)
            ),
            watch: (path, callback) => {
                const fullPath = path ? `${slicePath}.${path}` : slicePath;
                return store.watch(fullPath, callback);
            }
        };
    }

    // Default Quest Mini state
    const defaultState = {
        user: {
            address: null,
            isConnected: false,
            balance: '0'
        },
        quests: {
            completed: [],
            active: null,
            daily: [],
            streak: 0
        },
        ui: {
            theme: 'dark',
            loading: false,
            modal: null,
            error: null
        },
        settings: {
            notifications: true,
            sounds: true,
            haptics: true
        }
    };

    // Create main app store
    const appStore = createStore(defaultState, {
        persist: true,
        storageKey: 'quest_mini_state'
    });

    // Export API
    window.StateManager = {
        createStore,
        computed,
        createSlice,
        deepMerge,
        deepEqual,
        
        // Main app store
        store: appStore,
        getState: appStore.getState,
        setState: appStore.setState,
        setPath: appStore.setPath,
        subscribe: appStore.subscribe,
        watch: appStore.watch,
        reset: appStore.reset
    };

    console.log('📊 StateManager module initialized');
})();
