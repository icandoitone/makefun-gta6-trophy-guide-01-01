// Leonida Trophy Atlas — hands the guide in for gta6-trophy-guide-01.
//
// The guide itself is plain static files: app/ holds the tracker (index,
// styles, logic and the trophy data) and screenshots/ holds 3 or 4 real
// renders of it. This program copies both into the output directory and
// writes dossier.json there with the vendored make.fun library, so the
// judge reads the screenshots and the source outline the library builds
// from exactly those files. Node 22, standard library only, no network.
//
// Run it locally with:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// In the grader the output directory is /output.

import * as fs from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

// The scorer's own caps for this bounty: the text budget shapes the
// dossier's bytes, and the rest refuse an entry the scorer would refuse
// (more than 4 screenshots, one over 256 KiB, more than 993 files and
// directories in app/, or 48 MiB of app files).
const CAPS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
  app_path_max_bytes: 1000,
};

function resolveDirs() {
  const repo = dirname(fileURLToPath(import.meta.url));
  const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
  return { repo, out };
}

function copyTree(from, to) {
  fs.mkdirSync(to, { recursive: true });
  fs.cpSync(from, to, { recursive: true });
}

function countFiles(dir) {
  let n = 0;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    n += entry.isDirectory() ? countFiles(path) : 1;
  }
  return n;
}

function handIn() {
  const { repo, out } = resolveDirs();

  const appDir = join(repo, 'app');
  const shotsDir = join(repo, 'screenshots');
  if (!fs.existsSync(appDir)) throw new Error('app/ is missing — nothing to hand in');
  if (!fs.existsSync(shotsDir)) throw new Error('screenshots/ is missing — the scorer needs 3 or 4 real renders');
  const shots = fs.readdirSync(shotsDir).filter((f) => /\.(png|jpe?g|webp)$/i.test(f));
  if (shots.length < 3 || shots.length > 4) {
    throw new Error(`screenshots/ holds ${shots.length} images — the scorer needs 3 or 4`);
  }

  // Clear the previous hand-in first, so a file deleted from the repo
  // cannot linger in the output and end up in the dossier by accident.
  fs.mkdirSync(out, { recursive: true });
  fs.rmSync(join(out, 'app'), { recursive: true, force: true });
  fs.rmSync(join(out, 'screenshots'), { recursive: true, force: true });
  copyTree(appDir, join(out, 'app'));
  copyTree(shotsDir, join(out, 'screenshots'));
  console.log(`copied ${countFiles(join(out, 'app'))} app files and ${shots.length} screenshots`);

  // The dossier is built from exactly the files the scorer will read
  // in the output directory — never from the working tree.
  const dossier = buildDossier(out, CAPS);
  const dossierPath = join(out, 'dossier.json');
  fs.writeFileSync(dossierPath, dossier);
  console.log(`wrote ${dossierPath} (${dossier.length} bytes)`);
}

handIn();
