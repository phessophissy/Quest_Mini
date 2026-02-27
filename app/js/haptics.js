/**
 * Quest Mini - Haptic Feedback Module
 * Cross-platform haptic/vibration feedback for enhanced UX
 */

const Haptics = (function() {
  'use strict';

  // Check for support
  const isSupported = 'vibrate' in navigator;
  
  // Vibration patterns (in milliseconds)
  const patterns = {
    // Light tap - button press
    light: [10],
    
    // Medium tap - selection change
    medium: [20],
    
    // Heavy tap - important action
    heavy: [30],
    
    // Success - quest completed
    success: [10, 50, 10, 50, 30],
    
    // Error - something failed
    error: [50, 100, 50],
    
    // Warning - attention needed
    warning: [30, 50, 30],
    
    // Notification - new alert
    notification: [10, 30, 10],
    
    // Double tap - confirmation
    doubleTap: [10, 50, 10],
    
    // Long press - held action
    longPress: [5, 5, 5, 5, 5, 5, 5, 5, 10],
    
    // Celebration - big achievement
    celebration: [10, 30, 10, 30, 10, 50, 20, 100, 30],
    
    // Heartbeat - pulse effect
    heartbeat: [20, 100, 10, 100, 20, 300],
    
    // Streak - milestone reached
    streak: [10, 50, 20, 50, 30, 50, 40]
  };

  // Settings
  let enabled = true;
  let intensity = 1; // 0-1 multiplier

  /**
   * Load settings from localStorage
   */
  function loadSettings() {
    try {
      const saved = localStorage.getItem('questmini_haptics');
      if (saved) {
        const settings = JSON.parse(saved);
        enabled = settings.enabled !== false;
        intensity = settings.intensity ?? 1;
      }
    } catch (e) {
      // Use defaults
    }
  }

  /**
   * Save settings to localStorage
   */
  function saveSettings() {
    try {
      localStorage.setItem('questmini_haptics', JSON.stringify({
        enabled,
        intensity
      }));
    } catch (e) {
      // Ignore
    }
  }

  /**
   * Apply intensity to a pattern
   */
  function applyIntensity(pattern) {
    if (intensity >= 1) return pattern;
    return pattern.map((duration, i) => {
      // Only modify vibration durations (even indices)
      if (i % 2 === 0) {
        return Math.round(duration * intensity);
      }
      return duration;
    });
  }

  /**
   * Vibrate with a pattern
   */
  function vibrate(pattern) {
    if (!isSupported || !enabled) return false;
    
    try {
      const adjusted = applyIntensity(pattern);
      navigator.vibrate(adjusted);
      return true;
    } catch (e) {
      console.warn('Haptic feedback failed:', e);
      return false;
    }
  }

  /**
   * Light tap feedback
   */
  function light() {
    return vibrate(patterns.light);
  }

  /**
   * Medium tap feedback
   */
  function medium() {
    return vibrate(patterns.medium);
  }

  /**
   * Heavy tap feedback
   */
  function heavy() {
    return vibrate(patterns.heavy);
  }

  /**
   * Success feedback
   */
  function success() {
    return vibrate(patterns.success);
  }

  /**
   * Error feedback
   */
  function error() {
    return vibrate(patterns.error);
  }

  /**
   * Warning feedback
   */
  function warning() {
    return vibrate(patterns.warning);
  }

  /**
   * Notification feedback
   */
  function notification() {
    return vibrate(patterns.notification);
  }

  /**
   * Double tap feedback
   */
  function doubleTap() {
    return vibrate(patterns.doubleTap);
  }

  /**
   * Celebration feedback
   */
  function celebration() {
    return vibrate(patterns.celebration);
  }

  /**
   * Heartbeat feedback
   */
  function heartbeat() {
    return vibrate(patterns.heartbeat);
  }

  /**
   * Streak milestone feedback
   */
  function streak() {
    return vibrate(patterns.streak);
  }

  /**
   * Custom pattern
   */
  function custom(pattern) {
    if (Array.isArray(pattern)) {
      return vibrate(pattern);
    }
    return false;
  }

  /**
   * Stop vibration
   */
  function stop() {
    if (isSupported) {
      navigator.vibrate(0);
    }
  }

  /**
   * Enable/disable haptics
   */
  function setEnabled(value) {
    enabled = !!value;
    saveSettings();
  }

  /**
   * Set intensity (0-1)
   */
  function setIntensity(value) {
    intensity = Math.max(0, Math.min(1, value));
    saveSettings();
  }

  /**
   * Get current settings
   */
  function getSettings() {
    return {
      supported: isSupported,
      enabled,
      intensity
    };
  }

  /**
   * Auto-attach to common button clicks
   */
  function autoAttach() {
    document.addEventListener('click', (e) => {
      const target = e.target.closest('button, .btn, [role="button"]');
      if (target) {
        // Check for specific feedback types
        if (target.classList.contains('btn-primary') || target.id === 'questBtn') {
          medium();
        } else if (target.classList.contains('btn-success')) {
          light();
        } else {
          light();
        }
      }
    });

    // Quest completion event
    document.addEventListener('questComplete', () => {
      celebration();
    });

    // Error events
    document.addEventListener('questError', () => {
      error();
    });

    // Streak milestone
    document.addEventListener('streakMilestone', () => {
      streak();
    });
  }

  // Initialize
  loadSettings();

  // Public API
  return {
    // Feedback methods
    light,
    medium,
    heavy,
    success,
    error,
    warning,
    notification,
    doubleTap,
    celebration,
    heartbeat,
    streak,
    custom,
    stop,
    
    // Configuration
    setEnabled,
    setIntensity,
    getSettings,
    autoAttach,
    
    // Info
    isSupported
  };
})();

// Make available globally
window.Haptics = Haptics;

// Auto-attach on DOM ready (optional, can be disabled)
document.addEventListener('DOMContentLoaded', () => {
  // Only auto-attach if desired
  // Haptics.autoAttach();
});
