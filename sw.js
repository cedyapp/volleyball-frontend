// ===============================
// CONFIG
// ===============================
const DEV_MODE = true; // 🔥 Passe à true en développement

const CACHE_VERSION = "v1.0.4";
const CACHE_NAME = `volley-app-${CACHE_VERSION}`;

const ASSETS_TO_CACHE = [
    "/",
    "/index.html",
    "/style.css",
    "/app.js"
];

// ===============================
// INSTALL (pré-cache)
// ===============================
self.addEventListener("install", event => {
    console.log("[SW] Installing...");

    self.skipWaiting(); // 🔥 force l'activation immédiate

    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
});

// ===============================
// ACTIVATE (clean old cache)
// ===============================
self.addEventListener("activate", event => {
    console.log("[SW] Activating...");

    event.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(
                keys.map(key => {
                    if (key !== CACHE_NAME) {
                        console.log("[SW] Deleting old cache:", key);
                        return caches.delete(key);
                    }
                })
            );
        })
    );

    self.clients.claim(); // 🔥 prend le contrôle immédiatement
});

// ===============================
// FETCH STRATEGY
// ===============================
self.addEventListener("fetch", event => {

    // 🔥 MODE DEV → aucun cache
    if (DEV_MODE) {
        event.respondWith(fetch(event.request));
        return;
    }

    // 🔥 HTML → toujours network first (évite bug update)
    if (event.request.mode === "navigate") {
        event.respondWith(
            fetch(event.request)
                .then(response => {
                    return caches.open(CACHE_NAME).then(cache => {
                        cache.put(event.request, response.clone());
                        return response;
                    });
                })
                .catch(() => caches.match(event.request))
        );
        return;
    }

    // 🔥 JS / CSS → stale while revalidate
    if (
        event.request.url.endsWith(".js") ||
        event.request.url.endsWith(".css")
    ) {
        event.respondWith(
            caches.match(event.request).then(cached => {
                const fetchPromise = fetch(event.request).then(networkResponse => {
                    caches.open(CACHE_NAME).then(cache => {
                        cache.put(event.request, networkResponse.clone());
                    });
                    return networkResponse;
                });

                return cached || fetchPromise;
            })
        );
        return;
    }

    // 🔥 Images / autres → cache first
    event.respondWith(
        caches.match(event.request).then(response => {
            return response || fetch(event.request);
        })
    );
});