/**
 * Loading Overlay - Full-screen loading states with spinners and messages
 * Quest Mini - Farcaster Mini-App
 */

(function() {
    'use strict';

    // Inject CSS styles
    const styles = `
        .loading-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.85);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            opacity: 0;
            visibility: hidden;
            transition: opacity 0.3s ease, visibility 0.3s ease;
            backdrop-filter: blur(4px);
            -webkit-backdrop-filter: blur(4px);
        }

        .loading-overlay.active {
            opacity: 1;
            visibility: visible;
        }

        .loading-overlay.light-theme {
            background: rgba(255, 255, 255, 0.95);
        }

        /* Spinner Types */
        .loading-spinner {
            width: 60px;
            height: 60px;
            position: relative;
            margin-bottom: 20px;
        }

        /* Circular Spinner */
        .loading-spinner.circular {
            border: 4px solid rgba(255, 255, 255, 0.1);
            border-top-color: #8B5CF6;
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }

        .loading-overlay.light-theme .loading-spinner.circular {
            border-color: rgba(0, 0, 0, 0.1);
            border-top-color: #8B5CF6;
        }

        @keyframes spin {
            to { transform: rotate(360deg); }
        }

        /* Dots Spinner */
        .loading-spinner.dots {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
        }

        .loading-spinner.dots .dot {
            width: 12px;
            height: 12px;
            background: #8B5CF6;
            border-radius: 50%;
            animation: dotPulse 1.4s ease-in-out infinite;
        }

        .loading-spinner.dots .dot:nth-child(1) { animation-delay: 0s; }
        .loading-spinner.dots .dot:nth-child(2) { animation-delay: 0.2s; }
        .loading-spinner.dots .dot:nth-child(3) { animation-delay: 0.4s; }

        @keyframes dotPulse {
            0%, 80%, 100% {
                transform: scale(0.6);
                opacity: 0.5;
            }
            40% {
                transform: scale(1);
                opacity: 1;
            }
        }

        /* Pulse Spinner */
        .loading-spinner.pulse {
            background: #8B5CF6;
            border-radius: 50%;
            animation: pulse 1.5s ease-in-out infinite;
        }

        @keyframes pulse {
            0% {
                transform: scale(0.8);
                opacity: 0.5;
            }
            50% {
                transform: scale(1);
                opacity: 1;
            }
            100% {
                transform: scale(0.8);
                opacity: 0.5;
            }
        }

        /* Bars Spinner */
        .loading-spinner.bars {
            display: flex;
            align-items: flex-end;
            justify-content: center;
            gap: 4px;
            height: 40px;
        }

        .loading-spinner.bars .bar {
            width: 8px;
            background: #8B5CF6;
            border-radius: 4px;
            animation: barGrow 1s ease-in-out infinite;
        }

        .loading-spinner.bars .bar:nth-child(1) { animation-delay: 0s; }
        .loading-spinner.bars .bar:nth-child(2) { animation-delay: 0.1s; }
        .loading-spinner.bars .bar:nth-child(3) { animation-delay: 0.2s; }
        .loading-spinner.bars .bar:nth-child(4) { animation-delay: 0.3s; }
        .loading-spinner.bars .bar:nth-child(5) { animation-delay: 0.4s; }

        @keyframes barGrow {
            0%, 100% { height: 15px; }
            50% { height: 40px; }
        }

        /* Ring Spinner */
        .loading-spinner.ring {
            border: 4px solid transparent;
            border-radius: 50%;
            position: relative;
        }

        .loading-spinner.ring::before,
        .loading-spinner.ring::after {
            content: '';
            position: absolute;
            border: 4px solid transparent;
            border-radius: 50%;
        }

        .loading-spinner.ring::before {
            top: -4px;
            left: -4px;
            right: -4px;
            bottom: -4px;
            border-top-color: #8B5CF6;
            animation: spin 1s linear infinite;
        }

        .loading-spinner.ring::after {
            top: 4px;
            left: 4px;
            right: 4px;
            bottom: 4px;
            border-bottom-color: #EC4899;
            animation: spin 0.8s linear reverse infinite;
        }

        /* Loading Message */
        .loading-message {
            color: white;
            font-size: 16px;
            font-weight: 500;
            text-align: center;
            max-width: 80%;
            line-height: 1.5;
        }

        .loading-overlay.light-theme .loading-message {
            color: #1f2937;
        }

        .loading-submessage {
            color: rgba(255, 255, 255, 0.6);
            font-size: 14px;
            margin-top: 8px;
            text-align: center;
        }

        .loading-overlay.light-theme .loading-submessage {
            color: rgba(0, 0, 0, 0.5);
        }

        /* Progress Bar */
        .loading-progress {
            width: 200px;
            height: 4px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 2px;
            margin-top: 20px;
            overflow: hidden;
        }

        .loading-overlay.light-theme .loading-progress {
            background: rgba(0, 0, 0, 0.1);
        }

        .loading-progress-bar {
            height: 100%;
            background: linear-gradient(90deg, #8B5CF6, #EC4899);
            border-radius: 2px;
            transition: width 0.3s ease;
            width: 0%;
        }

        .loading-progress-bar.indeterminate {
            width: 30%;
            animation: indeterminate 1.5s ease-in-out infinite;
        }

        @keyframes indeterminate {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(400%); }
        }

        /* Cancel Button */
        .loading-cancel {
            margin-top: 24px;
            padding: 10px 24px;
            background: transparent;
            border: 1px solid rgba(255, 255, 255, 0.3);
            color: rgba(255, 255, 255, 0.8);
            border-radius: 8px;
            font-size: 14px;
            cursor: pointer;
            transition: all 0.2s ease;
        }

        .loading-overlay.light-theme .loading-cancel {
            border-color: rgba(0, 0, 0, 0.2);
            color: rgba(0, 0, 0, 0.6);
        }

        .loading-cancel:hover {
            background: rgba(255, 255, 255, 0.1);
            border-color: rgba(255, 255, 255, 0.5);
            color: white;
        }

        .loading-overlay.light-theme .loading-cancel:hover {
            background: rgba(0, 0, 0, 0.05);
            border-color: rgba(0, 0, 0, 0.3);
            color: #1f2937;
        }

        /* Inline Loader */
        .inline-loader {
            display: inline-flex;
            align-items: center;
            gap: 8px;
        }

        .inline-loader .mini-spinner {
            width: 16px;
            height: 16px;
            border: 2px solid rgba(139, 92, 246, 0.2);
            border-top-color: #8B5CF6;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
        }

        /* Button Loading State */
        .btn-loading {
            position: relative;
            color: transparent !important;
            pointer-events: none;
        }

        .btn-loading::after {
            content: '';
            position: absolute;
            width: 18px;
            height: 18px;
            top: 50%;
            left: 50%;
            margin-top: -9px;
            margin-left: -9px;
            border: 2px solid rgba(255, 255, 255, 0.3);
            border-top-color: white;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
        }
    `;

    // Inject styles
    const styleSheet = document.createElement('style');
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);

    // State
    let overlayElement = null;
    let currentConfig = null;
    let cancelCallback = null;

    /**
     * Create spinner element based on type
     */
    function createSpinner(type) {
        const spinner = document.createElement('div');
        spinner.className = `loading-spinner ${type}`;

        switch (type) {
            case 'dots':
                for (let i = 0; i < 3; i++) {
                    const dot = document.createElement('div');
                    dot.className = 'dot';
                    spinner.appendChild(dot);
                }
                break;
            case 'bars':
                for (let i = 0; i < 5; i++) {
                    const bar = document.createElement('div');
                    bar.className = 'bar';
                    spinner.appendChild(bar);
                }
                break;
            // circular, pulse, ring don't need children
        }

        return spinner;
    }

    /**
     * Show loading overlay
     */
    function show(options = {}) {
        const config = {
            message: options.message || 'Loading...',
            submessage: options.submessage || '',
            spinner: options.spinner || 'circular', // circular, dots, pulse, bars, ring
            progress: options.progress !== undefined ? options.progress : null,
            indeterminate: options.indeterminate || false,
            cancellable: options.cancellable || false,
            cancelText: options.cancelText || 'Cancel',
            lightTheme: options.lightTheme || false,
            onCancel: options.onCancel || null
        };

        currentConfig = config;
        cancelCallback = config.onCancel;

        // Remove existing overlay
        if (overlayElement) {
            overlayElement.remove();
        }

        // Create overlay
        overlayElement = document.createElement('div');
        overlayElement.className = 'loading-overlay';
        if (config.lightTheme) {
            overlayElement.classList.add('light-theme');
        }

        // Add spinner
        overlayElement.appendChild(createSpinner(config.spinner));

        // Add message
        if (config.message) {
            const messageEl = document.createElement('div');
            messageEl.className = 'loading-message';
            messageEl.textContent = config.message;
            overlayElement.appendChild(messageEl);
        }

        // Add submessage
        if (config.submessage) {
            const submessageEl = document.createElement('div');
            submessageEl.className = 'loading-submessage';
            submessageEl.textContent = config.submessage;
            overlayElement.appendChild(submessageEl);
        }

        // Add progress bar
        if (config.progress !== null || config.indeterminate) {
            const progressContainer = document.createElement('div');
            progressContainer.className = 'loading-progress';
            
            const progressBar = document.createElement('div');
            progressBar.className = 'loading-progress-bar';
            
            if (config.indeterminate) {
                progressBar.classList.add('indeterminate');
            } else {
                progressBar.style.width = `${config.progress}%`;
            }
            
            progressContainer.appendChild(progressBar);
            overlayElement.appendChild(progressContainer);
        }

        // Add cancel button
        if (config.cancellable) {
            const cancelBtn = document.createElement('button');
            cancelBtn.className = 'loading-cancel';
            cancelBtn.textContent = config.cancelText;
            cancelBtn.addEventListener('click', () => {
                hide();
                if (cancelCallback) {
                    cancelCallback();
                }
            });
            overlayElement.appendChild(cancelBtn);
        }

        // Prevent body scroll
        document.body.style.overflow = 'hidden';

        // Add to DOM
        document.body.appendChild(overlayElement);

        // Trigger animation
        requestAnimationFrame(() => {
            overlayElement.classList.add('active');
        });

        return {
            hide,
            updateMessage,
            updateProgress
        };
    }

    /**
     * Hide loading overlay
     */
    function hide() {
        if (!overlayElement) return;

        overlayElement.classList.remove('active');
        
        setTimeout(() => {
            if (overlayElement) {
                overlayElement.remove();
                overlayElement = null;
            }
            document.body.style.overflow = '';
        }, 300);

        currentConfig = null;
        cancelCallback = null;
    }

    /**
     * Update loading message
     */
    function updateMessage(message, submessage) {
        if (!overlayElement) return;

        const messageEl = overlayElement.querySelector('.loading-message');
        if (messageEl && message) {
            messageEl.textContent = message;
        }

        const submessageEl = overlayElement.querySelector('.loading-submessage');
        if (submessageEl && submessage !== undefined) {
            submessageEl.textContent = submessage;
        }
    }

    /**
     * Update progress bar
     */
    function updateProgress(percent) {
        if (!overlayElement) return;

        const progressBar = overlayElement.querySelector('.loading-progress-bar');
        if (progressBar) {
            progressBar.classList.remove('indeterminate');
            progressBar.style.width = `${Math.min(100, Math.max(0, percent))}%`;
        }
    }

    /**
     * Create inline loader
     */
    function createInlineLoader(text = 'Loading...') {
        const loader = document.createElement('span');
        loader.className = 'inline-loader';
        
        const spinner = document.createElement('span');
        spinner.className = 'mini-spinner';
        
        const label = document.createElement('span');
        label.textContent = text;
        
        loader.appendChild(spinner);
        loader.appendChild(label);
        
        return loader;
    }

    /**
     * Set button loading state
     */
    function setButtonLoading(button, loading = true) {
        if (typeof button === 'string') {
            button = document.querySelector(button);
        }
        
        if (!button) return;

        if (loading) {
            button.classList.add('btn-loading');
            button.dataset.originalText = button.textContent;
            button.disabled = true;
        } else {
            button.classList.remove('btn-loading');
            if (button.dataset.originalText) {
                button.textContent = button.dataset.originalText;
                delete button.dataset.originalText;
            }
            button.disabled = false;
        }
    }

    /**
     * Show loading for async operation
     */
    async function withLoading(asyncFn, options = {}) {
        const loader = show(options);
        
        try {
            const result = await asyncFn((progress, message) => {
                if (typeof progress === 'number') {
                    loader.updateProgress(progress);
                }
                if (message) {
                    loader.updateMessage(message);
                }
            });
            return result;
        } finally {
            hide();
        }
    }

    /**
     * Check if loading is active
     */
    function isLoading() {
        return overlayElement !== null && overlayElement.classList.contains('active');
    }

    // Export API
    window.LoadingOverlay = {
        show,
        hide,
        updateMessage,
        updateProgress,
        createInlineLoader,
        setButtonLoading,
        withLoading,
        isLoading
    };

    console.log('✨ LoadingOverlay module initialized');
})();
