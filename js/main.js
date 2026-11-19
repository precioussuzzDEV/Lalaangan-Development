// ---------- Loading screen tips ----------
const TIPS = [
  "Explore different areas to uncover new surprises.",
  "Check your quest list regularly. There are always new challenges waiting.",
  "Don't forget to claim your rewards after completing a quest.",
  "Different locations hold different discoveries. Venture beyond your usual routes!",
  "Check your collection to learn more about the creatures you've discovered.",
  "Keep exploring! You never know what creature might be hiding nearby.",
  "Short walks throughout the day can add up to a healthier lifestyle.",
  "Your body loves movement, even if it's just a short walk.",
  "Don't rush the journey. Enjoy every step along the way.",
  "Remember to stay hydrated during your adventures.",
  "Spending time outdoors can help refresh your mind.",
  "Walking with friends makes every journey more fun.",
  "Nature is full of little wonders waiting to be discovered.",
  "Mangroves provide important habitats for many coastal creatures.",
  "Small creatures can make a big difference to the ecosystem.",
  "Explore responsibly and respect the communities you visit.",
  "A familiar place can feel completely new when you see it differently.",
  "Look beyond the familiar. Your neighbourhood might hold hidden gems!"
];

const FADE_DELAY_MS = 600;      // short pause on "Ready!" before fading
const FADE_DURATION_MS = 1500;  // keep in sync with --fade-duration in style.css
const LOAD_DURATION_MS = 5000;  // fake loading time (replace with real loading later)

// ---------- Elements ----------
const bar = document.getElementById("bar");
const barFill = document.getElementById("bar-fill");
const barLabel = document.getElementById("bar-label");
const tipEl = document.getElementById("tip");
const loadingScreen = document.getElementById("loading-screen");
const playEl = document.getElementById("play");
const hintEl = document.getElementById("hint");
const nextScreen =document.getElementById("next-screen");

// Coming back from another screen (home.html#home): skip loading, go straight to Home
const skipLoading = location.hash === "#home";
if (skipLoading) {
  loadingScreen.hidden = true;
  nextScreen.style.transition = "none"; // no fade, the content slides in instead
  nextScreen.classList.add("is-visible");
  nextScreen.removeAttribute("aria-hidden");
}

// ---------- Tips: tap anywhere for the next one ----------
let tipQueue = [];
let lastTip = -1;
let tipTimeout;

// Shuffled bag: every tip shows once (random order) before any repeats,
// and the same tip never appears twice in a row across reshuffles.
function nextTipIndex() {
  if (tipQueue.length === 0) {
    tipQueue = TIPS.map((_, i) => i);
    for (let i = tipQueue.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [tipQueue[i], tipQueue[j]] = [tipQueue[j], tipQueue[i]];
    }
    if (tipQueue.length > 1 && tipQueue[tipQueue.length - 1] === lastTip) {
      [tipQueue[0], tipQueue[tipQueue.length - 1]] = [tipQueue[tipQueue.length - 1], tipQueue[0]];
    }
  }
  lastTip = tipQueue.pop();
  return lastTip;
}

function showTip() {
  clearTimeout(tipTimeout); // fast tapping won't stack up fades
  tipEl.classList.add("is-hidden");
  tipTimeout = setTimeout(() => {
    tipEl.textContent = TIPS[nextTipIndex()];
    tipEl.classList.remove("is-hidden");
  }, 200);
}

if (!skipLoading) {
  showTip();
  document.addEventListener("pointerdown", showTip);
}

// ---------- Progress ----------
function setProgress(percent) {
  const p = Math.min(100, Math.round(percent));
  barFill.style.width = p + "%";
  barLabel.textContent = p < 100 ? `Loading... ${p}%` : "Ready!";
  bar.setAttribute("aria-valuenow", p);
}

// Fake progress for now. Later, call setProgress() from real asset loading.
const startTime = performance.now();

function tick(now) {
  const percent = ((now - startTime) / LOAD_DURATION_MS) * 100;
  setProgress(percent);
  if (percent < 100) {
    requestAnimationFrame(tick);
  } else {
    onLoaded();
  }
}
if (!skipLoading) requestAnimationFrame(tick);

// ---------- When finished ----------
function onLoaded() {
  document.removeEventListener("pointerdown", showTip); // tips stop once loading is done
  tipEl.classList.add("is-hidden");
  hintEl.hidden = true;
  playEl.hidden = false;
  // Small delay so the tap that was spamming tips doesn't instantly start the game
  setTimeout(() => document.addEventListener("pointerdown", startGame, { once: true }), 300);
}

function startGame() {
  playEl.hidden = true;
  setTimeout(() => {
    nextScreen.classList.add("is-visible");
    nextScreen.removeAttribute("aria-hidden");

    // After the fade finishes, remove the loading screen
    setTimeout(() => { loadingScreen.hidden = true; }, FADE_DURATION_MS);
  }, FADE_DELAY_MS);
}
