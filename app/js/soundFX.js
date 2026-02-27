/**
 * Quest Mini - Sound Effects Module
 * Audio feedback using Web Audio API (no external files needed)
 */

const SoundFX = (function() {
  'use strict';

  // Audio context (lazily initialized)
  let audioContext = null;
  
  // Settings
  let enabled = true;
  let volume = 0.3;

  /**
   * Initialize audio context (must be called after user interaction)
   */
  function initContext() {
    if (audioContext) return audioContext;
    
    try {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
      return audioContext;
    } catch (e) {
      console.warn('Web Audio API not supported');
      return null;
    }
  }

  /**
   * Resume audio context if suspended
   */
  async function ensureResumed() {
    const ctx = initContext();
    if (ctx && ctx.state === 'suspended') {
      await ctx.resume();
    }
    return ctx;
  }

  /**
   * Load settings from localStorage
   */
  function loadSettings() {
    try {
      const saved = localStorage.getItem('questmini_sound');
      if (saved) {
        const settings = JSON.parse(saved);
        enabled = settings.enabled !== false;
        volume = settings.volume ?? 0.3;
      }
    } catch (e) {
      // Use defaults
    }
  }

  /**
   * Save settings to localStorage
   */
  function saveSettings() {
    try {
      localStorage.setItem('questmini_sound', JSON.stringify({
        enabled,
        volume
      }));
    } catch (e) {
      // Ignore
    }
  }

  /**
   * Create an oscillator for a tone
   */
  function createTone(ctx, frequency, type, duration, startTime) {
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, startTime);
    
    gainNode.gain.setValueAtTime(volume, startTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    return { oscillator, gainNode };
  }

  /**
   * Play a success sound (ascending notes)
   */
  async function success() {
    if (!enabled) return;
    
    const ctx = await ensureResumed();
    if (!ctx) return;

    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
    
    notes.forEach((freq, i) => {
      const { oscillator } = createTone(ctx, freq, 'sine', 0.15, now + i * 0.1);
      oscillator.start(now + i * 0.1);
      oscillator.stop(now + i * 0.1 + 0.15);
    });
  }

  /**
   * Play an error sound (descending buzz)
   */
  async function error() {
    if (!enabled) return;
    
    const ctx = await ensureResumed();
    if (!ctx) return;

    const now = ctx.currentTime;
    const { oscillator, gainNode } = createTone(ctx, 200, 'sawtooth', 0.3, now);
    
    oscillator.frequency.exponentialRampToValueAtTime(100, now + 0.3);
    gainNode.gain.setValueAtTime(volume * 0.5, now);
    
    oscillator.start(now);
    oscillator.stop(now + 0.3);
  }

  /**
   * Play a click/tap sound
   */
  async function click() {
    if (!enabled) return;
    
    const ctx = await ensureResumed();
    if (!ctx) return;

    const now = ctx.currentTime;
    const { oscillator, gainNode } = createTone(ctx, 800, 'sine', 0.05, now);
    
    gainNode.gain.setValueAtTime(volume * 0.3, now);
    
    oscillator.start(now);
    oscillator.stop(now + 0.05);
  }

  /**
   * Play a notification sound
   */
  async function notification() {
    if (!enabled) return;
    
    const ctx = await ensureResumed();
    if (!ctx) return;

    const now = ctx.currentTime;
    const notes = [880, 1100]; // A5, C#6
    
    notes.forEach((freq, i) => {
      const { oscillator } = createTone(ctx, freq, 'sine', 0.1, now + i * 0.15);
      oscillator.start(now + i * 0.15);
      oscillator.stop(now + i * 0.15 + 0.1);
    });
  }

  /**
   * Play a coin/reward sound
   */
  async function coin() {
    if (!enabled) return;
    
    const ctx = await ensureResumed();
    if (!ctx) return;

    const now = ctx.currentTime;
    
    // First note
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(987.77, now); // B5
    gain1.gain.setValueAtTime(volume, now);
    gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.1);

    // Second note (higher)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1318.51, now + 0.1); // E6
    gain2.gain.setValueAtTime(volume, now + 0.1);
    gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.1);
    osc2.stop(now + 0.3);
  }

  /**
   * Play a level up/achievement sound
   */
  async function levelUp() {
    if (!enabled) return;
    
    const ctx = await ensureResumed();
    if (!ctx) return;

    const now = ctx.currentTime;
    const notes = [
      { freq: 523.25, time: 0, dur: 0.1 },      // C5
      { freq: 659.25, time: 0.1, dur: 0.1 },    // E5
      { freq: 783.99, time: 0.2, dur: 0.1 },    // G5
      { freq: 1046.5, time: 0.3, dur: 0.3 }     // C6
    ];
    
    notes.forEach(({ freq, time, dur }) => {
      const { oscillator } = createTone(ctx, freq, 'triangle', dur, now + time);
      oscillator.start(now + time);
      oscillator.stop(now + time + dur);
    });
  }

  /**
   * Play a streak milestone sound
   */
  async function streak() {
    if (!enabled) return;
    
    const ctx = await ensureResumed();
    if (!ctx) return;

    const now = ctx.currentTime;
    const notes = [
      { freq: 392, time: 0 },      // G4
      { freq: 523.25, time: 0.08 },  // C5
      { freq: 659.25, time: 0.16 },  // E5
      { freq: 783.99, time: 0.24 },  // G5
      { freq: 1046.5, time: 0.32 }   // C6
    ];
    
    notes.forEach(({ freq, time }) => {
      const { oscillator } = createTone(ctx, freq, 'sine', 0.15, now + time);
      oscillator.start(now + time);
      oscillator.stop(now + time + 0.15);
    });
  }

  /**
   * Play a warning sound
   */
  async function warning() {
    if (!enabled) return;
    
    const ctx = await ensureResumed();
    if (!ctx) return;

    const now = ctx.currentTime;
    
    for (let i = 0; i < 2; i++) {
      const { oscillator } = createTone(ctx, 440, 'triangle', 0.1, now + i * 0.15);
      oscillator.start(now + i * 0.15);
      oscillator.stop(now + i * 0.15 + 0.1);
    }
  }

  /**
   * Play a whoosh/transition sound
   */
  async function whoosh() {
    if (!enabled) return;
    
    const ctx = await ensureResumed();
    if (!ctx) return;

    const now = ctx.currentTime;
    
    // White noise with filter sweep
    const bufferSize = ctx.sampleRate * 0.2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(500, now);
    filter.frequency.exponentialRampToValueAtTime(3000, now + 0.1);
    filter.frequency.exponentialRampToValueAtTime(500, now + 0.2);
    filter.Q.value = 1;
    
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(volume * 0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
    
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    
    noise.start(now);
    noise.stop(now + 0.2);
  }

  /**
   * Set enabled state
   */
  function setEnabled(value) {
    enabled = !!value;
    saveSettings();
  }

  /**
   * Set volume (0-1)
   */
  function setVolume(value) {
    volume = Math.max(0, Math.min(1, value));
    saveSettings();
  }

  /**
   * Get settings
   */
  function getSettings() {
    return {
      enabled,
      volume,
      supported: !!(window.AudioContext || window.webkitAudioContext)
    };
  }

  /**
   * Test all sounds
   */
  async function testAll() {
    await click();
    await new Promise(r => setTimeout(r, 300));
    await notification();
    await new Promise(r => setTimeout(r, 400));
    await coin();
    await new Promise(r => setTimeout(r, 400));
    await success();
    await new Promise(r => setTimeout(r, 500));
    await levelUp();
    await new Promise(r => setTimeout(r, 600));
    await streak();
  }

  // Initialize settings
  loadSettings();

  // Public API
  return {
    // Sound effects
    success,
    error,
    click,
    notification,
    coin,
    levelUp,
    streak,
    warning,
    whoosh,
    
    // Configuration
    setEnabled,
    setVolume,
    getSettings,
    testAll,
    
    // Utility
    initContext,
    ensureResumed
  };
})();

// Make available globally
window.SoundFX = SoundFX;
