/**
 * Quest Mini - Streak Badge System
 * Visual badges for streak milestones
 */

const StreakBadges = (function() {
  'use strict';

  // Badge definitions
  const BADGES = [
    { days: 3, emoji: '🔥', name: 'Getting Started', color: '#F59E0B' },
    { days: 7, emoji: '⭐', name: 'Week Warrior', color: '#8B5CF6' },
    { days: 14, emoji: '💎', name: 'Two Week Titan', color: '#06B6D4' },
    { days: 30, emoji: '🏆', name: 'Monthly Master', color: '#10B981' },
    { days: 60, emoji: '👑', name: 'Diamond Hands', color: '#EC4899' },
    { days: 100, emoji: '🌟', name: 'Century Legend', color: '#F59E0B' }
  ];

  let container = null;
  let currentStreak = 0;

  /**
   * Get earned badges for a streak count
   */
  function getEarnedBadges(streak) {
    return BADGES.filter(badge => streak >= badge.days);
  }

  /**
   * Get next badge to earn
   */
  function getNextBadge(streak) {
    return BADGES.find(badge => streak < badge.days);
  }

  /**
   * Calculate progress to next badge (0-100)
   */
  function getProgressToNext(streak) {
    const next = getNextBadge(streak);
    if (!next) return 100; // All badges earned

    const earned = getEarnedBadges(streak);
    const prevDays = earned.length > 0 ? earned[earned.length - 1].days : 0;
    const progress = ((streak - prevDays) / (next.days - prevDays)) * 100;
    return Math.min(Math.max(progress, 0), 100);
  }

  /**
   * Create badge element
   */
  function createBadgeElement(badge, earned = true) {
    const div = document.createElement('div');
    div.className = `streak-badge ${earned ? 'earned' : 'locked'}`;
    div.title = `${badge.name} (${badge.days} days)`;
    div.innerHTML = `
      <span class="badge-emoji" style="${earned ? '' : 'filter: grayscale(1);'}">${badge.emoji}</span>
      <span class="badge-days">${badge.days}d</span>
    `;
    if (earned) {
      div.style.borderColor = badge.color;
      div.style.boxShadow = `0 0 8px ${badge.color}40`;
    }
    return div;
  }

  /**
   * Create the badge display container
   */
  function createBadgeContainer() {
    const wrapper = document.createElement('div');
    wrapper.id = 'streak-badges';
    wrapper.className = 'streak-badges-container';
    wrapper.innerHTML = `
      <div class="badges-header">
        <span class="badges-title">🏅 Streak Badges</span>
        <span class="badges-count" id="badges-count">0/${BADGES.length}</span>
      </div>
      <div class="badges-grid" id="badges-grid"></div>
      <div class="next-badge-info" id="next-badge-info"></div>
    `;
    return wrapper;
  }

  /**
   * Update the badge display
   */
  function update(streak) {
    currentStreak = streak;

    if (!container) {
      init();
    }

    const earned = getEarnedBadges(streak);
    const next = getNextBadge(streak);
    const grid = document.getElementById('badges-grid');
    const count = document.getElementById('badges-count');
    const nextInfo = document.getElementById('next-badge-info');

    if (!grid) return;

    // Update badge grid
    grid.innerHTML = '';
    BADGES.forEach(badge => {
      const isEarned = streak >= badge.days;
      grid.appendChild(createBadgeElement(badge, isEarned));
    });

    // Update count
    if (count) {
      count.textContent = `${earned.length}/${BADGES.length}`;
    }

    // Update next badge info
    if (nextInfo) {
      if (next) {
        const daysLeft = next.days - streak;
        const progress = getProgressToNext(streak);
        nextInfo.innerHTML = `
          <div class="next-badge-progress">
            <span>Next: ${next.emoji} ${next.name}</span>
            <span>${daysLeft} day${daysLeft !== 1 ? 's' : ''} to go</span>
          </div>
          <div class="next-badge-bar">
            <div class="next-badge-fill" style="width: ${progress}%; background: ${next.color};"></div>
          </div>
        `;
      } else {
        nextInfo.innerHTML = `
          <div class="all-badges-earned">
            🎉 All badges earned! You're a legend!
          </div>
        `;
      }
    }
  }

  /**
   * Initialize the badge system
   */
  function init(targetSelector = '.boost-section') {
    const target = document.querySelector(targetSelector);
    if (!target) {
      console.warn('Badge container target not found');
      return;
    }

    // Check if already initialized
    container = document.getElementById('streak-badges');
    if (!container) {
      container = createBadgeContainer();
      target.parentNode.insertBefore(container, target);
    }

    // Add styles if not present
    if (!document.getElementById('streak-badges-styles')) {
      const styles = document.createElement('style');
      styles.id = 'streak-badges-styles';
      styles.textContent = `
        .streak-badges-container {
          background: var(--bg-card);
          border-radius: 16px;
          padding: 16px;
          margin-top: 24px;
          border: 1px solid var(--border);
        }
        
        .badges-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }
        
        .badges-title {
          font-weight: 600;
          font-size: 14px;
        }
        
        .badges-count {
          font-size: 12px;
          color: var(--text-secondary);
          background: var(--bg-card-hover);
          padding: 4px 8px;
          border-radius: 8px;
        }
        
        .badges-grid {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          justify-content: center;
          margin-bottom: 12px;
        }
        
        .streak-badge {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 8px;
          background: var(--bg-card-hover);
          border-radius: 12px;
          border: 2px solid var(--border);
          min-width: 48px;
          transition: all 0.3s ease;
        }
        
        .streak-badge.earned {
          background: rgba(139, 92, 246, 0.1);
        }
        
        .streak-badge.locked {
          opacity: 0.5;
        }
        
        .badge-emoji {
          font-size: 20px;
          line-height: 1;
        }
        
        .badge-days {
          font-size: 10px;
          color: var(--text-secondary);
          margin-top: 4px;
        }
        
        .next-badge-info {
          padding-top: 12px;
          border-top: 1px solid var(--border);
        }
        
        .next-badge-progress {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          color: var(--text-secondary);
          margin-bottom: 6px;
        }
        
        .next-badge-bar {
          height: 6px;
          background: var(--border);
          border-radius: 3px;
          overflow: hidden;
        }
        
        .next-badge-fill {
          height: 100%;
          border-radius: 3px;
          transition: width 0.5s ease;
        }
        
        .all-badges-earned {
          text-align: center;
          font-size: 13px;
          color: var(--success);
        }
      `;
      document.head.appendChild(styles);
    }

    console.log('Streak badges initialized');
  }

  /**
   * Destroy the badge system
   */
  function destroy() {
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
    }
    container = null;
  }

  // Public API
  return {
    init,
    update,
    destroy,
    getEarnedBadges,
    getNextBadge,
    getProgressToNext,
    BADGES
  };
})();

// Make available globally
window.StreakBadges = StreakBadges;
