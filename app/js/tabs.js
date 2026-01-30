/**
 * Tabs Component - Accessible tab interface
 * Quest Mini - Farcaster Mini-App
 */

(function() {
    'use strict';

    // Default styles
    const defaultStyles = `
        .tabs-container {
            width: 100%;
        }
        
        .tabs-nav {
            display: flex;
            border-bottom: 2px solid var(--border, #2D2D44);
            margin-bottom: 16px;
            overflow-x: auto;
            scrollbar-width: none;
            -ms-overflow-style: none;
        }
        
        .tabs-nav::-webkit-scrollbar {
            display: none;
        }
        
        .tab-btn {
            flex: 1;
            min-width: fit-content;
            padding: 12px 20px;
            background: transparent;
            border: none;
            color: var(--text-secondary, #A1A1AA);
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            position: relative;
            transition: all 0.2s ease;
            white-space: nowrap;
        }
        
        .tab-btn:hover {
            color: var(--text-primary, #FFFFFF);
            background: rgba(139, 92, 246, 0.1);
        }
        
        .tab-btn[aria-selected="true"] {
            color: var(--primary, #8B5CF6);
        }
        
        .tab-btn[aria-selected="true"]::after {
            content: '';
            position: absolute;
            bottom: -2px;
            left: 0;
            width: 100%;
            height: 2px;
            background: var(--primary, #8B5CF6);
        }
        
        .tab-btn:focus-visible {
            outline: 2px solid var(--primary, #8B5CF6);
            outline-offset: -2px;
        }
        
        .tab-btn .tab-icon {
            margin-right: 8px;
        }
        
        .tab-btn .tab-badge {
            margin-left: 8px;
            padding: 2px 6px;
            font-size: 11px;
            background: var(--primary, #8B5CF6);
            color: white;
            border-radius: 10px;
        }
        
        .tab-panel {
            display: none;
            animation: tabFadeIn 0.2s ease;
        }
        
        .tab-panel[aria-hidden="false"] {
            display: block;
        }
        
        @keyframes tabFadeIn {
            from { opacity: 0; transform: translateY(8px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        /* Variants */
        .tabs-nav.pills {
            border-bottom: none;
            background: var(--bg-card, #1A1A2E);
            border-radius: 12px;
            padding: 4px;
            gap: 4px;
        }
        
        .tabs-nav.pills .tab-btn {
            border-radius: 8px;
        }
        
        .tabs-nav.pills .tab-btn[aria-selected="true"] {
            background: var(--primary, #8B5CF6);
            color: white;
        }
        
        .tabs-nav.pills .tab-btn[aria-selected="true"]::after {
            display: none;
        }
        
        .tabs-nav.underline .tab-btn::after {
            transition: width 0.2s ease;
            width: 0;
        }
        
        .tabs-nav.underline .tab-btn[aria-selected="true"]::after {
            width: 100%;
        }
        
        /* Vertical tabs */
        .tabs-container.vertical {
            display: flex;
            gap: 16px;
        }
        
        .tabs-container.vertical .tabs-nav {
            flex-direction: column;
            border-bottom: none;
            border-right: 2px solid var(--border, #2D2D44);
            margin-bottom: 0;
            padding-right: 16px;
            min-width: 150px;
        }
        
        .tabs-container.vertical .tab-btn {
            text-align: left;
        }
        
        .tabs-container.vertical .tab-btn[aria-selected="true"]::after {
            width: 2px;
            height: 100%;
            right: -18px;
            left: auto;
            bottom: 0;
        }
        
        .tabs-container.vertical .tabs-content {
            flex: 1;
        }
    `;

    // Inject styles
    function injectStyles() {
        if (document.getElementById('tabs-styles')) return;
        const style = document.createElement('style');
        style.id = 'tabs-styles';
        style.textContent = defaultStyles;
        document.head.appendChild(style);
    }

    /**
     * Create tabs instance
     */
    function create(container, options = {}) {
        injectStyles();

        const el = typeof container === 'string' 
            ? document.querySelector(container) 
            : container;

        if (!el) {
            console.error('Tabs container not found');
            return null;
        }

        const {
            tabs = [],
            activeTab = 0,
            variant = 'default', // default, pills, underline
            vertical = false,
            onChange = null,
            lazyLoad = false
        } = options;

        const state = {
            activeIndex: activeTab,
            tabs: [...tabs],
            loadedPanels: new Set([activeTab])
        };

        // Build DOM
        el.className = `tabs-container ${vertical ? 'vertical' : ''} ${options.class || ''}`;
        el.innerHTML = '';

        // Create navigation
        const nav = document.createElement('div');
        nav.className = `tabs-nav ${variant}`;
        nav.setAttribute('role', 'tablist');

        // Create content container
        const content = document.createElement('div');
        content.className = 'tabs-content';

        // Create tabs
        state.tabs.forEach((tab, index) => {
            // Tab button
            const btn = document.createElement('button');
            btn.className = 'tab-btn';
            btn.setAttribute('role', 'tab');
            btn.setAttribute('id', `tab-${index}`);
            btn.setAttribute('aria-selected', index === state.activeIndex);
            btn.setAttribute('aria-controls', `panel-${index}`);
            btn.setAttribute('tabindex', index === state.activeIndex ? '0' : '-1');

            if (tab.icon) {
                const icon = document.createElement('span');
                icon.className = 'tab-icon';
                icon.textContent = tab.icon;
                btn.appendChild(icon);
            }

            const label = document.createTextNode(tab.label);
            btn.appendChild(label);

            if (tab.badge !== undefined) {
                const badge = document.createElement('span');
                badge.className = 'tab-badge';
                badge.textContent = tab.badge;
                btn.appendChild(badge);
            }

            btn.addEventListener('click', () => activateTab(index));
            nav.appendChild(btn);

            // Tab panel
            const panel = document.createElement('div');
            panel.className = 'tab-panel';
            panel.setAttribute('role', 'tabpanel');
            panel.setAttribute('id', `panel-${index}`);
            panel.setAttribute('aria-labelledby', `tab-${index}`);
            panel.setAttribute('aria-hidden', index !== state.activeIndex);

            if (!lazyLoad || index === state.activeIndex) {
                panel.innerHTML = typeof tab.content === 'function' 
                    ? tab.content() 
                    : tab.content || '';
            }

            content.appendChild(panel);
        });

        el.appendChild(nav);
        el.appendChild(content);

        // Keyboard navigation
        nav.addEventListener('keydown', handleKeydown);

        function handleKeydown(e) {
            const buttons = nav.querySelectorAll('.tab-btn');
            let newIndex = state.activeIndex;

            switch (e.key) {
                case 'ArrowRight':
                case 'ArrowDown':
                    newIndex = (state.activeIndex + 1) % state.tabs.length;
                    break;
                case 'ArrowLeft':
                case 'ArrowUp':
                    newIndex = (state.activeIndex - 1 + state.tabs.length) % state.tabs.length;
                    break;
                case 'Home':
                    newIndex = 0;
                    break;
                case 'End':
                    newIndex = state.tabs.length - 1;
                    break;
                default:
                    return;
            }

            e.preventDefault();
            activateTab(newIndex);
            buttons[newIndex].focus();
        }

        function activateTab(index) {
            if (index === state.activeIndex) return;
            
            const prevIndex = state.activeIndex;
            state.activeIndex = index;

            // Update buttons
            nav.querySelectorAll('.tab-btn').forEach((btn, i) => {
                btn.setAttribute('aria-selected', i === index);
                btn.setAttribute('tabindex', i === index ? '0' : '-1');
            });

            // Update panels
            content.querySelectorAll('.tab-panel').forEach((panel, i) => {
                const isActive = i === index;
                panel.setAttribute('aria-hidden', !isActive);

                // Lazy load
                if (isActive && lazyLoad && !state.loadedPanels.has(i)) {
                    const tab = state.tabs[i];
                    panel.innerHTML = typeof tab.content === 'function' 
                        ? tab.content() 
                        : tab.content || '';
                    state.loadedPanels.add(i);
                }
            });

            // Callback
            if (onChange) {
                onChange(index, state.tabs[index], prevIndex);
            }

            // Emit event
            el.dispatchEvent(new CustomEvent('tab-change', {
                detail: { index, tab: state.tabs[index], prevIndex }
            }));
        }

        // Public API
        return {
            el,
            
            getActiveIndex() {
                return state.activeIndex;
            },

            getActiveTab() {
                return state.tabs[state.activeIndex];
            },

            setActive(index) {
                if (index >= 0 && index < state.tabs.length) {
                    activateTab(index);
                }
            },

            setActiveByKey(key) {
                const index = state.tabs.findIndex(t => t.key === key);
                if (index > -1) activateTab(index);
            },

            updateTab(index, updates) {
                if (state.tabs[index]) {
                    Object.assign(state.tabs[index], updates);
                    
                    // Update badge if changed
                    if (updates.badge !== undefined) {
                        const btn = nav.children[index];
                        let badge = btn.querySelector('.tab-badge');
                        if (updates.badge === null || updates.badge === undefined) {
                            if (badge) badge.remove();
                        } else {
                            if (!badge) {
                                badge = document.createElement('span');
                                badge.className = 'tab-badge';
                                btn.appendChild(badge);
                            }
                            badge.textContent = updates.badge;
                        }
                    }

                    // Update content if changed
                    if (updates.content !== undefined && state.loadedPanels.has(index)) {
                        const panel = content.children[index];
                        panel.innerHTML = typeof updates.content === 'function'
                            ? updates.content()
                            : updates.content;
                    }
                }
            },

            addTab(tab, index) {
                const insertIndex = index ?? state.tabs.length;
                state.tabs.splice(insertIndex, 0, tab);
                // Would need to rebuild - simplified for demo
            },

            removeTab(index) {
                if (state.tabs[index]) {
                    state.tabs.splice(index, 1);
                    nav.children[index]?.remove();
                    content.children[index]?.remove();
                    
                    if (state.activeIndex >= state.tabs.length) {
                        activateTab(state.tabs.length - 1);
                    }
                }
            },

            destroy() {
                el.innerHTML = '';
                el.className = '';
            }
        };
    }

    /**
     * Auto-initialize tabs from HTML
     */
    function autoInit() {
        document.querySelectorAll('[data-tabs]').forEach(container => {
            const tabButtons = container.querySelectorAll('[data-tab]');
            const tabPanels = container.querySelectorAll('[data-tab-panel]');

            tabButtons.forEach((btn, index) => {
                btn.addEventListener('click', () => {
                    // Update buttons
                    tabButtons.forEach(b => {
                        b.setAttribute('aria-selected', 'false');
                        b.classList.remove('active');
                    });
                    btn.setAttribute('aria-selected', 'true');
                    btn.classList.add('active');

                    // Update panels
                    tabPanels.forEach((panel, i) => {
                        panel.setAttribute('aria-hidden', i !== index);
                    });
                });
            });
        });
    }

    // Auto-init on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', autoInit);
    } else {
        autoInit();
    }

    // Export API
    window.Tabs = {
        create,
        autoInit
    };

    console.log('📑 Tabs component initialized');
})();
