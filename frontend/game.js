/**
 * Snake Game — frontend logic
 * Communicates with the backend through /api/* endpoints.
 */

const GRID = 20;          // grid cell size in pixels
const COLS = 20;          // number of columns
const ROWS = 20;          // number of rows
const TICK_MS = 120;      // game speed (ms per frame)

/** @type {HTMLCanvasElement} */
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

// --- State ---
let sessionId = null;
let playerName = '';
let snake = [];
let direction = { x: 1, y: 0 };
let nextDir = { x: 1, y: 0 };
let food = { x: 0, y: 0 };
let score = 0;
let bestScore = 0;
let gameLoop = null;
let running = false;

// --- DOM refs ---
const nameScreen = document.getElementById('name-screen');
const gameScreen = document.getElementById('game-screen');
const gameoverOverlay = document.getElementById('gameover-overlay');
const leaderboardScreen = document.getElementById('leaderboard-screen');
const playerNameInput = document.getElementById('player-name');
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');
const leaderboardBtn = document.getElementById('leaderboard-btn');
const backBtn = document.getElementById('back-btn');
const hudName = document.getElementById('hud-name');
const hudScore = document.getElementById('hud-score');
const hudBest = document.getElementById('hud-best');
const finalScore = document.getElementById('final-score');
const leaderboardList = document.getElementById('leaderboard-list');

// ---------------------------------------------------------------------------
// Session
// ---------------------------------------------------------------------------

/**
 * Create or restore a player session via the backend API.
 * Stores sessionId in module-level variable.
 * @param {string} name - player name
 * @returns {Promise<void>}
 */
async function initSession(name) {
  try {
    const res = await fetch('/api/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ name }),
    });
    const data = await res.json();
    sessionId = data.sessionId;
  } catch (err) {
    console.error('Failed to init session:', err);
    // Fallback — play without persistence
    sessionId = null;
  }
  // Always use what the user typed, regardless of what the session stored
  playerName = name;

  // Restore personal best from localStorage
  if (sessionId) {
    const stored = localStorage.getItem(`best_${sessionId}`);
    if (stored !== null) bestScore = parseInt(stored, 10);
  }
}

// ---------------------------------------------------------------------------
// Score persistence
// ---------------------------------------------------------------------------

/**
 * Save the player's score to the backend.
 * @param {number} finalScoreValue
 * @returns {Promise<void>}
 */
async function saveScore(finalScoreValue) {
  if (!sessionId) return;
  try {
    await fetch('/api/scores', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ sessionId, name: playerName, score: finalScoreValue }),
    });
  } catch (err) {
    console.error('Failed to save score:', err);
  }
}

/**
 * Fetch top 10 scores from the backend.
 * @returns {Promise<Array<{name: string, score: number}>>}
 */
async function fetchTopScores() {
  try {
    const res = await fetch('/api/scores/top', { credentials: 'include' });
    return await res.json();
  } catch (err) {
    console.error('Failed to fetch scores:', err);
    return [];
  }
}

// ---------------------------------------------------------------------------
// Game logic
// ---------------------------------------------------------------------------

/**
 * Spawn food at a random position not occupied by the snake.
 */
function spawnFood() {
  const occupied = new Set(snake.map((s) => `${s.x},${s.y}`));
  let pos;
  do {
    pos = {
      x: Math.floor(Math.random() * COLS),
      y: Math.floor(Math.random() * ROWS),
    };
  } while (occupied.has(`${pos.x},${pos.y}`));
  food = pos;
}

/**
 * Reset the game state and start a new round.
 */
function resetGame() {
  const midX = Math.floor(COLS / 2);
  const midY = Math.floor(ROWS / 2);
  snake = [
    { x: midX, y: midY },
    { x: midX - 1, y: midY },
    { x: midX - 2, y: midY },
  ];
  direction = { x: 1, y: 0 };
  nextDir = { x: 1, y: 0 };
  score = 0;
  updateHUD();
  spawnFood();
}

/**
 * Advance the snake by one tick.
 */
function tick() {
  direction = nextDir;
  const head = {
    x: (snake[0].x + direction.x + COLS) % COLS,
    y: (snake[0].y + direction.y + ROWS) % ROWS,
  };

  // Self-collision check
  if (snake.some((s) => s.x === head.x && s.y === head.y)) {
    endGame();
    return;
  }

  snake.unshift(head);

  if (head.x === food.x && head.y === food.y) {
    score++;
    if (score > bestScore) {
      bestScore = score;
      if (sessionId) localStorage.setItem(`best_${sessionId}`, bestScore);
    }
    updateHUD();
    spawnFood();
  } else {
    snake.pop();
  }

  render();
}

/**
 * Handle game-over: stop loop, save score, show overlay.
 */
async function endGame() {
  running = false;
  clearInterval(gameLoop);
  gameLoop = null;

  await saveScore(score);

  finalScore.textContent = `Your score: ${score}`;
  gameoverOverlay.classList.remove('hidden');
}

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

/**
 * Render the current game state onto the canvas.
 */
function render() {
  ctx.fillStyle = '#0f3460';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw food
  ctx.fillStyle = '#e94560';
  ctx.beginPath();
  ctx.arc(
    food.x * GRID + GRID / 2,
    food.y * GRID + GRID / 2,
    GRID / 2 - 1,
    0,
    Math.PI * 2,
  );
  ctx.fill();

  // Draw snake
  snake.forEach((seg, i) => {
    ctx.fillStyle = i === 0 ? '#4ecca3' : '#2ab394';
    ctx.fillRect(seg.x * GRID + 1, seg.y * GRID + 1, GRID - 2, GRID - 2);
  });
}

/**
 * Update the HUD elements with current score / best score / name.
 */
function updateHUD() {
  hudScore.textContent = `Score: ${score}`;
  hudBest.textContent = `Best: ${bestScore}`;
}

// ---------------------------------------------------------------------------
// Input handling
// ---------------------------------------------------------------------------

document.addEventListener('keydown', (e) => {
  if (!running) return;
  switch (e.key) {
    case 'ArrowUp':
    case 'w':
    case 'W':
      if (direction.y !== 1) nextDir = { x: 0, y: -1 };
      break;
    case 'ArrowDown':
    case 's':
    case 'S':
      if (direction.y !== -1) nextDir = { x: 0, y: 1 };
      break;
    case 'ArrowLeft':
    case 'a':
    case 'A':
      if (direction.x !== 1) nextDir = { x: -1, y: 0 };
      break;
    case 'ArrowRight':
    case 'd':
    case 'D':
      if (direction.x !== -1) nextDir = { x: 1, y: 0 };
      break;
  }
});

// ---------------------------------------------------------------------------
// Screen transitions
// ---------------------------------------------------------------------------

/**
 * Show a specific screen, hiding others.
 * @param {HTMLElement} screen
 */
function showScreen(screen) {
  [nameScreen, gameScreen, leaderboardScreen].forEach((s) =>
    s.classList.add('hidden'),
  );
  screen.classList.remove('hidden');
}

/**
 * Start the game loop.
 */
function startGame() {
  running = true;
  resetGame();
  render();
  gameLoop = setInterval(tick, TICK_MS);
}

// ---------------------------------------------------------------------------
// Event listeners
// ---------------------------------------------------------------------------

startBtn.addEventListener('click', async () => {
  const name = playerNameInput.value.trim();
  if (!name) {
    playerNameInput.focus();
    return;
  }
  await initSession(name);
  hudName.textContent = name;
  showScreen(gameScreen);
  gameoverOverlay.classList.add('hidden');
  startGame();
});

playerNameInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') startBtn.click();
});

restartBtn.addEventListener('click', () => {
  gameoverOverlay.classList.add('hidden');
  startGame();
});

leaderboardBtn.addEventListener('click', async () => {
  gameoverOverlay.classList.add('hidden');
  const scores = await fetchTopScores();
  leaderboardList.innerHTML = '';
  if (scores.length === 0) {
    leaderboardList.innerHTML = '<li>No scores yet.</li>';
  } else {
    scores.forEach((entry, i) => {
      const li = document.createElement('li');
      li.innerHTML = `<span class="rank">#${i + 1}</span><span>${entry.name}</span><span>${entry.score}</span>`;
      leaderboardList.appendChild(li);
    });
  }
  showScreen(leaderboardScreen);
});

backBtn.addEventListener('click', () => {
  showScreen(nameScreen);
});
