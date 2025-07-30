// グローバル変数
let timerInterval = null;
let timerEndTime = null;
let notificationPermission = 'default';

function updateClock() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const timeString = `${hours}:${minutes}:${seconds}`;
    document.getElementById('digital-clock').textContent = timeString;

    // 毎時0分0秒に鳩が鳴く（時報通知がONの場合）
    if (minutes === '00' && seconds === '00') {
        const hourlyToggle = document.getElementById('hourly-notification-toggle');
        if (hourlyToggle && hourlyToggle.checked) {
            playPigeonCry();
            changePigeonColor();
            sendHourlyNotification();
        }
    }

    // タイマーのカウントダウン更新
    updateTimerDisplay();
}

function playPigeonCry() {
    const pigeonCry = document.getElementById('pigeon-cry');
    if (pigeonCry) {
        pigeonCry.play().catch(e => {
            console.log('音声再生に失敗しました:', e);
            // 音声ファイルがない場合の代替音
            playAlternativeSound();
        });
    } else {
        playAlternativeSound();
    }
}

// Web Audio APIで代替音を生成
function playAlternativeSound() {
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.1);
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
    } catch (e) {
        console.log('代替音声再生に失敗しました:', e);
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
    if ('serviceWorker' in navigator && Notification.permission === 'granted') {
        navigator.serviceWorker.ready.then(registration => {
            if (registration.active) {
                registration.active.postMessage({
                    type: 'HOURLY_NOTIFICATION'
                });
            }
        });
    }
}

// タイマー通知を送信
function sendTimerNotification() {
    if ('serviceWorker' in navigator && Notification.permission === 'granted') {
        navigator.serviceWorker.ready.then(registration => {
            if (registration.active) {
                registration.active.postMessage({
                    type: 'TIMER_NOTIFICATION'
                });
            }
        });
    }
}

// 通知ステータスの更新
function updateNotificationStatus(permission) {
    notificationPermission = permission || Notification.permission;
    const statusElement = document.getElementById('notification-status');
    if (!statusElement) return;
    
    switch (notificationPermission) {
        case 'granted':
            statusElement.textContent = '✅ 通知許可済み';
            statusElement.style.color = '#4CAF50';
            break;
        case 'denied':
            statusElement.textContent = '❌ 通知が拒否されています';
            statusElement.style.color = '#f44336';
            break;
        default:
            statusElement.textContent = '⚠️ 通知許可が必要です';
            statusElement.style.color = '#ff9800';
            break;
    }
}

// タイマー設定
function setTimer() {
    const hoursInput = document.getElementById('timer-hours');
    const minutesInput = document.getElementById('timer-minutes');
    
    if (!hoursInput || !minutesInput) return;
    
    const hours = parseInt(hoursInput.value) || 0;
    const minutes = parseInt(minutesInput.value) || 0;
    
    if (hours === 0 && minutes === 0) {
        alert('タイマー時間を設定してください');
        return;
    }

    // 現在時刻から指定時間後を計算
    const now = new Date();
    timerEndTime = new Date(now.getTime() + (hours * 60 + minutes) * 60 * 1000);
    
    // タイマー表示を表示
    const timerDisplay = document.getElementById('timer-display');
    if (timerDisplay) {
        timerDisplay.style.display = 'block';
    }
    
    alert(`タイマーを${hours}時間${minutes}分後に設定しました`);
}

// タイマーキャンセル
function cancelTimer() {
    timerEndTime = null;
    const timerDisplay = document.getElementById('timer-display');
    const timerCountdown = document.getElementById('timer-countdown');
    
    if (timerDisplay) {
        timerDisplay.style.display = 'none';
    }
    if (timerCountdown) {
        timerCountdown.textContent = '';
    }
}

// タイマー表示更新
function updateTimerDisplay() {
    if (!timerEndTime) return;

    const now = new Date();
    const remaining = timerEndTime - now;

    if (remaining <= 0) {
        // タイマー終了
        playPigeonCry();
        changePigeonColor();
        sendTimerNotification();
        cancelTimer();
        alert('⏰ タイマーが終了しました！');
        return;
    }

    // 残り時間を表示
    const hours = Math.floor(remaining / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((remaining % (1000 * 60)) / 1000);
    
    const timerCountdown = document.getElementById('timer-countdown');
    if (timerCountdown) {
        timerCountdown.textContent = 
            `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
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

// 設定の保存と復元
function initializeSettings() {
    const hourlyToggle = document.getElementById('hourly-notification-toggle');
    if (hourlyToggle) {
        // 保存された設定を復元
        const savedHourlyState = localStorage.getItem('hourly-notification');
        if (savedHourlyState !== null) {
            hourlyToggle.checked = savedHourlyState === 'true';
        }
        
        // 設定変更時に保存
        hourlyToggle.addEventListener('change', () => {
            localStorage.setItem('hourly-notification', hourlyToggle.checked);
        });
    }
}

// イベントリスナーの設定
window.addEventListener('online', updateOnlineStatus);
window.addEventListener('offline', updateOnlineStatus);

// 初期化処理
window.addEventListener('load', () => {
    // 通知許可状態を更新
    updateNotificationStatus();
    
    // 設定を初期化
    initializeSettings();
    
    // 初期状態のオンライン状態をチェック
    updateOnlineStatus();
});

// 時計の更新を開始
setInterval(updateClock, 1000);
updateClock();