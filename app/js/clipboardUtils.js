/**
 * Clipboard Utils - Enhanced clipboard operations with fallbacks
 * Quest Mini - Farcaster Mini-App
 */

(function() {
    'use strict';

    // Inject CSS for copy button
    const styles = `
        .copy-btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
            padding: 8px 12px;
            background: rgba(139, 92, 246, 0.1);
            border: 1px solid rgba(139, 92, 246, 0.3);
            border-radius: 8px;
            color: #8B5CF6;
            font-size: 13px;
            cursor: pointer;
            transition: all 0.2s ease;
        }

        .copy-btn:hover {
            background: rgba(139, 92, 246, 0.2);
            border-color: rgba(139, 92, 246, 0.5);
        }

        .copy-btn:active {
            transform: scale(0.95);
        }

        .copy-btn.copied {
            background: rgba(16, 185, 129, 0.1);
            border-color: rgba(16, 185, 129, 0.3);
            color: #10B981;
        }

        .copy-btn .copy-icon {
            width: 16px;
            height: 16px;
            stroke: currentColor;
            stroke-width: 2;
            fill: none;
        }

        .copy-inline {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 4px 8px;
            background: rgba(255, 255, 255, 0.05);
            border-radius: 4px;
            font-family: monospace;
            font-size: 13px;
        }

        .copy-inline .copy-trigger {
            cursor: pointer;
            opacity: 0.6;
            transition: opacity 0.2s;
            padding: 2px;
        }

        .copy-inline .copy-trigger:hover {
            opacity: 1;
        }

        .copy-tooltip {
            position: fixed;
            padding: 6px 12px;
            background: #1f2937;
            color: white;
            font-size: 12px;
            border-radius: 6px;
            pointer-events: none;
            opacity: 0;
            transform: translateY(4px);
            transition: opacity 0.2s, transform 0.2s;
            z-index: 10000;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        }

        .copy-tooltip.visible {
            opacity: 1;
            transform: translateY(0);
        }

        .copy-tooltip::after {
            content: '';
            position: absolute;
            top: 100%;
            left: 50%;
            transform: translateX(-50%);
            border: 6px solid transparent;
            border-top-color: #1f2937;
        }
    `;

    // Inject styles
    const styleSheet = document.createElement('style');
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);

    // Tooltip element for feedback
    let tooltipEl = null;
    let tooltipTimeout = null;

    function createTooltip() {
        if (tooltipEl) return tooltipEl;
        
        tooltipEl = document.createElement('div');
        tooltipEl.className = 'copy-tooltip';
        document.body.appendChild(tooltipEl);
        return tooltipEl;
    }

    function showTooltip(text, x, y) {
        const tooltip = createTooltip();
        tooltip.textContent = text;
        tooltip.style.left = `${x}px`;
        tooltip.style.top = `${y - 40}px`;
        
        clearTimeout(tooltipTimeout);
        requestAnimationFrame(() => {
            tooltip.classList.add('visible');
        });

        tooltipTimeout = setTimeout(() => {
            tooltip.classList.remove('visible');
        }, 1500);
    }

    /**
     * Copy text to clipboard using modern API with fallback
     */
    async function copyText(text, options = {}) {
        const { showFeedback = true, feedbackElement = null } = options;

        try {
            // Try modern Clipboard API first
            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(text);
            } else {
                // Fallback for older browsers
                const textArea = document.createElement('textarea');
                textArea.value = text;
                textArea.style.position = 'fixed';
                textArea.style.left = '-9999px';
                textArea.style.top = '-9999px';
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                
                const successful = document.execCommand('copy');
                document.body.removeChild(textArea);
                
                if (!successful) {
                    throw new Error('Copy command failed');
                }
            }

            // Show feedback
            if (showFeedback && feedbackElement) {
                const rect = feedbackElement.getBoundingClientRect();
                showTooltip('Copied!', rect.left + rect.width / 2, rect.top);
            }

            // Trigger haptic if available
            if (window.Haptics) {
                window.Haptics.light();
            }

            return { success: true };
        } catch (error) {
            console.error('Failed to copy:', error);
            
            if (showFeedback && feedbackElement) {
                const rect = feedbackElement.getBoundingClientRect();
                showTooltip('Copy failed', rect.left + rect.width / 2, rect.top);
            }

            return { success: false, error };
        }
    }

    /**
     * Read text from clipboard
     */
    async function readText() {
        try {
            if (navigator.clipboard && navigator.clipboard.readText) {
                const text = await navigator.clipboard.readText();
                return { success: true, text };
            } else {
                throw new Error('Clipboard API not supported');
            }
        } catch (error) {
            console.error('Failed to read clipboard:', error);
            return { success: false, error };
        }
    }

    /**
     * Copy rich content (HTML)
     */
    async function copyHTML(html, plainText) {
        try {
            if (navigator.clipboard && navigator.clipboard.write) {
                const blob = new Blob([html], { type: 'text/html' });
                const textBlob = new Blob([plainText || html], { type: 'text/plain' });
                
                await navigator.clipboard.write([
                    new ClipboardItem({
                        'text/html': blob,
                        'text/plain': textBlob
                    })
                ]);
                
                return { success: true };
            } else {
                // Fallback to plain text
                return copyText(plainText || html);
            }
        } catch (error) {
            console.error('Failed to copy HTML:', error);
            return { success: false, error };
        }
    }

    /**
     * Copy image to clipboard
     */
    async function copyImage(imageSource) {
        try {
            if (!navigator.clipboard || !navigator.clipboard.write) {
                throw new Error('Clipboard API not supported');
            }

            let blob;

            if (imageSource instanceof Blob) {
                blob = imageSource;
            } else if (typeof imageSource === 'string') {
                // URL or data URL
                const response = await fetch(imageSource);
                blob = await response.blob();
            } else if (imageSource instanceof HTMLCanvasElement) {
                blob = await new Promise(resolve => imageSource.toBlob(resolve));
            } else if (imageSource instanceof HTMLImageElement) {
                const canvas = document.createElement('canvas');
                canvas.width = imageSource.naturalWidth;
                canvas.height = imageSource.naturalHeight;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(imageSource, 0, 0);
                blob = await new Promise(resolve => canvas.toBlob(resolve));
            }

            if (!blob) {
                throw new Error('Could not create image blob');
            }

            await navigator.clipboard.write([
                new ClipboardItem({ [blob.type]: blob })
            ]);

            return { success: true };
        } catch (error) {
            console.error('Failed to copy image:', error);
            return { success: false, error };
        }
    }

    /**
     * Copy Ethereum address with formatting
     */
    async function copyAddress(address, options = {}) {
        const { 
            showFeedback = true,
            feedbackElement = null,
            truncate = false 
        } = options;

        const textToCopy = address;
        const result = await copyText(textToCopy, { showFeedback: false });

        if (result.success && showFeedback && feedbackElement) {
            const rect = feedbackElement.getBoundingClientRect();
            const displayAddr = truncate 
                ? `${address.slice(0, 6)}...${address.slice(-4)}`
                : 'Address';
            showTooltip(`${displayAddr} copied!`, rect.left + rect.width / 2, rect.top);
        }

        return result;
    }

    /**
     * Create a copy button component
     */
    function createCopyButton(textOrGetter, options = {}) {
        const {
            label = 'Copy',
            copiedLabel = 'Copied!',
            className = '',
            showIcon = true
        } = options;

        const button = document.createElement('button');
        button.className = `copy-btn ${className}`;
        
        const iconSvg = showIcon ? `
            <svg class="copy-icon" viewBox="0 0 24 24">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
        ` : '';

        button.innerHTML = `${iconSvg}<span>${label}</span>`;

        button.addEventListener('click', async (e) => {
            const text = typeof textOrGetter === 'function' ? textOrGetter() : textOrGetter;
            const result = await copyText(text, { showFeedback: true, feedbackElement: button });

            if (result.success) {
                button.classList.add('copied');
                button.querySelector('span').textContent = copiedLabel;

                setTimeout(() => {
                    button.classList.remove('copied');
                    button.querySelector('span').textContent = label;
                }, 2000);
            }
        });

        return button;
    }

    /**
     * Create inline copyable text
     */
    function createCopyableText(text, options = {}) {
        const {
            truncate = false,
            truncateLength = 8
        } = options;

        const container = document.createElement('span');
        container.className = 'copy-inline';

        const displayText = truncate && text.length > truncateLength * 2
            ? `${text.slice(0, truncateLength)}...${text.slice(-truncateLength)}`
            : text;

        container.innerHTML = `
            <span class="copy-text">${displayText}</span>
            <span class="copy-trigger" role="button" aria-label="Copy to clipboard">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
            </span>
        `;

        container.querySelector('.copy-trigger').addEventListener('click', (e) => {
            copyText(text, { showFeedback: true, feedbackElement: e.currentTarget });
        });

        // Also copy on click of text
        container.querySelector('.copy-text').addEventListener('click', (e) => {
            copyText(text, { showFeedback: true, feedbackElement: e.currentTarget });
        });

        return container;
    }

    /**
     * Initialize copy functionality on elements with data-copy attribute
     */
    function initDataCopy() {
        document.addEventListener('click', async (e) => {
            const target = e.target.closest('[data-copy]');
            if (!target) return;

            const text = target.dataset.copy;
            if (!text) return;

            await copyText(text, { showFeedback: true, feedbackElement: target });
        });
    }

    /**
     * Check if clipboard is available
     */
    function isSupported() {
        return !!(navigator.clipboard || document.execCommand);
    }

    /**
     * Check if clipboard read is available
     */
    function canRead() {
        return !!(navigator.clipboard && navigator.clipboard.readText);
    }

    /**
     * Check if image copy is available
     */
    function canCopyImage() {
        return !!(navigator.clipboard && navigator.clipboard.write && typeof ClipboardItem !== 'undefined');
    }

    // Initialize data-copy handlers
    initDataCopy();

    // Export API
    window.ClipboardUtils = {
        copyText,
        readText,
        copyHTML,
        copyImage,
        copyAddress,
        createCopyButton,
        createCopyableText,
        isSupported,
        canRead,
        canCopyImage
    };

    console.log('📋 ClipboardUtils module initialized');
})();
