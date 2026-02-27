/**
 * Quest Mini - Gas Estimation Utility
 * Provides gas estimation and optimization for transactions
 */

import { CHAIN_ID } from './constants.js';

/**
 * Gas price tiers
 */
const GasTier = {
    SLOW: 'slow',
    STANDARD: 'standard',
    FAST: 'fast',
    INSTANT: 'instant'
};

/**
 * Gas Estimator Class
 */
class GasEstimator {
    constructor() {
        this.cache = new Map();
        this.cacheTimeout = 10000; // 10 seconds
        this.gasHistory = [];
        this.maxHistorySize = 100;
    }

    /**
     * Get current gas prices
     * @returns {Promise<Object>} Gas prices by tier
     */
    async getGasPrices() {
        const cacheKey = 'gasPrices';
        const cached = this.getFromCache(cacheKey);
        if (cached) return cached;

        try {
            // Try to get from provider
            if (window.ethereum) {
                const gasPriceHex = await window.ethereum.request({
                    method: 'eth_gasPrice'
                });
                const baseGasPrice = BigInt(gasPriceHex);

                const prices = {
                    [GasTier.SLOW]: this.formatGwei(baseGasPrice * 80n / 100n),
                    [GasTier.STANDARD]: this.formatGwei(baseGasPrice),
                    [GasTier.FAST]: this.formatGwei(baseGasPrice * 120n / 100n),
                    [GasTier.INSTANT]: this.formatGwei(baseGasPrice * 150n / 100n),
                    base: this.formatGwei(baseGasPrice),
                    timestamp: Date.now()
                };

                this.setCache(cacheKey, prices);
                this.recordGasPrice(prices.base);
                return prices;
            }

            // Fallback default prices for Base chain
            return this.getDefaultPrices();
        } catch (error) {
            console.error('[GasEstimator] Failed to get gas prices:', error);
            return this.getDefaultPrices();
        }
    }

    /**
     * Get default gas prices (fallback)
     */
    getDefaultPrices() {
        return {
            [GasTier.SLOW]: 0.001,
            [GasTier.STANDARD]: 0.005,
            [GasTier.FAST]: 0.01,
            [GasTier.INSTANT]: 0.02,
            base: 0.005,
            timestamp: Date.now(),
            isDefault: true
        };
    }

    /**
     * Estimate gas for a contract call
     * @param {Object} options - Estimation options
     * @returns {Promise<Object>} Gas estimation
     */
    async estimateGas(options) {
        const {
            contract,
            method,
            args = [],
            value = 0,
            from
        } = options;

        try {
            // Get gas estimate from contract
            const gasLimit = await contract[method].estimateGas(...args, {
                value,
                from
            });

            // Get current gas prices
            const prices = await this.getGasPrices();

            // Calculate costs for each tier
            const costs = {};
            for (const tier of Object.values(GasTier)) {
                const gasPrice = this.gweiToWei(prices[tier]);
                costs[tier] = {
                    gasLimit: gasLimit.toString(),
                    gasPrice: prices[tier],
                    gasPriceWei: gasPrice.toString(),
                    totalCost: this.formatEth(gasLimit * gasPrice),
                    totalCostWei: (gasLimit * gasPrice).toString()
                };
            }

            return {
                success: true,
                gasLimit: gasLimit.toString(),
                costs,
                recommended: costs[GasTier.STANDARD],
                timestamp: Date.now()
            };
        } catch (error) {
            console.error('[GasEstimator] Estimation failed:', error);
            return {
                success: false,
                error: this.parseEstimationError(error),
                timestamp: Date.now()
            };
        }
    }

    /**
     * Get optimal gas price based on urgency
     * @param {string} tier - Gas tier
     * @returns {Promise<BigInt>} Gas price in wei
     */
    async getOptimalGasPrice(tier = GasTier.STANDARD) {
        const prices = await this.getGasPrices();
        return this.gweiToWei(prices[tier]);
    }

    /**
     * Calculate transaction cost
     * @param {BigInt} gasLimit - Gas limit
     * @param {string} tier - Gas tier
     * @returns {Promise<Object>} Cost breakdown
     */
    async calculateCost(gasLimit, tier = GasTier.STANDARD) {
        const prices = await this.getGasPrices();
        const gasPrice = this.gweiToWei(prices[tier]);
        const totalCost = BigInt(gasLimit) * gasPrice;

        return {
            gasLimit: gasLimit.toString(),
            gasPrice: prices[tier],
            gasPriceWei: gasPrice.toString(),
            totalCostEth: this.formatEth(totalCost),
            totalCostWei: totalCost.toString(),
            tier
        };
    }

    /**
     * Get estimated wait times for each tier
     * @returns {Object} Wait times by tier
     */
    getEstimatedWaitTimes() {
        // Base chain is fast, so wait times are short
        if (CHAIN_ID === 8453 || CHAIN_ID === 84532) {
            return {
                [GasTier.SLOW]: '~30 seconds',
                [GasTier.STANDARD]: '~15 seconds',
                [GasTier.FAST]: '~5 seconds',
                [GasTier.INSTANT]: '~2 seconds'
            };
        }

        // Default Ethereum-like wait times
        return {
            [GasTier.SLOW]: '~5 minutes',
            [GasTier.STANDARD]: '~2 minutes',
            [GasTier.FAST]: '~30 seconds',
            [GasTier.INSTANT]: '~15 seconds'
        };
    }

    /**
     * Get gas price trend
     * @returns {Object} Trend analysis
     */
    getGasTrend() {
        if (this.gasHistory.length < 2) {
            return { trend: 'stable', change: 0 };
        }

        const recent = this.gasHistory.slice(-10);
        const avg = recent.reduce((a, b) => a + b, 0) / recent.length;
        const latest = recent[recent.length - 1];
        const change = ((latest - avg) / avg) * 100;

        let trend = 'stable';
        if (change > 10) trend = 'rising';
        else if (change < -10) trend = 'falling';

        return {
            trend,
            change: change.toFixed(2),
            average: avg.toFixed(4),
            latest: latest.toFixed(4)
        };
    }

    /**
     * Record gas price for history
     * @param {number} price - Gas price in gwei
     */
    recordGasPrice(price) {
        this.gasHistory.push(price);
        if (this.gasHistory.length > this.maxHistorySize) {
            this.gasHistory.shift();
        }
    }

    /**
     * Parse estimation error
     * @param {Error} error - Error object
     * @returns {string} User-friendly message
     */
    parseEstimationError(error) {
        const message = error.message || error.toString();

        if (message.includes('insufficient funds')) {
            return 'Insufficient funds for gas';
        }
        if (message.includes('execution reverted')) {
            return 'Transaction would fail';
        }
        if (message.includes('gas required exceeds allowance')) {
            return 'Gas limit too low';
        }
        return 'Failed to estimate gas';
    }

    /**
     * Format gwei value
     * @param {BigInt} wei - Value in wei
     * @returns {number} Value in gwei
     */
    formatGwei(wei) {
        return Number(wei) / 1e9;
    }

    /**
     * Convert gwei to wei
     * @param {number} gwei - Value in gwei
     * @returns {BigInt} Value in wei
     */
    gweiToWei(gwei) {
        return BigInt(Math.floor(gwei * 1e9));
    }

    /**
     * Format eth value
     * @param {BigInt} wei - Value in wei
     * @returns {string} Formatted ETH value
     */
    formatEth(wei) {
        return (Number(wei) / 1e18).toFixed(6);
    }

    /**
     * Cache utilities
     */
    getFromCache(key) {
        const cached = this.cache.get(key);
        if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
            return cached.data;
        }
        return null;
    }

    setCache(key, data) {
        this.cache.set(key, { data, timestamp: Date.now() });
    }

    clearCache() {
        this.cache.clear();
    }
}

// Export singleton instance
export const gasEstimator = new GasEstimator();
export { GasEstimator, GasTier };
