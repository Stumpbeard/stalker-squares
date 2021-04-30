const cacheName = "bbb-v9";
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
  "sound/combo.mp3",
  "sound/confirm.mp3",
  "sound/enemy.mp3",
  "sound/lose.mp3",
  "sound/lose2.mp3",
  "sound/select.mp3",
  "sound/switch.mp3",
  "sound/win.mp3",
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
