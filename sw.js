// 서비스워커: 홈화면 앱이 빨리 열리고, 인터넷이 약해도 화면이 뜨게 합니다.
// 화면 파일을 고치면 아래 버전 숫자를 올려주세요.
const CACHE = 'travel-note-v1';
const FILES = ['./', 'index.html', 'style.css?v=1', 'app.js?v=1', 'manifest.webmanifest', 'icons/icon-192.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
  ));
  self.clients.claim();
});

// 새 자료가 바로 보이도록 인터넷 먼저, 안 되면 저장해둔 것 사용
self.addEventListener('fetch', e => {
  // 영상처럼 나눠 받는 요청은 브라우저에 맡김
  if (e.request.method !== 'GET' || e.request.headers.has('range')) return;
  const sameOrigin = new URL(e.request.url).origin === location.origin;
  // 내 사이트 파일은 브라우저가 기억해 둔 옛 파일 대신 항상 최신 파일 확인
  const req = sameOrigin && e.request.mode !== 'navigate'
    ? new Request(e.request, { cache: 'no-cache' })
    : e.request;
  e.respondWith(
    fetch(req)
      .then(res => {
        if (res.status === 200 && sameOrigin) {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, copy));
        }
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
