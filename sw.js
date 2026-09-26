/* 簡單的 service worker：可安裝 (PWA) + 離線顯示應用外殼 */
const CACHE = 'hyc-v1243';
/* SWFRESH_V1102 三個 .html 從這份清單拿掉了。
   本來 install 的時候會先把 teacher.html／student.html／index.html 抓一份存進快取，
   可是這個快取的名字是固定的，sw.js 不改就不會重裝——等於那一份可能放很久。
   下面的 fetch 是「先連網、連不到才用快取」，所以每次成功連網都會順手更新快取，
   離線還是有東西可用；把 .html 從預先快取拿掉，重新整理就一定拿到最新版。 */
const ASSETS = ['styles.css', 'config.js', 'db.js', 'manifest.json', 'icon-192.png', 'icon-512.png'];
/* SW_NOLOOP_V40 不再自動接管：新版本先等著，等網頁上的「更新」按鈕叫它才接手。
   以前 install 就 skipWaiting＋activate 就 claim，每次一發新版，開著的分頁就會自己重新整理，
   有時候還會一直重跑、跑回登入畫面。 */
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS.map(u => new Request(u, { cache: 'reload' }))).catch(() => {})));
});
self.addEventListener('message', e => {
  if (e && e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting();
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const u = new URL(e.request.url);
  /* SW_NOLOOP_V40 sw.js 本身絕對不要進快取，不然新舊版本會交替出現、害分頁一直重新整理 */
  if (/\/sw\.js$/.test(u.pathname)) return;
  // 只快取同源資源（避免快取到 Firestore 等動態資料）；網路優先，離線退回快取
  /* SWFRESH_V1102 開網頁（navigate）的時候強制跟伺服器要最新的，
     不要讓瀏覽器自己的快取插手；其他資源照舊。 */
  const req = (e.request.mode === 'navigate')
    ? new Request(e.request, { cache: 'no-cache' })
    : e.request;
  e.respondWith(
    fetch(req).then(r => {
      if (u.origin === location.origin) { const cp = r.clone(); caches.open(CACHE).then(c => c.put(e.request, cp)); }
      return r;
    }).catch(() => caches.match(e.request).then(m => m || (e.request.mode === 'navigate' ? caches.match('student.html') : undefined)))
  );
});
