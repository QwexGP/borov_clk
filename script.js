const coin = document.getElementById('coin');
const scoreDisplay = document.getElementById('score');
const tg = window.Telegram.WebApp;

// Состояние игры
let score = parseInt(localStorage.getItem('borov_score')) || 0;
let clickPower = 1;

// Инициализация
tg.expand(); // Разворачиваем на весь экран
scoreDisplay.innerText = score;

coin.addEventListener('click', (e) => {
    score += clickPower;
    scoreDisplay.innerText = score;

    // Сохранение в локальную память браузера
    localStorage.setItem('borov_score', score);

    // Прикольная фишка 1: Виброотклик (работает только в Telegram)
    if (tg.HapticFeedback) {
        tg.HapticFeedback.impactOccurred('medium');
    }

    // Прикольная фишка 2: Создание вылетающего текста +1
    createPlusText(e.pageX, e.pageY);
});

function createPlusText(x, y) {
    const plus = document.createElement('div');
    plus.className = 'plus-one';
    plus.innerText = `+${clickPower}`;
    plus.style.left = `${x - 10}px`;
    plus.style.top = `${y - 20}px`;
    
    document.body.appendChild(plus);
    
    setTimeout(() => {
        plus.remove();
    }, 500);
}
