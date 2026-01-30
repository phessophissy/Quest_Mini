/**
 * Quest Mini - Debounce & Throttle Utilities
 * Performance optimization utilities for event handling
 */

const RateControl = (function() {
  'use strict';

  /**
   * Debounce a function
   * @param {Function} fn - Function to debounce
   * @param {number} wait - Wait time in ms
   * @param {Object} options - Options
   * @returns {Function} Debounced function
   */
  function debounce(fn, wait = 300, options = {}) {
    const { leading = false, trailing = true, maxWait = null } = options;
    
    let timeoutId = null;
    let lastCallTime = null;
    let lastInvokeTime = 0;
    let lastArgs = null;
    let lastThis = null;
    let result = null;

    function invokeFunc(time) {
      const args = lastArgs;
      const thisArg = lastThis;
      lastArgs = lastThis = null;
      lastInvokeTime = time;
      result = fn.apply(thisArg, args);
      return result;
    }

    function shouldInvoke(time) {
      const timeSinceLastCall = time - lastCallTime;
      const timeSinceLastInvoke = time - lastInvokeTime;

      return (
        lastCallTime === null ||
        timeSinceLastCall >= wait ||
        timeSinceLastCall < 0 ||
        (maxWait !== null && timeSinceLastInvoke >= maxWait)
      );
    }

    function timerExpired() {
      const time = Date.now();
      if (shouldInvoke(time)) {
        return trailingEdge(time);
      }
      const remaining = remainingWait(time);
      timeoutId = setTimeout(timerExpired, remaining);
    }

    function remainingWait(time) {
      const timeSinceLastCall = time - lastCallTime;
      const timeSinceLastInvoke = time - lastInvokeTime;
      const timeWaiting = wait - timeSinceLastCall;

      return maxWait !== null
        ? Math.min(timeWaiting, maxWait - timeSinceLastInvoke)
        : timeWaiting;
    }

    function leadingEdge(time) {
      lastInvokeTime = time;
      timeoutId = setTimeout(timerExpired, wait);
      return leading ? invokeFunc(time) : result;
    }

    function trailingEdge(time) {
      timeoutId = null;
      if (trailing && lastArgs) {
        return invokeFunc(time);
      }
      lastArgs = lastThis = null;
      return result;
    }

    function cancel() {
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
      }
      lastInvokeTime = 0;
      lastCallTime = null;
      lastArgs = lastThis = timeoutId = null;
    }

    function flush() {
      if (timeoutId === null) {
        return result;
      }
      return trailingEdge(Date.now());
    }

    function pending() {
      return timeoutId !== null;
    }

    function debounced(...args) {
      const time = Date.now();
      const isInvoking = shouldInvoke(time);

      lastArgs = args;
      lastThis = this;
      lastCallTime = time;

      if (isInvoking) {
        if (timeoutId === null) {
          return leadingEdge(lastCallTime);
        }
        if (maxWait !== null) {
          timeoutId = setTimeout(timerExpired, wait);
          return invokeFunc(lastCallTime);
        }
      }

      if (timeoutId === null) {
        timeoutId = setTimeout(timerExpired, wait);
      }

      return result;
    }

    debounced.cancel = cancel;
    debounced.flush = flush;
    debounced.pending = pending;

    return debounced;
  }

  /**
   * Throttle a function
   * @param {Function} fn - Function to throttle
   * @param {number} wait - Wait time in ms
   * @param {Object} options - Options
   * @returns {Function} Throttled function
   */
  function throttle(fn, wait = 300, options = {}) {
    const { leading = true, trailing = true } = options;
    return debounce(fn, wait, {
      leading,
      trailing,
      maxWait: wait
    });
  }

  /**
   * Rate limit with queue
   * @param {Function} fn - Function to rate limit
   * @param {number} interval - Minimum interval between calls
   * @returns {Function} Rate limited function
   */
  function rateLimit(fn, interval = 1000) {
    const queue = [];
    let processing = false;
    let lastCallTime = 0;

    async function processQueue() {
      if (processing || queue.length === 0) return;
      
      processing = true;
      
      while (queue.length > 0) {
        const now = Date.now();
        const elapsed = now - lastCallTime;
        
        if (elapsed < interval) {
          await new Promise(resolve => setTimeout(resolve, interval - elapsed));
        }
        
        const { args, thisArg, resolve, reject } = queue.shift();
        
        try {
          lastCallTime = Date.now();
          const result = await fn.apply(thisArg, args);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      }
      
      processing = false;
    }

    function rateLimited(...args) {
      return new Promise((resolve, reject) => {
        queue.push({ args, thisArg: this, resolve, reject });
        processQueue();
      });
    }

    rateLimited.clear = () => {
      queue.length = 0;
    };

    rateLimited.pending = () => queue.length;

    return rateLimited;
  }

  /**
   * Memoize a function
   * @param {Function} fn - Function to memoize
   * @param {Object} options - Options
   * @returns {Function} Memoized function
   */
  function memoize(fn, options = {}) {
    const {
      maxAge = null,          // Cache TTL in ms
      maxSize = 100,          // Max cache entries
      resolver = null,        // Custom key resolver
      onHit = null,
      onMiss = null
    } = options;

    const cache = new Map();

    function memoized(...args) {
      const key = resolver ? resolver(...args) : JSON.stringify(args);
      
      if (cache.has(key)) {
        const entry = cache.get(key);
        
        // Check TTL
        if (maxAge && Date.now() - entry.timestamp > maxAge) {
          cache.delete(key);
        } else {
          if (onHit) onHit(key);
          return entry.value;
        }
      }

      if (onMiss) onMiss(key);
      
      const value = fn.apply(this, args);
      
      // Enforce max size (LRU-style)
      if (cache.size >= maxSize) {
        const firstKey = cache.keys().next().value;
        cache.delete(firstKey);
      }
      
      cache.set(key, { value, timestamp: Date.now() });
      
      return value;
    }

    memoized.clear = () => cache.clear();
    memoized.delete = (key) => cache.delete(key);
    memoized.has = (key) => cache.has(key);
    memoized.size = () => cache.size;

    return memoized;
  }

  /**
   * Batch multiple calls into one
   * @param {Function} fn - Function to batch
   * @param {number} delay - Delay before executing batch
   * @returns {Function} Batched function
   */
  function batch(fn, delay = 50) {
    let items = [];
    let timeoutId = null;

    function batched(item) {
      return new Promise((resolve, reject) => {
        items.push({ item, resolve, reject });
        
        if (timeoutId === null) {
          timeoutId = setTimeout(async () => {
            const currentItems = items;
            items = [];
            timeoutId = null;
            
            try {
              const results = await fn(currentItems.map(i => i.item));
              currentItems.forEach((entry, index) => {
                entry.resolve(results[index]);
              });
            } catch (error) {
              currentItems.forEach(entry => entry.reject(error));
            }
          }, delay);
        }
      });
    }

    batched.flush = () => {
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
        timeoutId = null;
        
        const currentItems = items;
        items = [];
        
        return fn(currentItems.map(i => i.item));
      }
      return Promise.resolve([]);
    };

    return batched;
  }

  /**
   * Create an idle callback wrapper
   * @param {Function} fn - Function to call when idle
   * @param {Object} options - Options
   * @returns {Function} Idle-aware function
   */
  function idle(fn, options = {}) {
    const { timeout = 2000 } = options;
    let requestId = null;

    function idled(...args) {
      if (requestId !== null) {
        cancelIdleCallback(requestId);
      }

      return new Promise((resolve) => {
        requestId = requestIdleCallback(
          (deadline) => {
            requestId = null;
            resolve(fn.apply(this, args));
          },
          { timeout }
        );
      });
    }

    idled.cancel = () => {
      if (requestId !== null) {
        cancelIdleCallback(requestId);
        requestId = null;
      }
    };

    return idled;
  }

  // Polyfill for requestIdleCallback
  if (typeof window !== 'undefined' && !window.requestIdleCallback) {
    window.requestIdleCallback = (callback, options = {}) => {
      const start = Date.now();
      return setTimeout(() => {
        callback({
          didTimeout: false,
          timeRemaining: () => Math.max(0, 50 - (Date.now() - start))
        });
      }, options.timeout || 1);
    };

    window.cancelIdleCallback = (id) => clearTimeout(id);
  }

  // Public API
  return {
    debounce,
    throttle,
    rateLimit,
    memoize,
    batch,
    idle
  };
})();

// Make available globally
window.RateControl = RateControl;

// Also expose individual functions
window.debounce = RateControl.debounce;
window.throttle = RateControl.throttle;
