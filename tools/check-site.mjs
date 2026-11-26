// 发布前自检：首页本地引用、应用缩略图、manifest 图标、Service Worker 预缓存清单是否与磁盘一致。
// 用法：node tools/check-site.mjs
// 任何一项不一致都以非零码退出，让 CI 直接拦下这次发布。

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const problems = [];
const fail = (message) => problems.push(message);

const readJson = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
const exists = (relative) => fs.existsSync(path.join(ROOT, relative));

function checkHomepageLinks() {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const refs = new Set();
  for (const match of html.matchAll(/(?:href|src)="([^"#?]+)"/g)) {
    const ref = match[1];
    // 根绝对路径指向其他仓库的 Pages（/sim-sketch/ 等），不属于本仓库发布产物。
    if (/^[a-z]+:/i.test(ref) || ref.startsWith('//') || ref.startsWith('/')) continue;
    refs.add(ref);
  }
  for (const ref of refs) {
    const relative = ref.replace(/\/$/, '');
    if (!exists(relative === '' ? 'index.html' : relative) && !exists(path.join(relative, 'index.html'))) {
      fail(`index.html references a missing file: ${ref}`);
    }
  }
}

// home.js 用 assets/thumbnails/<repo>.webp 作为每个应用卡片的首图。
function checkThumbnails() {
  const source = fs.readFileSync(path.join(ROOT, 'assets/projects.js'), 'utf8');
  const projects = source.slice(source.indexOf('window.PROJECTS'), source.indexOf('window.ARCHIVE'));
  for (const match of projects.matchAll(/url:'\/([^/']+)\/'/g)) {
    const thumb = `assets/thumbnails/${match[1]}.webp`;
    if (!exists(thumb)) fail(`application card is missing its thumbnail: ${thumb}`);
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
    if (!exists(icon.src.replace(/^\//, ''))) fail(`manifest icon missing: ${icon.src}`);
  }
}

function checkServiceWorker() {
  const source = fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8');
  const listed = [...source.matchAll(/^\s*'(\/[^']*)',?$/gm)].map((match) => match[1]);
  if (listed.length === 0) fail('sw.js has no precache URLs');
  for (const url of listed) {
    const relative = url === '/' ? 'index.html' : url.replace(/^\/+/, '');
    if (!exists(relative) && !exists(path.join(relative, 'index.html'))) {
      fail(`sw.js precaches a missing path: ${url}`);
    }
  }
}

// 3D 打印档案由 mizy/mz-3d-print 仓库自己的 Pages 发布，本仓库不再保存副本。
function checkPrintArchiveAbsent() {
  if (exists('mz-3d-print/index.html')) {
    fail('mz-3d-print/ must not live here; it is published from github.com/mizy/mz-3d-print');
  }
}

checkHomepageLinks();
checkThumbnails();
checkManifest();
checkServiceWorker();
checkPrintArchiveAbsent();

if (problems.length > 0) {
  console.error(problems.map((problem) => `FAIL ${problem}`).join('\n'));
  process.exit(1);
}
console.log('site check passed');
