/* sw.js
 * 추도예배 PWA용 Service Worker
 * - GitHub Pages 호환
 * - 오프라인 실행 가능
 * - 단일 페이지 앱에 최적화
 */

const CACHE_NAME = 'memorial-service-v1';
const OFFLINE_URLS = [
  './',
  './index.html',
  './manifest.json'
];

// 설치 단계: 필수 파일 캐시
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(OFFLINE_URLS);
    })
  );
  self.skipWaiting();
});

// 활성화 단계: 오래된 캐시 정리
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// 네트워크 요청 가로채기
self.addEventListener('fetch', event => {
  // GET 요청만 처리
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      // 캐시에 있으면 바로 반환
      if (cachedResponse) {
        return cachedResponse;
      }

      // 없으면 네트워크에서 가져와 캐시에 저장
      return fetch(event.request)
        .then(networkResponse => {
          // 유효하지 않은 응답은 캐시하지 않음
          if (
            !networkResponse ||
            networkResponse.status !== 200 ||
            networkResponse.type !== 'basic'
          ) {
            return networkResponse;
          }

          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });

          return networkResponse;
        })
        .catch(() => {
          // 오프라인 시 index.html 제공
          return caches.match('./index.html');
        });
    })
  );
});
