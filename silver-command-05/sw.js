const CACHE="nvtsk-05-recovery-10";
const CORE=["./","./index.html","./model.js","./app.js?v=10","./style.css?v=10"];
self.addEventListener("install",event=>{event.waitUntil((async()=>{const cache=await caches.open(CACHE);await Promise.allSettled(CORE.map(async path=>{const req=new Request(path,{cache:"reload"});const res=await fetch(req);if(res.ok)await cache.put(req,res)}));await self.skipWaiting()})())});
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
