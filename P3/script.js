const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = 800;
canvas.height = 600;


const stars = [];
for (let i = 0; i < 150; i++) {
    stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 2,
        opacity: Math.random()
    });
}


const imgNave = new Image();
imgNave.src = 'astronave.png';

const imgAlien = new Image();
imgAlien.src = 'extraterrestre.png';

const sndShoot = new Audio('https://actions.google.com/sounds/v1/science_fiction/alien_beam.ogg');
const sndExplosion = new Audio('https://actions.google.com/sounds/v1/science_fiction/low_f_pulse.ogg');

let score = 0;
let lives = 3;
let gameOver = false;
let victory = false;

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

const aliens = {
    rows: 3, cols: 8,
    w: 45, h: 45,
    list: [],
    dir: 1,
    baseSpeed: 1,
    bullets: [],
    lastShot: 0
};

for (let r = 0; r < aliens.rows; r++) {
    for (let c = 0; c < aliens.cols; c++) {
        aliens.list.push({
            x: c * (aliens.w + 25) + 100,
            y: r * (aliens.h + 20) + 80,
            alive: true
        });
    }
}

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

function update() {
    if (gameOver || victory) return;
    
    if (keys["ArrowLeft"] && player.x > 0) player.x -= player.speed;
    if (keys["ArrowRight"] && player.x < canvas.width - player.w) player.x += player.speed;

    if (Date.now() - player.lastRegen > 500 && player.energy < player.maxEnergy) {
        player.energy++;
        player.lastRegen = Date.now();
    }

    let aliveCount = aliens.list.filter(a => a.alive).length;
    if (aliveCount === 0) { victory = true; return; }

    let speedFactor = 1 + ( (24 - aliveCount) * 0.15 );
    let touchEdge = false;

    aliens.list.forEach(a => {
        if (!a.alive) return;
        a.x += (aliens.baseSpeed * speedFactor) * aliens.dir;
        if (a.x + aliens.w > canvas.width || a.x < 0) touchEdge = true;
        if (a.y + aliens.h >= player.y) gameOver = true;
    });

    if (touchEdge) {
        aliens.dir *= -1;
        aliens.list.forEach(a => a.y += 15);
    }

    if (Date.now() - aliens.lastShot > 1000) {
        let shooters = aliens.list.filter(a => a.alive);
        let s = shooters[Math.floor(Math.random() * shooters.length)];
        if (s) aliens.bullets.push({ x: s.x + aliens.w/2, y: s.y + aliens.h, v: 5 });
        aliens.lastShot = Date.now();
    }

    handleCollisions();
}

function handleCollisions() {
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

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    
    ctx.fillStyle = "white";
    stars.forEach(s => {
        ctx.globalAlpha = s.opacity; // Variar opacidad para efecto de brillo
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fill();
    });
    ctx.globalAlpha = 1.0; 

    ctx.drawImage(imgNave, player.x, player.y, player.w, player.h);

    aliens.list.forEach(a => {
        if (a.alive) ctx.drawImage(imgAlien, a.x, a.y, aliens.w, aliens.h);
    });

    ctx.fillStyle = "white"; 
    player.bullets.forEach(b => ctx.fillRect(b.x, b.y, 4, 12));
    
    ctx.fillStyle = "red"; 
    aliens.bullets.forEach(b => ctx.fillRect(b.x, b.y, 4, 12));

    ctx.fillStyle = "white";
    ctx.font = "20px Arial";
    ctx.textAlign = "left";
    ctx.fillText(`Puntuación: ${score}`, 20, 40);
    ctx.textAlign = "right";
    ctx.fillText(`Vidas: ${lives}`, canvas.width - 20, 40);
    
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

imgNave.onload = () => {
    loop();
};