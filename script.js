const tg = window.Telegram.WebApp;
tg.expand();
tg.ready();

const STORAGE_KEYS = {
  score: 'clicker_score',
  energy: 'clicker_energy',
  lastTime: 'clicker_last_time'
};

let score = 0;
let energy = 1000;
let maxEnergy = 1000;
const energyPerSecond = 2;
const clickValue = 1;

const scoreEl = document.getElementById('score');
const energyEl = document.getElementById('energy');
const hamster = document.getElementById('hamster');
const effectsContainer = document.getElementById('click-effects');

// ────────────────────────────────────────────────
// Загрузка данных
// ────────────────────────────────────────────────
tg.CloudStorage.getItems(Object.values(STORAGE_KEYS), (err, values) => {
  if (err) {
    console.warn("CloudStorage error:", err);
  } else {
    score = parseInt(values[STORAGE_KEYS.score] || "0", 10);
    energy = parseInt(values[STORAGE_KEYS.energy] || "1000", 10);
    const lastTime = parseInt(values[STORAGE_KEYS.lastTime] || Date.now(), 10);

    // Восстановление энергии за время оффлайна
    const secondsOffline = Math.floor((Date.now() - lastTime) / 1000);
    const recovered = Math.min(secondsOffline * energyPerSecond, maxEnergy - energy);
    energy = Math.min(energy + recovered, maxEnergy);

    updateUI();
  }
});

// ────────────────────────────────────────────────
// Сохранение
// ────────────────────────────────────────────────
function saveProgress() {
  const data = {};
  data[STORAGE_KEYS.score]    = score.toString();
  data[STORAGE_KEYS.energy]   = energy.toString();
  data[STORAGE_KEYS.lastTime] = Date.now().toString();

  tg.CloudStorage.setItems(data, (err) => {
    if (err) console.warn("Не удалось сохранить:", err);
  });
}

// ────────────────────────────────────────────────
// UI
// ────────────────────────────────────────────────
function updateUI() {
  scoreEl.textContent = score.toLocaleString();
  energyEl.textContent = `${Math.floor(energy)} / ${maxEnergy}`;
}

// ────────────────────────────────────────────────
// Клик
// ────────────────────────────────────────────────
hamster.addEventListener('pointerdown', (e) => {
  if (energy < 1) return;

  e.preventDefault();

  score += clickValue;
  energy -= 1;

  createClickEffect(e.clientX, e.clientY);
  updateUI();
  saveProgress();
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
// Восстановление энергии в реальном времени
// ────────────────────────────────────────────────
setInterval(() => {
  if (energy < maxEnergy) {
    energy = Math.min(energy + energyPerSecond / 10, maxEnergy); // 2 в секунду → 0.2 каждые 100мс
    updateUI();
    saveProgress();
  }
}, 100);

// Сохраняем при выходе / сворачивании
window.addEventListener('beforeunload', saveProgress);
tg.onEvent('viewportChanged', saveProgress);