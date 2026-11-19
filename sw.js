const CACHE_NAME = 'mininaturalista-ghpages-v1';
const PRECACHE_URLS = [
  './',
  './index.html',
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      Promise.allSettled(
        PRECACHE_URLS.map((url) =>
          fetch(url, url.startsWith('http') ? { mode: 'no-cors' } : {})
            .then((res) => cache.put(url, res))
            .catch(() => {})
        )
      )
    )
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((networkRes) => {
          const copy = networkRes.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put('./index.html', copy));
          return networkRes;
        })
        .catch(() => caches.match('./index.html').then((cached) => cached || caches.match('./')))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedRes) => {
      const fetchPromise = fetch(event.request)
        .then((networkRes) => {
          if (networkRes && (networkRes.status === 200 || networkRes.type === 'opaque')) {
            const copy = networkRes.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          }
          return networkRes;
        })
        .catch(() => cachedRes);
      return cachedRes || fetchPromise;
    })
  );
});