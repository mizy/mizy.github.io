// 生成 mz-3d-print 页面：读 tools/print-public.json + 上游模型仓库 → index.html / files / previews / checksums.json
//
// 用法：node tools/export-3d-print.mjs --source ../mz-3d-print
// 上游仓库只提供模型真相；公开哪些模型、公开叫什么名字，全部写死在 tools/print-public.json。
// 本脚本只写不删：目录里没有出现在清单中的旧文件会原样保留。

import { execFileSync, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'mz-3d-print');
const MANIFEST = path.join(ROOT, 'tools', 'print-public.json');
const TEMPLATE = path.join(ROOT, 'tools', 'print-page.html');

const args = process.argv.slice(2);
const sourceArg = args.indexOf('--source') === -1 ? path.resolve(ROOT, '..', 'mz-3d-print') : path.resolve(args[args.indexOf('--source') + 1]);
if (!fs.existsSync(path.join(sourceArg, 'models'))) {
  throw new Error(`source repository not found or has no models/: ${sourceArg}`);
}

const manifest = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));
const template = fs.readFileSync(TEMPLATE, 'utf8');

const escapeHtml = (text) => String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const formatSize = (bytes) => `${(bytes / 1048576).toFixed(2)} MB`;
const exists = (file) => fs.existsSync(file);
const isLfsPointer = (file) => {
  const buffer = Buffer.alloc(200);
  const fd = fs.openSync(file, 'r');
  const read = fs.readSync(fd, buffer, 0, buffer.length, 0);
  fs.closeSync(fd);
  return buffer.subarray(0, read).toString('utf8').startsWith('version https://git-lfs.github.com/spec/v1');
};

const hasCwebp = spawnSync('cwebp', ['-version'], { stdio: 'ignore' }).status === 0;

async function convertPreview(sourcePath, outPath) {
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  if (outPath.endsWith('.png')) {
    fs.copyFileSync(sourcePath, outPath);
    return;
  }
  if (!outPath.endsWith('.webp')) throw new Error(`unsupported preview extension: ${outPath}`);
  if (hasCwebp) {
    execFileSync('cwebp', ['-quiet', '-q', '80', '-resize', '1000', '0', sourcePath, '-o', outPath]);
    return;
  }
  const sharp = await import('sharp').then((module) => module.default ?? module).catch(() => null);
  if (!sharp) throw new Error('preview conversion needs cwebp or the sharp package');
  await sharp(sourcePath).resize({ width: 1000 }).webp({ quality: 80 }).toFile(outPath);
}

function renderFilters(categories, projects) {
  const count = projects.length;
  const buttons = [`<button aria-pressed="true" data-filter="全部">全部 <span>${count}</span></button>`];
  for (const category of categories) {
    buttons.push(`<button aria-pressed="false" data-filter="${escapeHtml(category)}">${escapeHtml(category)}</button>`);
  }
  return buttons.join('');
}

function renderPreview(project, preview, index, eager) {
  const src = escapeHtml(preview.out);
  const label = escapeHtml(preview.label);
  const alt = escapeHtml(preview.alt ?? `${project.name}的${preview.label}`);
  const loading = eager ? 'eager' : 'lazy';
  return `<a class="preview" href="${src}" aria-label="查看${escapeHtml(project.name)}预览"><img src="${src}" alt="${alt}" loading="${loading}"><span class="preview-label">${label}</span></a>`;
}

function renderViews(project) {
  if (project.previews.length < 2) return '';
  const buttons = project.previews.map((preview, index) => {
    const src = escapeHtml(preview.out);
    const label = escapeHtml(preview.label);
    const short = escapeHtml(preview.short ?? preview.label);
    const pressed = index === 0 ? 'true' : 'false';
    return `<button data-view-src="${src}" data-view-label="${label}" aria-pressed="${pressed}">${short}</button>`;
  });
  return `<div class="views" role="group" aria-label="预览视角">${buttons.join('')}</div>`;
}

function renderCard(project, index) {
  const files = project.files.map((file) => {
    const bytes = fs.statSync(path.join(OUT, file.out)).size;
    return `<li><a href="${escapeHtml(file.out)}" download>${escapeHtml(file.label)}</a><span class="size">${formatSize(bytes)}</span></li>`;
  });
  const search = escapeHtml([project.name, project.category, project.kinds].join(' '));
  const headings = [
    `<article class="project" data-category="${escapeHtml(project.category)}" data-search="${search}">`,
    renderPreview(project, project.previews[0], 0, index < 3),
    renderViews(project),
    `<div class="project-meta"><span>${escapeHtml(project.category)}</span><span>${escapeHtml(project.kinds)}</span></div>`,
    `<h2>${escapeHtml(project.name)}</h2>`,
    `<p class="description">${escapeHtml(project.description)}</p>`,
    `<details><summary><span>下载文件 <span class="file-count">${project.files.length}</span></span><span class="plus" aria-hidden="true">＋</span></summary><ul>${files.join('')}</ul></details>`,
    '</article>',
  ];
  return headings.join('');
}

async function publishPreview(project, preview) {
  const outPath = path.join(OUT, preview.out);
  if (!preview.source) {
    if (!exists(outPath)) throw new Error(`${project.dir}: preview needs a source image or an existing file: ${preview.out}`);
    return;
  }
  const sourcePath = path.join(sourceArg, preview.source);
  if (!exists(sourcePath)) throw new Error(`${project.dir}: preview source missing: ${preview.source}`);
  if (isLfsPointer(sourcePath)) throw new Error(`${project.dir}: preview source is an LFS pointer, run git lfs pull: ${preview.source}`);
  await convertPreview(sourcePath, outPath);
}

function publishFile(project, file) {
  const sourcePath = path.join(sourceArg, file.source);
  const outPath = path.join(OUT, file.out);
  if (!exists(sourcePath)) throw new Error(`${project.dir}: source missing: ${file.source}`);
  if (isLfsPointer(sourcePath)) throw new Error(`${project.dir}: source is an LFS pointer, run git lfs pull: ${file.source}`);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.copyFileSync(sourcePath, outPath);
}

function writeChecksums() {
  const root = path.join(OUT, 'files');
  const files = [];
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.isFile()) files.push(full);
    }
  };
  walk(root);
  files.sort();
  const entries = files.map((full) => {
    const bytes = fs.readFileSync(full);
    return {
      path: path.relative(OUT, full),
      bytes: bytes.length,
      sha256: createHash('sha256').update(bytes).digest('hex'),
    };
  });
  fs.writeFileSync(path.join(OUT, 'checksums.json'), `${JSON.stringify(entries, null, 2)}\n`);
  return entries.length;
}

const fileCount = manifest.projects.reduce((sum, project) => sum + project.files.length, 0);
for (const project of manifest.projects) {
  for (const preview of project.previews) await publishPreview(project, preview);
  for (const file of project.files) publishFile(project, file);
}

const cards = manifest.projects.map(renderCard).join('');
const html = template
  .replace('{{FILTERS}}', renderFilters(manifest.categories, manifest.projects))
  .replace('{{CARDS}}', cards)
  .replace('{{COUNT}}', `${manifest.projects.length} 个项目 · ${fileCount} 个文件`);
fs.writeFileSync(path.join(OUT, 'index.html'), html);

const checksumCount = writeChecksums();
console.log(`projects ${manifest.projects.length}, files ${fileCount}, checksums ${checksumCount}, source ${sourceArg}`);
