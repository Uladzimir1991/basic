const canvas = document.querySelector('#game-canvas');
const context = canvas.getContext('2d');
const healthValue = document.querySelector('#health-value');
const armorValue = document.querySelector('#armor-value');
const ammoValue = document.querySelector('#ammo-value');
const scoreValue = document.querySelector('#score-value');
const startButton = document.querySelector('#start-button');
const messagePanel = document.querySelector('#message-panel');
const moveStick = document.querySelector('#move-stick');
const moveKnob = document.querySelector('#move-knob');
const lookPad = document.querySelector('#look-pad');
const fireButton = document.querySelector('#fire-button');
const jumpButton = document.querySelector('#jump-button');
const runButton = document.querySelector('#run-button');
const resetButton = document.querySelector('#reset-button');
const arenaMap = [
  '################',
  '#......#.......#',
  '#..A...#...H...#',
  '#......#.......#',
  '#......#.......#',
  '#..............#',
  '#....##....##..#',
  '#..............#',
  '#..H.......A...#',
  '#..............#',
  '#.......#......#',
  '#...A...#...H..#',
  '#.......#......#',
  '################',
];
const wallColorByType = Object.freeze({
  '#': '#343b55',
});
const pickupConfigs = Object.freeze({
  H: { type: 'health', amount: 35, color: '#36f28f' },
  A: { type: 'ammo', amount: 8, color: '#ffd166' },
});
const botsInitialState = Object.freeze([
  { x: 12.4, y: 2.6, health: 80, color: '#ff4d6d' },
  { x: 11.8, y: 10.8, health: 80, color: '#ff7a18' },
  { x: 3.4, y: 9.4, health: 80, color: '#45d6ff' },
]);
const keys = new Set();
const touchControls = {
  forward: 0,
  strafe: 0,
  isRunning: false,
  movePointerId: null,
  lookPointerId: null,
  lookX: 0,
};
const pickups = createPickups();
const player = {
  x: 2.3,
  y: 2.4,
  angle: 0,
  velocityZ: 0,
  heightOffset: 0,
  health: 100,
  armor: 50,
  ammo: 24,
  score: 0,
};
let bots = createBots();
let rockets = [];
let particles = [];
let lastFrameTime = performance.now();
let lastShotAt = 0;
let isStarted = false;
const tileSize = 1;
const fieldOfView = Math.PI / 3;
const rayStep = 2;
const maxRayDistance = 16;
const mouseSensitivity = 0.0024;
const touchLookSensitivity = 0.007;
const walkSpeed = 3.2;
const runMultiplier = 1.45;
const rocketSpeed = 8.4;
const rocketDamage = 62;
const rocketSplashRadius = 1.35;
const shotCooldown = 260;
const pickupRespawnTime = 7000;
const botSpeed = 1.25;
const botTouchDamage = 18;
const gravity = 13;
const jumpVelocity = 5.2;
const wallPadding = 0.18;
const stickRadius = 58;

startButton.addEventListener('click', startGame);
window.addEventListener('keydown', handleKeyDown);
window.addEventListener('keyup', handleKeyUp);
window.addEventListener('mousedown', handleMouseDown);
window.addEventListener('mousemove', handleMouseMove);
window.addEventListener('resize', resizeCanvas);
moveStick.addEventListener('pointerdown', handleMoveStart);
moveStick.addEventListener('pointermove', handleMoveChange);
moveStick.addEventListener('pointerup', resetMoveStick);
moveStick.addEventListener('pointercancel', resetMoveStick);
lookPad.addEventListener('pointerdown', handleLookStart);
lookPad.addEventListener('pointermove', handleLookChange);
lookPad.addEventListener('pointerup', resetLookPad);
lookPad.addEventListener('pointercancel', resetLookPad);
fireButton.addEventListener('pointerdown', handleFireTouch);
jumpButton.addEventListener('pointerdown', handleJumpTouch);
runButton.addEventListener('pointerdown', toggleRunTouch);
resetButton.addEventListener('pointerdown', handleResetTouch);
resizeCanvas();
requestAnimationFrame(loop);

/**
 * @returns {void}
 */
function startGame() {
  isStarted = true;
  startButton.classList.add('is-hidden');
  updateMessage('Матч начался: на смартфоне используйте стик, свайп и кнопки');
  if (!isTouchDevice()) {
    canvas.requestPointerLock();
  }
}

/**
 * @param {KeyboardEvent} event
 * @returns {void}
 */
function handleKeyDown(event) {
  keys.add(event.code);
  if (event.code === 'Space') {
    jumpPlayer();
  }
  if (event.code === 'KeyR') {
    resetMatch();
  }
}

/**
 * @param {KeyboardEvent} event
 * @returns {void}
 */
function handleKeyUp(event) {
  keys.delete(event.code);
}

/**
 * @param {MouseEvent} event
 * @returns {void}
 */
function handleMouseDown(event) {
  if (!isStarted || event.button !== 0) {
    return;
  }
  shootRocket();
}

/**
 * @param {MouseEvent} event
 * @returns {void}
 */
function handleMouseMove(event) {
  if (document.pointerLockElement !== canvas) {
    return;
  }
  player.angle = normalizeAngle(player.angle + event.movementX * mouseSensitivity);
}

/**
 * @param {PointerEvent} event
 * @returns {void}
 */
function handleMoveStart(event) {
  event.preventDefault();
  touchControls.movePointerId = event.pointerId;
  moveStick.setPointerCapture(event.pointerId);
  updateMoveStick(event);
}

/**
 * @param {PointerEvent} event
 * @returns {void}
 */
function handleMoveChange(event) {
  if (event.pointerId !== touchControls.movePointerId) {
    return;
  }
  event.preventDefault();
  updateMoveStick(event);
}

/**
 * @param {PointerEvent} event
 * @returns {void}
 */
function resetMoveStick(event) {
  if (event.pointerId !== touchControls.movePointerId) {
    return;
  }
  touchControls.forward = 0;
  touchControls.strafe = 0;
  touchControls.movePointerId = null;
  moveKnob.style.transform = 'translate(-50%, -50%)';
}

/**
 * @param {PointerEvent} event
 * @returns {void}
 */
function updateMoveStick(event) {
  const rect = moveStick.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  const offsetX = event.clientX - centerX;
  const offsetY = event.clientY - centerY;
  const distance = Math.min(Math.hypot(offsetX, offsetY), stickRadius);
  const angle = Math.atan2(offsetY, offsetX);
  const knobX = Math.cos(angle) * distance;
  const knobY = Math.sin(angle) * distance;
  touchControls.strafe = knobX / stickRadius;
  touchControls.forward = -knobY / stickRadius;
  moveKnob.style.transform = `translate(calc(-50% + ${knobX}px), calc(-50% + ${knobY}px))`;
}

/**
 * @param {PointerEvent} event
 * @returns {void}
 */
function handleLookStart(event) {
  if (event.target.closest('.move-stick, .action-buttons, .start-button')) {
    return;
  }
  event.preventDefault();
  touchControls.lookPointerId = event.pointerId;
  touchControls.lookX = event.clientX;
  lookPad.setPointerCapture(event.pointerId);
}

/**
 * @param {PointerEvent} event
 * @returns {void}
 */
function handleLookChange(event) {
  if (event.pointerId !== touchControls.lookPointerId) {
    return;
  }
  event.preventDefault();
  player.angle = normalizeAngle(player.angle + (event.clientX - touchControls.lookX) * touchLookSensitivity);
  touchControls.lookX = event.clientX;
}

/**
 * @param {PointerEvent} event
 * @returns {void}
 */
function resetLookPad(event) {
  if (event.pointerId !== touchControls.lookPointerId) {
    return;
  }
  touchControls.lookPointerId = null;
}

/**
 * @param {PointerEvent} event
 * @returns {void}
 */
function handleFireTouch(event) {
  event.preventDefault();
  startGameFromTouch();
  shootRocket();
}

/**
 * @param {PointerEvent} event
 * @returns {void}
 */
function handleJumpTouch(event) {
  event.preventDefault();
  startGameFromTouch();
  jumpPlayer();
}

/**
 * @param {PointerEvent} event
 * @returns {void}
 */
function toggleRunTouch(event) {
  event.preventDefault();
  startGameFromTouch();
  touchControls.isRunning = !touchControls.isRunning;
  runButton.classList.toggle('is-active', touchControls.isRunning);
}

/**
 * @param {PointerEvent} event
 * @returns {void}
 */
function handleResetTouch(event) {
  event.preventDefault();
  resetMatch();
  startGameFromTouch();
}

/**
 * @returns {void}
 */
function startGameFromTouch() {
  if (isStarted) {
    return;
  }
  startGame();
}

/**
 * @returns {void}
 */
function resizeCanvas() {
  const bounds = canvas.getBoundingClientRect();
  const pixelRatio = window.devicePixelRatio || 1;
  canvas.width = Math.floor(bounds.width * pixelRatio);
  canvas.height = Math.floor(bounds.height * pixelRatio);
  context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
}

/**
 * @param {number} frameTime
 * @returns {void}
 */
function loop(frameTime) {
  const deltaTime = Math.min((frameTime - lastFrameTime) / 1000, 0.05);
  lastFrameTime = frameTime;
  if (isStarted) {
    updateGame(deltaTime);
  }
  renderGame();
  requestAnimationFrame(loop);
}

/**
 * @param {number} deltaTime
 * @returns {void}
 */
function updateGame(deltaTime) {
  updatePlayer(deltaTime);
  updateRockets(deltaTime);
  updateBots(deltaTime);
  updateParticles(deltaTime);
  updatePickups();
  updateHud();
}

/**
 * @param {number} deltaTime
 * @returns {void}
 */
function updatePlayer(deltaTime) {
  const isRunning = keys.has('ShiftLeft') || keys.has('ShiftRight') || touchControls.isRunning;
  const speed = isRunning ? walkSpeed * runMultiplier : walkSpeed;
  const forward = clampAxis(getAxis('KeyW', 'KeyS') + touchControls.forward);
  const strafe = clampAxis(getAxis('KeyD', 'KeyA') + touchControls.strafe);
  const movement = getMovementVector({ forward, strafe, speed, deltaTime });
  moveEntity({ entity: player, deltaX: movement.x, deltaY: movement.y });
  player.velocityZ -= gravity * deltaTime;
  player.heightOffset = Math.max(0, player.heightOffset + player.velocityZ * deltaTime);
  if (player.heightOffset === 0) {
    player.velocityZ = 0;
  }
}

/**
 * @param {{ forward: number, strafe: number, speed: number, deltaTime: number }} params
 * @returns {{ x: number, y: number }}
 */
function getMovementVector({ forward, strafe, speed, deltaTime }) {
  const length = Math.hypot(forward, strafe) || 1;
  const normalizedForward = forward / length;
  const normalizedStrafe = strafe / length;
  const cos = Math.cos(player.angle);
  const sin = Math.sin(player.angle);
  return {
    x: (cos * normalizedForward - sin * normalizedStrafe) * speed * deltaTime,
    y: (sin * normalizedForward + cos * normalizedStrafe) * speed * deltaTime,
  };
}

/**
 * @param {string} positiveKey
 * @param {string} negativeKey
 * @returns {number}
 */
function getAxis(positiveKey, negativeKey) {
  return Number(keys.has(positiveKey)) - Number(keys.has(negativeKey));
}

/**
 * @param {number} value
 * @returns {number}
 */
function clampAxis(value) {
  return Math.max(-1, Math.min(1, value));
}

/**
 * @returns {void}
 */
function jumpPlayer() {
  if (!isStarted || player.heightOffset > 0) {
    return;
  }
  player.velocityZ = jumpVelocity;
}

/**
 * @returns {void}
 */
function shootRocket() {
  const now = performance.now();
  if (now - lastShotAt < shotCooldown || player.ammo <= 0) {
    return;
  }
  player.ammo -= 1;
  lastShotAt = now;
  rockets.push({
    x: player.x + Math.cos(player.angle) * 0.45,
    y: player.y + Math.sin(player.angle) * 0.45,
    angle: player.angle,
    life: 1.8,
    owner: 'player',
  });
  createParticles({ x: player.x, y: player.y, color: '#ffd166', amount: 8 });
}

/**
 * @param {number} deltaTime
 * @returns {void}
 */
function updateRockets(deltaTime) {
  rockets = rockets.filter((rocket) => {
    rocket.x += Math.cos(rocket.angle) * rocketSpeed * deltaTime;
    rocket.y += Math.sin(rocket.angle) * rocketSpeed * deltaTime;
    rocket.life -= deltaTime;
    if (rocket.life <= 0 || isWall({ x: rocket.x, y: rocket.y })) {
      explodeRocket(rocket);
      return false;
    }
    if (hitBot(rocket)) {
      explodeRocket(rocket);
      return false;
    }
    return true;
  });
}

/**
 * @param {{ x: number, y: number, owner: string }} rocket
 * @returns {boolean}
 */
function hitBot(rocket) {
  return bots.some((bot) => getDistance({ ax: rocket.x, ay: rocket.y, bx: bot.x, by: bot.y }) < 0.34);
}

/**
 * @param {{ x: number, y: number, owner: string }} rocket
 * @returns {void}
 */
function explodeRocket(rocket) {
  createParticles({ x: rocket.x, y: rocket.y, color: '#ff7a18', amount: 22 });
  damageBots({ x: rocket.x, y: rocket.y, owner: rocket.owner });
  damagePlayer({ x: rocket.x, y: rocket.y, owner: rocket.owner });
}

/**
 * @param {{ x: number, y: number, owner: string }} params
 * @returns {void}
 */
function damageBots({ x, y, owner }) {
  bots.forEach((bot) => {
    const distance = getDistance({ ax: x, ay: y, bx: bot.x, by: bot.y });
    if (distance > rocketSplashRadius) {
      return;
    }
    bot.health -= Math.round(rocketDamage * (1 - distance / rocketSplashRadius));
    if (bot.health <= 0 && owner === 'player') {
      player.score += 1;
      updateMessage('Фраг! Контролируйте броню и боеприпасы');
    }
  });
  bots = bots.filter((bot) => bot.health > 0);
  if (bots.length === 0) {
    bots = createBots();
    updateMessage('Новая волна ботов вышла на арену');
  }
}

/**
 * @param {{ x: number, y: number, owner: string }} params
 * @returns {void}
 */
function damagePlayer({ x, y, owner }) {
  const distance = getDistance({ ax: x, ay: y, bx: player.x, by: player.y });
  if (owner !== 'bot' && distance > rocketSplashRadius) {
    return;
  }
  if (distance > rocketSplashRadius) {
    return;
  }
  const damage = Math.round(rocketDamage * (1 - distance / rocketSplashRadius));
  applyPlayerDamage(damage);
}

/**
 * @param {number} deltaTime
 * @returns {void}
 */
function updateBots(deltaTime) {
  bots.forEach((bot) => {
    const angleToPlayer = Math.atan2(player.y - bot.y, player.x - bot.x);
    const distanceToPlayer = getDistance({ ax: bot.x, ay: bot.y, bx: player.x, by: player.y });
    if (distanceToPlayer > 0.75) {
      moveEntity({
        entity: bot,
        deltaX: Math.cos(angleToPlayer) * botSpeed * deltaTime,
        deltaY: Math.sin(angleToPlayer) * botSpeed * deltaTime,
      });
    }
    if (distanceToPlayer <= 0.9) {
      applyPlayerDamage(botTouchDamage * deltaTime);
    }
  });
}

/**
 * @param {number} damage
 * @returns {void}
 */
function applyPlayerDamage(damage) {
  const absorbedDamage = Math.min(player.armor, damage * 0.55);
  player.armor = Math.max(0, player.armor - absorbedDamage);
  player.health = Math.max(0, player.health - (damage - absorbedDamage));
  if (player.health <= 0) {
    resetMatch();
    updateMessage('Вы проиграли дуэль. Матч перезапущен');
  }
}

/**
 * @returns {void}
 */
function updatePickups() {
  const now = performance.now();
  pickups.forEach((pickup) => {
    if (pickup.availableAt > now) {
      return;
    }
    const distance = getDistance({ ax: player.x, ay: player.y, bx: pickup.x, by: pickup.y });
    if (distance > 0.55) {
      return;
    }
    collectPickup(pickup);
    pickup.availableAt = now + pickupRespawnTime;
  });
}

/**
 * @param {{ type: string, amount: number }} pickup
 * @returns {void}
 */
function collectPickup(pickup) {
  if (pickup.type === 'health') {
    player.health = Math.min(125, player.health + pickup.amount);
    updateMessage('Подобрано здоровье');
    return;
  }
  player.ammo = Math.min(50, player.ammo + pickup.amount);
  updateMessage('Пополнены боеприпасы');
}

/**
 * @param {number} deltaTime
 * @returns {void}
 */
function updateParticles(deltaTime) {
  particles = particles
    .map((particle) => ({
      ...particle,
      x: particle.x + particle.velocityX * deltaTime,
      y: particle.y + particle.velocityY * deltaTime,
      life: particle.life - deltaTime,
    }))
    .filter((particle) => particle.life > 0);
}

/**
 * @returns {void}
 */
function updateHud() {
  healthValue.textContent = Math.ceil(player.health).toString();
  armorValue.textContent = Math.ceil(player.armor).toString();
  ammoValue.textContent = player.ammo.toString();
  scoreValue.textContent = player.score.toString();
}

/**
 * @returns {void}
 */
function renderGame() {
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  drawBackground({ width, height });
  const depthBuffer = drawWalls({ width, height });
  drawSprites({ width, height, depthBuffer });
  drawWeapon({ width, height });
  drawCrosshair({ width, height });
  drawMiniMap();
}

/**
 * @param {{ width: number, height: number }} params
 * @returns {void}
 */
function drawBackground({ width, height }) {
  const horizon = height * 0.48 - player.heightOffset * 16;
  const skyGradient = context.createLinearGradient(0, 0, 0, horizon);
  skyGradient.addColorStop(0, '#07111f');
  skyGradient.addColorStop(1, '#17213a');
  context.fillStyle = skyGradient;
  context.fillRect(0, 0, width, horizon);
  const floorGradient = context.createLinearGradient(0, horizon, 0, height);
  floorGradient.addColorStop(0, '#191b22');
  floorGradient.addColorStop(1, '#070910');
  context.fillStyle = floorGradient;
  context.fillRect(0, horizon, width, height - horizon);
}

/**
 * @param {{ width: number, height: number }} params
 * @returns {number[]}
 */
function drawWalls({ width, height }) {
  const depthBuffer = [];
  for (let column = 0; column < width; column += rayStep) {
    const rayAngle = player.angle - fieldOfView / 2 + (column / width) * fieldOfView;
    const hit = castRay({ angle: rayAngle });
    const correctedDistance = hit.distance * Math.cos(rayAngle - player.angle);
    const wallHeight = Math.min(height * 1.8, height / Math.max(correctedDistance, 0.12));
    const shade = Math.max(0.22, 1 - correctedDistance / maxRayDistance);
    const top = height * 0.5 - wallHeight * 0.5 - player.heightOffset * 16;
    context.fillStyle = getShadedColor({ color: wallColorByType[hit.tile] || '#2f3345', shade });
    context.fillRect(column, top, rayStep + 1, wallHeight);
    depthBuffer[column] = correctedDistance;
    depthBuffer[column + 1] = correctedDistance;
  }
  return depthBuffer;
}

/**
 * @param {{ angle: number }} params
 * @returns {{ distance: number, tile: string }}
 */
function castRay({ angle }) {
  const step = 0.035;
  for (let distance = step; distance < maxRayDistance; distance += step) {
    const x = player.x + Math.cos(angle) * distance;
    const y = player.y + Math.sin(angle) * distance;
    if (isWall({ x, y })) {
      return { distance, tile: getMapTile({ x, y }) };
    }
  }
  return { distance: maxRayDistance, tile: '#' };
}

/**
 * @param {{ width: number, height: number, depthBuffer: number[] }} params
 * @returns {void}
 */
function drawSprites({ width, height, depthBuffer }) {
  const sprites = [
    ...bots.map((bot) => ({ ...bot, spriteType: 'bot', size: 0.82 })),
    ...rockets.map((rocket) => ({ ...rocket, spriteType: 'rocket', size: 0.22, color: '#ffd166' })),
    ...getVisiblePickups(),
    ...particles.map((particle) => ({ ...particle, spriteType: 'particle', size: 0.14 })),
  ].sort((a, b) => getSpriteDistance(b) - getSpriteDistance(a));
  sprites.forEach((sprite) => drawSprite({ sprite, width, height, depthBuffer }));
}

/**
 * @returns {{ x: number, y: number, color: string, spriteType: string, size: number }[]}
 */
function getVisiblePickups() {
  const now = performance.now();
  return pickups
    .filter((pickup) => pickup.availableAt <= now)
    .map((pickup) => ({ ...pickup, spriteType: 'pickup', size: 0.42 }));
}

/**
 * @param {{ sprite: { x: number, y: number, color: string, spriteType: string, size: number }, width: number, height: number, depthBuffer: number[] }} params
 * @returns {void}
 */
function drawSprite({ sprite, width, height, depthBuffer }) {
  const distance = getSpriteDistance(sprite);
  const angleToSprite = normalizeAngle(Math.atan2(sprite.y - player.y, sprite.x - player.x) - player.angle);
  if (Math.abs(angleToSprite) > fieldOfView * 0.7 || distance <= 0.1) {
    return;
  }
  const screenX = width * 0.5 + Math.tan(angleToSprite) * (width / fieldOfView);
  const screenSize = Math.min(height, (height / distance) * sprite.size);
  const spriteTop = height * 0.5 - screenSize * 0.5 - player.heightOffset * 16;
  const depthIndex = Math.max(0, Math.min(width - 1, Math.floor(screenX)));
  if (depthBuffer[depthIndex] < distance) {
    return;
  }
  context.fillStyle = sprite.color;
  if (sprite.spriteType === 'bot') {
    drawBotSprite({ screenX, spriteTop, screenSize, color: sprite.color });
    return;
  }
  context.beginPath();
  context.arc(screenX, spriteTop + screenSize * 0.5, screenSize * 0.5, 0, Math.PI * 2);
  context.fill();
}

/**
 * @param {{ screenX: number, spriteTop: number, screenSize: number, color: string }} params
 * @returns {void}
 */
function drawBotSprite({ screenX, spriteTop, screenSize, color }) {
  context.fillStyle = color;
  context.fillRect(screenX - screenSize * 0.28, spriteTop + screenSize * 0.2, screenSize * 0.56, screenSize * 0.65);
  context.fillStyle = '#f5f7fb';
  context.fillRect(screenX - screenSize * 0.2, spriteTop, screenSize * 0.4, screenSize * 0.28);
  context.fillStyle = '#111827';
  context.fillRect(screenX - screenSize * 0.13, spriteTop + screenSize * 0.09, screenSize * 0.08, screenSize * 0.06);
  context.fillRect(screenX + screenSize * 0.05, spriteTop + screenSize * 0.09, screenSize * 0.08, screenSize * 0.06);
}

/**
 * @param {{ width: number, height: number }} params
 * @returns {void}
 */
function drawWeapon({ width, height }) {
  context.fillStyle = '#111827';
  context.fillRect(width * 0.56, height * 0.68, width * 0.2, height * 0.12);
  context.fillStyle = '#263044';
  context.fillRect(width * 0.61, height * 0.62, width * 0.13, height * 0.08);
  context.fillStyle = '#ff7a18';
  context.fillRect(width * 0.72, height * 0.64, width * 0.04, height * 0.035);
}

/**
 * @param {{ width: number, height: number }} params
 * @returns {void}
 */
function drawCrosshair({ width, height }) {
  const centerX = width * 0.5;
  const centerY = height * 0.5;
  context.strokeStyle = '#f5f7fb';
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(centerX - 14, centerY);
  context.lineTo(centerX - 5, centerY);
  context.moveTo(centerX + 5, centerY);
  context.lineTo(centerX + 14, centerY);
  context.moveTo(centerX, centerY - 14);
  context.lineTo(centerX, centerY - 5);
  context.moveTo(centerX, centerY + 5);
  context.lineTo(centerX, centerY + 14);
  context.stroke();
}

/**
 * @returns {void}
 */
function drawMiniMap() {
  const scale = 7;
  const offsetX = 18;
  const offsetY = 18;
  context.fillStyle = 'rgb(0 0 0 / 48%)';
  context.fillRect(offsetX - 8, offsetY - 8, arenaMap[0].length * scale + 16, arenaMap.length * scale + 16);
  arenaMap.forEach((row, y) => {
    row.split('').forEach((tile, x) => {
      context.fillStyle = tile === '#' ? '#596179' : 'rgb(255 255 255 / 9%)';
      context.fillRect(offsetX + x * scale, offsetY + y * scale, scale - 1, scale - 1);
    });
  });
  drawMiniMapPoint({ x: player.x, y: player.y, color: '#f5f7fb', scale, offsetX, offsetY });
  bots.forEach((bot) => drawMiniMapPoint({ x: bot.x, y: bot.y, color: bot.color, scale, offsetX, offsetY }));
}

/**
 * @param {{ x: number, y: number, color: string, scale: number, offsetX: number, offsetY: number }} params
 * @returns {void}
 */
function drawMiniMapPoint({ x, y, color, scale, offsetX, offsetY }) {
  context.fillStyle = color;
  context.beginPath();
  context.arc(offsetX + x * scale, offsetY + y * scale, 3, 0, Math.PI * 2);
  context.fill();
}

/**
 * @param {{ entity: { x: number, y: number }, deltaX: number, deltaY: number }} params
 * @returns {void}
 */
function moveEntity({ entity, deltaX, deltaY }) {
  const nextX = entity.x + deltaX;
  const nextY = entity.y + deltaY;
  if (!isWall({ x: nextX + Math.sign(deltaX) * wallPadding, y: entity.y })) {
    entity.x = nextX;
  }
  if (!isWall({ x: entity.x, y: nextY + Math.sign(deltaY) * wallPadding })) {
    entity.y = nextY;
  }
}

/**
 * @param {{ x: number, y: number }} params
 * @returns {boolean}
 */
function isWall({ x, y }) {
  return getMapTile({ x, y }) === '#';
}

/**
 * @param {{ x: number, y: number }} params
 * @returns {string}
 */
function getMapTile({ x, y }) {
  const mapY = Math.floor(y / tileSize);
  const mapX = Math.floor(x / tileSize);
  return arenaMap[mapY]?.[mapX] || '#';
}

/**
 * @param {{ ax: number, ay: number, bx: number, by: number }} params
 * @returns {number}
 */
function getDistance({ ax, ay, bx, by }) {
  return Math.hypot(ax - bx, ay - by);
}

/**
 * @param {{ x: number, y: number }} sprite
 * @returns {number}
 */
function getSpriteDistance(sprite) {
  return getDistance({ ax: player.x, ay: player.y, bx: sprite.x, by: sprite.y });
}

/**
 * @param {number} angle
 * @returns {number}
 */
function normalizeAngle(angle) {
  let result = angle;
  while (result > Math.PI) {
    result -= Math.PI * 2;
  }
  while (result < -Math.PI) {
    result += Math.PI * 2;
  }
  return result;
}

/**
 * @returns {boolean}
 */
function isTouchDevice() {
  return navigator.maxTouchPoints > 0 || window.matchMedia('(pointer: coarse)').matches;
}

/**
 * @param {{ color: string, shade: number }} params
 * @returns {string}
 */
function getShadedColor({ color, shade }) {
  const red = Number.parseInt(color.slice(1, 3), 16);
  const green = Number.parseInt(color.slice(3, 5), 16);
  const blue = Number.parseInt(color.slice(5, 7), 16);
  return `rgb(${Math.floor(red * shade)} ${Math.floor(green * shade)} ${Math.floor(blue * shade)})`;
}

/**
 * @returns {{ x: number, y: number, type: string, amount: number, color: string, availableAt: number }[]}
 */
function createPickups() {
  return arenaMap.flatMap((row, y) => row
    .split('')
    .map((tile, x) => ({ tile, x, y }))
    .filter(({ tile }) => Boolean(pickupConfigs[tile]))
    .map(({ tile, x, y }) => ({
      x: x + 0.5,
      y: y + 0.5,
      type: pickupConfigs[tile].type,
      amount: pickupConfigs[tile].amount,
      color: pickupConfigs[tile].color,
      availableAt: 0,
    })));
}

/**
 * @returns {{ x: number, y: number, health: number, color: string }[]}
 */
function createBots() {
  return botsInitialState.map((bot) => ({ ...bot }));
}

/**
 * @param {{ x: number, y: number, color: string, amount: number }} params
 * @returns {void}
 */
function createParticles({ x, y, color, amount }) {
  for (let i = 0; i < amount; i += 1) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 0.8 + Math.random() * 2.4;
    particles.push({
      x,
      y,
      color,
      velocityX: Math.cos(angle) * speed,
      velocityY: Math.sin(angle) * speed,
      life: 0.35 + Math.random() * 0.35,
    });
  }
}

/**
 * @param {string} message
 * @returns {void}
 */
function updateMessage(message) {
  messagePanel.textContent = message;
}

/**
 * @returns {void}
 */
function resetMatch() {
  player.x = 2.3;
  player.y = 2.4;
  player.angle = 0;
  player.velocityZ = 0;
  player.heightOffset = 0;
  player.health = 100;
  player.armor = 50;
  player.ammo = 24;
  player.score = 0;
  bots = createBots();
  rockets = [];
  particles = [];
  pickups.forEach((pickup) => {
    pickup.availableAt = 0;
  });
  updateHud();
}
