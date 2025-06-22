
// Service Worker para PWA (Progressive Web App)
const CACHE_NAME = 'print-app-v2'; // Incrementar versión para forzar actualización
const urlsToCache = [
  '/',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

// Función para verificar si una URL debe ser cacheada
function shouldCache(request) {
  const url = new URL(request.url);

  // Solo cachear requests GET
  if (request.method !== 'GET') {
    return false;
  }

  // No cachear extensiones de Chrome
  if (url.protocol === 'chrome-extension:') {
    return false;
  }

  // No cachear WebSocket connections
  if (url.protocol === 'ws:' || url.protocol === 'wss:') {
    return false;
  }

  // No cachear requests a localhost con puertos específicos (QZ Tray)
  if (url.hostname === 'localhost' && (
    url.port === '8182' || 
    url.port === '8181' || 
    url.port === '8283' || 
    url.port === '8282'
  )) {
    return false;
  }

  // No cachear archivos HTML principales para evitar páginas en blanco
  if (url.pathname === '/' || url.pathname.endsWith('.html')) {
    return false;
  }

  // Solo cachear recursos estáticos (CSS, JS, imágenes)
  const staticFileRegex = /\.(css|js|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$/;
  return staticFileRegex.test(url.pathname);
}

self.addEventListener('install', function(event) {
  // Forzar la activación inmediata del nuevo service worker
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('activate', function(event) {
  // Tomar control inmediatamente
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      caches.keys().then(function(cacheNames) {
        return Promise.all(
          cacheNames.map(function(cacheName) {
            if (cacheName !== CACHE_NAME) {
              console.log('Eliminando caché obsoleto:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
    ])
  );
});

self.addEventListener('fetch', (event) => {
  // Filtrar requests problemáticas
  const url = new URL(event.request.url);
  if (url.href.includes('chrome-extension') || 
      url.href.includes('chrome://') ||
      url.href.includes('ws://') ||
      url.href.includes('wss://') ||
      url.href.includes('hot-update')) { // No cachear hot-reload de Vite
    return;
  }

  // Estrategia Network First para HTML y API calls
  if (url.pathname === '/' || 
      url.pathname.endsWith('.html') || 
      url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Si la respuesta es exitosa, devolverla directamente
          if (response && response.status === 200) {
            return response;
          }
          // Si falla, intentar desde caché
          return caches.match(event.request);
        })
        .catch(() => {
          // Si todo falla, intentar desde caché
          return caches.match(event.request);
        })
    );
    return;
  }

  // Estrategia Cache First para recursos estáticos
  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        // Si está en caché, devolverlo
        if (response) {
          return response;
        }

        // Si no está en caché, descargarlo
        return fetch(event.request).then(function(response) {
          // Verificar si es una respuesta válida
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Solo cachear si debería ser cacheado
          if (shouldCache(event.request)) {
            try {
              const responseToCache = response.clone();
              caches.open(CACHE_NAME)
                .then(cache => {
                  cache.put(event.request, responseToCache);
                })
                .catch(err => {
                  console.debug('Cache put failed:', err);
                });
            } catch (cacheError) {
              console.debug('Cache operation failed:', cacheError);
            }
          }

          return response;
        });
      })
      .catch(function(error) {
        console.warn('Fetch failed:', error);
        throw error;
      })
  );
});
