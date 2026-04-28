const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// --- CARGA DE IMÁGENES ---
const stadiumImg = new Image();
stadiumImg.src = 'fondo.jpg';

const atletiImg = new Image();
atletiImg.src = 'atletico-de-madrid.png';

const realImg = new Image();
realImg.src = 'real-madrid.png';
// -------------------------

const W = 1000, H = 600, MARGIN = 40, GOAL_SIZE = 160;

let state = {
    running: false,
    paused: true,
    playerScore: 0,
    botScore: 0,
    mode: '',
    keys: {}
};

let ball = { x: W/2, y: H/2, vx: 0, vy: 0, r: 10 };
// El color se mantiene como "fallback" por si la imagen tarda en cargar
let player = { x: 200, y: H/2, r: 22, color: '#2b58ad', angle: 0, team: 'blue', role: 'user' }; 
let partner = { x: 300, y: 450, r: 22, color: '#4da6c9', angle: 0, team: 'blue', role: 'defender' }; 
let bots = [
    { x: 800, y: 200, r: 22, color: '#cb3524', angle: Math.PI, team: 'red', role: 'aggressor' },
    { x: 750, y: 400, r: 22, color: '#cb3524', angle: Math.PI, team: 'red', role: 'defender' }
];

function update() {
    if (!state.running || state.paused) return;

    if (state.keys['ArrowUp']) player.y -= 5;
    if (state.keys['ArrowDown']) player.y += 5;
    if (state.keys['ArrowLeft']) player.x -= 5;
    if (state.keys['ArrowRight']) player.x += 5;
    if (state.keys['KeyA']) player.angle -= 0.1;
    if (state.keys['KeyD']) player.angle += 0.1;
    if (state.keys['Space']) shoot(player);

    let allPlayers = [player, partner, ...bots];

    allPlayers.forEach(e => {
        if (e.role !== 'user') moveAI(e); 
        e.x = Math.max(MARGIN + e.r, Math.min(W - MARGIN - e.r, e.x));
        e.y = Math.max(MARGIN + e.r, Math.min(H - MARGIN - e.r, e.y));
        checkBallCollision(e);
    });

    for (let i = 0; i < allPlayers.length; i++) {
        for (let j = i + 1; j < allPlayers.length; j++) {
            let dx = allPlayers[j].x - allPlayers[i].x;
            let dy = allPlayers[j].y - allPlayers[i].y;
            let dist = Math.hypot(dx, dy);
            if (dist < allPlayers[i].r + allPlayers[j].r) {
                let angle = Math.atan2(dy, dx);
                let overlap = (allPlayers[i].r + allPlayers[j].r) - dist;
                allPlayers[i].x -= Math.cos(angle) * overlap / 2;
                allPlayers[i].y -= Math.sin(angle) * overlap / 2;
                allPlayers[j].x += Math.cos(angle) * overlap / 2;
                allPlayers[j].y += Math.sin(angle) * overlap / 2;
            }
        }
    }

    ball.x += ball.vx; ball.y += ball.vy;
    ball.vx *= 0.98; ball.vy *= 0.98;

    if (ball.y < MARGIN + ball.r || ball.y > H - MARGIN - ball.r) {
        ball.vy *= -0.8;
        ball.y = ball.y < H/2 ? MARGIN + ball.r : H - MARGIN - ball.r;
    }

    const inGoalArea = ball.y > H/2 - GOAL_SIZE/2 && ball.y < H/2 + GOAL_SIZE/2;

    if (ball.x < MARGIN + ball.r) {
        if (inGoalArea) score('bot');
        else { ball.x = MARGIN + ball.r; ball.vx *= -0.8; }
    }
    if (ball.x > W - MARGIN - ball.r) {
        if (inGoalArea) score('player');
        else { ball.x = W - MARGIN - ball.r; ball.vx *= -0.8; }
    }
}

function moveAI(b) {
    let targetX, targetY;
    if (b.role === 'aggressor') {
        targetX = ball.x; targetY = ball.y;
    } else {
        let goalX = b.team === 'red' ? W - MARGIN : MARGIN;
        targetX = (ball.x + goalX) / 2; targetY = ball.y;
    }
    let dx = targetX - b.x;
    let dy = targetY - b.y;
    let dist = Math.hypot(dx, dy);
    if (dist > 5) {
        b.x += (dx / dist) * 3;
        b.y += (dy / dist) * 3;
    }
    b.angle = Math.atan2(ball.y - b.y, ball.x - b.x);
    if (Math.hypot(ball.x - b.x, ball.y - b.y) < b.r + ball.r + 5) {
        shoot(b);
    }
}

function checkBallCollision(e) {
    let dist = Math.hypot(ball.x - e.x, ball.y - e.y);
    if (dist < e.r + ball.r) {
        let angle = Math.atan2(ball.y - e.y, ball.x - e.x);
        ball.vx = Math.cos(angle) * 6;
        ball.vy = Math.sin(angle) * 6;
    }
}

function shoot(e) {
    let dist = Math.hypot(ball.x - e.x, ball.y - e.y);
    if (dist < e.r + ball.r + 20) {
        ball.vx = Math.cos(e.angle) * 15;
        ball.vy = Math.sin(e.angle) * 15;
    }
}

function draw() {
    ctx.clearRect(0, 0, W, H);
    
    ctx.drawImage(stadiumImg, 0, 0, W, H);
    
    ctx.fillStyle = "rgba(46, 125, 50, 0.3)";
    ctx.fillRect(0, 0, W, H);
    
    ctx.strokeStyle = "rgba(255, 255, 255, 0.8)"; 
    ctx.lineWidth = 3;
    ctx.strokeRect(MARGIN, MARGIN, W - MARGIN*2, H - MARGIN*2);
    ctx.beginPath(); ctx.moveTo(W/2, MARGIN); ctx.lineTo(W/2, H - MARGIN); ctx.stroke();
    ctx.beginPath(); ctx.arc(W/2, H/2, 80, 0, Math.PI*2); ctx.stroke();

    ctx.fillStyle = "#fff";
    ctx.fillRect(MARGIN - 5, H/2 - GOAL_SIZE/2, 5, GOAL_SIZE);
    ctx.fillRect(W - MARGIN, H/2 - GOAL_SIZE/2, 5, GOAL_SIZE);

    // --- DIBUJO DE JUGADORES CON ESCUDOS ---
    [player, partner, ...bots].forEach(e => {
        ctx.save();
        ctx.translate(e.x, e.y);
        ctx.rotate(e.angle);
        
        // Seleccionar imagen según equipo
        let img = e.team === 'blue' ? atletiImg : realImg;
        
        // Dibujamos el escudo (centrado en la posición del jugador)
        // Usamos el radio (e.r) para escalar la imagen proporcionalmente
        if (img.complete) {
            ctx.drawImage(img, -e.r, -e.r, e.r * 2, e.r * 2);
        } else {
            // Círculo de seguridad si la imagen no ha cargado
            ctx.fillStyle = e.color;
            ctx.beginPath(); ctx.arc(0, 0, e.r, 0, Math.PI*2); ctx.fill();
        }

        // Indicador de dirección (frente al escudo)
        ctx.fillStyle = "yellow";
        ctx.beginPath();
        ctx.moveTo(e.r, -5); ctx.lineTo(e.r + 12, 0); ctx.lineTo(e.r, 5);
        ctx.fill();
        
        ctx.restore();
    });

    ctx.fillStyle = "white";
    ctx.beginPath(); ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI*2); ctx.fill();
    ctx.strokeStyle = "black"; ctx.lineWidth = 1; ctx.stroke();
}

// ... (Resto de funciones startGame, score, checkWin, resetPositions, loop igual que antes)

function startGame(mode) {
    state.mode = mode;
    state.running = true;
    state.playerScore = 0;
    state.botScore = 0;
    document.getElementById('scoreboard').innerText = "0 - 0";
    document.getElementById('mode-label').innerText = "MODO: " + (mode === '3goles' ? "A 3 GOLES" : "GOL DE ORO");
    document.getElementById('startScreen').classList.remove('active');
    resetPositions();
}

function score(team) {
    state.paused = true;
    team === 'player' ? state.playerScore++ : state.botScore++;
    document.getElementById('scoreboard').innerText = `${state.playerScore} - ${state.botScore}`;
    let msg = document.getElementById('goalMessage');
    msg.innerText = team === 'player' ? "¡GOOOL DEL ATLETI!" : "¡GOL DEL MADRID!";
    msg.style.color = team === 'player' ? "#cb3524" : "#ffffff";
    msg.classList.add('show');
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
    state.paused = true;
    ball = { x: W/2, y: H/2, vx: 0, vy: 0, r: 10 };
    player.x = 200; player.y = H/2; player.angle = 0;
    partner.x = 300; partner.y = 450;
    bots[0].x = 800; bots[0].y = 200;
    bots[1].x = 750; bots[1].y = 400;

    let count = 3;
    let cdDiv = document.getElementById('countdown');
    let timer = setInterval(() => {
        cdDiv.innerText = count > 0 ? count : "¡DERBI!";
        if (count < 0) {
            clearInterval(timer);
            cdDiv.innerText = "";
            state.paused = false;
        }
        count--;
    }, 700);
}

window.addEventListener('keydown', e => state.keys[e.code] = true);
window.addEventListener('keyup', e => state.keys[e.code] = false);

function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
}
loop();