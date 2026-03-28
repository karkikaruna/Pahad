// public/sw-custom.js
// Custom service worker additions — loaded by next-pwa

const CACHE_NAME = "pahad-v1";
const OFFLINE_FALLBACK = "/offline.html";

const PRECACHE_URLS = [
  "/",
  "/login",
  "/dashboard",
  "/form",
  "/manifest.json",
  OFFLINE_FALLBACK,
];

// Precache on install
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

// Clean old caches on activate
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Network-first with offline fallback
self.addEventListener("fetch", (event) => {
  // Skip non-GET and API/Supabase requests
  if (
    event.request.method !== "GET" ||
    event.request.url.includes("supabase.co") ||
    event.request.url.includes("generativelanguage.googleapis.com")
  ) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache successful responses
        if (response.ok) {
          const cloned = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, cloned);
          });
        }
        return response;
      })
      .catch(() => {
        return caches.match(event.request).then((cached) => {
          if (cached) return cached;
          // Return offline page for navigation requests
          if (event.request.mode === "navigate") {
            return caches.match(OFFLINE_FALLBACK);
          }
          return new Response("Offline", { status: 503 });
        });
      })
  );
});

// Push notification handler
self.addEventListener("push", (event) => {
  if (!event.data) return;

  const data = event.data.json();
  event.waitUntil(
    self.registration.showNotification(data.title || "पहाड अपडेट", {
      body: data.body,
      icon: "/icons/icon-192x192.png",
      badge: "/icons/icon-72x72.png",
      requireInteraction: data.requireInteraction ?? false,
      tag: data.tag ?? "pahad-notification",
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: "window" }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === "/" && "focus" in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow("/dashboard");
      }
    })
  );
});
