// Variables de estado
let secretCode = [];
let attemptsLeft = 7;
let foundCount = 0;
let timerInterval;
let seconds = 0;
let gameActive = false;

const displayKey = document.querySelectorAll('.digit');
const displayAttempts = document.getElementById('attempts');
const displayTimer = document.getElementById('timer');
const keyboard = document.getElementById('keyboard');
const messagePanel = document.getElementById('message');

// Inicializar teclado
function createKeyboard() {
    keyboard.innerHTML = '';
    for (let i = 0; i <= 9; i++) {
        const btn = document.createElement('button');
        btn.innerText = i;
        btn.addEventListener('click', () => handleGuess(i, btn));
        keyboard.appendChild(btn);
    }
}

// Generar clave de 4 dígitos distintos
function generateCode() {
    const nums = Array.from({length: 10}, (_, i) => i);
    nums.sort(() => Math.random() - 0.5);
    return nums.slice(0, 4);
}

function handleGuess(num, button) {
    if (attemptsLeft <= 0 || foundCount === 4) return;
    
    // Iniciar crono si es el primer clic
    if (!gameActive) startTimer();

    button.disabled = true;
    attemptsLeft--;
    displayAttempts.innerText = attemptsLeft;

    let hit = false;
    secretCode.forEach((digit, index) => {
        if (digit === num) {
            displayKey[index].innerText = digit;
            displayKey[index].classList.add('revealed');
            foundCount++;
            hit = true;
        }
    });

    checkGameStatus();
}

function checkGameStatus() {
    if (foundCount === 4) {
        stopTimer();
        showMessage(`¡VICTORIA! 🎉\nTiemplo: ${displayTimer.innerText}\nIntentos usados: ${7 - attemptsLeft}`);
    } else if (attemptsLeft === 0) {
        stopTimer();
        revealSecretCode();
        showMessage(`¡BOOM! Perdiste. 💥\nLa clave era: ${secretCode.join('')}`);
    }
}

function startTimer() {
    if (gameActive) return;
    gameActive = true;
    timerInterval = setInterval(() => {
        seconds++;
        const mins = String(Math.floor(seconds / 60)).padStart(2, '0');
        const secs = String(seconds % 60).padStart(2, '0');
        displayTimer.innerText = `${mins}:${secs}`;
    }, 1000);
}

function stopTimer() {
    gameActive = false;
    clearInterval(timerInterval);
}

function resetGame() {
    stopTimer();
    seconds = 0;
    attemptsLeft = 7;
    foundCount = 0;
    secretCode = generateCode();
    
    displayTimer.innerText = "00:00";
    displayAttempts.innerText = attemptsLeft;
    messagePanel.classList.add('hidden');
    
    displayKey.forEach(el => {
        el.innerText = "*";
        el.classList.remove('revealed');
    });
    
    createKeyboard();
}

function showMessage(text) {
    messagePanel.innerText = text;
    messagePanel.classList.remove('hidden');
}

function revealSecretCode() {
    secretCode.forEach((digit, index) => {
        displayKey[index].innerText = digit;
    });
}

// Eventos de botones de control
document.getElementById('btn-start').addEventListener('click', startTimer);
document.getElementById('btn-stop').addEventListener('click', stopTimer);
document.getElementById('btn-reset').addEventListener('click', resetGame);

// Inicio inicial
resetGame();