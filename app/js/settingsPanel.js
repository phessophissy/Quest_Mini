/**
 * Settings Panel - User preferences and configuration
 * Quest Mini - Farcaster Mini-App
 */

(function() {
    'use strict';

    // Storage key
    const STORAGE_KEY = 'quest_settings';

    // Default settings
    const defaultSettings = {
        // Notifications
        notifications: {
            enabled: true,
            questReminders: true,
            dailyReset: true,
            rewards: true,
            leaderboard: false
        },
        // Display
        display: {
            theme: 'dark',
            compactMode: false,
            showBalanceUSD: true,
            animationsEnabled: true
        },
        // Privacy
        privacy: {
            hideBalance: false,
            hideAddress: false,
            showOnLeaderboard: true
        },
        // Advanced
        advanced: {
            gasPreset: 'medium', // low, medium, high
            slippageTolerance: 0.5,
            autoClaimRewards: false,
            debugMode: false
        }
    };

    // Default styles
    const defaultStyles = `
        .settings-panel {
            background: var(--bg-card, #1A1A2E);
            border-radius: 16px;
            border: 1px solid var(--border, #2D2D44);
            overflow: hidden;
        }
        
        .settings-header {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 16px;
            border-bottom: 1px solid var(--border, #2D2D44);
        }
        
        .settings-back {
            background: none;
            border: none;
            color: var(--text-secondary, #A1A1AA);
            font-size: 20px;
            cursor: pointer;
            padding: 4px;
        }
        
        .settings-title {
            font-size: 18px;
            font-weight: 600;
            color: var(--text-primary, #FFFFFF);
        }
        
        .settings-sections {
            padding: 8px;
        }
        
        .settings-section {
            margin-bottom: 16px;
        }
        
        .settings-section-title {
            font-size: 12px;
            font-weight: 600;
            color: var(--text-secondary, #A1A1AA);
            text-transform: uppercase;
            padding: 8px 12px;
            letter-spacing: 0.5px;
        }
        
        .settings-group {
            background: var(--bg-dark, #0F0F1A);
            border-radius: 12px;
            overflow: hidden;
        }
        
        .settings-item {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 14px 16px;
            border-bottom: 1px solid var(--border, #2D2D44);
        }
        
        .settings-item:last-child {
            border-bottom: none;
        }
        
        .settings-item-left {
            display: flex;
            align-items: center;
            gap: 12px;
        }
        
        .settings-item-icon {
            font-size: 20px;
        }
        
        .settings-item-info {
            display: flex;
            flex-direction: column;
        }
        
        .settings-item-label {
            font-size: 14px;
            color: var(--text-primary, #FFFFFF);
        }
        
        .settings-item-desc {
            font-size: 12px;
            color: var(--text-secondary, #A1A1AA);
            margin-top: 2px;
        }
        
        /* Toggle switch */
        .settings-toggle {
            position: relative;
            width: 48px;
            height: 28px;
            background: var(--border, #2D2D44);
            border-radius: 14px;
            cursor: pointer;
            transition: all 0.2s ease;
        }
        
        .settings-toggle.active {
            background: var(--primary, #8B5CF6);
        }
        
        .settings-toggle::after {
            content: '';
            position: absolute;
            top: 3px;
            left: 3px;
            width: 22px;
            height: 22px;
            background: white;
            border-radius: 50%;
            transition: transform 0.2s ease;
        }
        
        .settings-toggle.active::after {
            transform: translateX(20px);
        }
        
        /* Select dropdown */
        .settings-select {
            padding: 8px 12px;
            background: var(--bg-card, #1A1A2E);
            border: 1px solid var(--border, #2D2D44);
            border-radius: 8px;
            color: var(--text-primary, #FFFFFF);
            font-size: 13px;
            cursor: pointer;
            min-width: 100px;
        }
        
        .settings-select:focus {
            outline: none;
            border-color: var(--primary, #8B5CF6);
        }
        
        /* Slider */
        .settings-slider {
            width: 100px;
            height: 4px;
            -webkit-appearance: none;
            background: var(--border, #2D2D44);
            border-radius: 2px;
            outline: none;
        }
        
        .settings-slider::-webkit-slider-thumb {
            -webkit-appearance: none;
            width: 16px;
            height: 16px;
            background: var(--primary, #8B5CF6);
            border-radius: 50%;
            cursor: pointer;
        }
        
        .settings-slider-value {
            font-size: 12px;
            color: var(--text-secondary, #A1A1AA);
            margin-left: 8px;
            min-width: 40px;
        }
        
        /* Button link */
        .settings-link {
            display: flex;
            align-items: center;
            gap: 8px;
            color: var(--primary, #8B5CF6);
            font-size: 14px;
            cursor: pointer;
        }
        
        .settings-link-arrow {
            font-size: 16px;
        }
        
        /* Danger zone */
        .settings-danger {
            margin-top: 24px;
            padding: 16px;
            background: rgba(239, 68, 68, 0.1);
            border-radius: 12px;
            border: 1px solid rgba(239, 68, 68, 0.2);
        }
        
        .settings-danger-title {
            font-size: 14px;
            font-weight: 600;
            color: var(--error, #EF4444);
            margin-bottom: 12px;
        }
        
        .settings-danger-btn {
            padding: 10px 16px;
            background: transparent;
            border: 1px solid var(--error, #EF4444);
            border-radius: 8px;
            color: var(--error, #EF4444);
            font-size: 13px;
            cursor: pointer;
            transition: all 0.2s ease;
        }
        
        .settings-danger-btn:hover {
            background: var(--error, #EF4444);
            color: white;
        }
        
        /* Footer */
        .settings-footer {
            padding: 16px;
            text-align: center;
            border-top: 1px solid var(--border, #2D2D44);
        }
        
        .settings-version {
            font-size: 12px;
            color: var(--text-secondary, #A1A1AA);
        }
    `;

    // Inject styles
    function injectStyles() {
        if (document.getElementById('settings-styles')) return;
        const style = document.createElement('style');
        style.id = 'settings-styles';
        style.textContent = defaultStyles;
        document.head.appendChild(style);
    }

    // State
    let settings = { ...defaultSettings };

    /**
     * Load settings from storage
     */
    function loadSettings() {
        try {
            const data = localStorage.getItem(STORAGE_KEY);
            if (data) {
                const saved = JSON.parse(data);
                settings = deepMerge(defaultSettings, saved);
            }
        } catch (e) {
            console.error('Failed to load settings:', e);
        }
        return settings;
    }

    /**
     * Save settings to storage
     */
    function saveSettings() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
            window.dispatchEvent(new CustomEvent('settings-changed', {
                detail: { settings }
            }));
        } catch (e) {
            console.error('Failed to save settings:', e);
        }
    }

    /**
     * Deep merge objects
     */
    function deepMerge(target, source) {
        const result = { ...target };
        for (const key in source) {
            if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                result[key] = deepMerge(result[key] || {}, source[key]);
            } else {
                result[key] = source[key];
            }
        }
        return result;
    }

    /**
     * Get setting value
     */
    function get(path) {
        const keys = path.split('.');
        let value = settings;
        for (const key of keys) {
            value = value?.[key];
        }
        return value;
    }

    /**
     * Set setting value
     */
    function set(path, value) {
        const keys = path.split('.');
        let obj = settings;
        
        for (let i = 0; i < keys.length - 1; i++) {
            if (!obj[keys[i]]) obj[keys[i]] = {};
            obj = obj[keys[i]];
        }
        
        obj[keys[keys.length - 1]] = value;
        saveSettings();
        
        return value;
    }

    /**
     * Reset to defaults
     */
    function resetToDefaults() {
        settings = { ...defaultSettings };
        saveSettings();
    }

    /**
     * Create settings panel
     */
    function create(container, options = {}) {
        injectStyles();
        loadSettings();

        const el = typeof container === 'string' 
            ? document.querySelector(container) 
            : container;

        if (!el) return null;

        const {
            showBack = false,
            onBack = null,
            version = '1.0.0'
        } = options;

        function render() {
            el.className = 'settings-panel';
            el.innerHTML = `
                <div class="settings-header">
                    ${showBack ? '<button class="settings-back">←</button>' : ''}
                    <h2 class="settings-title">⚙️ Settings</h2>
                </div>
                
                <div class="settings-sections">
                    <!-- Notifications -->
                    <div class="settings-section">
                        <div class="settings-section-title">Notifications</div>
                        <div class="settings-group">
                            ${renderToggle('notifications.enabled', '🔔', 'Push Notifications', 'Receive app notifications')}
                            ${renderToggle('notifications.questReminders', '⏰', 'Quest Reminders', 'Daily quest notifications')}
                            ${renderToggle('notifications.dailyReset', '🌅', 'Daily Reset', 'Notify when quests reset')}
                            ${renderToggle('notifications.rewards', '🎁', 'Rewards', 'Notify on reward claims')}
                        </div>
                    </div>
                    
                    <!-- Display -->
                    <div class="settings-section">
                        <div class="settings-section-title">Display</div>
                        <div class="settings-group">
                            ${renderSelect('display.theme', '🎨', 'Theme', [
                                { value: 'dark', label: 'Dark' },
                                { value: 'light', label: 'Light' },
                                { value: 'system', label: 'System' }
                            ])}
                            ${renderToggle('display.compactMode', '📱', 'Compact Mode', 'Reduce spacing')}
                            ${renderToggle('display.showBalanceUSD', '💵', 'Show USD Value', 'Display USD conversions')}
                            ${renderToggle('display.animationsEnabled', '✨', 'Animations', 'Enable UI animations')}
                        </div>
                    </div>
                    
                    <!-- Privacy -->
                    <div class="settings-section">
                        <div class="settings-section-title">Privacy</div>
                        <div class="settings-group">
                            ${renderToggle('privacy.hideBalance', '👁️', 'Hide Balance', 'Mask token balance')}
                            ${renderToggle('privacy.hideAddress', '🔒', 'Hide Address', 'Mask wallet address')}
                            ${renderToggle('privacy.showOnLeaderboard', '🏆', 'Show on Leaderboard', 'Appear in rankings')}
                        </div>
                    </div>
                    
                    <!-- Advanced -->
                    <div class="settings-section">
                        <div class="settings-section-title">Advanced</div>
                        <div class="settings-group">
                            ${renderSelect('advanced.gasPreset', '⛽', 'Gas Preset', [
                                { value: 'low', label: 'Low' },
                                { value: 'medium', label: 'Medium' },
                                { value: 'high', label: 'High' }
                            ])}
                            ${renderSlider('advanced.slippageTolerance', '📊', 'Slippage', 0, 5, 0.1, '%')}
                            ${renderToggle('advanced.autoClaimRewards', '🤖', 'Auto-Claim', 'Automatically claim rewards')}
                        </div>
                    </div>
                    
                    <!-- Danger Zone -->
                    <div class="settings-danger">
                        <div class="settings-danger-title">⚠️ Danger Zone</div>
                        <button class="settings-danger-btn" id="resetSettings">Reset All Settings</button>
                    </div>
                </div>
                
                <div class="settings-footer">
                    <span class="settings-version">Quest Mini v${version}</span>
                </div>
            `;

            // Back button
            if (showBack && onBack) {
                el.querySelector('.settings-back')?.addEventListener('click', onBack);
            }

            // Toggle handlers
            el.querySelectorAll('.settings-toggle').forEach(toggle => {
                toggle.addEventListener('click', () => {
                    const path = toggle.dataset.setting;
                    const newValue = !get(path);
                    set(path, newValue);
                    toggle.classList.toggle('active', newValue);
                });
            });

            // Select handlers
            el.querySelectorAll('.settings-select').forEach(select => {
                select.addEventListener('change', () => {
                    set(select.dataset.setting, select.value);
                });
            });

            // Slider handlers
            el.querySelectorAll('.settings-slider').forEach(slider => {
                slider.addEventListener('input', () => {
                    const path = slider.dataset.setting;
                    const value = parseFloat(slider.value);
                    set(path, value);
                    
                    const valueEl = slider.nextElementSibling;
                    if (valueEl) {
                        valueEl.textContent = value + (slider.dataset.unit || '');
                    }
                });
            });

            // Reset button
            el.querySelector('#resetSettings')?.addEventListener('click', () => {
                if (confirm('Reset all settings to defaults?')) {
                    resetToDefaults();
                    render();
                }
            });
        }

        function renderToggle(path, icon, label, desc) {
            const value = get(path);
            return `
                <div class="settings-item">
                    <div class="settings-item-left">
                        <span class="settings-item-icon">${icon}</span>
                        <div class="settings-item-info">
                            <span class="settings-item-label">${label}</span>
                            ${desc ? `<span class="settings-item-desc">${desc}</span>` : ''}
                        </div>
                    </div>
                    <div class="settings-toggle ${value ? 'active' : ''}" data-setting="${path}"></div>
                </div>
            `;
        }

        function renderSelect(path, icon, label, options) {
            const value = get(path);
            return `
                <div class="settings-item">
                    <div class="settings-item-left">
                        <span class="settings-item-icon">${icon}</span>
                        <span class="settings-item-label">${label}</span>
                    </div>
                    <select class="settings-select" data-setting="${path}">
                        ${options.map(opt => `
                            <option value="${opt.value}" ${value === opt.value ? 'selected' : ''}>
                                ${opt.label}
                            </option>
                        `).join('')}
                    </select>
                </div>
            `;
        }

        function renderSlider(path, icon, label, min, max, step, unit) {
            const value = get(path);
            return `
                <div class="settings-item">
                    <div class="settings-item-left">
                        <span class="settings-item-icon">${icon}</span>
                        <span class="settings-item-label">${label}</span>
                    </div>
                    <div style="display: flex; align-items: center;">
                        <input type="range" class="settings-slider" 
                            data-setting="${path}"
                            data-unit="${unit || ''}"
                            min="${min}" max="${max}" step="${step}" 
                            value="${value}">
                        <span class="settings-slider-value">${value}${unit || ''}</span>
                    </div>
                </div>
            `;
        }

        render();

        return {
            el,
            render,
            get,
            set,
            getAll: () => ({ ...settings }),
            reset: resetToDefaults
        };
    }

    // Initialize
    loadSettings();

    // Export API
    window.SettingsPanel = {
        create,
        get,
        set,
        getAll: () => ({ ...settings }),
        reset: resetToDefaults,
        load: loadSettings,
        save: saveSettings
    };

    console.log('⚙️ SettingsPanel module initialized');
})();
