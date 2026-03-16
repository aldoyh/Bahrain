document.addEventListener('DOMContentLoaded', function () {
  gsap.registerPlugin(Flip);

  const container = document.querySelector('.container');
  const letters = document.querySelectorAll('.letter');
  const words = document.querySelectorAll('.word');
  const narratives = document.querySelectorAll('.narrative');
  const kingdom = document.querySelector('.kingdom');
  const bahrain = document.querySelector('.bahrain');

  // ═══════════════════════════════════════════
  // BEAT TIMING — Dancer-formation rhythm system
  // ═══════════════════════════════════════════
  const BEAT = {
    bpm: 72,                   // tempo: 72 beats per minute
    get interval() { return 60 / this.bpm; },  // ~0.833s per beat
    half() { return this.interval / 2; },
    quarter() { return this.interval / 4; },
    double() { return this.interval * 2; },
    bars(n) { return this.interval * 4 * n; },  // 4 beats per bar
  };

  const TIMING = {
    letterStagger: BEAT.quarter(),     // ~0.21s
    wordReveal: BEAT.interval,         // ~0.83s
    narrativeDelay: BEAT.half(),       // ~0.42s
    particleDuration: 3,
    formationHold: BEAT.bars(4),       // hold formation ~13s
    soloRevealTime: BEAT.bars(2),      // per solo letter ~6.6s
  };

  // Choreography patterns for stagger
  const CHOREO = {
    // Center-out: middle letters move first, edges last
    centerOut: { amount: 0.5, from: 'center' },
    // Edges-in: edges move first, center last
    edgesIn: { amount: 0.5, from: 'edges' },
    // Cascade left-to-right like a wave
    cascade: { each: BEAT.quarter(), from: 'start' },
    // Reverse cascade
    reverseCascade: { each: BEAT.quarter(), from: 'end' },
    // Random burst
    burst: { amount: 0.4, from: 'random' },
  };

  // Easing presets — snappy dancer moves
  const EASE = {
    snapIn: 'back.out(1.7)',           // overshoot snap
    snapOut: 'back.in(1.4)',           // pull back before exit
    elastic: 'elastic.out(1.2, 0.4)',  // bouncy arrival
    whip: 'power4.out',               // fast start, smooth settle
    sway: 'sine.inOut',               // gentle sway
    punch: 'expo.out',                // explosive entry
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
    letterEl.classList.remove('search-focus');
    void letterEl.offsetWidth;
    letterEl.classList.add('search-focus');
    gsap.to(letterEl, {
      scale: 1.2,
      duration: 0.3,
      ease: EASE.snapIn,
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

    letters.forEach(l => l.classList.remove('search-match'));
    item.element.classList.add('search-match');

    gsap.to(item.element, {
      scale: 1.15,
      boxShadow: '0 0 40px rgba(206, 17, 38, 0.5)',
      duration: 0.4,
      ease: EASE.snapIn
    });

    currentUtterance = new SpeechSynthesisUtterance(text);
    currentUtterance.rate = 0.9;
    currentUtterance.pitch = 1;
    currentUtterance.volume = 1;

    const voices = window.speechSynthesis.getVoices();
    const englishVoice = voices.find(v => v.lang.startsWith('en') && v.name.includes('Google')) ||
                         voices.find(v => v.lang.startsWith('en'));
    if (englishVoice) currentUtterance.voice = englishVoice;

    currentUtterance.onend = () => {
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

  if ('speechSynthesis' in window) {
    window.speechSynthesis.onvoiceschanged = () => {
      window.speechSynthesis.getVoices();
    };
  }

  // ═══════════════════════════════════════════
  // ENHANCED INTERACTIONS - Ripple, Glow Trail, Stardust
  // ═══════════════════════════════════════════
  letters.forEach(letter => {
    const glowTrail = document.createElement('div');
    glowTrail.className = 'glow-trail';
    letter.appendChild(glowTrail);

    letter.addEventListener('mousemove', (e) => {
      const rect = letter.getBoundingClientRect();
      const x = e.clientX - rect.left - 30;
      const y = e.clientY - rect.top - 30;
      glowTrail.style.left = x + 'px';
      glowTrail.style.top = y + 'px';
    });

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
    shores: { emotion: 'wonder', theme: 'natural beauty', climax: 'architectural transformation' },
    heritage: { emotion: 'reverence', theme: 'ancient wisdom', climax: 'generational continuity' },
    welcome: { emotion: 'warmth', theme: 'human connection', climax: 'universal family' },
    strength: { emotion: 'determination', theme: 'resilience', climax: 'triumphant growth' },
    dreams: { emotion: 'aspiration', theme: 'boundless vision', climax: 'stellar achievement' },
    innovation: { emotion: 'curiosity', theme: 'creative fusion', climax: 'technological poetry' },
    honor: { emotion: 'dignity', theme: 'moral leadership', climax: 'sovereign grace' }
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
  // PARTICLE SYSTEM
  // ═══════════════════════════════════════════
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
      particle.style.opacity = '0';

      this.container.appendChild(particle);

      const tl = gsap.timeline({
        onComplete: () => {
          if (particle.parentNode) particle.parentNode.removeChild(particle);
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

  // ═══════════════════════════════════════════
  // DANCER-FORMATION CHOREOGRAPHY SYSTEM
  // ═══════════════════════════════════════════

  // Formation-specific dance moves for each layout transition
  const formationDances = {
    // plain → final: "Opening Ceremony" — letters bow out then fan into position
    toFinal: {
      exit: { scale: 0.85, y: -20, rotation: -8, ease: EASE.snapOut, duration: BEAT.half() },
      stagger: CHOREO.centerOut,
      enter: { scale: 1, y: 0, rotation: 0, ease: EASE.elastic, duration: BEAT.interval },
      flipEase: 'power2.inOut',
      flipDuration: BEAT.interval * 1.5,
    },
    // final → columns: "Domino Drop" — cascade into column positions
    toColumns: {
      exit: { scale: 0.9, x: -15, rotationY: 15, ease: EASE.snapOut, duration: BEAT.half() },
      stagger: CHOREO.cascade,
      enter: { scale: 1, x: 0, rotationY: 0, ease: EASE.snapIn, duration: BEAT.interval },
      flipEase: 'power3.inOut',
      flipDuration: BEAT.interval * 1.5,
    },
    // columns → rows: "Wave Sweep" — lateral wave motion
    toRows: {
      exit: { scale: 0.9, y: 15, rotationX: -10, ease: EASE.snapOut, duration: BEAT.half() },
      stagger: CHOREO.reverseCascade,
      enter: { scale: 1, y: 0, rotationX: 0, ease: EASE.whip, duration: BEAT.interval },
      flipEase: 'expo.inOut',
      flipDuration: BEAT.interval * 1.5,
    },
    // rows → grid: "Explosion" — burst outward into grid positions
    toGrid: {
      exit: { scale: 0.7, rotation: 10, ease: EASE.snapOut, duration: BEAT.half() },
      stagger: CHOREO.burst,
      enter: { scale: 1, rotation: 0, ease: EASE.elastic, duration: BEAT.double() },
      flipEase: 'back.inOut(1.2)',
      flipDuration: BEAT.double(),
    },
  };

  // Pick the right dance based on current → next layout
  function getDance(fromLayout, toLayout) {
    if (toLayout === 'final') return formationDances.toFinal;
    if (toLayout === 'columns') return formationDances.toColumns;
    if (toLayout === 'rows') return formationDances.toRows;
    if (toLayout === 'grid') return formationDances.toGrid;
    return formationDances.toFinal; // default
  }

  // Coordinated "breathe" pulse while holding a formation
  function startFormationBreathing() {
    return gsap.to(letters, {
      scale: 1.03,
      duration: BEAT.double(),
      ease: EASE.sway,
      yoyo: true,
      repeat: -1,
      stagger: { amount: 0.6, from: 'center' }
    });
  }

  // ═══════════════════════════════════════════
  // INITIAL ENTRANCE — "Curtain Rise"
  // ═══════════════════════════════════════════
  function createInitialEntrance() {
    const entranceTl = gsap.timeline();

    // All letters start invisible and off-stage
    gsap.set(letters, { opacity: 0, scale: 0.3, y: 60, rotationX: -45 });

    letters.forEach((letter, index) => {
      const delay = index * BEAT.quarter();

      entranceTl.to(letter, {
        opacity: 1,
        scale: 1,
        y: 0,
        rotationX: 0,
        duration: BEAT.interval,
        ease: EASE.elastic,
      }, delay);

      // Micro-bounce on landing
      entranceTl.to(letter, {
        scale: 1.08,
        duration: BEAT.quarter(),
        ease: EASE.snapIn,
        yoyo: true,
        repeat: 1,
      }, delay + BEAT.interval * 0.8);
    });

    // Final synchronized "ready" pulse — all letters together on the beat
    entranceTl.to(letters, {
      scale: 1.05,
      duration: BEAT.quarter(),
      ease: EASE.punch,
      yoyo: true,
      repeat: 1,
    }, `>+${BEAT.quarter()}`);

    return entranceTl;
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
          ease: EASE.snapIn
        });

        const word = letter.querySelector('.word');
        const narrative = letter.querySelector('.narrative');
        if (word) {
          gsap.fromTo(word, { opacity: 0, y: 20 }, {
            opacity: 1, y: 0, duration: 0.5, delay: 0.2, ease: 'power2.out'
          });
        }
        if (narrative) {
          gsap.fromTo(narrative, { opacity: 0, y: 25, scale: 0.95 }, {
            opacity: 1, y: 0, scale: 1, duration: 0.6, delay: 0.35, ease: 'power2.out'
          });
        }

        const pc = letter.querySelector('.particles-container');
        if (pc) {
          const narrativeType = letter.dataset.narrative;
          const storyArc = characterNarratives[narrativeType];
          const pType = storyArc.emotion === 'wonder' ? 'gold' :
                        storyArc.emotion === 'warmth' ? 'silver' : 'default';
          new ParticleSystem(pc, pType).start();
        }
      } else {
        if (letter.classList.contains('showcase-active')) {
          gsap.to(letter, {
            opacity: 0,
            scale: 0.85,
            x: direction > 0 ? -60 : direction < 0 ? 60 : 0,
            duration: 0.35,
            ease: 'power2.in',
            onComplete: () => letter.classList.remove('showcase-active')
          });
        } else {
          letter.classList.remove('showcase-active');
          gsap.set(letter, { opacity: 0 });
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

  function startShowcaseAuto() {
    clearInterval(showcaseAutoTimer);
    showcaseAutoTimer = setInterval(nextShowcaseCard, 5000);
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

    if (absDx > 40 && absDx > absDy * 1.5 && dt < 500) {
      if (dx < 0) {
        nextShowcaseCard();
      } else {
        prevShowcaseCard();
      }
      swipeHint.classList.remove('visible');
    }

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

    setTimeout(() => swipeHint.classList.remove('visible'), 4000);

    letters.forEach(l => {
      l.classList.remove('showcase-active');
      gsap.set(l, { opacity: 0, scale: 0.85, clearProps: 'width,height,position,rotation,rotationX,rotationY' });
    });

    showShowcaseCard(0, 0);
    startShowcaseAuto();
  }

  function exitShowcaseMode() {
    stopShowcaseAuto();
    container.classList.remove('showcase');
    showcaseDots.classList.remove('visible');
    swipeHint.classList.remove('visible');

    letters.forEach(l => {
      l.classList.remove('showcase-active');
      gsap.set(l, { clearProps: 'all' });
    });
    gsap.set(letters, { scale: 1, opacity: 1 });
    gsap.set(words, { opacity: 0, y: 20 });
    gsap.set(narratives, { opacity: 0, y: 30, scale: 0.9 });
  }

  // ═══════════════════════════════════════════
  // LAYOUT CYCLING ENGINE — Dancer Formations
  // ═══════════════════════════════════════════
  // Order: plain → final → columns → rows → grid → solo (one-by-one) → loop
  const layouts = ['plain', 'final', 'columns', 'rows', 'grid'];
  const ALL_LAYOUT_CLASSES = ['plain', 'final', 'columns', 'rows', 'grid', 'solo', 'showcase'];
  let currentLayout = 0;
  let animationInProgress = false;
  let loopTimeout;
  let soloTimer;
  let soloIndex = 0;
  let breathingTween = null;

  // Helper: ensure letters never go transparent
  function ensureLettersVisible() {
    gsap.set(letters, { opacity: 1 });
  }

  async function changeLayout() {
    if (animationInProgress || isPaused) return;
    animationInProgress = true;

    // Kill any breathing animation
    if (breathingTween) {
      breathingTween.kill();
      breathingTween = null;
    }

    try {
      const fromLayout = layouts[currentLayout];
      const nextIdx = (currentLayout + 1) % layouts.length;
      const toLayout = layouts[nextIdx];
      const dance = getDance(fromLayout, toLayout);

      // ── BEAT 1: Exit move — dancers pull back before reforming ──
      gsap.killTweensOf([...words, ...narratives, kingdom, bahrain, ...letters]);

      const exitTl = gsap.timeline();

      // Hide words/narratives on the beat
      exitTl.to([words, narratives], {
        opacity: 0, y: 15, scale: 0.92,
        duration: BEAT.half(),
        ease: "power2.in"
      }, 0);
      exitTl.to([kingdom, bahrain], { opacity: 0, duration: BEAT.half() }, 0);

      // Dancers pull back (exit move)
      exitTl.to(letters, {
        ...dance.exit,
        stagger: dance.stagger,
      }, BEAT.quarter());

      await exitTl;

      // Letters stay fully visible between formations
      ensureLettersVisible();
      gsap.set(letters, { scale: 1, rotation: 0, rotationX: 0, rotationY: 0, x: 0, y: 0 });

      // ── BEAT 2: FLIP transition — snap into new formation ──
      const state = Flip.getState(letters, {
        props: "transform,filter,width,height,margin,padding",
        simple: true,
        tolerance: 0.01
      });

      container.classList.remove(...ALL_LAYOUT_CLASSES);
      currentLayout = nextIdx;
      container.classList.add(layouts[currentLayout]);

      await new Promise(resolve => {
        Flip.from(state, {
          duration: dance.flipDuration,
          ease: dance.flipEase,
          stagger: dance.stagger,
          scale: true,
          simple: true,
          onUpdate: ensureLettersVisible,
          onComplete: resolve
        });
      });

      // ── BEAT 3: Arrival — dancers land and settle ──
      ensureLettersVisible();

      const arrivalTl = gsap.timeline();

      // Synchronized landing pulse
      arrivalTl.fromTo(letters, {
        scale: 0.92,
      }, {
        scale: 1,
        duration: BEAT.half(),
        ease: EASE.snapIn,
        stagger: { amount: 0.3, from: 'center' },
      }, 0);

      // Micro-bounce on landing
      arrivalTl.to(letters, {
        scale: 1.06,
        duration: BEAT.quarter(),
        ease: EASE.punch,
        yoyo: true,
        repeat: 1,
        stagger: { amount: 0.2, from: 'center' },
      }, BEAT.half());

      // ── BEAT 4: Reveal content for new layout ──
      const layout = layouts[currentLayout];

      if (layout === 'final') {
        gsap.set([kingdom, bahrain], { display: 'block' });
        arrivalTl.fromTo([kingdom, bahrain], {
          opacity: 0, scale: 0.8, y: 20
        }, {
          opacity: 1,
          scale: 1,
          y: 0,
          duration: BEAT.double(),
          ease: EASE.elastic,
          stagger: BEAT.half()
        }, BEAT.half());
      }

      if (layout === 'grid') {
        arrivalTl.to(words, {
          opacity: 1, y: 0,
          duration: BEAT.interval,
          ease: EASE.snapIn,
          stagger: { each: BEAT.quarter() * 0.5, from: 'random' }
        }, BEAT.interval);

        arrivalTl.to(narratives, {
          opacity: 1, y: 0, scale: 1,
          duration: BEAT.interval * 1.5,
          ease: "power3.out",
          stagger: { each: BEAT.quarter() * 0.5, from: 'random' }
        }, BEAT.interval * 1.5);
      }

      await arrivalTl;

      // Start breathing while holding formation
      breathingTween = startFormationBreathing();

    } catch (err) {
      console.error(err);
    } finally {
      animationInProgress = false;

      // After grid → enter solo mode; otherwise schedule next
      if (layouts[currentLayout] === 'grid') {
        loopTimeout = setTimeout(enterSoloMode, TIMING.formationHold);
      } else {
        const holdTime = layouts[currentLayout] === 'final'
          ? TIMING.formationHold * 1.2
          : TIMING.formationHold;
        loopTimeout = setTimeout(animationLoop, holdTime);
      }
    }
  }

  // ═══════════════════════════════════════════
  // SOLO ONE-BY-ONE REVEAL — "Spotlight Dance"
  // ═══════════════════════════════════════════
  function enterSoloMode() {
    if (isPaused) return;

    if (breathingTween) {
      breathingTween.kill();
      breathingTween = null;
    }

    gsap.killTweensOf([...words, ...narratives, kingdom, bahrain, ...letters]);
    gsap.set(words, { opacity: 0 });
    gsap.set(narratives, { opacity: 0 });
    gsap.set([kingdom, bahrain], { opacity: 0 });

    container.classList.remove(...ALL_LAYOUT_CLASSES);
    container.classList.add('solo');

    letters.forEach(l => {
      l.classList.remove('solo-active');
      gsap.set(l, { opacity: 0, scale: 0.5, x: 0, y: 0, rotation: -15 });
    });

    soloIndex = 0;
    advanceSoloLetter();
  }

  function advanceSoloLetter() {
    if (isPaused) return;

    if (soloIndex >= letters.length) {
      exitSoloMode();
      return;
    }

    const letter = letters[soloIndex];
    const word = letter.querySelector('.word');
    const narrative = letter.querySelector('.narrative');
    const narrativeType = letter.dataset.narrative;
    const storyArc = characterNarratives[narrativeType];

    // Hide previous letter with exit dance
    if (soloIndex > 0) {
      const prev = letters[soloIndex - 1];
      const prevWord = prev.querySelector('.word');
      const prevNarr = prev.querySelector('.narrative');

      const exitTl = gsap.timeline();
      exitTl.to(prevWord, { opacity: 0, y: 15, duration: BEAT.quarter() }, 0);
      exitTl.to(prevNarr, { opacity: 0, y: 15, duration: BEAT.quarter() }, 0);
      exitTl.to(prev, {
        opacity: 0, scale: 0.5, rotation: 15,
        duration: BEAT.half(),
        ease: EASE.snapOut
      }, BEAT.quarter() * 0.5);
      prev.classList.remove('solo-active');
    }

    // Spotlight entrance for current letter
    letter.classList.add('solo-active');
    const tl = gsap.timeline();

    // Letter spins in from the other side
    tl.fromTo(letter, {
      opacity: 0, scale: 0.5, rotation: -15
    }, {
      opacity: 1,
      scale: 1,
      rotation: 0,
      duration: BEAT.interval,
      ease: EASE.elastic
    }, BEAT.quarter());

    // Landing pulse
    tl.to(letter, {
      scale: 1.1,
      duration: BEAT.quarter(),
      ease: EASE.punch,
      yoyo: true,
      repeat: 1,
    }, BEAT.interval);

    // Particles burst on beat
    tl.call(() => {
      const pc = letter.querySelector('.particles-container');
      if (pc) {
        const pType = storyArc.emotion === 'wonder' ? 'gold' :
                      storyArc.emotion === 'warmth' ? 'silver' : 'default';
        new ParticleSystem(pc, pType).start();
      }
    }, null, BEAT.interval * 0.8);

    // Word fades in on the next beat
    tl.to(word, {
      opacity: 1,
      y: 0,
      duration: BEAT.interval,
      ease: EASE.whip
    }, BEAT.interval * 1.5);

    // Narrative fades in on the beat after
    tl.to(narrative, {
      opacity: 1,
      y: 0,
      scale: 1,
      duration: BEAT.interval * 1.5,
      ease: "power3.out"
    }, BEAT.double());

    soloIndex++;
    soloTimer = setTimeout(advanceSoloLetter, TIMING.soloRevealTime);
  }

  function exitSoloMode() {
    clearTimeout(soloTimer);

    if (breathingTween) {
      breathingTween.kill();
      breathingTween = null;
    }

    // Graceful exit: fade out the last solo letter
    const exitTl = gsap.timeline({
      onComplete: () => {
        letters.forEach(l => l.classList.remove('solo-active'));
        container.classList.remove('solo');
        container.classList.add('plain');
        currentLayout = 0;

        // Reset everything cleanly
        gsap.set(letters, { opacity: 1, scale: 1, x: 0, y: 0, rotation: 0, clearProps: 'position,width,height,rotationX,rotationY' });
        gsap.set(words, { opacity: 0, y: 20 });
        gsap.set(narratives, { opacity: 0, y: 30, scale: 0.9 });
        gsap.set([kingdom, bahrain], { opacity: 0 });

        // Show Claude co-sign after first complete cycle
        loopCount++;
        if (loopCount === 1) {
          setTimeout(showClaudeCosign, 500);
        }

        if (!isPaused) {
          loopTimeout = setTimeout(animationLoop, BEAT.bars(1));
        }
      }
    });

    letters.forEach((l, i) => {
      exitTl.to(l, {
        opacity: 0, scale: 0.3,
        duration: BEAT.half(),
        ease: EASE.snapOut
      }, i * 0.05);
    });
  }

  // ═══════════════════════════════════════════
  // MAIN ANIMATION LOOP
  // ═══════════════════════════════════════════
  async function animationLoop() {
    if (isPaused) return;

    if (isMobile) {
      if (!container.classList.contains('showcase')) {
        enterShowcaseMode();
      }
      return;
    }

    if (container.classList.contains('showcase')) {
      exitShowcaseMode();
      container.classList.remove(...ALL_LAYOUT_CLASSES);
      container.classList.add('plain');
      currentLayout = 0;
    }

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

    if (breathingTween) {
      breathingTween.kill();
      breathingTween = null;
    }

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

  // ═══════════════════════════════════════════
  // RESIZE & VISIBILITY HANDLERS (inside closure)
  // ═══════════════════════════════════════════
  window.addEventListener('resize', () => {
    const mobileNow = window.innerWidth <= 768;
    if (!mobileNow && !animationInProgress) {
      clearTimeout(loopTimeout);
      loopTimeout = setTimeout(animationLoop, 2500);
    }
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      gsap.globalTimeline.pause();
    } else {
      gsap.globalTimeline.resume();
    }
  });

  // ═══════════════════════════════════════════
  // CLAUDE CO-SIGN — animated glimpse
  // ═══════════════════════════════════════════
  const claudeCosign = document.getElementById('claudeCosign');
  let cosignShown = false;

  function showClaudeCosign() {
    if (cosignShown) return;
    cosignShown = true;

    claudeCosign.classList.add('visible');

    // Sparkle entrance
    gsap.fromTo(claudeCosign, {
      scale: 0.5, rotation: -20
    }, {
      scale: 1, rotation: 0,
      duration: BEAT.interval,
      ease: EASE.elastic
    });

    // Fade away after a glimpse
    gsap.to(claudeCosign, {
      opacity: 0,
      scale: 0.8,
      y: 10,
      duration: BEAT.interval,
      ease: 'power2.in',
      delay: 4,
      onComplete: () => {
        claudeCosign.classList.remove('visible');
        cosignShown = false;
      }
    });
  }

  // Show after the first full loop cycle (after grid → solo → back to plain)
  let loopCount = 0;

  // ═══════════════════════════════════════════
  // KICK OFF
  // ═══════════════════════════════════════════
  createInitialEntrance().then(() => {
    if (isMobile) {
      enterShowcaseMode();
    } else {
      loopTimeout = setTimeout(animationLoop, BEAT.bars(1));
    }
  });
});
