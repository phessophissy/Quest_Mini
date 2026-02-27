/**
 * Wallet Connect - Enhanced wallet connection management
 * Quest Mini - Farcaster Mini-App
 */

(function() {
    'use strict';

    // State
    const state = {
        provider: null,
        signer: null,
        address: null,
        chainId: null,
        isConnected: false,
        isConnecting: false,
        listeners: new Map()
    };

    // Supported chains
    const chains = {
        1: { name: 'Ethereum', hex: '0x1' },
        8453: { name: 'Base', hex: '0x2105' },
        84532: { name: 'Base Sepolia', hex: '0x14a34' },
        10: { name: 'Optimism', hex: '0xa' },
        42161: { name: 'Arbitrum', hex: '0xa4b1' }
    };

    // Default styles
    const defaultStyles = `
        .wallet-connect-modal {
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
        
        .wallet-connect-modal.open {
            opacity: 1;
            visibility: visible;
        }
        
        .wallet-modal-content {
            background: var(--bg-card, #1A1A2E);
            border-radius: 20px;
            padding: 24px;
            max-width: 400px;
            width: 90%;
            transform: translateY(20px);
            transition: transform 0.3s ease;
        }
        
        .wallet-connect-modal.open .wallet-modal-content {
            transform: translateY(0);
        }
        
        .wallet-modal-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 20px;
        }
        
        .wallet-modal-title {
            font-size: 20px;
            font-weight: 600;
            color: var(--text-primary, #FFFFFF);
        }
        
        .wallet-modal-close {
            background: none;
            border: none;
            color: var(--text-secondary, #A1A1AA);
            font-size: 24px;
            cursor: pointer;
            padding: 4px;
        }
        
        .wallet-options {
            display: flex;
            flex-direction: column;
            gap: 12px;
        }
        
        .wallet-option {
            display: flex;
            align-items: center;
            gap: 16px;
            padding: 16px;
            background: var(--bg-dark, #0F0F1A);
            border: 1px solid var(--border, #2D2D44);
            border-radius: 12px;
            cursor: pointer;
            transition: all 0.2s ease;
        }
        
        .wallet-option:hover {
            border-color: var(--primary, #8B5CF6);
            background: rgba(139, 92, 246, 0.1);
        }
        
        .wallet-option.connecting {
            opacity: 0.7;
            pointer-events: none;
        }
        
        .wallet-option-icon {
            width: 40px;
            height: 40px;
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            background: var(--bg-card, #1A1A2E);
        }
        
        .wallet-option-info {
            flex: 1;
        }
        
        .wallet-option-name {
            font-weight: 500;
            color: var(--text-primary, #FFFFFF);
        }
        
        .wallet-option-desc {
            font-size: 12px;
            color: var(--text-secondary, #A1A1AA);
        }
        
        .wallet-option-arrow {
            color: var(--text-secondary, #A1A1AA);
        }
        
        /* Connected wallet display */
        .wallet-connected {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 12px 16px;
            background: var(--bg-card, #1A1A2E);
            border-radius: 12px;
            border: 1px solid var(--border, #2D2D44);
        }
        
        .wallet-avatar {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: linear-gradient(135deg, var(--primary, #8B5CF6), var(--secondary, #06B6D4));
        }
        
        .wallet-info {
            flex: 1;
        }
        
        .wallet-address {
            font-family: monospace;
            color: var(--text-primary, #FFFFFF);
            font-size: 14px;
        }
        
        .wallet-chain {
            font-size: 12px;
            color: var(--text-secondary, #A1A1AA);
            display: flex;
            align-items: center;
            gap: 4px;
        }
        
        .wallet-chain-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: var(--success, #10B981);
        }
        
        .wallet-disconnect {
            padding: 8px 16px;
            background: transparent;
            border: 1px solid var(--error, #EF4444);
            border-radius: 8px;
            color: var(--error, #EF4444);
            font-size: 12px;
            cursor: pointer;
            transition: all 0.2s ease;
        }
        
        .wallet-disconnect:hover {
            background: var(--error, #EF4444);
            color: white;
        }
        
        /* Chain switch modal */
        .chain-switch-options {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 8px;
            margin-top: 16px;
        }
        
        .chain-option {
            padding: 12px;
            background: var(--bg-dark, #0F0F1A);
            border: 1px solid var(--border, #2D2D44);
            border-radius: 10px;
            cursor: pointer;
            text-align: center;
            transition: all 0.2s ease;
        }
        
        .chain-option:hover {
            border-color: var(--primary, #8B5CF6);
        }
        
        .chain-option.active {
            border-color: var(--success, #10B981);
            background: rgba(16, 185, 129, 0.1);
        }
        
        .chain-option-name {
            font-size: 14px;
            color: var(--text-primary, #FFFFFF);
        }
        
        .chain-option-id {
            font-size: 11px;
            color: var(--text-secondary, #A1A1AA);
        }
        
        /* Connect button */
        .wallet-connect-btn {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 12px 20px;
            background: var(--primary, #8B5CF6);
            border: none;
            border-radius: 12px;
            color: white;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease;
        }
        
        .wallet-connect-btn:hover {
            background: var(--primary-dark, #7C3AED);
            transform: translateY(-1px);
        }
        
        .wallet-connect-btn:disabled {
            opacity: 0.7;
            cursor: not-allowed;
        }
        
        .wallet-connect-btn .spinner {
            width: 16px;
            height: 16px;
            border: 2px solid rgba(255,255,255,0.3);
            border-top-color: white;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
        }
        
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
    `;

    // Inject styles
    function injectStyles() {
        if (document.getElementById('wallet-connect-styles')) return;
        const style = document.createElement('style');
        style.id = 'wallet-connect-styles';
        style.textContent = defaultStyles;
        document.head.appendChild(style);
    }

    /**
     * Check if wallet is available
     */
    function isWalletAvailable() {
        return typeof window.ethereum !== 'undefined';
    }

    /**
     * Get available wallets
     */
    function getAvailableWallets() {
        const wallets = [];
        
        if (window.ethereum) {
            if (window.ethereum.isMetaMask) {
                wallets.push({
                    id: 'metamask',
                    name: 'MetaMask',
                    icon: '🦊',
                    provider: window.ethereum
                });
            }
            if (window.ethereum.isCoinbaseWallet) {
                wallets.push({
                    id: 'coinbase',
                    name: 'Coinbase Wallet',
                    icon: '🔵',
                    provider: window.ethereum
                });
            }
            // Generic injected wallet
            if (wallets.length === 0) {
                wallets.push({
                    id: 'injected',
                    name: 'Browser Wallet',
                    icon: '💼',
                    provider: window.ethereum
                });
            }
        }

        return wallets;
    }

    /**
     * Connect to wallet
     */
    async function connect(preferredWallet = null) {
        if (!isWalletAvailable()) {
            throw new Error('No wallet found. Please install MetaMask or another wallet.');
        }

        if (state.isConnecting) {
            throw new Error('Connection already in progress');
        }

        state.isConnecting = true;
        emit('connecting');

        try {
            const ethereum = window.ethereum;
            
            // Request accounts
            const accounts = await ethereum.request({
                method: 'eth_requestAccounts'
            });

            if (!accounts || accounts.length === 0) {
                throw new Error('No accounts found');
            }

            // Get chain ID
            const chainId = await ethereum.request({
                method: 'eth_chainId'
            });

            // Create ethers provider if available
            if (window.ethers) {
                state.provider = new ethers.BrowserProvider(ethereum);
                state.signer = await state.provider.getSigner();
            }

            state.address = accounts[0];
            state.chainId = parseInt(chainId, 16);
            state.isConnected = true;

            // Setup listeners
            setupEventListeners(ethereum);

            emit('connected', {
                address: state.address,
                chainId: state.chainId
            });

            return {
                address: state.address,
                chainId: state.chainId,
                provider: state.provider,
                signer: state.signer
            };
        } catch (error) {
            emit('error', error);
            throw error;
        } finally {
            state.isConnecting = false;
        }
    }

    /**
     * Disconnect wallet
     */
    function disconnect() {
        state.provider = null;
        state.signer = null;
        state.address = null;
        state.chainId = null;
        state.isConnected = false;

        emit('disconnected');
    }

    /**
     * Switch chain
     */
    async function switchChain(chainId) {
        if (!window.ethereum) {
            throw new Error('No wallet found');
        }

        const chain = chains[chainId];
        if (!chain) {
            throw new Error('Unsupported chain');
        }

        try {
            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: chain.hex }]
            });
        } catch (error) {
            // Chain not added, try to add it
            if (error.code === 4902) {
                await addChain(chainId);
            } else {
                throw error;
            }
        }
    }

    /**
     * Add chain to wallet
     */
    async function addChain(chainId) {
        const chainConfigs = {
            8453: {
                chainId: '0x2105',
                chainName: 'Base',
                nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
                rpcUrls: ['https://mainnet.base.org'],
                blockExplorerUrls: ['https://basescan.org']
            },
            84532: {
                chainId: '0x14a34',
                chainName: 'Base Sepolia',
                nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
                rpcUrls: ['https://sepolia.base.org'],
                blockExplorerUrls: ['https://sepolia.basescan.org']
            }
        };

        const config = chainConfigs[chainId];
        if (!config) {
            throw new Error('Chain configuration not found');
        }

        await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [config]
        });
    }

    /**
     * Sign message
     */
    async function signMessage(message) {
        if (!state.signer) {
            throw new Error('Not connected');
        }
        return await state.signer.signMessage(message);
    }

    /**
     * Setup event listeners
     */
    function setupEventListeners(ethereum) {
        ethereum.on('accountsChanged', (accounts) => {
            if (accounts.length === 0) {
                disconnect();
            } else {
                state.address = accounts[0];
                emit('accountChanged', state.address);
            }
        });

        ethereum.on('chainChanged', (chainId) => {
            state.chainId = parseInt(chainId, 16);
            emit('chainChanged', state.chainId);
        });

        ethereum.on('disconnect', () => {
            disconnect();
        });
    }

    /**
     * Event emitter
     */
    function on(event, callback) {
        if (!state.listeners.has(event)) {
            state.listeners.set(event, []);
        }
        state.listeners.get(event).push(callback);
        
        return () => {
            const callbacks = state.listeners.get(event);
            const index = callbacks.indexOf(callback);
            if (index > -1) callbacks.splice(index, 1);
        };
    }

    function emit(event, data) {
        const callbacks = state.listeners.get(event) || [];
        callbacks.forEach(cb => cb(data));
    }

    /**
     * Create connect modal
     */
    function createConnectModal(options = {}) {
        injectStyles();

        const modal = document.createElement('div');
        modal.className = 'wallet-connect-modal';
        modal.innerHTML = `
            <div class="wallet-modal-content">
                <div class="wallet-modal-header">
                    <h3 class="wallet-modal-title">Connect Wallet</h3>
                    <button class="wallet-modal-close">×</button>
                </div>
                <div class="wallet-options"></div>
            </div>
        `;

        const optionsContainer = modal.querySelector('.wallet-options');
        const wallets = getAvailableWallets();

        if (wallets.length === 0) {
            optionsContainer.innerHTML = `
                <div style="text-align: center; padding: 20px; color: var(--text-secondary);">
                    <p>No wallet detected</p>
                    <a href="https://metamask.io" target="_blank" style="color: var(--primary);">
                        Install MetaMask →
                    </a>
                </div>
            `;
        } else {
            wallets.forEach(wallet => {
                const option = document.createElement('div');
                option.className = 'wallet-option';
                option.innerHTML = `
                    <div class="wallet-option-icon">${wallet.icon}</div>
                    <div class="wallet-option-info">
                        <div class="wallet-option-name">${wallet.name}</div>
                        <div class="wallet-option-desc">Connect using ${wallet.name}</div>
                    </div>
                    <span class="wallet-option-arrow">→</span>
                `;

                option.addEventListener('click', async () => {
                    option.classList.add('connecting');
                    try {
                        await connect(wallet.id);
                        closeModal();
                        if (options.onConnect) options.onConnect(state);
                    } catch (e) {
                        console.error('Connection failed:', e);
                        if (options.onError) options.onError(e);
                    } finally {
                        option.classList.remove('connecting');
                    }
                });

                optionsContainer.appendChild(option);
            });
        }

        // Close handlers
        modal.querySelector('.wallet-modal-close').addEventListener('click', closeModal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });

        function closeModal() {
            modal.classList.remove('open');
            setTimeout(() => modal.remove(), 300);
        }

        document.body.appendChild(modal);
        requestAnimationFrame(() => modal.classList.add('open'));

        return { modal, close: closeModal };
    }

    /**
     * Create connected wallet display
     */
    function createWalletDisplay(container, options = {}) {
        injectStyles();

        const el = typeof container === 'string' 
            ? document.querySelector(container) 
            : container;

        if (!el) return null;

        function render() {
            if (!state.isConnected) {
                el.innerHTML = `
                    <button class="wallet-connect-btn" id="connectWalletBtn">
                        💼 Connect Wallet
                    </button>
                `;
                el.querySelector('#connectWalletBtn').addEventListener('click', () => {
                    createConnectModal(options);
                });
            } else {
                const chain = chains[state.chainId];
                const shortAddress = `${state.address.slice(0, 6)}...${state.address.slice(-4)}`;
                
                el.innerHTML = `
                    <div class="wallet-connected">
                        <div class="wallet-avatar"></div>
                        <div class="wallet-info">
                            <div class="wallet-address">${shortAddress}</div>
                            <div class="wallet-chain">
                                <span class="wallet-chain-dot"></span>
                                ${chain?.name || `Chain ${state.chainId}`}
                            </div>
                        </div>
                        <button class="wallet-disconnect">Disconnect</button>
                    </div>
                `;
                
                el.querySelector('.wallet-disconnect').addEventListener('click', () => {
                    disconnect();
                    render();
                });
            }
        }

        // Listen for state changes
        on('connected', render);
        on('disconnected', render);
        on('accountChanged', render);
        on('chainChanged', render);

        render();

        return { el, render };
    }

    // Export API
    window.WalletConnect = {
        // State
        isWalletAvailable,
        getAvailableWallets,
        getState: () => ({ ...state }),
        isConnected: () => state.isConnected,
        getAddress: () => state.address,
        getChainId: () => state.chainId,
        getProvider: () => state.provider,
        getSigner: () => state.signer,

        // Actions
        connect,
        disconnect,
        switchChain,
        addChain,
        signMessage,

        // Events
        on,

        // UI
        createConnectModal,
        createWalletDisplay,

        // Chain info
        chains
    };

    console.log('💼 WalletConnect module initialized');
})();
