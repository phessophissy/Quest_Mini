/**
 * Onboarding Flow - Welcome screens and first-time user experience
 * Quest Mini - Farcaster Mini-App
 */

(function() {
    'use strict';

    // Storage key
    const STORAGE_KEY = 'quest_onboarding_complete';

    // Default slides
    const defaultSlides = [
        {
            id: 'welcome',
            icon: '🎮',
            title: 'Welcome to Quest Mini',
            description: 'Your gateway to earning QUEST tokens on Base Chain through fun daily quests.',
            highlight: 'Complete quests, earn rewards!'
        },
        {
            id: 'quests',
            icon: '⚔️',
            title: 'Daily Quests',
            description: 'Complete simple tasks every day to earn QUEST tokens. Build your streak for bonus multipliers!',
            features: ['Check-in daily', 'Complete challenges', 'Earn up to 2.5x rewards']
        },
        {
            id: 'rewards',
            icon: '🏆',
            title: 'Collect Rewards',
            description: 'Claim your QUEST tokens directly to your wallet. Track your progress on the leaderboard.',
            features: ['Instant claims', 'Leaderboard rankings', 'Achievement badges']
        },
        {
            id: 'connect',
            icon: '💼',
            title: 'Connect & Start',
            description: 'Connect your wallet to begin your quest journey. Start earning today!',
            cta: true
        }
    ];

    // Default styles
    const defaultStyles = `
        .onboarding-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: var(--bg-dark, #0F0F1A);
            z-index: 100000;
            display: flex;
            flex-direction: column;
            opacity: 0;
            visibility: hidden;
            transition: all 0.3s ease;
        }
        
        .onboarding-overlay.active {
            opacity: 1;
            visibility: visible;
        }
        
        .onboarding-skip {
            position: absolute;
            top: 20px;
            right: 20px;
            background: none;
            border: none;
            color: var(--text-secondary, #A1A1AA);
            font-size: 14px;
            cursor: pointer;
            padding: 8px 16px;
            z-index: 10;
        }
        
        .onboarding-skip:hover {
            color: var(--text-primary, #FFFFFF);
        }
        
        .onboarding-content {
            flex: 1;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 40px 24px;
            text-align: center;
            overflow: hidden;
        }
        
        .onboarding-slides {
            display: flex;
            transition: transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
            width: 100%;
        }
        
        .onboarding-slide {
            flex: 0 0 100%;
            min-width: 100%;
            padding: 0 24px;
            display: flex;
            flex-direction: column;
            align-items: center;
        }
        
        .onboarding-icon {
            font-size: 80px;
            margin-bottom: 24px;
            animation: onboardingBounce 2s ease-in-out infinite;
        }
        
        @keyframes onboardingBounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-10px); }
        }
        
        .onboarding-title {
            font-size: 28px;
            font-weight: 700;
            color: var(--text-primary, #FFFFFF);
            margin-bottom: 16px;
            line-height: 1.2;
        }
        
        .onboarding-description {
            font-size: 16px;
            color: var(--text-secondary, #A1A1AA);
            max-width: 320px;
            line-height: 1.6;
            margin-bottom: 20px;
        }
        
        .onboarding-highlight {
            display: inline-block;
            padding: 8px 20px;
            background: linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(6, 182, 212, 0.2));
            border-radius: 20px;
            color: var(--primary, #8B5CF6);
            font-weight: 600;
            font-size: 14px;
        }
        
        .onboarding-features {
            list-style: none;
            padding: 0;
            margin: 0;
        }
        
        .onboarding-feature {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 8px 0;
            color: var(--text-secondary, #A1A1AA);
            font-size: 14px;
        }
        
        .onboarding-feature::before {
            content: '✓';
            color: var(--success, #10B981);
            font-weight: bold;
        }
        
        /* Progress dots */
        .onboarding-progress {
            display: flex;
            justify-content: center;
            gap: 10px;
            padding: 20px 0;
        }
        
        .onboarding-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: var(--border, #2D2D44);
            transition: all 0.3s ease;
            cursor: pointer;
        }
        
        .onboarding-dot.active {
            background: var(--primary, #8B5CF6);
            width: 24px;
            border-radius: 4px;
        }
        
        /* Navigation */
        .onboarding-nav {
            display: flex;
            gap: 12px;
            padding: 20px 24px 40px;
        }
        
        .onboarding-btn {
            flex: 1;
            padding: 16px 24px;
            border-radius: 14px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease;
        }
        
        .onboarding-btn.secondary {
            background: transparent;
            border: 1px solid var(--border, #2D2D44);
            color: var(--text-secondary, #A1A1AA);
        }
        
        .onboarding-btn.secondary:hover {
            border-color: var(--text-secondary, #A1A1AA);
            color: var(--text-primary, #FFFFFF);
        }
        
        .onboarding-btn.primary {
            background: linear-gradient(135deg, var(--primary, #8B5CF6), var(--primary-dark, #7C3AED));
            border: none;
            color: white;
        }
        
        .onboarding-btn.primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 24px rgba(139, 92, 246, 0.3);
        }
        
        /* Connect button on last slide */
        .onboarding-connect-btn {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 12px;
            padding: 18px 32px;
            background: linear-gradient(135deg, var(--primary, #8B5CF6), var(--primary-dark, #7C3AED));
            border: none;
            border-radius: 16px;
            color: white;
            font-size: 18px;
            font-weight: 600;
            cursor: pointer;
            margin-top: 24px;
            transition: all 0.2s ease;
        }
        
        .onboarding-connect-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 12px 32px rgba(139, 92, 246, 0.4);
        }
        
        /* Animation classes */
        .onboarding-fade-in {
            animation: onboardingFadeIn 0.5s ease forwards;
        }
        
        @keyframes onboardingFadeIn {
            from {
                opacity: 0;
                transform: translateY(20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        /* Confetti effect for completion */
        .onboarding-confetti {
            position: absolute;
            width: 10px;
            height: 10px;
            background: var(--primary, #8B5CF6);
            animation: confettiFall 3s ease-out forwards;
        }
        
        @keyframes confettiFall {
            0% {
                transform: translateY(-100vh) rotate(0deg);
                opacity: 1;
            }
            100% {
                transform: translateY(100vh) rotate(720deg);
                opacity: 0;
            }
        }
    `;

    // Inject styles
    function injectStyles() {
        if (document.getElementById('onboarding-styles')) return;
        const style = document.createElement('style');
        style.id = 'onboarding-styles';
        style.textContent = defaultStyles;
        document.head.appendChild(style);
    }

    /**
     * Check if onboarding is complete
     */
    function isComplete() {
        return localStorage.getItem(STORAGE_KEY) === 'true';
    }

    /**
     * Mark onboarding as complete
     */
    function markComplete() {
        localStorage.setItem(STORAGE_KEY, 'true');
    }

    /**
     * Reset onboarding
     */
    function reset() {
        localStorage.removeItem(STORAGE_KEY);
    }

    /**
     * Create onboarding flow
     */
    function create(options = {}) {
        injectStyles();

        const {
            slides = defaultSlides,
            onComplete = null,
            onConnect = null,
            showSkip = true,
            autoStart = false
        } = options;

        let currentIndex = 0;
        let overlay = null;

        function render() {
            overlay = document.createElement('div');
            overlay.className = 'onboarding-overlay';
            
            overlay.innerHTML = `
                ${showSkip ? '<button class="onboarding-skip">Skip</button>' : ''}
                
                <div class="onboarding-content">
                    <div class="onboarding-slides">
                        ${slides.map((slide, i) => renderSlide(slide, i)).join('')}
                    </div>
                </div>
                
                <div class="onboarding-progress">
                    ${slides.map((_, i) => `
                        <div class="onboarding-dot ${i === 0 ? 'active' : ''}" data-index="${i}"></div>
                    `).join('')}
                </div>
                
                <div class="onboarding-nav">
                    <button class="onboarding-btn secondary prev-btn" style="display: none;">Back</button>
                    <button class="onboarding-btn primary next-btn">Continue</button>
                </div>
            `;

            document.body.appendChild(overlay);

            // Event listeners
            overlay.querySelector('.onboarding-skip')?.addEventListener('click', complete);
            overlay.querySelector('.prev-btn').addEventListener('click', prev);
            overlay.querySelector('.next-btn').addEventListener('click', next);
            
            overlay.querySelectorAll('.onboarding-dot').forEach(dot => {
                dot.addEventListener('click', () => {
                    goTo(parseInt(dot.dataset.index));
                });
            });

            // Connect button on last slide
            overlay.querySelectorAll('.onboarding-connect-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    if (onConnect) {
                        onConnect().then(complete).catch(console.error);
                    } else {
                        complete();
                    }
                });
            });

            // Touch swipe support
            let touchStartX = 0;
            overlay.addEventListener('touchstart', e => {
                touchStartX = e.touches[0].clientX;
            });
            
            overlay.addEventListener('touchend', e => {
                const touchEndX = e.changedTouches[0].clientX;
                const diff = touchStartX - touchEndX;
                
                if (Math.abs(diff) > 50) {
                    if (diff > 0) next();
                    else prev();
                }
            });

            updateNav();
        }

        function renderSlide(slide, index) {
            return `
                <div class="onboarding-slide" data-slide="${index}">
                    <div class="onboarding-icon">${slide.icon}</div>
                    <h2 class="onboarding-title">${slide.title}</h2>
                    <p class="onboarding-description">${slide.description}</p>
                    
                    ${slide.highlight ? `
                        <span class="onboarding-highlight">${slide.highlight}</span>
                    ` : ''}
                    
                    ${slide.features ? `
                        <ul class="onboarding-features">
                            ${slide.features.map(f => `
                                <li class="onboarding-feature">${f}</li>
                            `).join('')}
                        </ul>
                    ` : ''}
                    
                    ${slide.cta ? `
                        <button class="onboarding-connect-btn">
                            💼 Connect Wallet
                        </button>
                    ` : ''}
                </div>
            `;
        }

        function goTo(index) {
            if (index < 0 || index >= slides.length) return;
            
            currentIndex = index;
            
            // Update slides position
            const slidesEl = overlay.querySelector('.onboarding-slides');
            slidesEl.style.transform = `translateX(-${currentIndex * 100}%)`;
            
            // Update dots
            overlay.querySelectorAll('.onboarding-dot').forEach((dot, i) => {
                dot.classList.toggle('active', i === currentIndex);
            });
            
            updateNav();
        }

        function next() {
            if (currentIndex === slides.length - 1) {
                complete();
            } else {
                goTo(currentIndex + 1);
            }
        }

        function prev() {
            goTo(currentIndex - 1);
        }

        function updateNav() {
            const prevBtn = overlay.querySelector('.prev-btn');
            const nextBtn = overlay.querySelector('.next-btn');
            
            prevBtn.style.display = currentIndex > 0 ? 'block' : 'none';
            
            const isLast = currentIndex === slides.length - 1;
            const hasConnectBtn = slides[currentIndex].cta;
            
            nextBtn.textContent = isLast ? 'Get Started' : 'Continue';
            nextBtn.style.display = hasConnectBtn ? 'none' : 'block';
        }

        function show() {
            if (!overlay) render();
            requestAnimationFrame(() => {
                overlay.classList.add('active');
            });
        }

        function hide() {
            if (overlay) {
                overlay.classList.remove('active');
                setTimeout(() => {
                    overlay.remove();
                    overlay = null;
                }, 300);
            }
        }

        function complete() {
            markComplete();
            showConfetti();
            
            setTimeout(() => {
                hide();
                if (onComplete) onComplete();
            }, 500);
        }

        function showConfetti() {
            if (!overlay) return;
            
            const colors = ['#8B5CF6', '#06B6D4', '#10B981', '#F59E0B', '#EF4444'];
            
            for (let i = 0; i < 50; i++) {
                const confetti = document.createElement('div');
                confetti.className = 'onboarding-confetti';
                confetti.style.left = Math.random() * 100 + '%';
                confetti.style.background = colors[Math.floor(Math.random() * colors.length)];
                confetti.style.animationDelay = Math.random() * 0.5 + 's';
                confetti.style.animationDuration = (Math.random() * 2 + 2) + 's';
                confetti.style.borderRadius = Math.random() > 0.5 ? '50%' : '0';
                overlay.appendChild(confetti);
            }
        }

        // Auto-start if needed
        if (autoStart && !isComplete()) {
            setTimeout(show, 500);
        }

        return {
            show,
            hide,
            complete,
            goTo,
            next,
            prev,
            getCurrentIndex: () => currentIndex,
            isComplete
        };
    }

    /**
     * Show onboarding if not complete
     */
    function showIfNeeded(options = {}) {
        if (!isComplete()) {
            return create({ ...options, autoStart: true });
        }
        return null;
    }

    // Export API
    window.Onboarding = {
        create,
        showIfNeeded,
        isComplete,
        markComplete,
        reset
    };

    console.log('🚀 Onboarding module initialized');
})();
