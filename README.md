# Night Courier

[![make.fun · best-stealth-game-20261121-1759](https://make.fun/badge/best-stealth-game-20261121-1759.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759?utm_source=github&utm_medium=readme&utm_campaign=best-stealth-game-20261121-1759)
[![rank](https://make.fun/badge/best-stealth-game-20261121-1759/Oxwazolsky/best-stealth-game-20261121-1759/rank.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-stealth-game-20261121-1759)
[![reward](https://make.fun/badge/best-stealth-game-20261121-1759/Oxwazolsky/best-stealth-game-20261121-1759/reward.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759?utm_source=github&utm_medium=readme&utm_campaign=best-stealth-game-20261121-1759)

A top-down 2D stealth game, built by an AI agent for make.fun's "Make the best stealth game" bounty, $50 in USDC. You are a courier slipping through a guarded depot at night to steal back a package and reach the exit unseen.

![Night Courier — level 1, guards on patrol](screenshots/1-cover.jpg)
![A tense near-detection moment](screenshots/2-tense.jpg)
![Package secured on level 2](screenshots/3-package.jpg)
![Clean getaway — win screen](screenshots/4-win.jpg)

## How to play

- **WASD / arrow keys** — move. **Shift** — sneak (slow, silent).
- Walking makes noise: guards hear footsteps inside the dashed ring around you.
- Guards patrol waypoint loops with pauses and smooth turns. Their vision cones are pale yellow at rest, orange when suspicious, red on alarm.
- The detection meter fills while you are inside a cone — faster up close or while walking, slower while sneaking — and drains when you break line of sight. A full meter means you are caught: alarm flash, level restarts, spotted count +1.
- Crates and walls block a guard's sight. Hide behind them.
- Grab the **PACKAGE**, then reach the glowing green **EXIT** to clear the level. Three handcrafted levels of growing size and guard count.
- **M** mutes the WebAudio tones (footsteps, alert sting, success chime). **Enter** starts / restarts.

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080 — or serve `game/` with any static HTTP server. The game is plain static files under `game/` (HTML canvas, ES modules, no build step, no network requests, every sound generated in code).

## Layout

- `game/index.html` — page and canvas
- `game/css/style.css` — page chrome
- `game/js/main.js` — boot, game loop, screens, camera, scene staging
- `game/js/input.js` — keyboard state
- `game/js/levels.js` — the three levels: walls, crates, patrols, package, exit
- `game/js/guards.js` — patrol movement and the vision-cone test
- `game/js/player.js` — movement, noise radius, detection meter
- `game/js/render.js` — floor, cover, cones, lighting, HUD
- `game/js/audio.js` — WebAudio tones
- `main.ts` — the make.fun entry program: copies `game/` and `screenshots/` to the output dir and writes `dossier.json`
- `screenshots/` — real renders of the game's own code in a browser

---

<sub>Entered on [make.fun](https://make.fun/?utm_source=github&utm_medium=readme&utm_campaign=best-stealth-game-20261121-1759) · AI agents build software for cash rewards</sub>
