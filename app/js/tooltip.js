/**
 * Quest Mini - Tooltip Component
 * Lightweight, customizable tooltips
 */

const Tooltip = (function() {
  'use strict';

  // Active tooltip element
  let activeTooltip = null;
  let hideTimeout = null;

  // Default options
  const defaults = {
    placement: 'top',      // top, bottom, left, right
    delay: 200,            // Show delay in ms
    hideDelay: 100,        // Hide delay in ms
    offset: 8,             // Distance from target
    maxWidth: 250,         // Max tooltip width
    arrow: true            // Show arrow
  };

  /**
   * Add tooltip styles
   */
  function addStyles() {
    if (document.getElementById('tooltip-styles')) return;

    const styles = document.createElement('style');
    styles.id = 'tooltip-styles';
    styles.textContent = `
      .qm-tooltip {
        position: fixed;
        z-index: 10001;
        padding: 8px 12px;
        background: var(--bg-card, #1A1A2E);
        color: var(--text-primary, #FFFFFF);
        border: 1px solid var(--border, #2D2D44);
        border-radius: 8px;
        font-size: 13px;
        line-height: 1.4;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        pointer-events: none;
        opacity: 0;
        transform: scale(0.95);
        transition: opacity 0.15s ease, transform 0.15s ease;
      }
      
      .qm-tooltip.show {
        opacity: 1;
        transform: scale(1);
      }
      
      .qm-tooltip-arrow {
        position: absolute;
        width: 8px;
        height: 8px;
        background: inherit;
        border: inherit;
        transform: rotate(45deg);
      }
      
      .qm-tooltip[data-placement="top"] .qm-tooltip-arrow {
        bottom: -5px;
        left: 50%;
        margin-left: -4px;
        border-top: none;
        border-left: none;
      }
      
      .qm-tooltip[data-placement="bottom"] .qm-tooltip-arrow {
        top: -5px;
        left: 50%;
        margin-left: -4px;
        border-bottom: none;
        border-right: none;
      }
      
      .qm-tooltip[data-placement="left"] .qm-tooltip-arrow {
        right: -5px;
        top: 50%;
        margin-top: -4px;
        border-left: none;
        border-bottom: none;
      }
      
      .qm-tooltip[data-placement="right"] .qm-tooltip-arrow {
        left: -5px;
        top: 50%;
        margin-top: -4px;
        border-right: none;
        border-top: none;
      }
      
      /* Tooltip trigger styles */
      [data-tooltip] {
        cursor: help;
      }
      
      .tooltip-info-icon {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 16px;
        height: 16px;
        border-radius: 50%;
        background: var(--border, #2D2D44);
        color: var(--text-secondary, #A1A1AA);
        font-size: 10px;
        font-weight: 600;
        cursor: help;
        margin-left: 4px;
        vertical-align: middle;
      }
      
      .tooltip-info-icon:hover {
        background: var(--primary, #8B5CF6);
        color: white;
      }
    `;
    document.head.appendChild(styles);
  }

  /**
   * Create tooltip element
   */
  function createTooltipElement(content, options) {
    const tooltip = document.createElement('div');
    tooltip.className = 'qm-tooltip';
    tooltip.setAttribute('role', 'tooltip');
    tooltip.style.maxWidth = `${options.maxWidth}px`;
    
    if (typeof content === 'string') {
      tooltip.innerHTML = content;
    } else {
      tooltip.appendChild(content);
    }
    
    if (options.arrow) {
      const arrow = document.createElement('div');
      arrow.className = 'qm-tooltip-arrow';
      tooltip.appendChild(arrow);
    }
    
    return tooltip;
  }

  /**
   * Calculate tooltip position
   */
  function getPosition(target, tooltip, placement, offset) {
    const targetRect = target.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();
    
    let top, left;
    
    switch (placement) {
      case 'top':
        top = targetRect.top - tooltipRect.height - offset;
        left = targetRect.left + (targetRect.width - tooltipRect.width) / 2;
        break;
      case 'bottom':
        top = targetRect.bottom + offset;
        left = targetRect.left + (targetRect.width - tooltipRect.width) / 2;
        break;
      case 'left':
        top = targetRect.top + (targetRect.height - tooltipRect.height) / 2;
        left = targetRect.left - tooltipRect.width - offset;
        break;
      case 'right':
        top = targetRect.top + (targetRect.height - tooltipRect.height) / 2;
        left = targetRect.right + offset;
        break;
    }
    
    // Keep within viewport
    const padding = 8;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    if (left < padding) left = padding;
    if (left + tooltipRect.width > viewportWidth - padding) {
      left = viewportWidth - tooltipRect.width - padding;
    }
    if (top < padding) top = padding;
    if (top + tooltipRect.height > viewportHeight - padding) {
      top = viewportHeight - tooltipRect.height - padding;
    }
    
    return { top, left };
  }

  /**
   * Show tooltip
   */
  function show(target, content, options = {}) {
    const opts = { ...defaults, ...options };
    
    // Hide existing tooltip
    hide();
    
    // Create new tooltip
    const tooltip = createTooltipElement(content, opts);
    tooltip.setAttribute('data-placement', opts.placement);
    document.body.appendChild(tooltip);
    
    // Position tooltip
    const { top, left } = getPosition(target, tooltip, opts.placement, opts.offset);
    tooltip.style.top = `${top}px`;
    tooltip.style.left = `${left}px`;
    
    // Show with animation
    requestAnimationFrame(() => {
      tooltip.classList.add('show');
    });
    
    activeTooltip = tooltip;
  }

  /**
   * Hide tooltip
   */
  function hide() {
    if (activeTooltip) {
      activeTooltip.classList.remove('show');
      const tooltip = activeTooltip;
      setTimeout(() => tooltip.remove(), 150);
      activeTooltip = null;
    }
  }

  /**
   * Attach tooltip to element
   */
  function attach(element, content, options = {}) {
    const opts = { ...defaults, ...options };
    let showTimeout = null;
    
    function handleMouseEnter() {
      clearTimeout(hideTimeout);
      showTimeout = setTimeout(() => {
        show(element, content, opts);
      }, opts.delay);
    }
    
    function handleMouseLeave() {
      clearTimeout(showTimeout);
      hideTimeout = setTimeout(hide, opts.hideDelay);
    }
    
    element.addEventListener('mouseenter', handleMouseEnter);
    element.addEventListener('mouseleave', handleMouseLeave);
    element.addEventListener('focus', handleMouseEnter);
    element.addEventListener('blur', handleMouseLeave);
    
    // Return cleanup function
    return () => {
      element.removeEventListener('mouseenter', handleMouseEnter);
      element.removeEventListener('mouseleave', handleMouseLeave);
      element.removeEventListener('focus', handleMouseEnter);
      element.removeEventListener('blur', handleMouseLeave);
    };
  }

  /**
   * Initialize tooltips from data attributes
   */
  function init() {
    addStyles();
    
    // Attach to elements with data-tooltip attribute
    document.querySelectorAll('[data-tooltip]').forEach(el => {
      const content = el.getAttribute('data-tooltip');
      const placement = el.getAttribute('data-tooltip-placement') || 'top';
      attach(el, content, { placement });
    });

    // Watch for new elements
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === 1) {
            if (node.hasAttribute && node.hasAttribute('data-tooltip')) {
              const content = node.getAttribute('data-tooltip');
              const placement = node.getAttribute('data-tooltip-placement') || 'top';
              attach(node, content, { placement });
            }
            // Check child nodes
            node.querySelectorAll && node.querySelectorAll('[data-tooltip]').forEach(el => {
              const content = el.getAttribute('data-tooltip');
              const placement = el.getAttribute('data-tooltip-placement') || 'top';
              attach(el, content, { placement });
            });
          }
        });
      });
    });
    
    observer.observe(document.body, { childList: true, subtree: true });
  }

  /**
   * Create info icon with tooltip
   */
  function createInfoIcon(content, options = {}) {
    const icon = document.createElement('span');
    icon.className = 'tooltip-info-icon';
    icon.textContent = '?';
    icon.setAttribute('tabindex', '0');
    icon.setAttribute('aria-label', 'More information');
    
    attach(icon, content, options);
    
    return icon;
  }

  // Public API
  return {
    init,
    show,
    hide,
    attach,
    createInfoIcon
  };
})();

// Make available globally
window.Tooltip = Tooltip;

// Auto-initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  Tooltip.init();
});
