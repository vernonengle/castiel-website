// Animated starfield + nebula canvas for the hero section

(function () {
  const canvas = document.getElementById('starfield');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let W, H, stars, nebulae;

  const STAR_COUNT = 220;
  const NEBULA_COUNT = 5;

  function resize() {
    W = canvas.width = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
    init();
  }

  function randBetween(a, b) {
    return a + Math.random() * (b - a);
  }

  function init() {
    // Stars: mix of tiny white + teal/aqua tinted
    stars = [];
    const colors = ['#ffffff', '#87ceeb', '#7fffd4', '#00bcd4', '#b0e0e6', '#e0f7fa'];
    for (let i = 0; i < STAR_COUNT; i++) {
      const size = Math.random() < 0.08 ? randBetween(1.8, 3.2) : randBetween(0.5, 1.6);
      stars.push({
        x: Math.random() * W,
        y: Math.random() * H,
        size,
        baseAlpha: randBetween(0.4, 1.0),
        alpha: 0,
        twinkleSpeed: randBetween(0.005, 0.025),
        twinkleOffset: Math.random() * Math.PI * 2,
        color: colors[Math.floor(Math.random() * colors.length)],
        glow: Math.random() < 0.15,
      });
    }

    // Soft nebula blobs
    nebulae = [];
    const nebulaColors = [
      'rgba(0,188,212,0.04)',
      'rgba(127,255,212,0.03)',
      'rgba(100,149,237,0.04)',
      'rgba(0,188,212,0.03)',
      'rgba(135,206,235,0.04)',
    ];
    for (let i = 0; i < NEBULA_COUNT; i++) {
      nebulae.push({
        x: Math.random() * W,
        y: Math.random() * H,
        r: randBetween(80, 220),
        color: nebulaColors[i % nebulaColors.length],
      });
    }
  }

  let frame = 0;

  function draw() {
    ctx.clearRect(0, 0, W, H);

    // Nebulae first (behind stars)
    for (const n of nebulae) {
      const grad = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r);
      grad.addColorStop(0, n.color);
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Stars
    for (const s of stars) {
      s.alpha = s.baseAlpha * (0.5 + 0.5 * Math.sin(frame * s.twinkleSpeed + s.twinkleOffset));
      ctx.globalAlpha = s.alpha;

      if (s.glow) {
        // Glowing halo
        const grad = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.size * 4);
        grad.addColorStop(0, s.color);
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size * 4, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.fillStyle = s.color;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.globalAlpha = 1;
    frame++;
    requestAnimationFrame(draw);
  }

  window.addEventListener('resize', resize);
  resize();
  draw();
})();
