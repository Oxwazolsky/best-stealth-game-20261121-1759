// All drawing for Night Courier: floor, cover, cones, lighting, HUD and screens.
// Flat colours throughout, so the game stays readable at a glance and the
// screenshots stay small. Lighting is a darkness layer with holes cut around
// the courier, the lamps and the exit.
import { VISION_RANGE, VISION_HALF_ANGLE, coneColor } from './guards.js';
import { noiseRadius } from './player.js';

const VIEW_W = 1280;
const VIEW_H = 800;

let lightCanvas = null;

function getLightCanvas() {
  if (!lightCanvas) {
    lightCanvas = document.createElement('canvas');
    lightCanvas.width = VIEW_W;
    lightCanvas.height = VIEW_H;
  }
  return lightCanvas;
}

function roundRectPath(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawFloor(ctx, level, cam) {
  ctx.fillStyle = '#191d2a';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  // Tile grid, clipped to the visible world.
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.045)';
  ctx.lineWidth = 1;
  const startX = Math.max(0, Math.floor(cam.x / 80) * 80);
  const startY = Math.max(0, Math.floor(cam.y / 80) * 80);
  ctx.beginPath();
  for (let x = startX; x < Math.min(level.width, cam.x + VIEW_W); x += 80) {
    ctx.moveTo(x - cam.x, 0);
    ctx.lineTo(x - cam.x, VIEW_H);
  }
  for (let y = startY; y < Math.min(level.height, cam.y + VIEW_H); y += 80) {
    ctx.moveTo(0, y - cam.y);
    ctx.lineTo(VIEW_W, y - cam.y);
  }
  ctx.stroke();
  // Worn patches so the floor is not perfectly flat.
  ctx.fillStyle = 'rgba(0, 0, 0, 0.18)';
  for (const [px, py, pr] of [[420, 620, 60], [980, 260, 80], [700, 800, 55]]) {
    if (px < level.width && py < level.height) {
      ctx.beginPath();
      ctx.arc(px - cam.x, py - cam.y, pr, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawWalls(ctx, level, cam) {
  for (const w of level.walls) {
    ctx.fillStyle = '#31364a';
    ctx.fillRect(w.x - cam.x, w.y - cam.y, w.w, w.h);
    ctx.fillStyle = '#454b63';
    ctx.fillRect(w.x - cam.x, w.y - cam.y, w.w, 4);
    ctx.strokeStyle = '#1a1d29';
    ctx.lineWidth = 2;
    ctx.strokeRect(w.x - cam.x, w.y - cam.y, w.w, w.h);
  }
}

function drawCrates(ctx, level, cam) {
  for (const c of level.crates) {
    ctx.fillStyle = '#8a6a3b';
    ctx.fillRect(c.x - cam.x, c.y - cam.y, c.w, c.h);
    ctx.strokeStyle = '#5d451f';
    ctx.lineWidth = 3;
    ctx.strokeRect(c.x - cam.x, c.y - cam.y, c.w, c.h);
    ctx.beginPath();
    ctx.moveTo(c.x - cam.x, c.y - cam.y);
    ctx.lineTo(c.x + c.w - cam.x, c.y + c.h - cam.y);
    ctx.moveTo(c.x + c.w - cam.x, c.y - cam.y);
    ctx.lineTo(c.x - cam.x, c.y + c.h - cam.y);
    ctx.stroke();
    ctx.fillStyle = '#a5824a';
    ctx.fillRect(c.x - cam.x + 6, c.y - cam.y + 6, c.w - 12, 5);
  }
}

function drawPackage(ctx, level, cam, taken, time) {
  if (taken) return;
  const p = level.packagePos;
  const pulse = 0.6 + 0.4 * Math.sin(time * 3);
  const glow = ctx.createRadialGradient(p.x - cam.x, p.y - cam.y, 4, p.x - cam.x, p.y - cam.y, 46);
  glow.addColorStop(0, `rgba(255, 205, 80, ${0.5 * pulse})`);
  glow.addColorStop(1, 'rgba(255, 205, 80, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(p.x - cam.x, p.y - cam.y, 46, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#f5b81e';
  ctx.fillRect(p.x - 16 - cam.x, p.y - 13 - cam.y, 32, 26);
  ctx.strokeStyle = '#8a5f00';
  ctx.lineWidth = 2;
  ctx.strokeRect(p.x - 16 - cam.x, p.y - 13 - cam.y, 32, 26);
  ctx.strokeStyle = '#8a5f00';
  ctx.beginPath();
  ctx.moveTo(p.x - cam.x, p.y - 13 - cam.y);
  ctx.lineTo(p.x - cam.x, p.y + 13 - cam.y);
  ctx.stroke();
  ctx.fillStyle = '#ffe9a8';
  ctx.font = 'bold 11px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('PACKAGE', p.x - cam.x, p.y - 26 - cam.y);
}

function drawExit(ctx, level, cam, time, hasPackage) {
  const e = level.exit;
  const pulse = hasPackage ? 0.55 + 0.45 * Math.sin(time * 4) : 0.25;
  ctx.fillStyle = `rgba(46, 204, 113, ${0.25 + 0.35 * pulse})`;
  ctx.fillRect(e.x - cam.x, e.y - cam.y, e.w, e.h);
  ctx.strokeStyle = '#2ecc71';
  ctx.lineWidth = 4;
  ctx.strokeRect(e.x - cam.x, e.y - cam.y, e.w, e.h);
  ctx.fillStyle = '#d5f5e3';
  ctx.font = 'bold 20px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('EXIT', e.x + e.w / 2 - cam.x, e.y + e.h / 2 + 7 - cam.y);
  if (hasPackage) {
    ctx.fillStyle = '#2ecc71';
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText('▼ GO!', e.x + e.w / 2 - cam.x, e.y - 10 - cam.y);
  }
}

function drawCone(ctx, guard, cam) {
  const colors = coneColor(guard.alert);
  const gx = guard.x - cam.x;
  const gy = guard.y - cam.y;
  const grad = ctx.createRadialGradient(gx, gy, 10, gx, gy, VISION_RANGE);
  grad.addColorStop(0, colors.fill);
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(gx, gy);
  ctx.arc(gx, gy, VISION_RANGE, guard.angle - VISION_HALF_ANGLE, guard.angle + VISION_HALF_ANGLE);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = colors.edge;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(gx, gy);
  ctx.lineTo(gx + Math.cos(guard.angle - VISION_HALF_ANGLE) * VISION_RANGE,
    gy + Math.sin(guard.angle - VISION_HALF_ANGLE) * VISION_RANGE);
  ctx.moveTo(gx, gy);
  ctx.lineTo(gx + Math.cos(guard.angle + VISION_HALF_ANGLE) * VISION_RANGE,
    gy + Math.sin(guard.angle + VISION_HALF_ANGLE) * VISION_RANGE);
  ctx.stroke();
}

function drawGuard(ctx, guard, cam) {
  const gx = guard.x - cam.x;
  const gy = guard.y - cam.y;
  ctx.fillStyle = '#232a3d';
  ctx.beginPath();
  ctx.arc(gx, gy, 17, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#5b6b8c';
  ctx.lineWidth = 2;
  ctx.stroke();
  // Visor: the direction the guard faces.
  ctx.strokeStyle = '#ffd166';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(gx, gy);
  ctx.lineTo(gx + Math.cos(guard.angle) * 15, gy + Math.sin(guard.angle) * 15);
  ctx.stroke();
  // Helmet dot.
  ctx.fillStyle = '#8fa3c8';
  ctx.beginPath();
  ctx.arc(gx, gy, 6, 0, Math.PI * 2);
  ctx.fill();
  if (guard.alert >= 0.75) {
    ctx.fillStyle = '#ff5555';
    ctx.font = 'bold 22px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('!', gx, gy - 26);
  } else if (guard.alert >= 0.35) {
    ctx.fillStyle = '#ffaa33';
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('?', gx, gy - 26);
  }
}

function drawPlayer(ctx, player, cam, time) {
  const px = player.x - cam.x;
  const py = player.y - cam.y;
  const noise = noiseRadius(player);
  if (noise > 0) {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
    ctx.setLineDash([6, 8]);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(px, py, noise, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  // Shadow.
  ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
  ctx.beginPath();
  ctx.ellipse(px, py + 12, 15, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  // Courier body: amber coat, dark hood.
  ctx.fillStyle = '#f2a541';
  ctx.beginPath();
  ctx.arc(px, py, player.r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#7a4d12';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = '#2b2f3a';
  ctx.beginPath();
  ctx.arc(px + Math.cos(player.angle) * 5, py + Math.sin(player.angle) * 5, 7, 0, Math.PI * 2);
  ctx.fill();
  // Satchel.
  ctx.fillStyle = '#7a4d12';
  ctx.fillRect(px - 4, py + 8, 9, 6);
  if (player.sneaking) {
    ctx.fillStyle = '#9be7ff';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('SNEAK', px, py - 24);
  }
}

function drawLighting(ctx, state, cam) {
  const light = getLightCanvas();
  const lctx = light.getContext('2d');
  lctx.clearRect(0, 0, VIEW_W, VIEW_H);
  lctx.globalCompositeOperation = 'source-over';
  lctx.fillStyle = 'rgba(4, 6, 16, 0.45)';
  lctx.fillRect(0, 0, VIEW_W, VIEW_H);
  lctx.globalCompositeOperation = 'destination-out';
  const hole = (x, y, r, strength) => {
    const g = lctx.createRadialGradient(x, y, r * 0.15, x, y, r);
    g.addColorStop(0, `rgba(0, 0, 0, ${strength})`);
    g.addColorStop(1, 'rgba(0, 0, 0, 0)');
    lctx.fillStyle = g;
    lctx.beginPath();
    lctx.arc(x, y, r, 0, Math.PI * 2);
    lctx.fill();
  };
  const p = state.player;
  hole(p.x - cam.x, p.y - cam.y, 280, 0.95);
  for (const lamp of state.level.lamps) hole(lamp.x - cam.x, lamp.y - cam.y, lamp.r, 0.85);
  const e = state.level.exit;
  hole(e.x + e.w / 2 - cam.x, e.y + e.h / 2 - cam.y, 150, 0.7);
  if (!state.packageTaken) {
    hole(state.level.packagePos.x - cam.x, state.level.packagePos.y - cam.y, 110, 0.6);
  }
  ctx.drawImage(light, 0, 0);
}

function drawMinimap(ctx, state) {
  const w = 190;
  const h = Math.round((190 * state.level.height) / state.level.width);
  const x0 = 14;
  const y0 = VIEW_H - h - 14;
  const sx = w / state.level.width;
  const sy = h / state.level.height;
  ctx.fillStyle = 'rgba(10, 12, 22, 0.75)';
  ctx.fillRect(x0 - 4, y0 - 4, w + 8, h + 8);
  ctx.fillStyle = '#2c3247';
  ctx.fillRect(x0, y0, w, h);
  ctx.fillStyle = '#8a6a3b';
  for (const c of state.level.crates) ctx.fillRect(x0 + c.x * sx, y0 + c.y * sy, Math.max(2, c.w * sx), Math.max(2, c.h * sy));
  ctx.fillStyle = '#2ecc71';
  const e = state.level.exit;
  ctx.fillRect(x0 + e.x * sx, y0 + e.y * sy, 8, 8);
  if (!state.packageTaken) {
    ctx.fillStyle = '#f5b81e';
    ctx.fillRect(x0 + state.level.packagePos.x * sx - 3, y0 + state.level.packagePos.y * sy - 3, 6, 6);
  }
  for (const g of state.guards) {
    ctx.fillStyle = '#ff6b6b';
    ctx.beginPath();
    ctx.arc(x0 + g.x * sx, y0 + g.y * sy, 3.5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = '#f2a541';
  ctx.beginPath();
  ctx.arc(x0 + state.player.x * sx, y0 + state.player.y * sy, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.lineWidth = 1;
  ctx.strokeRect(x0 - 4, y0 - 4, w + 8, h + 8);
}

export function drawWorld(ctx, state, cam, time) {
  drawFloor(ctx, state.level, cam);
  drawExit(ctx, state.level, cam, time, state.packageTaken);
  drawPackage(ctx, state.level, cam, state.packageTaken, time);
  drawCrates(ctx, state.level, cam);
  drawWalls(ctx, state.level, cam);
  for (const guard of state.guards) drawCone(ctx, guard, cam);
  for (const guard of state.guards) drawGuard(ctx, guard, cam);
  drawPlayer(ctx, state.player, cam, time);
  drawLighting(ctx, state, cam);
}

function meterColor(meter) {
  if (meter >= 0.75) return '#ff4444';
  if (meter >= 0.35) return '#ff9a3c';
  return '#f5e6a3';
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function drawHUD(ctx, state) {
  // Top bar.
  ctx.fillStyle = 'rgba(8, 10, 20, 0.72)';
  ctx.fillRect(0, 0, VIEW_W, 54);
  ctx.fillStyle = '#e8ecf5';
  ctx.font = 'bold 17px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(state.level.name, 16, 22);
  ctx.fillStyle = '#9aa5c0';
  ctx.font = '13px sans-serif';
  ctx.fillText(state.level.hint, 16, 42);
  const objective = state.packageTaken ? 'Package secured — reach the EXIT unseen' : 'Steal the PACKAGE, then reach the EXIT';
  ctx.fillStyle = '#ffd166';
  ctx.font = 'bold 15px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(objective, VIEW_W / 2, 24);
  ctx.fillStyle = '#e8ecf5';
  ctx.font = 'bold 16px sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(`⏱ ${formatTime(state.time)}   👁 Spotted: ${state.spotted}`, VIEW_W - 16, 24);
  ctx.fillStyle = '#9aa5c0';
  ctx.font = '13px sans-serif';
  ctx.fillText('WASD move · Shift sneak · M mute', VIEW_W - 16, 42);

  // Detection meter, centred under the top bar.
  const mw = 340;
  const mx = (VIEW_W - mw) / 2;
  const my = 64;
  ctx.fillStyle = 'rgba(8, 10, 20, 0.72)';
  roundRectPath(ctx, mx - 8, my - 6, mw + 16, 26, 8);
  ctx.fill();
  ctx.fillStyle = '#22263a';
  roundRectPath(ctx, mx, my, mw, 14, 7);
  ctx.fill();
  if (state.meter > 0.01) {
    ctx.fillStyle = meterColor(state.meter);
    roundRectPath(ctx, mx, my, Math.max(14, mw * state.meter), 14, 7);
    ctx.fill();
  }
  ctx.fillStyle = state.meter >= 0.35 ? meterColor(state.meter) : '#c8cede';
  ctx.font = 'bold 12px sans-serif';
  ctx.textAlign = 'center';
  const label = state.meter >= 0.75 ? '!! SPOTTED — BREAK LINE OF SIGHT !!'
    : state.meter >= 0.35 ? 'SUSPICIOUS — a guard sees you'
    : 'DETECTION';
  ctx.fillText(label, VIEW_W / 2, my + 34);

  if (state.banner) {
    ctx.fillStyle = 'rgba(8, 10, 20, 0.8)';
    const bw = 460;
    roundRectPath(ctx, (VIEW_W - bw) / 2, VIEW_H / 2 - 40, bw, 64, 10);
    ctx.fill();
    ctx.fillStyle = '#7be495';
    ctx.font = 'bold 22px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(state.banner, VIEW_W / 2, VIEW_H / 2 - 4);
  }
  drawMinimap(ctx, state);
}

export function drawTitle(ctx, time) {
  ctx.fillStyle = '#0b0e1a';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  // Decorative cones behind the title.
  for (const [x, y, a, c] of [[300, 620, -0.9, 'rgba(245, 230, 163, 0.10)'], [980, 620, -2.2, 'rgba(255, 154, 60, 0.10)']]) {
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.arc(x, y, 300, a - 0.55, a + 0.55);
    ctx.closePath();
    ctx.fill();
  }
  ctx.fillStyle = '#ffd166';
  ctx.font = 'bold 84px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('NIGHT COURIER', VIEW_W / 2, 210);
  ctx.fillStyle = '#e8ecf5';
  ctx.font = '22px sans-serif';
  ctx.fillText('Slip through the guarded depot. Steal the package. Vanish.', VIEW_W / 2, 260);
  ctx.fillStyle = '#9aa5c0';
  ctx.font = '17px sans-serif';
  const lines = [
    'WASD / Arrow keys — move          Shift — sneak (slow, silent)',
    'Walking makes noise — guards hear footsteps inside the dashed ring',
    'Stay out of the vision cones. Crates and walls block their sight.',
    'Fill the detection meter and you are caught — the level restarts.',
    'Grab the PACKAGE, then reach the glowing green EXIT.',
    'M — mute sound',
  ];
  lines.forEach((line, i) => ctx.fillText(line, VIEW_W / 2, 330 + i * 30));
  const blink = 0.55 + 0.45 * Math.sin(time * 3);
  ctx.fillStyle = `rgba(123, 228, 149, ${blink})`;
  ctx.font = 'bold 24px sans-serif';
  ctx.fillText('Press ENTER or click to play', VIEW_W / 2, 560);
  ctx.fillStyle = '#5a6278';
  ctx.font = '13px sans-serif';
  ctx.fillText('An original top-down stealth game · 3 levels · no network, no downloads', VIEW_W / 2, 640);
}

export function drawWin(ctx, stats) {
  ctx.fillStyle = 'rgba(6, 10, 6, 0.88)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.fillStyle = '#7be495';
  ctx.font = 'bold 64px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('CLEAN GETAWAY!', VIEW_W / 2, 250);
  ctx.fillStyle = '#e8ecf5';
  ctx.font = '22px sans-serif';
  ctx.fillText('Every package stolen. Every guard left in the dark.', VIEW_W / 2, 300);
  ctx.fillStyle = '#ffd166';
  ctx.font = 'bold 20px sans-serif';
  ctx.fillText(`Time  ${formatTime(stats.time)}      Spotted  ${stats.spotted}      Levels  3 / 3`, VIEW_W / 2, 380);
  const rank = stats.spotted === 0 ? 'GHOST — never seen once' : stats.spotted <= 2 ? 'SHADOW — barely a whisper' : 'LOUD COURIER — but the job is done';
  ctx.fillStyle = '#9be7ff';
  ctx.font = 'bold 22px sans-serif';
  ctx.fillText(rank, VIEW_W / 2, 440);
  ctx.fillStyle = '#9aa5c0';
  ctx.font = '17px sans-serif';
  ctx.fillText('Press ENTER to run it again', VIEW_W / 2, 520);
}

export function drawCaughtFlash(ctx, strength) {
  ctx.fillStyle = `rgba(255, 40, 40, ${0.35 * strength})`;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 52px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('SPOTTED!', VIEW_W / 2, VIEW_H / 2 - 10);
  ctx.font = '20px sans-serif';
  ctx.fillText('The guards raise the alarm — the level restarts', VIEW_W / 2, VIEW_H / 2 + 30);
}
