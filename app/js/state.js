/**
 * Quest Mini - State Management
 * Centralized state for the application
 */

const QuestState = (function() {
  'use strict';

  // Private state
  let state = {
    // Wallet state
    wallet: {
      connected: false,
      address: null,
      balance: '0',
      chainId: null,
      isCorrectChain: false
    },

    // Token state
    token: {
      balance: '0',
      symbol: 'QUEST',
      decimals: 18,
      totalSupply: '0'
    },

    // Quest state
    quests: {
      available: [],
      completed: [],
      cooldowns: {}
    },

    // Rewards state
    rewards: {
      pending: '0',
      claimed: '0',
      total: '0'
    },

    // User stats
    stats: {
      currentStreak: 0,
      longestStreak: 0,
      totalQuests: 0,
      boosterTier: 0,
      boosterMultiplier: 100
    },

    // UI state
    ui: {
      loading: false,
      error: null,
      modal: null,
      toast: null
    },

    // Transaction state
    transactions: {
      pending: [],
      history: []
    }
  };

  // Subscribers for state changes
  const subscribers = new Map();

  /**
   * Get current state or specific path
   * @param {string} [path] - Dot notation path to state property
   * @returns {*} State value
   */
  function getState(path) {
    if (!path) return { ...state };
    
    const keys = path.split('.');
    let value = state;
    
    for (const key of keys) {
      if (value === undefined || value === null) return undefined;
      value = value[key];
    }
    
    return value;
  }

  /**
   * Set state value at path
   * @param {string} path - Dot notation path
   * @param {*} value - New value
   */
  function setState(path, value) {
    const keys = path.split('.');
    const lastKey = keys.pop();
    let target = state;
    
    for (const key of keys) {
      if (!(key in target)) target[key] = {};
      target = target[key];
    }
    
    const oldValue = target[lastKey];
    target[lastKey] = value;
    
    // Notify subscribers
    notifySubscribers(path, value, oldValue);
  }

  /**
   * Update partial state (merge)
   * @param {string} path - Dot notation path
   * @param {object} updates - Partial updates
   */
  function updateState(path, updates) {
    const current = getState(path);
    if (typeof current === 'object' && !Array.isArray(current)) {
      setState(path, { ...current, ...updates });
    } else {
      setState(path, updates);
    }
  }

  /**
   * Subscribe to state changes
   * @param {string} path - Path to watch
   * @param {Function} callback - Called on change
   * @returns {Function} Unsubscribe function
   */
  function subscribe(path, callback) {
    if (!subscribers.has(path)) {
      subscribers.set(path, new Set());
    }
    subscribers.get(path).add(callback);
    
    return () => {
      subscribers.get(path).delete(callback);
    };
  }

  /**
   * Notify subscribers of changes
   */
  function notifySubscribers(path, newValue, oldValue) {
    // Exact path subscribers
    if (subscribers.has(path)) {
      subscribers.get(path).forEach(cb => cb(newValue, oldValue, path));
    }
    
    // Parent path subscribers (e.g., 'wallet' when 'wallet.address' changes)
    const parts = path.split('.');
    for (let i = parts.length - 1; i > 0; i--) {
      const parentPath = parts.slice(0, i).join('.');
      if (subscribers.has(parentPath)) {
        subscribers.get(parentPath).forEach(cb => cb(getState(parentPath), null, path));
      }
    }
    
    // Root subscribers
    if (subscribers.has('*')) {
      subscribers.get('*').forEach(cb => cb(state, null, path));
    }
  }

  /**
   * Reset state to initial values
   */
  function resetState() {
    state = {
      wallet: {
        connected: false,
        address: null,
        balance: '0',
        chainId: null,
        isCorrectChain: false
      },
      token: {
        balance: '0',
        symbol: 'QUEST',
        decimals: 18,
        totalSupply: '0'
      },
      quests: {
        available: [],
        completed: [],
        cooldowns: {}
      },
      rewards: {
        pending: '0',
        claimed: '0',
        total: '0'
      },
      stats: {
        currentStreak: 0,
        longestStreak: 0,
        totalQuests: 0,
        boosterTier: 0,
        boosterMultiplier: 100
      },
      ui: {
        loading: false,
        error: null,
        modal: null,
        toast: null
      },
      transactions: {
        pending: [],
        history: []
      }
    };
    
    notifySubscribers('*', state, null);
  }

  /**
   * Wallet-specific state helpers
   */
  const wallet = {
    connect(address, chainId) {
      updateState('wallet', {
        connected: true,
        address: address,
        chainId: chainId,
        isCorrectChain: chainId === 8453
      });
    },
    
    disconnect() {
      updateState('wallet', {
        connected: false,
        address: null,
        balance: '0',
        chainId: null,
        isCorrectChain: false
      });
    },
    
    setBalance(balance) {
      setState('wallet.balance', balance);
    },
    
    setChain(chainId) {
      updateState('wallet', {
        chainId: chainId,
        isCorrectChain: chainId === 8453
      });
    }
  };

  /**
   * Token-specific state helpers
   */
  const token = {
    setBalance(balance) {
      setState('token.balance', balance);
    },
    
    addBalance(amount) {
      const current = BigInt(getState('token.balance') || '0');
      const add = BigInt(amount);
      setState('token.balance', (current + add).toString());
    }
  };

  /**
   * Quest-specific state helpers
   */
  const quests = {
    setAvailable(quests) {
      setState('quests.available', quests);
    },
    
    setCompleted(questIds) {
      setState('quests.completed', questIds);
    },
    
    markCompleted(questId) {
      const completed = getState('quests.completed') || [];
      if (!completed.includes(questId)) {
        setState('quests.completed', [...completed, questId]);
      }
    },
    
    setCooldown(questId, timestamp) {
      const cooldowns = getState('quests.cooldowns') || {};
      setState('quests.cooldowns', { ...cooldowns, [questId]: timestamp });
    }
  };

  /**
   * Rewards-specific state helpers
   */
  const rewards = {
    setPending(amount) {
      setState('rewards.pending', amount);
    },
    
    claim(amount) {
      const pending = getState('rewards.pending') || '0';
      const claimed = getState('rewards.claimed') || '0';
      
      updateState('rewards', {
        pending: '0',
        claimed: (BigInt(claimed) + BigInt(amount)).toString()
      });
    }
  };

  /**
   * Stats-specific state helpers
   */
  const stats = {
    update(newStats) {
      updateState('stats', newStats);
    },
    
    incrementStreak() {
      const current = getState('stats.currentStreak') || 0;
      const longest = getState('stats.longestStreak') || 0;
      const newStreak = current + 1;
      
      updateState('stats', {
        currentStreak: newStreak,
        longestStreak: Math.max(newStreak, longest)
      });
    },
    
    setBooster(tier, multiplier) {
      updateState('stats', {
        boosterTier: tier,
        boosterMultiplier: multiplier
      });
    }
  };

  /**
   * UI state helpers
   */
  const ui = {
    setLoading(loading) {
      setState('ui.loading', loading);
    },
    
    setError(error) {
      setState('ui.error', error);
    },
    
    clearError() {
      setState('ui.error', null);
    },
    
    openModal(modalId, data = null) {
      setState('ui.modal', { id: modalId, data });
    },
    
    closeModal() {
      setState('ui.modal', null);
    }
  };

  /**
   * Transaction state helpers
   */
  const transactions = {
    addPending(txHash, type) {
      const pending = getState('transactions.pending') || [];
      setState('transactions.pending', [...pending, { hash: txHash, type, timestamp: Date.now() }]);
    },
    
    removePending(txHash) {
      const pending = getState('transactions.pending') || [];
      setState('transactions.pending', pending.filter(tx => tx.hash !== txHash));
    },
    
    addToHistory(tx) {
      const history = getState('transactions.history') || [];
      setState('transactions.history', [tx, ...history].slice(0, 50)); // Keep last 50
    }
  };

  // Public API
  return {
    get: getState,
    set: setState,
    update: updateState,
    subscribe,
    reset: resetState,
    
    // Namespaced helpers
    wallet,
    token,
    quests,
    rewards,
    stats,
    ui,
    transactions
  };
})();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = QuestState;
}
