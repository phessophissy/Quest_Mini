/**
 * Quest Mini - Theme Toggle Module
 * Dark/Light mode switching with system preference detection
 */

const ThemeManager = (function() {
  'use strict';

  // Theme definitions
  const themes = {
    dark: {
      '--primary': '#8B5CF6',
      '--primary-dark': '#7C3AED',
      '--primary-light': '#A78BFA',
      '--secondary': '#06B6D4',
      '--success': '#10B981',
      '--warning': '#F59E0B',
      '--error': '#EF4444',
      '--bg-dark': '#0F0F1A',
      '--bg-card': '#1A1A2E',
      '--bg-card-hover': '#252542',
      '--bg-input': '#16162B',
      '--text-primary': '#FFFFFF',
      '--text-secondary': '#A1A1AA',
      '--text-muted': '#71717A',
      '--border': '#2D2D44',
      '--shadow': 'rgba(0, 0, 0, 0.5)',
      '--gradient-start': '#8B5CF6',
      '--gradient-end': '#06B6D4'
    },
    light: {
      '--primary': '#7C3AED',
      '--primary-dark': '#6D28D9',
      '--primary-light': '#8B5CF6',
      '--secondary': '#0891B2',
      '--success': '#059669',
      '--warning': '#D97706',
      '--error': '#DC2626',
      '--bg-dark': '#F8FAFC',
      '--bg-card': '#FFFFFF',
      '--bg-card-hover': '#F1F5F9',
      '--bg-input': '#F1F5F9',
      '--text-primary': '#1E293B',
      '--text-secondary': '#64748B',
      '--text-muted': '#94A3B8',
      '--border': '#E2E8F0',
      '--shadow': 'rgba(0, 0, 0, 0.1)',
      '--gradient-start': '#7C3AED',
      '--gradient-end': '#0891B2'
    }
  };

  // Current theme
  let currentTheme = 'dark';
  let useSystemPreference = true;

  /**
   * Detect system color scheme preference
   */
  function getSystemPreference() {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
      return 'light';
    }
    return 'dark';
  }

  /**
   * Load saved theme preference
   */
  function loadPreference() {
    try {
      const saved = localStorage.getItem('questmini_theme');
      if (saved) {
        const pref = JSON.parse(saved);
        useSystemPreference = pref.useSystem !== false;
        if (!useSystemPreference && pref.theme) {
          currentTheme = pref.theme;
        } else {
          currentTheme = getSystemPreference();
        }
      } else {
        currentTheme = getSystemPreference();
      }
    } catch (e) {
      currentTheme = getSystemPreference();
    }
  }

  /**
   * Save theme preference
   */
  function savePreference() {
    try {
      localStorage.setItem('questmini_theme', JSON.stringify({
        theme: currentTheme,
        useSystem: useSystemPreference
      }));
    } catch (e) {
      // Ignore
    }
  }

  /**
   * Apply theme to document
   */
  function applyTheme(theme) {
    const root = document.documentElement;
    const themeVars = themes[theme];
    
    if (!themeVars) return;

    Object.entries(themeVars).forEach(([property, value]) => {
      root.style.setProperty(property, value);
    });

    // Update body class
    document.body.classList.remove('theme-dark', 'theme-light');
    document.body.classList.add(`theme-${theme}`);

    // Update meta theme-color
    let metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (!metaThemeColor) {
      metaThemeColor = document.createElement('meta');
      metaThemeColor.name = 'theme-color';
      document.head.appendChild(metaThemeColor);
    }
    metaThemeColor.content = theme === 'dark' ? '#0F0F1A' : '#F8FAFC';

    // Dispatch event
    document.dispatchEvent(new CustomEvent('themeChange', {
      detail: { theme }
    }));
  }

  /**
   * Set theme
   */
  function setTheme(theme) {
    if (theme !== 'dark' && theme !== 'light') return;
    
    currentTheme = theme;
    useSystemPreference = false;
    applyTheme(theme);
    savePreference();
  }

  /**
   * Toggle between dark and light
   */
  function toggle() {
    setTheme(currentTheme === 'dark' ? 'light' : 'dark');
    return currentTheme;
  }

  /**
   * Use system preference
   */
  function useSystem() {
    useSystemPreference = true;
    currentTheme = getSystemPreference();
    applyTheme(currentTheme);
    savePreference();
  }

  /**
   * Get current theme
   */
  function getTheme() {
    return currentTheme;
  }

  /**
   * Get settings
   */
  function getSettings() {
    return {
      theme: currentTheme,
      useSystemPreference,
      systemPreference: getSystemPreference()
    };
  }

  /**
   * Create theme toggle button
   */
  function createToggleButton(containerId) {
    const container = containerId 
      ? document.getElementById(containerId) 
      : document.body;
    
    if (!container) return null;

    const button = document.createElement('button');
    button.id = 'theme-toggle-btn';
    button.className = 'theme-toggle-btn';
    button.setAttribute('aria-label', 'Toggle theme');
    button.setAttribute('title', 'Toggle dark/light mode');
    
    updateButtonIcon(button);
    
    button.addEventListener('click', () => {
      toggle();
      updateButtonIcon(button);
    });

    container.appendChild(button);
    return button;
  }

  /**
   * Update toggle button icon
   */
  function updateButtonIcon(button) {
    if (!button) return;
    
    button.innerHTML = currentTheme === 'dark' 
      ? `<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
           <path d="M12 3a1 1 0 0 1 1 1v1a1 1 0 1 1-2 0V4a1 1 0 0 1 1-1zm0 15a1 1 0 0 1 1 1v1a1 1 0 1 1-2 0v-1a1 1 0 0 1 1-1zm9-6a1 1 0 0 1-1 1h-1a1 1 0 1 1 0-2h1a1 1 0 0 1 1 1zM5 12a1 1 0 0 1-1 1H3a1 1 0 1 1 0-2h1a1 1 0 0 1 1 1zm14.95 5.64a1 1 0 0 1-1.41 0l-.71-.71a1 1 0 0 1 1.41-1.41l.71.71a1 1 0 0 1 0 1.41zm-2.12-12.73a1 1 0 0 1 0 1.41l-.71.71a1 1 0 0 1-1.41-1.41l.71-.71a1 1 0 0 1 1.41 0zm-12.02 0a1 1 0 0 1 1.41 0l.71.71a1 1 0 1 1-1.41 1.41l-.71-.71a1 1 0 0 1 0-1.41zM5.76 17.64a1 1 0 0 1 0-1.41l.71-.71a1 1 0 0 1 1.41 1.41l-.71.71a1 1 0 0 1-1.41 0zM12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z"/>
         </svg>`
      : `<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
           <path d="M21.64 13a1 1 0 0 0-1.05-.14 8.05 8.05 0 0 1-3.37.73 8.15 8.15 0 0 1-8.14-8.1 8.59 8.59 0 0 1 .25-2A1 1 0 0 0 8 2.36a10.14 10.14 0 1 0 14 11.69 1 1 0 0 0-.36-1.05zm-9.5 6.69A8.14 8.14 0 0 1 7.08 5.22a10.14 10.14 0 0 0 13.47 12.4 8.14 8.14 0 0 1-8.41 2.07z"/>
         </svg>`;
  }

  /**
   * Add required styles
   */
  function addStyles() {
    if (document.getElementById('theme-toggle-styles')) return;

    const styles = document.createElement('style');
    styles.id = 'theme-toggle-styles';
    styles.textContent = `
      .theme-toggle-btn {
        position: fixed;
        top: 16px;
        right: 16px;
        width: 40px;
        height: 40px;
        border-radius: 50%;
        border: 1px solid var(--border);
        background: var(--bg-card);
        color: var(--text-secondary);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.3s ease;
        z-index: 1000;
        box-shadow: 0 2px 8px var(--shadow);
      }
      
      .theme-toggle-btn:hover {
        background: var(--bg-card-hover);
        color: var(--primary);
        transform: scale(1.1);
      }
      
      .theme-toggle-btn:active {
        transform: scale(0.95);
      }
      
      .theme-toggle-btn svg {
        transition: transform 0.3s ease;
      }
      
      .theme-toggle-btn:hover svg {
        transform: rotate(15deg);
      }

      /* Smooth theme transitions */
      body {
        transition: background-color 0.3s ease, color 0.3s ease;
      }
      
      .card, .quest-card, .stats-card, .boost-section {
        transition: background-color 0.3s ease, border-color 0.3s ease;
      }
    `;
    document.head.appendChild(styles);
  }

  /**
   * Watch for system preference changes
   */
  function watchSystemPreference() {
    if (!window.matchMedia) return;
    
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (useSystemPreference) {
        currentTheme = e.matches ? 'dark' : 'light';
        applyTheme(currentTheme);
        
        // Update toggle button if it exists
        const btn = document.getElementById('theme-toggle-btn');
        if (btn) updateButtonIcon(btn);
      }
    });
  }

  /**
   * Initialize theme manager
   */
  function init() {
    loadPreference();
    addStyles();
    applyTheme(currentTheme);
    watchSystemPreference();
    
    console.log('Theme manager initialized:', currentTheme);
  }

  // Public API
  return {
    init,
    setTheme,
    toggle,
    useSystem,
    getTheme,
    getSettings,
    createToggleButton,
    themes
  };
})();

// Make available globally
window.ThemeManager = ThemeManager;

// Auto-initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  ThemeManager.init();
});
