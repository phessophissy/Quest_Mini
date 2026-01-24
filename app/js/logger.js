/**
 * @fileoverview Structured logging utility for Quest Mini
 * @description Provides consistent logging with levels, timestamps, and context
 * @module logger
 */

/**
 * Log levels enum
 * @enum {number}
 */
const LOG_LEVELS = {
    DEBUG: 0,
    INFO: 1,
    WARN: 2,
    ERROR: 3,
    NONE: 4
};

/**
 * Log level names for display
 * @type {Object.<number, string>}
 */
const LOG_LEVEL_NAMES = {
    [LOG_LEVELS.DEBUG]: 'DEBUG',
    [LOG_LEVELS.INFO]: 'INFO',
    [LOG_LEVELS.WARN]: 'WARN',
    [LOG_LEVELS.ERROR]: 'ERROR'
};

/**
 * Log level styles for console
 * @type {Object.<number, string>}
 */
const LOG_LEVEL_STYLES = {
    [LOG_LEVELS.DEBUG]: 'color: #6c757d; font-weight: normal;',
    [LOG_LEVELS.INFO]: 'color: #0d6efd; font-weight: normal;',
    [LOG_LEVELS.WARN]: 'color: #ffc107; font-weight: bold;',
    [LOG_LEVELS.ERROR]: 'color: #dc3545; font-weight: bold;'
};

/**
 * Logger configuration
 * @type {Object}
 */
const config = {
    level: LOG_LEVELS.INFO,
    enableTimestamp: true,
    enableContext: true,
    enableStackTrace: false,
    maxLogHistory: 100,
    persistLogs: false
};

/**
 * Log history for debugging
 * @type {Array<Object>}
 */
const logHistory = [];

/**
 * Format timestamp for log entries
 * @returns {string} Formatted timestamp
 */
function getTimestamp() {
    const now = new Date();
    return now.toISOString();
}

/**
 * Get caller information from stack trace
 * @returns {string} Caller information
 */
function getCallerInfo() {
    const error = new Error();
    const stack = error.stack?.split('\n');
    
    if (stack && stack.length >= 4) {
        const callerLine = stack[3];
        const match = callerLine.match(/at\s+(.+?)\s+\((.+?):(\d+):(\d+)\)/);
        
        if (match) {
            return `${match[1]} (${match[2]}:${match[3]})`;
        }
        
        const simpleMatch = callerLine.match(/at\s+(.+?):(\d+):(\d+)/);
        if (simpleMatch) {
            return `${simpleMatch[1]}:${simpleMatch[2]}`;
        }
    }
    
    return 'unknown';
}

/**
 * Store log entry in history
 * @param {Object} entry - Log entry
 */
function storeLog(entry) {
    logHistory.push(entry);
    
    // Trim history if too long
    if (logHistory.length > config.maxLogHistory) {
        logHistory.shift();
    }
    
    // Persist to localStorage if enabled
    if (config.persistLogs) {
        try {
            localStorage.setItem('quest_logs', JSON.stringify(logHistory.slice(-50)));
        } catch (e) {
            // Storage might be full or unavailable
        }
    }
}

/**
 * Create a log entry
 * @param {number} level - Log level
 * @param {string} context - Logger context/module name
 * @param {string} message - Log message
 * @param {Object} [data] - Additional data
 * @returns {Object} Log entry
 */
function createLogEntry(level, context, message, data) {
    return {
        timestamp: getTimestamp(),
        level: LOG_LEVEL_NAMES[level],
        context,
        message,
        data: data || null,
        caller: config.enableStackTrace ? getCallerInfo() : null
    };
}

/**
 * Output log to console
 * @param {number} level - Log level
 * @param {Object} entry - Log entry
 */
function outputLog(level, entry) {
    if (level < config.level) return;
    
    const parts = [];
    
    if (config.enableTimestamp) {
        parts.push(`[${entry.timestamp}]`);
    }
    
    parts.push(`[${entry.level}]`);
    
    if (config.enableContext && entry.context) {
        parts.push(`[${entry.context}]`);
    }
    
    parts.push(entry.message);
    
    const logMessage = parts.join(' ');
    const style = LOG_LEVEL_STYLES[level];
    
    switch (level) {
        case LOG_LEVELS.DEBUG:
            console.debug(`%c${logMessage}`, style, entry.data || '');
            break;
        case LOG_LEVELS.INFO:
            console.info(`%c${logMessage}`, style, entry.data || '');
            break;
        case LOG_LEVELS.WARN:
            console.warn(`%c${logMessage}`, style, entry.data || '');
            break;
        case LOG_LEVELS.ERROR:
            console.error(`%c${logMessage}`, style, entry.data || '');
            if (entry.caller) {
                console.error('  at', entry.caller);
            }
            break;
    }
}

/**
 * Create a contextualized logger instance
 * @param {string} context - Logger context/module name
 * @returns {Object} Logger instance with bound context
 */
function createLogger(context) {
    return {
        /**
         * Log debug message
         * @param {string} message - Message to log
         * @param {Object} [data] - Additional data
         */
        debug(message, data) {
            const entry = createLogEntry(LOG_LEVELS.DEBUG, context, message, data);
            storeLog(entry);
            outputLog(LOG_LEVELS.DEBUG, entry);
        },
        
        /**
         * Log info message
         * @param {string} message - Message to log
         * @param {Object} [data] - Additional data
         */
        info(message, data) {
            const entry = createLogEntry(LOG_LEVELS.INFO, context, message, data);
            storeLog(entry);
            outputLog(LOG_LEVELS.INFO, entry);
        },
        
        /**
         * Log warning message
         * @param {string} message - Message to log
         * @param {Object} [data] - Additional data
         */
        warn(message, data) {
            const entry = createLogEntry(LOG_LEVELS.WARN, context, message, data);
            storeLog(entry);
            outputLog(LOG_LEVELS.WARN, entry);
        },
        
        /**
         * Log error message
         * @param {string} message - Message to log
         * @param {Object|Error} [data] - Additional data or Error object
         */
        error(message, data) {
            // Handle Error objects specially
            let logData = data;
            if (data instanceof Error) {
                logData = {
                    name: data.name,
                    message: data.message,
                    stack: data.stack
                };
            }
            
            const entry = createLogEntry(LOG_LEVELS.ERROR, context, message, logData);
            storeLog(entry);
            outputLog(LOG_LEVELS.ERROR, entry);
        },
        
        /**
         * Log with timing measurement
         * @param {string} label - Timer label
         * @returns {Function} Function to call when operation completes
         */
        time(label) {
            const start = performance.now();
            this.debug(`⏱️ Timer started: ${label}`);
            
            return () => {
                const duration = performance.now() - start;
                this.info(`⏱️ Timer ended: ${label}`, { duration: `${duration.toFixed(2)}ms` });
            };
        },
        
        /**
         * Log a group of related messages
         * @param {string} label - Group label
         * @param {Function} callback - Function containing grouped logs
         */
        group(label, callback) {
            console.group(`[${context}] ${label}`);
            callback();
            console.groupEnd();
        }
    };
}

/**
 * Configure the logger
 * @param {Object} options - Configuration options
 */
function configure(options) {
    Object.assign(config, options);
}

/**
 * Set log level
 * @param {number|string} level - Log level
 */
function setLevel(level) {
    if (typeof level === 'string') {
        config.level = LOG_LEVELS[level.toUpperCase()] ?? LOG_LEVELS.INFO;
    } else {
        config.level = level;
    }
}

/**
 * Get log history
 * @returns {Array<Object>} Log history
 */
function getHistory() {
    return [...logHistory];
}

/**
 * Clear log history
 */
function clearHistory() {
    logHistory.length = 0;
    if (config.persistLogs) {
        try {
            localStorage.removeItem('quest_logs');
        } catch (e) {
            // Ignore storage errors
        }
    }
}

/**
 * Export logs as JSON
 * @returns {string} JSON string of logs
 */
function exportLogs() {
    return JSON.stringify(logHistory, null, 2);
}

/**
 * Download logs as file
 * @param {string} [filename] - Output filename
 */
function downloadLogs(filename = 'quest-logs.json') {
    const data = exportLogs();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    
    URL.revokeObjectURL(url);
}

// Export module
export {
    LOG_LEVELS,
    createLogger,
    configure,
    setLevel,
    getHistory,
    clearHistory,
    exportLogs,
    downloadLogs
};

// Default export for convenience
export default createLogger;
