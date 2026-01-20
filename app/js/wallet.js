/**
 * Quest Mini App - Wallet Connection Manager
 * Handles wallet connections and provider management
 */

import { CHAIN_ID, CHAIN_NAME, CHAIN_RPC, CHAIN_EXPLORER, NATIVE_CURRENCY } from './constants.js';
import { toast } from './toast.js';
import { shortenAddress } from './utils.js';

class WalletManager {
    constructor() {
        this.provider = null;
        this.signer = null;
        this.address = null;
        this.chainId = null;
        this.listeners = new Map();
    }

    /**
     * Check if wallet is available
     * @returns {boolean}
     */
    isWalletAvailable() {
        return typeof window.ethereum !== 'undefined';
    }

    /**
     * Check if connected
     * @returns {boolean}
     */
    isConnected() {
        return this.address !== null;
    }

    /**
     * Connect wallet
     * @returns {Promise<string>} Connected address
     */
    async connect() {
        if (!this.isWalletAvailable()) {
            throw new Error('No wallet detected. Please install MetaMask or another Web3 wallet.');
        }

        try {
            // Request accounts
            const accounts = await window.ethereum.request({
                method: 'eth_requestAccounts'
            });

            if (!accounts || accounts.length === 0) {
                throw new Error('No accounts found');
            }

            this.address = accounts[0];
            this.chainId = await this.getChainId();

            // Setup provider (ethers v6)
            if (typeof ethers !== 'undefined') {
                this.provider = new ethers.BrowserProvider(window.ethereum);
                this.signer = await this.provider.getSigner();
            }

            // Setup listeners
            this.setupListeners();

            // Check network
            if (this.chainId !== CHAIN_ID) {
                await this.switchNetwork();
            }

            this.emit('connected', this.address);
            toast.success(`Connected: ${shortenAddress(this.address)}`);
            
            return this.address;
        } catch (error) {
            console.error('Connection failed:', error);
            throw error;
        }
    }

    /**
     * Disconnect wallet
     */
    disconnect() {
        this.provider = null;
        this.signer = null;
        this.address = null;
        this.chainId = null;
        this.removeListeners();
        this.emit('disconnected');
        toast.info('Wallet disconnected');
    }

    /**
     * Get current chain ID
     * @returns {Promise<number>}
     */
    async getChainId() {
        const chainIdHex = await window.ethereum.request({
            method: 'eth_chainId'
        });
        return parseInt(chainIdHex, 16);
    }

    /**
     * Switch to Base network
     * @returns {Promise<void>}
     */
    async switchNetwork() {
        try {
            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: `0x${CHAIN_ID.toString(16)}` }]
            });
        } catch (switchError) {
            // Chain not added, try to add it
            if (switchError.code === 4902) {
                await this.addNetwork();
            } else {
                throw switchError;
            }
        }
    }

    /**
     * Add Base network to wallet
     * @returns {Promise<void>}
     */
    async addNetwork() {
        await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
                chainId: `0x${CHAIN_ID.toString(16)}`,
                chainName: CHAIN_NAME,
                nativeCurrency: NATIVE_CURRENCY,
                rpcUrls: [CHAIN_RPC],
                blockExplorerUrls: [CHAIN_EXPLORER]
            }]
        });
    }

    /**
     * Get ETH balance
     * @returns {Promise<string>} Balance in wei
     */
    async getBalance() {
        if (!this.provider || !this.address) return '0';
        const balance = await this.provider.getBalance(this.address);
        return balance.toString();
    }

    /**
     * Sign a message
     * @param {string} message - Message to sign
     * @returns {Promise<string>} Signature
     */
    async signMessage(message) {
        if (!this.signer) throw new Error('Wallet not connected');
        return await this.signer.signMessage(message);
    }

    /**
     * Setup wallet event listeners
     */
    setupListeners() {
        if (!window.ethereum) return;

        window.ethereum.on('accountsChanged', this.handleAccountsChanged.bind(this));
        window.ethereum.on('chainChanged', this.handleChainChanged.bind(this));
        window.ethereum.on('disconnect', this.handleDisconnect.bind(this));
    }

    /**
     * Remove wallet event listeners
     */
    removeListeners() {
        if (!window.ethereum) return;

        window.ethereum.removeListener('accountsChanged', this.handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', this.handleChainChanged);
        window.ethereum.removeListener('disconnect', this.handleDisconnect);
    }

    /**
     * Handle account change
     * @param {string[]} accounts - New accounts
     */
    handleAccountsChanged(accounts) {
        if (accounts.length === 0) {
            this.disconnect();
        } else if (accounts[0] !== this.address) {
            this.address = accounts[0];
            this.emit('accountChanged', this.address);
            toast.info(`Account changed: ${shortenAddress(this.address)}`);
        }
    }

    /**
     * Handle chain change
     * @param {string} chainIdHex - New chain ID
     */
    handleChainChanged(chainIdHex) {
        const newChainId = parseInt(chainIdHex, 16);
        this.chainId = newChainId;
        this.emit('chainChanged', newChainId);
        
        if (newChainId !== CHAIN_ID) {
            toast.warning('Please switch to Base network');
        }
    }

    /**
     * Handle disconnect
     */
    handleDisconnect() {
        this.disconnect();
    }

    /**
     * Add event listener
     * @param {string} event - Event name
     * @param {Function} callback - Callback function
     */
    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(callback);
    }

    /**
     * Remove event listener
     * @param {string} event - Event name
     * @param {Function} callback - Callback function
     */
    off(event, callback) {
        if (!this.listeners.has(event)) return;
        const callbacks = this.listeners.get(event);
        const index = callbacks.indexOf(callback);
        if (index > -1) callbacks.splice(index, 1);
    }

    /**
     * Emit event
     * @param {string} event - Event name
     * @param {*} data - Event data
     */
    emit(event, data) {
        if (!this.listeners.has(event)) return;
        this.listeners.get(event).forEach(callback => callback(data));
    }
}

// Export singleton instance
export const wallet = new WalletManager();
export default wallet;
