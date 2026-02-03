const tg = window.Telegram.WebApp;
tg.expand();
tg.ready();

// Firebase (твой конфиг)
const firebaseConfig = { /* твой конфиг без изменений */ };
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

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

// ─── Загрузка ────────────────────────────────────────
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
});

// ─── Сохранение с debounce ───────────────────────────
let saveTimer;
function save() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    userRef.update({
      score,
      energy: Math.floor(energy),
      level,
      lastTime: Date.now()
    });
  }, 500);
}

// ─── UI ───────────────────────────────────────────────
function updateUI() {
  scoreEl.textContent = Math.floor(score).toLocaleString();
  energyEl.textContent = `${Math.floor(energy)} / ${maxEnergy}`;
  energyFill.style.width = (energy / maxEnergy * 100) + '%';

  // Простой расчёт уровня (можно улучшить)
  level = Math.floor(score / 500) + 1;
  levelEl.textContent = level;
}

// ─── Тап ──────────────────────────────────────────────
hamster.addEventListener('pointerdown', e => {
  if (energy < 1) return;
  e.preventDefault();

  score += clickValue;
  energy -= 1;

  createClickEffect(e.clientX, e.clientY);
  updateUI();
  save();
});

// ─── Эффект +X ────────────────────────────────────────
function createClickEffect(x, y) {
  const el = document.createElement('div');
  el.className = 'click-effect';
  el.textContent = `+${clickValue}`;

  // Случайный цвет
  if (Math.random() > 0.7) {
    el.classList.add('gold');
  } else if (Math.random() > 0.4) {
    el.classList.add('purple');
  }

  el.style.left = x + 'px';
  el.style.top = y + 'px';
  effects.appendChild(el);

  setTimeout(() => el.remove(), 1400);
}

// ─── Восстановление энергии ───────────────────────────
setInterval(() => {
  if (energy < maxEnergy) {
    energy = Math.min(energy + energyPerSecond / 10, maxEnergy);
    updateUI();
    save();
  }
}, 100);

// ─── Частицы на фоне (очень лёгкие) ──────────────────
function initParticles() {
  const canvas = document.getElementById('particles');
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const particles = [];
  for (let i = 0; i < 40; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() * 2 + 1,
      speed: Math.random() * 0.3 + 0.1,
      alpha: Math.random() * 0.5 + 0.2
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
