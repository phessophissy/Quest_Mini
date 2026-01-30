/**
 * Animation Easing - Collection of easing functions and animation utilities
 * Quest Mini - Farcaster Mini-App
 */

(function() {
    'use strict';

    /**
     * Standard easing functions
     * All functions take t (0-1) and return eased value (0-1)
     */
    const easings = {
        // Linear
        linear: t => t,

        // Quad
        easeInQuad: t => t * t,
        easeOutQuad: t => t * (2 - t),
        easeInOutQuad: t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,

        // Cubic
        easeInCubic: t => t * t * t,
        easeOutCubic: t => (--t) * t * t + 1,
        easeInOutCubic: t => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,

        // Quart
        easeInQuart: t => t * t * t * t,
        easeOutQuart: t => 1 - (--t) * t * t * t,
        easeInOutQuart: t => t < 0.5 ? 8 * t * t * t * t : 1 - 8 * (--t) * t * t * t,

        // Quint
        easeInQuint: t => t * t * t * t * t,
        easeOutQuint: t => 1 + (--t) * t * t * t * t,
        easeInOutQuint: t => t < 0.5 ? 16 * t * t * t * t * t : 1 + 16 * (--t) * t * t * t * t,

        // Sine
        easeInSine: t => 1 - Math.cos((t * Math.PI) / 2),
        easeOutSine: t => Math.sin((t * Math.PI) / 2),
        easeInOutSine: t => -(Math.cos(Math.PI * t) - 1) / 2,

        // Expo
        easeInExpo: t => t === 0 ? 0 : Math.pow(2, 10 * t - 10),
        easeOutExpo: t => t === 1 ? 1 : 1 - Math.pow(2, -10 * t),
        easeInOutExpo: t => {
            if (t === 0) return 0;
            if (t === 1) return 1;
            return t < 0.5
                ? Math.pow(2, 20 * t - 10) / 2
                : (2 - Math.pow(2, -20 * t + 10)) / 2;
        },

        // Circ
        easeInCirc: t => 1 - Math.sqrt(1 - t * t),
        easeOutCirc: t => Math.sqrt(1 - (--t) * t),
        easeInOutCirc: t => t < 0.5
            ? (1 - Math.sqrt(1 - 4 * t * t)) / 2
            : (Math.sqrt(1 - Math.pow(-2 * t + 2, 2)) + 1) / 2,

        // Back (overshoot)
        easeInBack: t => {
            const c1 = 1.70158;
            const c3 = c1 + 1;
            return c3 * t * t * t - c1 * t * t;
        },
        easeOutBack: t => {
            const c1 = 1.70158;
            const c3 = c1 + 1;
            return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
        },
        easeInOutBack: t => {
            const c1 = 1.70158;
            const c2 = c1 * 1.525;
            return t < 0.5
                ? (Math.pow(2 * t, 2) * ((c2 + 1) * 2 * t - c2)) / 2
                : (Math.pow(2 * t - 2, 2) * ((c2 + 1) * (t * 2 - 2) + c2) + 2) / 2;
        },

        // Elastic
        easeInElastic: t => {
            if (t === 0) return 0;
            if (t === 1) return 1;
            return -Math.pow(2, 10 * t - 10) * Math.sin((t * 10 - 10.75) * ((2 * Math.PI) / 3));
        },
        easeOutElastic: t => {
            if (t === 0) return 0;
            if (t === 1) return 1;
            return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * ((2 * Math.PI) / 3)) + 1;
        },
        easeInOutElastic: t => {
            if (t === 0) return 0;
            if (t === 1) return 1;
            const c5 = (2 * Math.PI) / 4.5;
            return t < 0.5
                ? -(Math.pow(2, 20 * t - 10) * Math.sin((20 * t - 11.125) * c5)) / 2
                : (Math.pow(2, -20 * t + 10) * Math.sin((20 * t - 11.125) * c5)) / 2 + 1;
        },

        // Bounce
        easeInBounce: t => 1 - easings.easeOutBounce(1 - t),
        easeOutBounce: t => {
            const n1 = 7.5625;
            const d1 = 2.75;
            if (t < 1 / d1) {
                return n1 * t * t;
            } else if (t < 2 / d1) {
                return n1 * (t -= 1.5 / d1) * t + 0.75;
            } else if (t < 2.5 / d1) {
                return n1 * (t -= 2.25 / d1) * t + 0.9375;
            } else {
                return n1 * (t -= 2.625 / d1) * t + 0.984375;
            }
        },
        easeInOutBounce: t => t < 0.5
            ? (1 - easings.easeOutBounce(1 - 2 * t)) / 2
            : (1 + easings.easeOutBounce(2 * t - 1)) / 2
    };

    /**
     * Animate value from start to end
     */
    function animate(options) {
        const {
            from = 0,
            to = 1,
            duration = 300,
            easing = 'easeOutCubic',
            onUpdate,
            onComplete
        } = options;

        const easingFn = typeof easing === 'function' ? easing : easings[easing] || easings.linear;
        const startTime = performance.now();

        let animationId = null;
        let cancelled = false;

        function tick(currentTime) {
            if (cancelled) return;

            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easedProgress = easingFn(progress);
            const currentValue = from + (to - from) * easedProgress;

            if (onUpdate) {
                onUpdate(currentValue, progress);
            }

            if (progress < 1) {
                animationId = requestAnimationFrame(tick);
            } else if (onComplete) {
                onComplete();
            }
        }

        animationId = requestAnimationFrame(tick);

        return {
            cancel: () => {
                cancelled = true;
                if (animationId) {
                    cancelAnimationFrame(animationId);
                }
            }
        };
    }

    /**
     * Animate multiple values
     */
    function animateMultiple(options) {
        const {
            values, // { prop1: { from, to }, prop2: { from, to } }
            duration = 300,
            easing = 'easeOutCubic',
            onUpdate,
            onComplete
        } = options;

        const easingFn = typeof easing === 'function' ? easing : easings[easing] || easings.linear;
        const startTime = performance.now();

        let animationId = null;
        let cancelled = false;

        function tick(currentTime) {
            if (cancelled) return;

            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easedProgress = easingFn(progress);

            const currentValues = {};
            for (const [key, { from, to }] of Object.entries(values)) {
                currentValues[key] = from + (to - from) * easedProgress;
            }

            if (onUpdate) {
                onUpdate(currentValues, progress);
            }

            if (progress < 1) {
                animationId = requestAnimationFrame(tick);
            } else if (onComplete) {
                onComplete();
            }
        }

        animationId = requestAnimationFrame(tick);

        return {
            cancel: () => {
                cancelled = true;
                if (animationId) {
                    cancelAnimationFrame(animationId);
                }
            }
        };
    }

    /**
     * Spring animation
     */
    function spring(options) {
        const {
            from = 0,
            to = 1,
            stiffness = 100,
            damping = 10,
            mass = 1,
            velocity = 0,
            onUpdate,
            onComplete,
            precision = 0.01
        } = options;

        let position = from;
        let currentVelocity = velocity;
        let lastTime = performance.now();
        let animationId = null;
        let cancelled = false;

        function tick(currentTime) {
            if (cancelled) return;

            const deltaTime = Math.min((currentTime - lastTime) / 1000, 0.064); // Cap at ~15fps min
            lastTime = currentTime;

            // Spring physics
            const displacement = position - to;
            const springForce = -stiffness * displacement;
            const dampingForce = -damping * currentVelocity;
            const acceleration = (springForce + dampingForce) / mass;

            currentVelocity += acceleration * deltaTime;
            position += currentVelocity * deltaTime;

            if (onUpdate) {
                onUpdate(position, currentVelocity);
            }

            // Check if settled
            const isSettled = Math.abs(displacement) < precision && Math.abs(currentVelocity) < precision;

            if (!isSettled) {
                animationId = requestAnimationFrame(tick);
            } else {
                position = to;
                if (onUpdate) onUpdate(position, 0);
                if (onComplete) onComplete();
            }
        }

        animationId = requestAnimationFrame(tick);

        return {
            cancel: () => {
                cancelled = true;
                if (animationId) {
                    cancelAnimationFrame(animationId);
                }
            }
        };
    }

    /**
     * Sequence multiple animations
     */
    function sequence(animations) {
        let currentIndex = 0;
        let cancelled = false;
        let currentAnimation = null;

        function runNext() {
            if (cancelled || currentIndex >= animations.length) {
                return;
            }

            const config = animations[currentIndex];
            currentIndex++;

            currentAnimation = animate({
                ...config,
                onComplete: () => {
                    if (config.onComplete) config.onComplete();
                    runNext();
                }
            });
        }

        runNext();

        return {
            cancel: () => {
                cancelled = true;
                if (currentAnimation) {
                    currentAnimation.cancel();
                }
            }
        };
    }

    /**
     * Run animations in parallel
     */
    function parallel(animations) {
        let completedCount = 0;
        let cancelled = false;
        const runningAnimations = [];

        const allComplete = () => {
            completedCount++;
        };

        for (const config of animations) {
            const anim = animate({
                ...config,
                onComplete: () => {
                    if (config.onComplete) config.onComplete();
                    allComplete();
                }
            });
            runningAnimations.push(anim);
        }

        return {
            cancel: () => {
                cancelled = true;
                runningAnimations.forEach(anim => anim.cancel());
            }
        };
    }

    /**
     * Stagger animations with delay
     */
    function stagger(elements, options) {
        const {
            delay = 50,
            ...animationOptions
        } = options;

        const elemArray = typeof elements === 'string' 
            ? Array.from(document.querySelectorAll(elements))
            : Array.from(elements);

        const runningAnimations = [];

        elemArray.forEach((element, index) => {
            setTimeout(() => {
                const anim = animate({
                    ...animationOptions,
                    onUpdate: (value, progress) => {
                        if (animationOptions.onUpdate) {
                            animationOptions.onUpdate(element, value, progress, index);
                        }
                    },
                    onComplete: () => {
                        if (animationOptions.onComplete) {
                            animationOptions.onComplete(element, index);
                        }
                    }
                });
                runningAnimations.push(anim);
            }, delay * index);
        });

        return {
            cancel: () => {
                runningAnimations.forEach(anim => anim.cancel());
            }
        };
    }

    /**
     * Create bezier curve easing
     */
    function bezier(x1, y1, x2, y2) {
        // Newton's method for finding t given x
        const epsilon = 1e-6;

        function sampleCurveX(t) {
            return ((1 - 3 * x2 + 3 * x1) * t + (3 * x2 - 6 * x1)) * t + (3 * x1) * t;
        }

        function sampleCurveY(t) {
            return ((1 - 3 * y2 + 3 * y1) * t + (3 * y2 - 6 * y1)) * t + (3 * y1) * t;
        }

        function sampleCurveDerivativeX(t) {
            return (3 * (1 - 3 * x2 + 3 * x1) * t + 2 * (3 * x2 - 6 * x1)) * t + 3 * x1;
        }

        function solveCurveX(x) {
            let t = x;
            for (let i = 0; i < 8; i++) {
                const xEstimate = sampleCurveX(t) - x;
                if (Math.abs(xEstimate) < epsilon) return t;
                const derivative = sampleCurveDerivativeX(t);
                if (Math.abs(derivative) < epsilon) break;
                t -= xEstimate / derivative;
            }
            return t;
        }

        return function(t) {
            return sampleCurveY(solveCurveX(t));
        };
    }

    /**
     * Get CSS transition string
     */
    function getCSSTransition(properties, duration, easing = 'ease') {
        const cssEasings = {
            linear: 'linear',
            easeInQuad: 'cubic-bezier(0.55, 0.085, 0.68, 0.53)',
            easeOutQuad: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
            easeInOutQuad: 'cubic-bezier(0.455, 0.03, 0.515, 0.955)',
            easeInCubic: 'cubic-bezier(0.55, 0.055, 0.675, 0.19)',
            easeOutCubic: 'cubic-bezier(0.215, 0.61, 0.355, 1)',
            easeInOutCubic: 'cubic-bezier(0.645, 0.045, 0.355, 1)',
            easeInQuart: 'cubic-bezier(0.895, 0.03, 0.685, 0.22)',
            easeOutQuart: 'cubic-bezier(0.165, 0.84, 0.44, 1)',
            easeInOutQuart: 'cubic-bezier(0.77, 0, 0.175, 1)',
            easeInBack: 'cubic-bezier(0.6, -0.28, 0.735, 0.045)',
            easeOutBack: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
            easeInOutBack: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)'
        };

        const cssEasing = cssEasings[easing] || easing;
        const props = Array.isArray(properties) ? properties : [properties];
        
        return props.map(prop => `${prop} ${duration}ms ${cssEasing}`).join(', ');
    }

    // Export API
    window.AnimationEasing = {
        easings,
        animate,
        animateMultiple,
        spring,
        sequence,
        parallel,
        stagger,
        bezier,
        getCSSTransition
    };

    console.log('🎬 AnimationEasing module initialized');
})();
