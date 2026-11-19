// Leonida Trophy Atlas — the hand-in for gta6-trophy-guide-01.
// Node 22+, standard library only.
//
// What this does: it takes the offline guide in app/ (index.html, its JS
// modules, styles and data, trophies.json among them) plus the screenshots
// in screenshots/ and puts them in /output, then writes /output/dossier.json
// — the summary the judge reads — with the vendored make.fun library.
// vendor/makefun-frontend.ts is the kit's own copy and stays byte for byte:
// the scorer rebuilds the dossier with its identical copy and compares.
//
// Run it locally with MAKEFUN_OUTPUT_DIR pointed at a folder:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) {
  cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });
}

// The scorer's caps for this competition (reference/gate.json): the text cap
// shapes how big the dossier gets; the rest refuse an entry the scorer
// would refuse — more than 4 screenshots, one over 256 KiB, more than 993
// files and directories in app/, or 48 MiB of app files.
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
  }),
);
