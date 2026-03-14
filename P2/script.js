let secretCode = [];
let attemptsLeft = 7;
let foundCount = 0;
let timerInterval;
let seconds = 0;
let gameActive = false;

const displayKey = document.querySelectorAll('.digit');
const displayAttempts = document.getElementById('attempts');
const attemptsContainer = displayAttempts.parentElement; 
const displayTimer = document.getElementById('timer');
const keyboard = document.getElementById('keyboard');
const messagePanel = document.getElementById('message');
const messageText = document.getElementById('message-text');
const statusImg = document.getElementById('status-image');

function createKeyboard() {
    keyboard.innerHTML = '';
    for (let i = 0; i <= 9; i++) {
        const btn = document.createElement('button');
        btn.innerText = i;
        btn.classList.add('key-btn');
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
    
    button.disabled = true;
    attemptsLeft--;
    displayAttempts.innerText = attemptsLeft;
    
    if (attemptsLeft <= 2) {
        displayAttempts.classList.add('critical');
    }
    
    if (attemptsLeft === 1) {
        attemptsContainer.classList.add('flash-critical');
    }

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
        showMessage("win");
    } else if (attemptsLeft === 0) {
        stopTimer();
        revealSecretCode();
        showMessage("lose");
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
    attemptsContainer.classList.remove('flash-critical');
    
    messagePanel.classList.add('hidden');
    statusImg.style.display = 'none';
    
    displayKey.forEach(el => {
        el.innerText = "*";
        el.classList.remove('revealed');
    });
    
    createKeyboard();
    startTimer();
}

function showMessage(status) {
    if (status === 'win') {
        messageText.innerText = `Clave descifrada con éxito.\n🎀¡Buen trabajo!🎀`;
        statusImg.src = 'feliz.jpg';
    } else {
        messageText.innerText = `💥La bomba ha explotado.💥\nLa clave era: ${secretCode.join('')}`;
        statusImg.src = 'triste.jpg';
    }

    statusImg.style.display = 'block';
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