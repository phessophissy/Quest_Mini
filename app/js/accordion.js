/**
 * Accordion - Collapsible content panels
 * Quest Mini - Farcaster Mini-App
 */

(function() {
    'use strict';

    // Default styles
    const defaultStyles = `
        .accordion {
            display: flex;
            flex-direction: column;
            gap: 8px;
        }
        
        .accordion-item {
            background: var(--bg-card, #1A1A2E);
            border-radius: 12px;
            border: 1px solid var(--border, #2D2D44);
            overflow: hidden;
            transition: border-color 0.2s ease;
        }
        
        .accordion-item:hover {
            border-color: var(--primary, #8B5CF6);
        }
        
        .accordion-item.open {
            border-color: var(--primary, #8B5CF6);
        }
        
        .accordion-header {
            width: 100%;
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 16px;
            background: transparent;
            border: none;
            color: var(--text-primary, #FFFFFF);
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            text-align: left;
            transition: background 0.2s ease;
        }
        
        .accordion-header:hover {
            background: rgba(139, 92, 246, 0.1);
        }
        
        .accordion-header:focus-visible {
            outline: 2px solid var(--primary, #8B5CF6);
            outline-offset: -2px;
        }
        
        .accordion-header-content {
            display: flex;
            align-items: center;
            gap: 12px;
            flex: 1;
        }
        
        .accordion-icon {
            font-size: 20px;
        }
        
        .accordion-title {
            font-weight: 500;
        }
        
        .accordion-subtitle {
            font-size: 12px;
            color: var(--text-secondary, #A1A1AA);
            margin-top: 2px;
        }
        
        .accordion-chevron {
            width: 20px;
            height: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: var(--text-secondary, #A1A1AA);
            transition: transform 0.2s ease;
        }
        
        .accordion-item.open .accordion-chevron {
            transform: rotate(180deg);
        }
        
        .accordion-content {
            overflow: hidden;
            transition: height 0.2s ease;
        }
        
        .accordion-content-inner {
            padding: 0 16px 16px;
            color: var(--text-secondary, #A1A1AA);
            font-size: 14px;
            line-height: 1.6;
        }
        
        /* Variants */
        .accordion.bordered .accordion-item {
            border-radius: 0;
            border-left: none;
            border-right: none;
            border-top: none;
        }
        
        .accordion.bordered .accordion-item:first-child {
            border-top: 1px solid var(--border, #2D2D44);
        }
        
        .accordion.flush .accordion-item {
            background: transparent;
            border: none;
            border-radius: 0;
        }
        
        .accordion.flush .accordion-item:not(:last-child) {
            border-bottom: 1px solid var(--border, #2D2D44);
        }
        
        .accordion.flush .accordion-header {
            padding-left: 0;
            padding-right: 0;
        }
        
        .accordion.flush .accordion-content-inner {
            padding-left: 0;
            padding-right: 0;
        }
        
        /* Nested accordion */
        .accordion-content-inner .accordion {
            margin-top: 8px;
        }
        
        .accordion-content-inner .accordion .accordion-item {
            background: rgba(0, 0, 0, 0.2);
        }
    `;

    // Inject styles
    function injectStyles() {
        if (document.getElementById('accordion-styles')) return;
        const style = document.createElement('style');
        style.id = 'accordion-styles';
        style.textContent = defaultStyles;
        document.head.appendChild(style);
    }

    /**
     * Create accordion instance
     */
    function create(container, options = {}) {
        injectStyles();

        const el = typeof container === 'string' 
            ? document.querySelector(container) 
            : container;

        if (!el) {
            console.error('Accordion container not found');
            return null;
        }

        const {
            items = [],
            multiple = false, // Allow multiple open
            defaultOpen = [], // Indices to open by default
            variant = 'default', // default, bordered, flush
            animated = true,
            onChange = null
        } = options;

        const state = {
            items: [...items],
            openIndices: new Set(defaultOpen)
        };

        // Build DOM
        el.className = `accordion ${variant} ${options.class || ''}`;
        el.innerHTML = '';

        state.items.forEach((item, index) => {
            const itemEl = createItem(item, index);
            el.appendChild(itemEl);
        });

        function createItem(item, index) {
            const isOpen = state.openIndices.has(index);
            
            const itemEl = document.createElement('div');
            itemEl.className = `accordion-item ${isOpen ? 'open' : ''}`;
            itemEl.dataset.index = index;

            // Header button
            const header = document.createElement('button');
            header.className = 'accordion-header';
            header.setAttribute('aria-expanded', isOpen);
            header.setAttribute('aria-controls', `accordion-panel-${index}`);
            header.id = `accordion-header-${index}`;

            // Header content
            const headerContent = document.createElement('div');
            headerContent.className = 'accordion-header-content';

            if (item.icon) {
                const icon = document.createElement('span');
                icon.className = 'accordion-icon';
                icon.textContent = item.icon;
                headerContent.appendChild(icon);
            }

            const titleWrapper = document.createElement('div');
            const title = document.createElement('div');
            title.className = 'accordion-title';
            title.textContent = item.title;
            titleWrapper.appendChild(title);

            if (item.subtitle) {
                const subtitle = document.createElement('div');
                subtitle.className = 'accordion-subtitle';
                subtitle.textContent = item.subtitle;
                titleWrapper.appendChild(subtitle);
            }

            headerContent.appendChild(titleWrapper);
            header.appendChild(headerContent);

            // Chevron
            const chevron = document.createElement('span');
            chevron.className = 'accordion-chevron';
            chevron.innerHTML = '▼';
            header.appendChild(chevron);

            // Content panel
            const content = document.createElement('div');
            content.className = 'accordion-content';
            content.id = `accordion-panel-${index}`;
            content.setAttribute('role', 'region');
            content.setAttribute('aria-labelledby', `accordion-header-${index}`);

            const contentInner = document.createElement('div');
            contentInner.className = 'accordion-content-inner';
            contentInner.innerHTML = typeof item.content === 'function' 
                ? item.content() 
                : item.content || '';
            content.appendChild(contentInner);

            // Set initial height
            if (isOpen) {
                content.style.height = 'auto';
            } else {
                content.style.height = '0';
            }

            // Click handler
            header.addEventListener('click', () => toggle(index));

            itemEl.appendChild(header);
            itemEl.appendChild(content);

            return itemEl;
        }

        function toggle(index) {
            const isOpen = state.openIndices.has(index);
            
            if (isOpen) {
                close(index);
            } else {
                open(index);
            }
        }

        function open(index) {
            // Close others if not multiple
            if (!multiple) {
                state.openIndices.forEach(i => {
                    if (i !== index) close(i);
                });
            }

            state.openIndices.add(index);
            const itemEl = el.querySelector(`[data-index="${index}"]`);
            
            if (itemEl) {
                itemEl.classList.add('open');
                const header = itemEl.querySelector('.accordion-header');
                const content = itemEl.querySelector('.accordion-content');
                
                header.setAttribute('aria-expanded', 'true');
                
                if (animated) {
                    const inner = content.querySelector('.accordion-content-inner');
                    content.style.height = inner.offsetHeight + 'px';
                } else {
                    content.style.height = 'auto';
                }
            }

            emitChange();
        }

        function close(index) {
            state.openIndices.delete(index);
            const itemEl = el.querySelector(`[data-index="${index}"]`);
            
            if (itemEl) {
                itemEl.classList.remove('open');
                const header = itemEl.querySelector('.accordion-header');
                const content = itemEl.querySelector('.accordion-content');
                
                header.setAttribute('aria-expanded', 'false');
                
                if (animated) {
                    const inner = content.querySelector('.accordion-content-inner');
                    content.style.height = inner.offsetHeight + 'px';
                    requestAnimationFrame(() => {
                        content.style.height = '0';
                    });
                } else {
                    content.style.height = '0';
                }
            }

            emitChange();
        }

        function emitChange() {
            const openArray = Array.from(state.openIndices);
            
            if (onChange) {
                onChange(openArray, state.items.filter((_, i) => state.openIndices.has(i)));
            }

            el.dispatchEvent(new CustomEvent('accordion-change', {
                detail: { openIndices: openArray }
            }));
        }

        // Keyboard navigation
        el.addEventListener('keydown', (e) => {
            const headers = el.querySelectorAll('.accordion-header');
            const currentIndex = Array.from(headers).indexOf(e.target);
            
            if (currentIndex === -1) return;

            let newIndex;
            switch (e.key) {
                case 'ArrowDown':
                    newIndex = (currentIndex + 1) % headers.length;
                    break;
                case 'ArrowUp':
                    newIndex = (currentIndex - 1 + headers.length) % headers.length;
                    break;
                case 'Home':
                    newIndex = 0;
                    break;
                case 'End':
                    newIndex = headers.length - 1;
                    break;
                default:
                    return;
            }

            e.preventDefault();
            headers[newIndex].focus();
        });

        // Public API
        return {
            el,

            isOpen(index) {
                return state.openIndices.has(index);
            },

            open,
            close,
            toggle,

            openAll() {
                state.items.forEach((_, i) => open(i));
            },

            closeAll() {
                state.items.forEach((_, i) => close(i));
            },

            getOpen() {
                return Array.from(state.openIndices);
            },

            updateItem(index, updates) {
                if (state.items[index]) {
                    Object.assign(state.items[index], updates);
                    const itemEl = el.querySelector(`[data-index="${index}"]`);
                    
                    if (updates.title) {
                        const title = itemEl.querySelector('.accordion-title');
                        if (title) title.textContent = updates.title;
                    }
                    
                    if (updates.content) {
                        const inner = itemEl.querySelector('.accordion-content-inner');
                        if (inner) {
                            inner.innerHTML = typeof updates.content === 'function'
                                ? updates.content()
                                : updates.content;
                        }
                    }
                }
            },

            addItem(item, index) {
                const insertIndex = index ?? state.items.length;
                state.items.splice(insertIndex, 0, item);
                const itemEl = createItem(item, insertIndex);
                
                if (insertIndex >= el.children.length) {
                    el.appendChild(itemEl);
                } else {
                    el.insertBefore(itemEl, el.children[insertIndex]);
                }
                
                // Update indices
                Array.from(el.children).forEach((child, i) => {
                    child.dataset.index = i;
                });
            },

            removeItem(index) {
                if (state.items[index]) {
                    state.items.splice(index, 1);
                    state.openIndices.delete(index);
                    el.children[index]?.remove();
                    
                    // Update indices
                    Array.from(el.children).forEach((child, i) => {
                        child.dataset.index = i;
                    });
                }
            },

            destroy() {
                el.innerHTML = '';
                el.className = '';
            }
        };
    }

    /**
     * Auto-initialize from HTML
     */
    function autoInit() {
        injectStyles();
        
        document.querySelectorAll('[data-accordion]').forEach(container => {
            const headers = container.querySelectorAll('[data-accordion-header]');
            
            headers.forEach(header => {
                const targetId = header.dataset.accordionHeader;
                const content = document.getElementById(targetId);
                
                if (!content) return;

                header.addEventListener('click', () => {
                    const isOpen = header.getAttribute('aria-expanded') === 'true';
                    
                    // Close others if not multiple
                    if (!container.dataset.accordionMultiple) {
                        headers.forEach(h => {
                            if (h !== header) {
                                h.setAttribute('aria-expanded', 'false');
                                const c = document.getElementById(h.dataset.accordionHeader);
                                if (c) c.style.height = '0';
                            }
                        });
                    }

                    header.setAttribute('aria-expanded', !isOpen);
                    content.style.height = isOpen ? '0' : content.scrollHeight + 'px';
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
    window.Accordion = {
        create,
        autoInit
    };

    console.log('📂 Accordion component initialized');
})();
