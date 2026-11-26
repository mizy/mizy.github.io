// 发布前自检：校验和、页面链接、图标、Service Worker 预缓存清单是否与磁盘一致。
// 用法：node tools/check-site.mjs
// 任何一项不一致都以非零码退出，让 CI 直接拦下这次发布。

import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PRINT = path.join(ROOT, 'mz-3d-print');
const problems = [];
const fail = (message) => problems.push(message);

const readJson = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
const sha256 = (file) => createHash('sha256').update(fs.readFileSync(file)).digest('hex');

function checkChecksums() {
  const entries = readJson(path.join(PRINT, 'checksums.json'));
  const onDisk = [];
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.isFile()) onDisk.push(path.relative(PRINT, full));
    }
  };
  walk(path.join(PRINT, 'files'));
  onDisk.sort();
  const listed = entries.map((entry) => entry.path).sort();
  if (JSON.stringify(onDisk) !== JSON.stringify(listed)) {
    fail(`checksums.json does not cover files/ exactly (disk ${onDisk.length}, listed ${listed.length})`);
  }
  for (const entry of entries) {
    const full = path.join(PRINT, entry.path);
    if (!fs.existsSync(full)) {
      fail(`checksums.json lists a missing file: ${entry.path}`);
      continue;
    }
    const bytes = fs.readFileSync(full);
    if (bytes.length !== entry.bytes) fail(`size mismatch: ${entry.path}`);
    if (sha256(full) !== entry.sha256) fail(`sha256 mismatch: ${entry.path}`);
  }
}

function checkPrintPage() {
  const html = fs.readFileSync(path.join(PRINT, 'index.html'), 'utf8');
  const cards = html.match(/<article class="project"/g) ?? [];
  if (cards.length === 0) fail('mz-3d-print/index.html has no project cards');

  const downloads = [...html.matchAll(/<li><a href="(files\/[^"]+)" download>[^<]*<\/a><span class="size">([^<]+)<\/span><\/li>/g)];
  if (downloads.length === 0) fail('index.html has no download entries');
  for (const [, href, sizeText] of downloads) {
    const full = path.join(PRINT, href);
    if (!fs.existsSync(full)) {
      fail(`download link points at a missing file: ${href}`);
      continue;
    }
    const expected = `${(fs.statSync(full).size / 1048576).toFixed(2)} MB`;
    if (sizeText !== expected) fail(`size text is stale for ${href}: page ${sizeText}, disk ${expected}`);
  }

  const previews = [...html.matchAll(/<(?:img src|a class="preview" href|button data-view-src)="(previews\/[^"]+)"/g)];
  if (previews.length === 0) fail('index.html has no preview references');
  for (const [, src] of previews) {
    if (!fs.existsSync(path.join(PRINT, src))) fail(`preview missing: ${src}`);
  }
}

function checkManifest() {
  const manifest = readJson(path.join(ROOT, 'manifest.json'));
  for (const key of ['name', 'short_name', 'start_url', 'scope', 'display']) {
    if (!manifest[key]) fail(`manifest.json missing ${key}`);
  }
  const sizes = (manifest.icons ?? []).map((icon) => `${icon.sizes}:${icon.purpose ?? 'any'}`);
  if (!sizes.includes('192x192:any')) fail('manifest.json needs a 192x192 any icon');
  if (!sizes.includes('512x512:any')) fail('manifest.json needs a 512x512 any icon');
  if (!manifest.icons.some((icon) => (icon.purpose ?? 'any').includes('maskable'))) fail('manifest.json needs a maskable icon');
  for (const icon of manifest.icons ?? []) {
    const full = path.join(ROOT, icon.src.replace(/^\//, ''));
    if (!fs.existsSync(full)) fail(`manifest icon missing: ${icon.src}`);
  }
}

function checkServiceWorker() {
  const source = fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8');
  const listed = [...source.matchAll(/^\s*'(\/[^']*)',?$/gm)].map((match) => match[1]);
  if (listed.length === 0) fail('sw.js has no precache URLs');
  for (const url of listed) {
    const relative = url === '/' ? 'index.html' : url.replace(/^\/+/, '');
    const full = path.join(ROOT, relative);
    if (!fs.existsSync(full) && !fs.existsSync(path.join(ROOT, relative, 'index.html'))) {
      fail(`sw.js precaches a missing path: ${url}`);
    }
  }
}

checkChecksums();
checkPrintPage();
checkManifest();
checkServiceWorker();

if (problems.length > 0) {
  console.error(problems.map((problem) => `FAIL ${problem}`).join('\n'));
  process.exit(1);
}
console.log('site check passed');
