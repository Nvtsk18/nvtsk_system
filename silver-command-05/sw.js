const CACHE="nvtsk-05-command-54";
const CORE=["./","./index.html","./model.js?v=54","./app.js?v=54","./style.css?v=44","./theme-v42.css?v=44","./theme-v43.css?v=43","./theme-v44.css?v=44","./theme-v45.css?v=48","./theme-v49.css?v=49","./theme-v50.css?v=51","./theme-v52.css?v=53","./art/office-command-v40.png","./art/future-office.svg","./art/roof.webp","./art/logo.webp","./art/hero.webp","./art/store.webp","./art/tile0.webp","./art/tile1.webp","./art/tile2.webp","./art/tile3.webp","./art/rail.webp","./art/clamp.webp","./art/module.webp","./art/vertical.webp","./art/car.webp","./art/van.webp","./art/trailer.webp"];
self.addEventListener("install",event=>{event.waitUntil((async()=>{const cache=await caches.open(CACHE);try{await Promise.all(CORE.map(async path=>{const req=new Request(path,{cache:"reload"});const res=await fetch(req);if(!res.ok)throw new Error("Offline core unavailable: "+path+" HTTP "+res.status);await cache.put(req,res)}));await self.skipWaiting()}catch(error){await caches.delete(CACHE);throw error}})())});
self.addEventListener("activate",event=>{event.waitUntil((async()=>{for(const key of await caches.keys())if(key!==CACHE&&key.startsWith("nvtsk-"))await caches.delete(key);await self.clients.claim()})())});
self.addEventListener("fetch",event=>{
 const req=event.request;
 if(req.method!=="GET"||!req.url.startsWith(self.registration.scope))return;
 event.respondWith((async()=>{
 const cache=await caches.open(CACHE);
 const url=new URL(req.url);
 const target=req.mode==="navigate"?new Request(new URL("index.html",self.registration.scope),{cache:"no-store"}):req;
 try{
  const response=await fetch(target,{cache:"no-store"});
  if(response.ok){await cache.put(target,response.clone());return response}
  throw new Error("HTTP "+response.status);
 }catch(error){
  const cached=await cache.match(target,{ignoreSearch:true});
  if(cached)return cached;
  if(req.mode==="navigate"){const shell=await cache.match(new URL("index.html",self.registration.scope));if(shell)return shell}
  return Response.error();
 }
 })());
});
