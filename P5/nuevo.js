const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreDisplay = document.getElementById('scoreboard');
const modeLabel = document.getElementById('mode-label');
const goalMessage = document.getElementById('goalMessage');

// Configuración del juego
let gameActive = false;
let gameMode = '';
let score = { player: 0, cpu: 0 };
let countdownActive = false;

// Entidades
const ball = {
    x: 500, y: 300, radius: 12, 
    dx: 0, dy: 0, friction: 0.985
};

const player = {
    x: 200, y: 300, radius: 25, 
    angle: 0, speed: 0, maxSpeed: 4, 
    color: '#ffffff', accent: '#cb3524'
};

const cpu = {
    x: 800, y: 300, radius: 25, 
    angle: Math.PI, speed: 3, 
    color: '#1a1a1a', accent: '#cb3524'
};

// Controles
const keys = {};
window.addEventListener('keydown', e => keys[e.code] = true);
window.addEventListener('keyup', e => keys[e.code] = false);

function startGame(mode) {
    gameMode = mode;
    modeLabel.innerText = `Modo: ${mode === '3goles' ? 'Primero a 3' : 'Gol de Oro'}`;
    document.getElementById('startScreen').classList.remove('active');
    resetPositions();
    startCountdown();
}

function startCountdown() {
    let count = 3;
    const cdDiv = document.getElementById('countdown');
    countdownActive = true;
    
    const interval = setInterval(() => {
        cdDiv.innerText = count > 0 ? count : "¡VAMOS!";
        if (count < 0) {
            clearInterval(interval);
            cdDiv.innerText = "";
            countdownActive = false;
            gameActive = true;
        }
        count--;
    }, 1000);
}

function resetPositions() {
    ball.x = canvas.width / 2;
    ball.y = canvas.height / 2;
    ball.dx = 0; ball.dy = 0;
    
    player.x = 150; player.y = 300; player.angle = 0;
    cpu.x = 850; cpu.y = 300; cpu.angle = Math.PI;
}

function update() {
    if (!gameActive || countdownActive) return;

    // Movimiento Jugador
    if (keys['ArrowUp']) player.speed = Math.min(player.speed + 0.2, player.maxSpeed);
    else if (keys['ArrowDown']) player.speed = Math.max(player.speed - 0.2, -player.maxSpeed / 2);
    else player.speed *= 0.9;

    if (keys['KeyA']) player.angle -= 0.08;
    if (keys['KeyD']) player.angle += 0.08;

    player.x += Math.cos(player.angle) * player.speed;
    player.y += Math.sin(player.angle) * player.speed;

    // IA Simple (Sigue el balón)
    const dx = ball.x - cpu.x;
    const dy = ball.y - cpu.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > 10) {
        cpu.x += (dx / dist) * 2.5;
        cpu.y += (dy / dist) * 2.5;
    }

    // Colisiones con bordes (Jugadores)
    [player, cpu].forEach(p => {
        p.x = Math.max(p.radius, Math.min(canvas.width - p.radius, p.x));
        p.y = Math.max(p.radius, Math.min(canvas.height - p.radius, p.y));
    });

    // Física del Balón
    ball.x += ball.dx;
    ball.y += ball.dy;
    ball.dx *= ball.friction;
    ball.dy *= ball.friction;

    // Rebote Paredes Balón
    if (ball.y <= ball.radius || ball.y >= canvas.height - ball.radius) ball.dy *= -0.8;
    
    // Goles (Porterías de 150px a 450px de altura)
    if (ball.x <= ball.radius) {
        if (ball.y > 200 && ball.y < 400) goal('cpu');
        else ball.dx *= -0.8;
    }
    if (ball.x >= canvas.width - ball.radius) {
        if (ball.y > 200 && ball.y < 400) goal('player');
        else ball.dx *= -0.8;
    }

    // Colisiones Círculo-Círculo (Jugador-Balón)
    checkBallCollision(player);
    checkBallCollision(cpu);

    // Chute especial
    if (keys['Space'] && getDistance(player, ball) < player.radius + ball.radius + 10) {
        ball.dx = Math.cos(player.angle) * 10;
        ball.dy = Math.sin(player.angle) * 10;
    }
}

function checkBallCollision(p) {
    const dist = getDistance(p, ball);
    if (dist < p.radius + ball.radius) {
        const angle = Math.atan2(ball.y - p.y, ball.x - p.x);
        const force = 5;
        ball.dx = Math.cos(angle) * force;
        ball.dy = Math.sin(angle) * force;
    }
}

function getDistance(a, b) {
    return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

function goal(winner) {
    gameActive = false;
    winner === 'player' ? score.player++ : score.cpu++;
    scoreDisplay.innerText = `${score.player} - ${score.cpu}`;
    
    goalMessage.classList.add('show');
    
    setTimeout(() => {
        goalMessage.classList.remove('show');
        checkEndGame();
    }, 2000);
}

function checkEndGame() {
    let finished = false;
    if (gameMode === 'goldenGoal') finished = true;
    if (gameMode === '3goles' && (score.player === 3 || score.cpu === 3)) finished = true;

    if (finished) {
        document.getElementById('endScreen').classList.add('active');
        document.getElementById('endResult').innerText = 
            score.player > score.cpu ? "¡VICTORIA!" : "DERROTA...";
    } else {
        resetPositions();
        startCountdown();
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Campo (Líneas blancas)
    ctx.strokeStyle = "rgba(255,255,255,0.3)";
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, canvas.width, canvas.height);
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.stroke();
    
    // Porterías
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.fillRect(0, 200, 10, 200);
    ctx.fillRect(canvas.width - 10, 200, 10, 200);

    // Dibujar Balón
    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Dibujar Bots
    [player, cpu].forEach(p => {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);
        
        // Cuerpo
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = p.accent;
        ctx.lineWidth = 3;
        ctx.stroke();

        // "Ojos" o dirección
        ctx.fillStyle = p.accent;
        ctx.fillRect(10, -10, 10, 20);
        
        ctx.restore();
    });

    update();
    requestAnimationFrame(draw);
}

draw();const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreDisplay = document.getElementById('scoreboard');
const modeLabel = document.getElementById('mode-label');
const goalMessage = document.getElementById('goalMessage');

// Configuración del juego
let gameActive = false;
let gameMode = '';
let score = { player: 0, cpu: 0 };
let countdownActive = false;

// Entidades
const ball = {
    x: 500, y: 300, radius: 12, 
    dx: 0, dy: 0, friction: 0.985
};

const player = {
    x: 200, y: 300, radius: 25, 
    angle: 0, speed: 0, maxSpeed: 4, 
    color: '#ffffff', accent: '#cb3524'
};

const cpu = {
    x: 800, y: 300, radius: 25, 
    angle: Math.PI, speed: 3, 
    color: '#1a1a1a', accent: '#cb3524'
};

// Controles
const keys = {};
window.addEventListener('keydown', e => keys[e.code] = true);
window.addEventListener('keyup', e => keys[e.code] = false);

function startGame(mode) {
    gameMode = mode;
    modeLabel.innerText = `Modo: ${mode === '3goles' ? 'Primero a 3' : 'Gol de Oro'}`;
    document.getElementById('startScreen').classList.remove('active');
    resetPositions();
    startCountdown();
}

function startCountdown() {
    let count = 3;
    const cdDiv = document.getElementById('countdown');
    countdownActive = true;
    
    const interval = setInterval(() => {
        cdDiv.innerText = count > 0 ? count : "¡VAMOS!";
        if (count < 0) {
            clearInterval(interval);
            cdDiv.innerText = "";
            countdownActive = false;
            gameActive = true;
        }
        count--;
    }, 1000);
}

function resetPositions() {
    ball.x = canvas.width / 2;
    ball.y = canvas.height / 2;
    ball.dx = 0; ball.dy = 0;
    
    player.x = 150; player.y = 300; player.angle = 0;
    cpu.x = 850; cpu.y = 300; cpu.angle = Math.PI;
}

function update() {
    if (!gameActive || countdownActive) return;

    // Movimiento Jugador
    if (keys['ArrowUp']) player.speed = Math.min(player.speed + 0.2, player.maxSpeed);
    else if (keys['ArrowDown']) player.speed = Math.max(player.speed - 0.2, -player.maxSpeed / 2);
    else player.speed *= 0.9;

    if (keys['KeyA']) player.angle -= 0.08;
    if (keys['KeyD']) player.angle += 0.08;

    player.x += Math.cos(player.angle) * player.speed;
    player.y += Math.sin(player.angle) * player.speed;

    // IA Simple (Sigue el balón)
    const dx = ball.x - cpu.x;
    const dy = ball.y - cpu.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > 10) {
        cpu.x += (dx / dist) * 2.5;
        cpu.y += (dy / dist) * 2.5;
    }

    // Colisiones con bordes (Jugadores)
    [player, cpu].forEach(p => {
        p.x = Math.max(p.radius, Math.min(canvas.width - p.radius, p.x));
        p.y = Math.max(p.radius, Math.min(canvas.height - p.radius, p.y));
    });

    // Física del Balón
    ball.x += ball.dx;
    ball.y += ball.dy;
    ball.dx *= ball.friction;
    ball.dy *= ball.friction;

    // Rebote Paredes Balón
    if (ball.y <= ball.radius || ball.y >= canvas.height - ball.radius) ball.dy *= -0.8;
    
    // Goles (Porterías de 150px a 450px de altura)
    if (ball.x <= ball.radius) {
        if (ball.y > 200 && ball.y < 400) goal('cpu');
        else ball.dx *= -0.8;
    }
    if (ball.x >= canvas.width - ball.radius) {
        if (ball.y > 200 && ball.y < 400) goal('player');
        else ball.dx *= -0.8;
    }

    // Colisiones Círculo-Círculo (Jugador-Balón)
    checkBallCollision(player);
    checkBallCollision(cpu);

    // Chute especial
    if (keys['Space'] && getDistance(player, ball) < player.radius + ball.radius + 10) {
        ball.dx = Math.cos(player.angle) * 10;
        ball.dy = Math.sin(player.angle) * 10;
    }
}

function checkBallCollision(p) {
    const dist = getDistance(p, ball);
    if (dist < p.radius + ball.radius) {
        const angle = Math.atan2(ball.y - p.y, ball.x - p.x);
        const force = 5;
        ball.dx = Math.cos(angle) * force;
        ball.dy = Math.sin(angle) * force;
    }
}

function getDistance(a, b) {
    return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

function goal(winner) {
    gameActive = false;
    winner === 'player' ? score.player++ : score.cpu++;
    scoreDisplay.innerText = `${score.player} - ${score.cpu}`;
    
    goalMessage.classList.add('show');
    
    setTimeout(() => {
        goalMessage.classList.remove('show');
        checkEndGame();
    }, 2000);
}

function checkEndGame() {
    let finished = false;
    if (gameMode === 'goldenGoal') finished = true;
    if (gameMode === '3goles' && (score.player === 3 || score.cpu === 3)) finished = true;

    if (finished) {
        document.getElementById('endScreen').classList.add('active');
        document.getElementById('endResult').innerText = 
            score.player > score.cpu ? "¡VICTORIA!" : "DERROTA...";
    } else {
        resetPositions();
        startCountdown();
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Campo (Líneas blancas)
    ctx.strokeStyle = "rgba(255,255,255,0.3)";
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, canvas.width, canvas.height);
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.stroke();
    
    // Porterías
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.fillRect(0, 200, 10, 200);
    ctx.fillRect(canvas.width - 10, 200, 10, 200);

    // Dibujar Balón
    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Dibujar Bots
    [player, cpu].forEach(p => {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);
        
        // Cuerpo
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = p.accent;
        ctx.lineWidth = 3;
        ctx.stroke();

        // "Ojos" o dirección
        ctx.fillStyle = p.accent;
        ctx.fillRect(10, -10, 10, 20);
        
        ctx.restore();
    });

    update();
    requestAnimationFrame(draw);
}

draw();