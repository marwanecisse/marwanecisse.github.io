/* Orbit — service worker : hors ligne + notifications
 * Page : réseau d'abord (3 s max) pour avoir la dernière version, sinon cache.
 * Polices Google : cache après le premier chargement. API (GitHub, IA) : jamais en cache. */
const VERSION='20261121194035';const CACHE='orbit-'+VERSION;
const FILES=['./','./index.html','./manifest.webmanifest','./icon-192.png','./icon-512.png','./icon-maskable-512.png','./apple-touch-icon.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k.startsWith('orbit-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
const timeout=ms=>new Promise((_,rej)=>setTimeout(()=>rej(new Error('timeout')),ms));
self.addEventListener('fetch',e=>{const req=e.request;if(req.method!=='GET')return;const u=new URL(req.url);
 if(u.origin===self.location.origin){
  if(req.mode==='navigate'){e.respondWith((async()=>{const c=await caches.open(CACHE);try{const r=await Promise.race([fetch(req,{cache:'no-cache'}),timeout(3000)]);if(r&&r.ok){c.put('./index.html',r.clone());return r}throw new Error('bad')}catch(err){return(await c.match('./index.html'))||(await c.match('./'))||Response.error()}})());return}
  if(/\/data\.json$/.test(u.pathname))return;
  e.respondWith(caches.match(req).then(hit=>hit||fetch(req)));return}
 if(u.hostname==='fonts.googleapis.com'||u.hostname==='fonts.gstatic.com'){e.respondWith(caches.open('orbit-fonts').then(async c=>{const hit=await c.match(req);if(hit)return hit;const r=await fetch(req);if(r&&(r.ok||r.type==='opaque'))c.put(req,r.clone());return r}));}
});
self.addEventListener('notificationclick',e=>{e.notification.close();const id=e.notification.data&&e.notification.data.id;
 e.waitUntil(self.clients.matchAll({type:'window',includeUncontrolled:true}).then(cs=>{const c=cs.find(x=>x.url.includes('/orbit/'))||cs[0];if(c){c.focus();if(id)c.postMessage({type:'ib-open',id});return}return self.clients.openWindow('./')}))});
