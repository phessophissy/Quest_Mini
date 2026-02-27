/**
 * Quest Mini - Error Boundary & Error Handler
 * Global error handling with recovery UI
 */

const ErrorBoundary = (function() {
  'use strict';

  // Error log
  const errorLog = [];
  const MAX_ERRORS = 50;

  // Configuration
  const config = {
    showErrorUI: true,
    logToConsole: true,
    logToServer: false,
    serverEndpoint: null,
    onError: null
  };

  /**
   * Add styles
   */
  function addStyles() {
    if (document.getElementById('error-boundary-styles')) return;

    const styles = document.createElement('style');
    styles.id = 'error-boundary-styles';
    styles.textContent = `
      .error-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.9);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 99999;
        padding: 20px;
      }
      
      .error-container {
        background: var(--bg-card, #1A1A2E);
        border: 1px solid var(--error, #EF4444);
        border-radius: 16px;
        max-width: 500px;
        width: 100%;
        overflow: hidden;
      }
      
      .error-header {
        background: var(--error, #EF4444);
        color: white;
        padding: 16px 20px;
        display: flex;
        align-items: center;
        gap: 12px;
      }
      
      .error-icon {
        width: 32px;
        height: 32px;
        flex-shrink: 0;
      }
      
      .error-title {
        font-size: 18px;
        font-weight: 600;
      }
      
      .error-body {
        padding: 20px;
      }
      
      .error-message {
        color: var(--text-primary, #FFFFFF);
        font-size: 14px;
        line-height: 1.6;
        margin-bottom: 16px;
      }
      
      .error-details {
        background: var(--bg-dark, #0F0F1A);
        border: 1px solid var(--border, #2D2D44);
        border-radius: 8px;
        padding: 12px;
        margin-bottom: 16px;
        font-family: monospace;
        font-size: 12px;
        color: var(--text-secondary, #A1A1AA);
        max-height: 150px;
        overflow-y: auto;
        white-space: pre-wrap;
        word-break: break-all;
      }
      
      .error-actions {
        display: flex;
        gap: 12px;
      }
      
      .error-btn {
        flex: 1;
        padding: 12px 16px;
        border: none;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
      }
      
      .error-btn-primary {
        background: var(--primary, #8B5CF6);
        color: white;
      }
      
      .error-btn-primary:hover {
        background: var(--primary-dark, #7C3AED);
      }
      
      .error-btn-secondary {
        background: var(--bg-card-hover, #252542);
        color: var(--text-primary, #FFFFFF);
      }
      
      .error-btn-secondary:hover {
        background: var(--border, #2D2D44);
      }
      
      /* Error toast */
      .error-toast {
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%) translateY(100%);
        background: var(--error, #EF4444);
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 14px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        z-index: 99998;
        transition: transform 0.3s ease;
        max-width: 90vw;
      }
      
      .error-toast.show {
        transform: translateX(-50%) translateY(0);
      }
      
      .error-toast-close {
        background: transparent;
        border: none;
        color: white;
        cursor: pointer;
        padding: 4px;
        opacity: 0.8;
      }
      
      .error-toast-close:hover {
        opacity: 1;
      }
    `;
    document.head.appendChild(styles);
  }

  /**
   * Log error
   */
  function logError(error, context = {}) {
    const entry = {
      timestamp: new Date().toISOString(),
      message: error.message || String(error),
      stack: error.stack || null,
      context,
      url: window.location.href,
      userAgent: navigator.userAgent
    };

    // Add to log
    errorLog.unshift(entry);
    if (errorLog.length > MAX_ERRORS) {
      errorLog.pop();
    }

    // Console log
    if (config.logToConsole) {
      console.error('ErrorBoundary:', entry);
    }

    // Server log
    if (config.logToServer && config.serverEndpoint) {
      try {
        navigator.sendBeacon(config.serverEndpoint, JSON.stringify(entry));
      } catch (e) {
        // Ignore
      }
    }

    // Custom callback
    if (config.onError) {
      try {
        config.onError(entry);
      } catch (e) {
        // Ignore
      }
    }

    return entry;
  }

  /**
   * Show error overlay
   */
  function showErrorOverlay(error, options = {}) {
    const { recoverable = true, context = '' } = options;
    
    const overlay = document.createElement('div');
    overlay.className = 'error-overlay';
    overlay.innerHTML = `
      <div class="error-container">
        <div class="error-header">
          <svg class="error-icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
          </svg>
          <span class="error-title">Something went wrong</span>
        </div>
        <div class="error-body">
          <p class="error-message">
            ${context || 'An unexpected error occurred. Please try again or refresh the page.'}
          </p>
          <div class="error-details">${escapeHtml(error.message || String(error))}${error.stack ? '\n\n' + escapeHtml(error.stack) : ''}</div>
          <div class="error-actions">
            ${recoverable ? `
              <button class="error-btn error-btn-secondary" onclick="this.closest('.error-overlay').remove()">
                Dismiss
              </button>
            ` : ''}
            <button class="error-btn error-btn-primary" onclick="window.location.reload()">
              Refresh Page
            </button>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(overlay);
    
    // Focus trap
    overlay.tabIndex = -1;
    overlay.focus();
    
    return overlay;
  }

  /**
   * Show error toast
   */
  function showErrorToast(message, duration = 5000) {
    const toast = document.createElement('div');
    toast.className = 'error-toast';
    toast.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
      </svg>
      <span>${escapeHtml(message)}</span>
      <button class="error-toast-close" aria-label="Dismiss">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"/>
        </svg>
      </button>
    `;
    
    document.body.appendChild(toast);
    
    // Show
    requestAnimationFrame(() => {
      toast.classList.add('show');
    });
    
    // Close button
    toast.querySelector('.error-toast-close').addEventListener('click', () => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    });
    
    // Auto hide
    if (duration > 0) {
      setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
      }, duration);
    }
    
    return toast;
  }

  /**
   * Escape HTML
   */
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Wrap a function with error handling
   */
  function wrap(fn, context = '') {
    return function(...args) {
      try {
        const result = fn.apply(this, args);
        
        // Handle promises
        if (result && typeof result.catch === 'function') {
          return result.catch(error => {
            handleError(error, { context });
            throw error;
          });
        }
        
        return result;
      } catch (error) {
        handleError(error, { context });
        throw error;
      }
    };
  }

  /**
   * Handle error
   */
  function handleError(error, options = {}) {
    const entry = logError(error, options.context);
    
    if (config.showErrorUI) {
      if (options.fatal) {
        showErrorOverlay(error, options);
      } else {
        showErrorToast(error.message || 'An error occurred');
      }
    }
    
    return entry;
  }

  /**
   * Initialize global error handlers
   */
  function init(options = {}) {
    Object.assign(config, options);
    addStyles();

    // Unhandled errors
    window.addEventListener('error', (event) => {
      handleError(event.error || new Error(event.message), {
        context: `Unhandled error at ${event.filename}:${event.lineno}:${event.colno}`
      });
    });

    // Unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      handleError(event.reason || new Error('Promise rejected'), {
        context: 'Unhandled promise rejection'
      });
    });

    console.log('Error boundary initialized');
  }

  /**
   * Get error log
   */
  function getErrorLog() {
    return [...errorLog];
  }

  /**
   * Clear error log
   */
  function clearErrorLog() {
    errorLog.length = 0;
  }

  // Public API
  return {
    init,
    handleError,
    wrap,
    showErrorOverlay,
    showErrorToast,
    getErrorLog,
    clearErrorLog,
    logError
  };
})();

// Make available globally
window.ErrorBoundary = ErrorBoundary;

// Auto-initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  ErrorBoundary.init();
});
