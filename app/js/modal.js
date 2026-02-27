/**
 * Quest Mini - Modal Dialog Component
 * Accessible modal dialogs with customizable content
 */

const Modal = (function() {
  'use strict';

  // Active modals stack
  const modalsStack = [];
  let backdrop = null;

  // Default options
  const defaults = {
    closable: true,           // Can be closed by clicking outside or pressing Escape
    closeOnBackdrop: true,    // Close when clicking backdrop
    closeButton: true,        // Show close button
    animation: 'scale',       // 'scale', 'slide-up', 'fade'
    width: '400px',
    maxWidth: '90vw',
    maxHeight: '85vh'
  };

  /**
   * Add modal styles
   */
  function addStyles() {
    if (document.getElementById('modal-styles')) return;

    const styles = document.createElement('style');
    styles.id = 'modal-styles';
    styles.textContent = `
      .modal-backdrop {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.6);
        backdrop-filter: blur(4px);
        z-index: 9999;
        opacity: 0;
        transition: opacity 0.2s ease;
      }
      
      .modal-backdrop.show {
        opacity: 1;
      }
      
      .modal-container {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
        z-index: 10000;
        pointer-events: none;
      }
      
      .modal-dialog {
        background: var(--bg-card, #1A1A2E);
        border: 1px solid var(--border, #2D2D44);
        border-radius: 16px;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
        overflow: hidden;
        pointer-events: auto;
        display: flex;
        flex-direction: column;
        opacity: 0;
        transition: opacity 0.2s ease, transform 0.2s ease;
      }
      
      /* Animation: scale */
      .modal-dialog.anim-scale {
        transform: scale(0.9);
      }
      
      .modal-dialog.anim-scale.show {
        transform: scale(1);
      }
      
      /* Animation: slide-up */
      .modal-dialog.anim-slide-up {
        transform: translateY(30px);
      }
      
      .modal-dialog.anim-slide-up.show {
        transform: translateY(0);
      }
      
      /* Animation: fade */
      .modal-dialog.anim-fade {
        transform: none;
      }
      
      .modal-dialog.show {
        opacity: 1;
      }
      
      .modal-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 16px 20px;
        border-bottom: 1px solid var(--border, #2D2D44);
      }
      
      .modal-title {
        font-size: 18px;
        font-weight: 600;
        color: var(--text-primary, #FFFFFF);
        margin: 0;
      }
      
      .modal-close {
        width: 32px;
        height: 32px;
        border: none;
        background: transparent;
        color: var(--text-secondary, #A1A1AA);
        cursor: pointer;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s;
        margin: -4px -8px -4px 0;
      }
      
      .modal-close:hover {
        background: var(--bg-card-hover, #252542);
        color: var(--text-primary, #FFFFFF);
      }
      
      .modal-body {
        padding: 20px;
        overflow-y: auto;
        color: var(--text-secondary, #A1A1AA);
        line-height: 1.6;
      }
      
      .modal-footer {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: 12px;
        padding: 16px 20px;
        border-top: 1px solid var(--border, #2D2D44);
      }
      
      .modal-btn {
        padding: 10px 20px;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
        border: none;
      }
      
      .modal-btn-secondary {
        background: var(--bg-card-hover, #252542);
        color: var(--text-primary, #FFFFFF);
      }
      
      .modal-btn-secondary:hover {
        background: var(--border, #2D2D44);
      }
      
      .modal-btn-primary {
        background: var(--primary, #8B5CF6);
        color: white;
      }
      
      .modal-btn-primary:hover {
        background: var(--primary-dark, #7C3AED);
      }
      
      .modal-btn-danger {
        background: var(--error, #EF4444);
        color: white;
      }
      
      .modal-btn-danger:hover {
        background: #DC2626;
      }
      
      /* Body scroll lock */
      body.modal-open {
        overflow: hidden;
      }
      
      /* Focus trap indicator */
      .modal-dialog:focus {
        outline: none;
      }
    `;
    document.head.appendChild(styles);
  }

  /**
   * Create backdrop
   */
  function createBackdrop() {
    if (backdrop) return backdrop;
    
    backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop';
    document.body.appendChild(backdrop);
    
    requestAnimationFrame(() => {
      backdrop.classList.add('show');
    });
    
    return backdrop;
  }

  /**
   * Remove backdrop
   */
  function removeBackdrop() {
    if (!backdrop) return;
    
    backdrop.classList.remove('show');
    setTimeout(() => {
      backdrop?.remove();
      backdrop = null;
    }, 200);
  }

  /**
   * Create modal
   */
  function create(options = {}) {
    const opts = { ...defaults, ...options };
    addStyles();
    
    // Create backdrop if first modal
    if (modalsStack.length === 0) {
      createBackdrop();
      document.body.classList.add('modal-open');
    }
    
    // Create container
    const container = document.createElement('div');
    container.className = 'modal-container';
    
    // Create dialog
    const dialog = document.createElement('div');
    dialog.className = `modal-dialog anim-${opts.animation}`;
    dialog.setAttribute('role', 'dialog');
    dialog.setAttribute('aria-modal', 'true');
    dialog.setAttribute('tabindex', '-1');
    dialog.style.width = opts.width;
    dialog.style.maxWidth = opts.maxWidth;
    dialog.style.maxHeight = opts.maxHeight;
    
    if (opts.title) {
      dialog.setAttribute('aria-labelledby', 'modal-title');
    }
    
    // Build content
    let html = '';
    
    if (opts.title || opts.closeButton) {
      html += `
        <div class="modal-header">
          ${opts.title ? `<h2 class="modal-title" id="modal-title">${opts.title}</h2>` : '<div></div>'}
          ${opts.closeButton && opts.closable ? `
            <button class="modal-close" aria-label="Close modal">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"/>
              </svg>
            </button>
          ` : ''}
        </div>
      `;
    }
    
    html += '<div class="modal-body"></div>';
    
    if (opts.footer !== false) {
      html += '<div class="modal-footer"></div>';
    }
    
    dialog.innerHTML = html;
    
    // Set body content
    const body = dialog.querySelector('.modal-body');
    if (typeof opts.content === 'string') {
      body.innerHTML = opts.content;
    } else if (opts.content) {
      body.appendChild(opts.content);
    }
    
    // Set footer content
    const footer = dialog.querySelector('.modal-footer');
    if (footer && opts.buttons) {
      opts.buttons.forEach(btn => {
        const button = document.createElement('button');
        button.className = `modal-btn modal-btn-${btn.type || 'secondary'}`;
        button.textContent = btn.label;
        
        button.addEventListener('click', () => {
          if (btn.onClick) {
            const result = btn.onClick();
            if (result !== false && btn.closeOnClick !== false) {
              close(modalData);
            }
          } else {
            close(modalData);
          }
        });
        
        footer.appendChild(button);
      });
    } else if (footer && !opts.buttons) {
      // Default button
      const closeBtn = document.createElement('button');
      closeBtn.className = 'modal-btn modal-btn-primary';
      closeBtn.textContent = 'OK';
      closeBtn.addEventListener('click', () => close(modalData));
      footer.appendChild(closeBtn);
    }
    
    // Close button handler
    const closeButton = dialog.querySelector('.modal-close');
    if (closeButton) {
      closeButton.addEventListener('click', () => close(modalData));
    }
    
    // Backdrop click
    if (opts.closable && opts.closeOnBackdrop) {
      container.addEventListener('click', (e) => {
        if (e.target === container) {
          close(modalData);
        }
      });
    }
    
    // Escape key
    function handleKeydown(e) {
      if (e.key === 'Escape' && opts.closable) {
        e.preventDefault();
        close(modalData);
      }
    }
    document.addEventListener('keydown', handleKeydown);
    
    // Focus trap
    const focusableSelector = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    
    dialog.addEventListener('keydown', (e) => {
      if (e.key !== 'Tab') return;
      
      const focusable = dialog.querySelectorAll(focusableSelector);
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last?.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    });
    
    // Add to DOM
    container.appendChild(dialog);
    document.body.appendChild(container);
    
    // Track modal
    const modalData = {
      container,
      dialog,
      handleKeydown,
      onClose: opts.onClose
    };
    modalsStack.push(modalData);
    
    // Show animation
    requestAnimationFrame(() => {
      dialog.classList.add('show');
      dialog.focus();
    });
    
    return modalData;
  }

  /**
   * Close modal
   */
  function close(modalData) {
    if (!modalData) {
      modalData = modalsStack[modalsStack.length - 1];
    }
    if (!modalData) return;
    
    const { container, dialog, handleKeydown, onClose } = modalData;
    
    // Remove from stack
    const index = modalsStack.indexOf(modalData);
    if (index > -1) {
      modalsStack.splice(index, 1);
    }
    
    // Remove keydown handler
    document.removeEventListener('keydown', handleKeydown);
    
    // Animate out
    dialog.classList.remove('show');
    
    setTimeout(() => {
      container.remove();
      
      // If last modal, remove backdrop
      if (modalsStack.length === 0) {
        removeBackdrop();
        document.body.classList.remove('modal-open');
      }
      
      if (onClose) onClose();
    }, 200);
  }

  /**
   * Close all modals
   */
  function closeAll() {
    [...modalsStack].reverse().forEach(close);
  }

  // Shorthand methods
  function alert(message, title = 'Notice') {
    return new Promise(resolve => {
      create({
        title,
        content: `<p>${message}</p>`,
        closable: false,
        buttons: [
          { label: 'OK', type: 'primary', onClick: () => resolve(true) }
        ]
      });
    });
  }

  function confirm(message, title = 'Confirm') {
    return new Promise(resolve => {
      create({
        title,
        content: `<p>${message}</p>`,
        buttons: [
          { label: 'Cancel', type: 'secondary', onClick: () => resolve(false) },
          { label: 'Confirm', type: 'primary', onClick: () => resolve(true) }
        ],
        onClose: () => resolve(false)
      });
    });
  }

  function prompt(message, defaultValue = '', title = 'Input') {
    return new Promise(resolve => {
      const input = document.createElement('input');
      input.type = 'text';
      input.value = defaultValue;
      input.style.cssText = `
        width: 100%;
        padding: 12px;
        border: 1px solid var(--border, #2D2D44);
        border-radius: 8px;
        background: var(--bg-dark, #0F0F1A);
        color: var(--text-primary, #FFFFFF);
        font-size: 14px;
        margin-top: 8px;
      `;

      const content = document.createElement('div');
      content.innerHTML = `<p>${message}</p>`;
      content.appendChild(input);

      create({
        title,
        content,
        buttons: [
          { label: 'Cancel', type: 'secondary', onClick: () => resolve(null) },
          { label: 'Submit', type: 'primary', onClick: () => resolve(input.value) }
        ],
        onClose: () => resolve(null)
      });

      setTimeout(() => input.focus(), 100);
    });
  }

  // Public API
  return {
    create,
    close,
    closeAll,
    alert,
    confirm,
    prompt
  };
})();

// Make available globally
window.Modal = Modal;
