const cacheName = "bbb-v5";
const contentToCache = [
  "/",
  "index.html",
  "index.js",
  "engine.js",
  "sw.js",
  "font.png",
  "guy.jpeg",
  "guy.png",
  "icon.png",
  "icon-192.png",
  "icon-512.png",
  "manifest.json",
  "spritesheet.png",
  "style.css",
  "sound/combo.wav",
  "sound/confirm.wav",
  "sound/enemy.wav",
  "sound/lose.wav",
  "sound/lose2.wav",
  "sound/select.wav",
  "sound/switch.wav",
  "sound/win.wav",
];

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("./sw.js");
}

self.addEventListener("install", (e) => {
  e.waitUntil(
    (async () => {
      const cache = await caches.open(cacheName);
      await cache.addAll(contentToCache);
    })()
  );
});

self.addEventListener("fetch", (e) => {
  e.respondWith(
    (async () => {
      const r = await caches.match(e.request);
      if (r) {
        return r;
      }
      const response = await fetch(e.request);
      const cache = await caches.open(cacheName);
      cache.put(e.request, response.clone());
      return response;
    })()
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keyList) => {
      Promise.all(
        keyList.map((key) => {
          if (key === cacheName) {
            return;
          }
          caches.delete(key);
        })
      );
    })()
  );
});
