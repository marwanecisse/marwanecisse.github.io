/* Campus · Mon programme — service worker (fonctionnement hors ligne)
 * Page : réseau d'abord (3 s max) pour récupérer la dernière version du planning,
 *        sinon version en cache → l'application s'ouvre même sans connexion.
 * Icônes / manifeste : cache d'abord. */
const VERSION = '20261115003253';
const CACHE = 'campus-' + VERSION;
const FILES = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './apple-touch-icon.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k.startsWith('campus-') && k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
function timeout(ms) { return new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), ms)); }
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  if (req.mode === 'navigate') {
    e.respondWith((async () => {
      const cache = await caches.open(CACHE);
      try {
        const res = await Promise.race([fetch(req, { cache: 'no-cache' }), timeout(3000)]);
        if (res && res.ok) { cache.put('./index.html', res.clone()); return res; }
        throw new Error('bad');
      } catch (err) {
        return (await cache.match('./index.html')) || (await cache.match('./')) || Response.error();
      }
    })());
    return;
  }
  e.respondWith(caches.match(req).then((hit) => hit || fetch(req)));
});
