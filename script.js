document.addEventListener('DOMContentLoaded', function () {
  gsap.registerPlugin(Flip);

  const container = document.querySelector('.container');
  const letters = document.querySelectorAll('.letter');
  const words = document.querySelectorAll('.word');
  const narratives = document.querySelectorAll('.narrative');
  const kingdom = document.querySelector('.kingdom');
  const bahrain = document.querySelector('.bahrain');

  // Enhanced timing controls
  const TIMING = {
    letterStagger: 0.2,
    wordReveal: 1.2,
    narrativeDelay: 0.8,
    finalRevealStart: 1000,
    particleDuration: 3,
    dramaDuration: .5
  };

  // ═══════════════════════════════════════════
  // SEARCH SYSTEM
  // ═══════════════════════════════════════════
  const searchContainer = document.getElementById('searchContainer');
  const searchToggle = document.getElementById('searchToggle');
  const searchInput = document.getElementById('searchInput');
  const searchResults = document.getElementById('searchResults');

  // Build searchable data from the DOM
  const searchData = Array.from(letters).map(letter => {
    const wordEl = letter.querySelector('.word');
    const titleEl = letter.querySelector('.story-title');
    const textEl = letter.querySelector('.story-text');
    const arabicEl = letter.querySelector('.arabic');
    const letterChar = letter.textContent.trim().charAt(0);
    const word = wordEl ? wordEl.childNodes[0].textContent.trim() : '';
    const title = titleEl ? titleEl.textContent.trim() : '';
    const story = textEl ? textEl.textContent.trim() : '';
    const arabic = arabicEl ? arabicEl.textContent.trim() : '';
    return { letter: letterChar, word, title, story, arabic, element: letter };
  });

  let searchOpen = false;

  searchToggle.addEventListener('click', () => {
    searchOpen = !searchOpen;
    searchContainer.classList.toggle('active', searchOpen);
    if (searchOpen) {
      searchInput.focus();
    } else {
      searchInput.value = '';
      clearSearch();
    }
  });

  searchInput.addEventListener('input', (e) => {
    const query = e.target.value.trim().toLowerCase();
    if (query.length === 0) {
      clearSearch();
      return;
    }
    performSearch(query);
  });

  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      searchOpen = false;
      searchContainer.classList.remove('active');
      searchInput.value = '';
      clearSearch();
    }
  });

  // Close search when clicking outside
  document.addEventListener('click', (e) => {
    if (searchOpen && !searchContainer.contains(e.target)) {
      searchOpen = false;
      searchContainer.classList.remove('active');
      searchInput.value = '';
      clearSearch();
    }
  });

  function performSearch(query) {
    const matches = searchData.filter(item =>
      item.letter.toLowerCase().includes(query) ||
      item.word.toLowerCase().includes(query) ||
      item.title.toLowerCase().includes(query) ||
      item.story.toLowerCase().includes(query) ||
      item.arabic.includes(query)
    );

    // Highlight matching letters, dim others
    letters.forEach(l => {
      l.classList.remove('search-match', 'search-dimmed');
    });

    if (matches.length > 0 && matches.length < searchData.length) {
      const matchElements = new Set(matches.map(m => m.element));
      letters.forEach(l => {
        if (matchElements.has(l)) {
          l.classList.add('search-match');
        } else {
          l.classList.add('search-dimmed');
        }
      });
    }

    // Build results dropdown
    searchResults.innerHTML = '';
    if (matches.length > 0) {
      matches.forEach(item => {
        const div = document.createElement('div');
        div.className = 'search-result-item';
        div.innerHTML = `
          <span class="search-result-letter">${item.letter}</span>
          <div class="search-result-text">
            <div class="result-word">${highlightMatch(item.word, query)}</div>
            <div class="result-story">${highlightMatch(item.title, query)}</div>
          </div>
        `;
        div.addEventListener('click', () => {
          focusLetter(item.element);
        });
        searchResults.appendChild(div);
      });
      searchResults.classList.add('visible');

      // Animate results in
      gsap.from('.search-result-item', {
        opacity: 0,
        y: -10,
        stagger: 0.05,
        duration: 0.3,
        ease: 'power2.out'
      });
    } else {
      const noResult = document.createElement('div');
      noResult.className = 'search-result-item';
      noResult.innerHTML = '<span class="search-result-text" style="color:rgba(245,233,217,0.5)">No matches found</span>';
      searchResults.appendChild(noResult);
      searchResults.classList.add('visible');
    }
  }

  function highlightMatch(text, query) {
    if (!query) return text;
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(regex, '<span class="search-highlight">$1</span>');
  }

  function clearSearch() {
    searchResults.classList.remove('visible');
    searchResults.innerHTML = '';
    letters.forEach(l => {
      l.classList.remove('search-match', 'search-dimmed');
    });
  }

  function focusLetter(letterEl) {
    // Pulse the letter
    letterEl.classList.remove('search-focus');
    void letterEl.offsetWidth; // force reflow
    letterEl.classList.add('search-focus');
    gsap.to(letterEl, {
      scale: 1.2,
      duration: 0.3,
      ease: 'back.out(1.7)',
      yoyo: true,
      repeat: 1
    });
    setTimeout(() => letterEl.classList.remove('search-focus'), 1600);
  }

  // ═══════════════════════════════════════════
  // VOICE / SPEECH SYNTHESIS SYSTEM
  // ═══════════════════════════════════════════
  const voiceBtn = document.getElementById('voiceBtn');
  const voiceIcon = voiceBtn.querySelector('.voice-icon');
  const voiceStopIcon = voiceBtn.querySelector('.voice-stop-icon');
  const voiceWave = document.getElementById('voiceWave');

  let isSpeaking = false;
  let currentUtterance = null;
  let speechQueue = [];
  let currentSpeechIndex = -1;

  voiceBtn.addEventListener('click', () => {
    if (isSpeaking) {
      stopSpeaking();
    } else {
      startNarration();
    }
  });

  function startNarration() {
    if (!('speechSynthesis' in window)) {
      console.warn('Speech synthesis not supported');
      return;
    }

    window.speechSynthesis.cancel();
    isSpeaking = true;
    voiceBtn.classList.add('speaking');
    voiceIcon.style.display = 'none';
    voiceStopIcon.style.display = 'block';
    voiceWave.classList.add('active');
    currentSpeechIndex = 0;
    speakNext();
  }

  function speakNext() {
    if (currentSpeechIndex >= searchData.length || !isSpeaking) {
      stopSpeaking();
      return;
    }

    const item = searchData[currentSpeechIndex];
    const text = `${item.word}. ${item.title}. ${item.story}`;

    // Highlight active letter
    letters.forEach(l => l.classList.remove('search-match'));
    item.element.classList.add('search-match');

    // Animate the active letter
    gsap.to(item.element, {
      scale: 1.15,
      boxShadow: '0 0 40px rgba(206, 17, 38, 0.5)',
      duration: 0.4,
      ease: 'back.out(1.7)'
    });

    currentUtterance = new SpeechSynthesisUtterance(text);
    currentUtterance.rate = 0.9;
    currentUtterance.pitch = 1;
    currentUtterance.volume = 1;

    // Try to select a good English voice
    const voices = window.speechSynthesis.getVoices();
    const englishVoice = voices.find(v => v.lang.startsWith('en') && v.name.includes('Google')) ||
                         voices.find(v => v.lang.startsWith('en'));
    if (englishVoice) currentUtterance.voice = englishVoice;

    currentUtterance.onend = () => {
      // Reset letter
      gsap.to(item.element, {
        scale: 1,
        boxShadow: item.element.classList.contains('B') || item.element.classList.contains('H') ||
                   item.element.classList.contains('A2') || item.element.classList.contains('N')
          ? '0 8px 32px rgba(206, 17, 38, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
          : '0 8px 32px rgba(245, 233, 217, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
        duration: 0.4,
        ease: 'power2.out'
      });
      item.element.classList.remove('search-match');

      currentSpeechIndex++;
      if (isSpeaking) {
        setTimeout(speakNext, 400);
      }
    };

    currentUtterance.onerror = () => {
      currentSpeechIndex++;
      if (isSpeaking) speakNext();
    };

    window.speechSynthesis.speak(currentUtterance);
  }

  function stopSpeaking() {
    isSpeaking = false;
    window.speechSynthesis.cancel();
    voiceBtn.classList.remove('speaking');
    voiceIcon.style.display = 'block';
    voiceStopIcon.style.display = 'none';
    voiceWave.classList.remove('active');
    letters.forEach(l => l.classList.remove('search-match'));
    currentSpeechIndex = -1;
  }

  // Load voices (some browsers need this event)
  if ('speechSynthesis' in window) {
    window.speechSynthesis.onvoiceschanged = () => {
      window.speechSynthesis.getVoices();
    };
  }

  // ═══════════════════════════════════════════
  // ENHANCED INTERACTIONS - Ripple, Glow Trail, Stardust
  // ═══════════════════════════════════════════
  letters.forEach(letter => {
    // Add glow trail element
    const glowTrail = document.createElement('div');
    glowTrail.className = 'glow-trail';
    letter.appendChild(glowTrail);

    // Mouse move glow trail
    letter.addEventListener('mousemove', (e) => {
      const rect = letter.getBoundingClientRect();
      const x = e.clientX - rect.left - 30;
      const y = e.clientY - rect.top - 30;
      glowTrail.style.left = x + 'px';
      glowTrail.style.top = y + 'px';
    });

    // Click ripple effect
    letter.addEventListener('click', (e) => {
      const rect = letter.getBoundingClientRect();
      const ripple = document.createElement('div');
      ripple.className = 'ripple';
      const size = Math.max(rect.width, rect.height) * 2;
      ripple.style.width = ripple.style.height = size + 'px';
      ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
      ripple.style.top = (e.clientY - rect.top - size / 2) + 'px';
      letter.appendChild(ripple);

      gsap.to(ripple, {
        scale: 1,
        opacity: 0,
        duration: 0.6,
        ease: 'power2.out',
        onComplete: () => ripple.remove()
      });

      // Spawn stardust particles on click
      for (let i = 0; i < 8; i++) {
        const dust = document.createElement('div');
        dust.style.cssText = `
          position: absolute;
          width: 4px; height: 4px;
          background: radial-gradient(circle, rgba(212,175,55,0.9), transparent);
          border-radius: 50%;
          pointer-events: none;
          left: ${e.clientX - rect.left}px;
          top: ${e.clientY - rect.top}px;
          z-index: 10;
        `;
        letter.appendChild(dust);
        const angle = (Math.PI * 2 * i) / 8;
        const distance = 30 + Math.random() * 40;
        gsap.to(dust, {
          x: Math.cos(angle) * distance,
          y: Math.sin(angle) * distance,
          opacity: 0,
          scale: 0,
          duration: 0.6 + Math.random() * 0.3,
          ease: 'power2.out',
          onComplete: () => dust.remove()
        });
      }

      // Speak this letter's narrative on click if not already speaking
      if (!isSpeaking && 'speechSynthesis' in window) {
        const idx = Array.from(letters).indexOf(letter);
        if (idx >= 0) {
          const item = searchData[idx];
          const text = `${item.word}. ${item.title}`;
          const utt = new SpeechSynthesisUtterance(text);
          utt.rate = 0.95;
          const voices = window.speechSynthesis.getVoices();
          const voice = voices.find(v => v.lang.startsWith('en'));
          if (voice) utt.voice = voice;
          window.speechSynthesis.speak(utt);
        }
      }
    });
  });

  // Character narratives with emotional arcs
  const characterNarratives = {
    shores: {
      emotion: 'wonder',
      theme: 'natural beauty',
      climax: 'architectural transformation'
    },
    heritage: {
      emotion: 'reverence',
      theme: 'ancient wisdom',
      climax: 'generational continuity'
    },
    welcome: {
      emotion: 'warmth',
      theme: 'human connection',
      climax: 'universal family'
    },
    strength: {
      emotion: 'determination',
      theme: 'resilience',
      climax: 'triumphant growth'
    },
    dreams: {
      emotion: 'aspiration',
      theme: 'boundless vision',
      climax: 'stellar achievement'
    },
    innovation: {
      emotion: 'curiosity',
      theme: 'creative fusion',
      climax: 'technological poetry'
    },
    honor: {
      emotion: 'dignity',
      theme: 'moral leadership',
      climax: 'sovereign grace'
    }
  };

  // Set initial states — letters are ALWAYS fully opaque
  gsap.set(words, { opacity: 0, y: 20 });
  gsap.set(narratives, { opacity: 0, y: 30, scale: 0.9 });
  gsap.set([kingdom, bahrain], { opacity: 0, display: 'none' });
  gsap.set(letters, { scale: 1, opacity: 1 });

  // ═══════════════════════════════════════════
  // PLAY / PAUSE CONTROL
  // ═══════════════════════════════════════════
  const playPauseBtn = document.getElementById('playPauseBtn');
  const ppPause = playPauseBtn.querySelector('.pp-pause');
  const ppPlay = playPauseBtn.querySelector('.pp-play');
  let isPaused = false;

  playPauseBtn.addEventListener('click', () => {
    isPaused = !isPaused;
    playPauseBtn.classList.toggle('paused', isPaused);
    ppPause.style.display = isPaused ? 'none' : 'block';
    ppPlay.style.display = isPaused ? 'block' : 'none';
    playPauseBtn.title = isPaused ? 'Play animation' : 'Pause animation';

    if (isPaused) {
      clearTimeout(loopTimeout);
      stopShowcaseAuto();
      clearTimeout(soloTimer);
    } else {
      // Resume
      if (isMobile && container.classList.contains('showcase')) {
        startShowcaseAuto();
      } else if (container.classList.contains('solo')) {
        advanceSoloLetter();
      } else {
        loopTimeout = setTimeout(animationLoop, 1500);
      }
    }
  });

  // ═══════════════════════════════════════════
  // MAGIC SPRINKLER — Canvas particle engine
  // Emits on card entry, ambient drift, and
  // pointer / touch movement.
  // ═══════════════════════════════════════════
  class MagicSprinkler {
    constructor(letterEl) {
      this.el = letterEl;
      this.particles = [];
      this.ambientTimer = null;
      this.rafId = null;
      this.isRunning = false;

      this.canvas = document.createElement('canvas');
      this.canvas.classList.add('magic-sprinkler');
      letterEl.appendChild(this.canvas);
      this.ctx = this.canvas.getContext('2d');
      this._resize();
    }

    _resize() {
      const dpr = window.devicePixelRatio || 1;
      // offsetWidth/Height gives CSS layout size, unaffected by GSAP transforms
      this.w = this.el.offsetWidth  || 300;
      this.h = this.el.offsetHeight || 500;
      this.canvas.width  = this.w * dpr;
      this.canvas.height = this.h * dpr;
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    _color() {
      // Bahrain flag palette: red, cream, gold, white, rose
      const p = ['#ce1126','#ff4757','#d4af37','#f5e9d9','#ffffff','#ffcc44','#ff8899'];
      return p[Math.floor(Math.random() * p.length)];
    }

    _push(x, y, vx, vy) {
      const shapes = ['star','circle','diamond','sparkle','ring'];
      this.particles.push({
        x, y, vx, vy,
        size:   3 + Math.random() * 8,
        color:  this._color(),
        shape:  shapes[Math.floor(Math.random() * shapes.length)],
        life:   1,
        decay:  0.014 + Math.random() * 0.022,
        rot:    Math.random() * Math.PI * 2,
        rotV:   (Math.random() - 0.5) * 0.2,
        grav:   0.07 + Math.random() * 0.07,
        twink:  Math.random() < 0.45
      });
    }

    // Directional burst from a point
    spawnBurst(cx = this.w / 2, cy = this.h * 0.28, count = 30) {
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i / count) + Math.random() * 0.5;
        const speed = 3 + Math.random() * 6;
        this._push(cx, cy, Math.cos(angle) * speed, Math.sin(angle) * speed - 2.5);
      }
    }

    // Sprinkle from pointer / touch position
    spawnFromPointer(clientX, clientY, count = 6) {
      const r = this.el.getBoundingClientRect();
      const x = clientX - r.left;
      const y = clientY - r.top;
      if (x < -10 || x > this.w + 10 || y < -10 || y > this.h + 10) return;
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 1.5 + Math.random() * 3.5;
        this._push(x, y, Math.cos(angle) * speed, Math.sin(angle) * speed - 1.5);
      }
    }

    _startAmbient() {
      this.ambientTimer = setInterval(() => {
        if (!this.isRunning) return;
        // Drift up from the lower portion of the card
        const x = Math.random() * this.w;
        const y = this.h * 0.55 + Math.random() * this.h * 0.45;
        this._push(x, y,
          (Math.random() - 0.5) * 1.2,
          -(0.8 + Math.random() * 1.5)
        );
      }, 220);
    }

    _drawStar(ctx, spikes, outerR, innerR) {
      let a = -Math.PI / 2;
      const step = Math.PI / spikes;
      ctx.beginPath();
      for (let i = 0; i < spikes; i++) {
        ctx.lineTo(Math.cos(a) * outerR, Math.sin(a) * outerR); a += step;
        ctx.lineTo(Math.cos(a) * innerR, Math.sin(a) * innerR); a += step;
      }
      ctx.closePath(); ctx.fill();
    }

    _drawSparkle(ctx, size) {
      const arms = 4;
      ctx.beginPath();
      for (let i = 0; i < arms * 2; i++) {
        const r = i % 2 === 0 ? size : size * 0.12;
        const a = (Math.PI * i) / arms;
        i === 0 ? ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r)
                : ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      }
      ctx.closePath(); ctx.fill();
    }

    _drawRing(ctx, size) {
      ctx.beginPath();
      ctx.arc(0, 0, size * 0.55, 0, Math.PI * 2);
      ctx.lineWidth = size * 0.22;
      ctx.strokeStyle = ctx.fillStyle;
      ctx.stroke();
    }

    _tick() {
      const ctx = this.ctx;
      const now = Date.now();
      ctx.clearRect(0, 0, this.w, this.h);

      for (let i = this.particles.length - 1; i >= 0; i--) {
        const p = this.particles[i];
        p.x  += p.vx;
        p.y  += p.vy;
        p.vy += p.grav;
        p.vx *= 0.97;
        // Twinkle: modulate fade rate with a sine wave
        p.life -= p.twink
          ? p.decay * (0.6 + 0.8 * Math.abs(Math.sin(now * 0.008 + i)))
          : p.decay;
        p.rot += p.rotV;

        if (p.life <= 0) { this.particles.splice(i, 1); continue; }

        ctx.save();
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.fillStyle   = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur  = 10;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);

        switch (p.shape) {
          case 'star':    this._drawStar(ctx, 5, p.size, p.size * 0.38); break;
          case 'diamond':
            ctx.beginPath();
            ctx.moveTo(0, -p.size); ctx.lineTo(p.size * 0.52, 0);
            ctx.lineTo(0, p.size);  ctx.lineTo(-p.size * 0.52, 0);
            ctx.closePath(); ctx.fill(); break;
          case 'sparkle': this._drawSparkle(ctx, p.size); break;
          case 'ring':    this._drawRing(ctx, p.size);    break;
          default:
            ctx.beginPath(); ctx.arc(0, 0, p.size * 0.48, 0, Math.PI * 2); ctx.fill();
        }
        ctx.restore();
      }
    }

    start() {
      if (this.isRunning) return;
      this.isRunning = true;
      // Resize after one frame so layout has settled
      requestAnimationFrame(() => {
        this._resize();
        this.spawnBurst(this.w / 2, this.h * 0.28, 32);
      });
      this._startAmbient();
      const loop = () => {
        if (!this.isRunning) return;
        this._tick();
        this.rafId = requestAnimationFrame(loop);
      };
      loop();
    }

    stop() {
      this.isRunning = false;
      clearInterval(this.ambientTimer); this.ambientTimer = null;
      if (this.rafId) { cancelAnimationFrame(this.rafId); this.rafId = null; }
      this.particles = [];
      this.ctx.clearRect(0, 0, this.w, this.h);
    }
  }

  // One sprinkler per letter card — created once, started/stopped as cards activate
  const sprinklers = new WeakMap();
  letters.forEach(letter => sprinklers.set(letter, new MagicSprinkler(letter)));

  // Track which sprinkler is currently active for pointer routing
  let activeSprinkler = null;

  // Route pointer and touch movement to the active card's sprinkler
  container.addEventListener('mousemove', (e) => {
    if (activeSprinkler) activeSprinkler.spawnFromPointer(e.clientX, e.clientY, 5);
  });
  container.addEventListener('touchmove', (e) => {
    if (activeSprinkler && e.touches.length > 0) {
      activeSprinkler.spawnFromPointer(e.touches[0].clientX, e.touches[0].clientY, 4);
    }
  }, { passive: true });

  // Particle System
  class ParticleSystem {
    constructor(container, type = 'default') {
      this.container = container;
      this.type = type;
      this.particles = [];
      this.isActive = false;
    }

    createParticle() {
      const particle = document.createElement('div');
      particle.className = `particle ${this.type}`;

      const startX = Math.random() * 100;
      const startY = Math.random() * 100;

      particle.style.left = `${startX}%`;
      particle.style.top = `${startY}%`;

      this.container.appendChild(particle);

      const tl = gsap.timeline({
        onComplete: () => {
          if (particle.parentNode) {
            particle.parentNode.removeChild(particle);
          }
        }
      });

      tl.to(particle, {
        duration: TIMING.particleDuration,
        y: -100 - Math.random() * 50,
        x: (Math.random() - 0.5) * 100,
        opacity: 1,
        scale: 1 + Math.random() * 0.5,
        rotation: Math.random() * 360,
        ease: "power2.out"
      })
      .to(particle, {
        duration: 1,
        opacity: 0,
        scale: 0,
        ease: "power2.in"
      }, "-=1");

      this.particles.push(particle);
    }

    start() {
      if (this.isActive) return;
      this.isActive = true;

      const createInterval = setInterval(() => {
        if (!this.isActive) {
          clearInterval(createInterval);
          return;
        }
        this.createParticle();
      }, 200 + Math.random() * 300);

      setTimeout(() => {
        this.isActive = false;
        clearInterval(createInterval);
      }, 5000);
    }

    stop() {
      this.isActive = false;
    }
  }

  // Enhanced reveal sequence with emotional arcs
  function createDramaticReveal(letter, index, isStaggered = true) {
    const narrative = letter.querySelector('.narrative');
    const word = letter.querySelector('.word');
    const particlesContainer = letter.querySelector('.particles-container');
    const narrativeType = letter.dataset.narrative;
    const storyArc = characterNarratives[narrativeType];

    const tl = gsap.timeline();
    const baseDelay = isStaggered ? index * TIMING.letterStagger : 0;

    tl.to(letter, {
      duration: TIMING.dramaDuration,
      ease: "elastic.out(1, 0.5)",
      scale: 1.15,
      rotationY: 10,
      z: 50,
      boxShadow: "0 20px 40px rgba(206, 17, 38, 0.3)",
      className: "+=reveal-active",
      delay: baseDelay
    });

    tl.call(() => {
      const particleType = storyArc.emotion === 'wonder' ? 'gold' :
                         storyArc.emotion === 'warmth' ? 'silver' : 'default';
      const particles = new ParticleSystem(particlesContainer, particleType);
      particles.start();
    }, null, baseDelay + 0.5);

    tl.to(word, {
      duration: TIMING.wordReveal,
      opacity: 1,
      y: 0,
      scale: 1.05,
      ease: "back.out(1.7)",
      filter: "blur(0px)"
    }, baseDelay + 0.8);

    tl.to(narrative, {
      duration: 2,
      opacity: 1,
      y: 0,
      scale: 1,
      rotationX: 0,
      ease: "power3.out",
      filter: "blur(0px)"
    }, baseDelay + TIMING.narrativeDelay);

    tl.to(letter, {
      duration: 2,
      // className: "+=color-shift",
      ease: "sine.inOut"
    }, baseDelay + 2);

    tl.to(letter, {
      duration: 1.5,
      scale: 1,
      rotationY: 0,
      z: 0,
      ease: "power2.inOut",
      className: "-=reveal-active -=color-shift"
    }, baseDelay + 4);

    tl.timeScale(.2);

    return tl;
  }

  // Final dramatic sequence
  function createFinalRevealSequence() {
    const finalTl = gsap.timeline();

    letters.forEach((letter, index) => {
      const revealDelay = index * 0.3;

      finalTl.add(() => {
        letter.classList.add('final-reveal-active');
        letter.classList.remove('reveal-active');
        createDramaticReveal(letter, index, false);
      }, revealDelay);
    });

    finalTl.to([kingdom, bahrain], {
      duration: 2.5,
      opacity: 1,
      scale: 1.1,
      y: -10,
      ease: "elastic.out(1, 0.3)",
      stagger: 0.5,
      filter: "drop-shadow(0 0 20px rgba(206, 17, 38, 0.5))"
    }, 1);

    finalTl.timeScale(.2);

    return finalTl;
  }

  // Enhanced initial entrance
  function createInitialEntrance() {
    const entranceTl = gsap.timeline();

    letters.forEach((letter, index) => {
      const narrativeType = letter.dataset.narrative;
      const storyArc = characterNarratives[narrativeType];

      entranceTl.from(letter, {
        duration: 1.5,
        scale: 0.3,
        opacity: 0,
        rotationY: -90,
        z: -200,
        ease: "back.out(1.4)",
        delay: index * 0.15,
        onComplete: () => {
          if (storyArc.emotion === 'wonder') {
            gsap.to(letter, { duration: 0.5, filter: "hue-rotate(30deg)", yoyo: true, repeat: 1 });
          }
        }
      }, 0.3);
    });

    return entranceTl;
  }

  // Enhanced word display
  function showWordsWithNarratives() {
    const tl = gsap.timeline();
    words.forEach((word, index) => {
      const letter = word.parentElement;
      const narrative = letter.querySelector('.narrative');
      const narrativeType = letter.dataset.narrative;
      const storyArc = characterNarratives[narrativeType];
      const startTime = index * 0.8;

      tl.to(word, {
        opacity: 1,
        y: 0,
        duration: TIMING.wordReveal,
        ease: storyArc.emotion === 'determination' ? "power4.out" : "power2.out"
      }, startTime);

      tl.to(narrative, {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 1.5,
        ease: "power3.out"
      }, startTime + TIMING.narrativeDelay);

      if (storyArc.theme === 'resilience') {
        tl.to(letter, {
          boxShadow: "0 10px 30px rgba(206, 17, 38, 0.4)",
          duration: 0.5,
          yoyo: true,
          repeat: 1
        }, startTime + 1);
      }
    });
    return tl;
  }

  // Hide narratives
  function hideWordsAndNarratives() {
    return new Promise(resolve => {
      const tl = gsap.timeline();

      narratives.forEach((narrative, index) => {
        tl.to(narrative, {
          // opacity: 0,
          y: 20,
          scale: 0.9,
          duration: 0.6,
          ease: "power2.inOut",
          delay: index * 0.08
        }, 0);
      });

      tl.to(words, {
        // opacity: 0,
        y: 10,
        duration: 0.6,
        ease: "power2.inOut",
        stagger: 0.05,
        onComplete: resolve
      }, 0.3);
    });
  }

  // ═══════════════════════════════════════════
  // MOBILE DETECTION & SHOWCASE SYSTEM
  // ═══════════════════════════════════════════
  const isMobileQuery = window.matchMedia('(max-width: 768px)');
  let isMobile = isMobileQuery.matches;
  let showcaseIndex = 0;
  let showcaseAutoTimer = null;
  const showcaseDots = document.getElementById('showcaseDots');
  const swipeHint = document.getElementById('swipeHint');

  // Build dots for showcase navigation
  function buildShowcaseDots() {
    showcaseDots.innerHTML = '';
    letters.forEach((_, i) => {
      const dot = document.createElement('div');
      dot.className = 'showcase-dot' + (i === 0 ? ' active' : '');
      dot.addEventListener('click', () => {
        if (isMobile) showShowcaseCard(i);
      });
      showcaseDots.appendChild(dot);
    });
  }
  buildShowcaseDots();

  function updateShowcaseDots(index) {
    const dots = showcaseDots.querySelectorAll('.showcase-dot');
    dots.forEach((d, i) => {
      d.classList.toggle('active', i === index);
    });
  }

  function showShowcaseCard(index, direction = 0) {
    showcaseIndex = index;
    updateShowcaseDots(index);

    letters.forEach((letter, i) => {
      if (i === index) {
        letter.classList.add('showcase-active');

        // Card slides / scales in
        gsap.fromTo(letter, {
          opacity: 0,
          scale: 0.85,
          x: direction > 0 ? 80 : direction < 0 ? -80 : 0,
          rotationY: direction * 15
        }, {
          opacity: 1,
          scale: 1,
          x: 0,
          rotationY: 0,
          duration: 0.6,
          ease: 'back.out(1.2)'
        });

        const word      = letter.querySelector('.word');
        const narrative = letter.querySelector('.narrative');

        // ── Word reveal: 2-second dramatic pause after card entry ──
        // Reset first so we animate from scratch even on revisit
        if (word) {
          gsap.set(word, { opacity: 0, y: 30, scale: 0.88 });
          gsap.to(word, {
            opacity: 1, y: 0, scale: 1,
            duration: 1.0,
            delay: 2.2,
            ease: 'back.out(1.6)'
          });
        }
        // Narrative follows 1s after the word
        if (narrative) {
          gsap.set(narrative, { opacity: 0, y: 28, scale: 0.93 });
          gsap.to(narrative, {
            opacity: 1, y: 0, scale: 1,
            duration: 0.85,
            delay: 3.35,
            ease: 'power3.out'
          });
        }

        // ── Start the magic sprinkler on this card ──
        if (activeSprinkler) activeSprinkler.stop();
        activeSprinkler = sprinklers.get(letter) || null;
        if (activeSprinkler) activeSprinkler.start();

        // ── Legacy DOM particle burst (keeps original feel) ──
        const pc = letter.querySelector('.particles-container');
        if (pc) {
          const narrativeType = letter.dataset.narrative;
          const storyArc = characterNarratives[narrativeType];
          const pType = storyArc.emotion === 'wonder' ? 'gold' :
                        storyArc.emotion === 'warmth' ? 'silver' : 'default';
          new ParticleSystem(pc, pType).start();
        }

      } else {
        // ── Exit animation ──
        if (letter.classList.contains('showcase-active')) {
          // Kill any in-flight word/narrative tweens so they don't bleed
          const prevWord = letter.querySelector('.word');
          const prevNarr = letter.querySelector('.narrative');
          if (prevWord) gsap.killTweensOf(prevWord);
          if (prevNarr) gsap.killTweensOf(prevNarr);

          gsap.to(letter, {
            opacity: 0,
            scale: 0.85,
            x: direction > 0 ? -60 : direction < 0 ? 60 : 0,
            duration: 0.35,
            ease: 'power2.in',
            onComplete: () => {
              letter.classList.remove('showcase-active');
              // Stop this card's sprinkler once it's fully off-screen
              const s = sprinklers.get(letter);
              if (s) s.stop();
            }
          });
        } else {
          letter.classList.remove('showcase-active');
          gsap.set(letter, { opacity: 0 });
          const s = sprinklers.get(letter);
          if (s && s.isRunning) s.stop();
        }
      }
    });
  }

  function nextShowcaseCard() {
    const next = (showcaseIndex + 1) % letters.length;
    showShowcaseCard(next, 1);
  }

  function prevShowcaseCard() {
    const prev = (showcaseIndex - 1 + letters.length) % letters.length;
    showShowcaseCard(prev, -1);
  }

  // Auto-advance showcase cards
  // 7 000ms gives comfortable viewing after the +2s word reveal delay
  function startShowcaseAuto() {
    clearInterval(showcaseAutoTimer);
    showcaseAutoTimer = setInterval(nextShowcaseCard, 7000);
  }

  function stopShowcaseAuto() {
    clearInterval(showcaseAutoTimer);
  }

  // ═══════════════════════════════════════════
  // TOUCH / SWIPE GESTURE SUPPORT
  // ═══════════════════════════════════════════
  let touchStartX = 0;
  let touchStartY = 0;
  let touchStartTime = 0;
  // Guard against overlapping swipe-triggered transitions
  let isSwipeTransitioning = false;

  container.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
    touchStartTime = Date.now();
    stopShowcaseAuto();
  }, { passive: true });

  container.addEventListener('touchend', (e) => {
    if (!isMobile) return;
    const dx = e.changedTouches[0].clientX - touchStartX;
    const dy = e.changedTouches[0].clientY - touchStartY;
    const dt = Date.now() - touchStartTime;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    // Only count horizontal swipes (not scrolls) and prevent
    // a new transition while the previous one is still animating
    if (!isSwipeTransitioning && absDx > 40 && absDx > absDy * 1.5 && dt < 500) {
      isSwipeTransitioning = true;
      // Card enter animation is 0.6s — unlock after it finishes
      setTimeout(() => { isSwipeTransitioning = false; }, 650);

      if (dx < 0) {
        nextShowcaseCard();
      } else {
        prevShowcaseCard();
      }
      // Hide hint after first swipe
      swipeHint.classList.remove('visible');
    }

    // Restart auto-advance after 8s idle
    setTimeout(startShowcaseAuto, 8000);
  }, { passive: true });

  // ═══════════════════════════════════════════
  // ENTER / EXIT MOBILE SHOWCASE MODE
  // ═══════════════════════════════════════════

  function enterShowcaseMode() {
    container.classList.remove('final', 'plain', 'columns', 'rows', 'grid', 'solo');
    container.classList.add('showcase');
    showcaseDots.classList.add('visible');
    swipeHint.classList.add('visible');

    // Hide swipe hint after 4 seconds
    setTimeout(() => swipeHint.classList.remove('visible'), 4000);

    // Reset all letters, then show first
    letters.forEach(l => {
      l.classList.remove('showcase-active');
      // clearProps must NOT include 'background' to preserve card colors
      gsap.set(l, { opacity: 0, scale: 0.85, clearProps: 'width,height,position,transform' });
    });

    showShowcaseCard(0, 0);
    startShowcaseAuto();
  }

  function exitShowcaseMode() {
    stopShowcaseAuto();
    container.classList.remove('showcase');
    showcaseDots.classList.remove('visible');
    swipeHint.classList.remove('visible');

    // Stop all sprinklers
    if (activeSprinkler) { activeSprinkler.stop(); activeSprinkler = null; }
    letters.forEach(l => {
      l.classList.remove('showcase-active');
      // clearProps 'all' preserves background naturally (inherits from letter)
      gsap.set(l, { clearProps: 'all' });
      const s = sprinklers.get(l);
      if (s && s.isRunning) s.stop();
    });
    gsap.set(letters, { scale: 1, opacity: 1 });
    gsap.set(words, { opacity: 0, y: 20 });
    gsap.set(narratives, { opacity: 0, y: 30, scale: 0.9 });
  }

  // ═══════════════════════════════════════════
  // LAYOUT CYCLING ENGINE
  // ═══════════════════════════════════════════
  // Order: plain → final → columns → rows → grid → solo (one-by-one) → loop
  const layouts = ['plain', 'final', 'columns', 'rows', 'grid'];
  const ALL_LAYOUT_CLASSES = ['plain', 'final', 'columns', 'rows', 'grid', 'solo', 'showcase'];
  let currentLayout = 0;       // starts at plain
  let animationInProgress = false;
  let loopTimeout;
  let soloTimer;
  let soloIndex = 0;

  // Helper: ensure letters never go transparent
  function ensureLettersVisible() {
    gsap.set(letters, { opacity: 1 });
  }

  async function changeLayout() {
    if (animationInProgress || isPaused) return;
    animationInProgress = true;

    try {
      // ── Hide words/narratives/kingdom before FLIP ──
      gsap.killTweensOf([words, narratives, kingdom, bahrain]);

      const hideTl = gsap.timeline({ defaults: { duration: 0.4, ease: "power2.in" } });
      hideTl.to([words, narratives], { opacity: 0, y: 15, scale: 0.92 }, 0);
      hideTl.to([kingdom, bahrain], { opacity: 0 }, 0);
      await hideTl;

      // Letters stay fully visible
      ensureLettersVisible();

      // ── Capture → switch → FLIP ──
      const state = Flip.getState(letters, {
        props: "transform,filter,width,height,margin,padding",
        simple: true,
        tolerance: 0.01
      });

      container.classList.remove(...ALL_LAYOUT_CLASSES);
      currentLayout = (currentLayout + 1) % layouts.length;
      container.classList.add(layouts[currentLayout]);

      await new Promise(resolve => {
        Flip.from(state, {
          duration: 1.6,
          ease: "power3.inOut",
          stagger: { amount: 0.45, from: "center" },
          scale: true,
          simple: true,
          onComplete: resolve
        });
      });

      // Letters stay visible after FLIP
      ensureLettersVisible();

      // ── Reveal content for new layout ──
      const appearTl = gsap.timeline();
      const layout = layouts[currentLayout];

      if (layout === 'final') {
        gsap.set([kingdom, bahrain], { display: 'block' });
        appearTl.to([kingdom, bahrain], {
          duration: 2.2,
          opacity: 1,
          scale: 1,
          y: 0,
          ease: "elastic.out(1.1, 0.4)",
          stagger: 0.35
        }, 0.6);
      }

      if (layout === 'grid') {
        appearTl.to(words, {
          opacity: 1, y: 0,
          duration: 1.4,
          ease: "back.out(1.6)",
          stagger: 0.08
        }, 0.6);

        appearTl.to(narratives, {
          opacity: 1, y: 0, scale: 1,
          duration: 1.6,
          ease: "power3.out",
          stagger: 0.1
        }, 0.9);
      }

      await appearTl;

    } catch (err) {
      console.error(err);
    } finally {
      animationInProgress = false;

      // After grid → enter solo mode; otherwise schedule next
      if (layouts[currentLayout] === 'grid') {
        loopTimeout = setTimeout(enterSoloMode, 8000);
      } else {
        const delay = layouts[currentLayout] === 'final' ? 5000 : 3800;
        loopTimeout = setTimeout(animationLoop, delay);
      }
    }
  }

  // ═══════════════════════════════════════════
  // SOLO ONE-BY-ONE REVEAL
  // ═══════════════════════════════════════════
  function enterSoloMode() {
    if (isPaused) return;

    // Clean up
    gsap.killTweensOf([words, narratives, kingdom, bahrain]);
    gsap.set([words, narratives], { opacity: 0 });
    gsap.set([kingdom, bahrain], { opacity: 0 });

    container.classList.remove(...ALL_LAYOUT_CLASSES);
    container.classList.add('solo');

    // Hide all letters, then reveal one by one
    letters.forEach(l => {
      l.classList.remove('solo-active');
      gsap.set(l, { opacity: 0, scale: 0.7, x: 0, y: 0 });
    });

    soloIndex = 0;
    advanceSoloLetter();
  }

  function advanceSoloLetter() {
    if (isPaused) return;

    // If we've shown all 7, exit solo → loop back to plain
    if (soloIndex >= letters.length) {
      exitSoloMode();
      return;
    }

    const letter = letters[soloIndex];
    const word = letter.querySelector('.word');
    const narrative = letter.querySelector('.narrative');
    const narrativeType = letter.dataset.narrative;
    const storyArc = characterNarratives[narrativeType];

    // Hide previous
    if (soloIndex > 0) {
      const prev = letters[soloIndex - 1];
      const prevWord = prev.querySelector('.word');
      const prevNarr = prev.querySelector('.narrative');
      gsap.to(prev, { opacity: 0, scale: 0.7, duration: 0.5, ease: "power2.in" });
      gsap.to(prevWord, { opacity: 0, y: 15, duration: 0.3 });
      gsap.to(prevNarr, { opacity: 0, y: 15, duration: 0.3 });
      prev.classList.remove('solo-active');
    }

    // Show current letter
    letter.classList.add('solo-active');
    const tl = gsap.timeline();

    // Letter appears: center of viewport
    tl.to(letter, {
      opacity: 1,
      scale: 1,
      duration: 0.8,
      ease: "back.out(1.4)"
    }, 0.3);

    // Particles burst
    tl.call(() => {
      const pc = letter.querySelector('.particles-container');
      if (pc) {
        const pType = storyArc.emotion === 'wonder' ? 'gold' :
                      storyArc.emotion === 'warmth' ? 'silver' : 'default';
        new ParticleSystem(pc, pType).start();
      }
    }, null, 0.6);

    // Word appears with a 2-second dramatic pause (matching showcase behaviour)
    tl.to(word, {
      opacity: 1,
      y: 0,
      scale: 1,
      duration: 1.2,
      ease: "back.out(1.5)"
    }, 3.0);

    // Narrative follows 1s after the word
    tl.to(narrative, {
      opacity: 1,
      y: 0,
      scale: 1,
      duration: 1.4,
      ease: "power3.out"
    }, 4.0);

    soloIndex++;

    // 8s per letter: letter visible (0.8s) + word pause (2s) + reading time
    soloTimer = setTimeout(advanceSoloLetter, 8000);
  }

  function exitSoloMode() {
    clearTimeout(soloTimer);

    // Hide last solo letter
    letters.forEach(l => {
      l.classList.remove('solo-active');
    });

    container.classList.remove('solo');
    container.classList.add('plain');
    currentLayout = 0;

    // Reset everything cleanly for the next loop
    gsap.set(letters, { opacity: 1, scale: 1, x: 0, y: 0, clearProps: 'position,width,height' });
    gsap.set(words, { opacity: 0, y: 20 });
    gsap.set(narratives, { opacity: 0, y: 30, scale: 0.9 });
    gsap.set([kingdom, bahrain], { opacity: 0 });

    if (!isPaused) {
      loopTimeout = setTimeout(animationLoop, 3000);
    }
  }

  // ═══════════════════════════════════════════
  // MAIN ANIMATION LOOP
  // ═══════════════════════════════════════════
  async function animationLoop() {
    if (isPaused) return;

    // If mobile, use showcase mode instead
    if (isMobile) {
      if (!container.classList.contains('showcase')) {
        enterShowcaseMode();
      }
      return;
    }

    // Exit showcase if we were in it
    if (container.classList.contains('showcase')) {
      exitShowcaseMode();
      container.classList.remove(...ALL_LAYOUT_CLASSES);
      container.classList.add('plain');
      currentLayout = 0;
    }

    // Exit solo if stuck
    if (container.classList.contains('solo')) {
      exitSoloMode();
      return;
    }

    clearTimeout(loopTimeout);
    await changeLayout();
  }

  // Listen for viewport changes (rotation, resize)
  isMobileQuery.addEventListener('change', (e) => {
    isMobile = e.matches;
    clearTimeout(loopTimeout);
    clearTimeout(soloTimer);
    stopShowcaseAuto();

    if (isMobile) {
      if (container.classList.contains('solo')) exitSoloMode();
      enterShowcaseMode();
    } else {
      exitShowcaseMode();
      container.classList.remove(...ALL_LAYOUT_CLASSES);
      container.classList.add('plain');
      currentLayout = 0;
      gsap.set(letters, { scale: 1, opacity: 1 });
      if (!isPaused) loopTimeout = setTimeout(animationLoop, 2000);
    }
  });

  createInitialEntrance().then(() => {
    if (isMobile) {
      enterShowcaseMode();
    } else {
      loopTimeout = setTimeout(animationLoop, 3000);
    }
  });
});

// Note: resize / responsive switching is handled inside DOMContentLoaded
// via the matchMedia 'change' event which has access to all animation state.
// The visibilitychange handler only needs GSAP — the canvas wave animation
// manages its own pause state independently in waveParticles.js.
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    gsap.globalTimeline.pause();
  } else {
    gsap.globalTimeline.resume();
  }
});