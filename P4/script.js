/* jshint esversion: 6 */
let currentLevelIdx = 0;
let currentPos = 0;
let seconds = 0;

let gameInterval = null; 
let prepTimeout = null; 
let timerInterval = null;

const grid = document.getElementById('grid');
const wordDisplay = document.getElementById('current-word');
const roundDisplay = document.getElementById('current-round-display');
const labelTime = document.getElementById('label-time');
const labelStatus = document.getElementById('label-status');
const btnStart = document.getElementById('btn-start');
const btnStop = document.getElementById('btn-stop');
const audio = document.getElementById('bg-music');

const levels = [
    { pattern: [1,1,1,1,0,0,0,0], speed: 4000 },
    { pattern: [0,1,0,1,0,1,0,1], speed: 3000 },
    { pattern: [1,0,1,0,1,0,1,0], speed: 2500 },
    { pattern: [0,0,1,1,0,0,1,1], speed: 1500 },
    { pattern: [1,0,0,1,0,1,1,0], speed: 900 }
];

function updateGrid() {
    const packNames = document.getElementById('select-pack').value.split('-');
    const pattern = levels[currentLevelIdx].pattern;
    const showTitles = document.getElementById('show-titles').checked;

    grid.innerHTML = '';
    pattern.forEach((typeIdx) => {
        const word = packNames[typeIdx];
        const item = document.createElement('div');
        
        const isFirstInPair = (word === packNames[0]);
        item.className = `grid-item ${isFirstInPair ? 'white-card' : ''}`;
        
        item.innerHTML = `
            <img src="${word}.jpg" alt="${word}">
            ${showTitles ? `<div class="item-label">${word}</div>` : ''}
        `;
        grid.appendChild(item);
    });
}

function startGame() {
    currentLevelIdx = parseInt(document.getElementById('select-level').value) - 1;
    seconds = 0;
    labelTime.innerText = "0.0s";
    
    toggleControls(true);
    labelStatus.innerText = "Jugando";

   
    audio.loop = true;
    audio.play();
    document.getElementById('btn-music').innerText = "🎵 Música: ON";
    
    startTimer();
    runRound();
}

function runRound() {
    if (currentLevelIdx >= 5) return finishGame();

    roundDisplay.innerText = `${currentLevelIdx + 1}/5`;
    wordDisplay.innerText = "¡PREPÁRATE!";
    updateGrid();

    prepTimeout = setTimeout(() => {
        currentPos = 0;
        gameInterval = setInterval(nextStep, levels[currentLevelIdx].speed);
    }, 1500);
}

function nextStep() {
    const items = document.querySelectorAll('.grid-item');
    items.forEach(it => it.classList.remove('active'));

    if (currentPos < 8) {
        items[currentPos].classList.add('active');
        const packNames = document.getElementById('select-pack').value.split('-');
        const wordIdx = levels[currentLevelIdx].pattern[currentPos];
        wordDisplay.innerText = packNames[wordIdx].toUpperCase();
        currentPos++;
    } else {
        clearInterval(gameInterval);
        currentLevelIdx++;
        runRound();
    }
}

function stopGame() {
    clearInterval(gameInterval);
    clearInterval(timerInterval);
    clearTimeout(prepTimeout);

    const items = document.querySelectorAll('.grid-item');
    items.forEach(it => it.classList.remove('active'));
    
    wordDisplay.innerText = "PULSA EMPEZAR";
    labelStatus.innerText = "En espera";
    
    toggleControls(false);
}

function finishGame() {
    stopGame();
    wordDisplay.innerText = "¡COMPLETADO!";
    labelStatus.innerText = "Finalizado";
}

function startTimer() {
    clearInterval(timerInterval);
    const startTime = Date.now();
    timerInterval = setInterval(() => {
        const delta = (Date.now() - startTime) / 1000;
        labelTime.innerText = delta.toFixed(1) + "s";
    }, 100);
}

function toggleControls(isPlaying) {
    btnStart.disabled = isPlaying;
    btnStop.disabled = !isPlaying;
    document.getElementById('select-level').disabled = isPlaying;
    document.getElementById('select-pack').disabled = isPlaying;
}

btnStart.addEventListener('click', startGame);
btnStop.addEventListener('click', stopGame); 


document.getElementById('btn-music').onclick = () => {
    if (audio.paused) {
        audio.loop = true;
        audio.play();
        document.getElementById('btn-music').innerText = "🎵 Música: ON";
    } else {
        audio.pause();
        document.getElementById('btn-music').innerText = "🎵 Música: OFF";
    }
};

document.getElementById('select-pack').onchange = updateGrid;


document.getElementById('btn-music').innerText = "🎵 Música: OFF";

updateGrid();