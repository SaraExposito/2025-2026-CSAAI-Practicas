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

function createKeyboard() {
    keyboard.innerHTML = '';
    for (let i = 0; i <= 9; i++) {
        const btn = document.createElement('button');
        btn.innerText = i;
        btn.classList.add('key-btn'); // Clase para estilos específicos
        btn.addEventListener('click', () => handleGuess(i, btn));
        keyboard.appendChild(btn);
    }
}

function generateCode() {
    const nums = Array.from({length: 10}, (_, i) => i);
    nums.sort(() => Math.random() - 0.5);
    return nums.slice(0, 4);
}

function handleGuess(num, button) {
    if (attemptsLeft <= 0 || foundCount === 4 || !gameActive) return;
    
    // Desactivar botón inmediatamente
    button.disabled = true;
    button.classList.add('used'); // Añadimos clase para el estilo gris

    attemptsLeft--;
    displayAttempts.innerText = attemptsLeft;
    
    if (attemptsLeft <= 2) displayAttempts.classList.add('critical');

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
        showMessage(`¡MISIÓN CUMPLIDA! 🔓\n\nClave descifrada.\nTiempo: ${displayTimer.innerText}`);
    } else if (attemptsLeft === 0) {
        stopTimer();
        revealSecretCode();
        showMessage(`¡BOOM! 💥\n\nBomba detonada.\nLa clave era: ${secretCode.join('')}`);
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
    displayAttempts.classList.remove('critical');
    messagePanel.classList.add('hidden');
    
    displayKey.forEach(el => {
        el.innerText = "*";
        el.classList.remove('revealed');
        el.style.color = ''; // Reset color de revelado
    });
    
    createKeyboard();
    startTimer(); // El juego empieza activo tras reset
}

function showMessage(text) {
    messagePanel.innerText = text;
    messagePanel.classList.remove('hidden');
    messagePanel.onclick = () => messagePanel.classList.add('hidden');
}

function revealSecretCode() {
    secretCode.forEach((digit, index) => {
        displayKey[index].innerText = digit;
        displayKey[index].classList.add('revealed');
    });
}

document.getElementById('btn-start').addEventListener('click', startTimer);
document.getElementById('btn-stop').addEventListener('click', stopTimer);
document.getElementById('btn-reset').addEventListener('click', resetGame);

resetGame();