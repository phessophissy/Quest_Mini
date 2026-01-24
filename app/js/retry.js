/**
 * @fileoverview Retry utility for resilient async operations
 * @description Provides exponential backoff retry logic for API calls and transactions
 * @module retry
 */

/**
 * Default retry configuration
 * @type {Object}
 */
const DEFAULT_CONFIG = {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 30000,
    exponentialBase: 2,
    jitterFactor: 0.2,
    retryableErrors: [
        'ETIMEDOUT',
        'ECONNRESET',
        'ECONNREFUSED',
        'ENETUNREACH',
        'EAI_AGAIN',
        'RATE_LIMIT',
        'SERVER_ERROR',
        'NETWORK_ERROR',
        'TIMEOUT'
    ],
    retryableStatusCodes: [408, 429, 500, 502, 503, 504]
};

/**
 * Calculate delay with exponential backoff and jitter
 * @param {number} attempt - Current attempt number (0-indexed)
 * @param {Object} config - Retry configuration
 * @returns {number} Delay in milliseconds
 */
function calculateDelay(attempt, config) {
    const { baseDelay, maxDelay, exponentialBase, jitterFactor } = config;
    
    // Exponential backoff
    const exponentialDelay = baseDelay * Math.pow(exponentialBase, attempt);
    
    // Cap at max delay
    const cappedDelay = Math.min(exponentialDelay, maxDelay);
    
    // Add jitter to prevent thundering herd
    const jitter = cappedDelay * jitterFactor * (Math.random() - 0.5) * 2;
    
    return Math.round(cappedDelay + jitter);
}

/**
 * Determine if an error is retryable
 * @param {Error} error - The error to check
 * @param {Object} config - Retry configuration
 * @returns {boolean} Whether the error is retryable
 */
function isRetryableError(error, config) {
    // Check error code
    if (error.code && config.retryableErrors.includes(error.code)) {
        return true;
    }
    
    // Check HTTP status code
    if (error.status && config.retryableStatusCodes.includes(error.status)) {
        return true;
    }
    
    // Check response status
    if (error.response?.status && config.retryableStatusCodes.includes(error.response.status)) {
        return true;
    }
    
    // Check for specific error messages
    const retryableMessages = [
        'network',
        'timeout',
        'rate limit',
        'too many requests',
        'service unavailable',
        'bad gateway',
        'gateway timeout',
        'ECONNRESET',
        'ETIMEDOUT',
        'nonce too low',
        'replacement transaction underpriced'
    ];
    
    const errorMessage = (error.message || '').toLowerCase();
    if (retryableMessages.some(msg => errorMessage.includes(msg))) {
        return true;
    }
    
    return false;
}

/**
 * Sleep for specified duration
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise<void>}
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry result object
 * @typedef {Object} RetryResult
 * @property {boolean} success - Whether operation succeeded
 * @property {*} data - Result data if successful
 * @property {Error} error - Final error if failed
 * @property {number} attempts - Total attempts made
 * @property {number} totalTime - Total time spent in ms
 */

/**
 * Execute an async function with retry logic
 * @template T
 * @param {function(): Promise<T>} fn - Async function to retry
 * @param {Object} [options] - Retry options
 * @param {number} [options.maxRetries=3] - Maximum retry attempts
 * @param {number} [options.baseDelay=1000] - Base delay in ms
 * @param {number} [options.maxDelay=30000] - Maximum delay in ms
 * @param {number} [options.exponentialBase=2] - Exponential backoff base
 * @param {number} [options.jitterFactor=0.2] - Jitter factor (0-1)
 * @param {function(Error): boolean} [options.shouldRetry] - Custom retry predicate
 * @param {function(Error, number): void} [options.onRetry] - Callback on retry
 * @param {AbortSignal} [options.signal] - Abort signal for cancellation
 * @returns {Promise<T>} Result of the function
 * @throws {Error} Last error if all retries fail
 */
async function retry(fn, options = {}) {
    const config = { ...DEFAULT_CONFIG, ...options };
    const { maxRetries, shouldRetry, onRetry, signal } = config;
    
    let lastError;
    const startTime = Date.now();
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        // Check for abort
        if (signal?.aborted) {
            throw new Error('Operation aborted');
        }
        
        try {
            const result = await fn();
            return result;
        } catch (error) {
            lastError = error;
            
            // Check if we've exhausted retries
            if (attempt >= maxRetries) {
                break;
            }
            
            // Determine if we should retry
            const shouldAttemptRetry = shouldRetry 
                ? shouldRetry(error)
                : isRetryableError(error, config);
            
            if (!shouldAttemptRetry) {
                throw error;
            }
            
            // Calculate delay
            const delay = calculateDelay(attempt, config);
            
            // Call retry callback if provided
            if (onRetry) {
                onRetry(error, attempt + 1, delay);
            }
            
            // Wait before retrying
            await sleep(delay);
        }
    }
    
    // All retries exhausted
    const totalTime = Date.now() - startTime;
    const enhancedError = new Error(
        `Operation failed after ${maxRetries + 1} attempts (${totalTime}ms): ${lastError.message}`
    );
    enhancedError.cause = lastError;
    enhancedError.attempts = maxRetries + 1;
    enhancedError.totalTime = totalTime;
    
    throw enhancedError;
}

/**
 * Create a retry-wrapped version of an async function
 * @template T, Args
 * @param {function(...Args): Promise<T>} fn - Function to wrap
 * @param {Object} [options] - Default retry options
 * @returns {function(...Args): Promise<T>} Wrapped function
 */
function withRetry(fn, options = {}) {
    return async function retryWrapper(...args) {
        return retry(() => fn.apply(this, args), options);
    };
}

/**
 * Execute multiple async functions with retry, with concurrency limit
 * @template T
 * @param {Array<function(): Promise<T>>} fns - Array of async functions
 * @param {Object} [options] - Options
 * @param {number} [options.concurrency=3] - Max concurrent executions
 * @param {Object} [options.retryOptions] - Retry options for each function
 * @returns {Promise<Array<{status: 'fulfilled'|'rejected', value?: T, reason?: Error}>>}
 */
async function retryAll(fns, options = {}) {
    const { concurrency = 3, retryOptions = {} } = options;
    const results = [];
    const executing = new Set();
    
    for (const fn of fns) {
        const promise = retry(fn, retryOptions)
            .then(value => ({ status: 'fulfilled', value }))
            .catch(reason => ({ status: 'rejected', reason }));
        
        results.push(promise);
        executing.add(promise);
        
        promise.then(() => executing.delete(promise));
        
        if (executing.size >= concurrency) {
            await Promise.race(executing);
        }
    }
    
    return Promise.all(results);
}

/**
 * Retry with circuit breaker pattern
 * @param {function(): Promise<*>} fn - Function to execute
 * @param {Object} circuitBreaker - Circuit breaker instance
 * @param {Object} [options] - Retry options
 * @returns {Promise<*>}
 */
async function retryWithCircuitBreaker(fn, circuitBreaker, options = {}) {
    if (!circuitBreaker.isOpen()) {
        try {
            const result = await retry(fn, options);
            circuitBreaker.recordSuccess();
            return result;
        } catch (error) {
            circuitBreaker.recordFailure();
            throw error;
        }
    }
    
    throw new Error('Circuit breaker is open');
}

/**
 * Simple circuit breaker implementation
 * @param {Object} [options] - Circuit breaker options
 * @returns {Object} Circuit breaker instance
 */
function createCircuitBreaker(options = {}) {
    const {
        failureThreshold = 5,
        resetTimeout = 60000
    } = options;
    
    let failures = 0;
    let lastFailureTime = 0;
    let state = 'closed'; // closed, open, half-open
    
    return {
        isOpen() {
            if (state === 'open') {
                if (Date.now() - lastFailureTime >= resetTimeout) {
                    state = 'half-open';
                    return false;
                }
                return true;
            }
            return false;
        },
        
        recordSuccess() {
            failures = 0;
            state = 'closed';
        },
        
        recordFailure() {
            failures++;
            lastFailureTime = Date.now();
            
            if (failures >= failureThreshold) {
                state = 'open';
            }
        },
        
        getState() {
            return { state, failures, lastFailureTime };
        },
        
        reset() {
            failures = 0;
            lastFailureTime = 0;
            state = 'closed';
        }
    };
}

// Export module
export {
    retry,
    withRetry,
    retryAll,
    retryWithCircuitBreaker,
    createCircuitBreaker,
    calculateDelay,
    isRetryableError,
    DEFAULT_CONFIG
};

// Default export
export default retry;
