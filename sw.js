const CACHE_NAME = 'pigeon-clock-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/style.css',
  '/pigeon-clock.js',
  '/manifest.json',
  '/Cuckoo_Clock01-03(Denoise-Long).mp3'
];

// Service Worker のインストール
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('キャッシュを開いています');
        return cache.addAll(urlsToCache);
      })
  );
});

// Service Worker の起動
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('古いキャッシュを削除:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// ネットワークリクエストの処理
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // キャッシュから見つかった場合はそれを返す
        if (response) {
          return response;
        }
        
        // キャッシュにない場合はネットワークから取得
        return fetch(event.request).then((response) => {
          // レスポンスが無効な場合はそのまま返す
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          
          // レスポンスをクローンしてキャッシュに保存
          const responseToCache = response.clone();
          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });
          
          return response;
        });
      })
  );
});

// バックグラウンドでの時報通知（オプション）
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'HOURLY_NOTIFICATION') {
    self.registration.showNotification('鳩時計', {
      body: '時報です！鳩が鳴きました 🕊',
      icon: '/icon-192.png',
      badge: '/icon-72.png',
      tag: 'hourly-pigeon',
      requireInteraction: false,
      silent: false
    });
  }
});