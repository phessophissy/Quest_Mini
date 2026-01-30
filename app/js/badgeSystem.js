/**
 * Badge System - Achievements and collectible badges
 * Quest Mini - Farcaster Mini-App
 */

(function() {
    'use strict';

    // Storage key
    const STORAGE_KEY = 'quest_badges';

    // Default badge definitions
    const defaultBadges = {
        // Quest badges
        'first-quest': {
            id: 'first-quest',
            name: 'First Steps',
            description: 'Complete your first quest',
            icon: '🎯',
            category: 'quests',
            rarity: 'common',
            points: 10
        },
        'quest-streak-7': {
            id: 'quest-streak-7',
            name: 'Week Warrior',
            description: 'Maintain a 7-day quest streak',
            icon: '🔥',
            category: 'quests',
            rarity: 'uncommon',
            points: 50
        },
        'quest-streak-30': {
            id: 'quest-streak-30',
            name: 'Monthly Master',
            description: 'Maintain a 30-day quest streak',
            icon: '⚡',
            category: 'quests',
            rarity: 'rare',
            points: 200
        },
        'quests-100': {
            id: 'quests-100',
            name: 'Century Club',
            description: 'Complete 100 quests',
            icon: '💯',
            category: 'quests',
            rarity: 'epic',
            points: 500
        },
        
        // Token badges
        'first-claim': {
            id: 'first-claim',
            name: 'Token Collector',
            description: 'Claim your first QUEST tokens',
            icon: '🪙',
            category: 'tokens',
            rarity: 'common',
            points: 10
        },
        'tokens-1000': {
            id: 'tokens-1000',
            name: 'QUEST Holder',
            description: 'Earn 1,000 QUEST tokens',
            icon: '💰',
            category: 'tokens',
            rarity: 'uncommon',
            points: 100
        },
        'tokens-10000': {
            id: 'tokens-10000',
            name: 'QUEST Whale',
            description: 'Earn 10,000 QUEST tokens',
            icon: '🐋',
            category: 'tokens',
            rarity: 'rare',
            points: 300
        },
        
        // Social badges
        'first-referral': {
            id: 'first-referral',
            name: 'Networker',
            description: 'Refer your first friend',
            icon: '🤝',
            category: 'social',
            rarity: 'common',
            points: 20
        },
        'referrals-10': {
            id: 'referrals-10',
            name: 'Influencer',
            description: 'Refer 10 friends',
            icon: '📢',
            category: 'social',
            rarity: 'rare',
            points: 250
        },
        'top-100': {
            id: 'top-100',
            name: 'Elite',
            description: 'Reach top 100 on leaderboard',
            icon: '👑',
            category: 'social',
            rarity: 'epic',
            points: 400
        },
        
        // Special badges
        'early-adopter': {
            id: 'early-adopter',
            name: 'Early Adopter',
            description: 'Joined during beta',
            icon: '🌟',
            category: 'special',
            rarity: 'legendary',
            points: 1000
        },
        'og-member': {
            id: 'og-member',
            name: 'OG Member',
            description: 'Original community member',
            icon: '💎',
            category: 'special',
            rarity: 'legendary',
            points: 1000
        }
    };

    // Rarity colors
    const rarityColors = {
        common: { bg: '#6B7280', border: '#9CA3AF', glow: 'rgba(107, 114, 128, 0.3)' },
        uncommon: { bg: '#10B981', border: '#34D399', glow: 'rgba(16, 185, 129, 0.3)' },
        rare: { bg: '#3B82F6', border: '#60A5FA', glow: 'rgba(59, 130, 246, 0.3)' },
        epic: { bg: '#8B5CF6', border: '#A78BFA', glow: 'rgba(139, 92, 246, 0.3)' },
        legendary: { bg: '#F59E0B', border: '#FBBF24', glow: 'rgba(245, 158, 11, 0.3)' }
    };

    // Default styles
    const defaultStyles = `
        .badge-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
            gap: 12px;
        }
        
        .badge-item {
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 16px 12px;
            background: var(--bg-card, #1A1A2E);
            border-radius: 12px;
            border: 1px solid var(--border, #2D2D44);
            cursor: pointer;
            transition: all 0.2s ease;
        }
        
        .badge-item:hover {
            transform: translateY(-2px);
            border-color: var(--primary, #8B5CF6);
        }
        
        .badge-item.locked {
            opacity: 0.5;
            filter: grayscale(0.8);
        }
        
        .badge-icon {
            font-size: 36px;
            margin-bottom: 8px;
        }
        
        .badge-name {
            font-size: 12px;
            font-weight: 500;
            color: var(--text-primary, #FFFFFF);
            text-align: center;
            line-height: 1.2;
        }
        
        .badge-rarity {
            font-size: 10px;
            margin-top: 4px;
            padding: 2px 6px;
            border-radius: 4px;
            text-transform: uppercase;
        }
        
        /* Badge card detail */
        .badge-card {
            background: var(--bg-card, #1A1A2E);
            border-radius: 16px;
            padding: 24px;
            text-align: center;
            position: relative;
            overflow: hidden;
        }
        
        .badge-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 100px;
            background: linear-gradient(180deg, var(--badge-glow, rgba(139, 92, 246, 0.2)) 0%, transparent 100%);
        }
        
        .badge-card-icon {
            font-size: 64px;
            margin-bottom: 16px;
            position: relative;
            z-index: 1;
        }
        
        .badge-card-name {
            font-size: 20px;
            font-weight: 600;
            color: var(--text-primary, #FFFFFF);
            margin-bottom: 8px;
        }
        
        .badge-card-description {
            font-size: 14px;
            color: var(--text-secondary, #A1A1AA);
            margin-bottom: 16px;
        }
        
        .badge-card-meta {
            display: flex;
            justify-content: center;
            gap: 16px;
            font-size: 12px;
            color: var(--text-secondary, #A1A1AA);
        }
        
        .badge-card-rarity {
            padding: 4px 12px;
            border-radius: 8px;
            font-weight: 600;
            text-transform: uppercase;
        }
        
        .badge-card-points {
            display: flex;
            align-items: center;
            gap: 4px;
        }
        
        /* Badge showcase */
        .badge-showcase {
            display: flex;
            gap: 8px;
            padding: 8px;
            overflow-x: auto;
            scrollbar-width: none;
        }
        
        .badge-showcase::-webkit-scrollbar {
            display: none;
        }
        
        .badge-showcase-item {
            flex-shrink: 0;
            width: 48px;
            height: 48px;
            border-radius: 50%;
            background: var(--bg-card, #1A1A2E);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            border: 2px solid var(--border, #2D2D44);
        }
        
        /* Badge notification */
        .badge-notification {
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%) translateY(-100px);
            background: var(--bg-card, #1A1A2E);
            border-radius: 16px;
            padding: 16px 24px;
            display: flex;
            align-items: center;
            gap: 16px;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
            z-index: 10000;
            opacity: 0;
            transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        
        .badge-notification.show {
            transform: translateX(-50%) translateY(0);
            opacity: 1;
        }
        
        .badge-notification-icon {
            font-size: 48px;
            animation: badgeBounce 0.5s ease;
        }
        
        @keyframes badgeBounce {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.2); }
        }
        
        .badge-notification-content {
            text-align: left;
        }
        
        .badge-notification-title {
            font-size: 12px;
            color: var(--primary, #8B5CF6);
            text-transform: uppercase;
            font-weight: 600;
        }
        
        .badge-notification-name {
            font-size: 18px;
            font-weight: 600;
            color: var(--text-primary, #FFFFFF);
        }
        
        /* Progress bar */
        .badge-progress {
            margin-top: 8px;
        }
        
        .badge-progress-bar {
            height: 4px;
            background: var(--border, #2D2D44);
            border-radius: 2px;
            overflow: hidden;
        }
        
        .badge-progress-fill {
            height: 100%;
            background: var(--primary, #8B5CF6);
            transition: width 0.3s ease;
        }
        
        .badge-progress-text {
            font-size: 10px;
            color: var(--text-secondary, #A1A1AA);
            margin-top: 4px;
        }
    `;

    // Inject styles
    function injectStyles() {
        if (document.getElementById('badge-styles')) return;
        const style = document.createElement('style');
        style.id = 'badge-styles';
        style.textContent = defaultStyles;
        document.head.appendChild(style);
    }

    // State
    const state = {
        badges: { ...defaultBadges },
        unlocked: new Set(),
        onUnlock: null
    };

    /**
     * Initialize badge system
     */
    function init(options = {}) {
        injectStyles();

        if (options.badges) {
            state.badges = { ...defaultBadges, ...options.badges };
        }

        if (options.onUnlock) {
            state.onUnlock = options.onUnlock;
        }

        // Load unlocked badges from storage
        loadProgress();

        console.log('🏅 BadgeSystem initialized');
    }

    /**
     * Load progress from storage
     */
    function loadProgress() {
        try {
            const data = localStorage.getItem(STORAGE_KEY);
            if (data) {
                const unlocked = JSON.parse(data);
                state.unlocked = new Set(unlocked);
            }
        } catch (e) {
            console.error('Failed to load badges:', e);
        }
    }

    /**
     * Save progress to storage
     */
    function saveProgress() {
        try {
            const data = JSON.stringify(Array.from(state.unlocked));
            localStorage.setItem(STORAGE_KEY, data);
        } catch (e) {
            console.error('Failed to save badges:', e);
        }
    }

    /**
     * Unlock a badge
     */
    function unlock(badgeId, showNotification = true) {
        const badge = state.badges[badgeId];
        if (!badge) return false;

        if (state.unlocked.has(badgeId)) return false;

        state.unlocked.add(badgeId);
        saveProgress();

        if (showNotification) {
            showUnlockNotification(badge);
        }

        if (state.onUnlock) {
            state.onUnlock(badge);
        }

        // Dispatch event
        window.dispatchEvent(new CustomEvent('badge-unlocked', {
            detail: { badge }
        }));

        return true;
    }

    /**
     * Check if badge is unlocked
     */
    function isUnlocked(badgeId) {
        return state.unlocked.has(badgeId);
    }

    /**
     * Get badge info
     */
    function getBadge(badgeId) {
        return state.badges[badgeId] || null;
    }

    /**
     * Get all badges
     */
    function getAllBadges() {
        return Object.values(state.badges);
    }

    /**
     * Get unlocked badges
     */
    function getUnlocked() {
        return Array.from(state.unlocked).map(id => state.badges[id]).filter(Boolean);
    }

    /**
     * Get badges by category
     */
    function getByCategory(category) {
        return Object.values(state.badges).filter(b => b.category === category);
    }

    /**
     * Get total points
     */
    function getTotalPoints() {
        return getUnlocked().reduce((sum, badge) => sum + (badge.points || 0), 0);
    }

    /**
     * Get progress stats
     */
    function getStats() {
        const all = getAllBadges();
        const unlocked = getUnlocked();
        
        const byRarity = {};
        const byCategory = {};

        all.forEach(badge => {
            // Rarity stats
            if (!byRarity[badge.rarity]) {
                byRarity[badge.rarity] = { total: 0, unlocked: 0 };
            }
            byRarity[badge.rarity].total++;
            if (state.unlocked.has(badge.id)) {
                byRarity[badge.rarity].unlocked++;
            }

            // Category stats
            if (!byCategory[badge.category]) {
                byCategory[badge.category] = { total: 0, unlocked: 0 };
            }
            byCategory[badge.category].total++;
            if (state.unlocked.has(badge.id)) {
                byCategory[badge.category].unlocked++;
            }
        });

        return {
            total: all.length,
            unlocked: unlocked.length,
            points: getTotalPoints(),
            byRarity,
            byCategory
        };
    }

    /**
     * Show unlock notification
     */
    function showUnlockNotification(badge) {
        const existing = document.querySelector('.badge-notification');
        if (existing) existing.remove();

        const notification = document.createElement('div');
        notification.className = 'badge-notification';
        notification.innerHTML = `
            <span class="badge-notification-icon">${badge.icon}</span>
            <div class="badge-notification-content">
                <div class="badge-notification-title">Badge Unlocked!</div>
                <div class="badge-notification-name">${badge.name}</div>
            </div>
        `;

        document.body.appendChild(notification);

        // Animate in
        requestAnimationFrame(() => {
            notification.classList.add('show');
        });

        // Auto remove
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 400);
        }, 4000);
    }

    /**
     * Create badge grid
     */
    function createGrid(container, options = {}) {
        injectStyles();

        const el = typeof container === 'string' 
            ? document.querySelector(container) 
            : container;

        if (!el) return null;

        const { 
            badges = getAllBadges(),
            showLocked = true,
            onClick = null 
        } = options;

        el.className = 'badge-grid';
        
        badges.forEach(badge => {
            const unlocked = isUnlocked(badge.id);
            if (!showLocked && !unlocked) return;

            const item = document.createElement('div');
            item.className = `badge-item ${unlocked ? '' : 'locked'}`;
            
            const colors = rarityColors[badge.rarity] || rarityColors.common;
            
            item.innerHTML = `
                <span class="badge-icon">${badge.icon}</span>
                <span class="badge-name">${badge.name}</span>
                <span class="badge-rarity" style="background: ${colors.bg}; color: white;">
                    ${badge.rarity}
                </span>
            `;

            if (onClick) {
                item.addEventListener('click', () => onClick(badge, unlocked));
            }

            el.appendChild(item);
        });

        return { el };
    }

    /**
     * Create badge showcase (horizontal scroll)
     */
    function createShowcase(container, options = {}) {
        injectStyles();

        const el = typeof container === 'string' 
            ? document.querySelector(container) 
            : container;

        if (!el) return null;

        const { 
            badges = getUnlocked(),
            maxShow = 8 
        } = options;

        el.className = 'badge-showcase';
        
        badges.slice(0, maxShow).forEach(badge => {
            const colors = rarityColors[badge.rarity] || rarityColors.common;
            
            const item = document.createElement('div');
            item.className = 'badge-showcase-item';
            item.style.borderColor = colors.border;
            item.innerHTML = badge.icon;
            item.title = badge.name;
            
            el.appendChild(item);
        });

        return { el };
    }

    // Export API
    window.BadgeSystem = {
        init,
        unlock,
        isUnlocked,
        getBadge,
        getAllBadges,
        getUnlocked,
        getByCategory,
        getTotalPoints,
        getStats,
        showUnlockNotification,
        createGrid,
        createShowcase,
        rarityColors
    };

    console.log('🏅 BadgeSystem module loaded');
})();
