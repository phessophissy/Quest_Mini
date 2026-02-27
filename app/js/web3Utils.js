/**
 * Web3 Utils - Ethereum/blockchain utility functions
 * Quest Mini - Farcaster Mini-App
 */

(function() {
    'use strict';

    // Chain configurations
    const chains = {
        1: {
            name: 'Ethereum Mainnet',
            shortName: 'ETH',
            chainId: 1,
            rpcUrl: 'https://eth.llamarpc.com',
            explorer: 'https://etherscan.io',
            currency: { name: 'Ether', symbol: 'ETH', decimals: 18 }
        },
        8453: {
            name: 'Base',
            shortName: 'Base',
            chainId: 8453,
            rpcUrl: 'https://mainnet.base.org',
            explorer: 'https://basescan.org',
            currency: { name: 'Ether', symbol: 'ETH', decimals: 18 }
        },
        84532: {
            name: 'Base Sepolia',
            shortName: 'Base Sepolia',
            chainId: 84532,
            rpcUrl: 'https://sepolia.base.org',
            explorer: 'https://sepolia.basescan.org',
            currency: { name: 'Ether', symbol: 'ETH', decimals: 18 }
        },
        10: {
            name: 'Optimism',
            shortName: 'OP',
            chainId: 10,
            rpcUrl: 'https://mainnet.optimism.io',
            explorer: 'https://optimistic.etherscan.io',
            currency: { name: 'Ether', symbol: 'ETH', decimals: 18 }
        },
        42161: {
            name: 'Arbitrum One',
            shortName: 'Arb',
            chainId: 42161,
            rpcUrl: 'https://arb1.arbitrum.io/rpc',
            explorer: 'https://arbiscan.io',
            currency: { name: 'Ether', symbol: 'ETH', decimals: 18 }
        }
    };

    /**
     * Validate Ethereum address
     */
    function isValidAddress(address) {
        if (!address || typeof address !== 'string') return false;
        return /^0x[a-fA-F0-9]{40}$/.test(address);
    }

    /**
     * Validate transaction hash
     */
    function isValidTxHash(hash) {
        if (!hash || typeof hash !== 'string') return false;
        return /^0x[a-fA-F0-9]{64}$/.test(hash);
    }

    /**
     * Truncate address for display
     */
    function truncateAddress(address, startChars = 6, endChars = 4) {
        if (!address) return '';
        if (address.length <= startChars + endChars) return address;
        return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
    }

    /**
     * Checksum an Ethereum address
     */
    function checksumAddress(address) {
        if (!isValidAddress(address)) return address;
        
        const addr = address.toLowerCase().replace('0x', '');
        
        // Use simple hash for demo - in production use keccak256
        let hash = '';
        for (let i = 0; i < addr.length; i++) {
            hash += addr.charCodeAt(i).toString(16);
        }
        
        let checksummed = '0x';
        for (let i = 0; i < 40; i++) {
            if (parseInt(hash[i], 16) >= 8) {
                checksummed += addr[i].toUpperCase();
            } else {
                checksummed += addr[i];
            }
        }
        
        return checksummed;
    }

    /**
     * Format wei to ether
     */
    function formatEther(wei, decimals = 4) {
        if (!wei) return '0';
        
        const weiStr = String(wei);
        const isNegative = weiStr.startsWith('-');
        const absWei = isNegative ? weiStr.slice(1) : weiStr;
        
        // Pad with zeros if needed
        const padded = absWei.padStart(19, '0');
        const intPart = padded.slice(0, -18) || '0';
        const decPart = padded.slice(-18);
        
        // Combine and format
        let result = `${intPart}.${decPart}`;
        
        // Round to decimals
        const num = parseFloat(result);
        result = num.toFixed(decimals);
        
        // Remove trailing zeros
        result = result.replace(/\.?0+$/, '');
        
        return isNegative ? `-${result}` : result;
    }

    /**
     * Parse ether to wei
     */
    function parseEther(ether) {
        if (!ether) return '0';
        
        const [intPart, decPart = ''] = String(ether).split('.');
        const paddedDec = decPart.padEnd(18, '0').slice(0, 18);
        const wei = intPart + paddedDec;
        
        // Remove leading zeros
        return wei.replace(/^0+/, '') || '0';
    }

    /**
     * Format units (generic token decimals)
     */
    function formatUnits(value, decimals = 18) {
        if (!value) return '0';
        
        const str = String(value);
        const isNegative = str.startsWith('-');
        const abs = isNegative ? str.slice(1) : str;
        
        const padded = abs.padStart(decimals + 1, '0');
        const intPart = padded.slice(0, -decimals) || '0';
        const decPart = padded.slice(-decimals);
        
        let result = `${intPart}.${decPart}`;
        result = parseFloat(result).toString();
        
        return isNegative ? `-${result}` : result;
    }

    /**
     * Parse units (generic token decimals)
     */
    function parseUnits(value, decimals = 18) {
        if (!value) return '0';
        
        const [intPart, decPart = ''] = String(value).split('.');
        const paddedDec = decPart.padEnd(decimals, '0').slice(0, decimals);
        const result = intPart + paddedDec;
        
        return result.replace(/^0+/, '') || '0';
    }

    /**
     * Get explorer URL for address
     */
    function getAddressExplorerUrl(address, chainId = 8453) {
        const chain = chains[chainId];
        if (!chain) return null;
        return `${chain.explorer}/address/${address}`;
    }

    /**
     * Get explorer URL for transaction
     */
    function getTxExplorerUrl(txHash, chainId = 8453) {
        const chain = chains[chainId];
        if (!chain) return null;
        return `${chain.explorer}/tx/${txHash}`;
    }

    /**
     * Get chain info
     */
    function getChainInfo(chainId) {
        return chains[chainId] || null;
    }

    /**
     * Get all supported chains
     */
    function getSupportedChains() {
        return Object.values(chains);
    }

    /**
     * Estimate gas price category
     */
    function categorizeGasPrice(gweiPrice) {
        if (gweiPrice < 10) return { category: 'low', color: '#10B981', label: 'Low' };
        if (gweiPrice < 30) return { category: 'medium', color: '#F59E0B', label: 'Medium' };
        if (gweiPrice < 100) return { category: 'high', color: '#F97316', label: 'High' };
        return { category: 'very-high', color: '#EF4444', label: 'Very High' };
    }

    /**
     * Calculate transaction fee
     */
    function calculateTxFee(gasLimit, gasPrice, ethPrice = null) {
        const feeWei = BigInt(gasLimit) * BigInt(gasPrice);
        const feeEth = formatEther(feeWei.toString(), 6);
        
        const result = {
            wei: feeWei.toString(),
            eth: feeEth,
            gwei: formatUnits(gasPrice, 9)
        };

        if (ethPrice) {
            result.usd = (parseFloat(feeEth) * ethPrice).toFixed(2);
        }

        return result;
    }

    /**
     * Encode function call data (simple version)
     */
    function encodeFunctionCall(functionSig, params = []) {
        // Get function selector (first 4 bytes of keccak256 hash)
        // This is a simplified version - use ethers for production
        const selector = functionSig
            .replace(/\s/g, '')
            .split('(')[0];
        
        // Simple encoding for demo
        let data = '0x' + selector.slice(0, 8);
        
        for (const param of params) {
            if (typeof param === 'string' && param.startsWith('0x')) {
                // Address or hex
                data += param.slice(2).padStart(64, '0');
            } else {
                // Number
                data += BigInt(param).toString(16).padStart(64, '0');
            }
        }
        
        return data;
    }

    /**
     * Generate random private key (for demo - not secure!)
     */
    function generateRandomKey() {
        const array = new Uint8Array(32);
        crypto.getRandomValues(array);
        return '0x' + Array.from(array)
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
    }

    /**
     * Calculate contract address (CREATE)
     */
    function calculateContractAddress(deployerAddress, nonce) {
        // Simplified - in production use proper RLP encoding and keccak256
        const combined = deployerAddress.toLowerCase() + nonce.toString(16).padStart(2, '0');
        const hash = combined.slice(0, 42);
        return '0x' + hash.slice(2);
    }

    /**
     * Check if address is a contract (basic heuristic)
     */
    async function isContract(address, rpcUrl) {
        try {
            const response = await fetch(rpcUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    jsonrpc: '2.0',
                    id: 1,
                    method: 'eth_getCode',
                    params: [address, 'latest']
                })
            });
            const data = await response.json();
            return data.result && data.result !== '0x';
        } catch {
            return false;
        }
    }

    /**
     * Wait for transaction confirmation
     */
    async function waitForTx(txHash, rpcUrl, confirmations = 1, timeout = 60000) {
        const startTime = Date.now();
        
        while (Date.now() - startTime < timeout) {
            try {
                const response = await fetch(rpcUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        jsonrpc: '2.0',
                        id: 1,
                        method: 'eth_getTransactionReceipt',
                        params: [txHash]
                    })
                });
                
                const data = await response.json();
                
                if (data.result) {
                    return {
                        success: data.result.status === '0x1',
                        receipt: data.result
                    };
                }
            } catch (e) {
                // Continue polling
            }
            
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
        
        throw new Error('Transaction confirmation timeout');
    }

    /**
     * Convert hex to number
     */
    function hexToNumber(hex) {
        if (!hex || hex === '0x') return 0;
        return parseInt(hex, 16);
    }

    /**
     * Convert number to hex
     */
    function numberToHex(num) {
        return '0x' + BigInt(num).toString(16);
    }

    // Export API
    window.Web3Utils = {
        // Validation
        isValidAddress,
        isValidTxHash,
        
        // Formatting
        truncateAddress,
        checksumAddress,
        formatEther,
        parseEther,
        formatUnits,
        parseUnits,
        
        // Chain info
        chains,
        getChainInfo,
        getSupportedChains,
        getAddressExplorerUrl,
        getTxExplorerUrl,
        
        // Gas
        categorizeGasPrice,
        calculateTxFee,
        
        // Encoding
        encodeFunctionCall,
        hexToNumber,
        numberToHex,
        
        // Misc
        generateRandomKey,
        calculateContractAddress,
        isContract,
        waitForTx
    };

    console.log('⛓️ Web3Utils module initialized');
})();
