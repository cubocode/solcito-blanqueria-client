// Service worker básico para soporte de instalación PWA sin interferir con las rutas o assets
const CACHE_NAME = 'cubo-gestion-v1';

self.addEventListener('install', event => {
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', event => {
  // Passthrough simple para cumplir con los requisitos PWA sin cachear ni romper peticiones o rutas
  event.respondWith(
    fetch(event.request).catch(err => {
      // Retorna una respuesta fallida estándar de red si el servidor está inaccesible
      console.warn('Service worker fetch failed for: ', event.request.url, err);
      return fetch(event.request);
    })
  );
});
