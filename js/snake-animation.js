// A single snake that slithers across the screen from left to right.
// Call window.SnakeAnimation.play() to start it (ignored while it is already crossing).
// It also plays when the page starts glowing (body gets the "state-glow" class).
(() => {
  const snake = document.createElement("img");
  snake.className = "screen-snake";
  snake.src = "snake-animation.png";
  snake.alt = "";
  snake.setAttribute("aria-hidden", "true");
  document.body.appendChild(snake);

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let isAnimating = false;

  function play() {
    if (prefersReducedMotion.matches || isAnimating) return;
    if (!snake.complete || snake.naturalWidth === 0) {
      snake.addEventListener("load", play, { once: true });
      return;
    }

    isAnimating = true;

    const { width, height } = snake.getBoundingClientRect();
    const startX = -width - 24;
    const endX = window.innerWidth + 24;
    const y = Math.random() * Math.max(0, window.innerHeight - height);
    const xAt = (progress) => startX + (endX - startX) * progress;
    const pose = (progress, offsetY, rotation) => ({
      offset: progress,
      opacity: progress === 0 || progress === 1 ? 0 : 1,
      transform: `translate3d(${xAt(progress)}px, ${offsetY}px, 0) rotate(${rotation}deg)`
    });

    snake.style.top = `${y}px`;
    const animation = snake.animate([
      pose(0, 0, -4),
      pose(0.1, -8, 2),
      pose(0.3, 8, -2),
      pose(0.5, -8, 2),
      pose(0.7, 8, -2),
      pose(0.9, -8, 2),
      pose(1, 0, -4)
    ], {
      duration: 6500,
      easing: "ease-in-out"
    });

    animation.onfinish = () => {
      isAnimating = false;
    };
  }

  snake.addEventListener("error", () => {
    console.error("Could not load the snake animation image: snake-animation.png");
  });

  // Play once each time the page switches into the glow state
  let wasGlowing = document.body.classList.contains("state-glow");
  new MutationObserver(() => {
    const isGlowing = document.body.classList.contains("state-glow");
    if (isGlowing && !wasGlowing) play();
    wasGlowing = isGlowing;
  }).observe(document.body, { attributeFilter: ["class"] });

  if (wasGlowing) play();

  window.SnakeAnimation = { play };
})();
