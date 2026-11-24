// Offline support: the pages and their artwork are kept on the device so the
// book opens without a connection. Pages are fetched fresh when online and fall
// back to the saved copy offline; images are served from the saved copy first.
const VERSION = 'bj-v36';
const PAGES = ['/', '/about/', '/otters/', '/pip/', '/russell/', '/contact/', '/404.html'];
const CORE = [...PAGES, '/styles.css', '/fonts.css', '/assets/fonts/eb-garamond-normal-latin.woff2', '/assets/fonts/eb-garamond-italic-latin.woff2', '/website-overrides.css', '/accessibility.css', '/site.js', '/update.js', '/page-turn.js', '/accessibility.js', '/manifest.webmanifest',
  '/assets/art/cover-640.webp', '/assets/backdrops/sea.jpg', '/assets/icons/icon-192.png', '/assets/icons/brand-96.webp'];

// The rest of the book's pictures (phone sizes, which every screen can fall
// back to), saved in the background so every chapter opens offline once the
// app has been visited, not only the chapters already read.
const ART = ['otter-ball', 'otter-waving', 'otters-in-love', 'otters-drifting', 'otters-stone', 'otters-wedding', 'otters-floating', 'otter-asleep', 'otter-snack', 'otters-scene', 'pip-scene', 'pip-adhd-cover', 'pip-deforestation-cover', 'russell-cover', 'russell-back-cover', 'russell-exhibition']
  .map((name) => `/assets/art/${name}-640.webp`)
  .concat(['/assets/art/cat.webp', '/assets/4e4cc5_b89f6ea50577454bb355c0a60e1accde~mv2.jpeg',
    '/assets/backdrops/sea-800.jpg', '/assets/backdrops/meadow-800.jpg', '/assets/backdrops/river-800.jpg', '/assets/backdrops/forest-800.jpg',
    '/assets/backdrops/meadow.jpg', '/assets/backdrops/river.jpg', '/assets/backdrops/forest.jpg',
    '/assets/characters/otter-peek-400.webp', '/assets/characters/otters-floating-360.webp', '/assets/characters/pip.webp', '/assets/video/russell-flip-through-poster.webp']);

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(VERSION)
    .then((cache) => cache.addAll(CORE.map((url) => new Request(url, { cache: 'reload' }))))
    .then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  // Not awaited: a missing picture must never stop the app from updating.
  caches.open(VERSION).then((cache) => Promise.all(ART.map((url) =>
    cache.match(url).then((hit) => hit || fetch(url).then((response) => response.ok && cache.put(url, response)).catch(() => {})))));
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
  // The version check must always ask the server, never a saved copy.
  if (sameSite && url.pathname === '/version.json') return;
  // Video streams in pieces (range requests); let the browser fetch it directly.
  if (request.destination === 'video' || request.destination === 'audio' || request.headers.has('range')) return;

  const save = (response) => {
    if (response && (response.ok || response.type === 'opaque')) {
      const copy = response.clone();
      caches.open(VERSION).then((cache) => cache.put(request, copy));
    }
    return response;
  };

  if (request.mode === 'navigate' || request.destination === 'style' || request.destination === 'script') {
    // Network first, so updates appear straight away; saved copy when offline.
    // Skip the browser's 10-minute HTTP cache so updates arrive immediately.
    event.respondWith(fetch(request, { cache: 'no-cache' }).then(save).catch(() =>
      caches.match(request).then((hit) => hit || caches.match(request, { ignoreSearch: true }))
        .then((hit) => hit || caches.match('/404.html'))));
    return;
  }
  // Images and fonts: saved copy first, refreshed in the background.
  event.respondWith(caches.match(request, { ignoreSearch: false }).then((hit) => {
    const refresh = fetch(request).then(save).catch(() => hit);
    return hit || refresh;
  }));
});
