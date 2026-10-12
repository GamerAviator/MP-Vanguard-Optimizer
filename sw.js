const CACHE='vanguard-shell-v39';
const ASSETS=['./','./index.html','./vanguard-emblem.svg','./style.css','./app.js','./install.js','./help.js','./USER-GUIDE.txt','./data.js','./engine.js','./spoils.js','./might-display.js','./boost-value.js','./worker.js','./storage.js','./history.js','./history-chart.js','./resource-history.js','./resource-model.js','./portrait-match.js','./import.js','./extraction-import.js','./grid-import.js','./auto-grid.js','./resource-import.js','./manifest.json','./vanguard-icon-192.png','./vanguard-icon-512.png','./vanguard-apple-touch.png','./vanguard-favicon.png','./vanguard-maskable.png','./portraits/grothmar.webp',...Array.from({length:49},(_,i)=>'./portraits/'+String(i+1).padStart(2,'0')+'.webp')];
// Bypass the HTTP cache when installing a release, so an old engine cannot be
// copied into a newly named offline cache during GitHub Pages' cache lifetime.
self.addEventListener('install',e=>{
 e.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS.map(url=>new Request(url,{cache:'reload'})))).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',e=>{
 e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('vanguard-shell-')&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',e=>{
 if(e.request.method!=='GET'||new URL(e.request.url).origin!==self.location.origin)return;
 e.respondWith(caches.open(CACHE).then(cache=>cache.match(e.request)).then(cached=>cached||fetch(e.request)));
});
