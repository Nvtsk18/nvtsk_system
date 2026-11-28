const CACHE="nvtsk-05-command-119";
const CORE=[
 "./","./index.html","./model.js?v=97","./pv-project-card-v62.js?v=74","./training-maps.js?v=119","./app.js?v=119",
 "./pv-cases.html","./pv-cases/viewer.js?v=1","./pv-cases/viewer.css?v=1",
 "./case-estimate.js?v=115","./grid.css?v=119","./art/grid-weave.webp",
 "./grid-demo.html","./art/grid-demo-cover.webp",
 "./workspace-layout.css?v=113","./silver-dna.css?v=113","./art/command-office.webp","./art/bodensee-west.svg","./art/osnabrueck-city.webp","./art/bodensee-pv.webp",
 "./art/fonts/inter-latin-wght-normal.woff2","./art/fonts/inter-cyrillic-wght-normal.woff2",
 "./art/nvtsk-approved.webp","./art/roof.webp","./art/store.webp","./art/hero.webp","./art/logo.webp",
 "./art/tile0.webp","./art/tile1.webp","./art/tile2.webp","./art/tile3.webp","./art/van.webp","./art/car.webp","./art/trailer.webp",
 "./art/rail.webp","./art/vertical.webp","./art/clamp.webp","./art/module.webp","./art/solan-medallion-v85.svg",
 "./art/silver-command-office.svg","./art/future-office.svg"
];
self.addEventListener("install",event=>{event.waitUntil((async()=>{const cache=await caches.open(CACHE);try{await Promise.all(CORE.map(async path=>{const req=new Request(path,{cache:"reload"});const res=await fetch(req);if(!res.ok)throw new Error("Offline core unavailable: "+path+" HTTP "+res.status);await cache.put(req,res)}));await self.skipWaiting()}catch(error){await caches.delete(CACHE);throw error}})())});
self.addEventListener("activate",event=>{event.waitUntil((async()=>{for(const key of await caches.keys())if(key!==CACHE&&key.startsWith("nvtsk-"))await caches.delete(key);await self.clients.claim()})())});
self.addEventListener("fetch",event=>{
 const req=event.request;
 if(req.method!=="GET"||!req.url.startsWith(self.registration.scope))return;
 // Let the media player negotiate byte ranges. The optional film is loaded only on demand.
 if(new URL(req.url).pathname===new URL("art/grid-demo.mp4",self.registration.scope).pathname)return;
 event.respondWith((async()=>{
 const cache=await caches.open(CACHE);
 const url=new URL(req.url);
 const base=new URL(self.registration.scope);
 const isAppShell=req.mode==="navigate" && (url.pathname===base.pathname || url.pathname===new URL("index.html",base).pathname);
 const target=isAppShell?new Request(new URL("index.html",base),{cache:"no-store"}):req;
 try{
  const response=await fetch(target,{cache:"no-store"});
  if(response.ok){await cache.put(target,response.clone());return response}
  throw new Error("HTTP "+response.status);
 }catch(error){
  const cached=await cache.match(target,{ignoreSearch:true});
  if(cached)return cached;
  if(isAppShell){const shell=await cache.match(new URL("index.html",self.registration.scope));if(shell)return shell}
  return Response.error();
 }
 })());
});
