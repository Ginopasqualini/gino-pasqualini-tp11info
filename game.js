'use strict';

// Referencias a los elementos de la página y al contexto de dibujo.
const canvas = document.querySelector('#game');
const ctx = canvas.getContext('2d');
const overlay = document.querySelector('#overlay');
const scoreElement = document.querySelector('#score');
const timerElement = document.querySelector('#timer');
const progressFill = document.querySelector('#progress-fill');
const bestScoreElement = document.querySelector('#best-score');
const startButton = document.querySelector('#start-button');
const pauseButton = document.querySelector('#pause-button');
const overlayIcon = document.querySelector('#overlay-icon');
const overlayKicker = document.querySelector('#overlay-kicker');
const overlayTitle = document.querySelector('#overlay-title');
const overlayMessage = document.querySelector('#overlay-message');

const WIDTH = canvas.width;
const HEIGHT = canvas.height;
const TARGET = 12;
const ROUND_SECONDS = 30;
const player = { x: WIDTH / 2, y: HEIGHT - 62, radius: 18, speed: 390 };
const keys = { left: false, right: false };
const items = [];
const particles = [];
const stars = Array.from({ length: 65 }, () => ({
  x: Math.random() * WIDTH,
  y: Math.random() * HEIGHT,
  radius: Math.random() * 1.5 + .3,
  phase: Math.random() * Math.PI * 2
}));

let state = 'ready';
let score = 0;
let timeLeft = ROUND_SECONDS;
let spawnClock = 0;
let animationTime = 0;
let previousFrame = 0;
let bestScore = loadBestScore();
bestScoreElement.textContent = bestScore;

function loadBestScore() {
  try { return Number(localStorage.getItem('tp11-best-score')) || 0; }
  catch { return 0; }
}

function saveBestScore() {
  try { localStorage.setItem('tp11-best-score', String(bestScore)); }
  catch { /* El juego sigue funcionando aunque el navegador bloquee el almacenamiento. */ }
}

// Dibuja el escenario completo usando formas de Canvas, sin imágenes externas.
function drawScene() {
  const sky = ctx.createLinearGradient(0, 0, 0, HEIGHT);
  sky.addColorStop(0, '#102f50');
  sky.addColorStop(.7, '#173b5a');
  sky.addColorStop(1, '#1b4964');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  stars.forEach((star) => {
    const twinkle = .35 + (Math.sin(animationTime * 2 + star.phase) + 1) * .28;
    ctx.globalAlpha = twinkle;
    ctx.fillStyle = '#d7f3ff';
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;

  // Montañas de fondo y suelo nevado.
  drawMountain(0, 355, 175, 150, '#1a4563');
  drawMountain(145, 365, 190, 135, '#1c4b68');
  drawMountain(535, 355, 210, 150, '#1a4563');
  drawMountain(700, 375, 210, 130, '#204e69');
  ctx.fillStyle = '#b7e7ec';
  ctx.fillRect(0, HEIGHT - 25, WIDTH, 25);
  ctx.fillStyle = '#ddf7f5';
  ctx.fillRect(0, HEIGHT - 25, WIDTH, 5);
  ctx.fillStyle = 'rgba(83, 169, 190, .22)';
  for (let x = 14; x < WIDTH; x += 38) ctx.fillRect(x, HEIGHT - 10, 15, 2);

  items.forEach((item) => item.type === 'orb' ? drawOrb(item) : drawIce(item));
  particles.forEach(drawParticle);
  drawPlayer();
}

function drawMountain(x, y, width, height, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y + height);
  ctx.lineTo(x + width * .48, y - height * .38);
  ctx.lineTo(x + width, y + height);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(206, 245, 246, .72)';
  ctx.beginPath();
  ctx.moveTo(x + width * .48, y - height * .38);
  ctx.lineTo(x + width * .34, y + height * .08);
  ctx.lineTo(x + width * .47, y - height * .02);
  ctx.lineTo(x + width * .57, y + height * .1);
  ctx.closePath();
  ctx.fill();
}

function drawPlayer() {
  const glow = ctx.createRadialGradient(player.x, player.y, 3, player.x, player.y, 46);
  glow.addColorStop(0, 'rgba(255, 209, 102, .36)');
  glow.addColorStop(1, 'rgba(255, 209, 102, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(player.x, player.y, 46, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#ffd166';
  ctx.beginPath();
  ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fff2bf';
  ctx.beginPath();
  ctx.arc(player.x - 5, player.y - 6, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#28354b';
  ctx.beginPath();
  ctx.arc(player.x - 5, player.y - 1, 2, 0, Math.PI * 2);
  ctx.arc(player.x + 5, player.y - 1, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#28354b';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(player.x, player.y + 2, 5, .15, Math.PI - .15);
  ctx.stroke();
}

function drawOrb(item) {
  const pulse = 1 + Math.sin(animationTime * 5 + item.phase) * .12;
  ctx.shadowBlur = 20;
  ctx.shadowColor = '#ffd166';
  ctx.fillStyle = '#ffdb78';
  ctx.beginPath();
  ctx.arc(item.x, item.y, item.radius * pulse, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#fff8d8';
  ctx.beginPath();
  ctx.arc(item.x - 3, item.y - 4, 3, 0, Math.PI * 2);
  ctx.fill();
}

function drawIce(item) {
  ctx.save();
  ctx.translate(item.x, item.y);
  ctx.rotate(item.rotation);
  ctx.fillStyle = '#75c8e3';
  ctx.strokeStyle = '#b8eff4';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-item.size * .52, -item.size * .3);
  ctx.lineTo(-item.size * .2, -item.size * .55);
  ctx.lineTo(item.size * .45, -item.size * .38);
  ctx.lineTo(item.size * .55, item.size * .18);
  ctx.lineTo(item.size * .16, item.size * .52);
  ctx.lineTo(-item.size * .43, item.size * .37);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function drawParticle(particle) {
  ctx.globalAlpha = Math.max(0, particle.life / particle.maxLife);
  ctx.fillStyle = particle.color;
  ctx.beginPath();
  ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
}

function createBurst(x, y, color, count = 12) {
  for (let i = 0; i < count; i += 1) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 45 + Math.random() * 150;
    particles.push({
      x, y, color, radius: 2 + Math.random() * 3,
      vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
      life: .45 + Math.random() * .45, maxLife: .9
    });
  }
}

function spawnItem() {
  const isOrb = Math.random() < .43;
  const size = isOrb ? 13 : 26 + Math.random() * 14;
  items.push({
    type: isOrb ? 'orb' : 'ice',
    x: 25 + Math.random() * (WIDTH - 50),
    y: -35,
    radius: isOrb ? size : size * .72,
    size,
    speed: (isOrb ? 145 : 190) + Math.random() * 100 + score * 3,
    rotation: Math.random() * Math.PI,
    spin: (Math.random() - .5) * 2,
    phase: Math.random() * Math.PI * 2
  });
}

function update(dt) {
  animationTime += dt;
  if (state !== 'running') return;

  timeLeft = Math.max(0, timeLeft - dt);
  timerElement.innerHTML = `${Math.ceil(timeLeft)}<span class="seconds">s</span>`;
  if (keys.left) player.x -= player.speed * dt;
  if (keys.right) player.x += player.speed * dt;
  player.x = Math.max(player.radius + 3, Math.min(WIDTH - player.radius - 3, player.x));

  spawnClock += dt;
  if (spawnClock >= .58) {
    spawnClock = 0;
    spawnItem();
  }

  for (let i = items.length - 1; i >= 0; i -= 1) {
    const item = items[i];
    item.y += item.speed * dt;
    item.rotation += item.spin * dt;
    const dx = item.x - player.x;
    const dy = item.y - player.y;
    const collisionDistance = item.type === 'orb' ? player.radius + item.radius : player.radius + item.radius * .72;

    if (Math.hypot(dx, dy) < collisionDistance) {
      if (item.type === 'orb') {
        score += 1;
        scoreElement.textContent = score;
        progressFill.style.width = `${(score / TARGET) * 100}%`;
        createBurst(item.x, item.y, '#ffdb78');
        if (score > bestScore) {
          bestScore = score;
          bestScoreElement.textContent = bestScore;
          saveBestScore();
        }
        if (score >= TARGET) {
          items.splice(i, 1);
          finishGame(true);
          return;
        }
      } else {
        createBurst(player.x, player.y, '#8ce5ef', 18);
        finishGame(false, 'ice');
        return;
      }
      items.splice(i, 1);
    } else if (item.y > HEIGHT + 40) {
      items.splice(i, 1);
    }
  }

  for (let i = particles.length - 1; i >= 0; i -= 1) {
    const particle = particles[i];
    particle.x += particle.vx * dt;
    particle.y += particle.vy * dt;
    particle.life -= dt;
    if (particle.life <= 0) particles.splice(i, 1);
  }

  if (timeLeft <= 0) finishGame(false, 'time');
}

function startGame() {
  score = 0;
  timeLeft = ROUND_SECONDS;
  spawnClock = 0;
  player.x = WIDTH / 2;
  items.length = 0;
  particles.length = 0;
  scoreElement.textContent = '0';
  timerElement.innerHTML = `${ROUND_SECONDS}<span class="seconds">s</span>`;
  progressFill.style.width = '0%';
  state = 'running';
  overlay.classList.add('is-hidden');
  pauseButton.disabled = false;
  pauseButton.innerHTML = '<span aria-hidden="true">Ⅱ</span> Pausar';
}

function finishGame(won, reason = '') {
  state = won ? 'won' : 'lost';
  keys.left = false;
  keys.right = false;
  pauseButton.disabled = true;
  pauseButton.innerHTML = '<span aria-hidden="true">Ⅱ</span> Pausar';
  overlayIcon.textContent = won ? '✦' : '❄';
  overlayKicker.textContent = won ? '¡MISIÓN CUMPLIDA!' : 'FIN DE LA PARTIDA';
  overlayTitle.innerHTML = won ? '¡Código<br>descongelado!' : '¡Casi lo<br>lográs!';
  overlayMessage.textContent = won
    ? `Juntaste ${score} orbes y devolviste el calor al programa. ¡Excelente trabajo!`
    : reason === 'ice'
      ? `Un bloque de hielo te alcanzó. Juntaste ${score} de ${TARGET} orbes. ¡Probá otra vez!`
      : `Se terminó el tiempo. Juntaste ${score} de ${TARGET} orbes. ¡Probá otra vez!`;
  startButton.innerHTML = 'Jugar de nuevo <span aria-hidden="true">→</span>';
  overlay.classList.remove('is-hidden');
}

function togglePause() {
  if (state === 'running') {
    state = 'paused';
    keys.left = false;
    keys.right = false;
    overlayIcon.textContent = 'Ⅱ';
    overlayKicker.textContent = 'PAUSA';
    overlayTitle.innerHTML = 'Tomate un<br>respiro';
    overlayMessage.textContent = 'Tu partida está pausada. Cuando quieras, seguimos.';
    startButton.innerHTML = 'Continuar <span aria-hidden="true">→</span>';
    overlay.classList.remove('is-hidden');
    pauseButton.innerHTML = '<span aria-hidden="true">▶</span> Seguir';
  } else if (state === 'paused') {
    state = 'running';
    overlay.classList.add('is-hidden');
    pauseButton.innerHTML = '<span aria-hidden="true">Ⅱ</span> Pausar';
  }
}

function handleStartButton() {
  if (state === 'paused') {
    togglePause();
    return;
  }
  overlayIcon.textContent = '✦';
  overlayKicker.textContent = 'MISIÓN DE RESCATE';
  overlayTitle.innerHTML = '¿Listo para<br>descongelar?';
  overlayMessage.textContent = 'Juntá 12 orbes de energía antes de que termine el tiempo.';
  startButton.innerHTML = 'Empezar partida <span aria-hidden="true">→</span>';
  startGame();
}

function frame(timestamp) {
  const dt = Math.min((timestamp - previousFrame) / 1000 || 0, .035);
  previousFrame = timestamp;
  update(dt);
  drawScene();
  requestAnimationFrame(frame);
}

startButton.addEventListener('click', handleStartButton);
pauseButton.addEventListener('click', togglePause);

// Teclado: flechas o A/D. Escape pausa y reanuda.
window.addEventListener('keydown', (event) => {
  const key = event.key.toLowerCase();
  if (['arrowleft', 'arrowright', 'a', 'd', ' '].includes(key)) event.preventDefault();
  if (key === 'arrowleft' || key === 'a') keys.left = true;
  if (key === 'arrowright' || key === 'd') keys.right = true;
  if (key === 'escape' && (state === 'running' || state === 'paused')) togglePause();
  if (key === ' ' && (state === 'ready' || state === 'won' || state === 'lost')) handleStartButton();
});
window.addEventListener('keyup', (event) => {
  const key = event.key.toLowerCase();
  if (key === 'arrowleft' || key === 'a') keys.left = false;
  if (key === 'arrowright' || key === 'd') keys.right = false;
});
window.addEventListener('blur', () => {
  keys.left = false;
  keys.right = false;
  if (state === 'running') togglePause();
});

// También se puede mover el personaje con el mouse o el dedo sobre el Canvas.
function movePlayerToPointer(event) {
  if (state !== 'running') return;
  const rect = canvas.getBoundingClientRect();
  player.x = ((event.clientX - rect.left) / rect.width) * WIDTH;
  player.x = Math.max(player.radius + 3, Math.min(WIDTH - player.radius - 3, player.x));
}
canvas.addEventListener('pointermove', movePlayerToPointer);
canvas.addEventListener('pointerdown', movePlayerToPointer);

requestAnimationFrame(frame);
