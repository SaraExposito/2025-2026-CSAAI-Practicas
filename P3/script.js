const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
canvas.width = 800;
canvas.height = 600;

// --- Configuración y Estado ---
let score = 0;
let lives = 3;
let energy = 100; // Carga máxima
const energyCost = 20; // Coste por disparo
const energyRegen = 0.5; // Recuperación por frame (~30/seg)

let gameRunning = true;

// Controles
const keys = {};
window.addEventListener("keydown", e => keys[e.code] = true);
window.addEventListener("keyup", e => keys[e.code] = false);

// --- Entidades ---
const player = {
    x: canvas.width / 2 - 25,
    y: canvas.height - 60,
    w: 50,
    h: 30,
    speed: 7
};

let bullets = [];
let enemyBullets = [];
let aliens = [];
let explosions = [];

// Crear flota inicial (3 filas x 8 alienígenas)
function createAliens() {
    for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 8; col++) {
            aliens.push({
                x: 100 + col * 70,
                y: 50 + row * 50,
                w: 40,
                h: 30,
                alive: true
            });
        }
    }
}
createAliens();

let alienSpeed = 1;
let alienDirection = 1;

// --- Funciones de Lógica ---

function update() {
    if (!gameRunning) return;

    // Movimiento Jugador
    if (keys["ArrowLeft"] && player.x > 0) player.x -= player.speed;
    if (keys["ArrowRight"] && player.x < canvas.width - player.w) player.x += player.speed;

    // Disparo (Barra espaciadora + Gestión de Energía)
    if (keys["Space"] && energy >= energyCost) {
        bullets.push({ x: player.x + player.w / 2 - 2, y: player.y, w: 4, h: 10 });
        energy -= energyCost;
        keys["Space"] = false; // Evita ráfaga infinita si se deja pulsado
        // Aquí dispararías el sonido de antimateria
    }
    
    // Recarga de Energía
    if (energy < 100) energy = Math.min(100, energy + energyRegen);
    document.getElementById("energy-fill").style.width = energy + "%";

    // Movimiento Alienígenas + Aumento de Velocidad
    let touchEdge = false;
    const currentSpeed = alienSpeed + (24 - aliens.length) * 0.15; // Más rápido cuantos menos queden

    aliens.forEach(a => {
        a.x += currentSpeed * alienDirection;
        if (a.x <= 0 || a.x >= canvas.width - a.w) touchEdge = true;
    });

    if (touchEdge) {
        alienDirection *= -1;
        aliens.forEach(a => a.y += 10);
    }

    // Disparo Enemigo Aleatorio (~1 por segundo)
    if (Math.random() < 0.02 && aliens.length > 0) {
        const shooter = aliens[Math.floor(Math.random() * aliens.length)];
        enemyBullets.push({ x: shooter.x + shooter.w/2, y: shooter.y, w: 4, h: 10 });
    }

    // Colisiones Proyectiles -> Alien
    bullets.forEach((b, bi) => {
        b.y -= 10;
        aliens.forEach((a, ai) => {
            if (b.x < a.x + a.w && b.x + b.w > a.x && b.y < a.y + a.h && b.y + b.h > a.y) {
                aliens.splice(ai, 1);
                bullets.splice(bi, 1);
                score += 10;
                document.getElementById("score").innerText = score;
                // Activar explosión por 15 frames (aquí simplificado)
            }
        });
    });

    // Colisiones Enemigo -> Jugador
    enemyBullets.forEach((eb, ebi) => {
        eb.y += 5;
        if (eb.x < player.x + player.w && eb.x + eb.w > player.x && eb.y < player.y + player.h && eb.y + eb.h > player.y) {
            enemyBullets.splice(ebi, 1);
            lives--;
            document.getElementById("lives").innerText = lives;
            if (lives <= 0) endGame(false);
        }
    });

    // Condición de Victoria
    if (aliens.length === 0) endGame(true);
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Dibujar Jugador
    ctx.fillStyle = "#00ffcc";
    ctx.fillRect(player.x, player.y, player.w, player.h);

    // Dibujar Balas
    ctx.fillStyle = "yellow";
    bullets.forEach(b => ctx.fillRect(b.x, b.y, b.w, b.h));

    // Dibujar Balas Enemigas
    ctx.fillStyle = "red";
    enemyBullets.forEach(eb => ctx.fillRect(eb.x, eb.y, eb.w, eb.h));

    // Dibujar Aliens
    ctx.fillStyle = "#ff00ff";
    aliens.forEach(a => ctx.fillRect(a.x, a.y, a.w, a.h));
}

function endGame(win) {
    gameRunning = false;
    alert(win ? "¡VICTORIA EN CANVA CENTAURI!" : "GAME OVER: La humanidad ha caído.");
    location.reload();
}

function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
}

loop();