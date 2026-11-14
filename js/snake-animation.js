(() => {
  const snake = document.createElement("img");

  snake.className = "screen-snake";
  snake.src = "picture/snake.png";
  snake.alt = "";
  snake.setAttribute("aria-hidden", "true");

  document.body.appendChild(snake);

  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  );

  let isAnimating = false;
  let loading = false;
  let cooldown = false;

  const delayAfterExit = 2000;

  function play() {
    if (prefersReducedMotion.matches || isAnimating || cooldown) return;

    if (!snake.complete || snake.naturalWidth === 0) {
      if (!loading) {
        loading = true;
        snake.addEventListener("load", () => {
          loading = false;
          play();
        }, { once: true });
      }
      return;
    }

    isAnimating = true;

    const width = snake.getBoundingClientRect().width;
    const height = snake.getBoundingClientRect().height;

    const startX = -width - 50;
    const endX = window.innerWidth + 50;
    const y = Math.random() * Math.max(0, window.innerHeight - height);

    const duration = 6500;
    const baseRotation = 90;
    let startTime = null;

    function slither(timestamp) {
      if (!startTime) startTime = timestamp;

      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);

      const x = startX + (endX - startX) * progress;
      const wave = Math.sin(elapsed / 300);
      const vertical = Math.cos(elapsed / 300) * 5;
      const rotation = baseRotation + wave * 8;
      const scale = 1 + Math.sin(elapsed / 300) * 0.025;

      snake.style.transform = `
        translate3d(${x}px, ${y + vertical}px, 0)
        rotate(${rotation}deg)
        scale(${scale})
      `;

      if (progress < 1) {
        requestAnimationFrame(slither);
      } else {
        snake.style.transform = `
          translate3d(${endX}px, ${y}px, 0)
          rotate(${baseRotation}deg)
        `;

        isAnimating = false;
        cooldown = true;

        setTimeout(() => {
          cooldown = false;
        }, delayAfterExit);
      }
    }

    snake.style.transform =
      `translate3d(${startX}px, ${y}px, 0) rotate(${baseRotation}deg)`;

    requestAnimationFrame(slither);
  }

  snake.addEventListener("error", () => {
    console.error("Could not load picture/snake.png");
    isAnimating = false;
  });

  let wasGlowing = document.body.classList.contains("state-glow");

  new MutationObserver(() => {
    const isGlowing = document.body.classList.contains("state-glow");

    if (isGlowing && !wasGlowing) {
      play();
    }

    wasGlowing = isGlowing;
  }).observe(document.body, {
    attributes: true,
    attributeFilter: ["class"]
  });

  if (wasGlowing) play();

  window.SnakeAnimation = { play };
})();
