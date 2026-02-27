/**
 * Color Utils - Color manipulation and generation utilities
 * Quest Mini - Farcaster Mini-App
 */

(function() {
    'use strict';

    /**
     * Parse color from any format to RGB
     */
    function parseColor(color) {
        if (!color) return null;

        // Already RGB object
        if (typeof color === 'object' && 'r' in color) {
            return { r: color.r, g: color.g, b: color.b, a: color.a ?? 1 };
        }

        // Hex color
        if (color.startsWith('#')) {
            return hexToRgb(color);
        }

        // RGB/RGBA string
        if (color.startsWith('rgb')) {
            const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
            if (match) {
                return {
                    r: parseInt(match[1]),
                    g: parseInt(match[2]),
                    b: parseInt(match[3]),
                    a: match[4] ? parseFloat(match[4]) : 1
                };
            }
        }

        // HSL string
        if (color.startsWith('hsl')) {
            const match = color.match(/hsla?\((\d+),\s*([\d.]+)%,\s*([\d.]+)%(?:,\s*([\d.]+))?\)/);
            if (match) {
                const rgb = hslToRgb(
                    parseInt(match[1]),
                    parseFloat(match[2]),
                    parseFloat(match[3])
                );
                rgb.a = match[4] ? parseFloat(match[4]) : 1;
                return rgb;
            }
        }

        // Named color - use canvas to convert
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = 1;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = color;
        ctx.fillRect(0, 0, 1, 1);
        const data = ctx.getImageData(0, 0, 1, 1).data;
        return { r: data[0], g: data[1], b: data[2], a: data[3] / 255 };
    }

    /**
     * Convert hex to RGB
     */
    function hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})?$/i.exec(hex);
        
        if (!result) {
            // Short hex
            const shortResult = /^#?([a-f\d])([a-f\d])([a-f\d])$/i.exec(hex);
            if (shortResult) {
                return {
                    r: parseInt(shortResult[1] + shortResult[1], 16),
                    g: parseInt(shortResult[2] + shortResult[2], 16),
                    b: parseInt(shortResult[3] + shortResult[3], 16),
                    a: 1
                };
            }
            return null;
        }

        return {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16),
            a: result[4] ? parseInt(result[4], 16) / 255 : 1
        };
    }

    /**
     * Convert RGB to hex
     */
    function rgbToHex(r, g, b, a) {
        const toHex = (n) => {
            const hex = Math.round(Math.max(0, Math.min(255, n))).toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        };

        let hex = '#' + toHex(r) + toHex(g) + toHex(b);
        if (a !== undefined && a < 1) {
            hex += toHex(Math.round(a * 255));
        }
        return hex;
    }

    /**
     * Convert RGB to HSL
     */
    function rgbToHsl(r, g, b) {
        r /= 255;
        g /= 255;
        b /= 255;

        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        let h, s;
        const l = (max + min) / 2;

        if (max === min) {
            h = s = 0;
        } else {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

            switch (max) {
                case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
                case g: h = ((b - r) / d + 2) / 6; break;
                case b: h = ((r - g) / d + 4) / 6; break;
            }
        }

        return {
            h: Math.round(h * 360),
            s: Math.round(s * 100),
            l: Math.round(l * 100)
        };
    }

    /**
     * Convert HSL to RGB
     */
    function hslToRgb(h, s, l) {
        h /= 360;
        s /= 100;
        l /= 100;

        let r, g, b;

        if (s === 0) {
            r = g = b = l;
        } else {
            const hue2rgb = (p, q, t) => {
                if (t < 0) t += 1;
                if (t > 1) t -= 1;
                if (t < 1/6) return p + (q - p) * 6 * t;
                if (t < 1/2) return q;
                if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
                return p;
            };

            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;
            r = hue2rgb(p, q, h + 1/3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1/3);
        }

        return {
            r: Math.round(r * 255),
            g: Math.round(g * 255),
            b: Math.round(b * 255)
        };
    }

    /**
     * Lighten a color
     */
    function lighten(color, amount = 10) {
        const rgb = parseColor(color);
        if (!rgb) return color;

        const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
        hsl.l = Math.min(100, hsl.l + amount);
        
        const result = hslToRgb(hsl.h, hsl.s, hsl.l);
        return rgbToHex(result.r, result.g, result.b, rgb.a);
    }

    /**
     * Darken a color
     */
    function darken(color, amount = 10) {
        const rgb = parseColor(color);
        if (!rgb) return color;

        const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
        hsl.l = Math.max(0, hsl.l - amount);
        
        const result = hslToRgb(hsl.h, hsl.s, hsl.l);
        return rgbToHex(result.r, result.g, result.b, rgb.a);
    }

    /**
     * Saturate a color
     */
    function saturate(color, amount = 10) {
        const rgb = parseColor(color);
        if (!rgb) return color;

        const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
        hsl.s = Math.min(100, hsl.s + amount);
        
        const result = hslToRgb(hsl.h, hsl.s, hsl.l);
        return rgbToHex(result.r, result.g, result.b, rgb.a);
    }

    /**
     * Desaturate a color
     */
    function desaturate(color, amount = 10) {
        const rgb = parseColor(color);
        if (!rgb) return color;

        const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
        hsl.s = Math.max(0, hsl.s - amount);
        
        const result = hslToRgb(hsl.h, hsl.s, hsl.l);
        return rgbToHex(result.r, result.g, result.b, rgb.a);
    }

    /**
     * Adjust alpha/opacity
     */
    function alpha(color, a) {
        const rgb = parseColor(color);
        if (!rgb) return color;

        return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${Math.max(0, Math.min(1, a))})`;
    }

    /**
     * Mix two colors
     */
    function mix(color1, color2, weight = 50) {
        const rgb1 = parseColor(color1);
        const rgb2 = parseColor(color2);
        if (!rgb1 || !rgb2) return color1;

        const w = weight / 100;
        const r = Math.round(rgb1.r * (1 - w) + rgb2.r * w);
        const g = Math.round(rgb1.g * (1 - w) + rgb2.g * w);
        const b = Math.round(rgb1.b * (1 - w) + rgb2.b * w);
        const a = rgb1.a * (1 - w) + rgb2.a * w;

        return rgbToHex(r, g, b, a);
    }

    /**
     * Get complementary color
     */
    function complement(color) {
        const rgb = parseColor(color);
        if (!rgb) return color;

        const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
        hsl.h = (hsl.h + 180) % 360;
        
        const result = hslToRgb(hsl.h, hsl.s, hsl.l);
        return rgbToHex(result.r, result.g, result.b, rgb.a);
    }

    /**
     * Generate color palette
     */
    function palette(baseColor, type = 'analogous') {
        const rgb = parseColor(baseColor);
        if (!rgb) return [baseColor];

        const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
        const colors = [];

        switch (type) {
            case 'analogous':
                [-30, 0, 30].forEach(offset => {
                    const h = (hsl.h + offset + 360) % 360;
                    const result = hslToRgb(h, hsl.s, hsl.l);
                    colors.push(rgbToHex(result.r, result.g, result.b));
                });
                break;

            case 'triadic':
                [0, 120, 240].forEach(offset => {
                    const h = (hsl.h + offset) % 360;
                    const result = hslToRgb(h, hsl.s, hsl.l);
                    colors.push(rgbToHex(result.r, result.g, result.b));
                });
                break;

            case 'tetradic':
                [0, 90, 180, 270].forEach(offset => {
                    const h = (hsl.h + offset) % 360;
                    const result = hslToRgb(h, hsl.s, hsl.l);
                    colors.push(rgbToHex(result.r, result.g, result.b));
                });
                break;

            case 'monochromatic':
                [20, 40, 60, 80].forEach(l => {
                    const result = hslToRgb(hsl.h, hsl.s, l);
                    colors.push(rgbToHex(result.r, result.g, result.b));
                });
                break;

            case 'shades':
                for (let i = 0; i < 5; i++) {
                    const l = Math.max(0, hsl.l - i * 15);
                    const result = hslToRgb(hsl.h, hsl.s, l);
                    colors.push(rgbToHex(result.r, result.g, result.b));
                }
                break;

            case 'tints':
                for (let i = 0; i < 5; i++) {
                    const l = Math.min(100, hsl.l + i * 15);
                    const result = hslToRgb(hsl.h, hsl.s, l);
                    colors.push(rgbToHex(result.r, result.g, result.b));
                }
                break;
        }

        return colors;
    }

    /**
     * Get contrast ratio between two colors
     */
    function contrastRatio(color1, color2) {
        const rgb1 = parseColor(color1);
        const rgb2 = parseColor(color2);
        if (!rgb1 || !rgb2) return 1;

        const getLuminance = (rgb) => {
            const [r, g, b] = [rgb.r, rgb.g, rgb.b].map(c => {
                c /= 255;
                return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
            });
            return 0.2126 * r + 0.7152 * g + 0.0722 * b;
        };

        const l1 = getLuminance(rgb1);
        const l2 = getLuminance(rgb2);
        const lighter = Math.max(l1, l2);
        const darker = Math.min(l1, l2);

        return (lighter + 0.05) / (darker + 0.05);
    }

    /**
     * Check if color is light or dark
     */
    function isLight(color) {
        const rgb = parseColor(color);
        if (!rgb) return true;

        // Using perceived brightness formula
        const brightness = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
        return brightness > 128;
    }

    /**
     * Get readable text color for background
     */
    function getTextColor(backgroundColor, lightColor = '#ffffff', darkColor = '#000000') {
        return isLight(backgroundColor) ? darkColor : lightColor;
    }

    /**
     * Generate random color
     */
    function random(options = {}) {
        const {
            saturation = null,
            lightness = null,
            hue = null,
            alpha: a = 1
        } = options;

        const h = hue ?? Math.floor(Math.random() * 360);
        const s = saturation ?? Math.floor(Math.random() * 40) + 60; // 60-100%
        const l = lightness ?? Math.floor(Math.random() * 30) + 40; // 40-70%

        const rgb = hslToRgb(h, s, l);
        return rgbToHex(rgb.r, rgb.g, rgb.b, a);
    }

    /**
     * Generate gradient
     */
    function gradient(color1, color2, steps = 5) {
        const colors = [];
        for (let i = 0; i < steps; i++) {
            const weight = (i / (steps - 1)) * 100;
            colors.push(mix(color1, color2, weight));
        }
        return colors;
    }

    /**
     * Convert to CSS string
     */
    function toCSS(color, format = 'hex') {
        const rgb = parseColor(color);
        if (!rgb) return color;

        switch (format) {
            case 'hex':
                return rgbToHex(rgb.r, rgb.g, rgb.b, rgb.a);
            case 'rgb':
                return rgb.a < 1 
                    ? `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${rgb.a})`
                    : `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
            case 'hsl':
                const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
                return rgb.a < 1
                    ? `hsla(${hsl.h}, ${hsl.s}%, ${hsl.l}%, ${rgb.a})`
                    : `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;
            default:
                return rgbToHex(rgb.r, rgb.g, rgb.b);
        }
    }

    // Preset brand colors
    const brandColors = {
        quest: '#8B5CF6',
        questDark: '#7C3AED',
        questLight: '#A78BFA',
        success: '#10B981',
        error: '#EF4444',
        warning: '#F59E0B',
        info: '#3B82F6',
        farcaster: '#8B5CF6',
        base: '#0052FF',
        ethereum: '#627EEA'
    };

    // Export API
    window.ColorUtils = {
        parse: parseColor,
        hexToRgb,
        rgbToHex,
        rgbToHsl,
        hslToRgb,
        lighten,
        darken,
        saturate,
        desaturate,
        alpha,
        mix,
        complement,
        palette,
        contrastRatio,
        isLight,
        getTextColor,
        random,
        gradient,
        toCSS,
        brandColors
    };

    console.log('🎨 ColorUtils module initialized');
})();
