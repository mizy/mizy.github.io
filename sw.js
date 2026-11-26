'use strict';

// Cache version. Bump this string whenever shell files or the offline page change.
const CACHE_VERSION = 'v3';
const SHELL_CACHE = `mizy-shell-${CACHE_VERSION}`;
const RUNTIME_CACHE = `mizy-runtime-${CACHE_VERSION}`;

// Pages and code needed to open the site offline. Downloads are excluded on purpose.
const SHELL_URLS = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.json',
  '/assets/home.css',
  '/assets/home.js',
  '/assets/projects.js',
  '/assets/pwa.js',
  '/assets/icons/icon-192.png',
  '/assets/icons/icon-512.png',
  '/assets/thumbnails/mz-3d-print.webp'
];

const DOWNLOAD_EXTENSIONS = ['.3mf', '.stl', '.step', '.stp'];

self.addEventListener('install', (event) => {
  event.waitUntil(precache());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(deleteStaleCaches());
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (isDownload(url.pathname)) return;

  if (request.mode === 'navigate') {
    event.respondWith(handleNavigation(request));
    return;
  }

  if (isShellAsset(url.pathname)) {
    event.respondWith(staleWhileRevalidate(request, RUNTIME_CACHE));
  }
});

async function precache() {
  const cache = await caches.open(SHELL_CACHE);
  await cache.addAll(SHELL_URLS);
  await self.skipWaiting();
}

async function deleteStaleCaches() {
  const keep = new Set([SHELL_CACHE, RUNTIME_CACHE]);
  const names = await caches.keys();
  await Promise.all(names.filter((name) => !keep.has(name)).map((name) => caches.delete(name)));
  await self.clients.claim();
}

async function handleNavigation(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  try {
    const response = await fetch(request);
    if (response.ok) await cache.put(request, response.clone());
    return response;
  } catch (error) {
    const cached = (await caches.match(request)) || (await caches.match(urlPathname(request)));
    if (cached) return cached;
    const offline = await caches.match('/offline.html');
    if (offline) return offline;
    return new Response('离线，且没有可用的缓存页面。', {
      status: 503,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' }
    });
  }
}

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) {
    const cache = await caches.open(cacheName);
    await cache.put(request, response.clone());
  }
  return response;
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const network = fetch(request)
    .then(async (response) => {
      if (response.ok) await cache.put(request, response.clone());
      return response;
    })
    .catch(() => null);
  return cached || (await network) || Response.error();
}

function urlPathname(request) {
  const path = new URL(request.url).pathname;
  return path.endsWith('/') ? `${path}index.html` : path;
}

function isDownload(pathname) {
  const lower = pathname.toLowerCase();
  return DOWNLOAD_EXTENSIONS.some((extension) => lower.endsWith(extension));
}

function isShellAsset(pathname) {
  if (pathname.startsWith('/assets/')) return true;
  return pathname === '/manifest.json';
}
