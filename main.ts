// Night Courier — the entry program for make.fun's best stealth game bounty.
// Node 22, standard library only. It hands the game in: the static files under
// game/ and the screenshots under screenshots/ are copied beside this file
// into the output directory, and dossier.json is written there with the
// vendored make.fun library (./vendor/makefun-game.ts), exactly the summary
// the judge reads. The copy is a plain byte copy, so running this twice from
// the same repository writes the same bytes twice.
//
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
const gameDir = join(repoRoot, 'game');
const shotsDir = join(repoRoot, 'screenshots');

mkdirSync(outputDir, { recursive: true });

// Replace any previous copy so stale files can never survive into the entry.
rmSync(join(outputDir, 'game'), { recursive: true, force: true });
cpSync(gameDir, join(outputDir, 'game'), { recursive: true });

mkdirSync(join(outputDir, 'screenshots'), { recursive: true });
if (existsSync(shotsDir)) {
  cpSync(shotsDir, join(outputDir, 'screenshots'), { recursive: true });
}

// Caps the scorer enforces: the dossier text stays under 160 KiB, at most
// 4 screenshots of 256 KiB each, game/ under 993 files and 48 MiB.
writeFileSync(
  join(outputDir, 'dossier.json'),
  buildDossier(outputDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);
