/**
 * Quest Timer - Countdown and timer utilities for quests
 * Quest Mini - Farcaster Mini-App
 */

(function() {
    'use strict';

    // Active timers
    const timers = new Map();
    let timerId = 0;

    // Default styles
    const defaultStyles = `
        .quest-timer {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 16px;
            padding: 20px;
            background: var(--bg-card, #1A1A2E);
            border-radius: 16px;
            border: 1px solid var(--border, #2D2D44);
        }
        
        .timer-segment {
            display: flex;
            flex-direction: column;
            align-items: center;
            min-width: 60px;
        }
        
        .timer-value {
            font-size: 32px;
            font-weight: 700;
            color: var(--text-primary, #FFFFFF);
            font-variant-numeric: tabular-nums;
            line-height: 1;
        }
        
        .timer-label {
            font-size: 11px;
            color: var(--text-secondary, #A1A1AA);
            text-transform: uppercase;
            margin-top: 4px;
        }
        
        .timer-separator {
            font-size: 24px;
            color: var(--text-secondary, #A1A1AA);
            margin-bottom: 16px;
        }
        
        /* Compact variant */
        .quest-timer.compact {
            padding: 12px 16px;
            gap: 8px;
        }
        
        .quest-timer.compact .timer-segment {
            min-width: auto;
        }
        
        .quest-timer.compact .timer-value {
            font-size: 18px;
        }
        
        .quest-timer.compact .timer-label {
            display: none;
        }
        
        .quest-timer.compact .timer-separator {
            font-size: 18px;
            margin-bottom: 0;
        }
        
        /* Inline variant */
        .quest-timer.inline {
            display: inline-flex;
            padding: 6px 12px;
            background: rgba(139, 92, 246, 0.1);
            border: none;
            border-radius: 8px;
            gap: 4px;
        }
        
        .quest-timer.inline .timer-segment {
            flex-direction: row;
            min-width: auto;
            gap: 2px;
        }
        
        .quest-timer.inline .timer-value {
            font-size: 14px;
        }
        
        .quest-timer.inline .timer-label {
            font-size: 10px;
            margin-top: 0;
        }
        
        .quest-timer.inline .timer-separator {
            font-size: 14px;
            margin-bottom: 0;
        }
        
        /* Urgency states */
        .quest-timer.warning .timer-value {
            color: var(--warning, #F59E0B);
        }
        
        .quest-timer.urgent .timer-value {
            color: var(--error, #EF4444);
            animation: timerPulse 1s infinite;
        }
        
        @keyframes timerPulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }
        
        .quest-timer.expired .timer-value {
            color: var(--text-secondary, #A1A1AA);
        }
        
        /* Progress ring */
        .timer-ring {
            position: relative;
            width: 120px;
            height: 120px;
        }
        
        .timer-ring svg {
            transform: rotate(-90deg);
        }
        
        .timer-ring-bg {
            fill: none;
            stroke: var(--border, #2D2D44);
            stroke-width: 8;
        }
        
        .timer-ring-fill {
            fill: none;
            stroke: var(--primary, #8B5CF6);
            stroke-width: 8;
            stroke-linecap: round;
            transition: stroke-dashoffset 0.3s ease;
        }
        
        .timer-ring.warning .timer-ring-fill {
            stroke: var(--warning, #F59E0B);
        }
        
        .timer-ring.urgent .timer-ring-fill {
            stroke: var(--error, #EF4444);
        }
        
        .timer-ring-content {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            text-align: center;
        }
        
        .timer-ring-value {
            font-size: 24px;
            font-weight: 700;
            color: var(--text-primary, #FFFFFF);
        }
        
        .timer-ring-label {
            font-size: 11px;
            color: var(--text-secondary, #A1A1AA);
        }
        
        /* Daily reset timer */
        .daily-reset-timer {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 8px 12px;
            background: linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(6, 182, 212, 0.1));
            border-radius: 8px;
        }
        
        .daily-reset-icon {
            font-size: 16px;
        }
        
        .daily-reset-text {
            font-size: 12px;
            color: var(--text-secondary, #A1A1AA);
        }
        
        .daily-reset-time {
            font-weight: 600;
            color: var(--primary, #8B5CF6);
        }
    `;

    // Inject styles
    function injectStyles() {
        if (document.getElementById('quest-timer-styles')) return;
        const style = document.createElement('style');
        style.id = 'quest-timer-styles';
        style.textContent = defaultStyles;
        document.head.appendChild(style);
    }

    /**
     * Parse time value to milliseconds
     */
    function parseTime(time) {
        if (typeof time === 'number') return time;
        if (time instanceof Date) return time.getTime() - Date.now();
        
        // Parse string like "1h 30m", "2d 5h", "45s"
        const units = { d: 86400000, h: 3600000, m: 60000, s: 1000 };
        let ms = 0;
        
        const matches = String(time).matchAll(/(\d+)\s*(d|h|m|s)/gi);
        for (const match of matches) {
            ms += parseInt(match[1]) * (units[match[2].toLowerCase()] || 0);
        }
        
        return ms || parseInt(time) || 0;
    }

    /**
     * Format time breakdown
     */
    function formatTimeBreakdown(ms, options = {}) {
        const { 
            showDays = true, 
            showHours = true,
            showMinutes = true,
            showSeconds = true,
            padZeros = true
        } = options;

        const totalSeconds = Math.max(0, Math.floor(ms / 1000));
        const days = Math.floor(totalSeconds / 86400);
        const hours = Math.floor((totalSeconds % 86400) / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        const pad = (n) => padZeros ? String(n).padStart(2, '0') : String(n);

        return {
            days: showDays ? days : 0,
            hours: showHours ? hours : Math.floor(totalSeconds / 3600),
            minutes: showMinutes ? minutes : Math.floor((totalSeconds % 3600) / 60),
            seconds: showSeconds ? seconds : 0,
            formatted: {
                days: pad(days),
                hours: pad(hours),
                minutes: pad(minutes),
                seconds: pad(seconds)
            },
            totalSeconds,
            isExpired: ms <= 0
        };
    }

    /**
     * Create countdown timer
     */
    function createCountdown(container, options = {}) {
        injectStyles();

        const el = typeof container === 'string' 
            ? document.querySelector(container) 
            : container;

        if (!el) {
            console.error('Timer container not found');
            return null;
        }

        const {
            endTime,
            duration,
            variant = 'default', // default, compact, inline
            showDays = true,
            showHours = true,
            showMinutes = true,
            showSeconds = true,
            warningThreshold = 300000, // 5 minutes
            urgentThreshold = 60000, // 1 minute
            onTick = null,
            onComplete = null,
            autoStart = true
        } = options;

        const id = ++timerId;
        const state = {
            endTime: endTime ? new Date(endTime).getTime() : Date.now() + parseTime(duration),
            isRunning: false,
            intervalId: null
        };

        // Build UI
        el.className = `quest-timer ${variant} ${options.class || ''}`;
        
        const segments = [];
        
        if (showDays) {
            segments.push({ key: 'days', label: 'Days' });
        }
        if (showHours) {
            segments.push({ key: 'hours', label: 'Hours' });
        }
        if (showMinutes) {
            segments.push({ key: 'minutes', label: 'Min' });
        }
        if (showSeconds) {
            segments.push({ key: 'seconds', label: 'Sec' });
        }

        el.innerHTML = segments.map((seg, i) => `
            ${i > 0 ? '<span class="timer-separator">:</span>' : ''}
            <div class="timer-segment">
                <span class="timer-value" data-segment="${seg.key}">00</span>
                <span class="timer-label">${seg.label}</span>
            </div>
        `).join('');

        function update() {
            const remaining = state.endTime - Date.now();
            const time = formatTimeBreakdown(remaining, { showDays, showHours, showMinutes, showSeconds });

            // Update display
            segments.forEach(seg => {
                const valueEl = el.querySelector(`[data-segment="${seg.key}"]`);
                if (valueEl) {
                    valueEl.textContent = time.formatted[seg.key];
                }
            });

            // Update urgency class
            el.classList.remove('warning', 'urgent', 'expired');
            if (remaining <= 0) {
                el.classList.add('expired');
            } else if (remaining <= urgentThreshold) {
                el.classList.add('urgent');
            } else if (remaining <= warningThreshold) {
                el.classList.add('warning');
            }

            // Callbacks
            if (onTick) {
                onTick(time);
            }

            if (remaining <= 0) {
                stop();
                if (onComplete) {
                    onComplete();
                }
                el.dispatchEvent(new CustomEvent('timer-complete'));
            }
        }

        function start() {
            if (state.isRunning) return;
            state.isRunning = true;
            update();
            state.intervalId = setInterval(update, 1000);
            timers.set(id, instance);
        }

        function stop() {
            state.isRunning = false;
            if (state.intervalId) {
                clearInterval(state.intervalId);
                state.intervalId = null;
            }
            timers.delete(id);
        }

        function reset(newDuration) {
            state.endTime = Date.now() + parseTime(newDuration || duration);
            update();
        }

        function extend(time) {
            state.endTime += parseTime(time);
            update();
        }

        function getRemaining() {
            return Math.max(0, state.endTime - Date.now());
        }

        const instance = {
            el,
            id,
            start,
            stop,
            reset,
            extend,
            getRemaining,
            isRunning: () => state.isRunning,
            destroy() {
                stop();
                el.innerHTML = '';
                el.className = '';
            }
        };

        if (autoStart) {
            start();
        }

        return instance;
    }

    /**
     * Create ring timer
     */
    function createRingTimer(container, options = {}) {
        injectStyles();

        const el = typeof container === 'string' 
            ? document.querySelector(container) 
            : container;

        if (!el) return null;

        const {
            duration,
            size = 120,
            strokeWidth = 8,
            warningThreshold = 0.2,
            urgentThreshold = 0.1,
            onComplete = null
        } = options;

        const id = ++timerId;
        const totalMs = parseTime(duration);
        const radius = (size - strokeWidth) / 2;
        const circumference = 2 * Math.PI * radius;

        const state = {
            startTime: Date.now(),
            isRunning: false,
            intervalId: null
        };

        el.className = 'timer-ring';
        el.style.width = `${size}px`;
        el.style.height = `${size}px`;

        el.innerHTML = `
            <svg width="${size}" height="${size}">
                <circle class="timer-ring-bg" cx="${size/2}" cy="${size/2}" r="${radius}"/>
                <circle class="timer-ring-fill" cx="${size/2}" cy="${size/2}" r="${radius}"
                    stroke-dasharray="${circumference}"
                    stroke-dashoffset="0"/>
            </svg>
            <div class="timer-ring-content">
                <div class="timer-ring-value">00:00</div>
                <div class="timer-ring-label">remaining</div>
            </div>
        `;

        const fillCircle = el.querySelector('.timer-ring-fill');
        const valueEl = el.querySelector('.timer-ring-value');

        function update() {
            const elapsed = Date.now() - state.startTime;
            const remaining = Math.max(0, totalMs - elapsed);
            const progress = remaining / totalMs;

            // Update ring
            const offset = circumference * (1 - progress);
            fillCircle.style.strokeDashoffset = offset;

            // Update value
            const seconds = Math.ceil(remaining / 1000);
            const mins = Math.floor(seconds / 60);
            const secs = seconds % 60;
            valueEl.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

            // Urgency
            el.classList.remove('warning', 'urgent');
            if (progress <= urgentThreshold) {
                el.classList.add('urgent');
            } else if (progress <= warningThreshold) {
                el.classList.add('warning');
            }

            if (remaining <= 0) {
                stop();
                if (onComplete) onComplete();
            }
        }

        function start() {
            if (state.isRunning) return;
            state.isRunning = true;
            state.startTime = Date.now();
            update();
            state.intervalId = setInterval(update, 100);
        }

        function stop() {
            state.isRunning = false;
            if (state.intervalId) {
                clearInterval(state.intervalId);
                state.intervalId = null;
            }
        }

        return { el, id, start, stop, destroy: () => { stop(); el.innerHTML = ''; } };
    }

    /**
     * Create daily reset timer
     */
    function createDailyResetTimer(container, options = {}) {
        injectStyles();

        const el = typeof container === 'string' 
            ? document.querySelector(container) 
            : container;

        if (!el) return null;

        const { resetHour = 0, timezone = 'UTC' } = options;

        function getNextReset() {
            const now = new Date();
            const reset = new Date();
            
            if (timezone === 'UTC') {
                reset.setUTCHours(resetHour, 0, 0, 0);
                if (reset <= now) {
                    reset.setUTCDate(reset.getUTCDate() + 1);
                }
            } else {
                reset.setHours(resetHour, 0, 0, 0);
                if (reset <= now) {
                    reset.setDate(reset.getDate() + 1);
                }
            }
            
            return reset;
        }

        el.className = 'daily-reset-timer';

        function update() {
            const remaining = getNextReset() - Date.now();
            const time = formatTimeBreakdown(remaining);
            
            el.innerHTML = `
                <span class="daily-reset-icon">🔄</span>
                <span class="daily-reset-text">
                    Daily reset in 
                    <span class="daily-reset-time">
                        ${time.formatted.hours}:${time.formatted.minutes}:${time.formatted.seconds}
                    </span>
                </span>
            `;
        }

        update();
        const intervalId = setInterval(update, 1000);

        return {
            el,
            getNextReset,
            destroy() {
                clearInterval(intervalId);
                el.innerHTML = '';
            }
        };
    }

    /**
     * Stop all active timers
     */
    function stopAll() {
        timers.forEach(timer => timer.stop());
        timers.clear();
    }

    // Export API
    window.QuestTimer = {
        createCountdown,
        createRingTimer,
        createDailyResetTimer,
        parseTime,
        formatTimeBreakdown,
        stopAll,
        getActiveTimers: () => Array.from(timers.values())
    };

    console.log('⏱️ QuestTimer module initialized');
})();
