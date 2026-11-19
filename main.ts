// Leonida Trophy Atlas — entrypoint for gta6-trophy-guide-01 (Node 22, stdlib only).
//
// What this program hands in: the offline guide in app/ (a static site: index.html,
// its modules, styles and data, including app/data/trophies.json) plus the 3-4
// screenshots/ renders of it, and /output/dossier.json — the summary the judge
// reads — built with the vendored make.fun library. The library file
// vendor/makefun-frontend.ts is the kit's own copy, kept byte for byte: the
// scorer rebuilds the dossier with its identical copy and compares the two.
//
// Run it outside the grader with MAKEFUN_OUTPUT_DIR standing in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

// The scorer's own caps for this competition (reference/gate.json): the text cap
// shapes the dossier's bytes; the rest refuse an entry the scorer would refuse
// (more than 4 screenshots, one over 256 KiB, or app/ past 993 files / 48 MiB).
const DOSSIER_TEXT_MAX_BYTES = 163840;
const SCREENSHOT_LIMIT = 4;
const SCREENSHOT_MAX_BYTES = 262144;
const APP_FILE_LIMIT = 993;
const APP_BYTE_LIMIT = 50331648;

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(outputDir, { recursive: true });

// The guide itself: every static file under app/.
cpSync(join(repoRoot, 'app'), join(outputDir, 'app'), { recursive: true });

// The renders of the guide, if they are there yet.
const shotsDir = join(repoRoot, 'screenshots');
mkdirSync(join(outputDir, 'screenshots'), { recursive: true });
if (existsSync(shotsDir)) {
  cpSync(shotsDir, join(outputDir, 'screenshots'), { recursive: true });
}

const dossierPath = join(outputDir, 'dossier.json');
writeFileSync(
  dossierPath,
  buildDossier(outputDir, {
    text_max_bytes: DOSSIER_TEXT_MAX_BYTES,
    screenshots: { max: SCREENSHOT_LIMIT, max_bytes: SCREENSHOT_MAX_BYTES },
    app_max_files: APP_FILE_LIMIT,
    app_max_bytes: APP_BYTE_LIMIT,
  }),
);
console.log(`dossier written: ${dossierPath}`);
