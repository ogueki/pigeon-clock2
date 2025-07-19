function updateClock() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const timeString = `${hours}:${minutes}:${seconds}`;
    document.getElementById('digital-clock').textContent = timeString;

    // 毎時0分0秒に鳩が鳴く
    if (minutes === '00' && seconds === '00') {
        playPigeonCry();
        changePigeonColor();
        sendHourlyNotification();
    }
}

function playPigeonCry() {
    const pigeonCry = document.getElementById('pigeon-cry');
    if (pigeonCry) {
        pigeonCry.play().catch(e => {
            console.log('音声再生に失敗しました:', e);
        });
    }
}

function changePigeonColor() {
    const pigeonWindow = document.getElementById('pigeon-character');
    pigeonWindow.classList.remove("pigeon-character");
    pigeonWindow.classList.add("pigeon-character-appear");

    setTimeout(() => {
        pigeonWindow.classList.remove("pigeon-character-appear");
        pigeonWindow.classList.add("pigeon-character");
    }, 10000); 
}

// 時報通知を送信
function sendHourlyNotification() {
    if ('serviceWorker' in navigator && 'Notification' in window) {
        if (Notification.permission === 'granted') {
            navigator.serviceWorker.ready.then(registration => {
                registration.active.postMessage({
                    type: 'HOURLY_NOTIFICATION'
                });
            });
        }
    }
}

// PWA のオフライン状態を監視
function updateOnlineStatus() {
    const statusElement = document.getElementById('connection-status');
    if (navigator.onLine) {
        if (statusElement) statusElement.textContent = '';
    } else {
        if (!statusElement) {
            const status = document.createElement('div');
            status.id = 'connection-status';
            status.textContent = 'オフライン';
            status.style.cssText = `
                position: fixed;
                top: 10px;
                right: 10px;
                background: #ff4444;
                color: white;
                padding: 5px 10px;
                border-radius: 5px;
                font-size: 12px;
                z-index: 1000;
            `;
            document.body.appendChild(status);
        }
    }
}

// イベントリスナーの設定
window.addEventListener('online', updateOnlineStatus);
window.addEventListener('offline', updateOnlineStatus);

// 時計の更新を開始
setInterval(updateClock, 1000);
updateClock();

// 初期状態のオンライン状態をチェック
updateOnlineStatus();