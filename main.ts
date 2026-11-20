// GTA VI Trophy Guide & Tracker — entrypoint (Node 22, standard library only).
//
// This program hands the guide in. It copies the static app (app/) and the
// screenshots (screenshots/) from this repository into the output directory
// (/output, or $MAKEFUN_OUTPUT_DIR outside the grader) and writes
// /output/dossier.json with buildDossier from the kit's vendored library
// (vendor/makefun-frontend.ts, copied unchanged from the kit).
//
// Run it locally with:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(outputDir, { recursive: true });
cpSync(join(repoRoot, 'app'), join(outputDir, 'app'), { recursive: true });
mkdirSync(join(outputDir, 'screenshots'), { recursive: true });
if (existsSync(join(repoRoot, 'screenshots'))) {
  cpSync(join(repoRoot, 'screenshots'), join(outputDir, 'screenshots'), { recursive: true });
}

// Caps mirror the gate: at most 4 screenshots of 256 KiB, app/ under 993
// files and 48 MiB, and the dossier text capped at 160 KiB.
const dossier = buildDossier(outputDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
});
writeFileSync(join(outputDir, 'dossier.json'), dossier);
console.log(`Wrote ${join(outputDir, 'dossier.json')} (${dossier.length} bytes)`);
