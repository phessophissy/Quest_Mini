/**
 * Quest Mini - Confetti Celebration Module
 * Lightweight confetti animation for quest completion celebrations
 */

const Confetti = (function() {
  'use strict';

  // Configuration
  const config = {
    particleCount: 100,
    spread: 70,
    startVelocity: 45,
    decay: 0.9,
    gravity: 1,
    drift: 0,
    ticks: 200,
    colors: ['#8B5CF6', '#06B6D4', '#10B981', '#F59E0B', '#EF4444', '#EC4899'],
    shapes: ['square', 'circle'],
    scalar: 1
  };

  // Canvas and context
  let canvas = null;
  let ctx = null;
  let particles = [];
  let animationId = null;

  /**
   * Initialize the confetti canvas
   */
  function init() {
    if (canvas) return;

    canvas = document.createElement('canvas');
    canvas.id = 'confetti-canvas';
    canvas.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 9999;
    `;
    document.body.appendChild(canvas);
    
    ctx = canvas.getContext('2d');
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
  }

  /**
   * Resize canvas to match window
   */
  function resizeCanvas() {
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  /**
   * Create a single particle
   */
  function createParticle(x, y, options = {}) {
    const angle = options.angle || (Math.random() * Math.PI * 2);
    const velocity = options.startVelocity || config.startVelocity;
    const color = options.colors 
      ? options.colors[Math.floor(Math.random() * options.colors.length)]
      : config.colors[Math.floor(Math.random() * config.colors.length)];
    const shape = config.shapes[Math.floor(Math.random() * config.shapes.length)];

    return {
      x: x,
      y: y,
      vx: Math.cos(angle) * velocity * (0.5 + Math.random() * 0.5),
      vy: Math.sin(angle) * velocity * (0.5 + Math.random() * 0.5) - velocity * 0.5,
      color: color,
      shape: shape,
      size: (Math.random() * 6 + 4) * config.scalar,
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 10,
      opacity: 1,
      decay: options.decay || config.decay,
      gravity: options.gravity || config.gravity,
      drift: options.drift || config.drift,
      ticks: options.ticks || config.ticks,
      tick: 0
    };
  }

  /**
   * Update particle physics
   */
  function updateParticle(particle) {
    particle.tick++;
    
    // Apply physics
    particle.vy += particle.gravity * 0.1;
    particle.vx += particle.drift * 0.01;
    particle.vx *= particle.decay;
    particle.vy *= particle.decay;
    
    particle.x += particle.vx;
    particle.y += particle.vy;
    particle.rotation += particle.rotationSpeed;
    
    // Fade out
    particle.opacity = 1 - (particle.tick / particle.ticks);
    
    return particle.tick < particle.ticks && particle.opacity > 0;
  }

  /**
   * Draw a single particle
   */
  function drawParticle(particle) {
    ctx.save();
    ctx.translate(particle.x, particle.y);
    ctx.rotate(particle.rotation * Math.PI / 180);
    ctx.globalAlpha = particle.opacity;
    ctx.fillStyle = particle.color;
    
    if (particle.shape === 'circle') {
      ctx.beginPath();
      ctx.arc(0, 0, particle.size / 2, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillRect(-particle.size / 2, -particle.size / 2, particle.size, particle.size);
    }
    
    ctx.restore();
  }

  /**
   * Animation loop
   */
  function animate() {
    if (!ctx || particles.length === 0) {
      animationId = null;
      return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Update and draw particles
    particles = particles.filter(particle => {
      const alive = updateParticle(particle);
      if (alive) drawParticle(particle);
      return alive;
    });

    if (particles.length > 0) {
      animationId = requestAnimationFrame(animate);
    } else {
      animationId = null;
    }
  }

  /**
   * Fire confetti from a point
   * @param {Object} options - Confetti options
   */
  function fire(options = {}) {
    init();

    const x = options.x !== undefined ? options.x : canvas.width / 2;
    const y = options.y !== undefined ? options.y : canvas.height / 2;
    const count = options.particleCount || config.particleCount;
    const spread = options.spread || config.spread;

    // Create particles
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI / 2) - (spread * Math.PI / 180) / 2 + Math.random() * (spread * Math.PI / 180);
      particles.push(createParticle(x, y, { ...options, angle }));
    }

    // Start animation if not running
    if (!animationId) {
      animationId = requestAnimationFrame(animate);
    }
  }

  /**
   * Fire confetti burst from center
   */
  function burst(options = {}) {
    init();

    const x = options.x !== undefined ? options.x : canvas.width / 2;
    const y = options.y !== undefined ? options.y : canvas.height / 2;
    const count = options.particleCount || 50;

    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count;
      particles.push(createParticle(x, y, { ...options, angle, startVelocity: 30 }));
    }

    if (!animationId) {
      animationId = requestAnimationFrame(animate);
    }
  }

  /**
   * Celebration effect - multiple bursts
   */
  function celebrate() {
    init();

    // Fire from multiple positions
    const positions = [
      { x: canvas.width * 0.25, y: canvas.height * 0.6 },
      { x: canvas.width * 0.75, y: canvas.height * 0.6 },
      { x: canvas.width * 0.5, y: canvas.height * 0.5 }
    ];

    positions.forEach((pos, index) => {
      setTimeout(() => {
        fire({
          x: pos.x,
          y: pos.y,
          particleCount: 60,
          spread: 100,
          startVelocity: 35,
          colors: config.colors
        });
      }, index * 150);
    });

    // Extra burst from center
    setTimeout(() => {
      burst({
        x: canvas.width / 2,
        y: canvas.height / 2,
        particleCount: 40
      });
    }, 450);
  }

  /**
   * Quest completion celebration
   */
  function questComplete() {
    celebrate();
    
    // Vibrate if supported (mobile)
    if (navigator.vibrate) {
      navigator.vibrate([100, 50, 100, 50, 200]);
    }
  }

  /**
   * Stop all confetti
   */
  function stop() {
    particles = [];
    if (animationId) {
      cancelAnimationFrame(animationId);
      animationId = null;
    }
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }

  /**
   * Cleanup
   */
  function destroy() {
    stop();
    if (canvas && canvas.parentNode) {
      canvas.parentNode.removeChild(canvas);
    }
    canvas = null;
    ctx = null;
    window.removeEventListener('resize', resizeCanvas);
  }

  // Public API
  return {
    fire,
    burst,
    celebrate,
    questComplete,
    stop,
    destroy
  };
})();

// Make available globally
window.Confetti = Confetti;
