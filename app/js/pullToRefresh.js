/**
 * Quest Mini - Pull to Refresh Module
 * Touch-based pull-to-refresh for mobile devices
 */

const PullToRefresh = (function() {
  'use strict';

  // Configuration
  const config = {
    threshold: 80,           // Pull distance to trigger refresh
    maxPull: 120,           // Maximum pull distance
    resistance: 2.5,        // Pull resistance factor
    refreshTimeout: 10000   // Max refresh duration
  };

  // State
  let startY = 0;
  let currentY = 0;
  let isPulling = false;
  let isRefreshing = false;
  let pullIndicator = null;

  /**
   * Create the pull indicator element
   */
  function createIndicator() {
    const indicator = document.createElement('div');
    indicator.id = 'pull-refresh-indicator';
    indicator.className = 'pull-refresh-indicator';
    indicator.innerHTML = `
      <div class="pull-refresh-icon">
        <svg viewBox="0 0 24 24" width="24" height="24">
          <path fill="currentColor" d="M17.65 6.35A7.958 7.958 0 0012 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0112 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
        </svg>
      </div>
      <span class="pull-refresh-text">Pull to refresh</span>
    `;
    document.body.insertBefore(indicator, document.body.firstChild);
    return indicator;
  }

  /**
   * Add required styles
   */
  function addStyles() {
    if (document.getElementById('pull-refresh-styles')) return;

    const styles = document.createElement('style');
    styles.id = 'pull-refresh-styles';
    styles.textContent = `
      .pull-refresh-indicator {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        height: 60px;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        background: var(--bg-card, #1A1A2E);
        color: var(--text-secondary, #A1A1AA);
        transform: translateY(-100%);
        transition: transform 0.2s ease;
        z-index: 9998;
        font-size: 14px;
        border-bottom: 1px solid var(--border, #2D2D44);
      }
      
      .pull-refresh-indicator.visible {
        transform: translateY(0);
      }
      
      .pull-refresh-indicator.refreshing {
        background: var(--primary, #8B5CF6);
        color: white;
      }
      
      .pull-refresh-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        transition: transform 0.2s ease;
      }
      
      .pull-refresh-indicator.ready .pull-refresh-icon {
        transform: rotate(180deg);
      }
      
      .pull-refresh-indicator.refreshing .pull-refresh-icon {
        animation: spin 1s linear infinite;
      }
      
      @keyframes spin {
        100% { transform: rotate(360deg); }
      }
      
      body.pull-refreshing {
        overflow: hidden;
        touch-action: none;
      }
    `;
    document.head.appendChild(styles);
  }

  /**
   * Handle touch start
   */
  function handleTouchStart(e) {
    if (isRefreshing) return;
    if (window.scrollY > 0) return;
    
    startY = e.touches[0].pageY;
    isPulling = true;
  }

  /**
   * Handle touch move
   */
  function handleTouchMove(e) {
    if (!isPulling || isRefreshing) return;
    if (window.scrollY > 0) {
      isPulling = false;
      return;
    }

    currentY = e.touches[0].pageY;
    const pullDistance = Math.min(
      (currentY - startY) / config.resistance,
      config.maxPull
    );

    if (pullDistance > 0) {
      e.preventDefault();
      updateIndicator(pullDistance);
    }
  }

  /**
   * Handle touch end
   */
  function handleTouchEnd() {
    if (!isPulling) return;

    const pullDistance = (currentY - startY) / config.resistance;
    
    if (pullDistance >= config.threshold && !isRefreshing) {
      triggerRefresh();
    } else {
      hideIndicator();
    }

    isPulling = false;
    startY = 0;
    currentY = 0;
  }

  /**
   * Update the pull indicator
   */
  function updateIndicator(distance) {
    if (!pullIndicator) return;

    pullIndicator.classList.add('visible');
    
    const progress = Math.min(distance / config.threshold, 1);
    pullIndicator.style.transform = `translateY(${distance - 60}px)`;
    
    const text = pullIndicator.querySelector('.pull-refresh-text');
    if (progress >= 1) {
      pullIndicator.classList.add('ready');
      if (text) text.textContent = 'Release to refresh';
    } else {
      pullIndicator.classList.remove('ready');
      if (text) text.textContent = 'Pull to refresh';
    }
  }

  /**
   * Hide the indicator
   */
  function hideIndicator() {
    if (!pullIndicator) return;
    
    pullIndicator.classList.remove('visible', 'ready', 'refreshing');
    pullIndicator.style.transform = 'translateY(-100%)';
    document.body.classList.remove('pull-refreshing');
  }

  /**
   * Trigger refresh
   */
  async function triggerRefresh() {
    if (isRefreshing) return;

    isRefreshing = true;
    document.body.classList.add('pull-refreshing');
    
    if (pullIndicator) {
      pullIndicator.classList.remove('ready');
      pullIndicator.classList.add('visible', 'refreshing');
      pullIndicator.style.transform = 'translateY(0)';
      
      const text = pullIndicator.querySelector('.pull-refresh-text');
      if (text) text.textContent = 'Refreshing...';
    }

    // Haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }

    try {
      // Emit refresh event
      const event = new CustomEvent('pullRefresh', {
        detail: { timestamp: Date.now() }
      });
      document.dispatchEvent(event);

      // Call global refresh function if available
      if (typeof loadUserData === 'function') {
        await loadUserData();
      } else if (typeof QuestMini !== 'undefined' && typeof QuestMini.refreshData === 'function') {
        await QuestMini.refreshData();
      }

      // Show success briefly
      if (pullIndicator) {
        const text = pullIndicator.querySelector('.pull-refresh-text');
        if (text) text.textContent = '✓ Updated!';
      }

      await new Promise(resolve => setTimeout(resolve, 500));

    } catch (error) {
      console.error('Refresh failed:', error);
      
      if (pullIndicator) {
        const text = pullIndicator.querySelector('.pull-refresh-text');
        if (text) text.textContent = 'Refresh failed';
      }

      await new Promise(resolve => setTimeout(resolve, 1000));
    } finally {
      isRefreshing = false;
      hideIndicator();
    }
  }

  /**
   * Initialize pull to refresh
   */
  function init() {
    // Only on touch devices
    if (!('ontouchstart' in window)) {
      console.log('Pull to refresh: Touch not supported');
      return;
    }

    addStyles();
    pullIndicator = createIndicator();

    // Add event listeners
    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });

    console.log('Pull to refresh initialized');
  }

  /**
   * Destroy pull to refresh
   */
  function destroy() {
    document.removeEventListener('touchstart', handleTouchStart);
    document.removeEventListener('touchmove', handleTouchMove);
    document.removeEventListener('touchend', handleTouchEnd);

    if (pullIndicator && pullIndicator.parentNode) {
      pullIndicator.parentNode.removeChild(pullIndicator);
    }
    pullIndicator = null;
  }

  // Public API
  return {
    init,
    destroy,
    refresh: triggerRefresh
  };
})();

// Make available globally
window.PullToRefresh = PullToRefresh;

// Auto-initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  PullToRefresh.init();
});
