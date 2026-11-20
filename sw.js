const CACHE_NAME = 'workout-builder-v64';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './style.css',
  './config.js',
  './settings.js',
  './notifications.js',
  './auth.js',
  './trainer.js',
  './anamnesis.js',
  './analytics.js',
  './builder.js',
  './athlete.js',
  './checkins.js',
  './manifest.json',
  './logo_W.jpeg'
];

// Installazione: salva i file principali in cache e attiva subito il nuovo SW
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
  );
  self.skipWaiting();
});

// Attivazione: elimina tutte le vecchie cache e prende il controllo immediato
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Strategia Network-First per HTML/JS/CSS così ogni deploy su Vercel arriva subito senza cache vecchia
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  if (url.origin !== location.origin) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const cloned = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, cloned));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
