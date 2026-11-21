// Boot and game loop for Night Courier.
// Owns the screens (title / play / caught / win), the camera, the detection
// meter, level flow and the deterministic ?scene= staging used for screenshots.
import { Input } from './input.js';
import { AudioSys } from './audio.js';
import { LEVELS, solidRects } from './levels.js';
import { createGuard, updateGuard, guardSeesPlayer } from './guards.js';
import { createPlayer, updatePlayer, updateDetectionMeter } from './player.js';
import { drawWorld, drawHUD, drawTitle, drawWin, drawCaughtFlash } from './render.js';

const VIEW_W = 1280;
const VIEW_H = 800;

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const state = {
  screen: 'title', // title | play | caught | win
  levelIndex: 0,
  level: LEVELS[0],
  solids: solidRects(LEVELS[0]),
  player: createPlayer(LEVELS[0].spawn),
  guards: LEVELS[0].guards.map((def, i) => createGuard(def, i)),
  packageTaken: false,
  meter: 0,
  spotted: 0,
  time: 0,
  animTime: 0,
  banner: null,
  bannerTimer: 0,
  caughtTimer: 0,
  frozen: false, // scene staging: render one fixed frame, no updates
};

// Read-only handle for automated smoke tests (headless playtests read the
// player's position and the current screen through this).
window.__nightCourier = state;

function loadLevel(index) {
  state.levelIndex = index;
  state.level = LEVELS[index];
  state.solids = solidRects(state.level);
  state.player = createPlayer(state.level.spawn);
  state.guards = state.level.guards.map((def, i) => createGuard(def, i));
  state.packageTaken = false;
  state.meter = 0;
  state.banner = null;
  state.bannerTimer = 0;
}

function cameraFor() {
  const p = state.player;
  const maxX = Math.max(0, state.level.width - VIEW_W);
  const maxY = Math.max(0, state.level.height - VIEW_H);
  return {
    x: Math.max(0, Math.min(maxX, p.x - VIEW_W / 2)),
    y: Math.max(0, Math.min(maxY, p.y - VIEW_H / 2)),
  };
}

function startGame() {
  AudioSys.ensure();
  state.spotted = 0;
  state.time = 0;
  loadLevel(0);
  state.screen = 'play';
}

function restartLevel() {
  loadLevel(state.levelIndex);
  state.screen = 'play';
}

function onCaught() {
  state.spotted += 1;
  state.screen = 'caught';
  state.caughtTimer = 1.1;
  AudioSys.alarmSting();
}

function onLevelClear() {
  AudioSys.successChime();
  const clearedName = state.level.name;
  if (state.levelIndex + 1 >= LEVELS.length) {
    state.screen = 'win';
    return;
  }
  loadLevel(state.levelIndex + 1);
  state.banner = `${clearedName} — CLEAR!`;
  state.bannerTimer = 1.4;
}

function update(dt) {
  state.time += dt;
  if (state.bannerTimer > 0) {
    state.bannerTimer -= dt;
    if (state.bannerTimer <= 0) state.banner = null;
  }

  const events = [];
  updatePlayer(state.player, dt, Input, state.solids, state.level);
  if (state.player.stepped && !state.player.sneaking) AudioSys.footstep(state.player.stepAlternate);

  let nearestSeen = null;
  for (const guard of state.guards) {
    updateGuard(guard, dt, state.player, state.solids, events);
    const sight = guardSeesPlayer(guard, state.player, state.solids);
    if (sight.seen && (!nearestSeen || sight.dist < nearestSeen.dist)) nearestSeen = sight;
  }
  if (events.includes('suspicious')) AudioSys.alertSting();

  const result = updateDetectionMeter(
    state.meter, dt, !!nearestSeen,
    nearestSeen ? nearestSeen.dist : 0, state.player.sneaking,
  );
  state.meter = result.meter;
  if (result.caught) {
    onCaught();
    return;
  }

  // Noise: walking near a guard draws its attention to the courier.
  if (state.player.moving && !state.player.sneaking) {
    for (const guard of state.guards) {
      const dist = Math.hypot(guard.x - state.player.x, guard.y - state.player.y);
      if (dist < 150) {
        guard.lastSeen = { x: state.player.x, y: state.player.y };
        if (guard.state === 'patrol') guard.state = 'investigate';
      }
    }
  }

  // Package pickup.
  if (!state.packageTaken) {
    const p = state.level.packagePos;
    if (Math.hypot(state.player.x - p.x, state.player.y - p.y) < 34) {
      state.packageTaken = true;
      AudioSys.pickup();
    }
  }

  // Exit, only once the package is in hand.
  if (state.packageTaken) {
    const e = state.level.exit;
    const cx = Math.max(e.x, Math.min(state.player.x, e.x + e.w));
    const cy = Math.max(e.y, Math.min(state.player.y, e.y + e.h));
    if (Math.hypot(state.player.x - cx, state.player.y - cy) < state.player.r + 4) {
      onLevelClear();
    }
  }
}

// Deterministic scene staging for screenshots: ?scene=cover|tense|package|win
// sets up a fixed state and freezes the simulation, so the shot is a live
// render of the real game at one exact moment.
function applyScene(name) {
  if (!name) return;
  state.frozen = true;
  state.animTime = 0;
  if (name === 'cover') {
    loadLevel(0);
    state.player.x = 780;
    state.player.y = 560;
    state.player.angle = -Math.PI / 2;
    state.guards[0].x = 640;
    state.guards[0].y = 430;
    state.guards[0].angle = 0.5;
    state.guards[1].x = 1160;
    state.guards[1].y = 420;
    state.guards[1].angle = Math.PI;
    state.meter = 0.22;
    state.screen = 'play';
  } else if (name === 'tense') {
    loadLevel(0);
    state.player.x = 700;
    state.player.y = 570;
    state.player.angle = Math.PI;
    state.player.sneaking = true;
    const guard = state.guards[0];
    guard.x = 790;
    guard.y = 480;
    guard.angle = 2.36;
    guard.alert = 0.82;
    guard.state = 'investigate';
    guard.lastSeen = { x: state.player.x, y: state.player.y };
    state.guards[1].x = 1160;
    state.guards[1].y = 250;
    state.guards[1].angle = Math.PI / 2;
    state.meter = 0.8;
    state.screen = 'play';
  } else if (name === 'package') {
    loadLevel(1);
    state.packageTaken = true;
    state.player.x = 1470;
    state.player.y = 900;
    state.player.angle = Math.PI / 4;
    state.guards[0].x = 1300;
    state.guards[0].y = 700;
    state.guards[0].angle = 0.9;
    state.guards[0].alert = 0.5;
    state.guards[1].x = 1500;
    state.guards[1].y = 560;
    state.guards[1].angle = Math.PI * 0.8;
    state.guards[2].x = 500;
    state.guards[2].y = 650;
    state.guards[2].angle = 0;
    state.meter = 0.35;
    state.time = 96;
    state.screen = 'play';
  } else if (name === 'win') {
    state.screen = 'win';
    state.time = 245;
    state.spotted = 1;
  }
}

function render() {
  const t = state.frozen ? 0 : state.animTime;
  if (state.screen === 'title') {
    drawTitle(ctx, t);
    return;
  }
  if (state.screen === 'win') {
    drawWorld(ctx, state, cameraFor(), t);
    drawHUD(ctx, state);
    drawWin(ctx, { time: state.time, spotted: state.spotted });
    return;
  }
  drawWorld(ctx, state, cameraFor(), t);
  drawHUD(ctx, state);
  if (state.screen === 'caught') {
    drawCaughtFlash(ctx, Math.min(1, state.caughtTimer));
  }
}

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (!state.frozen) state.animTime += dt;
  if (state.screen === 'play' && !state.frozen) {
    update(dt);
  } else if (state.screen === 'caught') {
    state.caughtTimer -= dt;
    if (state.caughtTimer <= 0) restartLevel();
  }
  render();
  requestAnimationFrame(frame);
}

function confirm() {
  AudioSys.ensure();
  if (state.screen === 'title' || state.screen === 'win') startGame();
}

window.addEventListener('nightcourier:confirm', confirm);
window.addEventListener('nightcourier:mute', () => AudioSys.toggleMute());
canvas.addEventListener('click', confirm);
document.addEventListener('visibilitychange', () => { last = performance.now(); });

Input.attach();
applyScene(new URLSearchParams(window.location.search).get('scene'));
requestAnimationFrame(frame);
