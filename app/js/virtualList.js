/**
 * Virtual List - Efficient rendering of large lists with virtualization
 * Quest Mini - Farcaster Mini-App
 */

(function() {
    'use strict';

    // Inject CSS
    const styles = `
        .virtual-list {
            position: relative;
            overflow-y: auto;
            -webkit-overflow-scrolling: touch;
        }

        .virtual-list-content {
            position: relative;
            width: 100%;
        }

        .virtual-list-item {
            position: absolute;
            left: 0;
            width: 100%;
            box-sizing: border-box;
        }

        .virtual-list-spacer {
            position: absolute;
            left: 0;
            width: 1px;
            pointer-events: none;
        }

        .virtual-list-loading {
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
            color: rgba(255, 255, 255, 0.6);
        }

        .virtual-list-empty {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 40px 20px;
            color: rgba(255, 255, 255, 0.5);
            text-align: center;
        }

        .virtual-list-empty-icon {
            font-size: 48px;
            margin-bottom: 16px;
            opacity: 0.5;
        }

        .virtual-grid {
            display: grid;
            gap: 16px;
        }

        .virtual-grid-item {
            min-height: 0;
        }
    `;

    // Inject styles
    const styleSheet = document.createElement('style');
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);

    /**
     * Virtual List Class
     */
    class VirtualList {
        constructor(container, options = {}) {
            this.container = typeof container === 'string' 
                ? document.querySelector(container) 
                : container;

            if (!this.container) {
                throw new Error('Container element not found');
            }

            // Configuration
            this.options = {
                itemHeight: options.itemHeight || 50,
                buffer: options.buffer || 5, // Items above/below viewport
                estimatedItemHeight: options.estimatedItemHeight || 50,
                renderItem: options.renderItem || this.defaultRenderItem,
                getItemKey: options.getItemKey || ((item, index) => index),
                onScroll: options.onScroll || null,
                onLoadMore: options.onLoadMore || null,
                loadMoreThreshold: options.loadMoreThreshold || 200,
                dynamicHeight: options.dynamicHeight || false,
                ...options
            };

            // State
            this.items = [];
            this.heights = new Map();
            this.positions = new Map();
            this.scrollTop = 0;
            this.viewportHeight = 0;
            this.totalHeight = 0;
            this.renderedItems = new Map();
            this.isLoading = false;
            this.hasMore = true;

            // RAF ID for scroll handling
            this.scrollRAF = null;

            this.init();
        }

        init() {
            // Setup container
            this.container.classList.add('virtual-list');
            
            // Create content wrapper
            this.content = document.createElement('div');
            this.content.className = 'virtual-list-content';
            this.container.appendChild(this.content);

            // Create spacer for scroll height
            this.spacer = document.createElement('div');
            this.spacer.className = 'virtual-list-spacer';
            this.content.appendChild(this.spacer);

            // Bind events
            this.handleScroll = this.handleScroll.bind(this);
            this.handleResize = this.handleResize.bind(this);

            this.container.addEventListener('scroll', this.handleScroll, { passive: true });
            window.addEventListener('resize', this.handleResize, { passive: true });

            // Initial measurements
            this.measure();
        }

        /**
         * Set items data
         */
        setItems(items) {
            this.items = items;
            this.calculatePositions();
            this.render();
        }

        /**
         * Append items
         */
        appendItems(newItems) {
            this.items = [...this.items, ...newItems];
            this.calculatePositions();
            this.render();
        }

        /**
         * Prepend items
         */
        prependItems(newItems) {
            const oldScrollTop = this.scrollTop;
            const oldTotalHeight = this.totalHeight;

            this.items = [...newItems, ...this.items];
            this.calculatePositions();
            
            // Adjust scroll position to maintain visual position
            const heightDiff = this.totalHeight - oldTotalHeight;
            this.container.scrollTop = oldScrollTop + heightDiff;
            
            this.render();
        }

        /**
         * Update single item
         */
        updateItem(index, item) {
            if (index >= 0 && index < this.items.length) {
                this.items[index] = item;
                
                // Re-render if visible
                const key = this.options.getItemKey(item, index);
                if (this.renderedItems.has(key)) {
                    this.renderItemAtIndex(index);
                }
            }
        }

        /**
         * Remove item
         */
        removeItem(index) {
            if (index >= 0 && index < this.items.length) {
                this.items.splice(index, 1);
                this.calculatePositions();
                this.render();
            }
        }

        /**
         * Calculate item positions
         */
        calculatePositions() {
            let offset = 0;
            this.positions.clear();

            for (let i = 0; i < this.items.length; i++) {
                const height = this.getItemHeight(i);
                this.positions.set(i, { offset, height });
                offset += height;
            }

            this.totalHeight = offset;
            this.spacer.style.height = `${this.totalHeight}px`;
        }

        /**
         * Get item height (estimated or measured)
         */
        getItemHeight(index) {
            const key = this.options.getItemKey(this.items[index], index);
            
            if (this.heights.has(key)) {
                return this.heights.get(key);
            }

            if (typeof this.options.itemHeight === 'function') {
                return this.options.itemHeight(this.items[index], index);
            }

            return this.options.estimatedItemHeight;
        }

        /**
         * Measure viewport
         */
        measure() {
            this.viewportHeight = this.container.clientHeight;
        }

        /**
         * Handle scroll event
         */
        handleScroll() {
            if (this.scrollRAF) {
                cancelAnimationFrame(this.scrollRAF);
            }

            this.scrollRAF = requestAnimationFrame(() => {
                this.scrollTop = this.container.scrollTop;
                this.render();

                // Check for load more
                if (this.options.onLoadMore && this.hasMore && !this.isLoading) {
                    const scrollBottom = this.scrollTop + this.viewportHeight;
                    const threshold = this.totalHeight - this.options.loadMoreThreshold;

                    if (scrollBottom >= threshold) {
                        this.loadMore();
                    }
                }

                // Custom scroll callback
                if (this.options.onScroll) {
                    this.options.onScroll({
                        scrollTop: this.scrollTop,
                        scrollHeight: this.totalHeight,
                        viewportHeight: this.viewportHeight
                    });
                }
            });
        }

        /**
         * Handle resize event
         */
        handleResize() {
            this.measure();
            this.render();
        }

        /**
         * Get visible range
         */
        getVisibleRange() {
            const buffer = this.options.buffer;
            let startIndex = 0;
            let endIndex = 0;

            // Find start index
            for (let i = 0; i < this.items.length; i++) {
                const pos = this.positions.get(i);
                if (pos && pos.offset + pos.height >= this.scrollTop) {
                    startIndex = Math.max(0, i - buffer);
                    break;
                }
            }

            // Find end index
            const endOffset = this.scrollTop + this.viewportHeight;
            for (let i = startIndex; i < this.items.length; i++) {
                const pos = this.positions.get(i);
                if (pos && pos.offset > endOffset) {
                    endIndex = Math.min(this.items.length - 1, i + buffer);
                    break;
                }
                endIndex = i;
            }

            endIndex = Math.min(this.items.length - 1, endIndex + buffer);

            return { startIndex, endIndex };
        }

        /**
         * Render visible items
         */
        render() {
            if (this.items.length === 0) {
                this.renderEmpty();
                return;
            }

            const { startIndex, endIndex } = this.getVisibleRange();
            const newRenderedKeys = new Set();

            // Render items in range
            for (let i = startIndex; i <= endIndex; i++) {
                const key = this.options.getItemKey(this.items[i], i);
                newRenderedKeys.add(key);

                if (!this.renderedItems.has(key)) {
                    this.renderItemAtIndex(i);
                } else {
                    // Update position if needed
                    this.updateItemPosition(i);
                }
            }

            // Remove items outside range
            for (const [key, element] of this.renderedItems) {
                if (!newRenderedKeys.has(key)) {
                    element.remove();
                    this.renderedItems.delete(key);
                }
            }
        }

        /**
         * Render item at index
         */
        renderItemAtIndex(index) {
            const item = this.items[index];
            const key = this.options.getItemKey(item, index);
            const pos = this.positions.get(index);

            // Remove existing if any
            if (this.renderedItems.has(key)) {
                this.renderedItems.get(key).remove();
            }

            // Create element
            const element = document.createElement('div');
            element.className = 'virtual-list-item';
            element.dataset.index = index;
            element.dataset.key = key;

            // Render content
            const content = this.options.renderItem(item, index);
            if (typeof content === 'string') {
                element.innerHTML = content;
            } else if (content instanceof HTMLElement) {
                element.appendChild(content);
            }

            // Position element
            element.style.transform = `translateY(${pos.offset}px)`;

            // Add to DOM
            this.content.appendChild(element);
            this.renderedItems.set(key, element);

            // Measure actual height if dynamic
            if (this.options.dynamicHeight) {
                const actualHeight = element.offsetHeight;
                if (actualHeight !== pos.height) {
                    this.heights.set(key, actualHeight);
                    this.calculatePositions();
                }
            }
        }

        /**
         * Update item position
         */
        updateItemPosition(index) {
            const item = this.items[index];
            const key = this.options.getItemKey(item, index);
            const element = this.renderedItems.get(key);
            const pos = this.positions.get(index);

            if (element && pos) {
                element.style.transform = `translateY(${pos.offset}px)`;
            }
        }

        /**
         * Render empty state
         */
        renderEmpty() {
            // Clear rendered items
            for (const element of this.renderedItems.values()) {
                element.remove();
            }
            this.renderedItems.clear();

            // Show empty message
            if (!this.emptyElement) {
                this.emptyElement = document.createElement('div');
                this.emptyElement.className = 'virtual-list-empty';
                this.emptyElement.innerHTML = `
                    <div class="virtual-list-empty-icon">📭</div>
                    <div>No items to display</div>
                `;
            }
            
            this.content.appendChild(this.emptyElement);
        }

        /**
         * Default render item function
         */
        defaultRenderItem(item, index) {
            return `<div>${JSON.stringify(item)}</div>`;
        }

        /**
         * Load more items
         */
        async loadMore() {
            if (this.isLoading || !this.hasMore) return;

            this.isLoading = true;
            this.showLoading();

            try {
                const result = await this.options.onLoadMore();
                if (result === false || (Array.isArray(result) && result.length === 0)) {
                    this.hasMore = false;
                }
            } catch (error) {
                console.error('Failed to load more items:', error);
            } finally {
                this.isLoading = false;
                this.hideLoading();
            }
        }

        /**
         * Show loading indicator
         */
        showLoading() {
            if (!this.loadingElement) {
                this.loadingElement = document.createElement('div');
                this.loadingElement.className = 'virtual-list-loading';
                this.loadingElement.innerHTML = 'Loading more...';
            }
            this.container.appendChild(this.loadingElement);
        }

        /**
         * Hide loading indicator
         */
        hideLoading() {
            if (this.loadingElement && this.loadingElement.parentNode) {
                this.loadingElement.remove();
            }
        }

        /**
         * Scroll to index
         */
        scrollToIndex(index, behavior = 'smooth') {
            const pos = this.positions.get(index);
            if (pos) {
                this.container.scrollTo({
                    top: pos.offset,
                    behavior
                });
            }
        }

        /**
         * Scroll to top
         */
        scrollToTop(behavior = 'smooth') {
            this.container.scrollTo({ top: 0, behavior });
        }

        /**
         * Scroll to bottom
         */
        scrollToBottom(behavior = 'smooth') {
            this.container.scrollTo({ top: this.totalHeight, behavior });
        }

        /**
         * Get scroll info
         */
        getScrollInfo() {
            return {
                scrollTop: this.scrollTop,
                scrollHeight: this.totalHeight,
                viewportHeight: this.viewportHeight,
                isAtTop: this.scrollTop <= 0,
                isAtBottom: this.scrollTop + this.viewportHeight >= this.totalHeight - 1
            };
        }

        /**
         * Refresh layout
         */
        refresh() {
            this.heights.clear();
            this.calculatePositions();
            this.measure();
            this.render();
        }

        /**
         * Destroy instance
         */
        destroy() {
            this.container.removeEventListener('scroll', this.handleScroll);
            window.removeEventListener('resize', this.handleResize);

            if (this.scrollRAF) {
                cancelAnimationFrame(this.scrollRAF);
            }

            this.content.remove();
            this.container.classList.remove('virtual-list');

            this.items = [];
            this.heights.clear();
            this.positions.clear();
            this.renderedItems.clear();
        }
    }

    /**
     * Create virtual list
     */
    function create(container, options) {
        return new VirtualList(container, options);
    }

    // Export API
    window.VirtualList = {
        create,
        VirtualList
    };

    console.log('📜 VirtualList module initialized');
})();
