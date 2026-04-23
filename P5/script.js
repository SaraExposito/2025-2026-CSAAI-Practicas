// === ELEMENTOS DEL DOM ===
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const startScreen = document.getElementById('startScreen');
const endScreen = document.getElementById('endScreen');
const endMessage = document.getElementById('endMessage');
const endResult = document.getElementById('endResult');
const playerScoreSpan = document.getElementById('playerScore');
const botScoreSpan = document.getElementById('botScore');
const goalMessageDiv = document.getElementById('goalMessage');
const countdownDiv = document.getElementById('countdown');
const modeIndicator = document.getElementById('modeIndicator');

// === CONSTANTES DEL CAMPO ===
const FIELD = {
    W: 1000, H: 600,
    GOAL_LEFT_X: 20, GOAL_RIGHT_X: 980,
    GOAL_Y_TOP: 200, GOAL_Y_BOTTOM: 400
};

// === JUGADORES ===
const PLAYER_RADIUS = 16;
const BOT_RADIUS = 15;
const BALL_RADIUS = 8;

// Estado del juego
let gameRunning = false;
let gamePaused = false;      // Para cuenta atrás
let countdownValue = 3;
let countdownInterval = null;
let mode = '3goles';         // '3goles' o 'goldenGoal'
let playerScore = 0;
let botScore = 0;
let winnerDeclared = false;

// Objetos del juego
let player = { x: 200, y: 300, radius: PLAYER_RADIUS };
let ball = { x: 500, y: 300, vx: 0, vy: 0, radius: BALL_RADIUS };
let bots = [];

// Dirección de disparo (ratón)
let mouseX = 400, mouseY = 300;
let shootLineVisible = true;

// Teclas
const keys = {
    ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false,
    w: false, s: false, a: false, d: false
};

// === INICIALIZACIÓN ===
function initGame() {
    // Reset scores
    playerScore = 0;
    botScore = 0;
    updateScoreUI();
    winnerDeclared = false;
    gameRunning = true;
    gamePaused = true;  // espera cuenta atrás inicial
    startCountdown();
    
    // Posiciones iniciales
    player.x = 200;
    player.y = 300;
    ball.x = 500;
    ball.y = 300;
    ball.vx = 0;
    ball.vy = 0;
    
    // Crear bots (2 rivales + 1 compañero opcional pero lo hacemos 2 rivales fuertes)
    bots = [
        { x: 700, y: 250, radius: BOT_RADIUS, type: 'aggressive' },
        { x: 750, y: 400, radius: BOT_RADIUS, type: 'defensive' }
    ];
}

// Actualizar marcador
function updateScoreUI() {
    playerScoreSpan.textContent = playerScore;
    botScoreSpan.textContent = botScore;
}

// === CUENTA ATRÁS ===
function startCountdown() {
    if (countdownInterval) clearInterval(countdownInterval);
    gamePaused = true;
    countdownValue = 3;
    countdownDiv.textContent = countdownValue;
    countdownDiv.classList.add('show');
    
    countdownInterval = setInterval(() => {
        countdownValue--;
        if (countdownValue >= 1) {
            countdownDiv.textContent = countdownValue;
        } else {
            clearInterval(countdownInterval);
            countdownDiv.classList.remove('show');
            gamePaused = false;
            // Si el juego no está activo (terminado) no desbloquear movimiento
            if (!gameRunning || winnerDeclared) {
                gamePaused = true;
            }
        }
    }, 1000);
}

// === GOL ===
function goal(team) {
    if (!gameRunning || gamePaused || winnerDeclared) return false;
    
    if (team === 'player') {
        playerScore++;
        showGoalMessage('¡GOLAZO!');
    } else {
        botScore++;
        showGoalMessage('¡GOL RIVAL!');
    }
    updateScoreUI();
    
    // Comprobar fin del partido según modo
    let ended = false;
    if (mode === '3goles') {
        if (playerScore >= 3) {
            endGame('win', '¡HAS GANADO EL PARTIDO!');
            ended = true;
        } else if (botScore >= 3) {
            endGame('lose', 'HAS PERDIDO... LOS BOTS GANAN');
            ended = true;
        }
    } else if (mode === 'goldenGoal') {
        // Gol de oro: termina al primer gol
        if (playerScore > botScore) {
            endGame('win', '¡GOL DE ORO! ¡VICTORIA!');
            ended = true;
        } else if (botScore > playerScore) {
            endGame('lose', 'GOL DE ORO EN CONTRA... DERROTA');
            ended = true;
        }
    }
    
    if (!ended) {
        // Recolocar jugadores y pelota tras gol, y cuenta atrás
        player.x = 200;
        player.y = 300;
        ball.x = 500;
        ball.y = 300;
        ball.vx = 0;
        ball.vy = 0;
        // Recolocar bots en sus zonas
        bots[0].x = 700; bots[0].y = 250;
        bots[1].x = 750; bots[1].y = 400;
        startCountdown();
    }
    return true;
}

function showGoalMessage(msg) {
    goalMessageDiv.textContent = msg;
    goalMessageDiv.classList.remove('show');
    void goalMessageDiv.offsetWidth; // reiniciar animación
    goalMessageDiv.classList.add('show');
    setTimeout(() => {
        goalMessageDiv.classList.remove('show');
    }, 1000);
}

function endGame(result, message) {
    if (winnerDeclared) return;
    gameRunning = false;
    gamePaused = true;
    winnerDeclared = true;
    endMessage.textContent = message;
    endResult.textContent = result === 'win' ? '🏆 CAMPEÓN 🏆' : '💀 DERROTA 💀';
    endScreen.classList.add('active');
}

// === MOVIMIENTO DEL JUGADOR ===
function updatePlayerMovement() {
    if (gamePaused || !gameRunning) return;
    let moveX = 0, moveY = 0;
    if (keys.ArrowUp || keys.w) moveY -= 1;
    if (keys.ArrowDown || keys.s) moveY += 1;
    if (keys.ArrowLeft || keys.a) moveX -= 1;
    if (keys.ArrowRight || keys.d) moveX += 1;
    
    if (moveX !== 0 || moveY !== 0) {
        const len = Math.hypot(moveX, moveY);
        moveX /= len;
        moveY /= len;
    }
    const speed = 5;
    let newX = player.x + moveX * speed;
    let newY = player.y + moveY * speed;
    // Limites campo (con margen)
    newX = Math.min(Math.max(newX, PLAYER_RADIUS + 5), FIELD.W - PLAYER_RADIUS - 5);
    newY = Math.min(Math.max(newY, PLAYER_RADIUS + 5), FIELD.H - PLAYER_RADIUS - 5);
    player.x = newX;
    player.y = newY;
}

// === FÍSICA DE LA PELOTA ===
function updateBall() {
    if (gamePaused || !gameRunning) return;
    // Fricción
    ball.vx *= 0.98;
    ball.vy *= 0.98;
    if (Math.abs(ball.vx) < 0.1 && Math.abs(ball.vy) < 0.1) {
        ball.vx = 0;
        ball.vy = 0;
    }
    ball.x += ball.vx;
    ball.y += ball.vy;
    
    // Colisión con bordes (excepto puertas, las puertas se manejan aparte)
    // Rebote en laterales si no es gol
    if (ball.x - BALL_RADIUS < 0) {
        // Posible gol del rival (derecha es puerta del rival? El jugador está izq, rival derecha)
        // La portería izquierda es del jugador (anotaría el jugador si balón entra), la derecha del rival.
        if (ball.y > FIELD.GOAL_Y_TOP && ball.y < FIELD.GOAL_Y_BOTTOM) {
            // Gol del jugador (marcó en portería izquierda)
            goal('player');
            return;
        } else {
            ball.x = BALL_RADIUS;
            ball.vx = -ball.vx * 0.7;
        }
    }
    if (ball.x + BALL_RADIUS > FIELD.W) {
        if (ball.y > FIELD.GOAL_Y_TOP && ball.y < FIELD.GOAL_Y_BOTTOM) {
            goal('bot');
            return;
        } else {
            ball.x = FIELD.W - BALL_RADIUS;
            ball.vx = -ball.vx * 0.7;
        }
    }
    if (ball.y - BALL_RADIUS < 0) {
        ball.y = BALL_RADIUS;
        ball.vy = -ball.vy * 0.8;
    }
    if (ball.y + BALL_RADIUS > FIELD.H) {
        ball.y = FIELD.H - BALL_RADIUS;
        ball.vy = -ball.vy * 0.8;
    }
}

// === COLISIONES JUGADOR - PELOTA ===
function handleCollisions() {
    // Jugador vs balón
    const dxp = ball.x - player.x;
    const dyp = ball.y - player.y;
    const dist = Math.hypot(dxp, dyp);
    const minDist = PLAYER_RADIUS + BALL_RADIUS;
    if (dist < minDist) {
        const angle = Math.atan2(dyp, dxp);
        const force = 5;
        const overlap = minDist - dist;
        ball.x += Math.cos(angle) * overlap;
        ball.y += Math.sin(angle) * overlap;
        const speed = Math.hypot(ball.vx, ball.vy);
        ball.vx += Math.cos(angle) * force;
        ball.vy += Math.sin(angle) * force;
        // Limitar velocidad máxima
        const maxSpeed = 12;
        if (Math.abs(ball.vx) > maxSpeed) ball.vx = ball.vx > 0 ? maxSpeed : -maxSpeed;
        if (Math.abs(ball.vy) > maxSpeed) ball.vy = ball.vy > 0 ? maxSpeed : -maxSpeed;
    }
    
    // Bots vs pelota
    for (let bot of bots) {
        const dxb = ball.x - bot.x;
        const dyb = ball.y - bot.y;
        const distb = Math.hypot(dxb, dyb);
        if (distb < BOT_RADIUS + BALL_RADIUS) {
            const angle = Math.atan2(dyb, dxb);
            const overlap = (BOT_RADIUS + BALL_RADIUS) - distb;
            ball.x += Math.cos(angle) * overlap;
            ball.y += Math.sin(angle) * overlap;
            ball.vx += Math.cos(angle) * 4.5;
            ball.vy += Math.sin(angle) * 4.5;
            const maxSpeed = 10;
            if (Math.abs(ball.vx) > maxSpeed) ball.vx = ball.vx > 0 ? maxSpeed : -maxSpeed;
            if (Math.abs(ball.vy) > maxSpeed) ball.vy = ball.vy > 0 ? maxSpeed : -maxSpeed;
        }
    }
}

// === IA DE BOTS ===
function updateBots() {
    if (gamePaused || !gameRunning) return;
    for (let bot of bots) {
        // Movimiento hacia la pelota con comportamiento distinto
        let targetX = ball.x;
        let targetY = ball.y;
        if (bot.type === 'defensive') {
            // Se queda más cerca de su portería (derecha)
            targetX = Math.min(ball.x, FIELD.W - 150);
        }
        const dx = targetX - bot.x;
        const dy = targetY - bot.y;
        const dist = Math.hypot(dx, dy);
        if (dist > 0.5) {
            let speed = 2.8;
            if (bot.type === 'aggressive') speed = 3.2;
            const moveX = (dx / dist) * speed;
            const moveY = (dy / dist) * speed;
            bot.x += moveX;
            bot.y += moveY;
        }
        // Limitar dentro del campo
        bot.x = Math.min(Math.max(bot.x, BOT_RADIUS + 5), FIELD.W - BOT_RADIUS - 5);
        bot.y = Math.min(Math.max(bot.y, BOT_RADIUS + 5), FIELD.H - BOT_RADIUS - 5);
        
        // Evitar que los bots se solapen entre sí (simple)
        for (let other of bots) {
            if (other === bot) continue;
            const dxx = bot.x - other.x;
            const dyy = bot.y - other.y;
            const d = Math.hypot(dxx, dyy);
            const minD = BOT_RADIUS * 2;
            if (d < minD) {
                const angle = Math.atan2(dyy, dxx);
                const overlap = minD - d;
                bot.x += Math.cos(angle) * overlap * 0.5;
                bot.y += Math.sin(angle) * overlap * 0.5;
            }
        }
    }
}

// === DISPARO (CLICK) ===
function shoot(clickX, clickY) {
    if (gamePaused || !gameRunning) return;
    // Calcular vector desde jugador a click
    let dx = clickX - player.x;
    let dy = clickY - player.y;
    const len = Math.hypot(dx, dy);
    if (len < 0.1) return;
    dx /= len;
    dy /= len;
    // Potencia en función de distancia (máx 15)
    let power = Math.min(len / 20, 12);
    power = Math.max(3, power);
    // Si el balón está cerca, aplicamos el golpe
    const distToBall = Math.hypot(ball.x - player.x, ball.y - player.y);
    if (distToBall < PLAYER_RADIUS + BALL_RADIUS + 10) {
        ball.vx = dx * power;
        ball.vy = dy * power;
    }
}

// === DIBUJADO ===
function draw() {
    ctx.clearRect(0, 0, FIELD.W, FIELD.H);
    // Campo
    ctx.fillStyle = '#2e7d32';
    ctx.fillRect(0, 0, FIELD.W, FIELD.H);
    // Líneas
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(FIELD.W/2, 0); ctx.lineTo(FIELD.W/2, FIELD.H); ctx.stroke();
    ctx.beginPath(); ctx.arc(FIELD.W/2, FIELD.H/2, 50, 0, 2*Math.PI); ctx.stroke();
    ctx.beginPath(); ctx.rect(0, FIELD.GOAL_Y_TOP, 20, FIELD.GOAL_Y_BOTTOM-FIELD.GOAL_Y_TOP); ctx.stroke();
    ctx.beginPath(); ctx.rect(FIELD.W-20, FIELD.GOAL_Y_TOP, 20, FIELD.GOAL_Y_BOTTOM-FIELD.GOAL_Y_TOP); ctx.stroke();
    ctx.beginPath(); ctx.rect(0, 0, FIELD.W, FIELD.H); ctx.stroke();
    
    // Porterías sombreado
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.fillRect(0, FIELD.GOAL_Y_TOP, 20, FIELD.GOAL_Y_BOTTOM-FIELD.GOAL_Y_TOP);
    ctx.fillRect(FIELD.W-20, FIELD.GOAL_Y_TOP, 20, FIELD.GOAL_Y_BOTTOM-FIELD.GOAL_Y_TOP);
    
    // Pelota
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#f5c542';
    ctx.beginPath(); ctx.arc(ball.x, ball.y, BALL_RADIUS, 0, 2*Math.PI); ctx.fill();
    ctx.fillStyle = '#222';
    ctx.beginPath(); ctx.arc(ball.x, ball.y, BALL_RADIUS/2.5, 0, 2*Math.PI); ctx.fill();
    
    // Jugador
    ctx.fillStyle = '#1e88e5';
    ctx.shadowBlur = 5;
    ctx.beginPath(); ctx.arc(player.x, player.y, PLAYER_RADIUS, 0, 2*Math.PI); ctx.fill();
    ctx.fillStyle = 'white';
    ctx.beginPath(); ctx.arc(player.x-4, player.y-3, 3, 0, 2*Math.PI); ctx.fill();
    ctx.beginPath(); ctx.arc(player.x+4, player.y-3, 3, 0, 2*Math.PI); ctx.fill();
    
    // Bots
    for (let bot of bots) {
        ctx.fillStyle = '#e53935';
        ctx.beginPath(); ctx.arc(bot.x, bot.y, BOT_RADIUS, 0, 2*Math.PI); ctx.fill();
        ctx.fillStyle = '#880e4f';
        ctx.beginPath(); ctx.arc(bot.x-3, bot.y-3, 2.5, 0, 2*Math.PI); ctx.fill();
        ctx.beginPath(); ctx.arc(bot.x+3, bot.y-3, 2.5, 0, 2*Math.PI); ctx.fill();
    }
    
    // Línea de disparo
    if (!gamePaused && gameRunning) {
        ctx.beginPath();
        ctx.moveTo(player.x, player.y);
        ctx.lineTo(mouseX, mouseY);
        ctx.strokeStyle = 'rgba(255,255,0,0.8)';
        ctx.lineWidth = 3;
        ctx.setLineDash([5, 5]);
        ctx.stroke();
        ctx.setLineDash([]);
    }
    ctx.shadowBlur = 0;
}

// === EVENTOS DE TECLADO Y RATÓN ===
function handleKeyDown(e) {
    const key = e.key;
    if (keys.hasOwnProperty(key)) {
        keys[key] = true;
        e.preventDefault();
    }
}
function handleKeyUp(e) {
    const key = e.key;
    if (keys.hasOwnProperty(key)) {
        keys[key] = false;
        e.preventDefault();
    }
}
function handleMouseMove(e) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    let canvasX = (e.clientX - rect.left) * scaleX;
    let canvasY = (e.clientY - rect.top) * scaleY;
    canvasX = Math.min(Math.max(canvasX, 0), FIELD.W);
    canvasY = Math.min(Math.max(canvasY, 0), FIELD.H);
    mouseX = canvasX;
    mouseY = canvasY;
}
function handleCanvasClick(e) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    let clickX = (e.clientX - rect.left) * scaleX;
    let clickY = (e.clientY - rect.top) * scaleY;
    shoot(clickX, clickY);
}

// === BUCLE PRINCIPAL ===
function gameLoop() {
    if (!gamePaused && gameRunning && !winnerDeclared) {
        updatePlayerMovement();
        updateBots();
        updateBall();
        handleCollisions();
    }
    draw();
    requestAnimationFrame(gameLoop);
}

// === INICIO DESDE MENÚ ===
function startMatch(selectedMode) {
    mode = selectedMode;
    modeIndicator.textContent = mode === '3goles' ? 'Modo: Partido a 3 Goles' : 'Modo: Gol de Oro';
    startScreen.classList.remove('active');
    endScreen.classList.remove('active');
    initGame();
}

// Reiniciar desde fin
document.getElementById('restartBtn').addEventListener('click', () => {
    endScreen.classList.remove('active');
    startMatch(mode);
});
document.getElementById('menuBtn').addEventListener('click', () => {
    endScreen.classList.remove('active');
    startScreen.classList.add('active');
    gameRunning = false;
    gamePaused = true;
});

document.getElementById('mode3Goles').addEventListener('click', () => startMatch('3goles'));
document.getElementById('modeGoldenGoal').addEventListener('click', () => startMatch('goldenGoal'));

// Registrar eventos
window.addEventListener('load', () => {
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('click', handleCanvasClick);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    gameLoop();
    // Mostrar pantalla inicio por defecto
    startScreen.classList.add('active');
    gameRunning = false;
    gamePaused = true;
});