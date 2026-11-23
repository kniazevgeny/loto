const CACHE_PREFIX = "loto-art-offline-";
const CACHE_NAME = "loto-art-offline-v2";

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter((name) => name.startsWith(CACHE_PREFIX) && name !== CACHE_NAME).map((name) => caches.delete(name)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin) return;

  event.respondWith((async () => {
    const appRoot = new URL("./", self.registration.scope);
    const navigation = request.mode === "navigate";
    if (navigation || url.href === new URL("library/library.json", appRoot).href) {
      let response;
      try {
        response = await fetch(request, { cache: "no-cache" });
      } catch (error) {
        const fallback = (await caches.match(request)) ?? (navigation ? await caches.match(appRoot.href) : undefined);
        if (fallback) return fallback;
        throw error;
      }
      if (response.ok) {
        try {
          const cache = await caches.open(CACHE_NAME);
          await cache.put(request, response.clone());
        } catch {
          // Storage failure must not block a successful online navigation.
        }
      }
      return response;
    }

    const cached = await caches.match(request);
    if (cached) return cached;

    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      await cache.put(request, response.clone());
    }
    return response;
  })());
});
