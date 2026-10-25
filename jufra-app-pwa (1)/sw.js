/* Service worker: lets the app open with no internet. Online it always fetches the newest copy
   (waiting at most 3 seconds, then falls back to the saved copy). Calls to Firebase are never touched. */
const CACHE = 'jufra-app-v1';
const SHELL = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png', './icon-180.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request, u = new URL(req.url);
  if (req.method !== 'GET' || u.origin !== location.origin) return;
  e.respondWith(caches.open(CACHE).then(async c => {
    const hit = await c.match(req, {ignoreSearch: true});
    const net = fetch(req).then(r => { if (r && r.ok) c.put(req, r.clone()); return r; });
    if (!hit) return net;
    const wait = new Promise(res => setTimeout(() => res(hit), 3000));
    return Promise.race([net.catch(() => hit), wait]);
  }));
});
