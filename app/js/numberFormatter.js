/**
 * Number Formatter - Number formatting and parsing utilities
 * Quest Mini - Farcaster Mini-App
 */

(function() {
    'use strict';

    // Locale settings
    let currentLocale = navigator.language || 'en-US';

    /**
     * Format number with locale-aware separators
     */
    function format(value, options = {}) {
        const num = parseNumber(value);
        if (isNaN(num)) return value;

        const {
            decimals,
            minDecimals = 0,
            maxDecimals = decimals ?? 2,
            locale = currentLocale,
            style = 'decimal',
            notation,
            signDisplay
        } = options;

        const formatOptions = {
            style,
            minimumFractionDigits: minDecimals,
            maximumFractionDigits: maxDecimals
        };

        if (notation) formatOptions.notation = notation;
        if (signDisplay) formatOptions.signDisplay = signDisplay;

        return new Intl.NumberFormat(locale, formatOptions).format(num);
    }

    /**
     * Format as currency
     */
    function currency(value, currencyCode = 'USD', options = {}) {
        const num = parseNumber(value);
        if (isNaN(num)) return value;

        const {
            locale = currentLocale,
            decimals = 2,
            notation,
            compact = false
        } = options;

        const formatOptions = {
            style: 'currency',
            currency: currencyCode,
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        };

        if (compact || notation === 'compact') {
            formatOptions.notation = 'compact';
            formatOptions.maximumFractionDigits = 1;
        }

        return new Intl.NumberFormat(locale, formatOptions).format(num);
    }

    /**
     * Format as percentage
     */
    function percent(value, options = {}) {
        const num = parseNumber(value);
        if (isNaN(num)) return value;

        const {
            decimals = 1,
            locale = currentLocale,
            multiply = true // If true, 0.15 becomes 15%
        } = options;

        const displayValue = multiply ? num : num / 100;

        return new Intl.NumberFormat(locale, {
            style: 'percent',
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        }).format(displayValue);
    }

    /**
     * Format with compact notation (1.2K, 3.4M, etc.)
     */
    function compact(value, options = {}) {
        const num = parseNumber(value);
        if (isNaN(num)) return value;

        const {
            decimals = 1,
            locale = currentLocale
        } = options;

        return new Intl.NumberFormat(locale, {
            notation: 'compact',
            maximumFractionDigits: decimals
        }).format(num);
    }

    /**
     * Format bytes to human readable
     */
    function bytes(value, options = {}) {
        const num = parseNumber(value);
        if (isNaN(num) || num === 0) return '0 B';

        const {
            decimals = 2,
            binary = false // Use 1024 (binary) or 1000 (SI)
        } = options;

        const base = binary ? 1024 : 1000;
        const units = binary 
            ? ['B', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB']
            : ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];

        const exponent = Math.min(
            Math.floor(Math.log(Math.abs(num)) / Math.log(base)),
            units.length - 1
        );

        const result = num / Math.pow(base, exponent);

        return `${result.toFixed(decimals)} ${units[exponent]}`;
    }

    /**
     * Format crypto/token amounts
     */
    function crypto(value, options = {}) {
        const num = parseNumber(value);
        if (isNaN(num)) return value;

        const {
            symbol = '',
            decimals = 4,
            compact: useCompact = false,
            locale = currentLocale
        } = options;

        let formatted;

        if (useCompact && Math.abs(num) >= 1000) {
            formatted = new Intl.NumberFormat(locale, {
                notation: 'compact',
                maximumFractionDigits: 2
            }).format(num);
        } else if (Math.abs(num) < 0.0001 && num !== 0) {
            // Very small numbers - use scientific notation
            formatted = num.toExponential(2);
        } else if (Math.abs(num) < 1) {
            // Small numbers - show more decimals
            formatted = num.toFixed(Math.min(6, decimals + 2));
        } else {
            formatted = new Intl.NumberFormat(locale, {
                minimumFractionDigits: 0,
                maximumFractionDigits: decimals
            }).format(num);
        }

        return symbol ? `${formatted} ${symbol}` : formatted;
    }

    /**
     * Format Ethereum wei to ETH
     */
    function fromWei(value, options = {}) {
        const {
            decimals = 18,
            displayDecimals = 4
        } = options;

        const num = parseNumber(value);
        if (isNaN(num)) return value;

        const eth = num / Math.pow(10, decimals);
        return crypto(eth, { decimals: displayDecimals, ...options });
    }

    /**
     * Format to wei
     */
    function toWei(value, decimals = 18) {
        const num = parseNumber(value);
        if (isNaN(num)) return '0';

        const wei = num * Math.pow(10, decimals);
        return Math.floor(wei).toString();
    }

    /**
     * Format ordinal numbers (1st, 2nd, 3rd, etc.)
     */
    function ordinal(value, options = {}) {
        const num = Math.floor(parseNumber(value));
        if (isNaN(num)) return value;

        const { locale = currentLocale } = options;

        // Try using Intl.PluralRules if available
        try {
            const pr = new Intl.PluralRules(locale, { type: 'ordinal' });
            const suffixes = {
                one: 'st',
                two: 'nd',
                few: 'rd',
                other: 'th'
            };
            return `${num}${suffixes[pr.select(num)]}`;
        } catch {
            // Fallback
            const suffix = ['th', 'st', 'nd', 'rd'];
            const v = num % 100;
            return `${num}${suffix[(v - 20) % 10] || suffix[v] || suffix[0]}`;
        }
    }

    /**
     * Format with fixed significant digits
     */
    function significant(value, digits = 3) {
        const num = parseNumber(value);
        if (isNaN(num)) return value;

        return num.toPrecision(digits);
    }

    /**
     * Clamp number to range
     */
    function clamp(value, min, max) {
        const num = parseNumber(value);
        if (isNaN(num)) return min;
        return Math.min(Math.max(num, min), max);
    }

    /**
     * Round to nearest multiple
     */
    function roundTo(value, multiple = 1) {
        const num = parseNumber(value);
        if (isNaN(num)) return value;
        return Math.round(num / multiple) * multiple;
    }

    /**
     * Format range (e.g., "1-5", "10+")
     */
    function range(min, max, options = {}) {
        const { separator = '-', plusSign = '+' } = options;

        if (max === undefined || max === null || max === Infinity) {
            return `${format(min)}${plusSign}`;
        }

        if (min === max) {
            return format(min);
        }

        return `${format(min)}${separator}${format(max)}`;
    }

    /**
     * Parse number from various formats
     */
    function parseNumber(value) {
        if (typeof value === 'number') return value;
        if (value === null || value === undefined) return NaN;

        // Handle BigInt
        if (typeof value === 'bigint') return Number(value);

        const str = String(value).trim();

        // Remove currency symbols and spaces
        const cleaned = str
            .replace(/[^\d.,-]/g, '')
            .replace(/,/g, '');

        return parseFloat(cleaned);
    }

    /**
     * Check if value is numeric
     */
    function isNumeric(value) {
        return !isNaN(parseNumber(value));
    }

    /**
     * Format phone number
     */
    function phone(value, format = 'US') {
        const digits = String(value).replace(/\D/g, '');

        switch (format) {
            case 'US':
                if (digits.length === 10) {
                    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
                } else if (digits.length === 11 && digits[0] === '1') {
                    return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
                }
                break;
            case 'international':
                if (digits.length > 10) {
                    return `+${digits.slice(0, -10)} ${digits.slice(-10, -7)} ${digits.slice(-7, -4)} ${digits.slice(-4)}`;
                }
                break;
        }

        return value;
    }

    /**
     * Format credit card number
     */
    function creditCard(value) {
        const digits = String(value).replace(/\D/g, '');
        const groups = digits.match(/.{1,4}/g) || [];
        return groups.join(' ');
    }

    /**
     * Set locale
     */
    function setLocale(locale) {
        currentLocale = locale;
    }

    /**
     * Get locale
     */
    function getLocale() {
        return currentLocale;
    }

    /**
     * Abbreviate large numbers
     */
    function abbreviate(value, options = {}) {
        const num = parseNumber(value);
        if (isNaN(num)) return value;

        const {
            decimals = 1,
            thresholds = [
                { value: 1e12, suffix: 'T' },
                { value: 1e9, suffix: 'B' },
                { value: 1e6, suffix: 'M' },
                { value: 1e3, suffix: 'K' }
            ]
        } = options;

        for (const { value: threshold, suffix } of thresholds) {
            if (Math.abs(num) >= threshold) {
                return (num / threshold).toFixed(decimals) + suffix;
            }
        }

        return num.toString();
    }

    // Export API
    window.NumberFormatter = {
        format,
        currency,
        percent,
        compact,
        bytes,
        crypto,
        fromWei,
        toWei,
        ordinal,
        significant,
        clamp,
        roundTo,
        range,
        parse: parseNumber,
        isNumeric,
        phone,
        creditCard,
        abbreviate,
        setLocale,
        getLocale
    };

    console.log('🔢 NumberFormatter module initialized');
})();
