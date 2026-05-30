/* ============================================================
   sw.js — AcaiOS Service Worker
   Enables PWA install + basic offline shell caching
============================================================ */

const CACHE_NAME = 'acaios-v1';
const SHELL = [
  './',
  './index.html',
  './css/main.css',
  './js/app.js',
  './js/elevenlabs.js',
  './js/twilio.js',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(SHELL))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  // Network-first for API calls, cache-first for shell assets
  if (e.request.url.includes('/api/')) {
    e.respondWith(fetch(e.request).catch(() => new Response('Offline', { status: 503 })));
  } else {
    e.respondWith(
      caches.match(e.request).then(cached => cached || fetch(e.request))
    );
  }
});
