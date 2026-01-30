/**
 * Quest Mini - Swipe Gesture Handler
 * Touch-based swipe detection for mobile interactions
 */

const SwipeGestures = (function() {
  'use strict';

  // Configuration defaults
  const defaults = {
    threshold: 50,           // Minimum distance for swipe
    velocityThreshold: 0.3,  // Minimum velocity
    timeout: 500,            // Max time for swipe gesture
    disableScroll: false     // Prevent scroll during swipe
  };

  // Active gesture handlers
  const handlers = new Map();

  /**
   * Calculate distance between two points
   */
  function getDistance(x1, y1, x2, y2) {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
  }

  /**
   * Get swipe direction
   */
  function getDirection(deltaX, deltaY) {
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      return deltaX > 0 ? 'right' : 'left';
    }
    return deltaY > 0 ? 'down' : 'up';
  }

  /**
   * Create gesture handler for an element
   */
  function attach(element, callbacks, options = {}) {
    const config = { ...defaults, ...options };
    const {
      onSwipeLeft,
      onSwipeRight,
      onSwipeUp,
      onSwipeDown,
      onSwipe,
      onSwipeStart,
      onSwipeMove,
      onSwipeEnd
    } = callbacks;

    let startX = 0;
    let startY = 0;
    let startTime = 0;
    let isSwiping = false;

    function handleTouchStart(e) {
      const touch = e.touches[0];
      startX = touch.clientX;
      startY = touch.clientY;
      startTime = Date.now();
      isSwiping = true;

      if (onSwipeStart) {
        onSwipeStart({
          x: startX,
          y: startY,
          originalEvent: e
        });
      }
    }

    function handleTouchMove(e) {
      if (!isSwiping) return;

      const touch = e.touches[0];
      const deltaX = touch.clientX - startX;
      const deltaY = touch.clientY - startY;
      const direction = getDirection(deltaX, deltaY);

      if (config.disableScroll) {
        e.preventDefault();
      }

      if (onSwipeMove) {
        onSwipeMove({
          x: touch.clientX,
          y: touch.clientY,
          deltaX,
          deltaY,
          direction,
          originalEvent: e
        });
      }
    }

    function handleTouchEnd(e) {
      if (!isSwiping) return;
      isSwiping = false;

      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - startX;
      const deltaY = touch.clientY - startY;
      const distance = getDistance(startX, startY, touch.clientX, touch.clientY);
      const duration = Date.now() - startTime;
      const velocity = distance / duration;
      const direction = getDirection(deltaX, deltaY);

      const swipeData = {
        startX,
        startY,
        endX: touch.clientX,
        endY: touch.clientY,
        deltaX,
        deltaY,
        distance,
        duration,
        velocity,
        direction,
        originalEvent: e
      };

      if (onSwipeEnd) {
        onSwipeEnd(swipeData);
      }

      // Check if it's a valid swipe
      if (distance < config.threshold) return;
      if (duration > config.timeout) return;
      if (velocity < config.velocityThreshold) return;

      // Call direction-specific callback
      if (direction === 'left' && onSwipeLeft) {
        onSwipeLeft(swipeData);
      } else if (direction === 'right' && onSwipeRight) {
        onSwipeRight(swipeData);
      } else if (direction === 'up' && onSwipeUp) {
        onSwipeUp(swipeData);
      } else if (direction === 'down' && onSwipeDown) {
        onSwipeDown(swipeData);
      }

      // Call generic swipe callback
      if (onSwipe) {
        onSwipe(swipeData);
      }
    }

    function handleTouchCancel() {
      isSwiping = false;
    }

    // Attach listeners
    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchmove', handleTouchMove, { passive: !config.disableScroll });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });
    element.addEventListener('touchcancel', handleTouchCancel, { passive: true });

    // Store handler reference
    const handlerData = {
      element,
      handleTouchStart,
      handleTouchMove,
      handleTouchEnd,
      handleTouchCancel
    };
    handlers.set(element, handlerData);

    // Return detach function
    return () => detach(element);
  }

  /**
   * Detach gesture handler
   */
  function detach(element) {
    const handler = handlers.get(element);
    if (!handler) return;

    element.removeEventListener('touchstart', handler.handleTouchStart);
    element.removeEventListener('touchmove', handler.handleTouchMove);
    element.removeEventListener('touchend', handler.handleTouchEnd);
    element.removeEventListener('touchcancel', handler.handleTouchCancel);

    handlers.delete(element);
  }

  /**
   * Create a swipeable card component
   */
  function createSwipeableCard(options = {}) {
    const {
      onSwipeLeft = null,
      onSwipeRight = null,
      content = '',
      leftAction = { color: '#EF4444', icon: '✕', label: 'Delete' },
      rightAction = { color: '#10B981', icon: '✓', label: 'Complete' }
    } = options;

    const card = document.createElement('div');
    card.className = 'swipeable-card';
    card.innerHTML = `
      <div class="swipeable-card-actions left" style="background: ${leftAction.color}">
        <span class="action-icon">${leftAction.icon}</span>
        <span class="action-label">${leftAction.label}</span>
      </div>
      <div class="swipeable-card-actions right" style="background: ${rightAction.color}">
        <span class="action-icon">${rightAction.icon}</span>
        <span class="action-label">${rightAction.label}</span>
      </div>
      <div class="swipeable-card-content">${content}</div>
    `;

    // Add styles if not present
    addSwipeableCardStyles();

    const contentEl = card.querySelector('.swipeable-card-content');
    let currentX = 0;
    const maxSwipe = 80;

    attach(card, {
      onSwipeMove: (data) => {
        const x = Math.max(-maxSwipe, Math.min(maxSwipe, data.deltaX));
        currentX = x;
        contentEl.style.transform = `translateX(${x}px)`;
        
        // Show action indicators
        card.classList.toggle('showing-left', x < -20);
        card.classList.toggle('showing-right', x > 20);
      },
      onSwipeEnd: () => {
        contentEl.style.transition = 'transform 0.3s ease';
        
        if (currentX < -maxSwipe * 0.7 && onSwipeLeft) {
          contentEl.style.transform = `translateX(-100%)`;
          setTimeout(() => {
            onSwipeLeft();
            card.remove();
          }, 300);
        } else if (currentX > maxSwipe * 0.7 && onSwipeRight) {
          contentEl.style.transform = `translateX(100%)`;
          setTimeout(() => {
            onSwipeRight();
            card.remove();
          }, 300);
        } else {
          contentEl.style.transform = 'translateX(0)';
        }
        
        card.classList.remove('showing-left', 'showing-right');
        
        setTimeout(() => {
          contentEl.style.transition = '';
        }, 300);
      }
    }, { disableScroll: true });

    return card;
  }

  /**
   * Add swipeable card styles
   */
  function addSwipeableCardStyles() {
    if (document.getElementById('swipeable-card-styles')) return;

    const styles = document.createElement('style');
    styles.id = 'swipeable-card-styles';
    styles.textContent = `
      .swipeable-card {
        position: relative;
        overflow: hidden;
        border-radius: 12px;
        margin-bottom: 8px;
      }
      
      .swipeable-card-actions {
        position: absolute;
        top: 0;
        bottom: 0;
        width: 80px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        color: white;
        gap: 4px;
        opacity: 0;
        transition: opacity 0.2s;
      }
      
      .swipeable-card-actions.left {
        left: 0;
      }
      
      .swipeable-card-actions.right {
        right: 0;
      }
      
      .swipeable-card.showing-left .swipeable-card-actions.left,
      .swipeable-card.showing-right .swipeable-card-actions.right {
        opacity: 1;
      }
      
      .swipeable-card-actions .action-icon {
        font-size: 24px;
      }
      
      .swipeable-card-actions .action-label {
        font-size: 11px;
        font-weight: 500;
      }
      
      .swipeable-card-content {
        background: var(--bg-card, #1A1A2E);
        border: 1px solid var(--border, #2D2D44);
        border-radius: 12px;
        padding: 16px;
        position: relative;
        z-index: 1;
      }
    `;
    document.head.appendChild(styles);
  }

  /**
   * Create a swipe navigation container
   */
  function createSwipeNavigation(pages, options = {}) {
    const { startIndex = 0, onPageChange = null } = options;
    
    const container = document.createElement('div');
    container.className = 'swipe-navigation';
    container.innerHTML = `
      <div class="swipe-pages"></div>
      <div class="swipe-dots"></div>
    `;

    // Add styles
    addSwipeNavStyles();

    const pagesContainer = container.querySelector('.swipe-pages');
    const dotsContainer = container.querySelector('.swipe-dots');
    
    let currentIndex = startIndex;

    // Add pages
    pages.forEach((page, index) => {
      const pageEl = document.createElement('div');
      pageEl.className = 'swipe-page';
      if (typeof page === 'string') {
        pageEl.innerHTML = page;
      } else {
        pageEl.appendChild(page);
      }
      pagesContainer.appendChild(pageEl);

      // Add dot
      const dot = document.createElement('button');
      dot.className = `swipe-dot ${index === currentIndex ? 'active' : ''}`;
      dot.addEventListener('click', () => goToPage(index));
      dotsContainer.appendChild(dot);
    });

    function goToPage(index) {
      if (index < 0 || index >= pages.length) return;
      
      currentIndex = index;
      pagesContainer.style.transform = `translateX(-${index * 100}%)`;
      
      dotsContainer.querySelectorAll('.swipe-dot').forEach((dot, i) => {
        dot.classList.toggle('active', i === index);
      });

      if (onPageChange) {
        onPageChange(index);
      }
    }

    // Attach swipe handler
    attach(pagesContainer, {
      onSwipeLeft: () => goToPage(currentIndex + 1),
      onSwipeRight: () => goToPage(currentIndex - 1)
    });

    container.goToPage = goToPage;
    container.getCurrentIndex = () => currentIndex;

    return container;
  }

  /**
   * Add swipe navigation styles
   */
  function addSwipeNavStyles() {
    if (document.getElementById('swipe-nav-styles')) return;

    const styles = document.createElement('style');
    styles.id = 'swipe-nav-styles';
    styles.textContent = `
      .swipe-navigation {
        overflow: hidden;
      }
      
      .swipe-pages {
        display: flex;
        transition: transform 0.3s ease;
      }
      
      .swipe-page {
        flex: 0 0 100%;
        min-height: 200px;
      }
      
      .swipe-dots {
        display: flex;
        justify-content: center;
        gap: 8px;
        padding: 16px;
      }
      
      .swipe-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        border: none;
        background: var(--border, #2D2D44);
        cursor: pointer;
        transition: all 0.2s;
        padding: 0;
      }
      
      .swipe-dot.active {
        background: var(--primary, #8B5CF6);
        transform: scale(1.2);
      }
    `;
    document.head.appendChild(styles);
  }

  // Public API
  return {
    attach,
    detach,
    createSwipeableCard,
    createSwipeNavigation,
    getDirection,
    getDistance
  };
})();

// Make available globally
window.SwipeGestures = SwipeGestures;
