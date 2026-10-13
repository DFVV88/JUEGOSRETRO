/* JUEGOS RETRO — cross-origin isolation for BoxedWine AudioWorklet */
self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", event => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", event => {
  const request = event.request;

  // Chrome can issue this special request for media/cache; do not intercept it.
  if (request.cache === "only-if-cached" && request.mode !== "same-origin") {
    return;
  }

  event.respondWith((async () => {
    const response = await fetch(request);

    // Opaque cross-origin responses cannot have their headers rewritten.
    if (!response || response.type === "opaque") {
      return response;
    }

    const headers = new Headers(response.headers);
    headers.set("Cross-Origin-Opener-Policy", "same-origin");
    // credentialless keeps third-party font/assets usable in modern Chrome
    // while enabling crossOriginIsolated/SharedArrayBuffer.
    headers.set("Cross-Origin-Embedder-Policy", "credentialless");

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers
    });
  })());
});
