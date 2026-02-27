/**
 * Transaction History - Display and manage transaction records
 * Quest Mini - Farcaster Mini-App
 */

(function() {
    'use strict';

    // Storage key
    const STORAGE_KEY = 'quest_tx_history';
    const MAX_STORED = 100;

    // Transaction types
    const TX_TYPES = {
        CLAIM: { label: 'Claim', icon: '🎁', color: '#10B981' },
        STAKE: { label: 'Stake', icon: '📈', color: '#8B5CF6' },
        UNSTAKE: { label: 'Unstake', icon: '📉', color: '#F59E0B' },
        TRANSFER: { label: 'Transfer', icon: '↗️', color: '#3B82F6' },
        RECEIVE: { label: 'Receive', icon: '↘️', color: '#10B981' },
        SWAP: { label: 'Swap', icon: '🔄', color: '#06B6D4' },
        APPROVE: { label: 'Approve', icon: '✓', color: '#6B7280' },
        QUEST: { label: 'Quest', icon: '⚔️', color: '#8B5CF6' },
        MINT: { label: 'Mint', icon: '✨', color: '#F59E0B' }
    };

    // Transaction statuses
    const TX_STATUS = {
        PENDING: { label: 'Pending', color: '#F59E0B' },
        CONFIRMED: { label: 'Confirmed', color: '#10B981' },
        FAILED: { label: 'Failed', color: '#EF4444' }
    };

    // Default styles
    const defaultStyles = `
        .tx-history {
            background: var(--bg-card, #1A1A2E);
            border-radius: 16px;
            border: 1px solid var(--border, #2D2D44);
            overflow: hidden;
        }
        
        .tx-history-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 16px;
            border-bottom: 1px solid var(--border, #2D2D44);
        }
        
        .tx-history-title {
            font-size: 16px;
            font-weight: 600;
            color: var(--text-primary, #FFFFFF);
        }
        
        .tx-history-filters {
            display: flex;
            gap: 8px;
        }
        
        .tx-filter-btn {
            padding: 6px 12px;
            background: transparent;
            border: 1px solid var(--border, #2D2D44);
            border-radius: 8px;
            color: var(--text-secondary, #A1A1AA);
            font-size: 12px;
            cursor: pointer;
            transition: all 0.2s ease;
        }
        
        .tx-filter-btn:hover,
        .tx-filter-btn.active {
            border-color: var(--primary, #8B5CF6);
            color: var(--primary, #8B5CF6);
        }
        
        .tx-list {
            max-height: 400px;
            overflow-y: auto;
        }
        
        .tx-list::-webkit-scrollbar {
            width: 4px;
        }
        
        .tx-list::-webkit-scrollbar-thumb {
            background: var(--border, #2D2D44);
            border-radius: 2px;
        }
        
        .tx-item {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 14px 16px;
            border-bottom: 1px solid var(--border, #2D2D44);
            cursor: pointer;
            transition: background 0.2s ease;
        }
        
        .tx-item:hover {
            background: var(--bg-card-hover, #252542);
        }
        
        .tx-item:last-child {
            border-bottom: none;
        }
        
        .tx-icon {
            width: 40px;
            height: 40px;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 18px;
            background: rgba(139, 92, 246, 0.1);
        }
        
        .tx-details {
            flex: 1;
            min-width: 0;
        }
        
        .tx-type {
            font-weight: 500;
            color: var(--text-primary, #FFFFFF);
            display: flex;
            align-items: center;
            gap: 6px;
        }
        
        .tx-status-dot {
            width: 6px;
            height: 6px;
            border-radius: 50%;
        }
        
        .tx-meta {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 12px;
            color: var(--text-secondary, #A1A1AA);
            margin-top: 2px;
        }
        
        .tx-hash {
            font-family: monospace;
        }
        
        .tx-amount {
            text-align: right;
        }
        
        .tx-amount-value {
            font-weight: 600;
            color: var(--text-primary, #FFFFFF);
        }
        
        .tx-amount-value.positive {
            color: var(--success, #10B981);
        }
        
        .tx-amount-value.negative {
            color: var(--error, #EF4444);
        }
        
        .tx-amount-usd {
            font-size: 12px;
            color: var(--text-secondary, #A1A1AA);
        }
        
        /* Empty state */
        .tx-empty {
            padding: 40px 20px;
            text-align: center;
        }
        
        .tx-empty-icon {
            font-size: 48px;
            margin-bottom: 12px;
            opacity: 0.5;
        }
        
        .tx-empty-text {
            color: var(--text-secondary, #A1A1AA);
            font-size: 14px;
        }
        
        /* Transaction detail modal */
        .tx-detail-modal {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            opacity: 0;
            visibility: hidden;
            transition: all 0.3s ease;
        }
        
        .tx-detail-modal.open {
            opacity: 1;
            visibility: visible;
        }
        
        .tx-detail-content {
            background: var(--bg-card, #1A1A2E);
            border-radius: 20px;
            padding: 24px;
            max-width: 400px;
            width: 90%;
        }
        
        .tx-detail-header {
            text-align: center;
            margin-bottom: 20px;
        }
        
        .tx-detail-icon {
            font-size: 48px;
            margin-bottom: 8px;
        }
        
        .tx-detail-type {
            font-size: 18px;
            font-weight: 600;
            color: var(--text-primary, #FFFFFF);
        }
        
        .tx-detail-status {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 8px;
            font-size: 12px;
            margin-top: 8px;
        }
        
        .tx-detail-rows {
            background: var(--bg-dark, #0F0F1A);
            border-radius: 12px;
            padding: 16px;
        }
        
        .tx-detail-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid var(--border, #2D2D44);
        }
        
        .tx-detail-row:last-child {
            border-bottom: none;
        }
        
        .tx-detail-label {
            color: var(--text-secondary, #A1A1AA);
            font-size: 13px;
        }
        
        .tx-detail-value {
            color: var(--text-primary, #FFFFFF);
            font-size: 13px;
            font-family: monospace;
            word-break: break-all;
            text-align: right;
            max-width: 60%;
        }
        
        .tx-detail-actions {
            display: flex;
            gap: 8px;
            margin-top: 20px;
        }
        
        .tx-detail-btn {
            flex: 1;
            padding: 12px;
            border-radius: 10px;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s ease;
        }
        
        .tx-detail-btn.primary {
            background: var(--primary, #8B5CF6);
            border: none;
            color: white;
        }
        
        .tx-detail-btn.secondary {
            background: transparent;
            border: 1px solid var(--border, #2D2D44);
            color: var(--text-primary, #FFFFFF);
        }
        
        /* Loading state */
        .tx-item.loading {
            animation: txPulse 1.5s infinite;
        }
        
        @keyframes txPulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }
    `;

    // Inject styles
    function injectStyles() {
        if (document.getElementById('tx-history-styles')) return;
        const style = document.createElement('style');
        style.id = 'tx-history-styles';
        style.textContent = defaultStyles;
        document.head.appendChild(style);
    }

    // State
    const state = {
        transactions: [],
        filter: 'all'
    };

    /**
     * Load transactions from storage
     */
    function loadTransactions() {
        try {
            const data = localStorage.getItem(STORAGE_KEY);
            state.transactions = data ? JSON.parse(data) : [];
        } catch (e) {
            state.transactions = [];
        }
        return state.transactions;
    }

    /**
     * Save transactions to storage
     */
    function saveTransactions() {
        try {
            // Keep only recent transactions
            const toSave = state.transactions.slice(0, MAX_STORED);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
        } catch (e) {
            console.error('Failed to save transactions:', e);
        }
    }

    /**
     * Add transaction
     */
    function addTransaction(tx) {
        const transaction = {
            id: tx.id || crypto.randomUUID?.() || Date.now().toString(),
            hash: tx.hash,
            type: tx.type || 'TRANSFER',
            status: tx.status || 'PENDING',
            amount: tx.amount,
            token: tx.token || 'QUEST',
            from: tx.from,
            to: tx.to,
            timestamp: tx.timestamp || Date.now(),
            chainId: tx.chainId || 8453,
            gasUsed: tx.gasUsed,
            gasFee: tx.gasFee,
            description: tx.description
        };

        state.transactions.unshift(transaction);
        saveTransactions();

        // Emit event
        window.dispatchEvent(new CustomEvent('tx-added', { detail: transaction }));

        return transaction;
    }

    /**
     * Update transaction status
     */
    function updateTransaction(hashOrId, updates) {
        const tx = state.transactions.find(
            t => t.hash === hashOrId || t.id === hashOrId
        );
        
        if (tx) {
            Object.assign(tx, updates);
            saveTransactions();
            
            window.dispatchEvent(new CustomEvent('tx-updated', { detail: tx }));
        }
        
        return tx;
    }

    /**
     * Get transaction by hash
     */
    function getTransaction(hashOrId) {
        return state.transactions.find(
            t => t.hash === hashOrId || t.id === hashOrId
        );
    }

    /**
     * Get all transactions
     */
    function getAllTransactions() {
        return [...state.transactions];
    }

    /**
     * Get transactions by type
     */
    function getByType(type) {
        return state.transactions.filter(t => t.type === type);
    }

    /**
     * Get pending transactions
     */
    function getPending() {
        return state.transactions.filter(t => t.status === 'PENDING');
    }

    /**
     * Clear all transactions
     */
    function clearAll() {
        state.transactions = [];
        saveTransactions();
    }

    /**
     * Format timestamp
     */
    function formatTime(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;

        if (diff < 60000) return 'Just now';
        if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
        if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;
        
        return date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric' 
        });
    }

    /**
     * Truncate hash
     */
    function truncateHash(hash) {
        if (!hash) return '';
        return `${hash.slice(0, 6)}...${hash.slice(-4)}`;
    }

    /**
     * Create transaction history component
     */
    function create(container, options = {}) {
        injectStyles();
        loadTransactions();

        const el = typeof container === 'string' 
            ? document.querySelector(container) 
            : container;

        if (!el) return null;

        const {
            title = 'Transaction History',
            showFilters = true,
            maxShow = 20,
            explorerUrl = 'https://basescan.org/tx/',
            onSelect = null
        } = options;

        function render() {
            let filtered = state.transactions;
            
            if (state.filter !== 'all') {
                filtered = filtered.filter(t => t.type === state.filter);
            }

            const displayTxs = filtered.slice(0, maxShow);

            el.className = 'tx-history';
            el.innerHTML = `
                <div class="tx-history-header">
                    <h3 class="tx-history-title">${title}</h3>
                    ${showFilters ? `
                        <div class="tx-history-filters">
                            <button class="tx-filter-btn ${state.filter === 'all' ? 'active' : ''}" data-filter="all">All</button>
                            <button class="tx-filter-btn ${state.filter === 'CLAIM' ? 'active' : ''}" data-filter="CLAIM">Claims</button>
                            <button class="tx-filter-btn ${state.filter === 'QUEST' ? 'active' : ''}" data-filter="QUEST">Quests</button>
                        </div>
                    ` : ''}
                </div>
                <div class="tx-list">
                    ${displayTxs.length > 0 ? displayTxs.map(tx => renderTxItem(tx)).join('') : `
                        <div class="tx-empty">
                            <div class="tx-empty-icon">📋</div>
                            <p class="tx-empty-text">No transactions yet</p>
                        </div>
                    `}
                </div>
            `;

            // Filter handlers
            el.querySelectorAll('.tx-filter-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    state.filter = btn.dataset.filter;
                    render();
                });
            });

            // Item click handlers
            el.querySelectorAll('.tx-item').forEach(item => {
                item.addEventListener('click', () => {
                    const tx = getTransaction(item.dataset.hash || item.dataset.id);
                    if (tx) {
                        if (onSelect) {
                            onSelect(tx);
                        } else {
                            showDetail(tx, explorerUrl);
                        }
                    }
                });
            });
        }

        function renderTxItem(tx) {
            const typeInfo = TX_TYPES[tx.type] || TX_TYPES.TRANSFER;
            const statusInfo = TX_STATUS[tx.status] || TX_STATUS.PENDING;
            
            const isPositive = ['CLAIM', 'RECEIVE', 'QUEST'].includes(tx.type);
            const amountClass = isPositive ? 'positive' : 'negative';
            const amountPrefix = isPositive ? '+' : '-';

            return `
                <div class="tx-item ${tx.status === 'PENDING' ? 'loading' : ''}" 
                     data-hash="${tx.hash || ''}" 
                     data-id="${tx.id}">
                    <div class="tx-icon" style="background: ${typeInfo.color}20; color: ${typeInfo.color}">
                        ${typeInfo.icon}
                    </div>
                    <div class="tx-details">
                        <div class="tx-type">
                            ${typeInfo.label}
                            <span class="tx-status-dot" style="background: ${statusInfo.color}"></span>
                        </div>
                        <div class="tx-meta">
                            ${tx.hash ? `<span class="tx-hash">${truncateHash(tx.hash)}</span>` : ''}
                            <span>${formatTime(tx.timestamp)}</span>
                        </div>
                    </div>
                    <div class="tx-amount">
                        <div class="tx-amount-value ${amountClass}">
                            ${amountPrefix}${tx.amount} ${tx.token}
                        </div>
                    </div>
                </div>
            `;
        }

        function showDetail(tx, explorerUrl) {
            const typeInfo = TX_TYPES[tx.type] || TX_TYPES.TRANSFER;
            const statusInfo = TX_STATUS[tx.status] || TX_STATUS.PENDING;

            const modal = document.createElement('div');
            modal.className = 'tx-detail-modal';
            modal.innerHTML = `
                <div class="tx-detail-content">
                    <div class="tx-detail-header">
                        <div class="tx-detail-icon">${typeInfo.icon}</div>
                        <div class="tx-detail-type">${typeInfo.label}</div>
                        <span class="tx-detail-status" style="background: ${statusInfo.color}20; color: ${statusInfo.color}">
                            ${statusInfo.label}
                        </span>
                    </div>
                    <div class="tx-detail-rows">
                        <div class="tx-detail-row">
                            <span class="tx-detail-label">Amount</span>
                            <span class="tx-detail-value">${tx.amount} ${tx.token}</span>
                        </div>
                        ${tx.hash ? `
                            <div class="tx-detail-row">
                                <span class="tx-detail-label">Hash</span>
                                <span class="tx-detail-value">${truncateHash(tx.hash)}</span>
                            </div>
                        ` : ''}
                        <div class="tx-detail-row">
                            <span class="tx-detail-label">Time</span>
                            <span class="tx-detail-value">${new Date(tx.timestamp).toLocaleString()}</span>
                        </div>
                        ${tx.gasFee ? `
                            <div class="tx-detail-row">
                                <span class="tx-detail-label">Gas Fee</span>
                                <span class="tx-detail-value">${tx.gasFee} ETH</span>
                            </div>
                        ` : ''}
                    </div>
                    <div class="tx-detail-actions">
                        <button class="tx-detail-btn secondary close-btn">Close</button>
                        ${tx.hash ? `
                            <a href="${explorerUrl}${tx.hash}" target="_blank" class="tx-detail-btn primary">
                                View on Explorer
                            </a>
                        ` : ''}
                    </div>
                </div>
            `;

            modal.querySelector('.close-btn').addEventListener('click', () => {
                modal.classList.remove('open');
                setTimeout(() => modal.remove(), 300);
            });

            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.remove('open');
                    setTimeout(() => modal.remove(), 300);
                }
            });

            document.body.appendChild(modal);
            requestAnimationFrame(() => modal.classList.add('open'));
        }

        // Listen for updates
        window.addEventListener('tx-added', render);
        window.addEventListener('tx-updated', render);

        // Initial render
        render();

        return {
            el,
            render,
            setFilter(filter) {
                state.filter = filter;
                render();
            }
        };
    }

    // Initialize
    loadTransactions();

    // Export API
    window.TxHistory = {
        create,
        addTransaction,
        updateTransaction,
        getTransaction,
        getAllTransactions,
        getByType,
        getPending,
        clearAll,
        TX_TYPES,
        TX_STATUS
    };

    console.log('📜 TxHistory module initialized');
})();
