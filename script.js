document.addEventListener('DOMContentLoaded', function () {
  gsap.registerPlugin(Flip);

  // ── DOM references ───────────────────────────────────────
  const container = document.querySelector('.container');
  const letters   = document.querySelectorAll('.letter');
  const words      = document.querySelectorAll('.word');
  const narratives = document.querySelectorAll('.narrative');
  const kingdom    = document.querySelector('.kingdom');
  const bahrain    = document.querySelector('.bahrain');

  // ── Initial GSAP states ──────────────────────────────────
  // autoAlpha:0 sets both opacity:0 AND visibility:hidden,
  // bypassing any display:none concern entirely.
  gsap.set(words,      { autoAlpha: 0, y: 20 });
  gsap.set(narratives, { autoAlpha: 0, y: 30, scale: 0.9 });
  gsap.set([kingdom, bahrain], { autoAlpha: 0, display: 'none' });
  gsap.set(letters, { opacity: 1, scale: 1 });

  // ═══════════════════════════════════════════
  // SEARCH SYSTEM
  // ═══════════════════════════════════════════
  const searchContainer = document.getElementById('searchContainer');
  const searchToggle    = document.getElementById('searchToggle');
  const searchInput     = document.getElementById('searchInput');
  const searchResults   = document.getElementById('searchResults');

  const searchData = Array.from(letters).map(letter => {
    const wordEl   = letter.querySelector('.word');
    const titleEl  = letter.querySelector('.story-title');
    const textEl   = letter.querySelector('.story-text');
    const arabicEl = letter.querySelector('.arabic');
    const letterChar = letter.textContent.trim().charAt(0);
    return {
      letter:  letterChar,
      word:    wordEl    ? wordEl.childNodes[0].textContent.trim()  : '',
      title:   titleEl   ? titleEl.textContent.trim()               : '',
      story:   textEl    ? textEl.textContent.trim()                 : '',
      arabic:  arabicEl  ? arabicEl.textContent.trim()              : '',
      element: letter
    };
  });

  let searchOpen = false;

  searchToggle.addEventListener('click', () => {
    searchOpen = !searchOpen;
    searchContainer.classList.toggle('active', searchOpen);
    if (searchOpen) searchInput.focus();
    else { searchInput.value = ''; clearSearch(); }
  });
  searchInput.addEventListener('input', e => {
    const q = e.target.value.trim().toLowerCase();
    q.length ? performSearch(q) : clearSearch();
  });
  searchInput.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      searchOpen = false;
      searchContainer.classList.remove('active');
      searchInput.value = ''; clearSearch();
    }
  });
  document.addEventListener('click', e => {
    if (searchOpen && !searchContainer.contains(e.target)) {
      searchOpen = false;
      searchContainer.classList.remove('active');
      searchInput.value = ''; clearSearch();
    }
  });

  function performSearch(query) {
    const matches = searchData.filter(item =>
      item.letter.toLowerCase().includes(query) ||
      item.word.toLowerCase().includes(query)   ||
      item.title.toLowerCase().includes(query)  ||
      item.story.toLowerCase().includes(query)  ||
      item.arabic.includes(query)
    );
    letters.forEach(l => l.classList.remove('search-match', 'search-dimmed'));
    if (matches.length && matches.length < searchData.length) {
      const matchSet = new Set(matches.map(m => m.element));
      letters.forEach(l => l.classList.add(matchSet.has(l) ? 'search-match' : 'search-dimmed'));
    }
    searchResults.innerHTML = '';
    if (matches.length) {
      matches.forEach(item => {
        const div = document.createElement('div');
        div.className = 'search-result-item';
        div.innerHTML = `
          <span class="search-result-letter">${item.letter}</span>
          <div class="search-result-text">
            <div class="result-word">${highlight(item.word, query)}</div>
            <div class="result-story">${highlight(item.title, query)}</div>
          </div>`;
        div.addEventListener('click', () => focusLetter(item.element));
        searchResults.appendChild(div);
      });
      gsap.from('.search-result-item', { opacity: 0, y: -8, stagger: 0.05, duration: 0.3, ease: 'power2.out' });
    } else {
      const empty = document.createElement('div');
      empty.className = 'search-result-item';
      empty.innerHTML = '<span class="search-result-text" style="color:rgba(245,233,217,.5)">No matches found</span>';
      searchResults.appendChild(empty);
    }
    searchResults.classList.add('visible');
  }

  function highlight(text, query) {
    if (!query) return text;
    const re = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')})`, 'gi');
    return text.replace(re, '<span class="search-highlight">$1</span>');
  }

  function clearSearch() {
    searchResults.classList.remove('visible');
    searchResults.innerHTML = '';
    letters.forEach(l => l.classList.remove('search-match', 'search-dimmed'));
  }

  function focusLetter(el) {
    el.classList.remove('search-focus');
    void el.offsetWidth;
    el.classList.add('search-focus');
    gsap.to(el, { scale: 1.2, duration: 0.3, ease: 'back.out(1.7)', yoyo: true, repeat: 1 });
    setTimeout(() => el.classList.remove('search-focus'), 1600);
  }

  // ═══════════════════════════════════════════
  // VOICE / SPEECH SYNTHESIS
  // ═══════════════════════════════════════════
  const voiceBtn      = document.getElementById('voiceBtn');
  const voiceIcon     = voiceBtn.querySelector('.voice-icon');
  const voiceStopIcon = voiceBtn.querySelector('.voice-stop-icon');
  const voiceWave     = document.getElementById('voiceWave');

  let isSpeaking = false;
  let currentSpeechIndex = -1;

  voiceBtn.addEventListener('click', () => {
    isSpeaking ? stopSpeaking() : startNarration();
  });

  function startNarration() {
    if (!('speechSynthesis' in window)) return;
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
    if (currentSpeechIndex >= searchData.length || !isSpeaking) { stopSpeaking(); return; }
    const item = searchData[currentSpeechIndex];
    letters.forEach(l => l.classList.remove('search-match'));
    item.element.classList.add('search-match');
    gsap.to(item.element, { scale: 1.15, boxShadow: '0 0 40px rgba(206,17,38,.5)', duration: 0.4, ease: 'back.out(1.7)' });
    const utt = new SpeechSynthesisUtterance(`${item.word}. ${item.title}. ${item.story}`);
    utt.rate = 0.9; utt.pitch = 1; utt.volume = 1;
    const voices = window.speechSynthesis.getVoices();
    const v = voices.find(v => v.lang.startsWith('en') && v.name.includes('Google')) || voices.find(v => v.lang.startsWith('en'));
    if (v) utt.voice = v;
    utt.onend = () => {
      gsap.to(item.element, { scale: 1, duration: 0.4, ease: 'power2.out' });
      item.element.classList.remove('search-match');
      currentSpeechIndex++;
      if (isSpeaking) setTimeout(speakNext, 400);
    };
    utt.onerror = () => { currentSpeechIndex++; if (isSpeaking) speakNext(); };
    window.speechSynthesis.speak(utt);
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
    window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
  }

  // ═══════════════════════════════════════════
  // INTERACTIONS — ripple, glow trail, stardust
  // ═══════════════════════════════════════════
  letters.forEach(letter => {
    const glowTrail = document.createElement('div');
    glowTrail.className = 'glow-trail';
    letter.appendChild(glowTrail);

    letter.addEventListener('mousemove', e => {
      const r = letter.getBoundingClientRect();
      glowTrail.style.left = (e.clientX - r.left - 30) + 'px';
      glowTrail.style.top  = (e.clientY - r.top  - 30) + 'px';
    });

    letter.addEventListener('click', e => {
      const r = letter.getBoundingClientRect();
      // Ripple
      const ripple = document.createElement('div');
      ripple.className = 'ripple';
      const size = Math.max(r.width, r.height) * 2;
      ripple.style.cssText = `width:${size}px;height:${size}px;left:${e.clientX-r.left-size/2}px;top:${e.clientY-r.top-size/2}px;`;
      letter.appendChild(ripple);
      gsap.to(ripple, { scale: 1, opacity: 0, duration: 0.6, ease: 'power2.out', onComplete: () => ripple.remove() });
      // Stardust
      for (let i = 0; i < 8; i++) {
        const dust = document.createElement('div');
        dust.style.cssText = `position:absolute;width:4px;height:4px;background:radial-gradient(circle,rgba(212,175,55,.9),transparent);border-radius:50%;pointer-events:none;left:${e.clientX-r.left}px;top:${e.clientY-r.top}px;z-index:10;`;
        letter.appendChild(dust);
        const angle = (Math.PI * 2 * i) / 8;
        const dist  = 30 + Math.random() * 40;
        gsap.to(dust, { x: Math.cos(angle)*dist, y: Math.sin(angle)*dist, opacity: 0, scale: 0, duration: 0.6+Math.random()*.3, ease: 'power2.out', onComplete: () => dust.remove() });
      }
    });
  });

  // ═══════════════════════════════════════════
  // PLAY / PAUSE
  // ═══════════════════════════════════════════
  const playPauseBtn = document.getElementById('playPauseBtn');
  const ppPause = playPauseBtn.querySelector('.pp-pause');
  const ppPlay  = playPauseBtn.querySelector('.pp-play');
  let isPaused = false;

  playPauseBtn.addEventListener('click', () => {
    isPaused = !isPaused;
    playPauseBtn.classList.toggle('paused', isPaused);
    ppPause.style.display = isPaused ? 'none'  : 'block';
    ppPlay.style.display  = isPaused ? 'block' : 'none';
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
  // MAGIC SPRINKLER — canvas particle engine
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
      this.w = this.el.offsetWidth  || 300;
      this.h = this.el.offsetHeight || 500;
      this.canvas.width  = this.w * dpr;
      this.canvas.height = this.h * dpr;
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    _color() {
      const p = ['#ce1126','#ff4757','#d4af37','#f5e9d9','#ffffff','#ffcc44','#ff8899'];
      return p[Math.floor(Math.random() * p.length)];
    }

    _push(x, y, vx, vy) {
      this.particles.push({
        x, y, vx, vy,
        size:  3 + Math.random() * 8,
        color: this._color(),
        shape: ['star','circle','diamond','sparkle','ring'][Math.floor(Math.random()*5)],
        life:  1,
        decay: 0.014 + Math.random() * 0.022,
        rot:   Math.random() * Math.PI * 2,
        rotV:  (Math.random() - 0.5) * 0.2,
        grav:  0.07 + Math.random() * 0.07,
        twink: Math.random() < 0.45
      });
    }

    spawnBurst(cx = this.w/2, cy = this.h * 0.28, count = 30) {
      for (let i = 0; i < count; i++) {
        const a = (Math.PI * 2 * i / count) + Math.random() * 0.5;
        const s = 3 + Math.random() * 6;
        this._push(cx, cy, Math.cos(a)*s, Math.sin(a)*s - 2.5);
      }
    }

    spawnFromPointer(clientX, clientY, count = 6) {
      const r = this.el.getBoundingClientRect();
      const x = clientX - r.left, y = clientY - r.top;
      if (x < -10 || x > this.w+10 || y < -10 || y > this.h+10) return;
      for (let i = 0; i < count; i++) {
        const a = Math.random() * Math.PI * 2;
        const s = 1.5 + Math.random() * 3.5;
        this._push(x, y, Math.cos(a)*s, Math.sin(a)*s - 1.5);
      }
    }

    _startAmbient() {
      this.ambientTimer = setInterval(() => {
        if (!this.isRunning) return;
        const x = Math.random() * this.w;
        const y = this.h * 0.55 + Math.random() * this.h * 0.45;
        this._push(x, y, (Math.random()-.5)*1.2, -(0.8+Math.random()*1.5));
      }, 220);
    }

    _drawStar(ctx, spikes, outer, inner) {
      let a = -Math.PI / 2, step = Math.PI / spikes;
      ctx.beginPath();
      for (let i = 0; i < spikes; i++) {
        ctx.lineTo(Math.cos(a)*outer, Math.sin(a)*outer); a += step;
        ctx.lineTo(Math.cos(a)*inner, Math.sin(a)*inner); a += step;
      }
      ctx.closePath(); ctx.fill();
    }

    _drawSparkle(ctx, size) {
      const arms = 4;
      ctx.beginPath();
      for (let i = 0; i < arms*2; i++) {
        const r = i%2===0 ? size : size*.12;
        const a = (Math.PI*i)/arms;
        i===0 ? ctx.moveTo(Math.cos(a)*r,Math.sin(a)*r) : ctx.lineTo(Math.cos(a)*r,Math.sin(a)*r);
      }
      ctx.closePath(); ctx.fill();
    }

    _tick() {
      const ctx = this.ctx, now = Date.now();
      ctx.clearRect(0, 0, this.w, this.h);
      for (let i = this.particles.length-1; i >= 0; i--) {
        const p = this.particles[i];
        p.x += p.vx; p.y += p.vy; p.vy += p.grav; p.vx *= 0.97;
        p.life -= p.twink ? p.decay*(0.6+0.8*Math.abs(Math.sin(now*.008+i))) : p.decay;
        p.rot += p.rotV;
        if (p.life <= 0) { this.particles.splice(i,1); continue; }
        ctx.save();
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.fillStyle = ctx.strokeStyle = p.color;
        ctx.shadowColor = p.color; ctx.shadowBlur = 10;
        ctx.translate(p.x, p.y); ctx.rotate(p.rot);
        switch (p.shape) {
          case 'star':    this._drawStar(ctx, 5, p.size, p.size*.38); break;
          case 'diamond':
            ctx.beginPath();
            ctx.moveTo(0,-p.size); ctx.lineTo(p.size*.52,0);
            ctx.lineTo(0,p.size);  ctx.lineTo(-p.size*.52,0);
            ctx.closePath(); ctx.fill(); break;
          case 'sparkle': this._drawSparkle(ctx, p.size); break;
          case 'ring':
            ctx.beginPath(); ctx.arc(0,0,p.size*.55,0,Math.PI*2);
            ctx.lineWidth = p.size*.22; ctx.stroke(); break;
          default:
            ctx.beginPath(); ctx.arc(0,0,p.size*.48,0,Math.PI*2); ctx.fill();
        }
        ctx.restore();
      }
    }

    start() {
      if (this.isRunning) return;
      this.isRunning = true;
      requestAnimationFrame(() => { this._resize(); this.spawnBurst(this.w/2, this.h*.28, 32); });
      this._startAmbient();
      const loop = () => { if (!this.isRunning) return; this._tick(); this.rafId = requestAnimationFrame(loop); };
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

  // One sprinkler per letter card
  const sprinklers = new WeakMap();
  letters.forEach(l => sprinklers.set(l, new MagicSprinkler(l)));
  let activeSprinkler = null;

  container.addEventListener('mousemove', e => {
    if (activeSprinkler) activeSprinkler.spawnFromPointer(e.clientX, e.clientY, 5);
  });
  container.addEventListener('touchmove', e => {
    if (activeSprinkler && e.touches.length) {
      activeSprinkler.spawnFromPointer(e.touches[0].clientX, e.touches[0].clientY, 4);
    }
  }, { passive: true });

  // ═══════════════════════════════════════════
  // PARTICLE SYSTEM (DOM-based ambient burst)
  // ═══════════════════════════════════════════
  class ParticleSystem {
    constructor(container, type = 'default') {
      this.container = container;
      this.type = type;
      this.isActive = false;
    }
    start() {
      if (this.isActive) return;
      this.isActive = true;
      const interval = setInterval(() => {
        if (!this.isActive) { clearInterval(interval); return; }
        const p = document.createElement('div');
        p.className = `particle ${this.type}`;
        p.style.left = Math.random()*100+'%';
        p.style.top  = Math.random()*100+'%';
        this.container.appendChild(p);
        const tl = gsap.timeline({ onComplete: () => p.remove() });
        tl.to(p, { duration: 3, y: -(100+Math.random()*50), x: (Math.random()-.5)*100, opacity: 1, scale: 1+Math.random()*.5, rotation: Math.random()*360, ease: 'power2.out' })
          .to(p, { duration: 1, opacity: 0, scale: 0, ease: 'power2.in' }, '-=1');
      }, 200+Math.random()*300);
      setTimeout(() => { this.isActive = false; }, 5000);
    }
    stop() { this.isActive = false; }
  }

  // ═══════════════════════════════════════════
  // MOBILE SHOWCASE
  // ═══════════════════════════════════════════
  const isMobileQuery  = window.matchMedia('(max-width: 768px)');
  let isMobile         = isMobileQuery.matches;
  let showcaseIndex    = 0;
  let showcaseAutoTimer = null;
  const showcaseDots   = document.getElementById('showcaseDots');
  const swipeHint      = document.getElementById('swipeHint');

  function buildShowcaseDots() {
    showcaseDots.innerHTML = '';
    letters.forEach((_, i) => {
      const dot = document.createElement('div');
      dot.className = 'showcase-dot' + (i===0 ? ' active' : '');
      dot.addEventListener('click', () => { if (isMobile) showShowcaseCard(i); });
      showcaseDots.appendChild(dot);
    });
  }
  buildShowcaseDots();

  function updateShowcaseDots(index) {
    showcaseDots.querySelectorAll('.showcase-dot').forEach((d,i) => d.classList.toggle('active', i===index));
  }

  function showShowcaseCard(index, direction = 0) {
    showcaseIndex = index;
    updateShowcaseDots(index);

    letters.forEach((letter, i) => {
      const word      = letter.querySelector('.word');
      const narrative = letter.querySelector('.narrative');

      if (i === index) {
        letter.classList.add('showcase-active');

        // Card slides in
        gsap.fromTo(letter,
          { opacity: 0, scale: 0.85, x: direction > 0 ? 80 : direction < 0 ? -80 : 0, rotationY: direction * 15 },
          { opacity: 1, scale: 1, x: 0, rotationY: 0, duration: 0.6, ease: 'back.out(1.2)' }
        );

        // Word: 2.2s dramatic pause, then reveal
        // Using fromTo so the from-state is set immediately (not read from computed style)
        if (word) {
          gsap.killTweensOf(word);
          gsap.fromTo(word,
            { autoAlpha: 0, y: 30, scale: 0.88 },
            { autoAlpha: 1, y: 0, scale: 1, duration: 1.0, delay: 2.2, ease: 'back.out(1.6)' }
          );
        }
        // Narrative follows after word
        if (narrative) {
          gsap.killTweensOf(narrative);
          gsap.fromTo(narrative,
            { autoAlpha: 0, y: 28, scale: 0.93 },
            { autoAlpha: 1, y: 0, scale: 1, duration: 0.85, delay: 3.35, ease: 'power3.out' }
          );
        }

        // Start magic sprinkler
        if (activeSprinkler) activeSprinkler.stop();
        activeSprinkler = sprinklers.get(letter) || null;
        if (activeSprinkler) activeSprinkler.start();

        // DOM particle burst
        const pc = letter.querySelector('.particles-container');
        if (pc) new ParticleSystem(pc, 'gold').start();

      } else {
        // Exit: snap word/narrative back to hidden, fade letter out
        if (letter.classList.contains('showcase-active')) {
          if (word)      { gsap.killTweensOf(word);      gsap.set(word,      { autoAlpha: 0, y: 30, scale: 0.88 }); }
          if (narrative) { gsap.killTweensOf(narrative); gsap.set(narrative, { autoAlpha: 0, y: 28, scale: 0.93 }); }
          gsap.to(letter, {
            opacity: 0, scale: 0.85,
            x: direction > 0 ? -60 : direction < 0 ? 60 : 0,
            duration: 0.35, ease: 'power2.in',
            onComplete: () => {
              letter.classList.remove('showcase-active');
              const s = sprinklers.get(letter);
              if (s) s.stop();
            }
          });
        } else {
          letter.classList.remove('showcase-active');
          gsap.set(letter, { opacity: 0 });
          if (word)      gsap.set(word,      { autoAlpha: 0, y: 30, scale: 0.88 });
          if (narrative) gsap.set(narrative, { autoAlpha: 0, y: 28, scale: 0.93 });
          const s = sprinklers.get(letter);
          if (s && s.isRunning) s.stop();
        }
      }
    });
  }

  const nextShowcaseCard = () => showShowcaseCard((showcaseIndex+1) % letters.length, 1);
  const prevShowcaseCard = () => showShowcaseCard((showcaseIndex-1+letters.length) % letters.length, -1);

  function startShowcaseAuto() {
    clearInterval(showcaseAutoTimer);
    showcaseAutoTimer = setInterval(nextShowcaseCard, 7000);
  }
  function stopShowcaseAuto() { clearInterval(showcaseAutoTimer); }

  // ── Touch / swipe ─────────────────────────────────────────
  let touchStartX = 0, touchStartY = 0, touchStartTime = 0;
  let isSwipeTransitioning = false;

  container.addEventListener('touchstart', e => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
    touchStartTime = Date.now();
    stopShowcaseAuto();
  }, { passive: true });

  container.addEventListener('touchend', e => {
    if (!isMobile) return;
    const dx = e.changedTouches[0].clientX - touchStartX;
    const dy = e.changedTouches[0].clientY - touchStartY;
    const dt = Date.now() - touchStartTime;
    if (!isSwipeTransitioning && Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)*1.5 && dt < 500) {
      isSwipeTransitioning = true;
      setTimeout(() => { isSwipeTransitioning = false; }, 650);
      dx < 0 ? nextShowcaseCard() : prevShowcaseCard();
      swipeHint.classList.remove('visible');
    }
    setTimeout(startShowcaseAuto, 8000);
  }, { passive: true });

  // ── Enter / exit showcase mode ─────────────────────────────
  function enterShowcaseMode() {
    container.classList.remove('final','plain','columns','rows','grid','solo');
    container.classList.add('showcase');
    showcaseDots.classList.add('visible');
    swipeHint.classList.add('visible');
    setTimeout(() => swipeHint.classList.remove('visible'), 4000);

    // Reset all letters to hidden clean state
    gsap.killTweensOf([...letters, ...words, ...narratives]);
    letters.forEach(l => {
      l.classList.remove('showcase-active');
      gsap.set(l, { clearProps: 'x,rotationY' });
      gsap.set(l, { opacity: 0, scale: 0.85 });
      const w = l.querySelector('.word');
      const n = l.querySelector('.narrative');
      if (w) gsap.set(w, { autoAlpha: 0, y: 30, scale: 0.88 });
      if (n) gsap.set(n, { autoAlpha: 0, y: 28, scale: 0.93 });
    });

    showShowcaseCard(0, 0);
    startShowcaseAuto();
  }

  function exitShowcaseMode() {
    stopShowcaseAuto();
    container.classList.remove('showcase');
    showcaseDots.classList.remove('visible');
    swipeHint.classList.remove('visible');
    if (activeSprinkler) { activeSprinkler.stop(); activeSprinkler = null; }
    letters.forEach(l => {
      l.classList.remove('showcase-active');
      gsap.set(l, { clearProps: 'all' });
      const s = sprinklers.get(l);
      if (s && s.isRunning) s.stop();
    });
    gsap.set(letters,   { scale: 1, opacity: 1 });
    gsap.set(words,     { autoAlpha: 0, y: 20 });
    gsap.set(narratives,{ autoAlpha: 0, y: 30, scale: 0.9 });
  }

  // ═══════════════════════════════════════════
  // DESKTOP LAYOUT CYCLE
  // plain → final → columns → rows → grid → solo → loop
  // ═══════════════════════════════════════════
  const layouts = ['plain','final','columns','rows','grid'];
  const ALL_CLASSES = ['plain','final','columns','rows','grid','solo','showcase'];
  let currentLayout = 0;
  let animationInProgress = false;
  let loopTimeout;

  async function changeLayout() {
    if (animationInProgress || isPaused) return;
    animationInProgress = true;

    try {
      // Hide words/narratives/kingdom before FLIP
      gsap.killTweensOf([...words, ...narratives, kingdom, bahrain]);
      await gsap.timeline()
        .to([...words,...narratives], { autoAlpha: 0, y: 15, scale: 0.92, duration: 0.4, ease: 'power2.in', stagger: 0 }, 0)
        .to([kingdom, bahrain],       { autoAlpha: 0, duration: 0.3 }, 0);

      gsap.set(letters, { opacity: 1 }); // letters always visible

      // GSAP FLIP: capture → switch class → animate
      const state = Flip.getState(letters, { props: 'transform,filter,width,height,margin,padding', simple: true, tolerance: 0.01 });
      container.classList.remove(...ALL_CLASSES);
      currentLayout = (currentLayout + 1) % layouts.length;
      container.classList.add(layouts[currentLayout]);

      await new Promise(resolve => {
        Flip.from(state, { duration: 1.6, ease: 'power3.inOut', stagger: { amount: 0.45, from: 'center' }, scale: true, simple: true, onComplete: resolve });
      });

      gsap.set(letters, { opacity: 1 }); // re-ensure after FLIP

      // Reveal content for new layout
      const layout = layouts[currentLayout];

      if (layout === 'final') {
        gsap.set([kingdom, bahrain], { display: 'block' });
        await gsap.timeline()
          .fromTo([kingdom, bahrain],
            { autoAlpha: 0, scale: 0.7, y: 20 },
            { autoAlpha: 1, scale: 1, y: 0, duration: 2.2, ease: 'elastic.out(1.1,0.4)', stagger: 0.35 },
            0.6
          );
      }

      if (layout === 'grid') {
        await gsap.timeline()
          .to([...words],     { autoAlpha: 1, y: 0, scale: 1, duration: 1.4, ease: 'back.out(1.6)', stagger: 0.08 }, 0.6)
          .to([...narratives],{ autoAlpha: 1, y: 0, scale: 1, duration: 1.6, ease: 'power3.out',    stagger: 0.1  }, 0.9);
      }

    } catch (err) {
      console.error(err);
    } finally {
      animationInProgress = false;
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
  let soloTimer;
  let soloIndex = 0;

  function enterSoloMode() {
    if (isPaused) return;
    gsap.killTweensOf([...words, ...narratives, kingdom, bahrain]);
    gsap.set([...words, ...narratives, kingdom, bahrain], { autoAlpha: 0 });
    container.classList.remove(...ALL_CLASSES);
    container.classList.add('solo');
    letters.forEach(l => { l.classList.remove('solo-active'); gsap.set(l, { opacity: 0, scale: 0.7 }); });
    soloIndex = 0;
    advanceSoloLetter();
  }

  function advanceSoloLetter() {
    if (isPaused) return;
    if (soloIndex >= letters.length) { exitSoloMode(); return; }

    const letter    = letters[soloIndex];
    const word      = letter.querySelector('.word');
    const narrative = letter.querySelector('.narrative');

    // Hide previous
    if (soloIndex > 0) {
      const prev     = letters[soloIndex-1];
      const prevWord = prev.querySelector('.word');
      const prevNarr = prev.querySelector('.narrative');
      gsap.to(prev,     { opacity: 0, scale: 0.7, duration: 0.5, ease: 'power2.in' });
      if (prevWord) gsap.to(prevWord, { autoAlpha: 0, y: 15, duration: 0.3 });
      if (prevNarr) gsap.to(prevNarr, { autoAlpha: 0, y: 15, duration: 0.3 });
      prev.classList.remove('solo-active');
    }

    letter.classList.add('solo-active');
    const tl = gsap.timeline();

    // Letter appears center-stage
    tl.fromTo(letter,
      { opacity: 0, scale: 0.6 },
      { opacity: 1, scale: 1, duration: 0.9, ease: 'back.out(1.4)' },
      0.3
    );

    // Magic sprinkler burst
    tl.call(() => {
      if (activeSprinkler) activeSprinkler.stop();
      activeSprinkler = sprinklers.get(letter) || null;
      if (activeSprinkler) activeSprinkler.start();
      const pc = letter.querySelector('.particles-container');
      if (pc) new ParticleSystem(pc, 'gold').start();
    }, null, 0.6);

    // Word: 2-second dramatic pause then reveal (same timing as showcase)
    if (word) {
      gsap.set(word, { autoAlpha: 0, y: 30, scale: 0.88 });
      tl.fromTo(word,
        { autoAlpha: 0, y: 30, scale: 0.88 },
        { autoAlpha: 1, y: 0, scale: 1, duration: 1.2, ease: 'back.out(1.5)' },
        3.0
      );
    }

    // Narrative 1s after word
    if (narrative) {
      gsap.set(narrative, { autoAlpha: 0, y: 30, scale: 0.9 });
      tl.fromTo(narrative,
        { autoAlpha: 0, y: 30, scale: 0.9 },
        { autoAlpha: 1, y: 0, scale: 1, duration: 1.4, ease: 'power3.out' },
        4.2
      );
    }

    soloIndex++;
    soloTimer = setTimeout(advanceSoloLetter, 8000);
  }

  function exitSoloMode() {
    clearTimeout(soloTimer);
    if (activeSprinkler) { activeSprinkler.stop(); activeSprinkler = null; }
    letters.forEach(l => l.classList.remove('solo-active'));
    container.classList.remove('solo');
    container.classList.add('plain');
    currentLayout = 0;
    gsap.set(letters,    { opacity: 1, scale: 1, x: 0, y: 0, clearProps: 'position,width,height' });
    gsap.set(words,      { autoAlpha: 0, y: 20 });
    gsap.set(narratives, { autoAlpha: 0, y: 30, scale: 0.9 });
    gsap.set([kingdom, bahrain], { autoAlpha: 0 });
    if (!isPaused) loopTimeout = setTimeout(animationLoop, 3000);
  }

  // ═══════════════════════════════════════════
  // MAIN ANIMATION LOOP
  // ═══════════════════════════════════════════
  async function animationLoop() {
    if (isPaused) return;
    if (isMobile) {
      if (!container.classList.contains('showcase')) enterShowcaseMode();
      return;
    }
    if (container.classList.contains('showcase')) {
      exitShowcaseMode();
      container.classList.remove(...ALL_CLASSES);
      container.classList.add('plain');
      currentLayout = 0;
    }
    if (container.classList.contains('solo')) { exitSoloMode(); return; }
    clearTimeout(loopTimeout);
    await changeLayout();
  }

  // ── Entrance animation ────────────────────────────────────
  function createEntrance() {
    const tl = gsap.timeline();
    letters.forEach((letter, i) => {
      tl.from(letter, {
        duration: 1.5,
        scale: 0.3,
        opacity: 0,
        rotationY: -90,
        z: -200,
        ease: 'back.out(1.4)',
        delay: i * 0.15
      }, 0.3);
    });
    return tl;
  }

  // ── Responsive viewport switch ────────────────────────────
  isMobileQuery.addEventListener('change', e => {
    isMobile = e.matches;
    clearTimeout(loopTimeout);
    clearTimeout(soloTimer);
    stopShowcaseAuto();
    if (isMobile) {
      if (container.classList.contains('solo')) exitSoloMode();
      enterShowcaseMode();
    } else {
      exitShowcaseMode();
      container.classList.remove(...ALL_CLASSES);
      container.classList.add('plain');
      currentLayout = 0;
      gsap.set(letters, { scale: 1, opacity: 1 });
      if (!isPaused) loopTimeout = setTimeout(animationLoop, 2000);
    }
  });

  // ── Kick off ──────────────────────────────────────────────
  createEntrance().then(() => {
    if (isMobile) {
      enterShowcaseMode();
    } else {
      loopTimeout = setTimeout(animationLoop, 3000);
    }
  });
});

// Pause GSAP when tab is hidden
document.addEventListener('visibilitychange', () => {
  document.hidden ? gsap.globalTimeline.pause() : gsap.globalTimeline.resume();
});
