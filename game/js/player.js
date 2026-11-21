// The courier: movement, collision, noise radius and the detection meter.
// Walking is fast but loud; sneaking (Shift) is slow and silent. A guard's
// cone fills the meter while the courier is seen — faster up close and while
// walking, slower while sneaking — and the meter drains when unseen.
export const WALK_SPEED = 175;
export const SNEAK_SPEED = 88;
export const WALK_NOISE_RADIUS = 150;
export const PLAYER_RADIUS = 14;

export function createPlayer(spawn) {
  return {
    x: spawn.x,
    y: spawn.y,
    r: PLAYER_RADIUS,
    angle: -Math.PI / 2,
    moving: false,
    sneaking: false,
    stepTimer: 0,
    stepAlternate: false,
  };
}

// Push a circle out of a rectangle it overlaps; returns true on a hit.
function resolveCircleRect(p, rect) {
  const cx = Math.max(rect.x, Math.min(p.x, rect.x + rect.w));
  const cy = Math.max(rect.y, Math.min(p.y, rect.y + rect.h));
  const dx = p.x - cx;
  const dy = p.y - cy;
  const distSq = dx * dx + dy * dy;
  if (distSq >= p.r * p.r) return false;
  if (distSq === 0) {
    p.y = rect.y - p.r;
    return true;
  }
  const dist = Math.sqrt(distSq);
  p.x = cx + (dx / dist) * p.r;
  p.y = cy + (dy / dist) * p.r;
  return true;
}

export function updatePlayer(player, dt, input, solids, level) {
  const axis = input.axis();
  player.sneaking = input.sneaking();
  const speed = player.sneaking ? SNEAK_SPEED : WALK_SPEED;
  player.moving = axis.x !== 0 || axis.y !== 0;
  if (player.moving) {
    player.x += axis.x * speed * dt;
    player.y += axis.y * speed * dt;
    player.angle = Math.atan2(axis.y, axis.x);
    player.stepTimer -= dt;
    if (player.stepTimer <= 0) {
      player.stepTimer = player.sneaking ? 0.55 : 0.34;
      player.stepAlternate = !player.stepAlternate;
      player.stepped = true;
    } else {
      player.stepped = false;
    }
  } else {
    player.stepped = false;
  }

  // World bounds, then solid rectangles.
  player.x = Math.max(player.r + 2, Math.min(level.width - player.r - 2, player.x));
  player.y = Math.max(player.r + 2, Math.min(level.height - player.r - 2, player.y));
  for (const rect of solids) resolveCircleRect(player, rect);
}

// Noise radius: walking carries, sneaking is silent.
export function noiseRadius(player) {
  if (!player.moving) return 0;
  return player.sneaking ? 0 : WALK_NOISE_RADIUS;
}

// How fast the meter fills while seen at this distance and stance (per second).
export function detectionFillRate(dist, sneaking) {
  const closeness = 1 - dist / 260; // 1 up close, 0 at the cone's edge
  let rate = 0.25 + closeness * 1.15;
  if (sneaking) rate *= 0.45;
  return rate;
}

// Advance the 0..1 detection meter. Returns 'caught' the moment it fills.
export function updateDetectionMeter(meter, dt, seen, dist, sneaking) {
  if (seen) {
    meter += detectionFillRate(dist, sneaking) * dt;
    if (meter >= 1) return { meter: 1, caught: true };
    return { meter, caught: false };
  }
  return { meter: Math.max(0, meter - 0.4 * dt), caught: false };
}
