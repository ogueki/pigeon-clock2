const CACHE_NAME = 'pigeon-clock-v2';
const urlsToCache = [
  './',
  './index.html',
  './style.css',
  './pigeon-clock.js',
  './manifest.json',
  './Cuckoo_Clock01-03(Denoise-Long).mp3',
  './icon-192.png'
];

// Service Worker のインストール
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('キャッシュを開いています');
        return cache.addAll(urlsToCache.filter(url => url !== './Cuckoo_Clock01-03(Denoise-Long).mp3' && url !== './icon-192.png'));
      })
      .catch((error) => {
        console.log('キャッシュエラー:', error);
        // 重要なファイルのみキャッシュ
        return caches.open(CACHE_NAME).then((cache) => {
          return cache.addAll([
            './',
            './index.html',
            './style.css',
            './pigeon-clock.js',
            './manifest.json'
          ]);
        });
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

// プッシュ通知の処理
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'HOURLY_NOTIFICATION') {
    self.registration.showNotification('🕊 鳩時計 - 時報', {
      body: '時報です！鳩が鳴きました',
      icon: './icon-192.png',
      badge: './icon-192.png',
      tag: 'hourly-pigeon',
      requireInteraction: false,
      silent: false,
      vibrate: [200, 100, 200],
      data: { type: 'hourly' }
    });
  } else if (event.data && event.data.type === 'TIMER_NOTIFICATION') {
    self.registration.showNotification('⏰ 鳩時計 - タイマー', {
      body: 'タイマーが終了しました！',
      icon: './icon-192.png',
      badge: './icon-192.png',
      tag: 'timer-pigeon',
      requireInteraction: true,
      silent: false,
      vibrate: [300, 100, 300, 100, 300],
      data: { type: 'timer' }
    });
  }
});

// 通知をクリックした時の処理
self.addEventListener('notificationclick', (event) => {
  console.log('通知がクリックされました:', event.notification.tag);
  
  event.notification.close();
  
  // アプリを開く
  event.waitUntil(
    clients.matchAll({ type: 'window' })
      .then((clientList) => {
        // 既に開いているタブがあれば、そこにフォーカス
        for (const client of clientList) {
          if (client.url === self.registration.scope && 'focus' in client) {
            return client.focus();
          }
        }
        // 開いているタブがなければ新しいタブを開く
        if (clients.openWindow) {
          return clients.openWindow('./');
        }
      })
  );
});

// バックグラウンド同期（オプション）
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(
      // バックグラウンドでの処理をここに記述
      console.log('バックグラウンド同期が実行されました')
    );
  }
});