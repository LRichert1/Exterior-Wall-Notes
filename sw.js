/* Exterior Wall Notes — offline service worker.
 * Network-first for the page (so you always get the latest when online, and a
 * cached copy when you're out at a barn with no signal); cache-first for the
 * icon and other static assets. Bump CACHE to force a refresh. */
const CACHE = "wallnotes-v1";

self.addEventListener("install", e => self.skipWaiting());
self.addEventListener("activate", e => e.waitUntil(self.clients.claim()));

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const isPage = req.mode === "navigate" || req.destination === "document";
  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    if (isPage) {
      try {
        const fresh = await fetch(req);
        if (fresh && fresh.status === 200) cache.put(req, fresh.clone());
        return fresh;
      } catch (_) {
        return (await cache.match(req)) || (await cache.match("./")) || Response.error();
      }
    }
    const cached = await cache.match(req);
    const fetching = fetch(req).then(res => {
      if (res && res.status === 200 && res.type === "basic") cache.put(req, res.clone());
      return res;
    }).catch(() => null);
    return cached || (await fetching) || Response.error();
  })());
});
