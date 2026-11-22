const cacheName = "nvtsk-silver-05-release-5";
const shell = ["./","index.html","app.js?v=5","model.js","style.css?v=5",...["hero","logo","roof","store","tile0","tile1","tile2","tile3","module","clamp","vertical","rail","van","car","trailer"].map(n=>"art/"+n+".webp")];
self.addEventListener("install",event=>event.waitUntil(caches.open(cacheName).then(c=>c.addAll(shell)).then(()=>self.skipWaiting())));
self.addEventListener("activate",event=>event.waitUntil((async()=>{
 for(const key of await caches.keys())if(key.startsWith("nvtsk-silver-05-")&&key!==cacheName)await caches.delete(key);
 await self.clients.claim();
})()));
self.addEventListener("fetch",event=>{
 if(event.request.method!=="GET"||!event.request.url.startsWith(self.registration.scope))return;
 if(event.request.mode==="navigate"&&!["", "index.html"].includes(event.request.url.split("?")[0].slice(self.registration.scope.length)))return;
 event.respondWith((async()=>{
 const cache=await caches.open(cacheName);
 return await cache.match(event.request.mode==="navigate"?new URL("index.html",self.registration.scope):event.request)||fetch(event.request);
 })());
});
