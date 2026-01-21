/**
 * Quest Mini - Format Utilities
 * Number, date, and string formatting
 */

const QuestFormat = (function() {
  'use strict';

  /**
   * Format token amount from wei to readable
   * @param {string|bigint} amount - Amount in wei
   * @param {number} [decimals=18] - Token decimals
   * @param {number} [displayDecimals=2] - Display decimals
   * @returns {string}
   */
  function formatTokenAmount(amount, decimals = 18, displayDecimals = 2) {
    try {
      const wei = BigInt(amount);
      const divisor = BigInt(10 ** decimals);
      const whole = wei / divisor;
      const fraction = wei % divisor;
      
      const fractionStr = fraction.toString().padStart(decimals, '0');
      const displayFraction = fractionStr.slice(0, displayDecimals);
      
      const wholeFormatted = formatNumber(Number(whole));
      
      if (displayDecimals === 0 || displayFraction === '0'.repeat(displayDecimals)) {
        return wholeFormatted;
      }
      
      return `${wholeFormatted}.${displayFraction}`;
    } catch {
      return '0';
    }
  }

  /**
   * Format number with commas
   * @param {number} num - Number to format
   * @returns {string}
   */
  function formatNumber(num) {
    return new Intl.NumberFormat('en-US').format(num);
  }

  /**
   * Format number in compact form (1K, 1M, etc.)
   * @param {number} num - Number to format
   * @returns {string}
   */
  function formatCompact(num) {
    return new Intl.NumberFormat('en-US', { 
      notation: 'compact',
      maximumFractionDigits: 1
    }).format(num);
  }

  /**
   * Format percentage
   * @param {number} value - Value (e.g., 0.25 for 25%)
   * @param {number} [decimals=0] - Decimal places
   * @returns {string}
   */
  function formatPercent(value, decimals = 0) {
    return new Intl.NumberFormat('en-US', {
      style: 'percent',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(value);
  }

  /**
   * Shorten Ethereum address
   * @param {string} address - Full address
   * @param {number} [chars=4] - Characters to show at each end
   * @returns {string}
   */
  function shortenAddress(address, chars = 4) {
    if (!address) return '';
    if (address.length < chars * 2 + 2) return address;
    return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
  }

  /**
   * Shorten transaction hash
   * @param {string} hash - Full hash
   * @returns {string}
   */
  function shortenTxHash(hash) {
    return shortenAddress(hash, 6);
  }

  /**
   * Format relative time
   * @param {Date|number} date - Date or timestamp
   * @returns {string}
   */
  function formatRelativeTime(date) {
    const now = Date.now();
    const timestamp = date instanceof Date ? date.getTime() : date;
    const diff = now - timestamp;
    
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (seconds < 60) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    
    return formatDate(new Date(timestamp));
  }

  /**
   * Format date
   * @param {Date} date - Date to format
   * @returns {string}
   */
  function formatDate(date) {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  }

  /**
   * Format date and time
   * @param {Date} date - Date to format
   * @returns {string}
   */
  function formatDateTime(date) {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    }).format(date);
  }

  /**
   * Format duration in seconds to readable
   * @param {number} seconds - Duration in seconds
   * @returns {string}
   */
  function formatDuration(seconds) {
    if (seconds < 60) return `${seconds}s`;
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    if (minutes > 0) {
      return secs > 0 ? `${minutes}m ${secs}s` : `${minutes}m`;
    }
    return `${secs}s`;
  }

  /**
   * Format countdown timer
   * @param {number} endTime - End timestamp
   * @returns {string}
   */
  function formatCountdown(endTime) {
    const now = Date.now();
    const diff = endTime - now;
    
    if (diff <= 0) return 'Ready!';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    if (hours > 0) {
      return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }
    return `${minutes}:${String(seconds).padStart(2, '0')}`;
  }

  /**
   * Format quest type to readable name
   * @param {number} questType - Quest type (0-4)
   * @returns {string}
   */
  function formatQuestType(questType) {
    const types = ['Login', 'Social', 'Trade', 'Referral', 'Special'];
    return types[questType] || 'Unknown';
  }

  /**
   * Format booster tier to readable name
   * @param {number} tier - Booster tier (0-5)
   * @returns {string}
   */
  function formatBoosterTier(tier) {
    const tiers = ['None', 'Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond'];
    return tiers[tier] || 'Unknown';
  }

  /**
   * Format multiplier percentage
   * @param {number} multiplier - Multiplier (e.g., 150 for 1.5x)
   * @returns {string}
   */
  function formatMultiplier(multiplier) {
    return `${(multiplier / 100).toFixed(1)}x`;
  }

  /**
   * Format streak with emoji
   * @param {number} streak - Current streak
   * @returns {string}
   */
  function formatStreak(streak) {
    if (streak === 0) return '0 🔥';
    if (streak >= 30) return `${streak} 🔥💎`;
    if (streak >= 14) return `${streak} 🔥🌟`;
    if (streak >= 7) return `${streak} 🔥⭐`;
    return `${streak} 🔥`;
  }

  /**
   * Format gas price to Gwei
   * @param {string|bigint} gasPrice - Gas price in wei
   * @returns {string}
   */
  function formatGasPrice(gasPrice) {
    try {
      const wei = BigInt(gasPrice);
      const gwei = Number(wei) / 1e9;
      return `${gwei.toFixed(2)} Gwei`;
    } catch {
      return '-- Gwei';
    }
  }

  /**
   * Format ETH amount
   * @param {string|bigint} amount - Amount in wei
   * @returns {string}
   */
  function formatEth(amount) {
    return formatTokenAmount(amount, 18, 6) + ' ETH';
  }

  // Public API
  return {
    // Token/Number formatting
    formatTokenAmount,
    formatNumber,
    formatCompact,
    formatPercent,
    formatEth,
    formatGasPrice,

    // Address formatting
    shortenAddress,
    shortenTxHash,

    // Time formatting
    formatRelativeTime,
    formatDate,
    formatDateTime,
    formatDuration,
    formatCountdown,

    // Quest-specific formatting
    formatQuestType,
    formatBoosterTier,
    formatMultiplier,
    formatStreak
  };
})();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = QuestFormat;
}
