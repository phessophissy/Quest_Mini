/**
 * Leaderboard - Rankings and competitive display
 * Quest Mini - Farcaster Mini-App
 */

(function() {
    'use strict';

    // Default styles
    const defaultStyles = `
        .leaderboard {
            background: var(--bg-card, #1A1A2E);
            border-radius: 16px;
            border: 1px solid var(--border, #2D2D44);
            overflow: hidden;
        }
        
        .leaderboard-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 16px;
            border-bottom: 1px solid var(--border, #2D2D44);
        }
        
        .leaderboard-title {
            font-size: 16px;
            font-weight: 600;
            color: var(--text-primary, #FFFFFF);
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .leaderboard-title-icon {
            font-size: 20px;
        }
        
        .leaderboard-period {
            font-size: 12px;
            color: var(--text-secondary, #A1A1AA);
            background: rgba(139, 92, 246, 0.1);
            padding: 4px 10px;
            border-radius: 12px;
        }
        
        .leaderboard-podium {
            display: flex;
            align-items: flex-end;
            justify-content: center;
            gap: 12px;
            padding: 24px 16px;
            background: linear-gradient(180deg, rgba(139, 92, 246, 0.1) 0%, transparent 100%);
        }
        
        .podium-item {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 8px;
        }
        
        .podium-item.first {
            order: 2;
        }
        
        .podium-item.second {
            order: 1;
        }
        
        .podium-item.third {
            order: 3;
        }
        
        .podium-avatar {
            width: 48px;
            height: 48px;
            border-radius: 50%;
            background: var(--bg-card-hover, #252542);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            position: relative;
        }
        
        .podium-item.first .podium-avatar {
            width: 64px;
            height: 64px;
            border: 3px solid #FFD700;
            box-shadow: 0 0 20px rgba(255, 215, 0, 0.3);
        }
        
        .podium-item.second .podium-avatar {
            border: 2px solid #C0C0C0;
        }
        
        .podium-item.third .podium-avatar {
            border: 2px solid #CD7F32;
        }
        
        .podium-rank {
            position: absolute;
            bottom: -4px;
            right: -4px;
            width: 20px;
            height: 20px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 11px;
            font-weight: 700;
            color: white;
        }
        
        .podium-item.first .podium-rank {
            background: linear-gradient(135deg, #FFD700, #FFA500);
        }
        
        .podium-item.second .podium-rank {
            background: linear-gradient(135deg, #C0C0C0, #A0A0A0);
        }
        
        .podium-item.third .podium-rank {
            background: linear-gradient(135deg, #CD7F32, #8B4513);
        }
        
        .podium-name {
            font-size: 12px;
            color: var(--text-primary, #FFFFFF);
            font-weight: 500;
            max-width: 80px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
        
        .podium-score {
            font-size: 14px;
            font-weight: 700;
            color: var(--primary, #8B5CF6);
        }
        
        .podium-platform {
            height: 40px;
            background: var(--border, #2D2D44);
            border-radius: 4px 4px 0 0;
            width: 70px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .podium-item.first .podium-platform {
            height: 60px;
            background: linear-gradient(180deg, #FFD700, #B8860B);
        }
        
        .podium-item.second .podium-platform {
            height: 50px;
            background: linear-gradient(180deg, #C0C0C0, #808080);
        }
        
        .podium-item.third .podium-platform {
            height: 35px;
            background: linear-gradient(180deg, #CD7F32, #8B4513);
        }
        
        .leaderboard-list {
            padding: 8px;
        }
        
        .leaderboard-item {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 12px;
            border-radius: 10px;
            transition: background 0.2s ease;
        }
        
        .leaderboard-item:hover {
            background: var(--bg-card-hover, #252542);
        }
        
        .leaderboard-item.current-user {
            background: rgba(139, 92, 246, 0.15);
            border: 1px solid var(--primary, #8B5CF6);
        }
        
        .lb-rank {
            width: 32px;
            height: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 14px;
            font-weight: 600;
            color: var(--text-secondary, #A1A1AA);
            background: var(--bg-card, #1A1A2E);
            border-radius: 8px;
        }
        
        .lb-rank.gold { color: #FFD700; }
        .lb-rank.silver { color: #C0C0C0; }
        .lb-rank.bronze { color: #CD7F32; }
        
        .lb-avatar {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: var(--bg-card-hover, #252542);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 18px;
        }
        
        .lb-info {
            flex: 1;
            min-width: 0;
        }
        
        .lb-name {
            font-size: 14px;
            font-weight: 500;
            color: var(--text-primary, #FFFFFF);
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
        
        .lb-details {
            font-size: 11px;
            color: var(--text-secondary, #A1A1AA);
            margin-top: 2px;
        }
        
        .lb-score {
            text-align: right;
        }
        
        .lb-score-value {
            font-size: 16px;
            font-weight: 700;
            color: var(--text-primary, #FFFFFF);
        }
        
        .lb-score-label {
            font-size: 10px;
            color: var(--text-secondary, #A1A1AA);
        }
        
        .lb-change {
            font-size: 12px;
            display: flex;
            align-items: center;
            gap: 2px;
        }
        
        .lb-change.up { color: var(--success, #10B981); }
        .lb-change.down { color: var(--error, #EF4444); }
        .lb-change.same { color: var(--text-secondary, #A1A1AA); }
        
        /* User rank card */
        .user-rank-card {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 16px;
            background: linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(6, 182, 212, 0.1));
            border-top: 1px solid var(--border, #2D2D44);
        }
        
        .user-rank-info {
            display: flex;
            align-items: center;
            gap: 12px;
        }
        
        .user-rank-position {
            font-size: 24px;
            font-weight: 700;
            color: var(--primary, #8B5CF6);
        }
        
        .user-rank-label {
            font-size: 12px;
            color: var(--text-secondary, #A1A1AA);
        }
        
        .user-rank-score {
            text-align: right;
        }
        
        /* Skeleton loading */
        .leaderboard-skeleton .lb-avatar,
        .leaderboard-skeleton .lb-name,
        .leaderboard-skeleton .lb-score-value {
            background: linear-gradient(90deg, var(--border, #2D2D44) 25%, var(--bg-card-hover, #252542) 50%, var(--border, #2D2D44) 75%);
            background-size: 200% 100%;
            animation: shimmer 1.5s infinite;
            border-radius: 4px;
        }
        
        @keyframes shimmer {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
        }
    `;

    // Inject styles
    function injectStyles() {
        if (document.getElementById('leaderboard-styles')) return;
        const style = document.createElement('style');
        style.id = 'leaderboard-styles';
        style.textContent = defaultStyles;
        document.head.appendChild(style);
    }

    /**
     * Create leaderboard instance
     */
    function create(container, options = {}) {
        injectStyles();

        const el = typeof container === 'string' 
            ? document.querySelector(container) 
            : container;

        if (!el) {
            console.error('Leaderboard container not found');
            return null;
        }

        const {
            title = '🏆 Leaderboard',
            period = 'This Week',
            entries = [],
            showPodium = true,
            showCurrentUser = true,
            currentUserId = null,
            maxVisible = 10,
            scoreLabel = 'QUEST',
            avatarRenderer = null,
            onChange = null
        } = options;

        const state = {
            entries: [...entries],
            sortBy: 'score',
            sortOrder: 'desc'
        };

        function render() {
            const sorted = [...state.entries].sort((a, b) => {
                const aVal = a[state.sortBy];
                const bVal = b[state.sortBy];
                return state.sortOrder === 'desc' ? bVal - aVal : aVal - bVal;
            });

            // Assign ranks
            sorted.forEach((entry, i) => {
                entry.rank = i + 1;
            });

            const top3 = sorted.slice(0, 3);
            const rest = sorted.slice(showPodium ? 3 : 0, maxVisible);
            const currentUser = currentUserId 
                ? sorted.find(e => e.id === currentUserId)
                : null;

            el.className = `leaderboard ${options.class || ''}`;
            el.innerHTML = '';

            // Header
            const header = document.createElement('div');
            header.className = 'leaderboard-header';
            header.innerHTML = `
                <div class="leaderboard-title">
                    <span class="leaderboard-title-icon">🏆</span>
                    ${title}
                </div>
                <span class="leaderboard-period">${period}</span>
            `;
            el.appendChild(header);

            // Podium
            if (showPodium && top3.length >= 3) {
                const podium = document.createElement('div');
                podium.className = 'leaderboard-podium';

                const positions = ['second', 'first', 'third'];
                const indices = [1, 0, 2];

                indices.forEach((idx, i) => {
                    const entry = top3[idx];
                    if (!entry) return;

                    const item = document.createElement('div');
                    item.className = `podium-item ${positions[i]}`;
                    item.innerHTML = `
                        <div class="podium-avatar">
                            ${avatarRenderer ? avatarRenderer(entry) : (entry.avatar || entry.name?.charAt(0) || '?')}
                            <span class="podium-rank">${entry.rank}</span>
                        </div>
                        <span class="podium-name">${entry.name || 'Anonymous'}</span>
                        <span class="podium-score">${formatScore(entry.score)}</span>
                        <div class="podium-platform"></div>
                    `;
                    podium.appendChild(item);
                });

                el.appendChild(podium);
            }

            // List
            if (rest.length > 0) {
                const list = document.createElement('div');
                list.className = 'leaderboard-list';

                rest.forEach(entry => {
                    const item = createListItem(entry);
                    list.appendChild(item);
                });

                el.appendChild(list);
            }

            // Current user card
            if (showCurrentUser && currentUser && currentUser.rank > maxVisible) {
                const userCard = document.createElement('div');
                userCard.className = 'user-rank-card';
                userCard.innerHTML = `
                    <div class="user-rank-info">
                        <div class="lb-avatar">
                            ${avatarRenderer ? avatarRenderer(currentUser) : (currentUser.avatar || currentUser.name?.charAt(0) || '?')}
                        </div>
                        <div>
                            <div class="user-rank-position">#${currentUser.rank}</div>
                            <div class="user-rank-label">Your Position</div>
                        </div>
                    </div>
                    <div class="user-rank-score">
                        <div class="lb-score-value">${formatScore(currentUser.score)}</div>
                        <div class="lb-score-label">${scoreLabel}</div>
                    </div>
                `;
                el.appendChild(userCard);
            }
        }

        function createListItem(entry) {
            const isCurrentUser = currentUserId && entry.id === currentUserId;
            const item = document.createElement('div');
            item.className = `leaderboard-item ${isCurrentUser ? 'current-user' : ''}`;
            
            let rankClass = '';
            if (entry.rank === 1) rankClass = 'gold';
            else if (entry.rank === 2) rankClass = 'silver';
            else if (entry.rank === 3) rankClass = 'bronze';

            let changeHtml = '';
            if (entry.change !== undefined) {
                const changeClass = entry.change > 0 ? 'up' : entry.change < 0 ? 'down' : 'same';
                const changeIcon = entry.change > 0 ? '▲' : entry.change < 0 ? '▼' : '•';
                changeHtml = `<div class="lb-change ${changeClass}">${changeIcon} ${Math.abs(entry.change)}</div>`;
            }

            item.innerHTML = `
                <div class="lb-rank ${rankClass}">${entry.rank}</div>
                <div class="lb-avatar">
                    ${avatarRenderer ? avatarRenderer(entry) : (entry.avatar || entry.name?.charAt(0) || '?')}
                </div>
                <div class="lb-info">
                    <div class="lb-name">${entry.name || 'Anonymous'}</div>
                    ${entry.details ? `<div class="lb-details">${entry.details}</div>` : ''}
                </div>
                <div class="lb-score">
                    <div class="lb-score-value">${formatScore(entry.score)}</div>
                    ${changeHtml}
                </div>
            `;

            return item;
        }

        function formatScore(score) {
            if (score >= 1000000) return (score / 1000000).toFixed(1) + 'M';
            if (score >= 1000) return (score / 1000).toFixed(1) + 'K';
            return score.toLocaleString();
        }

        function setEntries(newEntries) {
            state.entries = [...newEntries];
            render();
            if (onChange) onChange(state.entries);
        }

        function updateEntry(id, updates) {
            const entry = state.entries.find(e => e.id === id);
            if (entry) {
                Object.assign(entry, updates);
                render();
            }
        }

        function addEntry(entry) {
            state.entries.push(entry);
            render();
        }

        function removeEntry(id) {
            state.entries = state.entries.filter(e => e.id !== id);
            render();
        }

        function sort(by, order = 'desc') {
            state.sortBy = by;
            state.sortOrder = order;
            render();
        }

        function showLoading() {
            el.classList.add('leaderboard-skeleton');
        }

        function hideLoading() {
            el.classList.remove('leaderboard-skeleton');
        }

        // Initial render
        render();

        // Public API
        return {
            el,
            setEntries,
            updateEntry,
            addEntry,
            removeEntry,
            sort,
            showLoading,
            hideLoading,
            getEntries: () => [...state.entries],
            getRank: (id) => state.entries.find(e => e.id === id)?.rank,
            refresh: render,
            destroy() {
                el.innerHTML = '';
                el.className = '';
            }
        };
    }

    /**
     * Create mini leaderboard widget
     */
    function createMini(container, options = {}) {
        injectStyles();

        const el = typeof container === 'string' 
            ? document.querySelector(container) 
            : container;

        if (!el) return null;

        const { entries = [], limit = 5 } = options;

        el.className = 'leaderboard mini';
        el.innerHTML = `
            <div class="leaderboard-list">
                ${entries.slice(0, limit).map((entry, i) => `
                    <div class="leaderboard-item">
                        <div class="lb-rank ${i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : ''}">${i + 1}</div>
                        <div class="lb-info">
                            <div class="lb-name">${entry.name || 'Anonymous'}</div>
                        </div>
                        <div class="lb-score">
                            <div class="lb-score-value">${entry.score}</div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;

        return { el };
    }

    // Export API
    window.Leaderboard = {
        create,
        createMini
    };

    console.log('🏆 Leaderboard component initialized');
})();
