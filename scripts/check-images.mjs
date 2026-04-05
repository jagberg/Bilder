/**
 * Build-time image checker.
 * Scans all content pages for local /images/ src paths and verifies:
 *   1. The file exists on disk.
 *   2. The file is committed to git (catches files that exist locally but
 *      weren't staged — these would be missing on Cloudflare Pages).
 *
 * Exits with code 1 if any images fail either check.
 */

import { readdir, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { join } from 'node:path';

const ROOT         = new URL('..', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1');
const CONTENT_DIR  = join(ROOT, 'src/content/pages');
const PUBLIC_DIR   = join(ROOT, 'public');

// All files tracked by git inside public/images/ (forward-slash paths, relative to repo root)
let trackedFiles = new Set();
try {
  const out = execSync('git ls-files public/images/', { cwd: ROOT }).toString();
  trackedFiles = new Set(out.trim().split('\n').filter(Boolean));
} catch {
  console.warn('⚠ Could not run git ls-files — skipping git-tracked check.');
}

const files = await readdir(CONTENT_DIR);
const missing   = [];   // not on disk
const untracked = [];   // on disk but not committed

for (const file of files) {
  if (!file.endsWith('.md')) continue;
  const content = await readFile(join(CONTENT_DIR, file), 'utf8');
  const matches = [...content.matchAll(/src="(\/images\/[^"]+)"/g)];

  for (const [, src] of matches) {
    const diskPath = join(PUBLIC_DIR, src);

    if (!existsSync(diskPath)) {
      missing.push({ page: file, src });
      continue;
    }

    // Convert src (/images/foo.jpg) to the git-relative path (public/images/foo.jpg)
    const gitPath = 'public' + src.replaceAll('\\', '/');
    if (trackedFiles.size > 0 && !trackedFiles.has(gitPath)) {
      untracked.push({ page: file, src, gitPath });
    }
  }
}

let hasErrors = false;

if (missing.length > 0) {
  hasErrors = true;
  console.error(`\n⚠ Missing image files (${missing.length}) — add to public/ before deploying:\n`);
  for (const { page, src } of missing) {
    console.error(`  ${page}  →  ${src}`);
  }
}

if (untracked.length > 0) {
  hasErrors = true;
  console.error(`\n⚠ Untracked image files (${untracked.length}) — file exists locally but is NOT committed to git.\n  It will be missing on Cloudflare Pages after deployment.\n  Run: git add <file>\n`);
  for (const { page, gitPath } of untracked) {
    console.error(`  ${page}  →  ${gitPath}`);
  }
}

if (!hasErrors) {
  console.log('✓ All images found and committed.');
  process.exit(0);
} else {
  process.exit(1);
}
