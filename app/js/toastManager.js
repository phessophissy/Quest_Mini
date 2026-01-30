/**
 * Quest Mini - Enhanced Toast Notification System
 * Stackable, dismissible notifications with different types
 */

const ToastManager = (function() {
  'use strict';

  // Configuration
  const config = {
    maxToasts: 5,
    defaultDuration: 4000,
    animationDuration: 300,
    position: 'bottom-center' // top-left, top-center, top-right, bottom-left, bottom-center, bottom-right
  };

  // Active toasts
  const toasts = [];
  let containerId = 'toast-container';

  // Toast types with icons
  const types = {
    success: {
      icon: `<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
      </svg>`,
      color: 'var(--success, #10B981)'
    },
    error: {
      icon: `<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
      </svg>`,
      color: 'var(--error, #EF4444)'
    },
    warning: {
      icon: `<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
        <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
      </svg>`,
      color: 'var(--warning, #F59E0B)'
    },
    info: {
      icon: `<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
      </svg>`,
      color: 'var(--secondary, #06B6D4)'
    },
    reward: {
      icon: `<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
      </svg>`,
      color: 'var(--primary, #8B5CF6)'
    }
  };

  /**
   * Create toast container
   */
  function createContainer() {
    let container = document.getElementById(containerId);
    if (container) return container;

    container = document.createElement('div');
    container.id = containerId;
    container.className = 'toast-container';
    document.body.appendChild(container);

    addStyles();
    return container;
  }

  /**
   * Add toast styles
   */
  function addStyles() {
    if (document.getElementById('toast-manager-styles')) return;

    const styles = document.createElement('style');
    styles.id = 'toast-manager-styles';
    styles.textContent = `
      .toast-container {
        position: fixed;
        z-index: 10000;
        pointer-events: none;
        display: flex;
        flex-direction: column;
        gap: 8px;
        padding: 16px;
        max-width: 400px;
        width: 100%;
      }
      
      .toast-container.top-left { top: 0; left: 0; align-items: flex-start; }
      .toast-container.top-center { top: 0; left: 50%; transform: translateX(-50%); align-items: center; }
      .toast-container.top-right { top: 0; right: 0; align-items: flex-end; }
      .toast-container.bottom-left { bottom: 0; left: 0; align-items: flex-start; flex-direction: column-reverse; }
      .toast-container.bottom-center { bottom: 0; left: 50%; transform: translateX(-50%); align-items: center; flex-direction: column-reverse; }
      .toast-container.bottom-right { bottom: 0; right: 0; align-items: flex-end; flex-direction: column-reverse; }
      
      .toast-item {
        pointer-events: auto;
        display: flex;
        align-items: flex-start;
        gap: 12px;
        padding: 14px 16px;
        background: var(--bg-card, #1A1A2E);
        border-radius: 12px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        border: 1px solid var(--border, #2D2D44);
        min-width: 280px;
        max-width: 100%;
        transform: translateY(100%) scale(0.9);
        opacity: 0;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      }
      
      .toast-container.top-left .toast-item,
      .toast-container.top-center .toast-item,
      .toast-container.top-right .toast-item {
        transform: translateY(-100%) scale(0.9);
      }
      
      .toast-item.show {
        transform: translateY(0) scale(1);
        opacity: 1;
      }
      
      .toast-item.hide {
        transform: translateX(100%) scale(0.9);
        opacity: 0;
      }
      
      .toast-icon {
        flex-shrink: 0;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        background: currentColor;
        opacity: 0.15;
        position: relative;
      }
      
      .toast-icon svg {
        position: absolute;
        color: inherit;
        opacity: 1;
      }
      
      .toast-content {
        flex: 1;
        min-width: 0;
      }
      
      .toast-title {
        font-weight: 600;
        font-size: 14px;
        color: var(--text-primary, #FFFFFF);
        margin-bottom: 2px;
      }
      
      .toast-message {
        font-size: 13px;
        color: var(--text-secondary, #A1A1AA);
        word-wrap: break-word;
      }
      
      .toast-close {
        flex-shrink: 0;
        width: 24px;
        height: 24px;
        border: none;
        background: transparent;
        color: var(--text-secondary, #A1A1AA);
        cursor: pointer;
        border-radius: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0.5;
        transition: all 0.2s;
        margin: -4px -4px -4px 0;
      }
      
      .toast-close:hover {
        opacity: 1;
        background: var(--bg-card-hover, #252542);
      }
      
      .toast-progress {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        height: 3px;
        background: var(--border, #2D2D44);
        border-radius: 0 0 12px 12px;
        overflow: hidden;
      }
      
      .toast-progress-bar {
        height: 100%;
        background: currentColor;
        transition: width linear;
      }
      
      .toast-item {
        position: relative;
        overflow: hidden;
      }
      
      /* Action button */
      .toast-action {
        margin-top: 8px;
      }
      
      .toast-action button {
        padding: 6px 12px;
        font-size: 12px;
        font-weight: 500;
        border: none;
        border-radius: 6px;
        background: currentColor;
        color: white;
        cursor: pointer;
        opacity: 0.9;
        transition: opacity 0.2s;
      }
      
      .toast-action button:hover {
        opacity: 1;
      }
    `;
    document.head.appendChild(styles);
  }

  /**
   * Show a toast notification
   */
  function show(options) {
    const {
      type = 'info',
      title = '',
      message = '',
      duration = config.defaultDuration,
      dismissible = true,
      action = null, // { label: string, onClick: function }
      onClose = null
    } = typeof options === 'string' ? { message: options } : options;

    const container = createContainer();
    updateContainerPosition();

    // Limit toasts
    while (toasts.length >= config.maxToasts) {
      dismiss(toasts[0].id);
    }

    const id = Date.now() + Math.random();
    const typeConfig = types[type] || types.info;

    // Create toast element
    const toast = document.createElement('div');
    toast.className = 'toast-item';
    toast.style.color = typeConfig.color;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'polite');

    toast.innerHTML = `
      <div class="toast-icon">${typeConfig.icon}</div>
      <div class="toast-content">
        ${title ? `<div class="toast-title">${escapeHtml(title)}</div>` : ''}
        <div class="toast-message">${escapeHtml(message)}</div>
        ${action ? `<div class="toast-action"><button>${escapeHtml(action.label)}</button></div>` : ''}
      </div>
      ${dismissible ? `
        <button class="toast-close" aria-label="Dismiss">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"/>
          </svg>
        </button>
      ` : ''}
      ${duration > 0 ? `
        <div class="toast-progress">
          <div class="toast-progress-bar" style="width: 100%;"></div>
        </div>
      ` : ''}
    `;

    // Add event listeners
    if (dismissible) {
      const closeBtn = toast.querySelector('.toast-close');
      closeBtn?.addEventListener('click', () => dismiss(id));
    }

    if (action?.onClick) {
      const actionBtn = toast.querySelector('.toast-action button');
      actionBtn?.addEventListener('click', () => {
        action.onClick();
        dismiss(id);
      });
    }

    // Track toast
    const toastData = { id, element: toast, onClose };
    toasts.push(toastData);

    // Add to container
    container.appendChild(toast);

    // Trigger animation
    requestAnimationFrame(() => {
      toast.classList.add('show');
    });

    // Start progress animation
    if (duration > 0) {
      const progressBar = toast.querySelector('.toast-progress-bar');
      if (progressBar) {
        progressBar.style.transitionDuration = `${duration}ms`;
        requestAnimationFrame(() => {
          progressBar.style.width = '0%';
        });
      }

      // Auto dismiss
      toastData.timeout = setTimeout(() => dismiss(id), duration);
    }

    // Pause on hover
    toast.addEventListener('mouseenter', () => {
      if (toastData.timeout) {
        clearTimeout(toastData.timeout);
        const progressBar = toast.querySelector('.toast-progress-bar');
        if (progressBar) {
          progressBar.style.transitionDuration = '0s';
        }
      }
    });

    toast.addEventListener('mouseleave', () => {
      if (duration > 0) {
        const progressBar = toast.querySelector('.toast-progress-bar');
        const remaining = progressBar ? parseFloat(progressBar.style.width) / 100 * duration : duration / 2;
        if (progressBar) {
          progressBar.style.transitionDuration = `${remaining}ms`;
          progressBar.style.width = '0%';
        }
        toastData.timeout = setTimeout(() => dismiss(id), remaining);
      }
    });

    return id;
  }

  /**
   * Dismiss a toast
   */
  function dismiss(id) {
    const index = toasts.findIndex(t => t.id === id);
    if (index === -1) return;

    const toastData = toasts[index];
    const toast = toastData.element;

    if (toastData.timeout) {
      clearTimeout(toastData.timeout);
    }

    toast.classList.remove('show');
    toast.classList.add('hide');

    setTimeout(() => {
      toast.remove();
      toasts.splice(index, 1);
      if (toastData.onClose) toastData.onClose();
    }, config.animationDuration);
  }

  /**
   * Dismiss all toasts
   */
  function dismissAll() {
    [...toasts].forEach(t => dismiss(t.id));
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
   * Update container position
   */
  function updateContainerPosition() {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.className = `toast-container ${config.position}`;
  }

  /**
   * Set position
   */
  function setPosition(position) {
    config.position = position;
    updateContainerPosition();
  }

  // Shorthand methods
  function success(message, title) { return show({ type: 'success', message, title }); }
  function error(message, title) { return show({ type: 'error', message, title, duration: 6000 }); }
  function warning(message, title) { return show({ type: 'warning', message, title }); }
  function info(message, title) { return show({ type: 'info', message, title }); }
  function reward(message, title) { return show({ type: 'reward', message, title: title || '🎉 Reward!' }); }

  // Public API
  return {
    show,
    dismiss,
    dismissAll,
    setPosition,
    success,
    error,
    warning,
    info,
    reward,
    config
  };
})();

// Make available globally
window.ToastManager = ToastManager;

// Override legacy showToast if exists
window.showToast = function(message, type = 'info') {
  ToastManager.show({ type, message });
};
