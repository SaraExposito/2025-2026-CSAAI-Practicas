const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Configuración de pantalla
canvas.width = 800;
canvas.height = 600;

// --- 1. CARGA DE ACTIVOS ---
const imgNave = new Image();
imgNave.src = 'astronave.png';

const imgAlien = new Image();
imgAlien.src = 'extraterrestre.png';

// Sonidos (Asegúrate de tener estos archivos o usa rutas válidas)
const sndShoot = new Audio('https://actions.google.com/sounds/v1/science_fiction/alien_beam.ogg');
const sndExplosion = new Audio('https://actions.google.com/sounds/v1/science_fiction/low_f_pulse.ogg');

// --- 2. VARIABLES DE ESTADO ---
let score = 0;
let lives = 3;
let gameOver = false;
let victory = false;

// Caza Estelar
const player = {
    x: canvas.width / 2 - 25,
    y: canvas.height - 70,
    w: 50, h: 50,
    speed: 7,
    bullets: [],
    energy: 5,
    maxEnergy: 5,
    lastRegen: Date.now()
};

// Flota Alienígena (3 filas de 8)
const aliens = {
    rows: 3, cols: 8,
    w: 45, h: 45,
    list: [],
    dir: 1,
    baseSpeed: 1,
    bullets: [],
    lastShot: 0
};

// Inicializar formación
for (let r = 0; r < aliens.rows; r++) {
    for (let c = 0; c < aliens.cols; c++) {
        aliens.list.push({
            x: c * (aliens.w + 25) + 100,
            y: r * (aliens.h + 20) + 80,
            alive: true
        });
    }
}

// --- 3. CONTROLES ---
const keys = {};
window.onkeydown = (e) => {
    keys[e.code] = true;
    if (e.code === "Space") shoot();
};
window.onkeyup = (e) => keys[e.code] = false;

function shoot() {
    if (player.energy >= 1 && !gameOver && !victory) {
        player.bullets.push({ x: player.x + player.w/2 - 2, y: player.y, v: 8 });
        player.energy--;
        sndShoot.currentTime = 0;
        sndShoot.play();
    }
}

// --- 4. LÓGICA DE ACTUALIZACIÓN ---
function update() {
    if (gameOver || victory) return;

    // Movimiento Jugador
    if (keys["ArrowLeft"] && player.x > 0) player.x -= player.speed;
    if (keys["ArrowRight"] && player.x < canvas.width - player.w) player.x += player.speed;

    // Recarga Energía (0.5s)
    if (Date.now() - player.lastRegen > 500 && player.energy < player.maxEnergy) {
        player.energy++;
        player.lastRegen = Date.now();
    }

    // Aceleración y Movimiento Alien
    let aliveCount = aliens.list.filter(a => a.alive).length;
    if (aliveCount === 0) { victory = true; return; }

    let speedFactor = 1 + ( (24 - aliveCount) * 0.15 );
    let touchEdge = false;

    aliens.list.forEach(a => {
        if (!a.alive) return;
        a.x += (aliens.baseSpeed * speedFactor) * aliens.dir;
        if (a.x + aliens.w > canvas.width || a.x < 0) touchEdge = true;
        if (a.y + aliens.h >= player.y) gameOver = true; // Derrota por avance
    });

    if (touchEdge) {
        aliens.dir *= -1;
        aliens.list.forEach(a => a.y += 15);
    }

    // Disparos enemigos (Aleatorios)
    if (Date.now() - aliens.lastShot > 1000) {
        let shooters = aliens.list.filter(a => a.alive);
        let s = shooters[Math.floor(Math.random() * shooters.length)];
        if (s) aliens.bullets.push({ x: s.x + aliens.w/2, y: s.y + aliens.h, v: 5 });
        aliens.lastShot = Date.now();
    }

    handleCollisions();
}

function handleCollisions() {
    // Balas jugador -> Aliens
    player.bullets.forEach((b, bi) => {
        b.y -= b.v;
        aliens.list.forEach(a => {
            if (a.alive && b.x > a.x && b.x < a.x + aliens.w && b.y > a.y && b.y < a.y + aliens.h) {
                a.alive = false;
                player.bullets.splice(bi, 1);
                score += 10;
                sndExplosion.currentTime = 0;
                sndExplosion.play();
            }
        });
        if (b.y < 0) player.bullets.splice(bi, 1);
    });

    // Balas enemigos -> Jugador
    aliens.bullets.forEach((b, bi) => {
        b.y += b.v;
        if (b.x > player.x && b.x < player.x + player.w && b.y > player.y && b.y < player.y + player.h) {
            aliens.bullets.splice(bi, 1);
            lives--;
            if (lives <= 0) gameOver = true;
        }
        if (b.y > canvas.height) aliens.bullets.splice(bi, 1);
    });
}

// --- 5. RENDERIZADO ---
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Dibujar Astronave
    ctx.drawImage(imgNave, player.x, player.y, player.w, player.h);

    // Dibujar Extraterrestres
    aliens.list.forEach(a => {
        if (a.alive) ctx.drawImage(imgAlien, a.x, a.y, aliens.w, aliens.h);
    });

    // Proyectiles
    ctx.fillStyle = "white"; // Tus disparos
    player.bullets.forEach(b => ctx.fillRect(b.x, b.y, 4, 12));
    
    ctx.fillStyle = "red"; // Disparos enemigos
    aliens.bullets.forEach(b => ctx.fillRect(b.x, b.y, 4, 12));

    // HUD (Estilo Prof.)
    ctx.fillStyle = "white";
    ctx.font = "20px Arial";
    ctx.fillText(`Puntuación: ${score}`, 20, 40);
    ctx.fillText(`Vidas: ${lives}`, canvas.width - 120, 40);
    
    // Energía
    ctx.fillStyle = player.energy < 2 ? "red" : "#00FFCC";
    ctx.fillRect(20, 55, player.energy * 15, 8);

    if (victory || gameOver) {
        ctx.textAlign = "center";
        ctx.font = "bold 60px Arial";
        if (victory) {
            ctx.fillStyle = "#00FF00";
            ctx.fillText("VICTORY!", canvas.width/2, canvas.height/2);
        } else {
            ctx.fillStyle = "red";
            ctx.fillText("GAME OVER", canvas.width/2, canvas.height/2);
        }
    }
}

function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
}

// Arrancar cuando las imágenes carguen
imgNave.onload = () => {
    loop();
};