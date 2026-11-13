const CACHE_NAME = "workout-builder-v5";
const ASSETS_TO_CACHE = [
  "./",
  "./index.html",
  "./style.css",
  "./config.js",
  "./settings.js",
  "./notifications.js",
  "./auth.js",
  "./trainer.js",
  "./analytics.js",
  "./builder.js",
  "./athlete.js",
  "./logo_W.jpeg",
  "./manifest.json"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  // Le richieste API (Supabase / CDN esterne) vanno sempre in rete
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // Network-first con fallback su cache per i file locali (così gli aggiornamenti su GitHub arrivano subito)
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
