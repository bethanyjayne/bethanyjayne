// Offline support: the pages and their artwork are kept on the device so the
// book opens without a connection. Pages are fetched fresh when online and fall
// back to the saved copy offline; images are served from the saved copy first.
const VERSION = 'bj-v1';
const PAGES = ['./', './index.html', './about.html', './otters.html', './pip.html', './russel.html', './contact.html', './404.html'];
const CORE = [...PAGES, './styles.css', './website-overrides.css', './site.js', './page-turn.js', './manifest.webmanifest',
  './assets/art/cover-640.webp', './assets/backdrops/sea.jpg', './assets/icons/icon-192.png', './assets/favicon.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(VERSION).then((cache) => cache.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys()
    .then((keys) => Promise.all(keys.filter((key) => key !== VERSION).map((key) => caches.delete(key))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  const sameSite = url.origin === self.location.origin;
  const fonts = url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';
  if (!sameSite && !fonts) return;

  const save = (response) => {
    if (response && (response.ok || response.type === 'opaque')) {
      const copy = response.clone();
      caches.open(VERSION).then((cache) => cache.put(request, copy));
    }
    return response;
  };

  if (request.mode === 'navigate' || request.destination === 'style' || request.destination === 'script') {
    // Network first, so updates appear straight away; saved copy when offline.
    event.respondWith(fetch(request).then(save).catch(() =>
      caches.match(request).then((hit) => hit || caches.match('./404.html'))));
    return;
  }
  // Images and fonts: saved copy first, refreshed in the background.
  event.respondWith(caches.match(request).then((hit) => {
    const refresh = fetch(request).then(save).catch(() => hit);
    return hit || refresh;
  }));
});
