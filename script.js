document.addEventListener('DOMContentLoaded', function () {
  // Register GSAP Flip plugin
  gsap.registerPlugin(Flip);

  // Get elements
  const container = document.querySelector('.container');
  const letters = document.querySelectorAll('.letter');
  const words = document.querySelectorAll('.word');
  const kingdom = document.querySelector('.kingdom');
  const bahrain = document.querySelector('.bahrain');

  // Create particle system
  createParticleSystem();
  createStarField();

  // Add interactive sound-like feedback (disabled during development to avoid conflicts)
  // addInteractiveEffects();

  function createParticleSystem() {
    const particlesContainer = document.getElementById('particles');
    const arabicWords = ['البحرين', 'جميلة', 'أصيلة', 'مضيافة', 'صامدة', 'طموحة', 'مبتكرة', 'نبيلة', 'المملكة', 'العربية'];

    for (let i = 0; i < 15; i++) {
      const particle = document.createElement('div');
      particle.className = 'particle';
      particle.textContent = arabicWords[Math.floor(Math.random() * arabicWords.length)];
      particle.style.left = Math.random() * 100 + '%';
      particle.style.top = Math.random() * 100 + '%';
      particle.style.animationDelay = Math.random() * 20 + 's';
      particle.style.animationDuration = (15 + Math.random() * 10) + 's';
      particlesContainer.appendChild(particle);
    }
  }

  function createStarField() {
    const starsContainer = document.getElementById('stars');
    for (let i = 0; i < 100; i++) {
      const star = document.createElement('div');
      star.className = 'star';
      star.style.left = Math.random() * 100 + '%';
      star.style.top = Math.random() * 100 + '%';
      star.style.animationDelay = Math.random() * 3 + 's';
      star.style.animationDuration = (2 + Math.random() * 2) + 's';
      starsContainer.appendChild(star);
    }
  }

  function addInteractiveEffects() {
    letters.forEach((letter, index) => {
      // Add staggered animation delay
      letter.style.animationDelay = (index * 0.2) + 's';

      letter.addEventListener('mouseenter', function() {
        // Create ripple effect
        createRipple(this);

        // Create sound wave effect
        createSoundWave(this);

        // Add 3D rotation with enhanced effects
        gsap.to(this, {
          duration: 0.3,
          rotationY: 15,
          rotationX: 10,
          scale: 1.15,
          z: 50,
          ease: "power2.out"
        });

        // Add temporary glow
        this.style.filter = 'drop-shadow(0 0 20px rgba(206, 17, 38, 0.8))';
      });

      letter.addEventListener('mouseleave', function() {
        gsap.to(this, {
          duration: 0.4,
          rotationY: 0,
          rotationX: 0,
          scale: 1,
          z: 0,
          ease: "power2.out"
        });

        // Remove glow
        this.style.filter = '';
      });

      // Add click effect for touch devices
      letter.addEventListener('click', function() {
        createFireworks(this);
      });
    });
  }

  function createSoundWave(element) {
    for (let i = 0; i < 3; i++) {
      const wave = document.createElement('div');
      wave.style.position = 'absolute';
      wave.style.top = '50%';
      wave.style.left = '50%';
      wave.style.width = '100px';
      wave.style.height = '100px';
      wave.style.border = '2px solid rgba(206, 17, 38, 0.5)';
      wave.style.borderRadius = '50%';
      wave.style.transform = 'translate(-50%, -50%)';
      wave.style.pointerEvents = 'none';
      wave.style.zIndex = '5';

      element.appendChild(wave);

      gsap.fromTo(wave,
        { scale: 0.5, opacity: 0.7 },
        {
          scale: 2 + i * 0.5,
          opacity: 0,
          duration: 1 + i * 0.2,
          delay: i * 0.1,
          ease: 'power2.out',
          onComplete: () => wave.remove()
        }
      );
    }
  }

  function createFireworks(element) {
    const colors = ['#ce1126', '#f5e9d9', '#ff4757', '#ffffff'];

    for (let i = 0; i < 12; i++) {
      const firework = document.createElement('div');
      firework.style.position = 'absolute';
      firework.style.width = '4px';
      firework.style.height = '4px';
      firework.style.background = colors[Math.floor(Math.random() * colors.length)];
      firework.style.borderRadius = '50%';
      firework.style.top = '50%';
      firework.style.left = '50%';
      firework.style.pointerEvents = 'none';
      firework.style.zIndex = '15';

      element.appendChild(firework);

      const angle = (i / 12) * Math.PI * 2;
      const distance = 60 + Math.random() * 40;
      const x = Math.cos(angle) * distance;
      const y = Math.sin(angle) * distance;

      gsap.to(firework, {
        x: x,
        y: y,
        scale: 0,
        duration: 0.8,
        ease: 'power2.out',
        onComplete: () => firework.remove()
      });
    }
  }  function createRipple(element) {
    const ripple = document.createElement('div');
    ripple.style.position = 'absolute';
    ripple.style.width = '0px';
    ripple.style.height = '0px';
    ripple.style.background = 'radial-gradient(circle, rgba(255,255,255,0.6) 0%, transparent 70%)';
    ripple.style.borderRadius = '50%';
    ripple.style.top = '50%';
    ripple.style.left = '50%';
    ripple.style.transform = 'translate(-50%, -50%)';
    ripple.style.pointerEvents = 'none';
    ripple.style.zIndex = '10';

    element.appendChild(ripple);

    gsap.to(ripple, {
      width: '150px',
      height: '150px',
      duration: 0.6,
      ease: 'power2.out',
      onComplete: () => ripple.remove()
    });
  }


  // Simple initial entrance animation
  gsap.fromTo(letters,
    {
      opacity: 0,
      y: 50
    },
    {
      duration: 0.8,
      opacity: 1,
      y: 0,
      delay: 0.3,
      stagger: 0.1,
      ease: 'power2.out'
    }
  );

  // Define layouts - added individual card presentation after grid
  const layouts = ['final', 'plain', 'columns', 'rows', 'grid', 'individual'];
  let currentLayout = 0;
  let animationInProgress = false;

  // Hide all words initially
  gsap.set(words, { opacity: 0, y: 20 });

  // Pre-position elements to prevent jumps
  function prePositionElements() {
    // Store original class
    const originalClass = container.className;

    // For each layout, temporarily apply class to calculate positions
    layouts.forEach(layout => {
      container.className = `container ${layout}`;
      // Force reflow
      document.body.offsetHeight;
    });

    // Restore original class
    container.className = originalClass;
  }

  // Call pre-positioning once at start
  prePositionElements();

  // Helper function to get the previous layout index
  function getPreviousLayout() {
    return (currentLayout - 1 + layouts.length) % layouts.length;
  }

  // SIMPLE word show function
  function showWords() {
    gsap.fromTo(words,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.8, stagger: 0.1, ease: "power2.out" }
    );
  }

  function createSparkles(element) {
    for (let i = 0; i < 5; i++) {
      const sparkle = document.createElement('div');
      sparkle.style.position = 'absolute';
      sparkle.style.width = '4px';
      sparkle.style.height = '4px';
      sparkle.style.background = '#fff';
      sparkle.style.borderRadius = '50%';
      sparkle.style.left = Math.random() * 100 + '%';
      sparkle.style.top = Math.random() * 100 + '%';
      sparkle.style.pointerEvents = 'none';
      sparkle.style.zIndex = '15';

      element.appendChild(sparkle);

      gsap.fromTo(sparkle,
        { scale: 0, opacity: 1 },
        {
          scale: 1.5,
          opacity: 0,
          duration: 1,
          ease: 'power2.out',
          onComplete: () => sparkle.remove()
        }
      );
    }
  }

  // Function to hide words
  function hideWords() {
    return new Promise(resolve => {
      gsap.to(words, {
        opacity: 0,
        y: 20,
        duration: 0.6,
        ease: "power4.inOut",
        onComplete: resolve
      });
    });
  }

  // Special animation for the second scene (plain layout)
  async function animateSecondScene() {
    // Change background colors with smooth transitions
    const sceneColors = [
      'linear-gradient(135deg, #2c1810 0%, #4a2c1a 25%, #6b3e2a 50%, #4a2c1a 75%, #2c1810 100%)', // Warm browns
      'linear-gradient(135deg, #1a2c2c 0%, #2a4a4a 25%, #3e6b6b 50%, #2a4a4a 75%, #1a2c2c 100%)', // Cool teals
      'linear-gradient(135deg, #2c1a2c 0%, #4a2a4a 25%, #6b3e6b 50%, #4a2a4a 75%, #2c1a2c 100%)'  // Royal purples
    ];

    // Animate background through all colors
    for (let i = 0; i < sceneColors.length; i++) {
      gsap.to(document.body, {
        background: sceneColors[i],
        duration: 0.8,
        ease: 'power4.inOut'
      });
      await gsap.delayedCall(0.6, () => {});
    }

    // Enhanced stagger animation for letters in plain scene
    await gsap.fromTo(letters,
      {
        rotationY: 0,
        scale: 1,
        filter: 'brightness(1)'
      },
      {
        rotationY: 15,
        scale: 1.1,
        filter: 'brightness(1.3)',
        duration: 0.6,
        stagger: {
          amount: 1.0,
          from: "center",
          ease: "power2.out"
        },
        ease: "power2.out",
        yoyo: true,
        repeat: 1
      }
    );

    // Add color pulse effect to letters with stagger
    await gsap.to(letters, {
      boxShadow: '0 0 30px rgba(206, 17, 38, 0.8), 0 0 60px rgba(206, 17, 38, 0.4)',
      duration: 0.4,
      stagger: {
        amount: 0.8,
        from: "random",
        ease: "power4.inOut"
      },
      yoyo: true,
      repeat: 1,
      ease: "power4.inOut"
    });

    // Create special sparkle effects around letters
    letters.forEach((letter, index) => {
      setTimeout(() => {
        createSparkles(letter);
      }, index * 100);
    });

    // Return background to original gradient
    gsap.to(document.body, {
      background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a3e 25%, #2d1b69 50%, #1a1a3e 75%, #0f0f23 100%)',
      duration: 1.0,
      ease: 'power4.inOut'
    });
  }

  // Dramatically reveal words associated with each letter - focus on the words!
  async function animateIndividualCards() {
    // Fade out all words and dim all letters initially
    await gsap.to(words, {
      opacity: 0,
      scale: 0.5,
      duration: 0.3,
      ease: "power2.in"
    });

    // Dim all letters to create spotlight effect
    gsap.set(letters, {
      scale: 0.6,
      opacity: 0.15,
      filter: 'brightness(0.3) blur(2px)'
    });

    // Dramatically reveal each word one by one
    for (let i = 0; i < letters.length; i++) {
      const letter = letters[i];
      const wordElement = letter.querySelector('.word');

      if (!wordElement) continue;

      // Get the text content from word element
      const arabicWord = wordElement.querySelector('.arabic');
      const englishText = wordElement.childNodes[0]?.textContent?.trim() || '';

      // Spotlight effect on current letter
      const spotlightAnim = gsap.to(letter, {
        scale: 1.5,
        opacity: 1,
        filter: 'brightness(1.5) blur(0px)',
        duration: 0.6,
        ease: "power3.out"
      });

      // Add dramatic pulsing glow to the letter
      gsap.to(letter, {
        boxShadow: '0 0 60px rgba(206, 17, 38, 0.8), 0 0 100px rgba(206, 17, 38, 0.4), inset 0 0 30px rgba(255, 255, 255, 0.3)',
        duration: 0.8,
        ease: "power4.inOut",
        yoyo: true,
        repeat: 2
      });

      await spotlightAnim;

      // SHOW THE WORD with dramatic reveal
      gsap.set(wordElement, {
        display: 'block',
        opacity: 0,
        scale: 0.3,
        y: 60,
        filter: 'blur(10px)'
      });

      // Dramatic word reveal with explosion effect
      await gsap.to(wordElement, {
        opacity: 1,
        scale: 2.0,
        y: 0,
        filter: 'blur(0px)',
        duration: 0.8,
        ease: "back.out(2.5)"
      });

      // Animate English word with typewriter effect
      if (englishText) {
        const originalHTML = wordElement.innerHTML;
        const arabicHTML = arabicWord ? arabicWord.outerHTML : '';

        // Clear and rebuild with typewriter
        wordElement.innerHTML = '';
        const englishSpan = document.createElement('div');
        englishSpan.style.fontSize = '2rem';
        englishSpan.style.fontWeight = '800';
        englishSpan.style.color = '#f5e9d9';
        englishSpan.style.textTransform = 'uppercase';
        englishSpan.style.letterSpacing = '3px';
        englishSpan.style.marginBottom = '10px';
        wordElement.appendChild(englishSpan);

        // Typewriter effect for English
        for (let char of englishText) {
          englishSpan.textContent += char;
          await gsap.delayedCall(0.06, () => {});
        }
      }

      // Animate Arabic word with fade and slide
      if (arabicWord) {
        gsap.set(arabicWord, { opacity: 0, x: 30, scale: 0.8 });
        wordElement.appendChild(arabicWord);

        await gsap.to(arabicWord, {
          opacity: 1,
          x: 0,
          scale: 1.3,
          duration: 0.7,
          ease: "power3.out"
        });
      }

      // Pulse the entire word for emphasis
      await gsap.to(wordElement, {
        scale: 2.3,
        textShadow: '0 0 50px rgba(206, 17, 38, 1), 0 0 100px rgba(255, 255, 255, 0.8)',
        duration: 0.6,
        ease: "power4.inOut",
        yoyo: true,
        repeat: 1
      });

      // Hold for reading
      await gsap.delayedCall(1.2, () => {});

      // Dramatic exit - word explodes outward
      const exitAnim = gsap.to(wordElement, {
        opacity: 0,
        scale: 3.5,
        rotation: 20,
        y: -80,
        filter: 'blur(20px)',
        duration: 0.6,
        ease: "power3.in"
      });

      // Dim the letter back
      gsap.to(letter, {
        scale: 0.6,
        opacity: 0.15,
        filter: 'brightness(0.3) blur(2px)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
        duration: 0.5,
        ease: "power2.in"
      });

      await exitAnim;
    }

    // Grand finale - restore all letters with cascading animation
    await gsap.to(letters, {
      scale: 1,
      opacity: 1,
      filter: 'brightness(1) blur(0px)',
      boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
      duration: 1.0,
      stagger: {
        each: 0.1,
        from: "center",
        ease: "power2.out"
      },
      ease: "elastic.out(1, 0.5)"
    });

    // Final flourish
    await gsap.to(letters, {
      y: -20,
      duration: 0.4,
      stagger: 0.05,
      ease: "power2.out",
      yoyo: true,
      repeat: 1
    });
  }

  let loopTimeout; // Variable to hold the timeout ID

  // Handwritten ink/quill animation for "Kingdom of Bahrain" text
  async function animateHandwrittenText() {
    // Prepare the text elements
    gsap.set([kingdom, bahrain], {
      display: 'block',
      opacity: 1,
      y: 0
    });

    // Split text into individual characters for drawing effect
    const kingdomText = kingdom.textContent;
    const bahrainText = bahrain.textContent;

    kingdom.innerHTML = '';
    bahrain.innerHTML = '';

    // Create span for each character
    const kingdomChars = kingdomText.split('').map(char => {
      const span = document.createElement('span');
      span.textContent = char;
      span.style.opacity = '0';
      span.style.display = 'inline-block';
      kingdom.appendChild(span);
      return span;
    });

    const bahrainChars = bahrainText.split('').map(char => {
      const span = document.createElement('span');
      span.textContent = char;
      span.style.opacity = '0';
      span.style.display = 'inline-block';
      bahrain.appendChild(span);
      return span;
    });

    // Animate kingdom text as if being written with ink
    await gsap.to(kingdomChars, {
      opacity: 1,
      y: 0,
      duration: 0.15,
      stagger: {
        each: 0.08,
        ease: "power1.inOut"
      },
      ease: "power2.out",
      onStart: function() {
        // Add slight rotation and scale for handwritten effect
        gsap.fromTo(this.targets(),
          {
            scale: 0.3,
            rotation: -5,
            y: -10
          },
          {
            scale: 1,
            rotation: 0,
            y: 0,
            duration: 0.15,
            ease: "back.out(2)"
          }
        );
      }
    });

    // Small pause between words
    await gsap.delayedCall(0.3, () => {});

    // Animate bahrain text with similar ink effect
    await gsap.to(bahrainChars, {
      opacity: 1,
      y: 0,
      duration: 0.15,
      stagger: {
        each: 0.08,
        ease: "power1.inOut"
      },
      ease: "power2.out",
      onStart: function() {
        gsap.fromTo(this.targets(),
          {
            scale: 0.3,
            rotation: 5,
            y: -10
          },
          {
            scale: 1,
            rotation: 0,
            y: 0,
            duration: 0.15,
            ease: "back.out(2)"
          }
        );
      }
    });

    // Add a subtle ink splatter/glow effect
    await gsap.to([kingdom, bahrain], {
      textShadow: '0 0 30px rgba(206, 17, 38, 0.8), 0 0 60px rgba(206, 17, 38, 0.4)',
      duration: 0.6,
      ease: "power4.inOut",
      yoyo: true,
      repeat: 1
    });
  }

  // PROPER GSAP Flip implementation for smooth transitions
  async function changeLayout() {
    if (animationInProgress) return;
    animationInProgress = true;

    try {
      // Special handling for individual card presentation
      if (layouts[currentLayout] === 'individual') {
        await animateIndividualCards();
        animationInProgress = false;
        return;
      }

      // STEP 1: Handle special element exit animations
      if (layouts[currentLayout] === 'grid') {
        // Hide words first
        await gsap.to(words, {
          opacity: 0,
          y: -20,
          duration: 0.4,
          ease: "power2.in"
        });
        // Reset letter scale for proper Flip measurement
        await gsap.to(letters, {
          scale: 1,
          duration: 0.6,
          ease: "power2.out"
        });
      }

      if (layouts[currentLayout] === 'final') {
        await gsap.to([kingdom, bahrain], {
          opacity: 0,
          y: -30,
          duration: 0.4,
          ease: "power2.in",
          onComplete: () => {
            gsap.set([kingdom, bahrain], { display: 'none' });
          }
        });
      }

      // STEP 2: Kill any existing GSAP animations on letters to ensure clean state
      gsap.killTweensOf(letters);

      // Wait a frame to ensure all animations are killed
      await gsap.delayedCall(0.1, () => {});

      // STEP 3: Capture the current state with Flip.getState()
      const state = Flip.getState(letters);

      // STEP 4: Change the layout (this changes DOM layout)
      container.classList.remove(layouts[currentLayout]);
      currentLayout = (currentLayout + 1) % layouts.length;
      container.classList.add(layouts[currentLayout]);

      // Force a layout recalculation
      container.offsetHeight;

      // STEP 5: Use Flip.from() to animate smoothly from old to new positions
      await Flip.from(state, {
        duration: 1.0,
        ease: "power4.inOut",
        stagger: 0.03,
        scale: true,
        simple: true
      });

      // STEP 6: Handle special scene-specific animations
      if (layouts[currentLayout] === 'plain') {
        // Special effects for the second scene (plain layout)
        await animateSecondScene();
      }

      if (layouts[currentLayout] === 'grid') {
        // Scale letters down for grid layout with smooth transition
        // Start scaling during the Flip animation for seamless transition
        const scaleAnimation = gsap.to(letters, {
          scale: 0.6,
          duration: 1.2,
          delay: 0.3,
          ease: "power4.inOut",
          stagger: {
            amount: 0.4,
            from: "center",
            ease: "power2.out"
          }
        });

        // Wait for scaling to be well underway before showing words
        await gsap.delayedCall(0.8, () => {});

        // Show words with smooth entrance
        await gsap.fromTo(words,
          { opacity: 0, y: 20 },
          {
            opacity: 1,
            y: 0,
            duration: 0.8,
            stagger: 0.1,
            ease: "power2.out"
          }
        );
      }

      if (layouts[currentLayout] === 'final') {
        // Show kingdom and bahrain text with handwritten ink effect
        await animateHandwrittenText();
      }

    } catch (error) {
      console.error('Animation error:', error);
    }

    animationInProgress = false;
  }

  // Enhanced animation loop with scene-specific timing
  async function animationLoop() {
    clearTimeout(loopTimeout);

    await changeLayout();

    const currentLayoutName = layouts[currentLayout];
    let delay;

    // Specific timing for each scene
    switch(currentLayoutName) {
      case 'grid':
        delay = 4000; // Grid needs time to read words
        break;
      case 'plain':
        delay = 4000; // Extended time for enhanced second scene
        break;
      case 'final':
        delay = 3500; // Time to appreciate final composition
        break;
      case 'individual':
        delay = 1000; // Short delay since individual cards manage their own timing
        break;
      default:
        delay = 3000; // Standard timing for other layouts
    }

    loopTimeout = setTimeout(animationLoop, delay);
  }

  // Add dynamic background color changes
  function animateBackground() {
    const colors = [
      ['#0f0f23', '#1a1a3e', '#2d1b69'],
      ['#1a0f2e', '#2d1b69', '#3e2a7a'],
      ['#0f1a2e', '#1b2d69', '#2a3e7a'],
      ['#2e0f1a', '#691b2d', '#7a2a3e']
    ];

    let currentColorSet = 0;

    setInterval(() => {
      currentColorSet = (currentColorSet + 1) % colors.length;
      const [color1, color2, color3] = colors[currentColorSet];

      gsap.to(document.body, {
        duration: 8,
        ease: 'power4.inOut',
        background: `linear-gradient(135deg, ${color1} 0%, ${color2} 25%, ${color3} 50%, ${color2} 75%, ${color1} 100%)`
      });
    }, 12000);
  }

  // Add text shimmer effect
  function addTextShimmer() {
    const style = document.createElement('style');
    style.textContent = `
      .shimmer-text {
        background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
        background-size: 200% 100%;
        background-clip: text;
        -webkit-background-clip: text;
        animation: shimmer 3s infinite;
      }
    `;
    document.head.appendChild(style);

    // Apply shimmer to text elements periodically
    setInterval(() => {
      const textElements = [...letters, kingdom, bahrain];
      const randomElement = textElements[Math.floor(Math.random() * textElements.length)];
      if (randomElement) {
        randomElement.classList.add('shimmer-text');
        setTimeout(() => {
          randomElement.classList.remove('shimmer-text');
        }, 3000);
      }
    }, 5000);
  }

  // Add cursor trail effect
  function createCursorTrail() {
    const trail = [];
    const trailLength = 8;

    for (let i = 0; i < trailLength; i++) {
      const dot = document.createElement('div');
      dot.className = 'cursor-trail';
      document.body.appendChild(dot);
      trail.push(dot);
    }

    let mouseX = 0, mouseY = 0;

    document.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    });

    function updateTrail() {
      trail.forEach((dot, index) => {
        const delay = index * 0.1;
        gsap.to(dot, {
          duration: 0.3,
          delay: delay,
          x: mouseX - 3,
          y: mouseY - 3,
          opacity: (trailLength - index) / trailLength * 0.5,
          scale: (trailLength - index) / trailLength,
          ease: 'power2.out'
        });
      });
      requestAnimationFrame(updateTrail);
    }

    updateTrail();
  }

  // Add random special glow effects
  function addRandomGlowEffects() {
    setInterval(() => {
      const randomLetter = letters[Math.floor(Math.random() * letters.length)];
      randomLetter.classList.add('special-glow');
      setTimeout(() => {
        randomLetter.classList.remove('special-glow');
      }, 2000);
    }, 8000);
  }

  // Enable background animation and start loop
  animateBackground();

  // Start animation loop
  loopTimeout = setTimeout(animationLoop, 2000);
});