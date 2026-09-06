/* Engineroom Log - offline service worker
   ---------------------------------------------------------------
   This app already keeps its own data offline (everything is written to a
   local shared log file via the File System Access API, or to localStorage
   as a fallback) - what this worker adds is the ability to *open the app
   itself* with no network at all, and to have it install as a standalone
   app instead of always opening inside a browser tab.

   Strategy: stale-while-revalidate for the handful of static files that
   make up the app shell (the HTML file itself, the manifest, the icons).
   Every request is answered from the cache immediately if present (so it
   works offline and feels instant), while a fresh copy is fetched in the
   background and stored for next time. Bump CACHE_NAME whenever the app
   files change so old entries get cleared out on the next load. */

const CACHE_NAME = 'engineroomlog-shell-v1';
const SHELL_FILES = [
  './',
  './engineroom-log_117_1.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-192.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png',
  './icons/favicon-32.png',
  './icons/favicon-16.png'
];

self.addEventListener('install', function(event){
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache){
      return cache.addAll(SHELL_FILES).catch(function(){
        // If a path doesn't resolve (e.g. the app was renamed/moved), don't
        // fail the whole install - whatever does resolve still gets cached.
        return Promise.all(SHELL_FILES.map(function(f){
          return cache.add(f).catch(function(){});
        }));
      });
    }).then(function(){ return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function(event){
  event.waitUntil(
    caches.keys().then(function(names){
      return Promise.all(names.filter(function(n){ return n !== CACHE_NAME; }).map(function(n){ return caches.delete(n); }));
    }).then(function(){ return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function(event){
  var req = event.request;
  // Only handle simple same-origin GETs - anything else (POST, cross-origin
  // AIS/weather/map calls, etc.) goes straight to the network untouched.
  if(req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;

  event.respondWith(
    caches.open(CACHE_NAME).then(function(cache){
      return cache.match(req).then(function(cached){
        var networkFetch = fetch(req).then(function(res){
          if(res && res.status === 200) cache.put(req, res.clone());
          return res;
        }).catch(function(){ return cached; });
        return cached || networkFetch;
      });
    })
  );
});
