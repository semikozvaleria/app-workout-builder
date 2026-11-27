const CACHE_NAME = 'workout-builder-v92';
const IMAGE_CACHE_NAME = 'exercise-images-cache-v1';
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
  './logo_W.jpeg',
  './video-feedback.js',
  './icon.png',
  './privacy.html',
  './terms.html'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME && key !== IMAGE_CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Cache-First persistente (0 ms) per le immagini esercizi su Supabase Storage
  if (
    url.hostname.endsWith('supabase.co') &&
    url.pathname.includes('/storage/v1/object/public/exercise-images/')
  ) {
    event.respondWith(
      caches.open(IMAGE_CACHE_NAME).then((cache) =>
        cache.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          return fetch(event.request).then((networkResponse) => {
            if (networkResponse && networkResponse.ok) {
              cache.put(event.request, networkResponse.clone());
            }
            return networkResponse;
          });
        })
      )
    );
    return;
  }

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

// Ricezione Notifica Push dal server Supabase (anche ad app chiusa)
self.addEventListener('push', (event) => {
  let data = {
    title: 'Workout Builder',
    body: 'Hai un nuovo aggiornamento dal tuo coach.',
    url: './'
  };

  if (event.data) {
    try {
      data = { ...data, ...event.data.json() };
    } catch (_) {
      data.body = event.data.text();
    }
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: './logo_W.jpeg',
      badge: './logo_W.jpeg',
      data: { url: data.url || './' }
    })
  );
});

// Apertura app al tap sulla notifica
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || './';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
