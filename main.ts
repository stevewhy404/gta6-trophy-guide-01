// Leonida Trophy Atlas — dossier entrypoint for gta6-trophy-guide-01.
// Node 22, stdlib only.
//
// This builds what gets handed in: the offline guide in app/ (index.html,
// modules, styles and data, including app/data/trophies.json), the
// screenshots of it, and dossier.json under /output — the summary the judge
// reads — produced by the vendored make.fun library. The library file
// vendor/makefun-frontend.ts is the kit's own copy, kept byte for byte: the
// scorer rebuilds the dossier with its identical copy and compares the two.
//
// Outside the grader, point MAKEFUN_OUTPUT_DIR at a local folder:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

// Caps from the scorer for this competition (reference/gate.json). The text
// cap shapes how big the dossier gets; the rest reject an entry the scorer
// would refuse anyway: over 4 screenshots, any screenshot over 256 KiB, or
// app/ past 993 files / 48 MiB.
const TEXT_CAP_BYTES = 163840;
const MAX_SHOTS = 4;
const MAX_SHOT_BYTES = 262144;
const MAX_APP_FILES = 993;
const MAX_APP_BYTES = 50331648;

const rootDir = fileURLToPath(new URL('.', import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(outDir, { recursive: true });

// Copy the guide itself: every static file under app/.
cpSync(join(rootDir, 'app'), join(outDir, 'app'), { recursive: true });

// Copy the renders of the guide, when they exist.
mkdirSync(join(outDir, 'screenshots'), { recursive: true });
const shots = join(rootDir, 'screenshots');
if (existsSync(shots)) cpSync(shots, join(outDir, 'screenshots'), { recursive: true });

// Build the dossier the judge reads.
const dossierFile = join(outDir, 'dossier.json');
writeFileSync(
  dossierFile,
  buildDossier(outDir, {
    text_max_bytes: TEXT_CAP_BYTES,
    screenshots: { max: MAX_SHOTS, max_bytes: MAX_SHOT_BYTES },
    app_max_files: MAX_APP_FILES,
    app_max_bytes: MAX_APP_BYTES,
  }),
);
console.log(`dossier written: ${dossierFile}`);
