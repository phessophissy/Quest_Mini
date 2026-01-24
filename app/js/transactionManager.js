/**
 * Quest Mini - Transaction Manager
 * Handles transaction lifecycle, retries, and status tracking
 */

import { toast } from './toast.js';
import { CHAIN_EXPLORER } from './constants.js';

/**
 * Transaction status enum
 */
const TxStatus = {
    PENDING: 'pending',
    SUBMITTED: 'submitted',
    CONFIRMING: 'confirming',
    CONFIRMED: 'confirmed',
    FAILED: 'failed',
    REJECTED: 'rejected',
    REPLACED: 'replaced'
};

/**
 * Transaction Manager Class
 */
class TransactionManager {
    constructor() {
        this.transactions = new Map();
        this.listeners = new Map();
        this.pendingQueue = [];
        this.isProcessing = false;
        this.config = {
            confirmations: 1,
            timeout: 120000, // 2 minutes
            retryAttempts: 3,
            retryDelay: 5000,
            gasPriceMultiplier: 1.1
        };
    }

    /**
     * Submit a transaction with automatic tracking
     * @param {Object} options - Transaction options
     * @returns {Promise<Object>} Transaction result
     */
    async submit(options) {
        const {
            contract,
            method,
            args = [],
            value = 0,
            description = 'Transaction',
            onSubmit,
            onConfirm,
            onError
        } = options;

        const txId = this.generateTxId();
        
        // Create transaction record
        const txRecord = {
            id: txId,
            description,
            status: TxStatus.PENDING,
            hash: null,
            contract: contract.target || contract.address,
            method,
            args,
            value,
            createdAt: Date.now(),
            submittedAt: null,
            confirmedAt: null,
            error: null,
            receipt: null,
            attempts: 0
        };

        this.transactions.set(txId, txRecord);
        this.emit('txCreated', txRecord);

        try {
            // Execute transaction with retry logic
            const result = await this.executeWithRetry(async () => {
                txRecord.attempts++;
                txRecord.status = TxStatus.PENDING;
                this.emit('txUpdated', txRecord);

                // Send transaction
                const tx = await contract[method](...args, { value });
                
                txRecord.hash = tx.hash;
                txRecord.status = TxStatus.SUBMITTED;
                txRecord.submittedAt = Date.now();
                this.emit('txSubmitted', txRecord);

                // Show toast notification
                toast.transaction(tx.hash, `${description} submitted...`);
                
                // Call onSubmit callback
                if (onSubmit) {
                    onSubmit(tx);
                }

                // Wait for confirmation
                txRecord.status = TxStatus.CONFIRMING;
                this.emit('txUpdated', txRecord);

                const receipt = await this.waitForConfirmation(tx);
                
                return { tx, receipt };
            });

            // Update record on success
            txRecord.status = TxStatus.CONFIRMED;
            txRecord.confirmedAt = Date.now();
            txRecord.receipt = result.receipt;
            this.emit('txConfirmed', txRecord);

            toast.success(`${description} confirmed!`, {
                txHash: txRecord.hash
            });

            if (onConfirm) {
                onConfirm(result.receipt);
            }

            return {
                success: true,
                txId,
                hash: txRecord.hash,
                receipt: result.receipt
            };

        } catch (error) {
            // Handle failure
            txRecord.status = this.categorizeError(error);
            txRecord.error = error.message;
            this.emit('txFailed', txRecord);

            toast.error(`${description} failed: ${this.getUserFriendlyError(error)}`);

            if (onError) {
                onError(error);
            }

            return {
                success: false,
                txId,
                error: error.message
            };
        }
    }

    /**
     * Execute with retry logic
     * @param {Function} fn - Function to execute
     * @returns {Promise<*>} Result
     */
    async executeWithRetry(fn) {
        let lastError;
        
        for (let i = 0; i < this.config.retryAttempts; i++) {
            try {
                return await fn();
            } catch (error) {
                lastError = error;
                
                // Don't retry user rejections or permanent failures
                if (this.isPermanentError(error)) {
                    throw error;
                }

                // Wait before retry
                if (i < this.config.retryAttempts - 1) {
                    await this.sleep(this.config.retryDelay * (i + 1));
                }
            }
        }

        throw lastError;
    }

    /**
     * Wait for transaction confirmation
     * @param {Object} tx - Transaction object
     * @returns {Promise<Object>} Receipt
     */
    async waitForConfirmation(tx) {
        const startTime = Date.now();

        return new Promise((resolve, reject) => {
            const checkConfirmation = async () => {
                try {
                    const receipt = await tx.wait(this.config.confirmations);
                    
                    if (receipt.status === 0) {
                        reject(new Error('Transaction reverted'));
                        return;
                    }
                    
                    resolve(receipt);
                } catch (error) {
                    if (Date.now() - startTime > this.config.timeout) {
                        reject(new Error('Transaction confirmation timeout'));
                        return;
                    }
                    
                    // Check if replaced
                    if (error.code === 'TRANSACTION_REPLACED') {
                        if (error.replacement) {
                            resolve(await error.replacement.wait());
                            return;
                        }
                        reject(error);
                        return;
                    }
                    
                    reject(error);
                }
            };

            checkConfirmation();
        });
    }

    /**
     * Check if error is permanent (no retry)
     * @param {Error} error - Error object
     * @returns {boolean}
     */
    isPermanentError(error) {
        const permanentCodes = [
            4001,  // User rejected
            -32000, // Execution reverted
            'UNPREDICTABLE_GAS_LIMIT',
            'INSUFFICIENT_FUNDS'
        ];

        return permanentCodes.includes(error.code) || 
               permanentCodes.includes(error.reason);
    }

    /**
     * Categorize error into status
     * @param {Error} error - Error object
     * @returns {string} Status
     */
    categorizeError(error) {
        if (error.code === 4001 || error.code === 'ACTION_REJECTED') {
            return TxStatus.REJECTED;
        }
        if (error.code === 'TRANSACTION_REPLACED') {
            return TxStatus.REPLACED;
        }
        return TxStatus.FAILED;
    }

    /**
     * Get user-friendly error message
     * @param {Error} error - Error object
     * @returns {string}
     */
    getUserFriendlyError(error) {
        const errorMessages = {
            4001: 'Transaction was rejected',
            'ACTION_REJECTED': 'Transaction was rejected',
            'INSUFFICIENT_FUNDS': 'Insufficient funds for gas',
            'UNPREDICTABLE_GAS_LIMIT': 'Transaction will fail',
            'CALL_EXCEPTION': 'Contract execution failed'
        };

        return errorMessages[error.code] || 
               errorMessages[error.reason] || 
               error.shortMessage ||
               'Transaction failed';
    }

    /**
     * Get transaction by ID
     * @param {string} txId - Transaction ID
     * @returns {Object|null}
     */
    getTransaction(txId) {
        return this.transactions.get(txId) || null;
    }

    /**
     * Get all transactions
     * @param {Object} filter - Filter options
     * @returns {Array}
     */
    getAllTransactions(filter = {}) {
        let txs = Array.from(this.transactions.values());

        if (filter.status) {
            txs = txs.filter(tx => tx.status === filter.status);
        }

        if (filter.since) {
            txs = txs.filter(tx => tx.createdAt >= filter.since);
        }

        return txs.sort((a, b) => b.createdAt - a.createdAt);
    }

    /**
     * Get pending transactions
     * @returns {Array}
     */
    getPendingTransactions() {
        return this.getAllTransactions({ 
            status: TxStatus.PENDING 
        }).concat(this.getAllTransactions({ 
            status: TxStatus.SUBMITTED 
        })).concat(this.getAllTransactions({ 
            status: TxStatus.CONFIRMING 
        }));
    }

    /**
     * Get explorer URL for transaction
     * @param {string} hash - Transaction hash
     * @returns {string}
     */
    getExplorerUrl(hash) {
        return `${CHAIN_EXPLORER}/tx/${hash}`;
    }

    /**
     * Subscribe to transaction events
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
     */
    off(event, callback) {
        if (this.listeners.has(event)) {
            this.listeners.get(event).delete(callback);
        }
    }

    /**
     * Emit event
     */
    emit(event, data) {
        if (this.listeners.has(event)) {
            this.listeners.get(event).forEach(cb => {
                try {
                    cb(data);
                } catch (e) {
                    console.error('[TxManager] Event handler error:', e);
                }
            });
        }
    }

    /**
     * Generate unique transaction ID
     */
    generateTxId() {
        return `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Sleep utility
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Clear old transactions (keep last N)
     * @param {number} keep - Number to keep
     */
    cleanup(keep = 50) {
        const txs = this.getAllTransactions();
        if (txs.length <= keep) return;

        const toRemove = txs.slice(keep);
        toRemove.forEach(tx => {
            this.transactions.delete(tx.id);
        });
    }
}

// Export singleton instance
export const txManager = new TransactionManager();
export { TransactionManager, TxStatus };
