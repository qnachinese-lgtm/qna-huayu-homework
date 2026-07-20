/* 簡單的 service worker：可安裝 (PWA) + 離線顯示應用外殼 */
const CACHE = 'hyc-v263';
const ASSETS = ['index.html', 'student.html', 'teacher.html', 'styles.css', 'config.js', 'db.js', 'manifest.json', 'icon-192.png', 'icon-512.png'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS.map(u => new Request(u, { cache: 'reload' }))).catch(() => {})));
  self.skipWaiting();
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const u = new URL(e.request.url);
  // 只快取同源資源（避免快取到 Firestore 等動態資料）；網路優先，離線退回快取
  e.respondWith(
    fetch(e.request).then(r => {
      if (u.origin === location.origin) { const cp = r.clone(); caches.open(CACHE).then(c => c.put(e.request, cp)); }
      return r;
    }).catch(() => caches.match(e.request).then(m => m || (e.request.mode === 'navigate' ? caches.match('student.html') : undefined)))
  );
});
