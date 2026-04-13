const CACHE_NAME = 'char-designer-v1';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  'https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;700;900&family=Rajdhani:wght@500;700&display=swap'
];

// 설치: 핵심 파일 캐시
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[SW] 캐싱 중...');
      return cache.addAll(ASSETS).catch(err => {
        // 폰트 캐시 실패해도 계속 진행
        console.log('[SW] 일부 캐시 실패 (무시):', err);
        return cache.add('./character-designer.html');
      });
    })
  );
  self.skipWaiting();
});

// 활성화: 구버전 캐시 삭제
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// fetch: 캐시 우선, 없으면 네트워크
self.addEventListener('fetch', e => {
  // chrome-extension 등 무시
  if (!e.request.url.startsWith('http')) return;

  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(response => {
        // 성공한 응답만 캐시에 추가
        if (response && response.status === 200 && response.type !== 'opaque') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
        }
        return response;
      }).catch(() => {
        // 오프라인 + 캐시 없음 → HTML 반환
        if (e.request.destination === 'document') {
          return caches.match('./character-designer.html');
        }
      });
    })
  );
});
