const tg = window.Telegram.WebApp;
tg.expand();
tg.ready();

// Отключаем вертикальный свайп вниз (закрытие аппа) — важно для тапа на телефоне
if (tg.disableVerticalSwipes) {
  tg.disableVerticalSwipes();
}

// Firebase
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

// User ID
const userId = tg.initDataUnsafe.user?.id?.toString() || 'guest_' + Date.now();
const userRef = db.ref('users/' + userId);

// Загрузка
userRef.once('value').then(snap => {
  const data = snap.val() || {};
  score = data.score || 0;
  energy = data.energy || 1000;
  level = data.level || 1;

  const last = data.lastTime || Date.now();
  const offlineSec = (Date.now() - last) / 1000;
  const recovered = Math.min(offlineSec * energyPerSecond, maxEnergy - energy);
  energy = Math.min(energy + recovered, maxEnergy);

  updateUI();
}).catch(err => console.error('Firebase load error:', err));

// Debounced save
let saveTimer;
function save() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    userRef.update({
      score,
      energy: Math.floor(energy),
      level,
      lastTime: Date.now()
    }).catch(err => console.error('Firebase save error:', err));
  }, 500);
}

// UI
function updateUI() {
  scoreEl.textContent = Math.floor(score).toLocaleString();
  energyEl.textContent = `${Math.floor(energy)} / ${maxEnergy}`;
  energyFill.style.width = (energy / maxEnergy * 100) + '%';

  level = Math.floor(score / 500) + 1;
  levelEl.textContent = level;
}

// Обработчик тапа (работает на телефоне)
function handleTap(e) {
  if (energy < 1) return;
  e.preventDefault();
  e.stopPropagation();

  score += clickValue;
  energy -= 1;

  const touch = e.touches ? e.touches[0] : e;
  createClickEffect(touch.clientX, touch.clientY);

  updateUI();
  save();
}

// События
hamster.addEventListener('touchstart', handleTap, { passive: false });
hamster.addEventListener('pointerdown', e => {
  if (!('ontouchstart' in window)) handleTap(e);
}, { passive: false });

// Эффект
function createClickEffect(x, y) {
  const el = document.createElement('div');
  el.className = 'click-effect';
  el.textContent = `+${clickValue}`;

  if (Math.random() > 0.6) el.classList.add('gold');
  else if (Math.random() > 0.3) el.classList.add('purple');

  el.style.left = x + 'px';
  el.style.top = y + 'px';
  effects.appendChild(el);
  setTimeout(() => el.remove(), 1500);
}

// Восстановление энергии
setInterval(() => {
  if (energy < maxEnergy) {
    energy = Math.min(energy + energyPerSecond / 10, maxEnergy);
    updateUI();
    save();
  }
}, 100);

// Частицы фона
function initParticles() {
  const canvas = document.getElementById('particles');
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const particles = [];
  for (let i = 0; i < 50; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() * 2.5 + 0.8,
      speed: Math.random() * 0.4 + 0.15,
      alpha: Math.random() * 0.4 + 0.15
    });
  }

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => {
      ctx.fillStyle = `rgba(255, 255, 255, ${p.alpha})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      p.y -= p.speed;
      if (p.y < -10) p.y = canvas.height + 10;
    });
    requestAnimationFrame(animate);
  }
  animate();

  window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  });
}

initParticles();
