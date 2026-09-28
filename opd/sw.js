const CACHE='vac-opd-shell-v11';
const SHELL=['./','./index.html','./style.css','./app.js','./auth.mjs','./login.mjs','./registration.mjs','./patient-model.mjs','./manifest.webmanifest','./icon-192.png','./icon-512.png','../images/logo-restored-20260926.webp','../images/header-restored-20260926.webp','../images/doctor-restored-20260926.webp'];
SHELL.push('./clinical.mjs','./prescription.mjs','./panchakarma.mjs','./followup.mjs','./reports.mjs','./documents.mjs','./review.mjs');
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL))));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('vac-opd-shell-')&&k!==CACHE).map(k=>caches.delete(k))))));
self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;const url=new URL(e.request.url);if(!SHELL.some(p=>new URL(p,self.location.href).href===url.href))return;e.respondWith(fetch(e.request).catch(()=>caches.match(e.request)))});
