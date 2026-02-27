/**
 * Quest Mini - Keyboard Shortcuts Manager
 * Global keyboard shortcut handling with customization support
 */

const KeyboardShortcuts = (function() {
  'use strict';

  // Registered shortcuts
  const shortcuts = new Map();
  
  // Shortcut groups
  const groups = new Map();
  
  // Settings
  let enabled = true;
  let showHelpKey = '?';

  /**
   * Parse a key combination string
   */
  function parseCombo(combo) {
    const parts = combo.toLowerCase().split('+').map(p => p.trim());
    return {
      ctrl: parts.includes('ctrl') || parts.includes('control'),
      alt: parts.includes('alt') || parts.includes('option'),
      shift: parts.includes('shift'),
      meta: parts.includes('meta') || parts.includes('cmd') || parts.includes('command'),
      key: parts.find(p => !['ctrl', 'control', 'alt', 'option', 'shift', 'meta', 'cmd', 'command'].includes(p)) || ''
    };
  }

  /**
   * Check if a keyboard event matches a combo
   */
  function matchesCombo(event, combo) {
    return (
      event.ctrlKey === combo.ctrl &&
      event.altKey === combo.alt &&
      event.shiftKey === combo.shift &&
      event.metaKey === combo.meta &&
      event.key.toLowerCase() === combo.key.toLowerCase()
    );
  }

  /**
   * Format combo for display
   */
  function formatCombo(combo) {
    const parts = [];
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    
    if (combo.ctrl) parts.push(isMac ? '⌃' : 'Ctrl');
    if (combo.alt) parts.push(isMac ? '⌥' : 'Alt');
    if (combo.shift) parts.push(isMac ? '⇧' : 'Shift');
    if (combo.meta) parts.push(isMac ? '⌘' : 'Meta');
    
    let key = combo.key.toUpperCase();
    if (key === ' ') key = 'Space';
    if (key === 'ESCAPE') key = 'Esc';
    if (key === 'ARROWUP') key = '↑';
    if (key === 'ARROWDOWN') key = '↓';
    if (key === 'ARROWLEFT') key = '←';
    if (key === 'ARROWRIGHT') key = '→';
    
    parts.push(key);
    
    return parts.join(isMac ? '' : ' + ');
  }

  /**
   * Register a shortcut
   */
  function register(comboString, callback, options = {}) {
    const { description = '', group = 'General', preventDefault = true } = options;
    const combo = parseCombo(comboString);
    
    const shortcut = {
      combo,
      comboString,
      callback,
      description,
      group,
      preventDefault,
      enabled: true
    };
    
    shortcuts.set(comboString.toLowerCase(), shortcut);
    
    // Add to group
    if (!groups.has(group)) {
      groups.set(group, []);
    }
    groups.get(group).push(shortcut);
    
    return () => unregister(comboString);
  }

  /**
   * Unregister a shortcut
   */
  function unregister(comboString) {
    const key = comboString.toLowerCase();
    const shortcut = shortcuts.get(key);
    
    if (shortcut) {
      shortcuts.delete(key);
      
      // Remove from group
      const groupArray = groups.get(shortcut.group);
      if (groupArray) {
        const index = groupArray.indexOf(shortcut);
        if (index > -1) {
          groupArray.splice(index, 1);
        }
      }
    }
  }

  /**
   * Handle keydown events
   */
  function handleKeydown(event) {
    if (!enabled) return;
    
    // Ignore if typing in an input
    const target = event.target;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
      // Allow escape key even in inputs
      if (event.key !== 'Escape') {
        return;
      }
    }
    
    // Check for help key
    if (event.key === showHelpKey && !event.ctrlKey && !event.altKey && !event.metaKey) {
      showHelp();
      event.preventDefault();
      return;
    }
    
    // Find matching shortcut
    for (const shortcut of shortcuts.values()) {
      if (!shortcut.enabled) continue;
      
      if (matchesCombo(event, shortcut.combo)) {
        if (shortcut.preventDefault) {
          event.preventDefault();
        }
        
        try {
          shortcut.callback(event);
        } catch (e) {
          console.error('Shortcut callback error:', e);
        }
        
        return;
      }
    }
  }

  /**
   * Show help modal with all shortcuts
   */
  function showHelp() {
    // Create help content
    const content = document.createElement('div');
    content.className = 'keyboard-shortcuts-help';
    content.innerHTML = `
      <style>
        .keyboard-shortcuts-help {
          max-height: 60vh;
          overflow-y: auto;
        }
        .shortcuts-group {
          margin-bottom: 20px;
        }
        .shortcuts-group:last-child {
          margin-bottom: 0;
        }
        .shortcuts-group-title {
          font-size: 12px;
          font-weight: 600;
          color: var(--text-secondary, #A1A1AA);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 12px;
        }
        .shortcut-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 0;
          border-bottom: 1px solid var(--border, #2D2D44);
        }
        .shortcut-item:last-child {
          border-bottom: none;
        }
        .shortcut-description {
          color: var(--text-primary, #FFFFFF);
          font-size: 14px;
        }
        .shortcut-key {
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }
        .shortcut-key kbd {
          display: inline-block;
          padding: 4px 8px;
          background: var(--bg-dark, #0F0F1A);
          border: 1px solid var(--border, #2D2D44);
          border-radius: 4px;
          font-family: monospace;
          font-size: 12px;
          color: var(--text-secondary, #A1A1AA);
        }
      </style>
    `;
    
    // Add shortcuts by group
    for (const [groupName, groupShortcuts] of groups) {
      if (groupShortcuts.length === 0) continue;
      
      const groupEl = document.createElement('div');
      groupEl.className = 'shortcuts-group';
      groupEl.innerHTML = `<div class="shortcuts-group-title">${groupName}</div>`;
      
      groupShortcuts.forEach(shortcut => {
        if (!shortcut.description) return;
        
        const item = document.createElement('div');
        item.className = 'shortcut-item';
        item.innerHTML = `
          <span class="shortcut-description">${shortcut.description}</span>
          <span class="shortcut-key">
            <kbd>${formatCombo(shortcut.combo)}</kbd>
          </span>
        `;
        groupEl.appendChild(item);
      });
      
      content.appendChild(groupEl);
    }
    
    // Show using Modal if available, otherwise create simple overlay
    if (window.Modal) {
      Modal.create({
        title: '⌨️ Keyboard Shortcuts',
        content,
        width: '450px',
        footer: false
      });
    } else {
      // Fallback to alert
      let text = 'Keyboard Shortcuts:\n\n';
      for (const [groupName, groupShortcuts] of groups) {
        text += `${groupName}:\n`;
        groupShortcuts.forEach(s => {
          if (s.description) {
            text += `  ${formatCombo(s.combo)}: ${s.description}\n`;
          }
        });
        text += '\n';
      }
      alert(text);
    }
  }

  /**
   * Enable shortcuts
   */
  function enable() {
    enabled = true;
  }

  /**
   * Disable shortcuts
   */
  function disable() {
    enabled = false;
  }

  /**
   * Enable/disable specific shortcut
   */
  function setShortcutEnabled(comboString, isEnabled) {
    const shortcut = shortcuts.get(comboString.toLowerCase());
    if (shortcut) {
      shortcut.enabled = isEnabled;
    }
  }

  /**
   * Get all registered shortcuts
   */
  function getShortcuts() {
    return Array.from(shortcuts.values()).map(s => ({
      combo: s.comboString,
      description: s.description,
      group: s.group,
      enabled: s.enabled,
      display: formatCombo(s.combo)
    }));
  }

  /**
   * Initialize keyboard shortcuts
   */
  function init(options = {}) {
    if (options.showHelpKey) {
      showHelpKey = options.showHelpKey;
    }
    
    // Add event listener
    document.addEventListener('keydown', handleKeydown);
    
    // Register default shortcuts
    register('escape', () => {
      // Close any open modals
      if (window.Modal) {
        Modal.close();
      }
    }, { description: 'Close modal', group: 'General' });
    
    register('ctrl+/', () => showHelp(), { 
      description: 'Show keyboard shortcuts', 
      group: 'General' 
    });
    
    console.log('Keyboard shortcuts initialized. Press ? for help.');
  }

  /**
   * Destroy keyboard shortcuts
   */
  function destroy() {
    document.removeEventListener('keydown', handleKeydown);
    shortcuts.clear();
    groups.clear();
  }

  // Public API
  return {
    init,
    destroy,
    register,
    unregister,
    enable,
    disable,
    setShortcutEnabled,
    getShortcuts,
    showHelp,
    parseCombo,
    formatCombo
  };
})();

// Make available globally
window.KeyboardShortcuts = KeyboardShortcuts;

// Auto-initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  KeyboardShortcuts.init();
});
