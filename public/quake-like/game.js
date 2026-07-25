const canvas = document.querySelector('#game-canvas');
const context = canvas.getContext('2d');
const healthValue = document.querySelector('#health-value');
const armorValue = document.querySelector('#armor-value');
const weaponValue = document.querySelector('#weapon-value');
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
const weaponButton = document.querySelector('#weapon-button');
const resetButton = document.querySelector('#reset-button');
/**
 * Q3-style symmetrical arena map.
 * Walls: # metal, G gothic, T tech, B barrier.
 * Items: H health, A ammo, R armor, M megahealth, J jump pad.
 * Weapons: S shotgun, O rocket, E lightning, U railgun, P plasma.
 */
const arenaMap = [
  'GGGGGGGGGGGGGGGGGGGGGGGG',
  'G.......TT....TT.......G',
  'G..H.S..TT....TT..O.A..G',
  'G.......##....##.......G',
  'GGG..GGG##....##GGG..GGG',
  'G.........M..M.........G',
  'G..A.P..BBB..BBB..P.R..G',
  'G.......B......B.......G',
  'G.......B..JJ..B.......G',
  'G.......B..JJ..B.......G',
  'G.......B......B.......G',
  'G..R.P..BBB..BBB..P.A..G',
  'G.........M..M.........G',
  'GGG..GGG##....##GGG..GGG',
  'G.......##....##.......G',
  'G..A.E..TT....TT..U.H..G',
  'G.......TT....TT.......G',
  'GGGGGGGGGGGGGGGGGGGGGGGG',
];
const wallTiles = new Set(['#', 'G', 'T', 'B']);
const wallColorByType = Object.freeze({
  '#': '#3a4258',
  G: '#4a3a32',
  T: '#2f4a5c',
  B: '#1d2230',
});
const wallAccentByType = Object.freeze({
  '#': '#ff7a18',
  G: '#c47a3a',
  T: '#45d6ff',
  B: '#ff4d6d',
});
const weaponOrder = Object.freeze(['machinegun', 'shotgun', 'rocket', 'lightning', 'railgun', 'plasma']);
const weaponConfigs = Object.freeze({
  machinegun: {
    id: 'machinegun',
    shortName: 'LMG',
    name: 'LIGHT MACHINE GUN',
    ammoKey: 'bullets',
    ammoPerPickup: 50,
    startAmmo: 100,
    maxAmmo: 200,
    cooldown: 85,
    damage: 7,
    kick: 0.28,
    mode: 'hitscan',
    tracer: true,
    color: '#8a93a3',
    accent: '#ffd166',
  },
  shotgun: {
    id: 'shotgun',
    shortName: 'SG',
    name: 'SHOTGUN',
    ammoKey: 'shells',
    ammoPerPickup: 10,
    startAmmo: 10,
    maxAmmo: 50,
    cooldown: 1000,
    damage: 10,
    pellets: 11,
    spread: 0.18,
    kick: 1.15,
    mode: 'hitscan',
    color: '#8b7355',
    accent: '#ff9a3c',
  },
  rocket: {
    id: 'rocket',
    shortName: 'RL',
    name: 'ROCKET LAUNCHER',
    ammoKey: 'rockets',
    ammoPerPickup: 5,
    startAmmo: 5,
    maxAmmo: 50,
    cooldown: 430,
    damage: 74,
    kick: 1,
    mode: 'rocket',
    color: '#4a5368',
    accent: '#ff7a18',
  },
  lightning: {
    id: 'lightning',
    shortName: 'LG',
    name: 'LIGHTNING GUN',
    ammoKey: 'lightning',
    ammoPerPickup: 100,
    startAmmo: 100,
    maxAmmo: 200,
    cooldown: 16,
    damage: 8,
    maxRange: 8.5,
    kick: 0.22,
    mode: 'beam',
    color: '#3a4a6a',
    accent: '#9ad7ff',
  },
  railgun: {
    id: 'railgun',
    shortName: 'RG',
    name: 'RAILGUN',
    ammoKey: 'slugs',
    ammoPerPickup: 10,
    startAmmo: 10,
    maxAmmo: 50,
    cooldown: 1400,
    damage: 95,
    kick: 1,
    mode: 'rail',
    color: '#2f4a3a',
    accent: '#36f28f',
  },
  plasma: {
    id: 'plasma',
    shortName: 'PG',
    name: 'PLASMA GUN',
    ammoKey: 'cells',
    ammoPerPickup: 50,
    startAmmo: 50,
    maxAmmo: 200,
    cooldown: 100,
    damage: 18,
    kick: 0.45,
    mode: 'plasma',
    color: '#3a3560',
    accent: '#c084fc',
  },
});
const shotgunPelletPattern = Object.freeze([
  0,
  -0.035, 0.035,
  -0.07, 0.07,
  -0.11, 0.11,
  -0.15, 0.15,
  -0.05, 0.05,
]);
const weaponTileConfigs = Object.freeze({
  S: 'shotgun',
  O: 'rocket',
  E: 'lightning',
  U: 'railgun',
  P: 'plasma',
});
const pickupConfigs = Object.freeze({
  H: { type: 'health', amount: 35, color: '#36f28f' },
  A: { type: 'ammo', amount: 1, color: '#ffd166' },
  R: { type: 'armor', amount: 50, color: '#6ea8ff' },
  M: { type: 'megahealth', amount: 100, color: '#7dffb2' },
});
const botsInitialState = Object.freeze([
  { x: 20.5, y: 2.5, health: 100, color: '#ff4d6d' },
  { x: 20.5, y: 15.5, health: 100, color: '#ff7a18' },
  { x: 3.5, y: 15.5, health: 100, color: '#45d6ff' },
  { x: 12.0, y: 9.0, health: 100, color: '#c084fc' },
]);
const playerSpawn = Object.freeze({ x: 3.5, y: 2.5, angle: 0.35 });
const jumpPadBoost = 8.4;
const keys = new Set();
const touchControls = {
  forward: 0,
  strafe: 0,
  isRunning: false,
  isFiring: false,
  movePointerId: null,
  lookPointerId: null,
  lookX: 0,
};
let isMouseFiring = false;
const pickups = createPickups();
const player = createPlayerState();
let bots = createBots();
let projectiles = [];
let beams = [];
let particles = [];
let lastFrameTime = performance.now();
let lastShotAt = 0;
let isStarted = false;
const tileSize = 1;
const fieldOfView = Math.PI / 3;
const rayStep = 1;
const maxRayDistance = 28;
const mouseSensitivity = 0.0024;
const touchLookSensitivity = 0.0052;
const walkSpeed = 4.2;
const runMultiplier = 1.35;
const groundAcceleration = 24;
const airAcceleration = 7.5;
const groundFriction = 8.5;
const airFriction = 0.25;
const maxAirSpeed = 6.8;
const rocketSpeed = 10.8;
const plasmaSpeed = 14;
const rocketDamage = 74;
const rocketSplashRadius = 1.55;
const rocketKnockback = 7.8;
const pickupRespawnTime = 7000;
const botSpeed = 1.25;
const botTouchDamage = 18;
const gravity = 13;
const jumpVelocity = 5.65;
const wallPadding = 0.18;
const stickRadius = 68;
const textureGridSize = 0.18;
const emissiveBandHeight = 0.08;

startButton.addEventListener('click', startGame);
window.addEventListener('keydown', handleKeyDown);
window.addEventListener('keyup', handleKeyUp);
window.addEventListener('mousedown', handleMouseDown);
window.addEventListener('mouseup', handleMouseUp);
window.addEventListener('blur', handleMouseUp);
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
fireButton.addEventListener('pointerup', stopFireTouch);
fireButton.addEventListener('pointercancel', stopFireTouch);
jumpButton.addEventListener('pointerdown', handleJumpTouch);
runButton.addEventListener('pointerdown', toggleRunTouch);
resetButton.addEventListener('pointerdown', handleResetTouch);
weaponButton.addEventListener('pointerdown', handleWeaponTouch);
resizeCanvas();
requestAnimationFrame(loop);

/**
 * @returns {{
 *   x: number,
 *   y: number,
 *   velocityX: number,
 *   velocityY: number,
 *   angle: number,
 *   velocityZ: number,
 *   heightOffset: number,
 *   health: number,
 *   armor: number,
 *   score: number,
 *   weaponKick: number,
 *   weaponId: string,
 *   ownedWeapons: Set<string>,
 *   ammo: { bullets: number, shells: number, rockets: number, cells: number, slugs: number, lightning: number },
 * }}
 */
function createPlayerState() {
  return {
    x: playerSpawn.x,
    y: playerSpawn.y,
    velocityX: 0,
    velocityY: 0,
    angle: playerSpawn.angle,
    velocityZ: 0,
    heightOffset: 0,
    health: 100,
    armor: 50,
    score: 0,
    weaponKick: 0,
    weaponId: 'machinegun',
    ownedWeapons: new Set(['machinegun']),
    ammo: {
      bullets: weaponConfigs.machinegun.startAmmo,
      shells: 0,
      rockets: 0,
      cells: 0,
      slugs: 0,
      lightning: 0,
    },
  };
}

/**
 * @returns {void}
 */
function startGame() {
  isStarted = true;
  startButton.classList.add('is-hidden');
  updateMessage('Старт: LIGHT MACHINE GUN. Подбирайте SG / RL / LG(shaft) / RG / PG');
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
  if (event.code === 'KeyQ') {
    cycleWeapon(-1);
  }
  if (event.code === 'KeyE') {
    cycleWeapon(1);
  }
  const digitIndex = ['Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5', 'Digit6'].indexOf(event.code);
  if (digitIndex >= 0) {
    selectWeapon(weaponOrder[digitIndex]);
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
  isMouseFiring = true;
  fireCurrentWeapon();
}

/**
 * @returns {void}
 */
function handleMouseUp() {
  isMouseFiring = false;
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
  touchControls.isFiring = true;
  fireButton.classList.add('is-active');
  fireCurrentWeapon();
}

/**
 * @param {PointerEvent} event
 * @returns {void}
 */
function handleWeaponTouch(event) {
  event.preventDefault();
  startGameFromTouch();
  cycleWeapon(1);
}

/**
 * @param {PointerEvent} event
 * @returns {void}
 */
function stopFireTouch(event) {
  event.preventDefault();
  touchControls.isFiring = false;
  fireButton.classList.remove('is-active');
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
  updateTouchFire();
  updateProjectiles(deltaTime);
  updateBeams(deltaTime);
  updateBots(deltaTime);
  updateParticles(deltaTime);
  updatePickups();
  updateHud();
}

/**
 * @returns {void}
 */
function updateTouchFire() {
  if (!touchControls.isFiring && !isMouseFiring) {
    return;
  }
  fireCurrentWeapon();
}

/**
 * @param {number} deltaTime
 * @returns {void}
 */
function updatePlayer(deltaTime) {
  const isRunning = keys.has('ShiftLeft') || keys.has('ShiftRight') || touchControls.isRunning;
  const maxSpeed = isRunning ? walkSpeed * runMultiplier : walkSpeed;
  const forward = clampAxis(getAxis('KeyW', 'KeyS') + touchControls.forward);
  const strafe = clampAxis(getAxis('KeyD', 'KeyA') + touchControls.strafe);
  const isGrounded = player.heightOffset === 0;
  const wishMove = getWishMove({ forward, strafe });
  applyHorizontalFriction({ deltaTime, isGrounded });
  acceleratePlayer({ wishMove, maxSpeed, deltaTime, isGrounded });
  limitAirSpeed({ isGrounded });
  moveEntity({ entity: player, deltaX: player.velocityX * deltaTime, deltaY: player.velocityY * deltaTime });
  player.velocityZ -= gravity * deltaTime;
  player.heightOffset = Math.max(0, player.heightOffset + player.velocityZ * deltaTime);
  if (player.heightOffset === 0) {
    player.velocityZ = 0;
    applyJumpPadBoost();
  }
  player.weaponKick = Math.max(0, player.weaponKick - deltaTime * 6);
}

/**
 * @returns {void}
 */
function applyJumpPadBoost() {
  if (getMapTile({ x: player.x, y: player.y }) !== 'J') {
    return;
  }
  player.velocityZ = jumpPadBoost;
  player.heightOffset = 0.02;
  createParticles({ x: player.x, y: player.y, color: '#45d6ff', amount: 10 });
}

/**
 * @param {{ forward: number, strafe: number }} params
 * @returns {{ x: number, y: number, length: number }}
 */
function getWishMove({ forward, strafe }) {
  const length = Math.hypot(forward, strafe) || 1;
  const normalizedForward = forward / length;
  const normalizedStrafe = strafe / length;
  const cos = Math.cos(player.angle);
  const sin = Math.sin(player.angle);
  return {
    x: cos * normalizedForward - sin * normalizedStrafe,
    y: sin * normalizedForward + cos * normalizedStrafe,
    length: Math.min(1, Math.hypot(forward, strafe)),
  };
}

/**
 * @param {{ deltaTime: number, isGrounded: boolean }} params
 * @returns {void}
 */
function applyHorizontalFriction({ deltaTime, isGrounded }) {
  const friction = isGrounded ? groundFriction : airFriction;
  const speed = Math.hypot(player.velocityX, player.velocityY);
  if (speed <= 0.01) {
    player.velocityX = 0;
    player.velocityY = 0;
    return;
  }
  const nextSpeed = Math.max(0, speed - speed * friction * deltaTime);
  player.velocityX *= nextSpeed / speed;
  player.velocityY *= nextSpeed / speed;
}

/**
 * @param {{ wishMove: { x: number, y: number, length: number }, maxSpeed: number, deltaTime: number, isGrounded: boolean }} params
 * @returns {void}
 */
function acceleratePlayer({ wishMove, maxSpeed, deltaTime, isGrounded }) {
  if (wishMove.length <= 0) {
    return;
  }
  const acceleration = isGrounded ? groundAcceleration : airAcceleration;
  const wishSpeed = maxSpeed * wishMove.length;
  const currentSpeed = player.velocityX * wishMove.x + player.velocityY * wishMove.y;
  const addSpeed = Math.max(0, wishSpeed - currentSpeed);
  const accelerationSpeed = Math.min(addSpeed, acceleration * wishSpeed * deltaTime);
  player.velocityX += wishMove.x * accelerationSpeed;
  player.velocityY += wishMove.y * accelerationSpeed;
}

/**
 * @param {{ isGrounded: boolean }} params
 * @returns {void}
 */
function limitAirSpeed({ isGrounded }) {
  const speed = Math.hypot(player.velocityX, player.velocityY);
  if (isGrounded || speed <= maxAirSpeed) {
    return;
  }
  player.velocityX *= maxAirSpeed / speed;
  player.velocityY *= maxAirSpeed / speed;
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
  applyHorizontalFriction({ deltaTime: 0.018, isGrounded: false });
}

/**
 * @returns {typeof weaponConfigs[keyof typeof weaponConfigs]}
 */
function getCurrentWeapon() {
  return weaponConfigs[player.weaponId] || weaponConfigs.machinegun;
}

/**
 * @returns {number}
 */
function getCurrentAmmo() {
  const weapon = getCurrentWeapon();
  return player.ammo[weapon.ammoKey] || 0;
}

/**
 * @param {string} weaponId
 * @returns {void}
 */
function selectWeapon(weaponId) {
  if (!player.ownedWeapons.has(weaponId)) {
    return;
  }
  player.weaponId = weaponId;
  updateMessage(`Оружие: ${weaponConfigs[weaponId].name}`);
  updateHud();
}

/**
 * @param {number} direction
 * @returns {void}
 */
function cycleWeapon(direction) {
  const owned = weaponOrder.filter((weaponId) => player.ownedWeapons.has(weaponId));
  if (owned.length <= 1) {
    return;
  }
  const currentIndex = owned.indexOf(player.weaponId);
  const nextIndex = (currentIndex + direction + owned.length) % owned.length;
  selectWeapon(owned[nextIndex]);
}

/**
 * @returns {void}
 */
function fireCurrentWeapon() {
  if (!isStarted) {
    return;
  }
  const weapon = getCurrentWeapon();
  const now = performance.now();
  if (now - lastShotAt < weapon.cooldown || getCurrentAmmo() <= 0) {
    return;
  }
  player.ammo[weapon.ammoKey] -= 1;
  lastShotAt = now;
  player.weaponKick = weapon.kick;
  if (weapon.mode === 'hitscan') {
    fireHitscanWeapon(weapon);
    return;
  }
  if (weapon.mode === 'beam') {
    fireBeamWeapon(weapon);
    return;
  }
  if (weapon.mode === 'rail') {
    fireRailWeapon(weapon);
    return;
  }
  if (weapon.mode === 'plasma') {
    firePlasmaWeapon(weapon);
    return;
  }
  fireRocketWeapon(weapon);
}

/**
 * @param {typeof weaponConfigs.machinegun} weapon
 * @returns {void}
 */
function fireHitscanWeapon(weapon) {
  if (weapon.id === 'shotgun') {
    fireShotgunWeapon(weapon);
    return;
  }
  const angle = player.angle + (Math.random() - 0.5) * 0.03;
  const hit = castHitscan({ angle, maxDistance: maxRayDistance, pierce: false });
  hit.hits.forEach(({ bot }) => applyBotDamage(bot, weapon.damage));
  createParticles({ x: hit.x, y: hit.y, color: weapon.accent, amount: 4 });
  createParticles({ x: player.x, y: player.y, color: weapon.accent, amount: 3 });
  if (weapon.tracer) {
    beams.push({
      type: 'tracer',
      x1: player.x + Math.cos(player.angle) * 0.35,
      y1: player.y + Math.sin(player.angle) * 0.35,
      x2: hit.x,
      y2: hit.y,
      life: 0.05,
      color: weapon.accent,
    });
  }
}

/**
 * @param {typeof weaponConfigs.shotgun} weapon
 * @returns {void}
 */
function fireShotgunWeapon(weapon) {
  shotgunPelletPattern.forEach((offset, index) => {
    const jitter = (Math.random() - 0.5) * 0.02;
    const angle = player.angle + offset + jitter;
    const hit = castHitscan({ angle, maxDistance: 12, pierce: false });
    hit.hits.forEach(({ bot }) => applyBotDamage(bot, weapon.damage));
    createParticles({ x: hit.x, y: hit.y, color: weapon.accent, amount: 2 });
    if (index % 2 === 0) {
      beams.push({
        type: 'pellet',
        x1: player.x + Math.cos(angle) * 0.4,
        y1: player.y + Math.sin(angle) * 0.4,
        x2: hit.x,
        y2: hit.y,
        life: 0.08,
        color: '#ffd9a0',
      });
    }
  });
  createParticles({ x: player.x, y: player.y, color: weapon.accent, amount: 14 });
  player.heightOffset = Math.min(0.18, player.heightOffset + 0.08);
}

/**
 * @param {typeof weaponConfigs.lightning} weapon
 * @returns {void}
 */
function fireBeamWeapon(weapon) {
  const hit = castHitscan({ angle: player.angle, maxDistance: weapon.maxRange || 6, pierce: false });
  hit.hits.forEach(({ bot }) => applyBotDamage(bot, weapon.damage));
  beams = beams.filter((beam) => beam.type !== 'lightning');
  beams.push({
    type: 'lightning',
    x1: player.x + Math.cos(player.angle) * 0.55,
    y1: player.y + Math.sin(player.angle) * 0.55,
    x2: hit.x,
    y2: hit.y,
    life: 0.09,
    color: weapon.accent,
    distance: hit.distance,
  });
  player.weaponKick = Math.max(player.weaponKick, 0.55);
  createParticles({ x: hit.x, y: hit.y, color: weapon.accent, amount: 4 });
}

/**
 * @param {typeof weaponConfigs.railgun} weapon
 * @returns {void}
 */
function fireRailWeapon(weapon) {
  const hit = castHitscan({ angle: player.angle, maxDistance: maxRayDistance, pierce: true });
  hit.hits.forEach(({ bot }) => applyBotDamage(bot, weapon.damage));
  beams.push({
    type: 'rail',
    x1: player.x + Math.cos(player.angle) * 0.4,
    y1: player.y + Math.sin(player.angle) * 0.4,
    x2: hit.x,
    y2: hit.y,
    life: 0.28,
    color: weapon.accent,
  });
  createParticles({ x: hit.x, y: hit.y, color: weapon.accent, amount: 16 });
}

/**
 * @param {typeof weaponConfigs.rocket} weapon
 * @returns {void}
 */
function fireRocketWeapon(weapon) {
  projectiles.push({
    type: 'rocket',
    x: player.x + Math.cos(player.angle) * 0.45,
    y: player.y + Math.sin(player.angle) * 0.45,
    angle: player.angle,
    life: 2,
    damage: weapon.damage,
    owner: 'player',
  });
  createParticles({ x: player.x, y: player.y, color: weapon.accent, amount: 8 });
}

/**
 * @param {typeof weaponConfigs.plasma} weapon
 * @returns {void}
 */
function firePlasmaWeapon(weapon) {
  projectiles.push({
    type: 'plasma',
    x: player.x + Math.cos(player.angle) * 0.4,
    y: player.y + Math.sin(player.angle) * 0.4,
    angle: player.angle,
    life: 1.4,
    damage: weapon.damage,
    owner: 'player',
  });
}

/**
 * @param {{ angle: number, maxDistance: number, pierce: boolean }} params
 * @returns {{ distance: number, x: number, y: number, hits: { bot: { x: number, y: number, health: number, color: string }, distance: number }[], hitWall: boolean }}
 */
function castHitscan({ angle, maxDistance, pierce }) {
  const step = 0.05;
  const hits = [];
  const hitBotIds = new Set();
  for (let distance = step; distance < maxDistance; distance += step) {
    const x = player.x + Math.cos(angle) * distance;
    const y = player.y + Math.sin(angle) * distance;
    if (isWall({ x, y })) {
      return { distance, x, y, hits, hitWall: true };
    }
    bots.forEach((bot) => {
      if (hitBotIds.has(bot) || getDistance({ ax: x, ay: y, bx: bot.x, by: bot.y }) >= 0.4) {
        return;
      }
      hitBotIds.add(bot);
      hits.push({ bot, distance });
    });
    if (!pierce && hits.length > 0) {
      return { distance, x, y, hits, hitWall: false };
    }
  }
  return {
    distance: maxDistance,
    x: player.x + Math.cos(angle) * maxDistance,
    y: player.y + Math.sin(angle) * maxDistance,
    hits,
    hitWall: false,
  };
}

/**
 * @param {number} deltaTime
 * @returns {void}
 */
function updateProjectiles(deltaTime) {
  projectiles = projectiles.filter((projectile) => {
    const speed = projectile.type === 'plasma' ? plasmaSpeed : rocketSpeed;
    projectile.x += Math.cos(projectile.angle) * speed * deltaTime;
    projectile.y += Math.sin(projectile.angle) * speed * deltaTime;
    projectile.life -= deltaTime;
    if (projectile.life <= 0 || isWall({ x: projectile.x, y: projectile.y })) {
      explodeProjectile(projectile);
      return false;
    }
    const hitBot = bots.find((bot) => getDistance({
      ax: projectile.x,
      ay: projectile.y,
      bx: bot.x,
      by: bot.y,
    }) < 0.34);
    if (hitBot) {
      if (projectile.type === 'plasma') {
        applyBotDamage(hitBot, projectile.damage);
        createParticles({ x: projectile.x, y: projectile.y, color: '#c084fc', amount: 10 });
      } else {
        explodeProjectile(projectile);
      }
      return false;
    }
    return true;
  });
}

/**
 * @param {number} deltaTime
 * @returns {void}
 */
function updateBeams(deltaTime) {
  beams = beams
    .map((beam) => ({ ...beam, life: beam.life - deltaTime }))
    .filter((beam) => beam.life > 0);
}

/**
 * @param {{ x: number, y: number, type: string, damage: number, owner: string }} projectile
 * @returns {void}
 */
function explodeProjectile(projectile) {
  if (projectile.type === 'plasma') {
    createParticles({ x: projectile.x, y: projectile.y, color: '#c084fc', amount: 12 });
    bots.forEach((bot) => {
      if (getDistance({ ax: projectile.x, ay: projectile.y, bx: bot.x, by: bot.y }) < 0.55) {
        applyBotDamage(bot, projectile.damage);
      }
    });
    return;
  }
  createParticles({ x: projectile.x, y: projectile.y, color: '#ff7a18', amount: 34 });
  createParticles({ x: projectile.x, y: projectile.y, color: '#45d6ff', amount: 12 });
  damageBots({ x: projectile.x, y: projectile.y, owner: projectile.owner });
  damagePlayer({ x: projectile.x, y: projectile.y, owner: projectile.owner });
  applyRocketImpulse({ x: projectile.x, y: projectile.y });
}

/**
 * @param {{ x: number, y: number, health: number, color: string }} bot
 * @param {number} damage
 * @returns {void}
 */
function applyBotDamage(bot, damage) {
  if (bot.health <= 0) {
    return;
  }
  bot.health -= damage;
  if (bot.health > 0) {
    return;
  }
  player.score += 1;
  updateMessage('Фраг!');
  bots = bots.filter((aliveBot) => aliveBot.health > 0);
  if (bots.length === 0) {
    bots = createBots();
    updateMessage('Новая волна ботов');
  }
}

/**
 * @param {{ x: number, y: number, owner: string }} params
 * @returns {void}
 */
function damageBots({ x, y }) {
  [...bots].forEach((bot) => {
    const distance = getDistance({ ax: x, ay: y, bx: bot.x, by: bot.y });
    if (distance > rocketSplashRadius) {
      return;
    }
    applyBotDamage(bot, Math.round(rocketDamage * (1 - distance / rocketSplashRadius)));
  });
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
 * @param {{ x: number, y: number }} params
 * @returns {void}
 */
function applyRocketImpulse({ x, y }) {
  const distance = getDistance({ ax: x, ay: y, bx: player.x, by: player.y });
  if (distance > rocketSplashRadius) {
    return;
  }
  const force = rocketKnockback * (1 - distance / rocketSplashRadius);
  const directionX = player.x - x;
  const directionY = player.y - y;
  const directionLength = Math.hypot(directionX, directionY) || 1;
  player.velocityX += (directionX / directionLength) * force;
  player.velocityY += (directionY / directionLength) * force;
  player.velocityZ = Math.max(player.velocityZ, jumpVelocity * 0.55 + force * 0.42);
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
  if (pickup.type === 'megahealth') {
    player.health = Math.min(200, player.health + pickup.amount);
    updateMessage('Mega Health!');
    return;
  }
  if (pickup.type === 'armor') {
    player.armor = Math.min(100, player.armor + pickup.amount);
    updateMessage('Подобрана броня');
    return;
  }
  if (pickup.type === 'weapon') {
    collectWeaponPickup(pickup.weaponId);
    return;
  }
  const weapon = getCurrentWeapon();
  player.ammo[weapon.ammoKey] = Math.min(
    weapon.maxAmmo,
    player.ammo[weapon.ammoKey] + Math.max(weapon.ammoPerPickup, 8),
  );
  updateMessage(`Патроны: ${weapon.name}`);
}

/**
 * @param {string} weaponId
 * @returns {void}
 */
function collectWeaponPickup(weaponId) {
  const weapon = weaponConfigs[weaponId];
  if (!weapon) {
    return;
  }
  const isNewWeapon = !player.ownedWeapons.has(weaponId);
  player.ownedWeapons.add(weaponId);
  player.ammo[weapon.ammoKey] = Math.min(
    weapon.maxAmmo,
    player.ammo[weapon.ammoKey] + weapon.ammoPerPickup,
  );
  if (isNewWeapon) {
    player.weaponId = weaponId;
    updateMessage(`Подобрано: ${weapon.name}`);
    return;
  }
  updateMessage(`Патроны для ${weapon.name}`);
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
  const weapon = getCurrentWeapon();
  healthValue.textContent = Math.ceil(player.health).toString();
  armorValue.textContent = Math.ceil(player.armor).toString();
  weaponValue.textContent = weapon.shortName;
  ammoValue.textContent = getCurrentAmmo().toString();
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
  drawVignette({ width, height });
  drawWeapon({ width, height });
  drawActiveLightningShaft({ width, height });
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
  skyGradient.addColorStop(0, '#07060a');
  skyGradient.addColorStop(0.4, '#15101a');
  skyGradient.addColorStop(1, '#2b1a14');
  context.fillStyle = skyGradient;
  context.fillRect(0, 0, width, horizon);
  const floorGradient = context.createLinearGradient(0, horizon, 0, height);
  floorGradient.addColorStop(0, '#3a2a22');
  floorGradient.addColorStop(0.4, '#1a1714');
  floorGradient.addColorStop(1, '#08070a');
  context.fillStyle = floorGradient;
  context.fillRect(0, horizon, width, height - horizon);
  drawFloorGrid({ width, height, horizon });
  drawCeilingLights({ width, horizon });
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
    drawWallColumn({ column, top, wallHeight, shade, hit });
    depthBuffer[column] = correctedDistance;
    depthBuffer[column + 1] = correctedDistance;
  }
  return depthBuffer;
}

/**
 * @param {{ angle: number }} params
 * @returns {{ distance: number, tile: string, x: number, y: number }}
 */
function castRay({ angle }) {
  const step = 0.035;
  for (let distance = step; distance < maxRayDistance; distance += step) {
    const x = player.x + Math.cos(angle) * distance;
    const y = player.y + Math.sin(angle) * distance;
    if (isWall({ x, y })) {
      return { distance, tile: getMapTile({ x, y }), x, y };
    }
  }
  return { distance: maxRayDistance, tile: '#', x: player.x, y: player.y };
}

/**
 * @param {{ column: number, top: number, wallHeight: number, shade: number, hit: { tile: string, x: number, y: number } }} params
 * @returns {void}
 */
function drawWallColumn({ column, top, wallHeight, shade, hit }) {
  const tile = wallTiles.has(hit.tile) ? hit.tile : '#';
  const baseColor = wallColorByType[tile] || '#2f3345';
  const accentColor = wallAccentByType[tile] || '#ff7a18';
  const textureOffset = getWallTextureOffset({ x: hit.x, y: hit.y });
  const panelLine = textureOffset % textureGridSize < 0.018;
  const emissiveLine = textureOffset > 0.46 && textureOffset < 0.46 + emissiveBandHeight;
  const gothicBand = tile === 'G' && textureOffset > 0.2 && textureOffset < 0.28;
  const techSeam = tile === 'T' && textureOffset % 0.09 < 0.012;
  const color = panelLine ? '#111827' : baseColor;
  context.fillStyle = getShadedColor({ color, shade });
  context.fillRect(column, top, rayStep + 1, wallHeight);
  if (emissiveLine) {
    context.fillStyle = getShadedColor({ color: accentColor, shade: Math.min(1, shade + 0.35) });
    context.fillRect(column, top + wallHeight * 0.36, rayStep + 1, Math.max(2, wallHeight * 0.08));
  }
  if (gothicBand) {
    context.fillStyle = getShadedColor({ color: '#6b4a38', shade: Math.min(1, shade + 0.15) });
    context.fillRect(column, top + wallHeight * 0.18, rayStep + 1, Math.max(2, wallHeight * 0.05));
  }
  if (techSeam) {
    context.fillStyle = getShadedColor({ color: '#45d6ff', shade: Math.min(0.8, shade + 0.25) });
    context.fillRect(column, top + wallHeight * 0.55, rayStep + 1, Math.max(1, wallHeight * 0.02));
  }
  if (panelLine) {
    context.fillStyle = getShadedColor({ color: accentColor, shade: Math.min(0.75, shade + 0.2) });
    context.fillRect(column, top, rayStep + 1, Math.max(1, wallHeight * 0.025));
  }
  if (tile === 'B') {
    context.fillStyle = getShadedColor({ color: '#ff4d6d', shade: Math.min(0.7, shade + 0.1) });
    context.fillRect(column, top + wallHeight * 0.7, rayStep + 1, Math.max(1, wallHeight * 0.04));
  }
}

/**
 * @param {{ x: number, y: number }} params
 * @returns {number}
 */
function getWallTextureOffset({ x, y }) {
  const xFraction = Math.abs(x - Math.floor(x));
  const yFraction = Math.abs(y - Math.floor(y));
  return Math.min(xFraction, 1 - xFraction) < Math.min(yFraction, 1 - yFraction) ? yFraction : xFraction;
}

/**
 * @param {{ width: number, height: number, horizon: number }} params
 * @returns {void}
 */
function drawFloorGrid({ width, height, horizon }) {
  context.strokeStyle = 'rgb(196 122 58 / 22%)';
  context.lineWidth = 1;
  for (let i = 1; i < 16; i += 1) {
    const y = horizon + ((height - horizon) * i * i) / 256;
    context.beginPath();
    context.moveTo(0, y);
    context.lineTo(width, y);
    context.stroke();
  }
  for (let i = -10; i <= 10; i += 1) {
    const x = width * 0.5 + i * width * 0.07;
    context.beginPath();
    context.moveTo(width * 0.5, horizon);
    context.lineTo(x, height);
    context.stroke();
  }
  context.strokeStyle = 'rgb(69 214 255 / 12%)';
  for (let i = 2; i < 10; i += 2) {
    const y = horizon + ((height - horizon) * i * i) / 256;
    context.beginPath();
    context.moveTo(width * 0.2, y);
    context.lineTo(width * 0.8, y);
    context.stroke();
  }
}

/**
 * @param {{ width: number, horizon: number }} params
 * @returns {void}
 */
function drawCeilingLights({ width, horizon }) {
  context.fillStyle = 'rgb(69 214 255 / 18%)';
  for (let i = 0; i < 6; i += 1) {
    const x = width * (0.12 + i * 0.16);
    context.fillRect(x, Math.max(12, horizon * 0.16), width * 0.07, 3);
  }
}

/**
 * @param {{ width: number, height: number }} params
 * @returns {void}
 */
function drawVignette({ width, height }) {
  const gradient = context.createRadialGradient(width * 0.5, height * 0.5, height * 0.2, width * 0.5, height * 0.5, height * 0.72);
  gradient.addColorStop(0, 'rgb(0 0 0 / 0%)');
  gradient.addColorStop(1, 'rgb(0 0 0 / 52%)');
  context.fillStyle = gradient;
  context.fillRect(0, 0, width, height);
}

/**
 * @param {{ width: number, height: number, depthBuffer: number[] }} params
 * @returns {void}
 */
function drawSprites({ width, height, depthBuffer }) {
  drawBeams({ width, height, depthBuffer });
  const sprites = [
    ...bots.map((bot) => ({ ...bot, spriteType: 'bot', size: 0.82 })),
    ...projectiles.map((projectile) => ({
      ...projectile,
      spriteType: projectile.type,
      size: projectile.type === 'plasma' ? 0.18 : 0.22,
      color: projectile.type === 'plasma' ? '#c084fc' : '#ffd166',
    })),
    ...getVisiblePickups(),
    ...getJumpPadSprites(),
    ...particles.map((particle) => ({ ...particle, spriteType: 'particle', size: 0.14 })),
  ].sort((a, b) => getSpriteDistance(b) - getSpriteDistance(a));
  sprites.forEach((sprite) => drawSprite({ sprite, width, height, depthBuffer }));
}

/**
 * @param {{ width: number, height: number, depthBuffer: number[] }} params
 * @returns {void}
 */
function drawBeams({ width, height }) {
  beams.forEach((beam) => {
    if (beam.type === 'lightning') {
      return;
    }
    const end = projectWorldPoint({ x: beam.x2, y: beam.y2, width, height, minDistance: 0.01 });
    const start = projectWorldPoint({ x: beam.x1, y: beam.y1, width, height, minDistance: 0.01 })
      || { x: width * 0.58, y: height * 0.62 };
    if (!end) {
      return;
    }
    context.strokeStyle = beam.color;
    context.lineWidth = beam.type === 'rail' ? 5 : beam.type === 'pellet' ? 2 : 2;
    context.globalAlpha = Math.max(0.2, Math.min(1, beam.life * 8));
    context.beginPath();
    context.moveTo(start.x, start.y);
    context.lineTo(end.x, end.y);
    context.stroke();
    context.globalAlpha = 1;
  });
}

/**
 * Draws the lightning shaft in screen space after the FP weapon so it is always visible.
 * @param {{ width: number, height: number }} params
 * @returns {void}
 */
function drawActiveLightningShaft({ width, height }) {
  const weapon = getCurrentWeapon();
  if (weapon.id !== 'lightning') {
    return;
  }
  const beam = beams.find((entry) => entry.type === 'lightning');
  if (!beam) {
    return;
  }
  const isMobileLayout = width < 640;
  const scale = Math.min(width, height) * (isMobileLayout ? 0.0014 : 0.0012);
  const kickOffset = player.weaponKick * scale * 20;
  const muzzleX = (isMobileLayout ? width * 0.54 : width * 0.74) + scale * 100;
  const muzzleY = height * (isMobileLayout ? 0.8 : 0.97) + kickOffset - scale * 8;
  const end = projectWorldPoint({ x: beam.x2, y: beam.y2, width, height, minDistance: 0.01 })
    || { x: width * 0.5, y: height * 0.42 };
  const reach = Math.min(1, beam.distance / (weapon.maxRange || 8.5));
  const tip = {
    x: muzzleX + (end.x - muzzleX) * (0.55 + reach * 0.45),
    y: muzzleY + (end.y - muzzleY) * (0.55 + reach * 0.45),
  };
  drawLightningBeam({
    start: { x: muzzleX, y: muzzleY },
    end: tip,
    color: beam.color,
    life: Math.max(beam.life, 0.08),
    width,
    height,
  });
}

/**
 * @param {{ start: { x: number, y: number }, end: { x: number, y: number }, color: string, life: number, width: number, height: number }} params
 * @returns {void}
 */
function drawLightningBeam({ start, end, color, life }) {
  const segments = 14;
  const alpha = Math.max(0.7, Math.min(1, life * 12));
  context.save();
  context.globalAlpha = alpha * 0.45;
  context.strokeStyle = color;
  context.lineWidth = 16;
  context.lineCap = 'round';
  context.beginPath();
  context.moveTo(start.x, start.y);
  context.lineTo(end.x, end.y);
  context.stroke();
  context.globalAlpha = alpha;
  context.strokeStyle = '#eaf6ff';
  context.lineWidth = 5;
  context.beginPath();
  context.moveTo(start.x, start.y);
  for (let i = 1; i < segments; i += 1) {
    const t = i / segments;
    const x = start.x + (end.x - start.x) * t + (Math.random() - 0.5) * 22;
    const y = start.y + (end.y - start.y) * t + (Math.random() - 0.5) * 22;
    context.lineTo(x, y);
  }
  context.lineTo(end.x, end.y);
  context.stroke();
  context.strokeStyle = '#ffffff';
  context.lineWidth = 2.5;
  context.beginPath();
  context.moveTo(start.x, start.y);
  for (let i = 1; i < segments; i += 1) {
    const t = i / segments;
    const x = start.x + (end.x - start.x) * t + (Math.random() - 0.5) * 12;
    const y = start.y + (end.y - start.y) * t + (Math.random() - 0.5) * 12;
    context.lineTo(x, y);
  }
  context.lineTo(end.x, end.y);
  context.stroke();
  context.fillStyle = 'rgb(255 255 255 / 80%)';
  context.beginPath();
  context.arc(start.x, start.y, 12 + Math.random() * 8, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = 'rgb(154 215 255 / 70%)';
  context.beginPath();
  context.arc(end.x, end.y, 8 + Math.random() * 6, 0, Math.PI * 2);
  context.fill();
  context.restore();
}

/**
 * @param {{ x: number, y: number, width: number, height: number, minDistance?: number }} params
 * @returns {{ x: number, y: number } | null}
 */
function projectWorldPoint({ x, y, width, height, minDistance = 0.05 }) {
  const distance = getDistance({ ax: player.x, ay: player.y, bx: x, by: y });
  const angleToPoint = normalizeAngle(Math.atan2(y - player.y, x - player.x) - player.angle);
  if (Math.abs(angleToPoint) > fieldOfView * 0.8 || distance < minDistance) {
    return null;
  }
  const depthScale = Math.min(1.2, 0.35 + distance * 0.12);
  return {
    x: width * 0.5 + Math.tan(angleToPoint) * (width / fieldOfView),
    y: height * 0.5 - player.heightOffset * 16 + (1 - Math.min(distance, 8) / 8) * 18 * depthScale,
  };
}

/**
 * @returns {{ x: number, y: number, color: string, spriteType: string, size: number }[]}
 */
function getJumpPadSprites() {
  return arenaMap.flatMap((row, y) => row
    .split('')
    .map((tile, x) => ({ tile, x, y }))
    .filter(({ tile }) => tile === 'J')
    .map(({ x, y }) => ({
      x: x + 0.5,
      y: y + 0.5,
      color: '#45d6ff',
      spriteType: 'jumppad',
      size: 0.48,
    })));
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
  if (sprite.spriteType === 'rocket') {
    drawRocketSprite({ screenX, spriteTop, screenSize });
    return;
  }
  if (sprite.spriteType === 'plasma') {
    drawPlasmaSprite({ screenX, spriteTop, screenSize });
    return;
  }
  if (sprite.spriteType === 'pickup') {
    drawPickupSprite({
      screenX,
      spriteTop,
      screenSize,
      color: sprite.color,
      type: sprite.type,
      weaponId: sprite.weaponId,
    });
    return;
  }
  if (sprite.spriteType === 'jumppad') {
    drawJumpPadSprite({ screenX, spriteTop, screenSize });
    return;
  }
  context.beginPath();
  context.arc(screenX, spriteTop + screenSize * 0.5, screenSize * 0.5, 0, Math.PI * 2);
  context.fill();
}

/**
 * @param {{ screenX: number, spriteTop: number, screenSize: number }} params
 * @returns {void}
 */
function drawJumpPadSprite({ screenX, spriteTop, screenSize }) {
  const centerY = spriteTop + screenSize * 0.72;
  context.fillStyle = 'rgb(69 214 255 / 28%)';
  context.beginPath();
  context.ellipse(screenX, centerY, screenSize * 0.7, screenSize * 0.28, 0, 0, Math.PI * 2);
  context.fill();
  context.strokeStyle = '#45d6ff';
  context.lineWidth = Math.max(2, screenSize * 0.08);
  context.beginPath();
  context.ellipse(screenX, centerY, screenSize * 0.55, screenSize * 0.2, 0, 0, Math.PI * 2);
  context.stroke();
  context.fillStyle = '#ff7a18';
  context.beginPath();
  context.moveTo(screenX, centerY - screenSize * 0.45);
  context.lineTo(screenX + screenSize * 0.18, centerY);
  context.lineTo(screenX - screenSize * 0.18, centerY);
  context.closePath();
  context.fill();
}

/**
 * @param {{ screenX: number, spriteTop: number, screenSize: number, color: string }} params
 * @returns {void}
 */
function drawBotSprite({ screenX, spriteTop, screenSize, color }) {
  context.fillStyle = 'rgb(0 0 0 / 38%)';
  context.fillRect(screenX - screenSize * 0.36, spriteTop + screenSize * 0.86, screenSize * 0.72, screenSize * 0.09);
  context.fillStyle = '#111827';
  context.fillRect(screenX - screenSize * 0.52, spriteTop + screenSize * 0.28, screenSize * 0.18, screenSize * 0.22);
  context.fillRect(screenX + screenSize * 0.34, spriteTop + screenSize * 0.28, screenSize * 0.18, screenSize * 0.22);
  context.fillStyle = color;
  context.beginPath();
  context.moveTo(screenX - screenSize * 0.34, spriteTop + screenSize * 0.24);
  context.lineTo(screenX + screenSize * 0.34, spriteTop + screenSize * 0.24);
  context.lineTo(screenX + screenSize * 0.24, spriteTop + screenSize * 0.78);
  context.lineTo(screenX - screenSize * 0.24, spriteTop + screenSize * 0.78);
  context.closePath();
  context.fill();
  context.fillStyle = '#20283a';
  context.fillRect(screenX - screenSize * 0.24, spriteTop + screenSize * 0.34, screenSize * 0.48, screenSize * 0.18);
  context.fillStyle = '#d7e4f2';
  context.beginPath();
  context.moveTo(screenX - screenSize * 0.22, spriteTop + screenSize * 0.04);
  context.lineTo(screenX + screenSize * 0.22, spriteTop + screenSize * 0.04);
  context.lineTo(screenX + screenSize * 0.18, spriteTop + screenSize * 0.3);
  context.lineTo(screenX - screenSize * 0.18, spriteTop + screenSize * 0.3);
  context.closePath();
  context.fill();
  context.fillStyle = '#45d6ff';
  context.fillRect(screenX - screenSize * 0.16, spriteTop + screenSize * 0.11, screenSize * 0.32, screenSize * 0.055);
  context.fillStyle = '#111827';
  context.fillRect(screenX - screenSize * 0.39, spriteTop + screenSize * 0.43, screenSize * 0.12, screenSize * 0.33);
  context.fillRect(screenX + screenSize * 0.27, spriteTop + screenSize * 0.43, screenSize * 0.12, screenSize * 0.33);
  context.fillStyle = '#0b101c';
  context.fillRect(screenX - screenSize * 0.22, spriteTop + screenSize * 0.78, screenSize * 0.14, screenSize * 0.16);
  context.fillRect(screenX + screenSize * 0.08, spriteTop + screenSize * 0.78, screenSize * 0.14, screenSize * 0.16);
}

/**
 * @param {{ screenX: number, spriteTop: number, screenSize: number }} params
 * @returns {void}
 */
function drawRocketSprite({ screenX, spriteTop, screenSize }) {
  const centerY = spriteTop + screenSize * 0.5;
  context.fillStyle = 'rgb(255 122 24 / 34%)';
  context.beginPath();
  context.arc(screenX, centerY, screenSize * 1.75, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = 'rgb(255 209 102 / 42%)';
  context.fillRect(screenX - screenSize * 1.6, centerY - screenSize * 0.18, screenSize * 1.4, screenSize * 0.36);
  context.fillStyle = '#ffd166';
  context.beginPath();
  context.arc(screenX, centerY, screenSize * 0.62, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = '#f5f7fb';
  context.beginPath();
  context.arc(screenX + screenSize * 0.12, centerY - screenSize * 0.08, screenSize * 0.22, 0, Math.PI * 2);
  context.fill();
}

/**
 * @param {{ screenX: number, spriteTop: number, screenSize: number }} params
 * @returns {void}
 */
function drawPlasmaSprite({ screenX, spriteTop, screenSize }) {
  const centerY = spriteTop + screenSize * 0.5;
  context.fillStyle = 'rgb(192 132 252 / 35%)';
  context.beginPath();
  context.arc(screenX, centerY, screenSize * 1.3, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = '#c084fc';
  context.beginPath();
  context.arc(screenX, centerY, screenSize * 0.55, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = '#f5f7fb';
  context.beginPath();
  context.arc(screenX - screenSize * 0.1, centerY - screenSize * 0.1, screenSize * 0.18, 0, Math.PI * 2);
  context.fill();
}

/**
 * @param {{ screenX: number, spriteTop: number, screenSize: number, color: string, type: string, weaponId?: string }} params
 * @returns {void}
 */
function drawPickupSprite({ screenX, spriteTop, screenSize, color, type, weaponId }) {
  const centerY = spriteTop + screenSize * 0.5;
  context.fillStyle = `${color}33`;
  context.beginPath();
  context.arc(screenX, centerY, screenSize * 0.78, 0, Math.PI * 2);
  context.fill();
  context.strokeStyle = color;
  context.lineWidth = Math.max(2, screenSize * 0.08);
  context.beginPath();
  context.arc(screenX, centerY, screenSize * 0.5, 0, Math.PI * 2);
  context.stroke();
  context.fillStyle = color;
  if (type === 'weapon' && weaponId) {
    drawWeaponPickupIcon({ screenX, centerY, screenSize, weaponId, color });
    return;
  }
  if (type === 'health' || type === 'megahealth') {
    context.fillRect(screenX - screenSize * 0.12, centerY - screenSize * 0.35, screenSize * 0.24, screenSize * 0.7);
    context.fillRect(screenX - screenSize * 0.35, centerY - screenSize * 0.12, screenSize * 0.7, screenSize * 0.24);
    return;
  }
  if (type === 'armor') {
    context.fillRect(screenX - screenSize * 0.28, centerY - screenSize * 0.28, screenSize * 0.56, screenSize * 0.56);
    context.fillStyle = '#0b101c';
    context.fillRect(screenX - screenSize * 0.14, centerY - screenSize * 0.14, screenSize * 0.28, screenSize * 0.28);
    return;
  }
  context.beginPath();
  context.moveTo(screenX, centerY - screenSize * 0.42);
  context.lineTo(screenX + screenSize * 0.32, centerY);
  context.lineTo(screenX, centerY + screenSize * 0.42);
  context.lineTo(screenX - screenSize * 0.32, centerY);
  context.closePath();
  context.fill();
}

/**
 * @param {{ screenX: number, centerY: number, screenSize: number, weaponId: string, color: string }} params
 * @returns {void}
 */
function drawWeaponPickupIcon({ screenX, centerY, screenSize, weaponId, color }) {
  context.fillStyle = color;
  if (weaponId === 'shotgun') {
    context.fillRect(screenX - screenSize * 0.35, centerY - screenSize * 0.1, screenSize * 0.7, screenSize * 0.2);
    context.fillRect(screenX + screenSize * 0.05, centerY - screenSize * 0.22, screenSize * 0.12, screenSize * 0.44);
    return;
  }
  if (weaponId === 'rocket') {
    context.fillRect(screenX - screenSize * 0.3, centerY - screenSize * 0.12, screenSize * 0.6, screenSize * 0.24);
    context.beginPath();
    context.arc(screenX + screenSize * 0.28, centerY, screenSize * 0.16, 0, Math.PI * 2);
    context.fill();
    return;
  }
  if (weaponId === 'lightning') {
    context.beginPath();
    context.moveTo(screenX - screenSize * 0.1, centerY - screenSize * 0.35);
    context.lineTo(screenX + screenSize * 0.15, centerY - screenSize * 0.05);
    context.lineTo(screenX - screenSize * 0.05, centerY - screenSize * 0.05);
    context.lineTo(screenX + screenSize * 0.1, centerY + screenSize * 0.35);
    context.lineTo(screenX - screenSize * 0.18, centerY + screenSize * 0.02);
    context.lineTo(screenX + screenSize * 0.02, centerY + screenSize * 0.02);
    context.closePath();
    context.fill();
    return;
  }
  if (weaponId === 'railgun') {
    context.fillRect(screenX - screenSize * 0.4, centerY - screenSize * 0.08, screenSize * 0.8, screenSize * 0.16);
    context.fillStyle = '#f5f7fb';
    context.fillRect(screenX - screenSize * 0.05, centerY - screenSize * 0.22, screenSize * 0.1, screenSize * 0.44);
    return;
  }
  context.beginPath();
  context.arc(screenX, centerY, screenSize * 0.28, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = '#f5f7fb';
  context.beginPath();
  context.arc(screenX, centerY, screenSize * 0.12, 0, Math.PI * 2);
  context.fill();
}

/**
 * @param {{ width: number, height: number }} params
 * @returns {void}
 */
function drawWeapon({ width, height }) {
  const weapon = getCurrentWeapon();
  const isMobileLayout = width < 640;
  const scale = Math.min(width, height) * (isMobileLayout ? 0.0014 : 0.0012);
  const anchorX = isMobileLayout ? width * 0.54 : width * 0.74;
  const anchorY = height * (isMobileLayout ? 0.8 : 0.97);
  const kickOffset = player.weaponKick * scale * 20;
  context.save();
  context.translate(anchorX, anchorY + kickOffset);
  context.rotate(-0.2);
  context.fillStyle = 'rgb(0 0 0 / 55%)';
  context.fillRect(-scale * 40, scale * 24, scale * 90, scale * 12);
  if (weapon.id === 'machinegun') {
    drawMachineGunModel({ scale, weapon });
  } else if (weapon.id === 'shotgun') {
    drawShotgunModel({ scale, weapon });
  } else if (weapon.id === 'rocket') {
    drawRocketLauncherModel({ scale, weapon });
  } else if (weapon.id === 'lightning') {
    drawLightningGunModel({ scale, weapon });
  } else if (weapon.id === 'railgun') {
    drawRailgunModel({ scale, weapon });
  } else {
    drawPlasmaGunModel({ scale, weapon });
  }
  const isLightningFiring = weapon.id === 'lightning' && beams.some((beam) => beam.type === 'lightning');
  if (player.weaponKick > 0.05 || isLightningFiring) {
    const flashPower = isLightningFiring ? 0.9 : player.weaponKick;
    context.fillStyle = `rgb(255 255 255 / ${Math.min(0.85, flashPower)})`;
    context.beginPath();
    context.arc(scale * 88, -scale * 4, scale * (isLightningFiring ? 22 : 16) * flashPower, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = `${weapon.accent}cc`;
    context.beginPath();
    context.arc(scale * 92, -scale * 2, scale * 10 * flashPower, 0, Math.PI * 2);
    context.fill();
  }
  context.restore();
  if (!isStarted) {
    return;
  }
  context.save();
  context.font = `800 ${Math.max(11, scale * 8)}px Inter, sans-serif`;
  context.fillStyle = weapon.accent;
  context.textAlign = isMobileLayout ? 'center' : 'right';
  context.fillText(weapon.name, isMobileLayout ? width * 0.5 : width - 14, height - scale * 10);
  context.restore();
}

/**
 * @param {{ scale: number, weapon: { color: string, accent: string } }} params
 * @returns {void}
 */
function drawMachineGunModel({ scale, weapon }) {
  context.fillStyle = '#2a3140';
  context.fillRect(-scale * 34, -scale * 12, scale * 48, scale * 30);
  context.fillStyle = weapon.color;
  context.fillRect(-scale * 18, -scale * 8, scale * 62, scale * 20);
  context.fillStyle = '#111827';
  context.fillRect(scale * 36, -scale * 6, scale * 62, scale * 12);
  context.fillStyle = '#5a6478';
  context.fillRect(scale * 90, -scale * 8, scale * 10, scale * 16);
  context.fillStyle = weapon.accent;
  context.fillRect(-scale * 8, -scale * 16, scale * 40, scale * 5);
  for (let i = 0; i < 5; i += 1) {
    context.fillRect(-scale * 28, -scale * 4 + i * scale * 4, scale * 10, scale * 2);
  }
  context.fillStyle = '#111827';
  context.fillRect(-scale * 10, scale * 14, scale * 16, scale * 26);
  context.fillStyle = '#f5f7fb';
  context.font = `900 ${Math.max(8, scale * 7)}px Inter, sans-serif`;
  context.fillText('LMG', -scale * 12, scale * 4);
}

/**
 * @param {{ scale: number, weapon: { color: string, accent: string } }} params
 * @returns {void}
 */
function drawShotgunModel({ scale, weapon }) {
  context.fillStyle = '#3a2f28';
  context.fillRect(-scale * 24, -scale * 8, scale * 40, scale * 22);
  context.fillStyle = weapon.color;
  context.fillRect(scale * 10, -scale * 18, scale * 78, scale * 12);
  context.fillRect(scale * 10, scale * 2, scale * 78, scale * 12);
  context.fillStyle = '#1a1410';
  context.fillRect(scale * 78, -scale * 20, scale * 14, scale * 16);
  context.fillRect(scale * 78, scale * 0, scale * 14, scale * 16);
  context.fillStyle = weapon.accent;
  context.fillRect(scale * 20, -scale * 22, scale * 24, scale * 4);
  context.fillStyle = '#111827';
  context.fillRect(-scale * 4, scale * 12, scale * 18, scale * 30);
  context.fillStyle = '#f5f7fb';
  context.font = `900 ${Math.max(8, scale * 7)}px Inter, sans-serif`;
  context.fillText('SG', -scale * 4, scale * 4);
}

/**
 * @param {{ scale: number, weapon: { color: string, accent: string } }} params
 * @returns {void}
 */
function drawRocketLauncherModel({ scale, weapon }) {
  context.fillStyle = weapon.color;
  context.beginPath();
  context.moveTo(-scale * 36, scale * 8);
  context.lineTo(scale * 20, -scale * 28);
  context.lineTo(scale * 48, -scale * 18);
  context.lineTo(scale * 56, scale * 18);
  context.lineTo(-scale * 12, scale * 30);
  context.closePath();
  context.fill();
  context.strokeStyle = weapon.accent;
  context.lineWidth = Math.max(2, scale * 1.5);
  context.stroke();
  context.fillStyle = '#151b28';
  context.fillRect(scale * 40, -scale * 14, scale * 48, scale * 18);
  context.fillRect(scale * 40, scale * 4, scale * 48, scale * 18);
  context.fillStyle = weapon.accent;
  context.fillRect(scale * 78, -scale * 10, scale * 8, scale * 10);
  context.fillRect(scale * 78, scale * 8, scale * 8, scale * 10);
  context.fillStyle = '#f5f7fb';
  context.font = `900 ${Math.max(8, scale * 7)}px Inter, sans-serif`;
  context.fillText('RL', -scale * 8, scale * 4);
}

/**
 * @param {{ scale: number, weapon: { color: string, accent: string } }} params
 * @returns {void}
 */
function drawLightningGunModel({ scale, weapon }) {
  context.fillStyle = weapon.color;
  context.fillRect(-scale * 28, -scale * 18, scale * 52, scale * 36);
  context.fillStyle = '#111827';
  context.fillRect(scale * 16, -scale * 10, scale * 62, scale * 20);
  context.fillStyle = weapon.accent;
  context.fillRect(scale * 70, -scale * 14, scale * 22, scale * 28);
  context.beginPath();
  context.moveTo(scale * 88, -scale * 20);
  context.lineTo(scale * 112, scale * 0);
  context.lineTo(scale * 88, scale * 20);
  context.closePath();
  context.fill();
  context.fillStyle = '#ffffff';
  context.fillRect(scale * 78, -scale * 3, scale * 18, scale * 6);
  context.fillStyle = weapon.accent;
  context.fillRect(-scale * 10, -scale * 24, scale * 28, scale * 5);
  context.fillStyle = '#f5f7fb';
  context.font = `900 ${Math.max(8, scale * 7)}px Inter, sans-serif`;
  context.fillText('SHAFT', -scale * 16, scale * 4);
}

/**
 * @param {{ scale: number, weapon: { color: string, accent: string } }} params
 * @returns {void}
 */
function drawRailgunModel({ scale, weapon }) {
  context.fillStyle = weapon.color;
  context.fillRect(-scale * 30, -scale * 12, scale * 50, scale * 26);
  context.fillStyle = '#102018';
  context.fillRect(scale * 14, -scale * 6, scale * 82, scale * 12);
  context.fillStyle = weapon.accent;
  context.fillRect(scale * 20, -scale * 10, scale * 60, scale * 4);
  context.fillRect(scale * 84, -scale * 12, scale * 12, scale * 24);
  context.fillStyle = '#f5f7fb';
  context.font = `900 ${Math.max(8, scale * 7)}px Inter, sans-serif`;
  context.fillText('RG', -scale * 10, scale * 4);
}

/**
 * @param {{ scale: number, weapon: { color: string, accent: string } }} params
 * @returns {void}
 */
function drawPlasmaGunModel({ scale, weapon }) {
  context.fillStyle = weapon.color;
  context.fillRect(-scale * 26, -scale * 18, scale * 55, scale * 36);
  context.fillStyle = '#1a1430';
  context.beginPath();
  context.arc(scale * 48, scale * 0, scale * 18, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = weapon.accent;
  context.beginPath();
  context.arc(scale * 48, scale * 0, scale * 10, 0, Math.PI * 2);
  context.fill();
  context.fillRect(scale * 58, -scale * 5, scale * 30, scale * 10);
  context.fillStyle = '#f5f7fb';
  context.font = `900 ${Math.max(8, scale * 7)}px Inter, sans-serif`;
  context.fillText('PG', -scale * 8, scale * 4);
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
  const scale = 4;
  const offsetX = 12;
  const offsetY = 12;
  context.fillStyle = 'rgb(0 0 0 / 55%)';
  context.fillRect(offsetX - 6, offsetY - 6, arenaMap[0].length * scale + 12, arenaMap.length * scale + 12);
  arenaMap.forEach((row, y) => {
    row.split('').forEach((tile, x) => {
      context.fillStyle = getMiniMapTileColor(tile);
      context.fillRect(offsetX + x * scale, offsetY + y * scale, scale - 1, scale - 1);
    });
  });
  drawMiniMapPoint({ x: player.x, y: player.y, color: '#f5f7fb', scale, offsetX, offsetY });
  bots.forEach((bot) => drawMiniMapPoint({ x: bot.x, y: bot.y, color: bot.color, scale, offsetX, offsetY }));
}

/**
 * @param {string} tile
 * @returns {string}
 */
function getMiniMapTileColor(tile) {
  if (tile === 'G') {
    return '#6b4a38';
  }
  if (tile === 'T') {
    return '#3a6a7a';
  }
  if (tile === 'B') {
    return '#2a3145';
  }
  if (tile === '#') {
    return '#596179';
  }
  if (tile === 'J') {
    return '#45d6ff';
  }
  if (tile === 'H' || tile === 'M') {
    return '#36f28f';
  }
  if (tile === 'A') {
    return '#ffd166';
  }
  if (tile === 'R') {
    return '#6ea8ff';
  }
  if (weaponTileConfigs[tile]) {
    return weaponConfigs[weaponTileConfigs[tile]].accent;
  }
  return 'rgb(255 255 255 / 9%)';
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
  } else if (entity === player) {
    player.velocityX = 0;
  }
  if (!isWall({ x: entity.x, y: nextY + Math.sign(deltaY) * wallPadding })) {
    entity.y = nextY;
  } else if (entity === player) {
    player.velocityY = 0;
  }
}

/**
 * @param {{ x: number, y: number }} params
 * @returns {boolean}
 */
function isWall({ x, y }) {
  return wallTiles.has(getMapTile({ x, y }));
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
    .flatMap(({ tile, x, y }) => {
      if (pickupConfigs[tile]) {
        return [{
          x: x + 0.5,
          y: y + 0.5,
          type: pickupConfigs[tile].type,
          amount: pickupConfigs[tile].amount,
          color: pickupConfigs[tile].color,
          availableAt: 0,
        }];
      }
      const weaponId = weaponTileConfigs[tile];
      if (!weaponId) {
        return [];
      }
      const weapon = weaponConfigs[weaponId];
      return [{
        x: x + 0.5,
        y: y + 0.5,
        type: 'weapon',
        weaponId,
        amount: weapon.ammoPerPickup,
        color: weapon.accent,
        availableAt: 0,
      }];
    }));
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
  const nextPlayer = createPlayerState();
  Object.assign(player, nextPlayer);
  player.ownedWeapons = new Set(['machinegun']);
  bots = createBots();
  projectiles = [];
  beams = [];
  particles = [];
  pickups.forEach((pickup) => {
    pickup.availableAt = 0;
  });
  updateHud();
}
