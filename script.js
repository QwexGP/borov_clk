const tg = window.Telegram.WebApp;
tg.expand();
tg.ready();

// ────────────────────────────────────────────────
// Firebase инициализация (твой config)
// ────────────────────────────────────────────────
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

// ────────────────────────────────────────────────
// Переменные игры
// ────────────────────────────────────────────────
let score = 0;
let energy = 1000;
let maxEnergy = 1000;
const energyPerSecond = 2;     // восстановление в секунду
const clickValue = 1;

const scoreEl = document.getElementById('score');
const energyEl = document.getElementById('energy');
const hamster = document.getElementById('hamster');
const effectsContainer = document.getElementById('click-effects');

// Получаем user ID из Telegram (уникальный для каждого пользователя)
const user = tg.initDataUnsafe.user;
const userId = user ? user.id.toString() : 'guest_' + Date.now(); // fallback для теста вне TG
const userRef = db.ref('users/' + userId);

// ────────────────────────────────────────────────
// Загрузка данных при запуске
// ────────────────────────────────────────────────
userRef.once('value')
  .then((snapshot) => {
    const data = snapshot.val() || {};
    
    score = data.score || 0;
    energy = data.energy || 1000;
    
    // Восстановление энергии за время оффлайна
    const lastTime = data.lastTime || Date.now();
    const secondsOffline = Math.floor((Date.now() - lastTime) / 1000);
    const recovered = Math.min(secondsOffline * energyPerSecond, maxEnergy - energy);
    energy = Math.min(energy + recovered, maxEnergy);

    updateUI();
    console.log('Данные загружены из Firebase для пользователя', userId);
  })
  .catch((err) => {
    console.error('Ошибка загрузки из Firebase:', err);
    updateUI(); // показываем дефолтные значения, если ошибка
  });

// ────────────────────────────────────────────────
// Debounced сохранение (чтобы не спамить БД)
// ────────────────────────────────────────────────
let saveTimeout;
function debouncedSave() {
  clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    userRef.update({
      score: score,
      energy: Math.floor(energy), // храним целое число
      lastTime: Date.now()
    })
    .then(() => {
      console.log('Прогресс сохранён в Firebase');
    })
    .catch((err) => {
      console.error('Ошибка сохранения в Firebase:', err);
    });
  }, 400); // 400 мс задержки после последнего изменения
}

// ────────────────────────────────────────────────
// UI обновление
// ────────────────────────────────────────────────
function updateUI() {
  scoreEl.textContent = score.toLocaleString();
  energyEl.textContent = `${Math.floor(energy)} / ${maxEnergy}`;
}

// ────────────────────────────────────────────────
// Клик по хомяку
// ────────────────────────────────────────────────
hamster.addEventListener('pointerdown', (e) => {
  if (energy < 1) return;

  e.preventDefault();

  score += clickValue;
  energy -= 1;

  createClickEffect(e.clientX, e.clientY);
  updateUI();
  debouncedSave();
});

// ────────────────────────────────────────────────
// Эффект +1
// ────────────────────────────────────────────────
function createClickEffect(x, y) {
  const effect = document.createElement('div');
  effect.className = 'click-effect';
  effect.textContent = `+${clickValue}`;
  effect.style.left = `${x}px`;
  effect.style.top  = `${y}px`;
  
  effectsContainer.appendChild(effect);
  setTimeout(() => effect.remove(), 1200);
}

// ────────────────────────────────────────────────
// Восстановление энергии каждые 100 мс (2 в секунду)
// ────────────────────────────────────────────────
setInterval(() => {
  if (energy < maxEnergy) {
    energy = Math.min(energy + energyPerSecond / 10, maxEnergy);
    updateUI();
    debouncedSave();
  }
}, 100);

// ────────────────────────────────────────────────
// Дополнительное сохранение при сворачивании/закрытии
// ────────────────────────────────────────────────
window.addEventListener('beforeunload', debouncedSave);
tg.onEvent('viewportChanged', debouncedSave);

// Для отладки: можно вызвать вручную в консоли saveProgress()
window.saveProgress = debouncedSave;
