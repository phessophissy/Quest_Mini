/**
 * Share Social - Social sharing utilities for Web and native platforms
 * Quest Mini - Farcaster Mini-App
 */

(function() {
    'use strict';

    // Inject CSS
    const styles = `
        .share-modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.7);
            display: flex;
            align-items: flex-end;
            justify-content: center;
            z-index: 10000;
            opacity: 0;
            visibility: hidden;
            transition: opacity 0.3s ease, visibility 0.3s ease;
            backdrop-filter: blur(4px);
        }

        .share-modal-overlay.active {
            opacity: 1;
            visibility: visible;
        }

        .share-modal {
            background: #1f2937;
            border-radius: 20px 20px 0 0;
            padding: 20px;
            width: 100%;
            max-width: 400px;
            transform: translateY(100%);
            transition: transform 0.3s ease;
        }

        .share-modal-overlay.active .share-modal {
            transform: translateY(0);
        }

        .share-modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
        }

        .share-modal-title {
            font-size: 18px;
            font-weight: 600;
            color: white;
        }

        .share-modal-close {
            background: none;
            border: none;
            color: rgba(255, 255, 255, 0.6);
            font-size: 24px;
            cursor: pointer;
            padding: 4px;
            line-height: 1;
        }

        .share-options {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 16px;
            margin-bottom: 20px;
        }

        .share-option {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 8px;
            background: none;
            border: none;
            color: white;
            cursor: pointer;
            padding: 12px 8px;
            border-radius: 12px;
            transition: background 0.2s;
        }

        .share-option:hover {
            background: rgba(255, 255, 255, 0.1);
        }

        .share-option:active {
            transform: scale(0.95);
        }

        .share-option-icon {
            width: 48px;
            height: 48px;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .share-option-icon svg {
            width: 24px;
            height: 24px;
        }

        .share-option-label {
            font-size: 12px;
            color: rgba(255, 255, 255, 0.8);
        }

        /* Platform colors */
        .share-option-icon.twitter { background: #1DA1F2; }
        .share-option-icon.facebook { background: #1877F2; }
        .share-option-icon.telegram { background: #0088CC; }
        .share-option-icon.whatsapp { background: #25D366; }
        .share-option-icon.linkedin { background: #0A66C2; }
        .share-option-icon.reddit { background: #FF4500; }
        .share-option-icon.email { background: #EA4335; }
        .share-option-icon.copy { background: #8B5CF6; }
        .share-option-icon.farcaster { background: #8B5CF6; }
        .share-option-icon.warpcast { background: #472A91; }

        .share-link-section {
            background: rgba(0, 0, 0, 0.3);
            border-radius: 12px;
            padding: 12px;
            display: flex;
            gap: 12px;
            align-items: center;
        }

        .share-link-input {
            flex: 1;
            background: transparent;
            border: none;
            color: rgba(255, 255, 255, 0.8);
            font-size: 14px;
            outline: none;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .share-link-copy {
            background: #8B5CF6;
            border: none;
            color: white;
            padding: 8px 16px;
            border-radius: 8px;
            font-size: 14px;
            cursor: pointer;
            transition: background 0.2s;
        }

        .share-link-copy:hover {
            background: #7C3AED;
        }

        .share-link-copy.copied {
            background: #10B981;
        }
    `;

    // Inject styles
    const styleSheet = document.createElement('style');
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);

    // SVG icons for platforms
    const icons = {
        twitter: '<svg viewBox="0 0 24 24" fill="white"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>',
        facebook: '<svg viewBox="0 0 24 24" fill="white"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>',
        telegram: '<svg viewBox="0 0 24 24" fill="white"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>',
        whatsapp: '<svg viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>',
        linkedin: '<svg viewBox="0 0 24 24" fill="white"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>',
        reddit: '<svg viewBox="0 0 24 24" fill="white"><path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/></svg>',
        email: '<svg viewBox="0 0 24 24" fill="white"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>',
        copy: '<svg viewBox="0 0 24 24" fill="white"><rect x="9" y="9" width="13" height="13" rx="2" stroke="white" stroke-width="2" fill="none"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" stroke="white" stroke-width="2" fill="none"/></svg>',
        farcaster: '<svg viewBox="0 0 24 24" fill="white"><path d="M18.24 4H5.76C4.79 4 4 4.79 4 5.76v12.48c0 .97.79 1.76 1.76 1.76h12.48c.97 0 1.76-.79 1.76-1.76V5.76c0-.97-.79-1.76-1.76-1.76zm-3.6 13.2h-1.68v-4.08c0-.84-.36-1.32-1.08-1.32-.84 0-1.32.6-1.32 1.56v3.84H8.88V9.6h1.68v.84c.36-.6 1.08-1.08 2.04-1.08 1.56 0 2.04 1.08 2.04 2.64v5.2z"/></svg>',
        warpcast: '<svg viewBox="0 0 24 24" fill="white"><path d="M3 5.5l4 7 4-7h5l-6.5 11.5L16.5 5.5h4l-6.5 11.5L21 5.5h3v13H3v-13z"/></svg>'
    };

    // Share URL generators
    const shareUrls = {
        twitter: (url, text) => 
            `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
        
        facebook: (url) => 
            `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
        
        telegram: (url, text) => 
            `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
        
        whatsapp: (url, text) => 
            `https://api.whatsapp.com/send?text=${encodeURIComponent(text + ' ' + url)}`,
        
        linkedin: (url, title) => 
            `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
        
        reddit: (url, title) => 
            `https://www.reddit.com/submit?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`,
        
        email: (url, subject, body) => 
            `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body + '\n\n' + url)}`,
        
        warpcast: (url, text) =>
            `https://warpcast.com/~/compose?text=${encodeURIComponent(text + ' ' + url)}`
    };

    let modalElement = null;

    /**
     * Share using native Web Share API if available
     */
    async function shareNative(data) {
        if (!navigator.share) {
            return { success: false, error: 'Web Share API not supported' };
        }

        try {
            await navigator.share({
                title: data.title,
                text: data.text,
                url: data.url
            });
            return { success: true };
        } catch (error) {
            if (error.name === 'AbortError') {
                return { success: false, error: 'Share cancelled' };
            }
            return { success: false, error: error.message };
        }
    }

    /**
     * Share to specific platform
     */
    function shareTo(platform, data) {
        const { url, title, text } = data;

        if (platform === 'copy') {
            return copyToClipboard(url);
        }

        const shareUrl = shareUrls[platform];
        if (!shareUrl) {
            return { success: false, error: 'Unknown platform' };
        }

        const generatedUrl = shareUrl(url, text || title, title, text);
        
        // Open in popup or new tab
        const width = 600;
        const height = 400;
        const left = (window.screen.width - width) / 2;
        const top = (window.screen.height - height) / 2;

        window.open(
            generatedUrl,
            'share',
            `width=${width},height=${height},left=${left},top=${top}`
        );

        return { success: true };
    }

    /**
     * Copy to clipboard helper
     */
    async function copyToClipboard(text) {
        try {
            if (window.ClipboardUtils) {
                return await window.ClipboardUtils.copyText(text);
            }

            await navigator.clipboard.writeText(text);
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Show share modal
     */
    function showShareModal(data, options = {}) {
        const {
            platforms = ['twitter', 'facebook', 'telegram', 'whatsapp', 'warpcast', 'reddit', 'email', 'copy'],
            onShare,
            onClose
        } = options;

        // Remove existing modal
        if (modalElement) {
            modalElement.remove();
        }

        // Create modal
        modalElement = document.createElement('div');
        modalElement.className = 'share-modal-overlay';
        
        const platformButtons = platforms.map(platform => `
            <button class="share-option" data-platform="${platform}">
                <span class="share-option-icon ${platform}">
                    ${icons[platform] || ''}
                </span>
                <span class="share-option-label">${platform.charAt(0).toUpperCase() + platform.slice(1)}</span>
            </button>
        `).join('');

        modalElement.innerHTML = `
            <div class="share-modal">
                <div class="share-modal-header">
                    <span class="share-modal-title">Share</span>
                    <button class="share-modal-close">&times;</button>
                </div>
                <div class="share-options">
                    ${platformButtons}
                </div>
                <div class="share-link-section">
                    <input type="text" class="share-link-input" value="${data.url}" readonly>
                    <button class="share-link-copy">Copy</button>
                </div>
            </div>
        `;

        // Add event listeners
        modalElement.querySelector('.share-modal-close').addEventListener('click', () => {
            hideShareModal();
            if (onClose) onClose();
        });

        modalElement.addEventListener('click', (e) => {
            if (e.target === modalElement) {
                hideShareModal();
                if (onClose) onClose();
            }
        });

        modalElement.querySelectorAll('.share-option').forEach(btn => {
            btn.addEventListener('click', () => {
                const platform = btn.dataset.platform;
                shareTo(platform, data);
                if (onShare) onShare(platform);
            });
        });

        const copyBtn = modalElement.querySelector('.share-link-copy');
        copyBtn.addEventListener('click', async () => {
            await copyToClipboard(data.url);
            copyBtn.textContent = 'Copied!';
            copyBtn.classList.add('copied');
            setTimeout(() => {
                copyBtn.textContent = 'Copy';
                copyBtn.classList.remove('copied');
            }, 2000);
        });

        document.body.appendChild(modalElement);
        document.body.style.overflow = 'hidden';

        // Animate in
        requestAnimationFrame(() => {
            modalElement.classList.add('active');
        });
    }

    /**
     * Hide share modal
     */
    function hideShareModal() {
        if (!modalElement) return;

        modalElement.classList.remove('active');
        document.body.style.overflow = '';

        setTimeout(() => {
            if (modalElement) {
                modalElement.remove();
                modalElement = null;
            }
        }, 300);
    }

    /**
     * Auto-detect and use best share method
     */
    async function share(data, options = {}) {
        // Try native share first on mobile
        if (navigator.share && /Android|iPhone|iPad/i.test(navigator.userAgent)) {
            const result = await shareNative(data);
            if (result.success) {
                return result;
            }
        }

        // Fall back to modal
        showShareModal(data, options);
        return { success: true, method: 'modal' };
    }

    /**
     * Generate share URL for quest
     */
    function generateQuestShareUrl(questId) {
        const baseUrl = window.location.origin;
        return `${baseUrl}/quest/${questId}`;
    }

    /**
     * Generate referral share content
     */
    function generateReferralShare(referralCode) {
        const baseUrl = window.location.origin;
        return {
            url: `${baseUrl}?ref=${referralCode}`,
            title: 'Join Quest Mini!',
            text: `🎯 Complete daily quests and earn QUEST tokens! Use my referral code: ${referralCode}`
        };
    }

    /**
     * Check if native share is available
     */
    function canShareNative() {
        return !!navigator.share;
    }

    /**
     * Check if can share files
     */
    function canShareFiles() {
        return navigator.canShare && navigator.canShare({ files: [new File([], 'test')] });
    }

    // Export API
    window.ShareSocial = {
        share,
        shareNative,
        shareTo,
        showShareModal,
        hideShareModal,
        generateQuestShareUrl,
        generateReferralShare,
        canShareNative,
        canShareFiles,
        platforms: Object.keys(shareUrls)
    };

    console.log('📤 ShareSocial module initialized');
})();
