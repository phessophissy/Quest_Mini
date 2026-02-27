/**
 * Quest Mini - Achievement Badges System
 * Gamification with unlockable achievements
 */

const Achievements = (function() {
  'use strict';

  // Achievement definitions
  const achievementDefs = {
    // Quest achievements
    firstQuest: {
      id: 'firstQuest',
      name: 'First Steps',
      description: 'Complete your first quest',
      icon: '🎯',
      category: 'quests',
      points: 10,
      rarity: 'common'
    },
    questStreak3: {
      id: 'questStreak3',
      name: 'Getting Started',
      description: 'Maintain a 3-day streak',
      icon: '🔥',
      category: 'streaks',
      points: 25,
      rarity: 'common'
    },
    questStreak7: {
      id: 'questStreak7',
      name: 'Week Warrior',
      description: 'Maintain a 7-day streak',
      icon: '⚔️',
      category: 'streaks',
      points: 50,
      rarity: 'uncommon'
    },
    questStreak30: {
      id: 'questStreak30',
      name: 'Monthly Master',
      description: 'Maintain a 30-day streak',
      icon: '👑',
      category: 'streaks',
      points: 200,
      rarity: 'rare'
    },
    questStreak100: {
      id: 'questStreak100',
      name: 'Century Champion',
      description: 'Maintain a 100-day streak',
      icon: '🏆',
      category: 'streaks',
      points: 1000,
      rarity: 'legendary'
    },
    
    // Token achievements
    firstToken: {
      id: 'firstToken',
      name: 'Token Hunter',
      description: 'Earn your first QUEST token',
      icon: '💎',
      category: 'tokens',
      points: 10,
      rarity: 'common'
    },
    earn100Tokens: {
      id: 'earn100Tokens',
      name: 'Century Club',
      description: 'Earn 100 QUEST tokens',
      icon: '💰',
      category: 'tokens',
      points: 100,
      rarity: 'uncommon'
    },
    earn1000Tokens: {
      id: 'earn1000Tokens',
      name: 'Token Tycoon',
      description: 'Earn 1,000 QUEST tokens',
      icon: '🏦',
      category: 'tokens',
      points: 500,
      rarity: 'rare'
    },
    
    // Special achievements
    earlyAdopter: {
      id: 'earlyAdopter',
      name: 'Early Adopter',
      description: 'Joined during beta',
      icon: '⭐',
      category: 'special',
      points: 100,
      rarity: 'rare'
    },
    perfectWeek: {
      id: 'perfectWeek',
      name: 'Perfect Week',
      description: 'Complete all quests for 7 consecutive days',
      icon: '💯',
      category: 'quests',
      points: 150,
      rarity: 'rare'
    },
    nightOwl: {
      id: 'nightOwl',
      name: 'Night Owl',
      description: 'Complete a quest after midnight',
      icon: '🦉',
      category: 'special',
      points: 25,
      rarity: 'uncommon'
    },
    earlyBird: {
      id: 'earlyBird',
      name: 'Early Bird',
      description: 'Complete a quest before 6 AM',
      icon: '🌅',
      category: 'special',
      points: 25,
      rarity: 'uncommon'
    }
  };

  // Rarity colors
  const rarityColors = {
    common: '#A1A1AA',
    uncommon: '#10B981',
    rare: '#3B82F6',
    epic: '#8B5CF6',
    legendary: '#F59E0B'
  };

  // User achievements (loaded from storage)
  let unlockedAchievements = new Map();
  let totalPoints = 0;

  /**
   * Add styles
   */
  function addStyles() {
    if (document.getElementById('achievement-styles')) return;

    const styles = document.createElement('style');
    styles.id = 'achievement-styles';
    styles.textContent = `
      .achievement-popup {
        position: fixed;
        top: 20px;
        right: 20px;
        background: var(--bg-card, #1A1A2E);
        border-radius: 12px;
        padding: 16px;
        display: flex;
        align-items: center;
        gap: 16px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
        border: 1px solid var(--border, #2D2D44);
        z-index: 10001;
        transform: translateX(120%);
        transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        max-width: 350px;
      }
      
      .achievement-popup.show {
        transform: translateX(0);
      }
      
      .achievement-icon {
        width: 56px;
        height: 56px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 28px;
        flex-shrink: 0;
        position: relative;
        overflow: hidden;
      }
      
      .achievement-icon::before {
        content: '';
        position: absolute;
        inset: 0;
        background: currentColor;
        opacity: 0.15;
      }
      
      .achievement-content {
        flex: 1;
        min-width: 0;
      }
      
      .achievement-label {
        font-size: 11px;
        font-weight: 500;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-bottom: 4px;
      }
      
      .achievement-name {
        font-size: 16px;
        font-weight: 600;
        color: var(--text-primary, #FFFFFF);
        margin-bottom: 2px;
      }
      
      .achievement-description {
        font-size: 13px;
        color: var(--text-secondary, #A1A1AA);
      }
      
      .achievement-points {
        font-size: 12px;
        font-weight: 500;
        margin-top: 4px;
      }
      
      /* Badge grid */
      .achievements-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
        gap: 12px;
        padding: 16px;
      }
      
      .achievement-badge {
        background: var(--bg-card, #1A1A2E);
        border: 1px solid var(--border, #2D2D44);
        border-radius: 12px;
        padding: 16px;
        text-align: center;
        transition: all 0.2s;
      }
      
      .achievement-badge:hover {
        border-color: var(--primary, #8B5CF6);
        transform: translateY(-2px);
      }
      
      .achievement-badge.locked {
        opacity: 0.5;
        filter: grayscale(1);
      }
      
      .achievement-badge.locked .achievement-badge-icon {
        filter: blur(2px);
      }
      
      .achievement-badge-icon {
        font-size: 32px;
        margin-bottom: 8px;
      }
      
      .achievement-badge-name {
        font-size: 13px;
        font-weight: 600;
        color: var(--text-primary, #FFFFFF);
        margin-bottom: 4px;
      }
      
      .achievement-badge-desc {
        font-size: 11px;
        color: var(--text-secondary, #A1A1AA);
      }
      
      .achievement-badge-points {
        font-size: 11px;
        font-weight: 500;
        margin-top: 8px;
      }
      
      /* Shine animation for new unlocks */
      @keyframes badge-shine {
        0% { background-position: -100% 0; }
        100% { background-position: 200% 0; }
      }
      
      .achievement-popup .achievement-icon::after {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 50%;
        height: 100%;
        background: linear-gradient(
          90deg,
          transparent,
          rgba(255, 255, 255, 0.3),
          transparent
        );
        animation: badge-shine 1.5s ease-in-out infinite;
      }
    `;
    document.head.appendChild(styles);
  }

  /**
   * Load unlocked achievements from storage
   */
  function loadAchievements() {
    try {
      const saved = localStorage.getItem('questmini_achievements');
      if (saved) {
        const data = JSON.parse(saved);
        unlockedAchievements = new Map(Object.entries(data.unlocked || {}));
        totalPoints = data.points || 0;
      }
    } catch (e) {
      console.warn('Failed to load achievements:', e);
    }
  }

  /**
   * Save achievements to storage
   */
  function saveAchievements() {
    try {
      const data = {
        unlocked: Object.fromEntries(unlockedAchievements),
        points: totalPoints
      };
      localStorage.setItem('questmini_achievements', JSON.stringify(data));
    } catch (e) {
      console.warn('Failed to save achievements:', e);
    }
  }

  /**
   * Unlock an achievement
   */
  function unlock(achievementId) {
    if (unlockedAchievements.has(achievementId)) {
      return false; // Already unlocked
    }

    const achievement = achievementDefs[achievementId];
    if (!achievement) {
      console.warn('Unknown achievement:', achievementId);
      return false;
    }

    // Record unlock
    unlockedAchievements.set(achievementId, {
      unlockedAt: new Date().toISOString()
    });
    totalPoints += achievement.points;

    // Save
    saveAchievements();

    // Show popup
    showUnlockPopup(achievement);

    // Play effects
    playUnlockEffects(achievement);

    // Dispatch event
    document.dispatchEvent(new CustomEvent('achievementUnlocked', {
      detail: { achievement, totalPoints }
    }));

    return true;
  }

  /**
   * Show unlock popup
   */
  function showUnlockPopup(achievement) {
    addStyles();

    const popup = document.createElement('div');
    popup.className = 'achievement-popup';
    popup.style.color = rarityColors[achievement.rarity] || rarityColors.common;
    
    popup.innerHTML = `
      <div class="achievement-icon">${achievement.icon}</div>
      <div class="achievement-content">
        <div class="achievement-label" style="color: ${rarityColors[achievement.rarity]}">
          Achievement Unlocked!
        </div>
        <div class="achievement-name">${achievement.name}</div>
        <div class="achievement-description">${achievement.description}</div>
        <div class="achievement-points" style="color: ${rarityColors[achievement.rarity]}">
          +${achievement.points} points
        </div>
      </div>
    `;

    document.body.appendChild(popup);

    // Show
    requestAnimationFrame(() => {
      popup.classList.add('show');
    });

    // Auto hide
    setTimeout(() => {
      popup.classList.remove('show');
      setTimeout(() => popup.remove(), 400);
    }, 5000);
  }

  /**
   * Play unlock effects
   */
  function playUnlockEffects(achievement) {
    // Haptic feedback
    if (window.Haptics) {
      Haptics.celebration();
    }

    // Sound effect
    if (window.SoundFX) {
      SoundFX.levelUp();
    }

    // Confetti for rare+ achievements
    if (['rare', 'epic', 'legendary'].includes(achievement.rarity) && window.Confetti) {
      Confetti.celebrate();
    }
  }

  /**
   * Check if achievement is unlocked
   */
  function isUnlocked(achievementId) {
    return unlockedAchievements.has(achievementId);
  }

  /**
   * Get all achievements with status
   */
  function getAll() {
    return Object.values(achievementDefs).map(a => ({
      ...a,
      unlocked: unlockedAchievements.has(a.id),
      unlockedAt: unlockedAchievements.get(a.id)?.unlockedAt || null
    }));
  }

  /**
   * Get achievements by category
   */
  function getByCategory(category) {
    return getAll().filter(a => a.category === category);
  }

  /**
   * Get total points
   */
  function getPoints() {
    return totalPoints;
  }

  /**
   * Get unlock progress
   */
  function getProgress() {
    const total = Object.keys(achievementDefs).length;
    const unlocked = unlockedAchievements.size;
    return {
      unlocked,
      total,
      percentage: Math.round((unlocked / total) * 100)
    };
  }

  /**
   * Create achievements display grid
   */
  function createGrid(container, options = {}) {
    addStyles();

    const { category = null, showLocked = true } = options;
    
    let achievements = category ? getByCategory(category) : getAll();
    if (!showLocked) {
      achievements = achievements.filter(a => a.unlocked);
    }

    const grid = document.createElement('div');
    grid.className = 'achievements-grid';

    achievements.forEach(a => {
      const badge = document.createElement('div');
      badge.className = `achievement-badge ${a.unlocked ? '' : 'locked'}`;
      badge.style.borderColor = a.unlocked ? rarityColors[a.rarity] : '';
      
      badge.innerHTML = `
        <div class="achievement-badge-icon">${a.unlocked ? a.icon : '🔒'}</div>
        <div class="achievement-badge-name">${a.name}</div>
        <div class="achievement-badge-desc">${a.description}</div>
        <div class="achievement-badge-points" style="color: ${rarityColors[a.rarity]}">
          ${a.points} pts • ${a.rarity}
        </div>
      `;

      grid.appendChild(badge);
    });

    if (container) {
      container.appendChild(grid);
    }

    return grid;
  }

  /**
   * Check quest-based achievements
   */
  function checkQuestAchievements(stats) {
    const { questsCompleted = 0, currentStreak = 0, tokensEarned = 0 } = stats;

    // First quest
    if (questsCompleted >= 1) unlock('firstQuest');

    // Streak achievements
    if (currentStreak >= 3) unlock('questStreak3');
    if (currentStreak >= 7) unlock('questStreak7');
    if (currentStreak >= 30) unlock('questStreak30');
    if (currentStreak >= 100) unlock('questStreak100');

    // Token achievements
    if (tokensEarned >= 1) unlock('firstToken');
    if (tokensEarned >= 100) unlock('earn100Tokens');
    if (tokensEarned >= 1000) unlock('earn1000Tokens');

    // Time-based achievements
    const hour = new Date().getHours();
    if (hour >= 0 && hour < 5) unlock('nightOwl');
    if (hour >= 4 && hour < 6) unlock('earlyBird');
  }

  // Initialize
  loadAchievements();

  // Public API
  return {
    unlock,
    isUnlocked,
    getAll,
    getByCategory,
    getPoints,
    getProgress,
    createGrid,
    checkQuestAchievements,
    definitions: achievementDefs,
    rarityColors
  };
})();

// Make available globally
window.Achievements = Achievements;
