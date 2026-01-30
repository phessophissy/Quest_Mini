/**
 * Referral System - Invite links and referral tracking
 * Quest Mini - Farcaster Mini-App
 */

(function() {
    'use strict';

    // Default config
    const config = {
        baseUrl: window.location.origin,
        paramName: 'ref',
        storageKey: 'quest_referral',
        codeLength: 8,
        codeChars: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    };

    // Default styles
    const defaultStyles = `
        .referral-card {
            background: var(--bg-card, #1A1A2E);
            border-radius: 16px;
            border: 1px solid var(--border, #2D2D44);
            padding: 20px;
        }
        
        .referral-header {
            text-align: center;
            margin-bottom: 20px;
        }
        
        .referral-icon {
            font-size: 48px;
            margin-bottom: 8px;
        }
        
        .referral-title {
            font-size: 20px;
            font-weight: 600;
            color: var(--text-primary, #FFFFFF);
            margin-bottom: 4px;
        }
        
        .referral-subtitle {
            font-size: 14px;
            color: var(--text-secondary, #A1A1AA);
        }
        
        .referral-stats {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 12px;
            margin-bottom: 20px;
        }
        
        .referral-stat {
            text-align: center;
            padding: 12px;
            background: rgba(139, 92, 246, 0.1);
            border-radius: 12px;
        }
        
        .referral-stat-value {
            font-size: 24px;
            font-weight: 700;
            color: var(--primary, #8B5CF6);
        }
        
        .referral-stat-label {
            font-size: 11px;
            color: var(--text-secondary, #A1A1AA);
            text-transform: uppercase;
            margin-top: 4px;
        }
        
        .referral-link-box {
            display: flex;
            gap: 8px;
            margin-bottom: 16px;
        }
        
        .referral-link-input {
            flex: 1;
            padding: 12px 16px;
            background: var(--bg-dark, #0F0F1A);
            border: 1px solid var(--border, #2D2D44);
            border-radius: 10px;
            color: var(--text-primary, #FFFFFF);
            font-size: 14px;
            font-family: monospace;
        }
        
        .referral-copy-btn {
            padding: 12px 20px;
            background: var(--primary, #8B5CF6);
            border: none;
            border-radius: 10px;
            color: white;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            gap: 6px;
        }
        
        .referral-copy-btn:hover {
            background: var(--primary-dark, #7C3AED);
            transform: translateY(-1px);
        }
        
        .referral-copy-btn.copied {
            background: var(--success, #10B981);
        }
        
        .referral-share-buttons {
            display: flex;
            gap: 8px;
            justify-content: center;
        }
        
        .referral-share-btn {
            flex: 1;
            padding: 12px;
            border: 1px solid var(--border, #2D2D44);
            border-radius: 10px;
            background: transparent;
            color: var(--text-primary, #FFFFFF);
            font-size: 14px;
            cursor: pointer;
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
        }
        
        .referral-share-btn:hover {
            background: var(--bg-card-hover, #252542);
            border-color: var(--primary, #8B5CF6);
        }
        
        /* Rewards tier list */
        .referral-tiers {
            margin-top: 20px;
            padding-top: 20px;
            border-top: 1px solid var(--border, #2D2D44);
        }
        
        .referral-tier {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 12px;
            border-radius: 10px;
            margin-bottom: 8px;
            transition: background 0.2s ease;
        }
        
        .referral-tier:hover {
            background: var(--bg-card-hover, #252542);
        }
        
        .referral-tier.unlocked {
            background: rgba(16, 185, 129, 0.1);
            border: 1px solid var(--success, #10B981);
        }
        
        .referral-tier.current {
            background: rgba(139, 92, 246, 0.1);
            border: 1px solid var(--primary, #8B5CF6);
        }
        
        .tier-icon {
            font-size: 24px;
        }
        
        .tier-info {
            flex: 1;
        }
        
        .tier-name {
            font-weight: 600;
            color: var(--text-primary, #FFFFFF);
        }
        
        .tier-requirement {
            font-size: 12px;
            color: var(--text-secondary, #A1A1AA);
        }
        
        .tier-reward {
            text-align: right;
        }
        
        .tier-reward-value {
            font-weight: 700;
            color: var(--primary, #8B5CF6);
        }
        
        .tier-reward-label {
            font-size: 10px;
            color: var(--text-secondary, #A1A1AA);
        }
        
        /* Referral list */
        .referral-list {
            margin-top: 20px;
        }
        
        .referral-list-header {
            font-size: 14px;
            font-weight: 600;
            color: var(--text-primary, #FFFFFF);
            margin-bottom: 12px;
        }
        
        .referral-item {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 10px 0;
            border-bottom: 1px solid var(--border, #2D2D44);
        }
        
        .referral-item:last-child {
            border-bottom: none;
        }
        
        .referral-avatar {
            width: 36px;
            height: 36px;
            border-radius: 50%;
            background: var(--bg-card-hover, #252542);
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .referral-item-info {
            flex: 1;
        }
        
        .referral-item-name {
            font-size: 14px;
            color: var(--text-primary, #FFFFFF);
        }
        
        .referral-item-date {
            font-size: 11px;
            color: var(--text-secondary, #A1A1AA);
        }
        
        .referral-item-status {
            font-size: 12px;
            padding: 4px 8px;
            border-radius: 6px;
        }
        
        .referral-item-status.pending {
            background: rgba(245, 158, 11, 0.1);
            color: var(--warning, #F59E0B);
        }
        
        .referral-item-status.completed {
            background: rgba(16, 185, 129, 0.1);
            color: var(--success, #10B981);
        }
    `;

    // Inject styles
    function injectStyles() {
        if (document.getElementById('referral-styles')) return;
        const style = document.createElement('style');
        style.id = 'referral-styles';
        style.textContent = defaultStyles;
        document.head.appendChild(style);
    }

    /**
     * Generate referral code
     */
    function generateCode(userId = null) {
        if (userId) {
            // Hash-based code from user ID
            let hash = 0;
            for (let i = 0; i < userId.length; i++) {
                hash = ((hash << 5) - hash) + userId.charCodeAt(i);
                hash = hash & hash;
            }
            
            let code = '';
            const absHash = Math.abs(hash);
            for (let i = 0; i < config.codeLength; i++) {
                const idx = (absHash + i * 7) % config.codeChars.length;
                code += config.codeChars[idx];
            }
            return code;
        }
        
        // Random code
        let code = '';
        for (let i = 0; i < config.codeLength; i++) {
            const idx = Math.floor(Math.random() * config.codeChars.length);
            code += config.codeChars[idx];
        }
        return code;
    }

    /**
     * Create referral link
     */
    function createLink(code, path = '/') {
        const url = new URL(path, config.baseUrl);
        url.searchParams.set(config.paramName, code);
        return url.toString();
    }

    /**
     * Extract referral code from URL
     */
    function extractCode(url = window.location.href) {
        try {
            const urlObj = new URL(url);
            return urlObj.searchParams.get(config.paramName);
        } catch {
            return null;
        }
    }

    /**
     * Store referral code
     */
    function storeReferral(code) {
        if (!code) return false;
        
        const existing = localStorage.getItem(config.storageKey);
        if (existing) return false; // Don't override existing referral
        
        const data = {
            code,
            timestamp: Date.now(),
            source: document.referrer || 'direct'
        };
        
        localStorage.setItem(config.storageKey, JSON.stringify(data));
        return true;
    }

    /**
     * Get stored referral
     */
    function getStoredReferral() {
        try {
            const data = localStorage.getItem(config.storageKey);
            return data ? JSON.parse(data) : null;
        } catch {
            return null;
        }
    }

    /**
     * Clear stored referral
     */
    function clearReferral() {
        localStorage.removeItem(config.storageKey);
    }

    /**
     * Auto-capture referral from URL
     */
    function autoCapture() {
        const code = extractCode();
        if (code) {
            storeReferral(code);
            
            // Clean URL
            const url = new URL(window.location.href);
            url.searchParams.delete(config.paramName);
            window.history.replaceState({}, '', url.toString());
        }
        return code;
    }

    /**
     * Create referral card UI
     */
    function createCard(container, options = {}) {
        injectStyles();

        const el = typeof container === 'string' 
            ? document.querySelector(container) 
            : container;

        if (!el) return null;

        const {
            code,
            stats = { referrals: 0, earnings: 0, pending: 0 },
            tiers = [],
            referrals = [],
            shareMessage = 'Join Quest Mini and earn QUEST tokens! Use my referral link:',
            onCopy = null,
            onShare = null
        } = options;

        const link = createLink(code);
        const currentTier = tiers.findIndex(t => stats.referrals < t.requirement);

        el.className = 'referral-card';
        el.innerHTML = `
            <div class="referral-header">
                <div class="referral-icon">🎁</div>
                <h3 class="referral-title">Invite Friends</h3>
                <p class="referral-subtitle">Earn rewards for every friend you refer</p>
            </div>
            
            <div class="referral-stats">
                <div class="referral-stat">
                    <div class="referral-stat-value">${stats.referrals}</div>
                    <div class="referral-stat-label">Referrals</div>
                </div>
                <div class="referral-stat">
                    <div class="referral-stat-value">${stats.earnings}</div>
                    <div class="referral-stat-label">Earned</div>
                </div>
                <div class="referral-stat">
                    <div class="referral-stat-value">${stats.pending}</div>
                    <div class="referral-stat-label">Pending</div>
                </div>
            </div>
            
            <div class="referral-link-box">
                <input type="text" class="referral-link-input" value="${link}" readonly>
                <button class="referral-copy-btn" data-link="${link}">
                    📋 Copy
                </button>
            </div>
            
            <div class="referral-share-buttons">
                <button class="referral-share-btn" data-platform="twitter">
                    🐦 Twitter
                </button>
                <button class="referral-share-btn" data-platform="telegram">
                    ✈️ Telegram
                </button>
                <button class="referral-share-btn" data-platform="warpcast">
                    🟣 Warpcast
                </button>
            </div>
            
            ${tiers.length > 0 ? `
                <div class="referral-tiers">
                    ${tiers.map((tier, i) => `
                        <div class="referral-tier ${i < currentTier ? 'unlocked' : ''} ${i === currentTier ? 'current' : ''}">
                            <span class="tier-icon">${tier.icon || '🎯'}</span>
                            <div class="tier-info">
                                <div class="tier-name">${tier.name}</div>
                                <div class="tier-requirement">${tier.requirement} referrals</div>
                            </div>
                            <div class="tier-reward">
                                <div class="tier-reward-value">+${tier.reward}</div>
                                <div class="tier-reward-label">QUEST</div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            ` : ''}
            
            ${referrals.length > 0 ? `
                <div class="referral-list">
                    <div class="referral-list-header">Recent Referrals</div>
                    ${referrals.slice(0, 5).map(ref => `
                        <div class="referral-item">
                            <div class="referral-avatar">${ref.name?.charAt(0) || '?'}</div>
                            <div class="referral-item-info">
                                <div class="referral-item-name">${ref.name || 'Anonymous'}</div>
                                <div class="referral-item-date">${formatDate(ref.date)}</div>
                            </div>
                            <span class="referral-item-status ${ref.completed ? 'completed' : 'pending'}">
                                ${ref.completed ? 'Completed' : 'Pending'}
                            </span>
                        </div>
                    `).join('')}
                </div>
            ` : ''}
        `;

        // Copy button handler
        const copyBtn = el.querySelector('.referral-copy-btn');
        copyBtn.addEventListener('click', async () => {
            try {
                await navigator.clipboard.writeText(link);
                copyBtn.innerHTML = '✓ Copied!';
                copyBtn.classList.add('copied');
                
                setTimeout(() => {
                    copyBtn.innerHTML = '📋 Copy';
                    copyBtn.classList.remove('copied');
                }, 2000);
                
                if (onCopy) onCopy(link);
            } catch (e) {
                console.error('Copy failed:', e);
            }
        });

        // Share button handlers
        el.querySelectorAll('.referral-share-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const platform = btn.dataset.platform;
                shareToplatform(platform, link, shareMessage);
                if (onShare) onShare(platform, link);
            });
        });

        function formatDate(date) {
            const d = new Date(date);
            return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }

        return {
            el,
            getLink: () => link,
            updateStats(newStats) {
                Object.assign(stats, newStats);
                // Would re-render stats section
            }
        };
    }

    /**
     * Share to social platform
     */
    function shareToplatform(platform, link, message) {
        const encodedLink = encodeURIComponent(link);
        const encodedMessage = encodeURIComponent(message);
        
        const urls = {
            twitter: `https://twitter.com/intent/tweet?text=${encodedMessage}&url=${encodedLink}`,
            telegram: `https://t.me/share/url?url=${encodedLink}&text=${encodedMessage}`,
            warpcast: `https://warpcast.com/~/compose?text=${encodedMessage}%20${encodedLink}`,
            whatsapp: `https://wa.me/?text=${encodedMessage}%20${encodedLink}`
        };

        const url = urls[platform];
        if (url) {
            window.open(url, '_blank', 'width=600,height=400');
        }
    }

    /**
     * Configure referral system
     */
    function configure(options) {
        Object.assign(config, options);
    }

    // Auto-capture on load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', autoCapture);
    } else {
        autoCapture();
    }

    // Export API
    window.ReferralSystem = {
        configure,
        generateCode,
        createLink,
        extractCode,
        storeReferral,
        getStoredReferral,
        clearReferral,
        autoCapture,
        createCard,
        shareToplatform
    };

    console.log('🎁 ReferralSystem module initialized');
})();
