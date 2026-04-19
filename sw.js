'use strict';

// Service Worker with skipWaiting() and clients.claim() for proper updates
const CACHE_NAME = 'minesweeper-v1';  // Version this for updates

const STATIC_ASSETS = [
  './',
  'index.html',
  'app.js',
  'favicon.svg',
  'manifest.json',
  'core/constants.js',
  'core/events.js',
  'core/cell.js',
  'core/board.js',
  'core/game.js',
  'platform/platform.js',
  'platform/IRenderer.js',
  'platform/IInput.js',
  'platform/IAudio.js',
  'platforms/web-dom/renderer.js',
  'platforms/web-dom/input.js',
  'platforms/web-dom/audio.js',
  'platforms/web-dom/styles.css'
];

// Install event - cache assets and activate immediately
self.addEventListener('install', (event) => {
  console.log('[SW] Installing...');

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('[SW] Skip waiting');
        return self.skipWaiting();  // Force activate immediately
      })
  );
});

// Activate event - clean old caches and take control
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');

  event.waitUntil(
    caches.keys()
      .then((names) => {
        console.log('[SW] Cleaning old caches');
        return Promise.all(
          names
            .filter(name => name.startsWith('minesweeper-') && name !== CACHE_NAME)
            .map(name => {
              console.log(`[SW] Deleting cache: ${name}`);
              return caches.delete(name);
            })
        );
      })
      .then(() => {
        console.log('[SW] Claiming clients');
        return self.clients.claim();  // Take control immediately
      })
  );
});

// Fetch event - cache-first strategy
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(event.request)
      .then((cached) => {
        if (cached) {
          console.log(`[SW] Cache hit: ${url.pathname}`);
          return cached;
        }

        console.log(`[SW] Cache miss: ${url.pathname}`);
        return fetch(event.request);
      })
      .catch((error) => {
        console.error('[SW] Fetch failed:', error);
        throw error;
      })
  );
});

// Message event - allow manual skip waiting
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[SW] Manual skip waiting');
    self.skipWaiting();
  }
});

console.log('[SW] Service Worker loaded');
