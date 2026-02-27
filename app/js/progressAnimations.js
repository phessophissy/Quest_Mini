/**
 * Quest Mini - Animated Progress Components
 * Smooth, animated progress indicators
 */

const ProgressAnimations = (function() {
  'use strict';

  /**
   * Animate a number from start to end
   */
  function animateNumber(element, start, end, duration = 1000, formatter = null) {
    if (!element) return;
    
    const startTime = performance.now();
    const delta = end - start;
    
    function update(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function (ease-out-cubic)
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = start + delta * eased;
      
      if (formatter) {
        element.textContent = formatter(current);
      } else {
        element.textContent = Math.round(current).toLocaleString();
      }
      
      if (progress < 1) {
        requestAnimationFrame(update);
      } else {
        // Ensure final value is exact
        element.textContent = formatter ? formatter(end) : Math.round(end).toLocaleString();
      }
    }
    
    requestAnimationFrame(update);
  }

  /**
   * Animate a progress bar
   */
  function animateProgressBar(element, targetPercent, duration = 800) {
    if (!element) return;
    
    const currentWidth = parseFloat(element.style.width) || 0;
    const startTime = performance.now();
    const delta = targetPercent - currentWidth;
    
    function update(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Ease-out-expo
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      const current = currentWidth + delta * eased;
      
      element.style.width = `${current}%`;
      
      if (progress < 1) {
        requestAnimationFrame(update);
      }
    }
    
    requestAnimationFrame(update);
  }

  /**
   * Create a circular progress indicator
   */
  function createCircularProgress(options = {}) {
    const {
      size = 80,
      strokeWidth = 6,
      color = 'var(--primary, #8B5CF6)',
      bgColor = 'var(--border, #2D2D44)',
      showText = true,
      animated = true
    } = options;

    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;

    const container = document.createElement('div');
    container.className = 'circular-progress';
    container.style.cssText = `
      position: relative;
      width: ${size}px;
      height: ${size}px;
      display: inline-block;
    `;

    container.innerHTML = `
      <svg width="${size}" height="${size}" style="transform: rotate(-90deg);">
        <circle
          class="progress-bg"
          cx="${size/2}"
          cy="${size/2}"
          r="${radius}"
          fill="none"
          stroke="${bgColor}"
          stroke-width="${strokeWidth}"
        />
        <circle
          class="progress-fill"
          cx="${size/2}"
          cy="${size/2}"
          r="${radius}"
          fill="none"
          stroke="${color}"
          stroke-width="${strokeWidth}"
          stroke-linecap="round"
          stroke-dasharray="${circumference}"
          stroke-dashoffset="${circumference}"
          style="transition: stroke-dashoffset ${animated ? '0.8s' : '0s'} ease-out;"
        />
      </svg>
      ${showText ? `
        <div class="progress-text" style="
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          font-size: ${size * 0.2}px;
          font-weight: 600;
          color: var(--text-primary, #FFFFFF);
        ">0%</div>
      ` : ''}
    `;

    // Add update method
    container.setProgress = function(percent) {
      const fill = this.querySelector('.progress-fill');
      const text = this.querySelector('.progress-text');
      const offset = circumference - (percent / 100) * circumference;
      
      if (fill) {
        fill.style.strokeDashoffset = offset;
      }
      
      if (text && animated) {
        animateNumber(text, parseFloat(text.textContent) || 0, percent, 800, v => `${Math.round(v)}%`);
      } else if (text) {
        text.textContent = `${Math.round(percent)}%`;
      }
    };

    return container;
  }

  /**
   * Create a step progress indicator
   */
  function createStepProgress(steps, currentStep = 0) {
    const container = document.createElement('div');
    container.className = 'step-progress';
    container.style.cssText = `
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
      padding: 16px 0;
    `;

    steps.forEach((step, index) => {
      const isCompleted = index < currentStep;
      const isCurrent = index === currentStep;
      
      // Step circle
      const stepEl = document.createElement('div');
      stepEl.className = `step-item ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''}`;
      stepEl.style.cssText = `
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
        flex: 0 0 auto;
      `;
      
      stepEl.innerHTML = `
        <div class="step-circle" style="
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 600;
          transition: all 0.3s ease;
          ${isCompleted 
            ? 'background: var(--success, #10B981); color: white;' 
            : isCurrent 
              ? 'background: var(--primary, #8B5CF6); color: white; box-shadow: 0 0 0 4px rgba(139, 92, 246, 0.2);' 
              : 'background: var(--bg-card, #1A1A2E); color: var(--text-secondary, #A1A1AA); border: 2px solid var(--border, #2D2D44);'}
        ">
          ${isCompleted 
            ? '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg>' 
            : index + 1}
        </div>
        <span class="step-label" style="
          font-size: 11px;
          color: ${isCurrent ? 'var(--text-primary, #FFFFFF)' : 'var(--text-secondary, #A1A1AA)'};
          text-align: center;
          max-width: 60px;
        ">${step}</span>
      `;
      
      container.appendChild(stepEl);
      
      // Connector line (except for last step)
      if (index < steps.length - 1) {
        const connector = document.createElement('div');
        connector.className = 'step-connector';
        connector.style.cssText = `
          flex: 1;
          height: 2px;
          margin: 0 8px;
          margin-bottom: 24px;
          background: ${isCompleted ? 'var(--success, #10B981)' : 'var(--border, #2D2D44)'};
          transition: background 0.3s ease;
        `;
        container.appendChild(connector);
      }
    });

    // Add update method
    container.setStep = function(step) {
      const items = this.querySelectorAll('.step-item');
      const connectors = this.querySelectorAll('.step-connector');
      
      items.forEach((item, index) => {
        const circle = item.querySelector('.step-circle');
        const label = item.querySelector('.step-label');
        const isCompleted = index < step;
        const isCurrent = index === step;
        
        item.classList.toggle('completed', isCompleted);
        item.classList.toggle('current', isCurrent);
        
        if (circle) {
          if (isCompleted) {
            circle.style.background = 'var(--success, #10B981)';
            circle.style.color = 'white';
            circle.style.border = 'none';
            circle.style.boxShadow = 'none';
            circle.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg>';
          } else if (isCurrent) {
            circle.style.background = 'var(--primary, #8B5CF6)';
            circle.style.color = 'white';
            circle.style.border = 'none';
            circle.style.boxShadow = '0 0 0 4px rgba(139, 92, 246, 0.2)';
            circle.textContent = index + 1;
          } else {
            circle.style.background = 'var(--bg-card, #1A1A2E)';
            circle.style.color = 'var(--text-secondary, #A1A1AA)';
            circle.style.border = '2px solid var(--border, #2D2D44)';
            circle.style.boxShadow = 'none';
            circle.textContent = index + 1;
          }
        }
        
        if (label) {
          label.style.color = isCurrent ? 'var(--text-primary, #FFFFFF)' : 'var(--text-secondary, #A1A1AA)';
        }
      });
      
      connectors.forEach((connector, index) => {
        connector.style.background = index < step ? 'var(--success, #10B981)' : 'var(--border, #2D2D44)';
      });
    };

    return container;
  }

  /**
   * Create a pulsing dot indicator
   */
  function createPulsingDot(color = 'var(--success, #10B981)') {
    const dot = document.createElement('span');
    dot.className = 'pulsing-dot';
    dot.style.cssText = `
      display: inline-block;
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: ${color};
      animation: pulse-dot 1.5s ease-in-out infinite;
    `;

    if (!document.getElementById('pulsing-dot-styles')) {
      const styles = document.createElement('style');
      styles.id = 'pulsing-dot-styles';
      styles.textContent = `
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.8); }
        }
      `;
      document.head.appendChild(styles);
    }

    return dot;
  }

  /**
   * Create a loading spinner
   */
  function createSpinner(size = 24, color = 'var(--primary, #8B5CF6)') {
    const spinner = document.createElement('div');
    spinner.className = 'loading-spinner';
    spinner.innerHTML = `
      <svg viewBox="0 0 24 24" width="${size}" height="${size}">
        <circle 
          cx="12" cy="12" r="10" 
          fill="none" 
          stroke="${color}" 
          stroke-width="3"
          stroke-dasharray="31.4 31.4"
          stroke-linecap="round"
        >
          <animateTransform
            attributeName="transform"
            type="rotate"
            from="0 12 12"
            to="360 12 12"
            dur="1s"
            repeatCount="indefinite"
          />
        </circle>
      </svg>
    `;
    return spinner;
  }

  // Public API
  return {
    animateNumber,
    animateProgressBar,
    createCircularProgress,
    createStepProgress,
    createPulsingDot,
    createSpinner
  };
})();

// Make available globally
window.ProgressAnimations = ProgressAnimations;
