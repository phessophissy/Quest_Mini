/**
 * Quest Mini - Countdown Timer Module
 * Shows time remaining until daily quest reset (00:00 UTC)
 */

const CountdownTimer = (function() {
  'use strict';

  let timerInterval = null;
  let targetTime = null;
  let elements = {
    container: null,
    hours: null,
    minutes: null,
    seconds: null,
    label: null
  };

  /**
   * Calculate next reset time (00:00 UTC)
   */
  function getNextResetTime() {
    const now = new Date();
    const tomorrow = new Date(Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate() + 1,
      0, 0, 0, 0
    ));
    return tomorrow;
  }

  /**
   * Format time unit with leading zero
   */
  function padZero(num) {
    return num.toString().padStart(2, '0');
  }

  /**
   * Calculate time remaining
   */
  function getTimeRemaining() {
    const now = new Date();
    const diff = targetTime - now;

    if (diff <= 0) {
      // Reset happened, recalculate
      targetTime = getNextResetTime();
      return getTimeRemaining();
    }

    const totalSeconds = Math.floor(diff / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return { hours, minutes, seconds, total: diff };
  }

  /**
   * Update the countdown display
   */
  function updateDisplay() {
    const time = getTimeRemaining();

    if (elements.hours) {
      elements.hours.textContent = padZero(time.hours);
    }
    if (elements.minutes) {
      elements.minutes.textContent = padZero(time.minutes);
    }
    if (elements.seconds) {
      elements.seconds.textContent = padZero(time.seconds);
    }

    // Check if reset just happened (within 1 second)
    if (time.total < 1000) {
      onReset();
    }
  }

  /**
   * Called when daily reset occurs
   */
  function onReset() {
    // Emit event for app to refresh quest status
    const event = new CustomEvent('quest:dailyReset', {
      detail: { timestamp: new Date().toISOString() }
    });
    document.dispatchEvent(event);

    // Show notification
    if (typeof showToast === 'function') {
      showToast('🌅 Daily quests have reset!', 'success');
    }
  }

  /**
   * Create countdown DOM elements
   */
  function createCountdownElement() {
    const container = document.createElement('div');
    container.id = 'quest-countdown';
    container.className = 'quest-countdown';
    container.innerHTML = `
      <div class="countdown-label">⏰ Quests reset in</div>
      <div class="countdown-time">
        <span class="countdown-unit">
          <span class="countdown-value" id="countdown-hours">00</span>
          <span class="countdown-suffix">h</span>
        </span>
        <span class="countdown-separator">:</span>
        <span class="countdown-unit">
          <span class="countdown-value" id="countdown-minutes">00</span>
          <span class="countdown-suffix">m</span>
        </span>
        <span class="countdown-separator">:</span>
        <span class="countdown-unit">
          <span class="countdown-value" id="countdown-seconds">00</span>
          <span class="countdown-suffix">s</span>
        </span>
      </div>
    `;
    return container;
  }

  /**
   * Initialize the countdown timer
   * @param {string|Element} targetSelector - CSS selector or element to append countdown to
   */
  function init(targetSelector = '.quests-container') {
    // Clear any existing timer
    if (timerInterval) {
      clearInterval(timerInterval);
    }

    // Set target time
    targetTime = getNextResetTime();

    // Find or create container
    let target = typeof targetSelector === 'string' 
      ? document.querySelector(targetSelector)
      : targetSelector;

    if (!target) {
      console.warn('Countdown target not found');
      return;
    }

    // Check if countdown already exists
    elements.container = document.getElementById('quest-countdown');
    if (!elements.container) {
      elements.container = createCountdownElement();
      // Insert after section title
      const title = target.querySelector('.section-title');
      if (title) {
        title.parentNode.insertBefore(elements.container, title.nextSibling);
      } else {
        target.prepend(elements.container);
      }
    }

    // Cache element references
    elements.hours = document.getElementById('countdown-hours');
    elements.minutes = document.getElementById('countdown-minutes');
    elements.seconds = document.getElementById('countdown-seconds');

    // Initial update
    updateDisplay();

    // Start interval
    timerInterval = setInterval(updateDisplay, 1000);

    console.log('Countdown timer initialized');
  }

  /**
   * Stop the countdown timer
   */
  function stop() {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
  }

  /**
   * Destroy the countdown timer
   */
  function destroy() {
    stop();
    if (elements.container && elements.container.parentNode) {
      elements.container.parentNode.removeChild(elements.container);
    }
    elements = {
      container: null,
      hours: null,
      minutes: null,
      seconds: null,
      label: null
    };
  }

  /**
   * Get current time remaining
   */
  function getRemaining() {
    return getTimeRemaining();
  }

  // Public API
  return {
    init,
    stop,
    destroy,
    getRemaining
  };
})();

// Make available globally
window.CountdownTimer = CountdownTimer;

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  // Small delay to ensure other elements are loaded
  setTimeout(() => CountdownTimer.init(), 100);
});
