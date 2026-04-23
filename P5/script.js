const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const W = 1000, H = 600, MARGIN = 40, GOAL_SIZE = 160;
const BOUNCE_FACTOR = -0.7; // El balón rebota y pierde un poco de fuerza

let state = {
    running: false,
    paused: true,
    playerScore: 0,
    botScore: 0,
    mode: '',
    keys: {}
};

// --- OBJETOS ---
let ball = { x: W/2, y: H/2, vx: 0, vy: 0, r: 10 };
let player = { x: 200, y: H/2, r: 18, color: '#2b58ad', angle: 0 }; // Tú
let partner = { x: 300, y: 400, r: 18, color: '#4da6c9', angle: 0 }; // Compañero
let bots = [
    { x: 800, y: 200, r: 18, color: '#9e2a2a', angle: Math.PI },
    { x: 750, y: 400, r: 18, color: '#9e2a2a', angle: Math.PI }
];

// --- FÍSICA Y REBOTES ---
function update() {
    if (!state.running || state.paused) return;

    // Movimiento jugador
    if (state.keys['ArrowUp']) player.y -= 5;
    if (state.keys['ArrowDown']) player.y += 5;
    if (state.keys['ArrowLeft']) player.x -= 5;
    if (state.keys['ArrowRight']) player.x += 5;
    if (state.keys['KeyA']) player.angle -= 0.1;
    if (state.keys['KeyD']) player.angle += 0.1;
    if (state.keys['Space']) shoot(player);

    // IA y Límites para todos
    [player, partner, ...bots].forEach(e => {
        if (e !== player) moveAI(e);
        // Bloqueo en paredes blancas
        e.x = Math.max(MARGIN + e.r, Math.min(W - MARGIN - e.r, e.x));
        e.y = Math.max(MARGIN + e.r, Math.min(H - MARGIN - e.r, e.y));
        checkBallCollision(e);
    });

    // Movimiento balón
    ball.x += ball.vx; ball.y += ball.vy;
    ball.vx *= 0.985; ball.vy *= 0.985; // Fricción

    // EFECTO REBOTE BALÓN
    if (ball.y < MARGIN + ball.r) { ball.y = MARGIN + ball.r; ball.vy *= BOUNCE_FACTOR; }
    if (ball.y > H - MARGIN - ball.r) { ball.y = H - MARGIN - ball.r; ball.vy *= BOUNCE_FACTOR; }

    // Detección de GOL o REBOTE en laterales
    const inGoalArea = ball.y > H/2 - GOAL_SIZE/2 && ball.y < H/2 + GOAL_SIZE/2;

    if (ball.x < MARGIN + ball.r) {
        if (inGoalArea) score('bot');
        else { ball.x = MARGIN + ball.r; ball.vx *= BOUNCE_FACTOR; }
    }
    if (ball.x > W - MARGIN - ball.r) {
        if (inGoalArea) score('player');
        else { ball.x = W - MARGIN - ball.r; ball.vx *= BOUNCE_FACTOR; }
    }
}

function moveAI(b) {
    let dx = ball.x - b.x;
    let dy = ball.y - b.y;
    let dist = Math.hypot(dx, dy);
    b.angle = Math.atan2(dy, dx);
    if (dist > 10) {
        b.x += Math.cos(b.angle) * 2.5;
        b.y += Math.sin(b.angle) * 2.5;
    }
}

function checkBallCollision(e) {
    let dx = ball.x - e.x;
    let dy = ball.y - e.y;
    let dist = Math.hypot(dx, dy);
    if (dist < e.r + ball.r) {
        let angle = Math.atan2(dy, dx);
        ball.vx = Math.cos(angle) * 5;
        ball.vy = Math.sin(angle) * 5;
    }
}

function shoot(e) {
    let dist = Math.hypot(ball.x - e.x, ball.y - e.y);
    if (dist < e.r + ball.r + 10) {
        ball.vx = Math.cos(e.angle) * 15;
        ball.vy = Math.sin(e.angle) * 15;
    }
}

// --- DIBUJO ---
function draw() {
    ctx.clearRect(0, 0, W, H);
    
    // Campo
    ctx.strokeStyle = "white"; ctx.lineWidth = 4;
    ctx.strokeRect(MARGIN, MARGIN, W - MARGIN*2, H - MARGIN*2);
    ctx.beginPath(); ctx.moveTo(W/2, MARGIN); ctx.lineTo(W/2, H - MARGIN); ctx.stroke();
    ctx.beginPath(); ctx.arc(W/2, H/2, 60, 0, Math.PI*2); ctx.stroke();

    // Porterías
    ctx.strokeRect(MARGIN - 25, H/2 - GOAL_SIZE/2, 25, GOAL_SIZE); // Izquierda
    ctx.strokeRect(W - MARGIN, H/2 - GOAL_SIZE/2, 25, GOAL_SIZE);   // Derecha

    // Jugadores
    [player, partner, ...bots].forEach(e => {
        ctx.save();
        ctx.translate(e.x, e.y);
        ctx.rotate(e.angle);
        ctx.fillStyle = e.color;
        ctx.beginPath(); ctx.arc(0, 0, e.r, 0, Math.PI*2); ctx.fill();
        ctx.stroke();
        // Pico de dirección
        ctx.fillStyle = "white";
        ctx.beginPath(); ctx.moveTo(e.r-2, -5); ctx.lineTo(e.r+8, 0); ctx.lineTo(e.r-2, 5); ctx.fill();
        ctx.restore();
    });

    // Balón
    ctx.fillStyle = "white";
    ctx.beginPath(); ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI*2); ctx.fill();
}

// --- SISTEMA DE JUEGO ---
function startGame(mode) {
    state.mode = mode;
    state.running = true;
    state.playerScore = 0; state.botScore = 0;
    document.getElementById('startScreen').classList.remove('active');
    document.getElementById('mode-label').innerText = mode === '3goles' ? "Modo: 3 Goles" : "Modo: Gol de Oro";
    resetPositions();
}

function score(team) {
    state.paused = true;
    team === 'player' ? state.playerScore++ : state.botScore++;
    document.getElementById('scoreboard').innerText = `${state.playerScore} - ${state.botScore}`;
    
    let msg = document.getElementById('goalMessage');
    msg.innerText = team === 'player' ? "¡GOOOL!" : "¡GOL RIVAL!";
    msg.classList.add('show');

    setTimeout(() => {
        msg.classList.remove('show');
        if (checkWin()) return;
        resetPositions();
    }, 1500);
}

function checkWin() {
    let win = (state.mode === '3goles' && (state.playerScore >= 3 || state.botScore >= 3)) || 
              (state.mode === 'goldenGoal' && (state.playerScore > 0 || state.botScore > 0));
    if (win) {
        state.running = false;
        document.getElementById('endScreen').classList.add('active');
        document.getElementById('endResult').innerText = state.playerScore > state.botScore ? "¡HAS GANADO!" : "DERROTA...";
    }
    return win;
}

function resetPositions() {
    ball = { x: W/2, y: H/2, vx: 0, vy: 0, r: 10 };
    player.x = 200; player.y = H/2;
    state.paused = true;
    
    let c = 3;
    let div = document.getElementById('countdown');
    let timer = setInterval(() => {
        div.innerText = c > 0 ? c : "¡YA!";
        if (c < 0) { clearInterval(timer); div.innerText = ""; state.paused = false; }
        c--;
    }, 800);
}

window.addEventListener('keydown', e => state.keys[e.code] = true);
window.addEventListener('keyup', e => state.keys[e.code] = false);

function loop() { update(); draw(); requestAnimationFrame(loop); }
loop();