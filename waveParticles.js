document.addEventListener('DOMContentLoaded', function() {
// Animated background waves of particles (realistic, smooth, and independent)
(function() {
  const canvas = document.createElement('canvas');
  canvas.id = 'wave-particles-bg';
  canvas.style.position = 'fixed';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.width = '100vw';
  canvas.style.height = '100vh';
  canvas.style.zIndex = '0';
  canvas.style.pointerEvents = 'none';
  document.body.prepend(canvas);

  const ctx = canvas.getContext('2d');
  let dpr = window.devicePixelRatio || 1;
  let width = 0, height = 0;

  function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
  }
  resize();
  window.addEventListener('resize', resize);

  // Particle wave parameters
  const WAVE_COUNT = 3;
  const PARTICLES_PER_WAVE = 60;
  const AMPLITUDE = [40, 70, 110];
  const SPEED = [0.18, 0.12, 0.09];
  const COLORS = [
    'rgba(206,17,38,0.18)',
    'rgba(255,71,87,0.13)',
    'rgba(245,233,217,0.10)'
  ];

  // Each wave is a set of particles
  const waves = Array.from({length: WAVE_COUNT}, (_, w) =>
    Array.from({length: PARTICLES_PER_WAVE}, (_, i) => ({
      baseX: (i / (PARTICLES_PER_WAVE-1)) * width,
      baseY: height * (0.35 + 0.15 * w),
      phase: Math.random() * Math.PI * 2,
      size: 2.5 + Math.random() * 3.5,
      color: COLORS[w],
      speed: SPEED[w] * (0.8 + Math.random() * 0.4),
      amplitude: AMPLITUDE[w] * (0.7 + Math.random() * 0.6)
    }))
  );

  function drawWaves(time) {
    ctx.clearRect(0, 0, width, height);
    for (let w = 0; w < WAVE_COUNT; w++) {
      ctx.beginPath();
      for (let i = 0; i < PARTICLES_PER_WAVE; i++) {
        const p = waves[w][i];
        const t = time * p.speed + p.phase;
        const y = p.baseY + Math.sin(t) * p.amplitude + Math.cos(t*0.7) * p.amplitude*0.18;
        const x = (i / (PARTICLES_PER_WAVE-1)) * width + Math.sin(t*0.5) * 8;
        ctx.moveTo(x, y);
        ctx.arc(x, y, p.size, 0, Math.PI*2);
      }
      ctx.fillStyle = COLORS[w];
      ctx.globalAlpha = 1.0;
      ctx.fill();
    }
    ctx.globalAlpha = 1.0;
  }

  function animate() {
    drawWaves(performance.now() * 0.001);
    requestAnimationFrame(animate);
  }
  animate();
})();
});
