// Guard patrol movement and the vision-cone test for Night Courier.
// A guard walks a waypoint loop with pauses, turns smoothly toward where it
// is heading, and watches a cone in front of it. Walls and crates block sight.
export const VISION_RANGE = 260;
export const VISION_HALF_ANGLE = 0.55; // ~31.5 degrees each side
export const TURN_RATE = 3.4; // radians per second

export function createGuard(def, index) {
  const start = def.waypoints[0];
  return {
    id: index,
    x: start[0],
    y: start[1],
    angle: 0,
    waypoints: def.waypoints,
    waypointIndex: 1 % def.waypoints.length,
    speed: def.speed,
    pause: def.pause,
    pauseTimer: 0.6,
    state: 'patrol', // patrol | investigate | look
    alert: 0, // 0 calm .. 1 fully alarmed; drives the cone colour
    lastSeen: null,
    lookTimer: 0,
  };
}

function angleDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

function turnToward(guard, targetAngle, dt) {
  const diff = angleDiff(targetAngle, guard.angle);
  const step = Math.max(-TURN_RATE * dt, Math.min(TURN_RATE * dt, diff));
  guard.angle += step;
}

// True when the segment from (x1,y1) to (x2,y2) touches rectangle r.
function segmentHitsRect(x1, y1, x2, y2, r) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  let tMin = 0;
  let tMax = 1;
  if (dx === 0) {
    if (x1 < r.x || x1 > r.x + r.w) return false;
  } else {
    let t1 = (r.x - x1) / dx;
    let t2 = (r.x + r.w - x1) / dx;
    if (t1 > t2) [t1, t2] = [t2, t1];
    tMin = Math.max(tMin, t1);
    tMax = Math.min(tMax, t2);
    if (tMin > tMax) return false;
  }
  if (dy === 0) {
    if (y1 < r.y || y1 > r.y + r.h) return false;
  } else {
    let t1 = (r.y - y1) / dy;
    let t2 = (r.y + r.h - y1) / dy;
    if (t1 > t2) [t1, t2] = [t2, t1];
    tMin = Math.max(tMin, t1);
    tMax = Math.min(tMax, t2);
    if (tMin > tMax) return false;
  }
  return true;
}

export function lineOfSightClear(x1, y1, x2, y2, solids) {
  for (const rect of solids) {
    if (segmentHitsRect(x1, y1, x2, y2, rect)) return false;
  }
  return true;
}

// Can this guard see the player right now? Returns { seen, dist }.
export function guardSeesPlayer(guard, player, solids) {
  const dx = player.x - guard.x;
  const dy = player.y - guard.y;
  const dist = Math.hypot(dx, dy);
  if (dist > VISION_RANGE) return { seen: false, dist };
  const toPlayer = Math.atan2(dy, dx);
  if (Math.abs(angleDiff(toPlayer, guard.angle)) > VISION_HALF_ANGLE) {
    return { seen: false, dist };
  }
  if (!lineOfSightClear(guard.x, guard.y, player.x, player.y, solids)) {
    return { seen: false, dist };
  }
  return { seen: true, dist };
}

// Cone colour by alertness: pale yellow at rest, orange when suspicious, red on alarm.
export function coneColor(alert) {
  if (alert >= 0.75) return { fill: 'rgba(255, 68, 68, 0.40)', edge: 'rgba(255, 90, 90, 0.85)' };
  if (alert >= 0.35) return { fill: 'rgba(255, 154, 60, 0.34)', edge: 'rgba(255, 170, 80, 0.8)' };
  return { fill: 'rgba(245, 230, 163, 0.26)', edge: 'rgba(245, 230, 163, 0.55)' };
}

function moveToward(guard, tx, ty, dt) {
  const dx = tx - guard.x;
  const dy = ty - guard.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 2) return true;
  const step = Math.min(dist, guard.speed * dt);
  guard.x += (dx / dist) * step;
  guard.y += (dy / dist) * step;
  turnToward(guard, Math.atan2(dy, dx), dt);
  return dist - step < 2;
}

// Advance one guard a frame. `events` collects 'suspicious' / 'alarm' notes
// for the main loop (sounds, HUD); the detection meter itself lives in main.
export function updateGuard(guard, dt, player, solids, events) {
  const sight = guardSeesPlayer(guard, player, solids);
  if (sight.seen) {
    guard.lastSeen = { x: player.x, y: player.y };
    const wasCalm = guard.alert < 0.35;
    guard.alert = Math.min(1, guard.alert + dt * 1.6);
    if (wasCalm && guard.alert >= 0.35) events.push('suspicious');
    if (guard.alert >= 0.75) guard.state = 'investigate';
    turnToward(guard, Math.atan2(player.y - guard.y, player.x - guard.x), dt * 2.2);
  } else {
    guard.alert = Math.max(0, guard.alert - dt * 0.5);
  }

  if (guard.state === 'investigate' && guard.lastSeen && !sight.seen) {
    const arrived = moveToward(guard, guard.lastSeen.x, guard.lastSeen.y, dt);
    if (arrived) {
      guard.state = 'look';
      guard.lookTimer = 2.0;
    }
    return;
  }
  if (guard.state === 'look') {
    guard.lookTimer -= dt;
    guard.angle += dt * 1.1; // scan the area
    if (guard.lookTimer <= 0) {
      guard.state = 'patrol';
      guard.lastSeen = null;
    }
    return;
  }

  // Patrol: walk to the next waypoint, pause, then continue the loop.
  if (guard.pauseTimer > 0) {
    guard.pauseTimer -= dt;
    return;
  }
  const target = guard.waypoints[guard.waypointIndex];
  const arrived = moveToward(guard, target[0], target[1], dt);
  if (arrived) {
    guard.waypointIndex = (guard.waypointIndex + 1) % guard.waypoints.length;
    guard.pauseTimer = guard.pause;
  }
}
