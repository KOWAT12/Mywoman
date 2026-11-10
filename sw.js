// Offline support. The app shell is cached on install; after that every
// request is answered from the cache straight away and refreshed in the
// background, so the gym's wifi never matters and updates arrive on the next
// launch. Bump VERSION when shipping changes to force a clean cache.

const VERSION = 'clave-v1';

const SHELL = [
  './',
  'index.html',
  'manifest.webmanifest',
  'css/styles.css',
  'js/app.js',
  'js/dom.js',
  'js/store.js',
  'js/data/exercises.js',
  'js/data/program.js',
  'js/logic/library.js',
  'js/logic/recommend.js',
  'js/logic/stats.js',
  'js/ui/charts.js',
  'js/ui/pickers.js',
  'js/ui/timer.js',
  'js/views/history.js',
  'js/views/library.js',
  'js/views/onboarding.js',
  'js/views/program.js',
  'js/views/progress.js',
  'js/views/settings.js',
  'js/views/today.js',
  'js/views/workout.js',
  'icons/icon.svg',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/apple-touch-icon.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(VERSION)
      .then((cache) => cache.addAll(SHELL))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;

  event.respondWith(
    caches.open(VERSION).then(async (cache) => {
      const cached = await cache.match(request, { ignoreSearch: true });
      const refresh = fetch(request)
        .then((response) => {
          if (response.ok) cache.put(request, response.clone());
          return response;
        })
        .catch(() => cached);
      return cached || refresh;
    }),
  );
});
