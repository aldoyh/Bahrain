document.addEventListener('DOMContentLoaded', function () {
  // Register GSAP Flip plugin
  gsap.registerPlugin(Flip);

  // Get elements
  const container = document.querySelector('.container');
  const letters = document.querySelectorAll('.letter');
  const words = document.querySelectorAll('.word');
  const kingdom = document.querySelector('.kingdom');
  const bahrain = document.querySelector('.bahrain');


  // Initial entrance animation for letters - smoother and more refined
  gsap.from(letters, {
    duration: 1.0,
    scale: 0.3,
    opacity: 0,
    delay: 0.5, // Small delay after page load
    stagger: 0.08,
    ease: 'power2.out',
    force3D: true
  });

  // Define layouts
  const layouts = ['final', 'plain', 'columns', 'rows', 'grid'];
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

  // Function to show words in grid layout (returns a timeline)
  function showWords() {
    const tl = gsap.timeline();
    const wordDuration = 0.8;
    const pulseDuration = 0.4;
    const staggerDelay = 1.0; // Optimized timing for smooth flow

    words.forEach((word, index) => {
      const letterBox = word.parentElement;
      const pos = index * staggerDelay;

      // Word fade in and slide up with smoother easing
      tl.to(word, {
        opacity: 1,
        y: 0,
        duration: wordDuration,
        ease: "power1.out"
      }, pos);

      // Pulse animation that works with current scale - gentler animation
      tl.to(letterBox, {
        scale: "+=0.08", // Slightly reduced for subtler effect
        duration: pulseDuration,
        ease: "power1.inOut",
        yoyo: true,
        repeat: 1
      }, pos + 0.2); // Slight delay after word starts appearing
    });

    return tl;
  }

  // Function to hide words
  function hideWords() {
    return new Promise(resolve => {
      gsap.to(words, {
        opacity: 0,
        y: 20,
        duration: 0.6,
        ease: "power2.inOut",
        onComplete: resolve
      });
    });
  }

  let loopTimeout; // Variable to hold the timeout ID

  // Function to change layout (now returns a promise)
  async function changeLayout() {
    return new Promise(async (resolve) => {
      if (animationInProgress) {
        resolve();
        return;
      }
      animationInProgress = true;

      // --- Reset Scale and Hide Words if Leaving Grid ---
      if (layouts[currentLayout] === 'grid') {
        // 1. Hide words first with smooth animation
        await hideWords();
        // 2. Reset scale *after* words are hidden, before capturing state
        // Use animation instead of instant set for smoother transition
        await gsap.to(letters, { 
          scale: 1, 
          duration: 0.5, 
          ease: "power1.inOut",
          stagger: {
            amount: 0.2,
            from: "center"
          }
        });
        document.body.offsetHeight; // Force reflow after scale reset
      }

    // Get current state (letters are scale: 1 if leaving grid, or already 1 otherwise)
    const state = Flip.getState(letters, {
      props: "transform,opacity",
      simple: true, // Keep trying simple approach
      absolute: true // Match the Flip.from setting for consistency
    });

    // Remove current layout class
    container.classList.remove(layouts[currentLayout]);

    // Update to next layout
    currentLayout = (currentLayout + 1) % layouts.length;

    // Add new layout class
    container.classList.add(layouts[currentLayout]);

    // Force browser to apply layout before animating
    document.body.offsetHeight; // Force reflow

    // Handle kingdom and bahrain text visibility with smoother timing
    // Start fade immediately to coordinate with letter animations
    if (layouts[currentLayout] === 'final') {
      gsap.set([kingdom, bahrain], { display: 'block', opacity: 0 });
      gsap.to([kingdom, bahrain], { 
        opacity: 1, 
        duration: 0.8, 
        delay: 0.7, // Slight delay to let letters settle
        ease: "power2.inOut"
      });
    } else if (layouts[(currentLayout - 1 + layouts.length) % layouts.length] === 'final') {
      // Fade out immediately when leaving final layout
      gsap.to([kingdom, bahrain], {
        opacity: 0,
        duration: 0.4,
        ease: "power2.in",
        onComplete: () => gsap.set([kingdom, bahrain], { display: 'none' })
      });
    }

    // Animate the layout change with Flip - smoother transitions
    Flip.from(state, {
      duration: 1.2,
      ease: "power2.inOut",
      stagger: 0.08,
      scale: true, // Animate scale if it changed during Flip (shouldn't now)
      absolute: true, // Use absolute positioning during animation
      onComplete: async function () {
        // --- Post-Flip Actions ---
        if (layouts[currentLayout] === 'grid') {
          // Now that letters are in grid positions (at scale 1),
          // animate scale down *and* show words concurrently.
          // Create main timeline for grid animations
          const gridTimeline = gsap.timeline();

          // First, scale down the letters smoothly with better easing
          gridTimeline.to(letters, {
            scale: 0.6,
            duration: 1.0,
            ease: "power1.inOut",
            stagger: {
              amount: 0.3,
              from: "center",
              ease: "power1.inOut"
            }
          });

          // Then start the word animations with a slight overlap
          const wordTimeline = showWords();
          gridTimeline.add(wordTimeline, "-=0.4");

          // Wait for all animations to complete
          await gridTimeline;

        } else {
          // If not grid, ensure scale is 1 (it should be already, set before Flip if coming from grid)
          // Safety set - uncomment if needed, but might cause flicker
          // gsap.set(letters, { scale: 1 });
        }

        // Resolve the main promise after all animations for this step are done
        animationInProgress = false;
        resolve();
      }
    });
   }); // End of Promise wrapper
  }

  // Function to manage the animation loop
  async function animationLoop() {
    // Clear any previous timeout to prevent duplicates if called manually
    clearTimeout(loopTimeout);

    // Perform the layout change and wait for it to complete
    // This call updates currentLayout internally for the *next* state
    await changeLayout();

    // Determine delay based on the layout that was *just displayed*
    // Since changeLayout increments currentLayout, the layout just shown
    // is at index (currentLayout - 1 + layouts.length) % layouts.length
    const displayedLayoutIndex = (currentLayout + layouts.length - 1) % layouts.length;
    const displayedLayoutName = layouts[displayedLayoutIndex];
    // Grid delay: Allow viewing time *after* changeLayout (which includes showWords) finishes
    // Optimized viewing times for better flow
    const delay = (displayedLayoutName === 'grid') ? 6000 : 2800;

    // Schedule the next iteration
    loopTimeout = setTimeout(animationLoop, delay);
  }

  // Start the animation cycle with a longer delay to ensure everything is ready
  // Start the animation loop with an initial delay
  loopTimeout = setTimeout(animationLoop, 2000);
});