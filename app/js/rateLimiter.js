/**
 * Quest Mini - Rate Limiter Utility
 * Prevents excessive API calls and protects against abuse
 */

class RateLimiter {
    constructor(options = {}) {
        this.maxRequests = options.maxRequests || 10;
        this.windowMs = options.windowMs || 60000; // 1 minute
        this.requests = new Map();
        this.blockedUntil = new Map();
        this.blockDuration = options.blockDuration || 300000; // 5 minutes
    }

    /**
     * Check if action is allowed for the given key
     * @param {string} key - Identifier (e.g., address, action type)
     * @returns {Object} { allowed: boolean, remaining: number, resetAt: number }
     */
    check(key) {
        const now = Date.now();
        
        // Check if blocked
        if (this.blockedUntil.has(key)) {
            const blockedTime = this.blockedUntil.get(key);
            if (now < blockedTime) {
                return {
                    allowed: false,
                    remaining: 0,
                    resetAt: blockedTime,
                    blocked: true
                };
            }
            this.blockedUntil.delete(key);
        }

        // Get or initialize request tracking
        if (!this.requests.has(key)) {
            this.requests.set(key, []);
        }

        const timestamps = this.requests.get(key);
        const windowStart = now - this.windowMs;

        // Remove expired timestamps
        const validTimestamps = timestamps.filter(ts => ts > windowStart);
        this.requests.set(key, validTimestamps);

        const remaining = this.maxRequests - validTimestamps.length;
        const resetAt = validTimestamps.length > 0 
            ? validTimestamps[0] + this.windowMs 
            : now + this.windowMs;

        return {
            allowed: remaining > 0,
            remaining: Math.max(0, remaining),
            resetAt,
            blocked: false
        };
    }

    /**
     * Record a request for the given key
     * @param {string} key - Identifier
     * @returns {Object} Result of the check after recording
     */
    record(key) {
        const status = this.check(key);
        
        if (!status.allowed) {
            return status;
        }

        const timestamps = this.requests.get(key) || [];
        timestamps.push(Date.now());
        this.requests.set(key, timestamps);

        return {
            ...status,
            remaining: status.remaining - 1
        };
    }

    /**
     * Block a key for the block duration
     * @param {string} key - Identifier to block
     * @param {number} [duration] - Optional custom duration in ms
     */
    block(key, duration = this.blockDuration) {
        this.blockedUntil.set(key, Date.now() + duration);
    }

    /**
     * Unblock a key
     * @param {string} key - Identifier to unblock
     */
    unblock(key) {
        this.blockedUntil.delete(key);
        this.requests.delete(key);
    }

    /**
     * Check if a key is currently blocked
     * @param {string} key - Identifier
     * @returns {boolean}
     */
    isBlocked(key) {
        if (!this.blockedUntil.has(key)) {
            return false;
        }
        if (Date.now() >= this.blockedUntil.get(key)) {
            this.blockedUntil.delete(key);
            return false;
        }
        return true;
    }

    /**
     * Reset rate limiting for a key
     * @param {string} key - Identifier
     */
    reset(key) {
        this.requests.delete(key);
        this.blockedUntil.delete(key);
    }

    /**
     * Clear all rate limiting data
     */
    clear() {
        this.requests.clear();
        this.blockedUntil.clear();
    }

    /**
     * Get stats for a key
     * @param {string} key - Identifier
     * @returns {Object} Stats object
     */
    getStats(key) {
        const status = this.check(key);
        const timestamps = this.requests.get(key) || [];
        
        return {
            ...status,
            requestCount: timestamps.length,
            maxRequests: this.maxRequests,
            windowMs: this.windowMs
        };
    }
}

/**
 * Create a rate limiter for transaction submissions
 */
const txRateLimiter = new RateLimiter({
    maxRequests: 5,
    windowMs: 60000, // 5 tx per minute
    blockDuration: 300000 // Block for 5 minutes if exceeded
});

/**
 * Create a rate limiter for API calls
 */
const apiRateLimiter = new RateLimiter({
    maxRequests: 30,
    windowMs: 60000, // 30 requests per minute
    blockDuration: 60000 // Block for 1 minute if exceeded
});

/**
 * Create a rate limiter for quest completions
 */
const questRateLimiter = new RateLimiter({
    maxRequests: 10,
    windowMs: 3600000, // 10 quests per hour
    blockDuration: 600000 // Block for 10 minutes if exceeded
});

// Export for ES modules
export { RateLimiter, txRateLimiter, apiRateLimiter, questRateLimiter };

// Also attach to window for non-module usage
if (typeof window !== 'undefined') {
    window.RateLimiter = RateLimiter;
    window.txRateLimiter = txRateLimiter;
    window.apiRateLimiter = apiRateLimiter;
    window.questRateLimiter = questRateLimiter;
}
