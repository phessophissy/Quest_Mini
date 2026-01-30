/**
 * Quest Mini - Storage Manager
 * Enhanced localStorage wrapper with expiration, namespacing, and compression
 */

const StorageManager = (function() {
  'use strict';

  // Configuration
  const PREFIX = 'questmini_';
  const VERSION_KEY = '_storage_version';
  const CURRENT_VERSION = 1;

  /**
   * Check if localStorage is available
   */
  function isAvailable() {
    try {
      const test = '__storage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * Get prefixed key
   */
  function prefixKey(key) {
    return PREFIX + key;
  }

  /**
   * Set item with optional expiration
   */
  function set(key, value, options = {}) {
    if (!isAvailable()) return false;

    try {
      const { expiresIn = null, compress = false } = options;
      
      const data = {
        value,
        timestamp: Date.now(),
        expires: expiresIn ? Date.now() + expiresIn : null,
        compressed: compress
      };

      let serialized = JSON.stringify(data);
      
      // Simple compression for large data
      if (compress && serialized.length > 1000) {
        serialized = compressString(serialized);
        data.compressed = true;
        serialized = JSON.stringify(data);
      }

      localStorage.setItem(prefixKey(key), serialized);
      return true;
    } catch (e) {
      console.warn('Storage set failed:', e);
      // Try to free up space
      if (e.name === 'QuotaExceededError') {
        cleanup();
        try {
          localStorage.setItem(prefixKey(key), JSON.stringify({ value, timestamp: Date.now() }));
          return true;
        } catch (e2) {
          return false;
        }
      }
      return false;
    }
  }

  /**
   * Get item
   */
  function get(key, defaultValue = null) {
    if (!isAvailable()) return defaultValue;

    try {
      const item = localStorage.getItem(prefixKey(key));
      if (!item) return defaultValue;

      let data = JSON.parse(item);
      
      // Decompress if needed
      if (data.compressed) {
        data = JSON.parse(decompressString(JSON.stringify(data)));
      }

      // Check expiration
      if (data.expires && Date.now() > data.expires) {
        remove(key);
        return defaultValue;
      }

      return data.value;
    } catch (e) {
      console.warn('Storage get failed:', e);
      return defaultValue;
    }
  }

  /**
   * Remove item
   */
  function remove(key) {
    if (!isAvailable()) return false;

    try {
      localStorage.removeItem(prefixKey(key));
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * Check if key exists and is not expired
   */
  function has(key) {
    return get(key) !== null;
  }

  /**
   * Get all keys with prefix
   */
  function keys() {
    if (!isAvailable()) return [];

    const result = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(PREFIX)) {
        result.push(key.slice(PREFIX.length));
      }
    }
    return result;
  }

  /**
   * Get multiple items
   */
  function getMultiple(keyList, defaults = {}) {
    const result = {};
    keyList.forEach(key => {
      result[key] = get(key, defaults[key] ?? null);
    });
    return result;
  }

  /**
   * Set multiple items
   */
  function setMultiple(items, options = {}) {
    const results = {};
    Object.entries(items).forEach(([key, value]) => {
      results[key] = set(key, value, options);
    });
    return results;
  }

  /**
   * Clear all items with prefix
   */
  function clear() {
    if (!isAvailable()) return false;

    const keysToRemove = keys();
    keysToRemove.forEach(key => remove(key));
    return true;
  }

  /**
   * Cleanup expired items
   */
  function cleanup() {
    if (!isAvailable()) return 0;

    let cleaned = 0;
    const now = Date.now();

    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (!key || !key.startsWith(PREFIX)) continue;

      try {
        const item = localStorage.getItem(key);
        if (item) {
          const data = JSON.parse(item);
          if (data.expires && now > data.expires) {
            localStorage.removeItem(key);
            cleaned++;
          }
        }
      } catch (e) {
        // Invalid data, remove it
        localStorage.removeItem(key);
        cleaned++;
      }
    }

    return cleaned;
  }

  /**
   * Get storage usage info
   */
  function getUsage() {
    if (!isAvailable()) return { used: 0, total: 0, items: 0 };

    let used = 0;
    let items = 0;

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(PREFIX)) {
        const value = localStorage.getItem(key);
        if (value) {
          used += key.length + value.length;
          items++;
        }
      }
    }

    // Estimate total (usually 5MB)
    const total = 5 * 1024 * 1024;

    return {
      used,
      total,
      items,
      usedKB: Math.round(used / 1024),
      percentage: ((used / total) * 100).toFixed(2)
    };
  }

  /**
   * Simple string compression (Run-Length Encoding inspired)
   */
  function compressString(str) {
    // Simple LZW-like compression
    return btoa(encodeURIComponent(str));
  }

  /**
   * Decompress string
   */
  function decompressString(str) {
    return decodeURIComponent(atob(str));
  }

  /**
   * Session-only storage (cleared on tab close)
   */
  const session = {
    set(key, value) {
      try {
        sessionStorage.setItem(prefixKey(key), JSON.stringify(value));
        return true;
      } catch (e) {
        return false;
      }
    },
    
    get(key, defaultValue = null) {
      try {
        const item = sessionStorage.getItem(prefixKey(key));
        return item ? JSON.parse(item) : defaultValue;
      } catch (e) {
        return defaultValue;
      }
    },
    
    remove(key) {
      try {
        sessionStorage.removeItem(prefixKey(key));
        return true;
      } catch (e) {
        return false;
      }
    },
    
    clear() {
      const keysToRemove = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && key.startsWith(PREFIX)) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(k => sessionStorage.removeItem(k));
    }
  };

  /**
   * Migration support
   */
  function migrate(migrations) {
    const currentVersion = get(VERSION_KEY, 0);
    
    migrations
      .filter(m => m.version > currentVersion)
      .sort((a, b) => a.version - b.version)
      .forEach(migration => {
        try {
          migration.up();
          set(VERSION_KEY, migration.version);
        } catch (e) {
          console.error(`Migration ${migration.version} failed:`, e);
        }
      });
  }

  /**
   * Watch for storage changes from other tabs
   */
  function watch(key, callback) {
    const prefixed = prefixKey(key);
    
    function handler(e) {
      if (e.key === prefixed) {
        const newValue = e.newValue ? JSON.parse(e.newValue).value : null;
        const oldValue = e.oldValue ? JSON.parse(e.oldValue).value : null;
        callback(newValue, oldValue);
      }
    }
    
    window.addEventListener('storage', handler);
    
    // Return unwatch function
    return () => window.removeEventListener('storage', handler);
  }

  // Run cleanup periodically
  if (isAvailable()) {
    cleanup();
    setInterval(cleanup, 60 * 60 * 1000); // Every hour
  }

  // Public API
  return {
    set,
    get,
    remove,
    has,
    keys,
    getMultiple,
    setMultiple,
    clear,
    cleanup,
    getUsage,
    session,
    migrate,
    watch,
    isAvailable
  };
})();

// Make available globally
window.StorageManager = StorageManager;
