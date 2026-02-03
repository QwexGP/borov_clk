const tg = window.Telegram.WebApp;
tg.expand();
tg.ready();

// Отключаем свайп вниз (закрытие/минимизация) — критично для тапа
if (tg.version && tg.isVersionAtLeast && tg.isVersionAtLeast('7.7')) {
  tg.disableVerticalSwipes();
  console.log('Vertical swipes disabled');
} else {
  console.warn('disableVerticalSwipes not available — update Telegram');
}

// Firebase config (твой)
const firebaseConfig = {
  apiKey: "AIzaSyBJm0vHyFX5hF654loWvHQyteHPM-bmh3M",
  authDomain: "brvclk-658bb.firebaseapp.com",
  databaseURL: "https://brvclk-658bb-default-rtdb.firebaseio.com",
  projectId: "brvclk-658bb",
  storageBucket: "brvclk-658bb.firebasestorage.app",
  messagingSenderId: "466193565189",
  appId: "1:466193565189:web:df414ff332ee8e0042fe6c",
  measurementId: "G-YP2GWHZH3C"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// Переменные
let score = 0;
let energy = 1000;
let maxEnergy = 1000;
let level = 1;
const energyPerSecond = 2;
const clickValue = 1;

const scoreEl = document.getElementById('score');
const energyEl = document.getElementById('energy');
const energyFill = document.getElementById('energy-fill');
const levelEl = document.getElementById('level');
const hamster = document.getElementById('hamster');
const effects = document.getElementById('click-effects');

// User ID + fallback
let userId = 'guest_' + Date.now();
if (tg.initDataUnsafe && tg.initDataUnsafe.user && tg.initDataUnsafe.user.id) {
  userId = tg.initDataUnsafe.user.id.toString();
  console.log('User ID from Telegram:', userId);
} else {
  console.warn('No Telegram user ID — using guest');
}

const userRef = db.ref('users/' + userId);

// Загрузка данных
userRef.once('value')
  .then(snap => {
    const data = snap.val() || {};
    score = data.score || 0;
    energy = data.energy || 1000;
    level = data.level || 1;

    const last = data.lastTime || Date.now();
    const offlineSec = Math.floor((Date.now() - last) / 1000);
    const recovered = Math.min(offlineSec * energyPerSecond, maxEnergy - energy);
    energy += recovered;
    energy = Math.min(energy, maxEnergy);

    updateUI();
    console.log('Loaded from Firebase');
  })
  .catch(err => {
    console.error('Firebase load failed:', err);
    // Fallback на localStorage если Firebase не доступен
    score = parseInt(localStorage.getItem('bc_score') || '0');
    energy = parseInt(localStorage.getItem('bc_energy') || '1000');
    updateUI();
  });

// Сохранение (debounce + fallback)
let saveTimeout;
function saveProgress() {
  clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    const data = {
      score,
      energy: Math.floor(energy),
      level,
      lastTime: Date.now()
    };

    userRef.update(data)
      .then(() => console.log('Saved to Firebase'))
      .catch(err => {
        console.error('Firebase save failed:', err);
        // Fallback localStorage
        localStorage.setItem('bc_score', score);
        localStorage.setItem('bc_energy', Math.floor(energy));
      });
  }, 300);
}

// UI
function updateUI() {
  scoreEl.textContent = Math.floor(score).toLocaleString();
  energyEl.textContent = `${Math.floor(energy)} / ${maxEnergy}`;
  energyFill.style.width = `${(energy / maxEnergy) * 100}%`;

  level = Math.floor(score / 500) + 1;
  levelEl.textContent = level;
}

// Надёжный тап-обработчик
let tapStarted = false;
let startY = 0;

function startTap(e) {
  if (energy < 1) return;
  e.preventDefault();
  tapStarted = true;
  startY = e.touches[0].clientY;
}

function endTap(e) {
  if (!tapStarted) return;
  tapStarted = false;

  // Проверяем, не был ли свайп (допуск 30px)
  const currentY = e.changedTouches ? e.changedTouches[0].clientY : startY;
  if (Math.abs(currentY - startY) > 30) return; // это скролл, игнорируем

  score += clickValue;
  energy -= 1;

  const touch = e.changedTouches ? e.changedTouches[0] : e;
  createClickEffect(touch.clientX, touch.clientY);

  updateUI();
  saveProgress();
}

// События (touch для мобильных + pointer для десктопа)
hamster.addEventListener('touchstart', startTap, { passive: false });
hamster.addEventListener('touchend', endTap, { passive: false });
hamster.addEventListener('touchcancel', () => { tapStarted = false; }, { passive: false });

hamster.addEventListener('pointerdown', e => {
  if (!('ontouchstart' in window)) {
    startTap(e);
    endTap(e); // для мыши сразу end
  }
}, { passive: false });

// Остальной код (эффекты, интервал энергии, частицы) — оставь как был ранее

// Восстановление энергии
setInterval(() => {
  if (energy < maxEnergy) {
    energy = Math.min(energy + energyPerSecond / 10, maxEnergy);
    updateUI();
    saveProgress();
  }
}, 100);

// Частицы (оставь как было)
