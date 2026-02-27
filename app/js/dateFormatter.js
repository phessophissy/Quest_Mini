/**
 * Date Formatter - Comprehensive date/time formatting utilities
 * Quest Mini - Farcaster Mini-App
 */

(function() {
    'use strict';

    // Locale settings
    let currentLocale = navigator.language || 'en-US';

    /**
     * Format date relative to now (e.g., "2 hours ago", "in 3 days")
     */
    function relative(date, options = {}) {
        const now = new Date();
        const target = toDate(date);
        const diffMs = target - now;
        const diffSec = Math.round(diffMs / 1000);
        const diffMin = Math.round(diffSec / 60);
        const diffHour = Math.round(diffMin / 60);
        const diffDay = Math.round(diffHour / 24);
        const diffWeek = Math.round(diffDay / 7);
        const diffMonth = Math.round(diffDay / 30);
        const diffYear = Math.round(diffDay / 365);

        const rtf = new Intl.RelativeTimeFormat(currentLocale, {
            numeric: options.numeric || 'auto',
            style: options.style || 'long'
        });

        if (Math.abs(diffSec) < 60) {
            return rtf.format(diffSec, 'second');
        } else if (Math.abs(diffMin) < 60) {
            return rtf.format(diffMin, 'minute');
        } else if (Math.abs(diffHour) < 24) {
            return rtf.format(diffHour, 'hour');
        } else if (Math.abs(diffDay) < 7) {
            return rtf.format(diffDay, 'day');
        } else if (Math.abs(diffWeek) < 4) {
            return rtf.format(diffWeek, 'week');
        } else if (Math.abs(diffMonth) < 12) {
            return rtf.format(diffMonth, 'month');
        } else {
            return rtf.format(diffYear, 'year');
        }
    }

    /**
     * Format date in short relative style (e.g., "2h", "3d", "1w")
     */
    function relativeShort(date) {
        const now = new Date();
        const target = toDate(date);
        const diffMs = Math.abs(target - now);
        const diffSec = Math.floor(diffMs / 1000);
        const diffMin = Math.floor(diffSec / 60);
        const diffHour = Math.floor(diffMin / 60);
        const diffDay = Math.floor(diffHour / 24);
        const diffWeek = Math.floor(diffDay / 7);
        const diffMonth = Math.floor(diffDay / 30);
        const diffYear = Math.floor(diffDay / 365);

        const past = target < now;
        const suffix = past ? ' ago' : '';

        if (diffSec < 60) {
            return `${diffSec}s${suffix}`;
        } else if (diffMin < 60) {
            return `${diffMin}m${suffix}`;
        } else if (diffHour < 24) {
            return `${diffHour}h${suffix}`;
        } else if (diffDay < 7) {
            return `${diffDay}d${suffix}`;
        } else if (diffWeek < 4) {
            return `${diffWeek}w${suffix}`;
        } else if (diffMonth < 12) {
            return `${diffMonth}mo${suffix}`;
        } else {
            return `${diffYear}y${suffix}`;
        }
    }

    /**
     * Format date with predefined formats
     */
    function format(date, formatType = 'medium') {
        const target = toDate(date);

        const formats = {
            // Date only
            short: { dateStyle: 'short' },
            medium: { dateStyle: 'medium' },
            long: { dateStyle: 'long' },
            full: { dateStyle: 'full' },
            
            // Time only
            time: { timeStyle: 'short' },
            timeLong: { timeStyle: 'medium' },
            
            // Date and time
            datetime: { dateStyle: 'medium', timeStyle: 'short' },
            datetimeLong: { dateStyle: 'long', timeStyle: 'medium' },
            
            // ISO formats
            iso: null, // Special case
            isoDate: null,
            isoTime: null
        };

        if (formatType === 'iso') {
            return target.toISOString();
        } else if (formatType === 'isoDate') {
            return target.toISOString().split('T')[0];
        } else if (formatType === 'isoTime') {
            return target.toISOString().split('T')[1].split('.')[0];
        }

        const options = formats[formatType] || formats.medium;
        return new Intl.DateTimeFormat(currentLocale, options).format(target);
    }

    /**
     * Custom format with pattern (basic)
     */
    function formatPattern(date, pattern) {
        const target = toDate(date);
        
        const tokens = {
            'YYYY': target.getFullYear(),
            'YY': String(target.getFullYear()).slice(-2),
            'MM': String(target.getMonth() + 1).padStart(2, '0'),
            'M': target.getMonth() + 1,
            'DD': String(target.getDate()).padStart(2, '0'),
            'D': target.getDate(),
            'HH': String(target.getHours()).padStart(2, '0'),
            'H': target.getHours(),
            'hh': String(target.getHours() % 12 || 12).padStart(2, '0'),
            'h': target.getHours() % 12 || 12,
            'mm': String(target.getMinutes()).padStart(2, '0'),
            'm': target.getMinutes(),
            'ss': String(target.getSeconds()).padStart(2, '0'),
            's': target.getSeconds(),
            'A': target.getHours() >= 12 ? 'PM' : 'AM',
            'a': target.getHours() >= 12 ? 'pm' : 'am',
            'ddd': target.toLocaleDateString(currentLocale, { weekday: 'short' }),
            'dddd': target.toLocaleDateString(currentLocale, { weekday: 'long' }),
            'MMM': target.toLocaleDateString(currentLocale, { month: 'short' }),
            'MMMM': target.toLocaleDateString(currentLocale, { month: 'long' })
        };

        let result = pattern;
        // Sort by length descending to replace longer tokens first
        const sortedTokens = Object.keys(tokens).sort((a, b) => b.length - a.length);
        
        for (const token of sortedTokens) {
            result = result.replace(new RegExp(token, 'g'), tokens[token]);
        }

        return result;
    }

    /**
     * Format time duration in human-readable form
     */
    function duration(ms, options = {}) {
        const {
            units = ['d', 'h', 'm', 's'],
            maxUnits = 2,
            separator = ' ',
            verbose = false
        } = options;

        const unitDefs = {
            d: { ms: 86400000, short: 'd', long: 'day' },
            h: { ms: 3600000, short: 'h', long: 'hour' },
            m: { ms: 60000, short: 'm', long: 'minute' },
            s: { ms: 1000, short: 's', long: 'second' },
            ms: { ms: 1, short: 'ms', long: 'millisecond' }
        };

        let remaining = Math.abs(ms);
        const parts = [];

        for (const unit of units) {
            if (parts.length >= maxUnits) break;
            
            const def = unitDefs[unit];
            if (!def) continue;

            const value = Math.floor(remaining / def.ms);
            if (value > 0 || (parts.length === 0 && unit === units[units.length - 1])) {
                remaining -= value * def.ms;
                
                if (verbose) {
                    parts.push(`${value} ${def.long}${value !== 1 ? 's' : ''}`);
                } else {
                    parts.push(`${value}${def.short}`);
                }
            }
        }

        return parts.join(separator) || '0' + (verbose ? ' seconds' : 's');
    }

    /**
     * Format countdown timer display
     */
    function countdown(targetDate, options = {}) {
        const target = toDate(targetDate);
        const now = new Date();
        const diffMs = target - now;

        if (diffMs <= 0) {
            return options.expiredText || '00:00:00';
        }

        const hours = Math.floor(diffMs / 3600000);
        const minutes = Math.floor((diffMs % 3600000) / 60000);
        const seconds = Math.floor((diffMs % 60000) / 1000);

        if (options.verbose) {
            const parts = [];
            if (hours > 0) parts.push(`${hours}h`);
            if (minutes > 0 || hours > 0) parts.push(`${minutes}m`);
            parts.push(`${seconds}s`);
            return parts.join(' ');
        }

        return [
            String(hours).padStart(2, '0'),
            String(minutes).padStart(2, '0'),
            String(seconds).padStart(2, '0')
        ].join(':');
    }

    /**
     * Get calendar day info
     */
    function calendar(date) {
        const target = toDate(date);
        const now = new Date();
        
        const isToday = isSameDay(target, now);
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        const isYesterday = isSameDay(target, yesterday);
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const isTomorrow = isSameDay(target, tomorrow);

        if (isToday) {
            return 'Today';
        } else if (isYesterday) {
            return 'Yesterday';
        } else if (isTomorrow) {
            return 'Tomorrow';
        } else {
            // Check if within this week
            const startOfWeek = new Date(now);
            startOfWeek.setDate(now.getDate() - now.getDay());
            startOfWeek.setHours(0, 0, 0, 0);
            
            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(endOfWeek.getDate() + 6);
            endOfWeek.setHours(23, 59, 59, 999);

            if (target >= startOfWeek && target <= endOfWeek) {
                return target.toLocaleDateString(currentLocale, { weekday: 'long' });
            }

            return format(target, 'medium');
        }
    }

    /**
     * Check if two dates are the same day
     */
    function isSameDay(date1, date2) {
        const d1 = toDate(date1);
        const d2 = toDate(date2);
        return d1.getFullYear() === d2.getFullYear() &&
               d1.getMonth() === d2.getMonth() &&
               d1.getDate() === d2.getDate();
    }

    /**
     * Get start of day/week/month/year
     */
    function startOf(date, unit) {
        const target = toDate(date);
        const result = new Date(target);

        switch (unit) {
            case 'day':
                result.setHours(0, 0, 0, 0);
                break;
            case 'week':
                result.setDate(result.getDate() - result.getDay());
                result.setHours(0, 0, 0, 0);
                break;
            case 'month':
                result.setDate(1);
                result.setHours(0, 0, 0, 0);
                break;
            case 'year':
                result.setMonth(0, 1);
                result.setHours(0, 0, 0, 0);
                break;
        }

        return result;
    }

    /**
     * Get end of day/week/month/year
     */
    function endOf(date, unit) {
        const target = toDate(date);
        const result = new Date(target);

        switch (unit) {
            case 'day':
                result.setHours(23, 59, 59, 999);
                break;
            case 'week':
                result.setDate(result.getDate() + (6 - result.getDay()));
                result.setHours(23, 59, 59, 999);
                break;
            case 'month':
                result.setMonth(result.getMonth() + 1, 0);
                result.setHours(23, 59, 59, 999);
                break;
            case 'year':
                result.setMonth(11, 31);
                result.setHours(23, 59, 59, 999);
                break;
        }

        return result;
    }

    /**
     * Add time to date
     */
    function add(date, amount, unit) {
        const target = toDate(date);
        const result = new Date(target);

        switch (unit) {
            case 'seconds':
            case 'second':
                result.setSeconds(result.getSeconds() + amount);
                break;
            case 'minutes':
            case 'minute':
                result.setMinutes(result.getMinutes() + amount);
                break;
            case 'hours':
            case 'hour':
                result.setHours(result.getHours() + amount);
                break;
            case 'days':
            case 'day':
                result.setDate(result.getDate() + amount);
                break;
            case 'weeks':
            case 'week':
                result.setDate(result.getDate() + (amount * 7));
                break;
            case 'months':
            case 'month':
                result.setMonth(result.getMonth() + amount);
                break;
            case 'years':
            case 'year':
                result.setFullYear(result.getFullYear() + amount);
                break;
        }

        return result;
    }

    /**
     * Subtract time from date
     */
    function subtract(date, amount, unit) {
        return add(date, -amount, unit);
    }

    /**
     * Get difference between two dates
     */
    function diff(date1, date2, unit = 'days') {
        const d1 = toDate(date1);
        const d2 = toDate(date2);
        const diffMs = d1 - d2;

        switch (unit) {
            case 'seconds':
            case 'second':
                return Math.floor(diffMs / 1000);
            case 'minutes':
            case 'minute':
                return Math.floor(diffMs / 60000);
            case 'hours':
            case 'hour':
                return Math.floor(diffMs / 3600000);
            case 'days':
            case 'day':
                return Math.floor(diffMs / 86400000);
            case 'weeks':
            case 'week':
                return Math.floor(diffMs / 604800000);
            case 'months':
            case 'month':
                return (d1.getFullYear() - d2.getFullYear()) * 12 + (d1.getMonth() - d2.getMonth());
            case 'years':
            case 'year':
                return d1.getFullYear() - d2.getFullYear();
            default:
                return diffMs;
        }
    }

    /**
     * Parse various date formats to Date object
     */
    function toDate(input) {
        if (input instanceof Date) {
            return input;
        }
        if (typeof input === 'number') {
            return new Date(input);
        }
        if (typeof input === 'string') {
            // Try ISO format first
            const isoDate = new Date(input);
            if (!isNaN(isoDate.getTime())) {
                return isoDate;
            }
        }
        return new Date();
    }

    /**
     * Check if date is valid
     */
    function isValid(date) {
        const d = toDate(date);
        return !isNaN(d.getTime());
    }

    /**
     * Set locale for formatting
     */
    function setLocale(locale) {
        currentLocale = locale;
    }

    /**
     * Get current locale
     */
    function getLocale() {
        return currentLocale;
    }

    // Export API
    window.DateFormatter = {
        relative,
        relativeShort,
        format,
        formatPattern,
        duration,
        countdown,
        calendar,
        isSameDay,
        startOf,
        endOf,
        add,
        subtract,
        diff,
        toDate,
        isValid,
        setLocale,
        getLocale
    };

    console.log('📅 DateFormatter module initialized');
})();
