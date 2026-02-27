/**
 * Carousel - Touch-friendly image/content slider
 * Quest Mini - Farcaster Mini-App
 */

(function() {
    'use strict';

    // Default styles
    const defaultStyles = `
        .carousel {
            position: relative;
            overflow: hidden;
            touch-action: pan-y pinch-zoom;
        }
        
        .carousel-track {
            display: flex;
            transition: transform 0.3s ease;
            will-change: transform;
        }
        
        .carousel.dragging .carousel-track {
            transition: none;
        }
        
        .carousel-slide {
            flex: 0 0 100%;
            min-width: 100%;
        }
        
        .carousel-slide img {
            width: 100%;
            height: auto;
            display: block;
            user-select: none;
            -webkit-user-drag: none;
        }
        
        /* Navigation arrows */
        .carousel-nav {
            position: absolute;
            top: 50%;
            transform: translateY(-50%);
            width: 40px;
            height: 40px;
            background: rgba(0, 0, 0, 0.5);
            border: none;
            border-radius: 50%;
            color: white;
            font-size: 18px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s ease;
            z-index: 10;
        }
        
        .carousel-nav:hover {
            background: var(--primary, #8B5CF6);
        }
        
        .carousel-nav:disabled {
            opacity: 0.3;
            cursor: not-allowed;
        }
        
        .carousel-nav.prev {
            left: 12px;
        }
        
        .carousel-nav.next {
            right: 12px;
        }
        
        .carousel-nav:focus-visible {
            outline: 2px solid white;
            outline-offset: 2px;
        }
        
        /* Pagination dots */
        .carousel-pagination {
            display: flex;
            justify-content: center;
            gap: 8px;
            padding: 12px 0;
        }
        
        .carousel-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: var(--border, #2D2D44);
            border: none;
            padding: 0;
            cursor: pointer;
            transition: all 0.2s ease;
        }
        
        .carousel-dot:hover {
            background: var(--text-secondary, #A1A1AA);
        }
        
        .carousel-dot.active {
            background: var(--primary, #8B5CF6);
            width: 24px;
            border-radius: 4px;
        }
        
        .carousel-dot:focus-visible {
            outline: 2px solid var(--primary, #8B5CF6);
            outline-offset: 2px;
        }
        
        /* Progress bar */
        .carousel-progress {
            height: 3px;
            background: var(--border, #2D2D44);
            position: relative;
            margin-top: 8px;
        }
        
        .carousel-progress-fill {
            position: absolute;
            left: 0;
            top: 0;
            height: 100%;
            background: var(--primary, #8B5CF6);
            transition: width 0.3s ease;
        }
        
        /* Autoplay indicator */
        .carousel-autoplay {
            position: absolute;
            top: 12px;
            right: 12px;
            width: 32px;
            height: 32px;
            background: rgba(0, 0, 0, 0.5);
            border: none;
            border-radius: 50%;
            color: white;
            font-size: 14px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10;
        }
        
        /* Slide counter */
        .carousel-counter {
            position: absolute;
            bottom: 12px;
            right: 12px;
            background: rgba(0, 0, 0, 0.5);
            color: white;
            padding: 4px 10px;
            border-radius: 12px;
            font-size: 12px;
            z-index: 10;
        }
        
        /* Variants */
        .carousel.card .carousel-slide {
            padding: 0 8px;
        }
        
        .carousel.peek .carousel-slide {
            flex: 0 0 85%;
            min-width: 85%;
        }
        
        .carousel.peek .carousel-slide:first-child {
            margin-left: 7.5%;
        }
        
        /* Fade transition */
        .carousel.fade .carousel-track {
            display: block;
        }
        
        .carousel.fade .carousel-slide {
            position: absolute;
            top: 0;
            left: 0;
            opacity: 0;
            transition: opacity 0.3s ease;
        }
        
        .carousel.fade .carousel-slide.active {
            position: relative;
            opacity: 1;
        }
    `;

    // Inject styles
    function injectStyles() {
        if (document.getElementById('carousel-styles')) return;
        const style = document.createElement('style');
        style.id = 'carousel-styles';
        style.textContent = defaultStyles;
        document.head.appendChild(style);
    }

    /**
     * Create carousel instance
     */
    function create(container, options = {}) {
        injectStyles();

        const el = typeof container === 'string' 
            ? document.querySelector(container) 
            : container;

        if (!el) {
            console.error('Carousel container not found');
            return null;
        }

        const {
            slides = [],
            startIndex = 0,
            loop = true,
            autoplay = false,
            autoplayInterval = 5000,
            showArrows = true,
            showPagination = true,
            showCounter = false,
            showProgress = false,
            variant = 'default', // default, card, peek, fade
            draggable = true,
            dragThreshold = 50,
            onChange = null
        } = options;

        const state = {
            currentIndex: startIndex,
            slides: [...slides],
            isPlaying: autoplay,
            autoplayTimer: null,
            isDragging: false,
            startX: 0,
            currentX: 0
        };

        // Build DOM
        el.className = `carousel ${variant} ${options.class || ''}`;
        el.innerHTML = '';

        // Track
        const track = document.createElement('div');
        track.className = 'carousel-track';
        track.setAttribute('role', 'region');
        track.setAttribute('aria-live', 'polite');

        // Create slides
        state.slides.forEach((slide, index) => {
            const slideEl = document.createElement('div');
            slideEl.className = `carousel-slide ${index === state.currentIndex ? 'active' : ''}`;
            slideEl.setAttribute('role', 'group');
            slideEl.setAttribute('aria-roledescription', 'slide');
            slideEl.setAttribute('aria-label', `Slide ${index + 1} of ${state.slides.length}`);

            if (typeof slide === 'string') {
                // Image URL
                const img = document.createElement('img');
                img.src = slide;
                img.alt = `Slide ${index + 1}`;
                img.draggable = false;
                slideEl.appendChild(img);
            } else if (slide.image) {
                const img = document.createElement('img');
                img.src = slide.image;
                img.alt = slide.alt || `Slide ${index + 1}`;
                img.draggable = false;
                slideEl.appendChild(img);
            } else if (slide.content) {
                slideEl.innerHTML = typeof slide.content === 'function' 
                    ? slide.content() 
                    : slide.content;
            }

            track.appendChild(slideEl);
        });

        el.appendChild(track);

        // Navigation arrows
        if (showArrows && state.slides.length > 1) {
            const prevBtn = document.createElement('button');
            prevBtn.className = 'carousel-nav prev';
            prevBtn.innerHTML = '‹';
            prevBtn.setAttribute('aria-label', 'Previous slide');
            prevBtn.addEventListener('click', prev);

            const nextBtn = document.createElement('button');
            nextBtn.className = 'carousel-nav next';
            nextBtn.innerHTML = '›';
            nextBtn.setAttribute('aria-label', 'Next slide');
            nextBtn.addEventListener('click', next);

            el.appendChild(prevBtn);
            el.appendChild(nextBtn);
        }

        // Pagination dots
        let paginationEl;
        if (showPagination && state.slides.length > 1) {
            paginationEl = document.createElement('div');
            paginationEl.className = 'carousel-pagination';
            paginationEl.setAttribute('role', 'tablist');

            state.slides.forEach((_, index) => {
                const dot = document.createElement('button');
                dot.className = `carousel-dot ${index === state.currentIndex ? 'active' : ''}`;
                dot.setAttribute('role', 'tab');
                dot.setAttribute('aria-selected', index === state.currentIndex);
                dot.setAttribute('aria-label', `Go to slide ${index + 1}`);
                dot.addEventListener('click', () => goTo(index));
                paginationEl.appendChild(dot);
            });

            el.appendChild(paginationEl);
        }

        // Counter
        let counterEl;
        if (showCounter) {
            counterEl = document.createElement('div');
            counterEl.className = 'carousel-counter';
            updateCounter();
            el.appendChild(counterEl);
        }

        // Progress bar
        let progressEl;
        if (showProgress) {
            progressEl = document.createElement('div');
            progressEl.className = 'carousel-progress';
            const fill = document.createElement('div');
            fill.className = 'carousel-progress-fill';
            progressEl.appendChild(fill);
            el.appendChild(progressEl);
            updateProgress();
        }

        // Touch/mouse drag
        if (draggable && state.slides.length > 1) {
            track.addEventListener('mousedown', handleDragStart);
            track.addEventListener('touchstart', handleDragStart, { passive: true });
            window.addEventListener('mousemove', handleDragMove);
            window.addEventListener('touchmove', handleDragMove, { passive: true });
            window.addEventListener('mouseup', handleDragEnd);
            window.addEventListener('touchend', handleDragEnd);
        }

        function handleDragStart(e) {
            if (e.type === 'mousedown' && e.button !== 0) return;
            
            state.isDragging = true;
            state.startX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
            state.currentX = state.startX;
            el.classList.add('dragging');
            
            pauseAutoplay();
        }

        function handleDragMove(e) {
            if (!state.isDragging) return;
            
            state.currentX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
            const diff = state.currentX - state.startX;
            const offset = -(state.currentIndex * 100) + (diff / el.offsetWidth * 100);
            
            track.style.transform = `translateX(${offset}%)`;
        }

        function handleDragEnd() {
            if (!state.isDragging) return;
            
            state.isDragging = false;
            el.classList.remove('dragging');
            
            const diff = state.currentX - state.startX;
            
            if (Math.abs(diff) > dragThreshold) {
                if (diff > 0) {
                    prev();
                } else {
                    next();
                }
            } else {
                updateTrack();
            }
            
            if (state.isPlaying) startAutoplay();
        }

        function updateTrack() {
            if (variant === 'fade') {
                track.querySelectorAll('.carousel-slide').forEach((slide, i) => {
                    slide.classList.toggle('active', i === state.currentIndex);
                });
            } else {
                track.style.transform = `translateX(-${state.currentIndex * 100}%)`;
            }
        }

        function updatePagination() {
            if (!paginationEl) return;
            paginationEl.querySelectorAll('.carousel-dot').forEach((dot, i) => {
                dot.classList.toggle('active', i === state.currentIndex);
                dot.setAttribute('aria-selected', i === state.currentIndex);
            });
        }

        function updateCounter() {
            if (!counterEl) return;
            counterEl.textContent = `${state.currentIndex + 1} / ${state.slides.length}`;
        }

        function updateProgress() {
            if (!progressEl) return;
            const fill = progressEl.querySelector('.carousel-progress-fill');
            const progress = ((state.currentIndex + 1) / state.slides.length) * 100;
            fill.style.width = `${progress}%`;
        }

        function updateNavButtons() {
            if (!showArrows || loop) return;
            const prevBtn = el.querySelector('.carousel-nav.prev');
            const nextBtn = el.querySelector('.carousel-nav.next');
            if (prevBtn) prevBtn.disabled = state.currentIndex === 0;
            if (nextBtn) nextBtn.disabled = state.currentIndex === state.slides.length - 1;
        }

        function goTo(index, emit = true) {
            const prevIndex = state.currentIndex;
            
            if (loop) {
                state.currentIndex = ((index % state.slides.length) + state.slides.length) % state.slides.length;
            } else {
                state.currentIndex = Math.max(0, Math.min(index, state.slides.length - 1));
            }

            updateTrack();
            updatePagination();
            updateCounter();
            updateProgress();
            updateNavButtons();

            if (emit && state.currentIndex !== prevIndex) {
                if (onChange) {
                    onChange(state.currentIndex, state.slides[state.currentIndex], prevIndex);
                }
                el.dispatchEvent(new CustomEvent('slide-change', {
                    detail: { index: state.currentIndex, prevIndex }
                }));
            }
        }

        function next() {
            goTo(state.currentIndex + 1);
        }

        function prev() {
            goTo(state.currentIndex - 1);
        }

        function startAutoplay() {
            if (state.autoplayTimer) return;
            state.isPlaying = true;
            state.autoplayTimer = setInterval(next, autoplayInterval);
        }

        function pauseAutoplay() {
            state.isPlaying = false;
            if (state.autoplayTimer) {
                clearInterval(state.autoplayTimer);
                state.autoplayTimer = null;
            }
        }

        // Initial state
        updateTrack();
        updateNavButtons();
        if (autoplay) startAutoplay();

        // Keyboard navigation
        el.setAttribute('tabindex', '0');
        el.addEventListener('keydown', (e) => {
            switch (e.key) {
                case 'ArrowLeft':
                    prev();
                    break;
                case 'ArrowRight':
                    next();
                    break;
            }
        });

        // Pause on hover/focus
        el.addEventListener('mouseenter', () => {
            if (state.isPlaying) pauseAutoplay();
        });
        el.addEventListener('mouseleave', () => {
            if (autoplay && !state.isDragging) startAutoplay();
        });

        // Cleanup
        function destroy() {
            pauseAutoplay();
            window.removeEventListener('mousemove', handleDragMove);
            window.removeEventListener('touchmove', handleDragMove);
            window.removeEventListener('mouseup', handleDragEnd);
            window.removeEventListener('touchend', handleDragEnd);
            el.innerHTML = '';
            el.className = '';
        }

        // Public API
        return {
            el,
            
            getCurrentIndex() {
                return state.currentIndex;
            },

            getSlideCount() {
                return state.slides.length;
            },

            goTo,
            next,
            prev,

            play() {
                startAutoplay();
            },

            pause() {
                pauseAutoplay();
            },

            isPlaying() {
                return state.isPlaying;
            },

            addSlide(slide, index) {
                const insertIndex = index ?? state.slides.length;
                state.slides.splice(insertIndex, 0, slide);
                // Would need to rebuild track
            },

            removeSlide(index) {
                if (state.slides[index]) {
                    state.slides.splice(index, 1);
                    track.children[index]?.remove();
                    if (state.currentIndex >= state.slides.length) {
                        goTo(state.slides.length - 1);
                    }
                }
            },

            destroy
        };
    }

    // Export API
    window.Carousel = {
        create
    };

    console.log('🎠 Carousel component initialized');
})();
