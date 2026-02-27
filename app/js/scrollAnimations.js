/**
 * Quest Mini - Scroll Animations
 * Intersection Observer based scroll animations
 */

const ScrollAnimations = (function() {
  'use strict';

  // Observer instance
  let observer = null;
  
  // Animation presets
  const animations = {
    fadeIn: {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      transition: 'opacity 0.6s ease'
    },
    fadeInUp: {
      initial: { opacity: 0, transform: 'translateY(30px)' },
      animate: { opacity: 1, transform: 'translateY(0)' },
      transition: 'opacity 0.6s ease, transform 0.6s ease'
    },
    fadeInDown: {
      initial: { opacity: 0, transform: 'translateY(-30px)' },
      animate: { opacity: 1, transform: 'translateY(0)' },
      transition: 'opacity 0.6s ease, transform 0.6s ease'
    },
    fadeInLeft: {
      initial: { opacity: 0, transform: 'translateX(-30px)' },
      animate: { opacity: 1, transform: 'translateX(0)' },
      transition: 'opacity 0.6s ease, transform 0.6s ease'
    },
    fadeInRight: {
      initial: { opacity: 0, transform: 'translateX(30px)' },
      animate: { opacity: 1, transform: 'translateX(0)' },
      transition: 'opacity 0.6s ease, transform 0.6s ease'
    },
    scaleIn: {
      initial: { opacity: 0, transform: 'scale(0.9)' },
      animate: { opacity: 1, transform: 'scale(1)' },
      transition: 'opacity 0.5s ease, transform 0.5s ease'
    },
    slideInUp: {
      initial: { opacity: 0, transform: 'translateY(100%)' },
      animate: { opacity: 1, transform: 'translateY(0)' },
      transition: 'opacity 0.5s ease, transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)'
    },
    rotateIn: {
      initial: { opacity: 0, transform: 'rotate(-10deg) scale(0.9)' },
      animate: { opacity: 1, transform: 'rotate(0) scale(1)' },
      transition: 'opacity 0.5s ease, transform 0.5s ease'
    },
    blur: {
      initial: { opacity: 0, filter: 'blur(10px)' },
      animate: { opacity: 1, filter: 'blur(0)' },
      transition: 'opacity 0.6s ease, filter 0.6s ease'
    }
  };

  // Default options
  const defaults = {
    threshold: 0.1,          // Visibility threshold to trigger
    rootMargin: '0px',       // Margin around root
    once: true,              // Only animate once
    delay: 0,                // Delay before animation
    stagger: 100,            // Stagger delay for children
    animation: 'fadeInUp'    // Default animation
  };

  /**
   * Add base styles
   */
  function addStyles() {
    if (document.getElementById('scroll-animation-styles')) return;

    const styles = document.createElement('style');
    styles.id = 'scroll-animation-styles';
    styles.textContent = `
      [data-animate] {
        will-change: opacity, transform;
      }
      
      [data-animate].animated {
        will-change: auto;
      }
      
      .stagger-children > * {
        opacity: 0;
      }
    `;
    document.head.appendChild(styles);
  }

  /**
   * Apply initial styles
   */
  function applyInitialStyles(element, animationType) {
    const anim = animations[animationType] || animations.fadeInUp;
    
    Object.entries(anim.initial).forEach(([prop, value]) => {
      element.style[prop] = value;
    });
    
    element.style.transition = anim.transition;
  }

  /**
   * Apply animate styles
   */
  function applyAnimateStyles(element, animationType) {
    const anim = animations[animationType] || animations.fadeInUp;
    
    Object.entries(anim.animate).forEach(([prop, value]) => {
      element.style[prop] = value;
    });
  }

  /**
   * Handle intersection
   */
  function handleIntersection(entries) {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const element = entry.target;
        const options = JSON.parse(element.dataset.animateOptions || '{}');
        const { delay = 0, animation = 'fadeInUp', once = true } = options;
        
        setTimeout(() => {
          applyAnimateStyles(element, animation);
          element.classList.add('animated');
          
          // Handle staggered children
          if (element.classList.contains('stagger-children')) {
            animateChildren(element, options);
          }
        }, delay);
        
        if (once) {
          observer.unobserve(element);
        }
      } else {
        const element = entry.target;
        const options = JSON.parse(element.dataset.animateOptions || '{}');
        
        if (!options.once) {
          const animation = options.animation || 'fadeInUp';
          applyInitialStyles(element, animation);
          element.classList.remove('animated');
        }
      }
    });
  }

  /**
   * Animate children with stagger
   */
  function animateChildren(parent, options) {
    const { stagger = 100, animation = 'fadeInUp' } = options;
    const children = parent.children;
    
    Array.from(children).forEach((child, index) => {
      // Apply initial styles
      const anim = animations[animation] || animations.fadeInUp;
      child.style.transition = anim.transition;
      
      setTimeout(() => {
        applyAnimateStyles(child, animation);
      }, index * stagger);
    });
  }

  /**
   * Observe an element
   */
  function observe(element, options = {}) {
    if (!observer) {
      createObserver(options);
    }
    
    const mergedOptions = { ...defaults, ...options };
    const animationType = mergedOptions.animation;
    
    // Store options on element
    element.dataset.animateOptions = JSON.stringify(mergedOptions);
    element.dataset.animate = animationType;
    
    // Apply initial styles
    applyInitialStyles(element, animationType);
    
    // Start observing
    observer.observe(element);
    
    return () => observer.unobserve(element);
  }

  /**
   * Create observer instance
   */
  function createObserver(options = {}) {
    const { threshold = defaults.threshold, rootMargin = defaults.rootMargin } = options;
    
    observer = new IntersectionObserver(handleIntersection, {
      threshold,
      rootMargin
    });
  }

  /**
   * Initialize from data attributes
   */
  function init(options = {}) {
    addStyles();
    createObserver(options);
    
    // Find elements with data-animate attribute
    document.querySelectorAll('[data-animate]').forEach(element => {
      const animation = element.dataset.animate || 'fadeInUp';
      const delay = parseInt(element.dataset.animateDelay, 10) || 0;
      const once = element.dataset.animateOnce !== 'false';
      
      observe(element, { animation, delay, once });
    });
    
    // Find stagger containers
    document.querySelectorAll('.stagger-children').forEach(container => {
      const animation = container.dataset.animate || 'fadeInUp';
      const stagger = parseInt(container.dataset.stagger, 10) || 100;
      
      observe(container, { animation, stagger });
    });
    
    console.log('Scroll animations initialized');
  }

  /**
   * Refresh observers (call after dynamic content changes)
   */
  function refresh() {
    if (observer) {
      observer.disconnect();
    }
    init();
  }

  /**
   * Trigger animation on element immediately
   */
  function animate(element, animationType = 'fadeInUp', delay = 0) {
    applyInitialStyles(element, animationType);
    
    // Force reflow
    element.offsetHeight;
    
    setTimeout(() => {
      applyAnimateStyles(element, animationType);
      element.classList.add('animated');
    }, delay);
  }

  /**
   * Animate multiple elements with stagger
   */
  function animateSequence(elements, animationType = 'fadeInUp', stagger = 100) {
    elements.forEach((element, index) => {
      animate(element, animationType, index * stagger);
    });
  }

  /**
   * Get available animation names
   */
  function getAnimationNames() {
    return Object.keys(animations);
  }

  /**
   * Add custom animation
   */
  function addAnimation(name, config) {
    animations[name] = config;
  }

  /**
   * Destroy observer
   */
  function destroy() {
    if (observer) {
      observer.disconnect();
      observer = null;
    }
  }

  // Public API
  return {
    init,
    observe,
    refresh,
    animate,
    animateSequence,
    getAnimationNames,
    addAnimation,
    destroy,
    animations
  };
})();

// Make available globally
window.ScrollAnimations = ScrollAnimations;

// Auto-initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  ScrollAnimations.init();
});
