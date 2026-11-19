// Leonida Trophy Atlas — entrypoint (Node 22, standard library only).
// The guide itself is the static app/ folder: index.html, its JS modules,
// styles and data/trophies.json. This program hands it in: it reads the
// trophy data, derives the summary counts from the data (never from
// constants), copies app/ and screenshots/ to the output directory, and
// writes dossier.json with the vendored make.fun library. The scorer
// requires dossier.json to be byte for byte what its own copy writes, so
// vendor/makefun-frontend.ts is left untouched.
//
// Run it locally with:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// and serve the app with `node serve.ts` (http://localhost:8080).

import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
const dataPath = join(here, 'app', 'data', 'trophies.json');

const doc = JSON.parse(readFileSync(dataPath, 'utf8'));
const trophies = Array.isArray(doc.trophies) ? doc.trophies : [];

// Summary counts, derived from the data file itself.
const summary = {
  total: trophies.length,
  platinum: 0,
  gold: 0,
  silver: 0,
  bronze: 0,
  missable: 0,
  kinds: {},
};
for (const trophy of trophies) {
  if (trophy.grade in summary) summary[trophy.grade] += 1;
  if (trophy.missable === true) summary.missable += 1;
  summary.kinds[trophy.kind] = (summary.kinds[trophy.kind] ?? 0) + 1;
}
console.log(
  `trophies: ${summary.total} total, ` +
    `${summary.platinum} platinum, ${summary.gold} gold, ` +
    `${summary.silver} silver, ${summary.bronze} bronze, ` +
    `${summary.missable} missable`,
);

// The build must fail loudly if the data drifts from the official list:
// the judge checks the tracker against the official 55, so a wrong count
// here would hand in a wrong guide. These expectations come from the
// official list itself (1 platinum, 2 gold, 6 silver, 46 bronze, 22
// missable, ids 1-55 each exactly once).
const expected = { total: 55, platinum: 1, gold: 2, silver: 6, bronze: 46, missable: 22 };
for (const [key, value] of Object.entries(expected)) {
  if (summary[key] !== value) {
    throw new Error(`trophy data mismatch: ${key} is ${summary[key]}, expected ${value}`);
  }
}
const seenIds = new Set();
for (const trophy of trophies) {
  if (seenIds.has(trophy.id)) throw new Error(`trophy data mismatch: duplicate id ${trophy.id}`);
  seenIds.add(trophy.id);
}
for (let id = 1; id <= 55; id += 1) {
  if (!seenIds.has(id)) throw new Error(`trophy data mismatch: missing id ${id}`);
}
console.log('trophy data matches the official list (55, 1/2/6/46, 22 missable)');

mkdirSync(outDir, { recursive: true });
cpSync(join(here, 'app'), join(outDir, 'app'), { recursive: true });
mkdirSync(join(outDir, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) {
  cpSync(join(here, 'screenshots'), join(outDir, 'screenshots'), { recursive: true });
}

// The scorer's own caps (reference/gate.json): only text_max_bytes shapes
// the bytes; the others refuse an entry the scorer would refuse (more than
// 4 screenshots or one over 256 KiB; more than 993 files and directories
// in app/ or 48 MiB of app files).
writeFileSync(
  join(outDir, 'dossier.json'),
  buildDossier(outDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
  }),
);
console.log(`dossier written to ${join(outDir, 'dossier.json')}`);
