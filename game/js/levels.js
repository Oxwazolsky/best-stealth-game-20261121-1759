// Level data for Night Courier: walls, crates, guard patrols, package and exit.
// Three handcrafted depots of growing size and guard count. Coordinates are
// world pixels; the canvas camera follows the courier. Walls and crates are
// solid and block both movement and a guard's line of sight.
const WALL = 28;

function border(width, height) {
  return [
    { x: 0, y: 0, w: width, h: WALL },
    { x: 0, y: height - WALL, w: width, h: WALL },
    { x: 0, y: 0, w: WALL, h: height },
    { x: width - WALL, y: 0, w: WALL, h: height },
  ];
}

export const LEVELS = [
  {
    name: 'Level 1 — Depot Yard',
    hint: 'Night shift: two guards, one package.',
    width: 1400,
    height: 900,
    spawn: { x: 96, y: 796 },
    packagePos: { x: 1280, y: 220 },
    exit: { x: 1252, y: 756, w: 92, h: 92 },
    walls: [
      ...border(1400, 900),
      { x: 350, y: 180, w: WALL, h: 260 },
      { x: 700, y: 420, w: 320, h: WALL },
      { x: 1050, y: 120, w: WALL, h: 300 },
    ],
    crates: [
      { x: 200, y: 500, w: 90, h: 90 },
      { x: 300, y: 520, w: 70, h: 70 },
      { x: 820, y: 180, w: 90, h: 90 },
      { x: 900, y: 650, w: 110, h: 70 },
      { x: 560, y: 700, w: 80, h: 80 },
      { x: 1150, y: 480, w: 90, h: 90 },
    ],
    lamps: [
      { x: 700, y: 450, r: 230 },
      { x: 200, y: 200, r: 180 },
      { x: 1200, y: 760, r: 200 },
    ],
    guards: [
      {
        waypoints: [[450, 350], [650, 350], [650, 620], [450, 620]],
        speed: 72,
        pause: 1.4,
      },
      {
        waypoints: [[1120, 250], [1120, 700]],
        speed: 82,
        pause: 1.1,
      },
    ],
  },
  {
    name: 'Level 2 — Warehouse Floor',
    hint: 'Three guards cross the floor. Mind the long sightlines.',
    width: 1800,
    height: 1100,
    spawn: { x: 100, y: 990 },
    packagePos: { x: 1690, y: 100 },
    exit: { x: 1648, y: 946, w: 96, h: 96 },
    walls: [
      ...border(1800, 1100),
      { x: 400, y: 200, w: WALL, h: 340 },
      { x: 850, y: 300, w: WALL, h: 400 },
      { x: 1300, y: 640, w: 280, h: WALL },
      { x: 620, y: 830, w: 300, h: WALL },
      { x: 1420, y: 180, w: WALL, h: 260 },
    ],
    crates: [
      { x: 180, y: 300, w: 100, h: 100 },
      { x: 300, y: 330, w: 70, h: 70 },
      { x: 560, y: 560, w: 90, h: 90 },
      { x: 660, y: 580, w: 70, h: 70 },
      { x: 1020, y: 180, w: 110, h: 80 },
      { x: 1150, y: 820, w: 90, h: 90 },
      { x: 1580, y: 420, w: 90, h: 90 },
      { x: 240, y: 760, w: 80, h: 80 },
      { x: 1500, y: 800, w: 100, h: 70 },
    ],
    lamps: [
      { x: 700, y: 500, r: 240 },
      { x: 300, y: 180, r: 180 },
      { x: 1500, y: 850, r: 210 },
      { x: 1200, y: 300, r: 190 },
    ],
    guards: [
      {
        waypoints: [[520, 420], [780, 420], [780, 780], [520, 780]],
        speed: 78,
        pause: 1.3,
      },
      {
        waypoints: [[1470, 300], [1700, 300], [1700, 880]],
        speed: 86,
        pause: 1.0,
      },
      {
        waypoints: [[140, 690], [760, 690], [760, 180], [140, 180]],
        speed: 70,
        pause: 1.5,
      },
    ],
  },
  {
    name: 'Level 3 — The Vault Row',
    hint: 'Four guards, tight lanes. Take the package and vanish.',
    width: 2200,
    height: 1300,
    spawn: { x: 110, y: 1180 },
    packagePos: { x: 2080, y: 110 },
    exit: { x: 2030, y: 1140, w: 100, h: 100 },
    walls: [
      ...border(2200, 1300),
      { x: 420, y: 220, w: WALL, h: 420 },
      { x: 900, y: 120, w: WALL, h: 380 },
      { x: 900, y: 780, w: WALL, h: 380 },
      { x: 1400, y: 420, w: 300, h: WALL },
      { x: 1500, y: 900, w: WALL, h: 300 },
      { x: 1850, y: 200, w: WALL, h: 340 },
      { x: 620, y: 950, w: 340, h: WALL },
    ],
    crates: [
      { x: 200, y: 420, w: 100, h: 100 },
      { x: 320, y: 450, w: 70, h: 70 },
      { x: 640, y: 300, w: 90, h: 90 },
      { x: 1120, y: 560, w: 110, h: 80 },
      { x: 1240, y: 600, w: 70, h: 70 },
      { x: 700, y: 1120, w: 90, h: 90 },
      { x: 1650, y: 640, w: 90, h: 90 },
      { x: 1750, y: 660, w: 70, h: 70 },
      { x: 2000, y: 900, w: 100, h: 80 },
      { x: 260, y: 980, w: 80, h: 80 },
      { x: 1350, y: 1080, w: 90, h: 90 },
      { x: 1080, y: 220, w: 80, h: 80 },
    ],
    lamps: [
      { x: 700, y: 650, r: 250 },
      { x: 300, y: 200, r: 180 },
      { x: 1600, y: 700, r: 230 },
      { x: 2050, y: 1100, r: 200 },
      { x: 1200, y: 1100, r: 190 },
    ],
    guards: [
      {
        waypoints: [[560, 700], [1300, 700], [1300, 1050], [1000, 1050], [1000, 700]],
        speed: 84,
        pause: 1.2,
      },
      {
        waypoints: [[1950, 150], [1950, 800], [2050, 800], [2050, 150]],
        speed: 90,
        pause: 1.0,
      },
      {
        waypoints: [[300, 850], [800, 850], [800, 700], [300, 700]],
        speed: 76,
        pause: 1.4,
      },
      {
        waypoints: [[1250, 340], [1800, 340], [1800, 580], [1250, 580]],
        speed: 80,
        pause: 1.1,
      },
    ],
  },
];

// Every solid rectangle of a level: walls plus crates.
export function solidRects(level) {
  return level.walls.concat(level.crates);
}
