/**
 * Drag and Drop - Touch and mouse drag/drop utilities
 * Quest Mini - Farcaster Mini-App
 */

(function() {
    'use strict';

    // Inject CSS
    const styles = `
        .draggable {
            touch-action: none;
            user-select: none;
            cursor: grab;
        }

        .draggable.dragging {
            cursor: grabbing;
            opacity: 0.8;
            z-index: 1000;
        }

        .draggable-ghost {
            position: fixed;
            pointer-events: none;
            z-index: 10000;
            opacity: 0.9;
            transform: scale(1.02);
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
        }

        .drop-zone {
            transition: background-color 0.2s ease, border-color 0.2s ease;
        }

        .drop-zone.drag-over {
            background-color: rgba(139, 92, 246, 0.1);
            border-color: rgba(139, 92, 246, 0.5) !important;
        }

        .drop-zone.drop-valid {
            background-color: rgba(16, 185, 129, 0.1);
            border-color: #10B981 !important;
        }

        .drop-zone.drop-invalid {
            background-color: rgba(239, 68, 68, 0.1);
            border-color: #EF4444 !important;
        }

        .sortable-placeholder {
            background: rgba(139, 92, 246, 0.1);
            border: 2px dashed rgba(139, 92, 246, 0.4);
            border-radius: 8px;
            transition: height 0.2s ease;
        }

        .sortable-item {
            transition: transform 0.2s ease;
        }

        .sortable-item.sorting {
            transition: none;
        }

        .drag-handle {
            cursor: grab;
            touch-action: none;
        }

        .drag-handle:active {
            cursor: grabbing;
        }
    `;

    // Inject styles
    const styleSheet = document.createElement('style');
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);

    /**
     * Make element draggable
     */
    function makeDraggable(element, options = {}) {
        const config = {
            handle: null, // Selector for drag handle
            ghost: true, // Create ghost element
            ghostClass: 'draggable-ghost',
            dragClass: 'dragging',
            axis: null, // 'x', 'y', or null for both
            bounds: null, // Constraint bounds (element or 'parent')
            onStart: null,
            onDrag: null,
            onEnd: null,
            data: null, // Data to transfer
            ...options
        };

        const el = typeof element === 'string' ? document.querySelector(element) : element;
        if (!el) return null;

        el.classList.add('draggable');

        let isDragging = false;
        let startX, startY;
        let offsetX, offsetY;
        let ghostEl = null;
        let currentX, currentY;

        const handle = config.handle ? el.querySelector(config.handle) : el;

        function getPointerPosition(e) {
            if (e.touches) {
                return { x: e.touches[0].clientX, y: e.touches[0].clientY };
            }
            return { x: e.clientX, y: e.clientY };
        }

        function handleStart(e) {
            if (config.handle && !e.target.closest(config.handle)) return;
            
            e.preventDefault();
            const pos = getPointerPosition(e);

            isDragging = true;
            startX = pos.x;
            startY = pos.y;

            const rect = el.getBoundingClientRect();
            offsetX = pos.x - rect.left;
            offsetY = pos.y - rect.top;
            currentX = rect.left;
            currentY = rect.top;

            el.classList.add(config.dragClass);

            // Create ghost
            if (config.ghost) {
                ghostEl = el.cloneNode(true);
                ghostEl.className = config.ghostClass;
                ghostEl.style.width = `${rect.width}px`;
                ghostEl.style.height = `${rect.height}px`;
                ghostEl.style.left = `${currentX}px`;
                ghostEl.style.top = `${currentY}px`;
                document.body.appendChild(ghostEl);
            }

            if (config.onStart) {
                config.onStart({
                    element: el,
                    startX: pos.x,
                    startY: pos.y,
                    data: config.data
                });
            }

            // Add move/end listeners
            document.addEventListener('mousemove', handleMove);
            document.addEventListener('mouseup', handleEnd);
            document.addEventListener('touchmove', handleMove, { passive: false });
            document.addEventListener('touchend', handleEnd);
        }

        function handleMove(e) {
            if (!isDragging) return;
            e.preventDefault();

            const pos = getPointerPosition(e);
            let newX = pos.x - offsetX;
            let newY = pos.y - offsetY;

            // Apply axis constraint
            if (config.axis === 'x') {
                newY = currentY;
            } else if (config.axis === 'y') {
                newX = currentX;
            }

            // Apply bounds
            if (config.bounds) {
                const boundsEl = config.bounds === 'parent' 
                    ? el.parentElement 
                    : document.querySelector(config.bounds);
                
                if (boundsEl) {
                    const boundsRect = boundsEl.getBoundingClientRect();
                    const elRect = el.getBoundingClientRect();
                    
                    newX = Math.max(boundsRect.left, Math.min(boundsRect.right - elRect.width, newX));
                    newY = Math.max(boundsRect.top, Math.min(boundsRect.bottom - elRect.height, newY));
                }
            }

            currentX = newX;
            currentY = newY;

            // Update ghost position
            if (ghostEl) {
                ghostEl.style.left = `${newX}px`;
                ghostEl.style.top = `${newY}px`;
            }

            if (config.onDrag) {
                config.onDrag({
                    element: el,
                    x: newX,
                    y: newY,
                    deltaX: pos.x - startX,
                    deltaY: pos.y - startY,
                    data: config.data
                });
            }
        }

        function handleEnd(e) {
            if (!isDragging) return;

            isDragging = false;
            el.classList.remove(config.dragClass);

            // Remove ghost
            if (ghostEl) {
                ghostEl.remove();
                ghostEl = null;
            }

            const pos = e.changedTouches ? 
                { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY } :
                { x: e.clientX, y: e.clientY };

            if (config.onEnd) {
                config.onEnd({
                    element: el,
                    x: currentX,
                    y: currentY,
                    deltaX: pos.x - startX,
                    deltaY: pos.y - startY,
                    data: config.data
                });
            }

            // Remove listeners
            document.removeEventListener('mousemove', handleMove);
            document.removeEventListener('mouseup', handleEnd);
            document.removeEventListener('touchmove', handleMove);
            document.removeEventListener('touchend', handleEnd);
        }

        // Attach listeners
        handle.addEventListener('mousedown', handleStart);
        handle.addEventListener('touchstart', handleStart, { passive: false });

        // Return controller
        return {
            destroy: () => {
                handle.removeEventListener('mousedown', handleStart);
                handle.removeEventListener('touchstart', handleStart);
                el.classList.remove('draggable');
            },
            setData: (data) => {
                config.data = data;
            }
        };
    }

    /**
     * Make element a drop zone
     */
    function makeDropZone(element, options = {}) {
        const config = {
            accept: null, // Function to validate drop
            onEnter: null,
            onLeave: null,
            onOver: null,
            onDrop: null,
            hoverClass: 'drag-over',
            validClass: 'drop-valid',
            invalidClass: 'drop-invalid',
            ...options
        };

        const el = typeof element === 'string' ? document.querySelector(element) : element;
        if (!el) return null;

        el.classList.add('drop-zone');

        let dragCounter = 0;

        function handleDragEnter(e) {
            e.preventDefault();
            dragCounter++;

            if (dragCounter === 1) {
                el.classList.add(config.hoverClass);
                
                if (config.onEnter) {
                    config.onEnter({ element: el, event: e });
                }
            }
        }

        function handleDragOver(e) {
            e.preventDefault();
            
            const isValid = !config.accept || config.accept(e);
            
            el.classList.remove(config.validClass, config.invalidClass);
            el.classList.add(isValid ? config.validClass : config.invalidClass);

            if (config.onOver) {
                config.onOver({ element: el, event: e, valid: isValid });
            }
        }

        function handleDragLeave(e) {
            dragCounter--;

            if (dragCounter === 0) {
                el.classList.remove(config.hoverClass, config.validClass, config.invalidClass);
                
                if (config.onLeave) {
                    config.onLeave({ element: el, event: e });
                }
            }
        }

        function handleDrop(e) {
            e.preventDefault();
            dragCounter = 0;

            el.classList.remove(config.hoverClass, config.validClass, config.invalidClass);

            const isValid = !config.accept || config.accept(e);
            
            if (isValid && config.onDrop) {
                const data = e.dataTransfer ? e.dataTransfer.getData('text/plain') : null;
                config.onDrop({
                    element: el,
                    event: e,
                    data: data ? JSON.parse(data) : null
                });
            }
        }

        el.addEventListener('dragenter', handleDragEnter);
        el.addEventListener('dragover', handleDragOver);
        el.addEventListener('dragleave', handleDragLeave);
        el.addEventListener('drop', handleDrop);

        return {
            destroy: () => {
                el.removeEventListener('dragenter', handleDragEnter);
                el.removeEventListener('dragover', handleDragOver);
                el.removeEventListener('dragleave', handleDragLeave);
                el.removeEventListener('drop', handleDrop);
                el.classList.remove('drop-zone');
            }
        };
    }

    /**
     * Create sortable list
     */
    function makeSortable(container, options = {}) {
        const config = {
            items: '.sortable-item',
            handle: null,
            animation: 200,
            ghostClass: 'sortable-ghost',
            placeholderClass: 'sortable-placeholder',
            onStart: null,
            onMove: null,
            onEnd: null,
            onUpdate: null,
            ...options
        };

        const el = typeof container === 'string' ? document.querySelector(container) : container;
        if (!el) return null;

        let draggingItem = null;
        let placeholder = null;
        let items = [];
        let startIndex = -1;

        function getItems() {
            return Array.from(el.querySelectorAll(config.items));
        }

        function createPlaceholder(item) {
            placeholder = document.createElement('div');
            placeholder.className = config.placeholderClass;
            placeholder.style.height = `${item.offsetHeight}px`;
            return placeholder;
        }

        function getInsertIndex(y) {
            const itemEls = getItems().filter(i => i !== draggingItem && i !== placeholder);
            
            for (let i = 0; i < itemEls.length; i++) {
                const rect = itemEls[i].getBoundingClientRect();
                const midY = rect.top + rect.height / 2;
                
                if (y < midY) {
                    return i;
                }
            }
            
            return itemEls.length;
        }

        function handleStart(e) {
            const item = e.target.closest(config.items);
            if (!item) return;
            if (config.handle && !e.target.closest(config.handle)) return;

            e.preventDefault();
            
            draggingItem = item;
            items = getItems();
            startIndex = items.indexOf(item);

            item.classList.add('sorting', config.ghostClass);
            
            // Create placeholder
            placeholder = createPlaceholder(item);
            item.parentNode.insertBefore(placeholder, item);

            if (config.onStart) {
                config.onStart({ item, index: startIndex });
            }

            document.addEventListener('mousemove', handleMove);
            document.addEventListener('mouseup', handleEnd);
            document.addEventListener('touchmove', handleMove, { passive: false });
            document.addEventListener('touchend', handleEnd);
        }

        function handleMove(e) {
            if (!draggingItem) return;
            e.preventDefault();

            const pos = e.touches ? 
                { x: e.touches[0].clientX, y: e.touches[0].clientY } :
                { x: e.clientX, y: e.clientY };

            // Move item with cursor
            const rect = el.getBoundingClientRect();
            draggingItem.style.position = 'fixed';
            draggingItem.style.left = `${pos.x - rect.left}px`;
            draggingItem.style.top = `${pos.y - 30}px`;
            draggingItem.style.width = `${rect.width - 40}px`;

            // Find insertion point
            const insertIndex = getInsertIndex(pos.y);
            const itemEls = getItems().filter(i => i !== draggingItem && i !== placeholder);
            
            // Move placeholder
            if (insertIndex < itemEls.length) {
                el.insertBefore(placeholder, itemEls[insertIndex]);
            } else {
                el.appendChild(placeholder);
            }

            if (config.onMove) {
                config.onMove({ item: draggingItem, index: insertIndex });
            }
        }

        function handleEnd(e) {
            if (!draggingItem) return;

            // Get final index
            const itemEls = getItems().filter(i => i !== draggingItem);
            let endIndex = itemEls.indexOf(placeholder);
            if (endIndex === -1) endIndex = itemEls.length;

            // Reset item style
            draggingItem.style.position = '';
            draggingItem.style.left = '';
            draggingItem.style.top = '';
            draggingItem.style.width = '';
            draggingItem.classList.remove('sorting', config.ghostClass);

            // Insert item at placeholder position
            if (placeholder && placeholder.parentNode) {
                placeholder.parentNode.insertBefore(draggingItem, placeholder);
                placeholder.remove();
            }

            const moved = startIndex !== endIndex;

            if (config.onEnd) {
                config.onEnd({
                    item: draggingItem,
                    oldIndex: startIndex,
                    newIndex: endIndex,
                    moved
                });
            }

            if (moved && config.onUpdate) {
                config.onUpdate({
                    oldIndex: startIndex,
                    newIndex: endIndex,
                    items: getItems()
                });
            }

            draggingItem = null;
            placeholder = null;

            document.removeEventListener('mousemove', handleMove);
            document.removeEventListener('mouseup', handleEnd);
            document.removeEventListener('touchmove', handleMove);
            document.removeEventListener('touchend', handleEnd);
        }

        // Attach listeners to container
        el.addEventListener('mousedown', handleStart);
        el.addEventListener('touchstart', handleStart, { passive: false });

        return {
            destroy: () => {
                el.removeEventListener('mousedown', handleStart);
                el.removeEventListener('touchstart', handleStart);
            },
            refresh: () => {
                items = getItems();
            },
            getOrder: () => {
                return getItems().map((item, i) => ({
                    element: item,
                    index: i,
                    data: item.dataset
                }));
            }
        };
    }

    /**
     * Enable native drag/drop on element
     */
    function enableNativeDrag(element, data) {
        const el = typeof element === 'string' ? document.querySelector(element) : element;
        if (!el) return;

        el.draggable = true;

        el.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', JSON.stringify(data));
            e.dataTransfer.effectAllowed = 'move';
            el.classList.add('dragging');
        });

        el.addEventListener('dragend', () => {
            el.classList.remove('dragging');
        });
    }

    // Export API
    window.DragDrop = {
        makeDraggable,
        makeDropZone,
        makeSortable,
        enableNativeDrag
    };

    console.log('🖐️ DragDrop module initialized');
})();
