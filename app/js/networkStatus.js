/**
 * Quest Mini - Network Status Component
 * Monitors blockchain connection and network health
 */

import { CHAIN_ID, CHAIN_NAME, CHAIN_RPC } from './constants.js';

class NetworkStatus {
    constructor() {
        this.isOnline = navigator.onLine;
        this.isConnected = false;
        this.currentChainId = null;
        this.isCorrectNetwork = false;
        this.blockNumber = null;
        this.gasPrice = null;
        this.latency = null;
        this.lastCheck = null;
        this.checkInterval = null;
        this.listeners = new Map();
    }

    /**
     * Initialize network status monitoring
     * @param {Object} options - Configuration options
     */
    init(options = {}) {
        const {
            checkIntervalMs = 30000,
            showIndicator = true
        } = options;

        // Set up online/offline listeners
        window.addEventListener('online', () => this.handleOnlineChange(true));
        window.addEventListener('offline', () => this.handleOnlineChange(false));

        // Set up ethereum provider listeners
        if (window.ethereum) {
            window.ethereum.on('chainChanged', (chainId) => {
                this.handleChainChange(chainId);
            });
            window.ethereum.on('connect', () => {
                this.handleConnect();
            });
            window.ethereum.on('disconnect', () => {
                this.handleDisconnect();
            });
        }

        // Start periodic checks
        this.checkInterval = setInterval(() => this.check(), checkIntervalMs);

        // Initial check
        this.check();

        // Create UI indicator if enabled
        if (showIndicator) {
            this.createIndicator();
        }

        console.log('[NetworkStatus] Initialized');
    }

    /**
     * Check network status
     */
    async check() {
        const startTime = Date.now();
        
        try {
            // Check internet connectivity
            this.isOnline = navigator.onLine;

            // Check blockchain connection
            if (window.ethereum) {
                const chainIdHex = await window.ethereum.request({ method: 'eth_chainId' });
                this.currentChainId = parseInt(chainIdHex, 16);
                this.isCorrectNetwork = this.currentChainId === CHAIN_ID;
                this.isConnected = true;

                // Get block number for health check
                const blockHex = await window.ethereum.request({ method: 'eth_blockNumber' });
                this.blockNumber = parseInt(blockHex, 16);

                // Get gas price
                const gasPriceHex = await window.ethereum.request({ method: 'eth_gasPrice' });
                this.gasPrice = parseInt(gasPriceHex, 16);
            } else {
                this.isConnected = false;
            }

            this.latency = Date.now() - startTime;
            this.lastCheck = Date.now();

            // Update indicator
            this.updateIndicator();

            // Emit status event
            this.emit('statusChange', this.getStatus());

        } catch (error) {
            console.error('[NetworkStatus] Check failed:', error);
            this.isConnected = false;
            this.latency = null;
            this.updateIndicator();
            this.emit('error', error);
        }
    }

    /**
     * Handle online/offline change
     * @param {boolean} online - Online status
     */
    handleOnlineChange(online) {
        this.isOnline = online;
        this.emit('onlineChange', online);
        this.updateIndicator();
        
        if (online) {
            this.check(); // Re-check when back online
        }
    }

    /**
     * Handle chain change
     * @param {string} chainIdHex - Chain ID in hex
     */
    handleChainChange(chainIdHex) {
        this.currentChainId = parseInt(chainIdHex, 16);
        this.isCorrectNetwork = this.currentChainId === CHAIN_ID;
        this.emit('chainChange', {
            chainId: this.currentChainId,
            isCorrect: this.isCorrectNetwork
        });
        this.updateIndicator();
    }

    /**
     * Handle wallet connect
     */
    handleConnect() {
        this.isConnected = true;
        this.check();
        this.emit('connect');
    }

    /**
     * Handle wallet disconnect
     */
    handleDisconnect() {
        this.isConnected = false;
        this.emit('disconnect');
        this.updateIndicator();
    }

    /**
     * Get current status
     * @returns {Object} Status object
     */
    getStatus() {
        return {
            isOnline: this.isOnline,
            isConnected: this.isConnected,
            currentChainId: this.currentChainId,
            isCorrectNetwork: this.isCorrectNetwork,
            blockNumber: this.blockNumber,
            gasPrice: this.gasPrice,
            gasPriceGwei: this.gasPrice ? (this.gasPrice / 1e9).toFixed(2) : null,
            latency: this.latency,
            lastCheck: this.lastCheck,
            health: this.calculateHealth()
        };
    }

    /**
     * Calculate network health score
     * @returns {string} Health status: 'good', 'degraded', 'poor', 'offline'
     */
    calculateHealth() {
        if (!this.isOnline) return 'offline';
        if (!this.isConnected) return 'poor';
        if (!this.isCorrectNetwork) return 'degraded';
        if (this.latency > 5000) return 'degraded';
        if (this.latency > 10000) return 'poor';
        return 'good';
    }

    /**
     * Create status indicator UI
     */
    createIndicator() {
        // Check if indicator already exists
        if (document.getElementById('network-status-indicator')) return;

        const indicator = document.createElement('div');
        indicator.id = 'network-status-indicator';
        indicator.className = 'network-status';
        indicator.innerHTML = `
            <div class="network-status__dot"></div>
            <span class="network-status__text">Checking...</span>
        `;
        
        // Add styles
        const style = document.createElement('style');
        style.textContent = `
            .network-status {
                position: fixed;
                bottom: 16px;
                right: 16px;
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 8px 12px;
                background: var(--bg-secondary, #1a1a2e);
                border-radius: 20px;
                font-size: 12px;
                color: var(--text-secondary, #a0a0a0);
                z-index: 1000;
                transition: all 0.3s ease;
            }
            .network-status__dot {
                width: 8px;
                height: 8px;
                border-radius: 50%;
                background: #888;
                transition: background 0.3s ease;
            }
            .network-status--good .network-status__dot { background: #4ade80; }
            .network-status--degraded .network-status__dot { background: #facc15; }
            .network-status--poor .network-status__dot { background: #f97316; }
            .network-status--offline .network-status__dot { background: #ef4444; }
            .network-status--good { border: 1px solid rgba(74, 222, 128, 0.2); }
            .network-status--degraded { border: 1px solid rgba(250, 204, 21, 0.2); }
            .network-status--poor { border: 1px solid rgba(249, 115, 22, 0.2); }
            .network-status--offline { border: 1px solid rgba(239, 68, 68, 0.2); }
        `;
        document.head.appendChild(style);
        document.body.appendChild(indicator);
    }

    /**
     * Update status indicator UI
     */
    updateIndicator() {
        const indicator = document.getElementById('network-status-indicator');
        if (!indicator) return;

        const health = this.calculateHealth();
        const text = indicator.querySelector('.network-status__text');

        // Remove all status classes
        indicator.className = 'network-status';
        indicator.classList.add(`network-status--${health}`);

        // Update text
        if (!this.isOnline) {
            text.textContent = 'Offline';
        } else if (!this.isConnected) {
            text.textContent = 'No Wallet';
        } else if (!this.isCorrectNetwork) {
            text.textContent = `Wrong Network (${this.getChainName()})`;
        } else {
            text.textContent = `${CHAIN_NAME} · Block ${this.blockNumber?.toLocaleString() || '...'}`;
        }
    }

    /**
     * Get chain name from chain ID
     * @returns {string} Chain name
     */
    getChainName() {
        const chains = {
            1: 'Ethereum',
            8453: 'Base',
            84532: 'Base Sepolia',
            137: 'Polygon',
            42161: 'Arbitrum'
        };
        return chains[this.currentChainId] || `Chain ${this.currentChainId}`;
    }

    /**
     * Subscribe to events
     * @param {string} event - Event name
     * @param {Function} callback - Callback function
     * @returns {Function} Unsubscribe function
     */
    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }
        this.listeners.get(event).add(callback);
        return () => this.off(event, callback);
    }

    /**
     * Unsubscribe from events
     * @param {string} event - Event name
     * @param {Function} callback - Callback function
     */
    off(event, callback) {
        if (this.listeners.has(event)) {
            this.listeners.get(event).delete(callback);
        }
    }

    /**
     * Emit event
     * @param {string} event - Event name
     * @param {*} data - Event data
     */
    emit(event, data) {
        if (this.listeners.has(event)) {
            this.listeners.get(event).forEach(cb => {
                try {
                    cb(data);
                } catch (error) {
                    console.error(`[NetworkStatus] Event handler error:`, error);
                }
            });
        }
    }

    /**
     * Cleanup and stop monitoring
     */
    destroy() {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
        }
        this.listeners.clear();
        const indicator = document.getElementById('network-status-indicator');
        if (indicator) {
            indicator.remove();
        }
    }
}

// Export singleton instance
export const networkStatus = new NetworkStatus();
export { NetworkStatus };
