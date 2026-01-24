/**
 * Quest Mini - Analytics Module
 * Privacy-focused analytics for tracking user interactions
 */

const QuestAnalytics = (function() {
    'use strict';

    // Analytics configuration
    const config = {
        enabled: true,
        debug: false,
        sessionTimeout: 30 * 60 * 1000, // 30 minutes
        batchSize: 10,
        flushInterval: 30000 // 30 seconds
    };

    // Session data
    let sessionId = null;
    let sessionStart = null;
    let lastActivity = null;

    // Event queue
    const eventQueue = [];

    /**
     * Initialize analytics
     */
    function init() {
        if (!config.enabled) return;

        sessionId = generateSessionId();
        sessionStart = Date.now();
        lastActivity = sessionStart;

        // Track session start
        track('session_start', {
            referrer: document.referrer,
            userAgent: navigator.userAgent,
            screenWidth: window.screen.width,
            screenHeight: window.screen.height,
            language: navigator.language
        });

        // Set up auto-flush
        setInterval(flush, config.flushInterval);

        // Track page visibility
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                track('page_hidden');
            } else {
                track('page_visible');
                checkSessionExpiry();
            }
        });

        // Track before unload
        window.addEventListener('beforeunload', () => {
            track('session_end', {
                duration: Date.now() - sessionStart
            });
            flush(true);
        });

        log('Analytics initialized', { sessionId });
    }

    /**
     * Generate unique session ID
     */
    function generateSessionId() {
        return 'session_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Check if session has expired
     */
    function checkSessionExpiry() {
        const now = Date.now();
        if (now - lastActivity > config.sessionTimeout) {
            // Start new session
            sessionId = generateSessionId();
            sessionStart = now;
            track('session_start', { resumed: true });
        }
        lastActivity = now;
    }

    /**
     * Track an event
     * @param {string} eventName - Event name
     * @param {Object} properties - Event properties
     */
    function track(eventName, properties = {}) {
        if (!config.enabled) return;

        checkSessionExpiry();

        const event = {
            event: eventName,
            timestamp: Date.now(),
            sessionId,
            properties: sanitizeProperties(properties)
        };

        eventQueue.push(event);
        log('Event tracked:', event);

        // Auto-flush if queue is full
        if (eventQueue.length >= config.batchSize) {
            flush();
        }
    }

    /**
     * Track wallet connection
     * @param {string} address - Wallet address (will be hashed)
     */
    function trackWalletConnect(address) {
        track('wallet_connected', {
            addressHash: hashAddress(address),
            provider: detectProvider()
        });
    }

    /**
     * Track wallet disconnection
     */
    function trackWalletDisconnect() {
        track('wallet_disconnected');
    }

    /**
     * Track quest completion
     * @param {number} questType - Quest type ID
     * @param {string} reward - Reward amount
     */
    function trackQuestComplete(questType, reward) {
        track('quest_completed', {
            questType,
            reward,
            timestamp: Date.now()
        });
    }

    /**
     * Track reward claim
     * @param {string} amount - Claimed amount
     * @param {string} txHash - Transaction hash
     */
    function trackRewardClaim(amount, txHash) {
        track('reward_claimed', {
            amount,
            txHashPrefix: txHash ? txHash.substring(0, 10) : null
        });
    }

    /**
     * Track booster activation
     * @param {number} tier - Booster tier
     */
    function trackBoosterActivate(tier) {
        track('booster_activated', { tier });
    }

    /**
     * Track error occurrence
     * @param {string} errorType - Error type
     * @param {string} message - Error message
     * @param {string} context - Where the error occurred
     */
    function trackError(errorType, message, context) {
        track('error', {
            errorType,
            message: message.substring(0, 100), // Limit message length
            context
        });
    }

    /**
     * Track transaction submission
     * @param {string} action - Action type
     * @param {string} status - Transaction status
     */
    function trackTransaction(action, status) {
        track('transaction', {
            action,
            status
        });
    }

    /**
     * Hash wallet address for privacy
     * @param {string} address - Wallet address
     * @returns {string} Hashed address prefix
     */
    function hashAddress(address) {
        if (!address) return null;
        // Simple hash - just use first and last characters with length
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    }

    /**
     * Detect wallet provider
     * @returns {string} Provider name
     */
    function detectProvider() {
        if (typeof window.ethereum === 'undefined') return 'none';
        if (window.ethereum.isMetaMask) return 'metamask';
        if (window.ethereum.isCoinbaseWallet) return 'coinbase';
        if (window.ethereum.isWalletConnect) return 'walletconnect';
        if (window.ethereum.isBraveWallet) return 'brave';
        return 'unknown';
    }

    /**
     * Sanitize properties to remove PII
     * @param {Object} props - Properties object
     * @returns {Object} Sanitized properties
     */
    function sanitizeProperties(props) {
        const sanitized = { ...props };
        
        // Remove or hash sensitive fields
        const sensitiveFields = ['address', 'email', 'privateKey', 'password'];
        sensitiveFields.forEach(field => {
            if (sanitized[field]) {
                delete sanitized[field];
            }
        });

        return sanitized;
    }

    /**
     * Flush event queue
     * @param {boolean} sync - Whether to use synchronous request
     */
    function flush(sync = false) {
        if (eventQueue.length === 0) return;

        const events = eventQueue.splice(0, config.batchSize);
        
        // For now, just log to console in debug mode
        // In production, this would send to an analytics endpoint
        if (config.debug) {
            console.log('[Analytics] Flushing events:', events);
        }

        // Store in localStorage for persistence
        try {
            const stored = JSON.parse(localStorage.getItem('quest_analytics') || '[]');
            stored.push(...events);
            // Keep only last 100 events
            const trimmed = stored.slice(-100);
            localStorage.setItem('quest_analytics', JSON.stringify(trimmed));
        } catch (e) {
            // Storage full or unavailable
        }
    }

    /**
     * Get analytics summary
     * @returns {Object} Summary statistics
     */
    function getSummary() {
        const stored = JSON.parse(localStorage.getItem('quest_analytics') || '[]');
        
        const summary = {
            totalEvents: stored.length,
            eventTypes: {},
            sessions: new Set(),
            timeRange: {
                start: null,
                end: null
            }
        };

        stored.forEach(event => {
            // Count event types
            summary.eventTypes[event.event] = (summary.eventTypes[event.event] || 0) + 1;
            
            // Track sessions
            if (event.sessionId) {
                summary.sessions.add(event.sessionId);
            }

            // Track time range
            if (!summary.timeRange.start || event.timestamp < summary.timeRange.start) {
                summary.timeRange.start = event.timestamp;
            }
            if (!summary.timeRange.end || event.timestamp > summary.timeRange.end) {
                summary.timeRange.end = event.timestamp;
            }
        });

        summary.sessions = summary.sessions.size;
        return summary;
    }

    /**
     * Clear analytics data
     */
    function clear() {
        eventQueue.length = 0;
        localStorage.removeItem('quest_analytics');
    }

    /**
     * Enable or disable analytics
     * @param {boolean} enabled - Whether to enable analytics
     */
    function setEnabled(enabled) {
        config.enabled = enabled;
        if (!enabled) {
            clear();
        }
    }

    /**
     * Debug logging
     */
    function log(...args) {
        if (config.debug) {
            console.log('[Analytics]', ...args);
        }
    }

    // Public API
    return {
        init,
        track,
        trackWalletConnect,
        trackWalletDisconnect,
        trackQuestComplete,
        trackRewardClaim,
        trackBoosterActivate,
        trackError,
        trackTransaction,
        flush,
        getSummary,
        clear,
        setEnabled,
        get sessionId() { return sessionId; }
    };
})();

// Auto-initialize when DOM is ready
if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => QuestAnalytics.init());
    } else {
        QuestAnalytics.init();
    }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = QuestAnalytics;
}
