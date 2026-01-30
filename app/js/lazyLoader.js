/**
 * Lazy Loading - Image and content lazy loading with IntersectionObserver
 * Quest Mini - Farcaster Mini-App
 */

(function() {
    'use strict';

    // Inject CSS
    const styles = `
        .lazy-image {
            opacity: 0;
            transition: opacity 0.3s ease;
        }

        .lazy-image.loaded {
            opacity: 1;
        }

        .lazy-image.error {
            opacity: 0.5;
        }

        .lazy-wrapper {
            position: relative;
            overflow: hidden;
            background: rgba(255, 255, 255, 0.05);
        }

        .lazy-placeholder {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            background: linear-gradient(90deg, 
                rgba(255, 255, 255, 0.05) 0%,
                rgba(255, 255, 255, 0.1) 50%,
                rgba(255, 255, 255, 0.05) 100%
            );
            background-size: 200% 100%;
            animation: shimmer 1.5s infinite;
        }

        @keyframes shimmer {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
        }

        .lazy-wrapper.loaded .lazy-placeholder {
            opacity: 0;
            pointer-events: none;
        }

        .lazy-blur {
            filter: blur(20px);
            transform: scale(1.1);
            transition: filter 0.3s ease, transform 0.3s ease;
        }

        .lazy-blur.loaded {
            filter: blur(0);
            transform: scale(1);
        }

        .lazy-content {
            opacity: 0;
            transform: translateY(20px);
            transition: opacity 0.4s ease, transform 0.4s ease;
        }

        .lazy-content.visible {
            opacity: 1;
            transform: translateY(0);
        }

        .lazy-progress {
            position: absolute;
            bottom: 0;
            left: 0;
            height: 3px;
            background: #8B5CF6;
            transition: width 0.1s ease;
            z-index: 1;
        }
    `;

    // Inject styles
    const styleSheet = document.createElement('style');
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);

    // Default configuration
    const defaultConfig = {
        rootMargin: '50px',
        threshold: 0.1,
        loadingClass: 'loading',
        loadedClass: 'loaded',
        errorClass: 'error'
    };

    // Observer instances
    let imageObserver = null;
    let contentObserver = null;

    /**
     * Initialize lazy image loading
     */
    function initImages(options = {}) {
        const config = { ...defaultConfig, ...options };

        if (!('IntersectionObserver' in window)) {
            // Fallback: load all images immediately
            loadAllImages();
            return;
        }

        imageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    loadImage(img, config);
                    imageObserver.unobserve(img);
                }
            });
        }, {
            rootMargin: config.rootMargin,
            threshold: config.threshold
        });

        // Observe all lazy images
        observeImages();
    }

    /**
     * Observe images with data-src attribute
     */
    function observeImages(container = document) {
        if (!imageObserver) {
            initImages();
            return;
        }

        const images = container.querySelectorAll('img[data-src], [data-background]');
        images.forEach(img => {
            if (!img.dataset.observed) {
                img.dataset.observed = 'true';
                img.classList.add('lazy-image');
                imageObserver.observe(img);
            }
        });
    }

    /**
     * Load a single image
     */
    function loadImage(element, config = defaultConfig) {
        return new Promise((resolve, reject) => {
            const src = element.dataset.src || element.dataset.background;
            if (!src) {
                resolve(element);
                return;
            }

            element.classList.add(config.loadingClass);

            // Handle background images
            if (element.dataset.background) {
                const img = new Image();
                img.onload = () => {
                    element.style.backgroundImage = `url(${src})`;
                    element.classList.remove(config.loadingClass);
                    element.classList.add(config.loadedClass);
                    delete element.dataset.background;
                    resolve(element);
                };
                img.onerror = () => {
                    element.classList.remove(config.loadingClass);
                    element.classList.add(config.errorClass);
                    reject(new Error(`Failed to load: ${src}`));
                };
                img.src = src;
                return;
            }

            // Handle img elements
            if (element.tagName === 'IMG') {
                element.onload = () => {
                    element.classList.remove(config.loadingClass);
                    element.classList.add(config.loadedClass);
                    delete element.dataset.src;
                    resolve(element);
                };
                element.onerror = () => {
                    element.classList.remove(config.loadingClass);
                    element.classList.add(config.errorClass);
                    
                    // Set fallback image if provided
                    if (element.dataset.fallback) {
                        element.src = element.dataset.fallback;
                    }
                    
                    reject(new Error(`Failed to load: ${src}`));
                };
                
                // Set srcset if available
                if (element.dataset.srcset) {
                    element.srcset = element.dataset.srcset;
                    delete element.dataset.srcset;
                }
                
                element.src = src;
            }
        });
    }

    /**
     * Load all images immediately (fallback)
     */
    function loadAllImages() {
        const images = document.querySelectorAll('img[data-src], [data-background]');
        images.forEach(img => loadImage(img));
    }

    /**
     * Create lazy image wrapper with placeholder
     */
    function createLazyImage(src, options = {}) {
        const {
            alt = '',
            width,
            height,
            placeholder = null, // Low-res placeholder URL
            aspectRatio = null, // e.g., '16/9'
            className = '',
            onLoad,
            onError
        } = options;

        const wrapper = document.createElement('div');
        wrapper.className = `lazy-wrapper ${className}`;

        if (aspectRatio) {
            wrapper.style.aspectRatio = aspectRatio;
        } else if (width && height) {
            wrapper.style.aspectRatio = `${width}/${height}`;
        }

        // Add shimmer placeholder
        const placeholderEl = document.createElement('div');
        placeholderEl.className = 'lazy-placeholder';
        wrapper.appendChild(placeholderEl);

        // Create image
        const img = document.createElement('img');
        img.className = 'lazy-image';
        img.alt = alt;
        img.dataset.src = src;

        if (placeholder) {
            img.src = placeholder;
            img.classList.add('lazy-blur');
        }

        if (width) img.width = width;
        if (height) img.height = height;

        img.onload = function() {
            if (this.src === src) {
                this.classList.add('loaded');
                wrapper.classList.add('loaded');
                if (onLoad) onLoad(this);
            }
        };

        img.onerror = function() {
            this.classList.add('error');
            if (onError) onError(this);
        };

        wrapper.appendChild(img);

        // Observe for loading
        if (imageObserver) {
            imageObserver.observe(img);
        } else {
            loadImage(img);
        }

        return wrapper;
    }

    /**
     * Initialize lazy content loading
     */
    function initContent(options = {}) {
        const config = {
            rootMargin: '100px',
            threshold: 0.1,
            ...options
        };

        if (!('IntersectionObserver' in window)) {
            // Fallback: show all content
            document.querySelectorAll('.lazy-content').forEach(el => {
                el.classList.add('visible');
            });
            return;
        }

        contentObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const element = entry.target;
                    element.classList.add('visible');
                    
                    // Call custom load function if defined
                    if (element.dataset.lazyLoad) {
                        const loadFn = window[element.dataset.lazyLoad];
                        if (typeof loadFn === 'function') {
                            loadFn(element);
                        }
                    }

                    // Optionally keep observing for animations
                    if (!element.dataset.keepObserving) {
                        contentObserver.unobserve(element);
                    }
                } else if (entry.target.dataset.keepObserving) {
                    entry.target.classList.remove('visible');
                }
            });
        }, config);

        observeContent();
    }

    /**
     * Observe content elements
     */
    function observeContent(container = document) {
        if (!contentObserver) {
            initContent();
            return;
        }

        const elements = container.querySelectorAll('.lazy-content, [data-lazy]');
        elements.forEach(el => {
            if (!el.dataset.observed) {
                el.dataset.observed = 'true';
                contentObserver.observe(el);
            }
        });
    }

    /**
     * Lazy load a component/module
     */
    async function loadComponent(url, options = {}) {
        const { 
            cache = true,
            timeout = 10000 
        } = options;

        const cacheKey = `lazy_component_${url}`;

        // Check cache
        if (cache && window.sessionStorage) {
            const cached = sessionStorage.getItem(cacheKey);
            if (cached) {
                return cached;
            }
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        try {
            const response = await fetch(url, { signal: controller.signal });
            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const content = await response.text();

            // Cache the result
            if (cache && window.sessionStorage) {
                try {
                    sessionStorage.setItem(cacheKey, content);
                } catch (e) {
                    // Storage full, ignore
                }
            }

            return content;
        } catch (error) {
            clearTimeout(timeoutId);
            throw error;
        }
    }

    /**
     * Preload images
     */
    function preload(urls) {
        const promises = urls.map(url => {
            return new Promise((resolve, reject) => {
                const img = new Image();
                img.onload = () => resolve(url);
                img.onerror = () => reject(url);
                img.src = url;
            });
        });

        return Promise.allSettled(promises);
    }

    /**
     * Progressive image loading with blur-up effect
     */
    function loadProgressive(element, lowResSrc, highResSrc) {
        return new Promise((resolve) => {
            // Load low-res first
            element.src = lowResSrc;
            element.classList.add('lazy-blur');

            // Then load high-res
            const highRes = new Image();
            highRes.onload = () => {
                element.src = highResSrc;
                element.classList.add('loaded');
                resolve(element);
            };
            highRes.onerror = () => {
                element.classList.add('error');
                resolve(element);
            };
            highRes.src = highResSrc;
        });
    }

    /**
     * Disconnect observers
     */
    function destroy() {
        if (imageObserver) {
            imageObserver.disconnect();
            imageObserver = null;
        }
        if (contentObserver) {
            contentObserver.disconnect();
            contentObserver = null;
        }
    }

    /**
     * Force load element
     */
    function forceLoad(element) {
        if (element.dataset.src || element.dataset.background) {
            loadImage(element);
        }
        if (element.classList.contains('lazy-content')) {
            element.classList.add('visible');
        }
    }

    // Auto-initialize
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            initImages();
            initContent();
        });
    } else {
        initImages();
        initContent();
    }

    // Export API
    window.LazyLoader = {
        initImages,
        initContent,
        observeImages,
        observeContent,
        loadImage,
        createLazyImage,
        loadComponent,
        preload,
        loadProgressive,
        forceLoad,
        destroy
    };

    console.log('🖼️ LazyLoader module initialized');
})();
