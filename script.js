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

  // Set initial states
  gsap.set(words, { opacity: 0, y: 20 });
  gsap.set(narratives, { opacity: 0, y: 30, scale: 0.9 });
  gsap.set([kingdom, bahrain], { opacity: 0, display: 'none' });
  gsap.set(letters, { scale: 1, opacity: 1 });

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

  const layouts = ['final', 'plain', 'columns', 'rows', 'grid'];
  let currentLayout = 0;
  let animationInProgress = false;
  let loopTimeout;
  let finalRevealTriggered = false;

  async function changeLayout() {
    if (animationInProgress) return;
    animationInProgress = true;

    try {
      if (!finalRevealTriggered && currentLayout === layouts.length - 2) {
        setTimeout(() => {
          if (!finalRevealTriggered) {
            finalRevealTriggered = true;
            createFinalRevealSequence();
          }
        }, TIMING.finalRevealStart);
      }

      if (layouts[currentLayout] === 'grid') {
        await hideWordsAndNarratives();
        await new Promise(resolve => {
          gsap.to(letters, {
            scale: 1,
            duration: 0.8,
            ease: "power2.inOut",
            stagger: 0.08,
            onComplete: resolve
          });
        });
      }

      // --- REVISED SECTION FOR SEAMLESS TRANSITION ---

      // 1. Capture the state before any changes
      const state = Flip.getState(letters, {
        props: "transform,filter", // Be explicit about animated properties (removed opacity to prevent transparency)
        simple: true
      });

      // 2. Make the DOM change immediately
      container.classList.remove(layouts[currentLayout]);
      currentLayout = (currentLayout + 1) % layouts.length;
      container.classList.add(layouts[currentLayout]);

      // Handle kingdom/bahrain visibility right after the class change
      if (layouts[currentLayout] === 'final') {
        // gsap.set([kingdom, bahrain], { display: 'block', opacity: 0 }); // Set initial state for fade-in
        gsap.to([kingdom, bahrain], {
          opacity: 1,
          duration: 1.2,
          delay: 0.8, // Delay to start after letters settle
          ease: "elastic.out(1, 0.3)",
          stagger: 0.3,
          scale: 1.05,
          filter: "drop-shadow(0 5px 15px rgba(206, 17, 38, 0.3))"
        });
      } else {
        gsap.to([kingdom, bahrain], {
          // opacity: 0,
          duration: 0.4,
          ease: "power2.inOut",
          onComplete: () => gsap.set([kingdom, bahrain], { display: 'none' })
        });
      }

      // 3. Animate from the old state to the new one seamlessly
      await new Promise(resolve => {
        Flip.from(state, {
          duration: 1.8, // A slightly longer duration for a more graceful feel
          ease: "expo.inOut", // A smoother, more elegant ease
          stagger: {
            each: 0.07, // Fine-tune stagger for fluid motion
            from: "center" // Animate from the center for a more organic feel
          },
          scale: true, // This allows Flip to also animate any scale changes defined in the CSS
          onComplete: resolve
        });
      });

      // --- END REVISED SECTION ---

      if (layouts[currentLayout] === 'grid') {
        const gridTl = gsap.timeline();
        gridTl.to(letters, {
          scale: 0.65,
          duration: 1,
          ease: "power2.inOut",
          stagger: 0.08
        });
        gridTl.add(showWordsWithNarratives(), "-=0.5");
        await gridTl;
      }

    } catch (error) {
      console.error('Animation error:', error);
    } finally {
      animationInProgress = false;

      if (currentLayout === 0) {
        finalRevealTriggered = false;
        letters.forEach(letter => {
          letter.classList.remove('final-reveal-active');
        });
      }
    }
  }

  async function animationLoop() {
    clearTimeout(loopTimeout);
    await changeLayout();
    const displayedLayoutIndex = (currentLayout + layouts.length - 1) % layouts.length;
    const displayedLayoutName = layouts[displayedLayoutIndex];
    const delay = (displayedLayoutName === 'grid') ? 8000 : 3000;
    loopTimeout = setTimeout(animationLoop, delay);
  }

  createInitialEntrance().then(() => {
    loopTimeout = setTimeout(animationLoop, 3000);
  });
});

window.addEventListener('resize', () => {
  if (!animationInProgress) {
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