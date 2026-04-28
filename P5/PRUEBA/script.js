const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// --- CARGA DE IMÁGENES ---
const stadiumImg = new Image();
stadiumImg.src = 'fondo.jpg';

const atletiImg = new Image();
atletiImg.src = 'atletico-de-madrid.png';

const realImg = new Image();
realImg.src = 'real-madrid.png';

// --- CONFIGURACIÓN ---
const W = 1000, H = 600, MARGIN = 40, GOAL_SIZE = 160;
const GOAL_WIDTH = 30; // Un poco más anchas para que luzcan mejor

let state = {
    running: false,
    paused: true,
    playerScore: 0,
    botScore: 0,
    mode: '',
    keys: {}
};

let ball = { x: W/2, y: H/2, vx: 0, vy: 0, r: 10 };
let player = { x: 200, y: H/2, r: 22, color: '#2b58ad', angle: 0, team: 'blue', role: 'user' }; 
let partner = { x: 300, y: 450, r: 22, color: '#4da6c9', angle: 0, team: 'blue', role: 'defender' }; 
let bots = [
    { x: 800, y: 200, r: 22, color: '#cb3524', angle: Math.PI, team: 'red', role: 'striker' },
    { x: 750, y: 400, r: 22, color: '#cb3524', angle: Math.PI, team: 'red', role: 'defender' }
];

// --- NUEVA FUNCIÓN PARA LAS PORTERÍAS ---
function drawGoals() {
    const goalY = (H - GOAL_SIZE) / 2;

    // --- PORTERÍA IZQUIERDA (Atleti / Local) ---
    ctx.save();
    // Brillo Neón Cian
    ctx.shadowBlur = 20;
    ctx.shadowColor = '#00fbff';
    ctx.strokeStyle = '#00fbff';
    ctx.lineWidth = 6;
    
    // Marco exterior
    ctx.strokeRect(0, goalY, GOAL_WIDTH, GOAL_SIZE);
    
    // Dibujo de la red (malla)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 1;
    ctx.shadowBlur = 0; // Sin brillo para los hilos de la red
    ctx.beginPath();
    for (let i = 0; i <= GOAL_SIZE; i += 10) {
        ctx.moveTo(0, goalY + i);
        ctx.lineTo(GOAL_WIDTH, goalY + i);
    }
    for (let i = 0; i <= GOAL_WIDTH; i += 10) {
        ctx.moveTo(i, goalY);
        ctx.lineTo(i, goalY + GOAL_SIZE);
    }
    ctx.stroke();
    ctx.restore();

    // --- PORTERÍA DERECHA (Rival / Visitante) ---
    ctx.save();
    // Brillo Neón Rojo/Rosa
    ctx.shadowBlur = 20;
    ctx.shadowColor = '#ff004c';
    ctx.strokeStyle = '#ff004c';
    ctx.lineWidth = 6;
    
    // Marco exterior
    ctx.strokeRect(W - GOAL_WIDTH, goalY, GOAL_WIDTH, GOAL_SIZE);
    
    // Dibujo de la red (malla)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 1;
    ctx.shadowBlur = 0;
    ctx.beginPath();
    for (let i = 0; i <= GOAL_SIZE; i += 10) {
        ctx.moveTo(W - GOAL_WIDTH, goalY + i);
        ctx.lineTo(W, goalY + i);
    }
    for (let i = 0; i <= GOAL_WIDTH; i += 10) {
        ctx.moveTo(W - GOAL_WIDTH + i, goalY);
        ctx.lineTo(W - GOAL_WIDTH + i, goalY + GOAL_SIZE);
    }
    ctx.stroke();
    ctx.restore();
}

function draw() {
    ctx.clearRect(0, 0, W, H);
    
    // Dibujar Estadio
    ctx.drawImage(stadiumImg, 0, 0, W, H);
    
    // Dibujar Porterías Llamativas
    drawGoals();

    // Dibujar Balón
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI*2);
    ctx.fillStyle = 'white';
    ctx.fill();
    ctx.strokeStyle = 'black';
    ctx.stroke();
    ctx.closePath();

    // Dibujar Jugadores (User y Partner)
    drawBot(player, atletiImg);
    drawBot(partner, atletiImg);
    
    // Dibujar Bots Rivales
    bots.forEach(b => drawBot(b, realImg));
}

function drawBot(b, img) {
    ctx.save();
    ctx.translate(b.x, b.y);
    ctx.rotate(b.angle);
    
    // Aura de color debajo del bot para identificar equipo
    ctx.beginPath();
    ctx.arc(0, 0, b.r + 2, 0, Math.PI*2);
    ctx.fillStyle = b.team === 'blue' ? 'rgba(0, 150, 255, 0.3)' : 'rgba(255, 0, 0, 0.3)';
    ctx.fill();

    ctx.drawImage(img, -b.r, -b.r, b.r*2, b.r*2);
    ctx.restore();
}

// --- LÓGICA DE JUEGO (Simplificada para el ejemplo) ---
function update() {
    if (!state.running || state.paused) return;

    // Movimiento básico del balón
    ball.x += ball.vx;
    ball.y += ball.vy;
    ball.vx *= 0.98;
    ball.vy *= 0.98;

    // Colisiones bordes
    if (ball.y < 0 || ball.y > H) ball.vy *= -1;

    // Goles
    if (ball.x < 0) {
        if (ball.y > (H-GOAL_SIZE)/2 && ball.y < (H+GOAL_SIZE)/2) {
            goal('bot');
        } else {
            ball.vx *= -1;
            ball.x = 0;
        }
    }
    if (ball.x > W) {
        if (ball.y > (H-GOAL_SIZE)/2 && ball.y < (H+GOAL_SIZE)/2) {
            goal('player');
        } else {
            ball.vx *= -1;
            ball.x = W;
        }
    }
}

function goal(who) {
    if (who === 'player') state.playerScore++;
    else state.botScore++;
    
    document.getElementById('scoreboard').innerText = `${state.playerScore} - ${state.botScore}`;
    showGoalMessage();
}

function showGoalMessage() {
    const msg = document.getElementById('goalMessage');
    msg.classList.add('show');
    state.paused = true;
    setTimeout(() => {
        msg.classList.remove('show');
        if (!checkWin()) resetPositions();
    }, 1500);
}

function checkWin() {
    let won = false;
    if (state.mode === '3goles' && (state.playerScore >= 3 || state.botScore >= 3)) won = true;
    if (state.mode === 'goldenGoal' && (state.playerScore >= 1 || state.botScore >= 1)) won = true;
    if (won) {
        state.running = false;
        document.getElementById('endScreen').classList.add('active');
        document.getElementById('endResult').innerText = state.playerScore > state.botScore ? "¡EL ATLETI REINA EN MADRID!" : "VICTORIA BLANCA";
    }
    return won;
}

function resetPositions() {
    state.paused = false;
    ball = { x: W/2, y: H/2, vx: 0, vy: 0, r: 10 };
    player.x = 200; player.y = H/2;
    // ... resto de posiciones ...
}

function startGame(mode) {
    state.mode = mode;
    state.running = true;
    state.playerScore = 0;
    state.botScore = 0;
    document.getElementById('scoreboard').innerText = "0 - 0";
    document.getElementById('startScreen').classList.remove('active');
    document.getElementById('mode-label').innerText = "MODO: " + mode.toUpperCase();
    resetPositions();
}

function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
}

loop();