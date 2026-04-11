/**
 * Build-time image checker.
 * Scans all content pages for local /images/ src paths and verifies:
 *   1. The file exists on disk.
 *   2. The file is committed to git (catches files that exist locally but
 *      weren't staged — these would be missing on Cloudflare Workers).
 *
 * Checks ALL images across ALL pages before reporting, then exits 1 if
 * any issues were found.
 */

import { readdir, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { join } from 'node:path';

const ROOT        = new URL('..', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1');
const CONTENT_DIR = join(ROOT, 'src/content/pages');
const PUBLIC_DIR  = join(ROOT, 'public');

// All files tracked by git inside public/images/
let trackedFiles = new Set();
try {
  const out = execSync('git ls-files public/images/', { cwd: ROOT }).toString();
  trackedFiles = new Set(out.trim().split('\n').filter(Boolean));
} catch {
  console.warn('⚠ Could not run git ls-files — skipping committed-file check.');
}

let files;
try {
  files = await readdir(CONTENT_DIR);
} catch (err) {
  console.error(`✘ Could not read content directory: ${err.message}`);
  process.exit(1);
}

const missing   = [];  // { page, src } — not on disk
const untracked = [];  // { page, src, gitPath } — on disk but not committed
const errors    = [];  // { page, err } — could not read file

for (const file of files) {
  if (!file.endsWith('.md')) continue;

  let content;
  try {
    content = await readFile(join(CONTENT_DIR, file), 'utf8');
  } catch (err) {
    errors.push({ page: file, err: err.message });
    continue;
  }

  const matches = [...content.matchAll(/src="(\/images\/[^"]+)"/g)];

  for (const [, src] of matches) {
    const diskPath = join(PUBLIC_DIR, src);

    if (!existsSync(diskPath)) {
      missing.push({ page: file, src });
      continue;
    }

    const gitPath = 'public' + src.replaceAll('\\', '/');
    if (trackedFiles.size > 0 && !trackedFiles.has(gitPath)) {
      untracked.push({ page: file, src, gitPath });
    }
  }
}

// ── Report ────────────────────────────────────────────────────────────────────

let hasErrors = false;

if (errors.length > 0) {
  hasErrors = true;
  console.error(`\n✘ Could not read ${errors.length} file(s):\n`);
  for (const { page, err } of errors) {
    console.error(`  ${page}  →  ${err}`);
  }
}

if (missing.length > 0) {
  hasErrors = true;
  console.error(`\n✘ Missing images (${missing.length}) — file not found on disk:\n`);
  for (const { page, src } of missing) {
    console.error(`  ${page}  →  ${src}`);
  }
}

if (untracked.length > 0) {
  hasErrors = true;
  console.error(`\n✘ Untracked images (${untracked.length}) — exists locally but not committed to git:\n`);
  for (const { page, gitPath } of untracked) {
    console.error(`  ${page}  →  ${gitPath}`);
  }
  console.error(`\n  Run: git add <file>  for each one above.\n`);
}

if (!hasErrors) {
  console.log('✓ All images present and committed.');
  process.exit(0);
} else {
  console.error(`\n✘ Build aborted — fix the ${missing.length + untracked.length + errors.length} issue(s) listed above.\n`);
  process.exit(1);
}
