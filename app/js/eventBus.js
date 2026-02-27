/**
 * Event Bus - Pub/sub event system for decoupled communication
 * Quest Mini - Farcaster Mini-App
 */

(function() {
    'use strict';

    /**
     * Event Bus Class
     */
    class EventBusClass {
        constructor() {
            this.events = new Map();
            this.onceEvents = new Map();
            this.history = [];
            this.maxHistory = 100;
            this.debug = false;
        }

        /**
         * Subscribe to an event
         */
        on(event, callback, options = {}) {
            const { priority = 0, context = null } = options;

            if (typeof callback !== 'function') {
                console.error('EventBus: callback must be a function');
                return () => {};
            }

            if (!this.events.has(event)) {
                this.events.set(event, []);
            }

            const handler = { callback, priority, context };
            const handlers = this.events.get(event);
            
            // Insert in priority order (higher priority first)
            const insertIndex = handlers.findIndex(h => h.priority < priority);
            if (insertIndex === -1) {
                handlers.push(handler);
            } else {
                handlers.splice(insertIndex, 0, handler);
            }

            if (this.debug) {
                console.log(`EventBus: Subscribed to "${event}"`);
            }

            // Return unsubscribe function
            return () => this.off(event, callback);
        }

        /**
         * Subscribe to an event once
         */
        once(event, callback, options = {}) {
            const wrappedCallback = (...args) => {
                this.off(event, wrappedCallback);
                callback.apply(options.context, args);
            };

            return this.on(event, wrappedCallback, options);
        }

        /**
         * Unsubscribe from an event
         */
        off(event, callback) {
            if (!callback) {
                // Remove all listeners for event
                this.events.delete(event);
                return;
            }

            const handlers = this.events.get(event);
            if (handlers) {
                const index = handlers.findIndex(h => h.callback === callback);
                if (index !== -1) {
                    handlers.splice(index, 1);
                    if (handlers.length === 0) {
                        this.events.delete(event);
                    }
                }
            }

            if (this.debug) {
                console.log(`EventBus: Unsubscribed from "${event}"`);
            }
        }

        /**
         * Emit an event
         */
        emit(event, ...args) {
            if (this.debug) {
                console.log(`EventBus: Emitting "${event}"`, args);
            }

            // Record in history
            this.recordHistory(event, args);

            const handlers = this.events.get(event);
            if (!handlers || handlers.length === 0) {
                return false;
            }

            // Execute handlers
            for (const handler of handlers) {
                try {
                    handler.callback.apply(handler.context, args);
                } catch (error) {
                    console.error(`EventBus: Error in handler for "${event}"`, error);
                }
            }

            return true;
        }

        /**
         * Emit event asynchronously
         */
        async emitAsync(event, ...args) {
            if (this.debug) {
                console.log(`EventBus: Emitting async "${event}"`, args);
            }

            this.recordHistory(event, args);

            const handlers = this.events.get(event);
            if (!handlers || handlers.length === 0) {
                return [];
            }

            const results = [];
            for (const handler of handlers) {
                try {
                    const result = await handler.callback.apply(handler.context, args);
                    results.push(result);
                } catch (error) {
                    console.error(`EventBus: Async error in handler for "${event}"`, error);
                    results.push(error);
                }
            }

            return results;
        }

        /**
         * Emit to all matching patterns
         */
        emitWildcard(pattern, ...args) {
            const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
            let emitted = false;

            for (const event of this.events.keys()) {
                if (regex.test(event)) {
                    this.emit(event, ...args);
                    emitted = true;
                }
            }

            return emitted;
        }

        /**
         * Check if event has subscribers
         */
        hasListeners(event) {
            const handlers = this.events.get(event);
            return handlers && handlers.length > 0;
        }

        /**
         * Get listener count for event
         */
        listenerCount(event) {
            const handlers = this.events.get(event);
            return handlers ? handlers.length : 0;
        }

        /**
         * Get all event names
         */
        eventNames() {
            return Array.from(this.events.keys());
        }

        /**
         * Record event in history
         */
        recordHistory(event, args) {
            this.history.push({
                event,
                args,
                timestamp: Date.now()
            });

            // Trim history
            if (this.history.length > this.maxHistory) {
                this.history.shift();
            }
        }

        /**
         * Get event history
         */
        getHistory(filter) {
            if (!filter) return [...this.history];

            if (typeof filter === 'string') {
                return this.history.filter(h => h.event === filter);
            }

            if (filter instanceof RegExp) {
                return this.history.filter(h => filter.test(h.event));
            }

            return this.history.filter(filter);
        }

        /**
         * Clear history
         */
        clearHistory() {
            this.history = [];
        }

        /**
         * Remove all listeners
         */
        clear() {
            this.events.clear();
            if (this.debug) {
                console.log('EventBus: Cleared all listeners');
            }
        }

        /**
         * Enable/disable debug mode
         */
        setDebug(enabled) {
            this.debug = enabled;
        }

        /**
         * Create a namespaced event bus
         */
        namespace(prefix) {
            const self = this;
            return {
                on: (event, callback, options) => self.on(`${prefix}:${event}`, callback, options),
                once: (event, callback, options) => self.once(`${prefix}:${event}`, callback, options),
                off: (event, callback) => self.off(`${prefix}:${event}`, callback),
                emit: (event, ...args) => self.emit(`${prefix}:${event}`, ...args),
                emitAsync: (event, ...args) => self.emitAsync(`${prefix}:${event}`, ...args)
            };
        }

        /**
         * Create a channel for request/response pattern
         */
        createChannel(name) {
            const self = this;
            const requestEvent = `${name}:request`;
            const responseEvent = `${name}:response`;

            return {
                /**
                 * Send request and wait for response
                 */
                request: (data, timeout = 5000) => {
                    return new Promise((resolve, reject) => {
                        const id = Date.now().toString(36) + Math.random().toString(36).slice(2);
                        const timer = setTimeout(() => {
                            self.off(responseEvent, handler);
                            reject(new Error('Request timeout'));
                        }, timeout);

                        const handler = (response) => {
                            if (response.id === id) {
                                clearTimeout(timer);
                                self.off(responseEvent, handler);
                                if (response.error) {
                                    reject(new Error(response.error));
                                } else {
                                    resolve(response.data);
                                }
                            }
                        };

                        self.on(responseEvent, handler);
                        self.emit(requestEvent, { id, data });
                    });
                },

                /**
                 * Listen for requests and send responses
                 */
                respond: (handler) => {
                    return self.on(requestEvent, async (request) => {
                        try {
                            const result = await handler(request.data);
                            self.emit(responseEvent, { id: request.id, data: result });
                        } catch (error) {
                            self.emit(responseEvent, { id: request.id, error: error.message });
                        }
                    });
                }
            };
        }
    }

    // Create singleton instance
    const eventBus = new EventBusClass();

    // Predefined event types for Quest Mini
    const Events = {
        // Wallet events
        WALLET_CONNECTED: 'wallet:connected',
        WALLET_DISCONNECTED: 'wallet:disconnected',
        WALLET_CHAIN_CHANGED: 'wallet:chainChanged',
        WALLET_ACCOUNT_CHANGED: 'wallet:accountChanged',

        // Quest events
        QUEST_STARTED: 'quest:started',
        QUEST_COMPLETED: 'quest:completed',
        QUEST_FAILED: 'quest:failed',
        QUEST_PROGRESS: 'quest:progress',
        QUEST_RESET: 'quest:reset',

        // Token events
        TOKEN_CLAIMED: 'token:claimed',
        TOKEN_BALANCE_UPDATED: 'token:balanceUpdated',

        // UI events
        THEME_CHANGED: 'ui:themeChanged',
        MODAL_OPENED: 'ui:modalOpened',
        MODAL_CLOSED: 'ui:modalClosed',
        TOAST_SHOWN: 'ui:toastShown',
        LOADING_STARTED: 'ui:loadingStarted',
        LOADING_ENDED: 'ui:loadingEnded',

        // App events
        APP_READY: 'app:ready',
        APP_ERROR: 'app:error',
        APP_ONLINE: 'app:online',
        APP_OFFLINE: 'app:offline',

        // User events
        USER_LOGGED_IN: 'user:loggedIn',
        USER_LOGGED_OUT: 'user:loggedOut',
        USER_PROFILE_UPDATED: 'user:profileUpdated',

        // Transaction events
        TX_PENDING: 'tx:pending',
        TX_CONFIRMED: 'tx:confirmed',
        TX_FAILED: 'tx:failed'
    };

    // Export API
    window.EventBus = eventBus;
    window.EventBus.Events = Events;
    window.EventBus.create = () => new EventBusClass();

    console.log('📡 EventBus module initialized');
})();
