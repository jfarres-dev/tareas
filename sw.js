const CACHE_NAME = 'habitos-v__DEPLOY_TIME__';

// Solo assets propios del app shell — nunca APIs ni CDNs externas
const SHELL_ASSETS = [
  '/tareas/',
  '/tareas/index.html',
  '/tareas/style.css',
  '/tareas/assets/icons.js',
  '/tareas/assets/icon.svg',
  '/tareas/assets/qrcodegen.js',
  '/tareas/js/supabase.js',
  '/tareas/js/auth.js',
  '/tareas/js/habits.js',
  '/tareas/js/logs.js',
  '/tareas/js/family.js',
  '/tareas/js/tasks.js',
  '/tareas/js/shopping.js',
  '/tareas/js/ui.js',
  '/tareas/js/app.js',
];

// Dominios que NUNCA se cachean (API, auth, CDN externos)
const BLOCKED_CACHE_ORIGINS = [
  'supabase.co',
  'supabase.io',
  'googleapis.com',
  'gstatic.com',
  'jsdelivr.net',
];

function isBlockedOrigin(url) {
  return BLOCKED_CACHE_ORIGINS.some(origin => url.hostname.endsWith(origin));
}

function isOwnAsset(url) {
  return url.origin === self.location.origin &&
         url.pathname.startsWith('/tareas/');
}

// Al instalar: pre-cachea el app shell
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(SHELL_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Al activar: elimina cachés de versiones anteriores
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

// Fetch: cache-first solo para assets propios
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Nunca interceptar: APIs externas, auth, CDNs
  if (isBlockedOrigin(url)) return;

  // Nunca interceptar: requests que no son GET (POST a Supabase, etc.)
  if (event.request.method !== 'GET') return;

  // Nunca interceptar: fuera del scope de la app
  if (!isOwnAsset(url)) return;

  // Cache-first para assets propios
  event.respondWith(
    caches.match(event.request)
      .then(cached => {
        if (cached) return cached;

        return fetch(event.request)
          .then(response => {
            // Solo cachear respuestas válidas
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            const toCache = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, toCache));
            return response;
          });
      })
  );
});
