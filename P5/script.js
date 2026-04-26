const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const W = 1000, H = 600, MARGIN = 40, GOAL_SIZE = 160;
const BOUNCE_FACTOR = -0.7; 

let state = {
    running: false,
    paused: true,
    playerScore: 0,
    botScore: 0,
    mode: '',
    keys: {}
};

let ball = { x: W/2, y: H/2, vx: 0, vy: 0, r: 10 };
let player = { x: 200, y: H/2, r: 18, color: '#2b58ad', angle: 0, team: 'blue' }; 
let partner = { x: 300, y: 450, r: 18, color: '#4da6c9', angle: 0, team: 'blue' }; 
let bots = [
    { x: 800, y: 200, r: 18, color: '#cb3524', angle: Math.PI, team: 'red' },
    { x: 750, y: 400, r: 18, color: '#cb3524', angle: Math.PI, team: 'red' }
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
        if (e !== player) moveAI(e);
        e.x = Math.max(MARGIN + e.r, Math.min(W - MARGIN - e.r, e.x));
        e.y = Math.max(MARGIN + e.r, Math.min(H - MARGIN - e.r, e.y));
        checkBallCollision(e);
    });

    for (let i = 0; i < allPlayers.length; i++) {
        for (let j = i + 1; j < allPlayers.length; j++) {
            checkPlayerCollision(allPlayers[i], allPlayers[j]);
        }
    }

    ball.x += ball.vx; ball.y += ball.vy;
    ball.vx *= 0.985; ball.vy *= 0.985;

    // Rebote antibloqueo en esquinas (Fuerza física, no de IA)
    const inCornerX = ball.x < MARGIN + 15 || ball.x > W - MARGIN - 15;
    const inCornerY = ball.y < MARGIN + 15 || ball.y > H - MARGIN - 15;
    if (inCornerX && inCornerY) {
        ball.vx += (W/2 - ball.x) * 0.02;
        ball.vy += (H/2 - ball.y) * 0.02;
    }

    if (ball.y < MARGIN + ball.r || ball.y > H - MARGIN - ball.r) {
        ball.vy *= BOUNCE_FACTOR;
        ball.y = ball.y < H/2 ? MARGIN + ball.r : H - MARGIN - ball.r;
    }

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
    // 1. Siempre mirar al balón
    b.angle = Math.atan2(ball.y - b.y, ball.x - b.x);

    // 2. Calcular punto de ataque (detrás del balón)
    let offsetX = b.team === 'red' ? 35 : -35;
    let targetX = ball.x + offsetX;
    let targetY = ball.y;

    // 3. Si el balón está muy pegado a la banda, el target se ajusta para no salirse
    targetX = Math.max(MARGIN + 20, Math.min(W - MARGIN - 20, targetX));

    let dx = targetX - b.x;
    let dy = targetY - b.y;
    let distToTarget = Math.hypot(dx, dy);

    // 4. Lógica de movimiento: Solo se detienen si están muy cerca del objetivo
    // Se ha reducido el umbral para evitar que se queden "mirando"
    if (distToTarget > 5) {
        b.x += (dx / distToTarget) * 3;
        b.y += (dy / distToTarget) * 3;
    }
}

// --- Resto de funciones de colisión y dibujo iguales que antes ---
function checkPlayerCollision(p1, p2) {
    let dx = p2.x - p1.x, dy = p2.y - p1.y;
    let dist = Math.hypot(dx, dy);
    if (dist < p1.r + p2.r) {
        let angle = Math.atan2(dy, dx);
        let overlap = (p1.r + p2.r) - dist;
        p1.x -= Math.cos(angle) * (overlap/2);
        p1.y -= Math.sin(angle) * (overlap/2);
        p2.x += Math.cos(angle) * (overlap/2);
        p2.y += Math.sin(angle) * (overlap/2);
    }
}

function checkBallCollision(e) {
    let dist = Math.hypot(ball.x - e.x, ball.y - e.y);
    if (dist < e.r + ball.r) {
        let angle = Math.atan2(ball.y - e.y, ball.x - e.x);
        ball.vx = Math.cos(angle) * 7;
        ball.vy = Math.sin(angle) * 7;
    }
}

function shoot(e) {
    if (Math.hypot(ball.x - e.x, ball.y - e.y) < e.r + ball.r + 15) {
        ball.vx = Math.cos(e.angle) * 18;
        ball.vy = Math.sin(e.angle) * 18;
    }
}

function draw() {
    ctx.clearRect(0, 0, W, H);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.6)"; ctx.lineWidth = 3;
    ctx.strokeRect(MARGIN, MARGIN, W - MARGIN*2, H - MARGIN*2);
    ctx.beginPath(); ctx.moveTo(W/2, MARGIN); ctx.lineTo(W/2, H - MARGIN); ctx.stroke();
    ctx.beginPath(); ctx.arc(W/2, H/2, 70, 0, Math.PI*2); ctx.stroke();

    [player, partner, ...bots].forEach(e => {
        ctx.save();
        ctx.translate(e.x, e.y);
        ctx.rotate(e.angle);
        ctx.fillStyle = e.color;
        ctx.beginPath(); ctx.arc(0, 0, e.r, 0, Math.PI*2); ctx.fill();
        ctx.strokeStyle = "white"; ctx.lineWidth = 2; ctx.stroke();
        ctx.fillStyle = "white";
        ctx.beginPath(); ctx.moveTo(e.r-2, -5); ctx.lineTo(e.r+8, 0); ctx.lineTo(e.r-2, 5); ctx.fill();
        ctx.restore();
    });

    ctx.fillStyle = "white";
    ctx.beginPath(); ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI*2); ctx.fill();
}

function startGame(mode) {
    state.mode = mode; state.running = true;
    state.playerScore = 0; state.botScore = 0;
    document.getElementById('scoreboard').innerText = "0 - 0";
    document.getElementById('startScreen').classList.remove('active');
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
        if (!checkWin()) resetPositions();
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
    state.paused = true;
    ball = { x: W/2, y: H/2, vx: 0, vy: 0, r: 10 };
    player.x = 200; player.y = H/2; player.angle = 0;
    partner.x = 300; partner.y = 450; partner.angle = 0;
    bots[0].x = 800; bots[0].y = 200; bots[1].x = 750; bots[1].y = 400;
    let c = 3;
    let div = document.getElementById('countdown');
    div.innerText = c;
    let timer = setInterval(() => {
        c--;
        if (c > 0) div.innerText = c;
        else if (c === 0) div.innerText = "¡YA!";
        else { clearInterval(timer); div.innerText = ""; state.paused = false; }
    }, 800);
}

window.addEventListener('keydown', e => state.keys[e.code] = true);
window.addEventListener('keyup', e => state.keys[e.code] = false);
function loop() { update(); draw(); requestAnimationFrame(loop); }
loop();