const CACHE_NAME = 'pigeon-clock-v3';
const urlsToCache = [
  './',
  './index.html',
  './style.css',
  './pigeon-clock.js',
  './manifest.json'
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
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  
  // バックグラウンド時報の開始
  startHourlyCheck();
});

// ネットワークリクエストの処理
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        return fetch(event.request).then((response) => {
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
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

// メッセージハンドラー
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SET_TIMER') {
    // タイマーを設定
    const { hours, minutes } = event.data;
    const timerMs = (hours * 60 + minutes) * 60 * 1000;
    
    setTimeout(() => {
      showNotification('⏰ 鳩時計 - タイマー', 'タイマーが終了しました！', 'timer');
    }, timerMs);
    
    // クライアントに設定完了を通知
    event.ports[0].postMessage({ success: true });
  }
});

// 時報チェック機能
let hourlyCheckInterval;

function startHourlyCheck() {
  // 既存のインターバルをクリア
  if (hourlyCheckInterval) {
    clearInterval(hourlyCheckInterval);
  }
  
  // 1分ごとにチェック（正確な時刻を捉えるため）
  hourlyCheckInterval = setInterval(() => {
    const now = new Date();
    const minutes = now.getMinutes();
    const seconds = now.getSeconds();
    
    // 毎時0分0-10秒の間に通知（多少の誤差を許容）
    if (minutes === 0 && seconds < 10) {
      // 設定を確認
      checkAndSendHourlyNotification();
    }
  }, 60000); // 1分ごと
  
  // 初回チェック
  checkInitialTime();
}

// 初回時刻チェック
function checkInitialTime() {
  const now = new Date();
  const minutes = now.getMinutes();
  const seconds = now.getSeconds();
  
  // 次の0分までの時間を計算
  const msUntilNextHour = ((59 - minutes) * 60 + (60 - seconds)) * 1000;
  
  // 次の正時に最初の通知
  setTimeout(() => {
    checkAndSendHourlyNotification();
    // その後は定期チェックに任せる
  }, msUntilNextHour);
}

// 時報通知の送信確認
async function checkAndSendHourlyNotification() {
  try {
    // すべてのクライアントを取得
    const clients = await self.clients.matchAll({ type: 'window' });
    
    // クライアントから設定を取得
    let hourlyEnabled = true; // デフォルトは有効
    
    if (clients.length > 0) {
      // アクティブなクライアントがあれば設定を問い合わせ
      const client = clients[0];
      const channel = new MessageChannel();
      
      const promise = new Promise((resolve) => {
        channel.port1.onmessage = (event) => {
          if (event.data && typeof event.data.hourlyEnabled !== 'undefined') {
            hourlyEnabled = event.data.hourlyEnabled;
          }
          resolve();
        };
      });
      
      client.postMessage({ type: 'GET_SETTINGS' }, [channel.port2]);
      
      // タイムアウト設定（クライアントが応答しない場合）
      await Promise.race([
        promise,
        new Promise(resolve => setTimeout(resolve, 1000))
      ]);
    }
    
    // 時報が有効なら通知を送信
    if (hourlyEnabled) {
      const hour = new Date().getHours();
      showNotification(
        '🕊 鳩時計 - 時報',
        `${hour}時です！鳩が鳴きました`,
        'hourly'
      );
    }
  } catch (error) {
    console.error('時報通知エラー:', error);
  }
}

// 通知を表示
function showNotification(title, body, tag) {
  const options = {
    body: body,
    icon: './icon-192.png',
    badge: './icon-192.png',
    tag: tag,
    requireInteraction: tag === 'timer', // タイマーは手動で閉じる必要あり
    silent: false,
    vibrate: tag === 'timer' ? [300, 100, 300, 100, 300] : [200, 100, 200],
    data: { type: tag }
  };
  
  self.registration.showNotification(title, options);
}

// 通知をクリックした時の処理
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  event.waitUntil(
    clients.matchAll({ type: 'window' })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url === self.registration.scope && 'focus' in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow('./');
        }
      })
  );
});