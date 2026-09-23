const { staircase, tower, zigzag, islands, pitgauntlet, springclimb } = require('./gen_many.js');
const { validate } = require('./validate_mod.js');
const { Map } = require('./gen_ladder.js');

// ---- New element sprinkle (unchanged behavior, adds diverse objects) ----
function sprinkle(map, idx, W, H) {
  const g = map.map(r => r.split(''));
  const s = H - 2;
  for (let c = 8; c < W - 6; c += 7) {
    if (g[s - 2][c] === '.' && (c + idx) % 3 === 0) g[s - 2][c] = 'G';
    else if (g[s - 2][c] === '.' && (c + idx) % 4 === 0) g[s - 2][c] = '$';
  }
  let doorCol = -1;
  for (let r = 0; r < H; r++) if (g[r][W - 5] === 'B') doorCol = r;
  if (doorCol > 0) { g[doorCol - 1][W - 4] = 'D'; g[doorCol - 2][Math.max(4, W - 14)] = 'K'; }
  const cp = Math.floor(W * 0.5);
  if (g[s - 1][cp] === '.') g[s - 1][cp] = 'R';
  function safe(x) { return x >= 0 && x < W && g[s - 2][x] === '.'; }
  if (safe(4)) g[s - 2][4] = '^';
  if (safe(6)) g[s - 2][6] = '+';
  if (safe(11) && idx % 2 === 0) g[s - 2][11] = 'H';
  if (safe(13) && idx % 3 === 0) g[s - 2][13] = '*';
  if (idx >= 5 && safe(17)) g[s - 2][17] = 'Q';
  if (idx >= 10 && safe(19)) g[s - 2][19] = 'E';
  if (idx % 4 === 1 && safe(22)) g[s - 2][22] = 'g';
  for (let c = 0; c < W; c++) if (g[s][c] === '.' && g[s + 1][c] === '.') g[s][c] = '~';
  if (idx % 2 === 0) for (let r = 0; r < H - 3; r++) for (let c = 6; c < W - 8; c += 9) if (g[r][c] === 'B') g[r][c] = 'i';
  if (idx % 3 === 1) for (let c = 10; c < W - 10; c += 12) if (g[s][c] === '#') g[s][c] = '>';
  if (idx >= 8) { let placed = 0; for (let r = 0; r < H - 2 && placed < 2; r++) for (let c = 4; c < W - 4; c++) if (g[r][c] === '.' && g[r + 1][c] === 'B' && (idx * 31 + c) % 5 === 0) { g[r][c] = placed % 2 === 0 ? 'M' : 'o'; placed++; } }
  if (idx >= 12) { for (let c = 4; c < W - 4; c++) if (g[s - 2][c] === '.') { g[s - 2][c] = '('; break; } for (let c = W - 4; c > 4; c--) if (g[s - 2][c] === '.') { g[s - 2][c] = ')'; break; } }
  if (idx >= 6) { let pg = false; for (let rr = 0; rr < H - 2 && !pg; rr++) for (let cc = 6; cc < W - 6; cc++) if (g[rr][cc] === 'B' && g[rr - 1][cc] === '.') { g[rr - 1][cc] = '&'; pg = true; break; } }
  return g.map(r => r.join(''));
}

// ---- 40 normal levels across 6 archetypes with varied sizes ----
function buildNormals() {
  const L = [];
  function push(archetype, name, args, opts) { L.push([name, archetype.apply(null, args), opts]); }
  // World 1
  push(staircase, 'stair', [44, 15, [10, 6, 2], 11], { spikes: [20, 24] });
  push(islands, 'islands', [60, 17, [{ x: 6, y: 13, w: 6 }, { x: 14, y: 10, w: 6 }, { x: 22, y: 7, w: 6 }, { x: 30, y: 4, w: 6 }, { x: 38, y: 1, w: 6 }]], { spikes: [46, 50] });
  push(zigzag, 'zigzag', [56, 17, [11, 7, 3], 11], { spikes: [20, 32] });
  push(pitgauntlet, 'pit', [64, 15, [[8, 9], [18, 19], [28, 29], [38, 39], [48, 49]]], { spikes: [14, 24, 44] });
  // World 2
  push(tower, 'tower', [52, 18, 4], { spikes: [20, 34] });
  push(springclimb, 'spring', [56, 17, [{ x: 4, y: 13, w: 6 }, { x: 14, y: 9, w: 6 }, { x: 26, y: 5, w: 6 }, { x: 38, y: 9, w: 6 }, { x: 50, y: 5, w: 6 }]], { spikes: [22, 40] });
  push(islands, 'islands', [68, 18, [{ x: 6, y: 14, w: 6 }, { x: 14, y: 11, w: 6 }, { x: 22, y: 8, w: 6 }, { x: 30, y: 5, w: 6 }, { x: 38, y: 2, w: 6 }]], { spikes: [50, 54] });
  push(staircase, 'stair', [60, 17, [12, 8, 4], 11], { spikes: [20, 24, 40, 44], springs: [28] });
  // World 3
  push(zigzag, 'zigzag', [64, 18, [12, 8, 4], 11], { spikes: [22, 40] });
  push(pitgauntlet, 'pit', [72, 16, [[10, 11], [22, 23], [34, 35], [46, 47], [58, 59]]], { spikes: [16, 28, 40, 52] });
  push(tower, 'tower', [60, 19, 5], { spikes: [24, 40] });
  push(islands, 'islands', [72, 19, [{ x: 6, y: 15, w: 6 }, { x: 14, y: 12, w: 6 }, { x: 22, y: 9, w: 6 }, { x: 30, y: 6, w: 6 }, { x: 38, y: 3, w: 6 }]], { spikes: [56, 60] });
  // World 4
  push(staircase, 'stair', [70, 18, [12, 8, 4], 12], { spikes: [22, 38, 52], springs: [30] });
  push(pitgauntlet, 'pit', [80, 17, [[12, 13], [26, 27], [40, 41], [54, 55], [68, 69]]], { spikes: [18, 32, 46, 60] });
  push(springclimb, 'spring', [64, 18, [{ x: 4, y: 14, w: 6 }, { x: 16, y: 10, w: 6 }, { x: 30, y: 6, w: 6 }, { x: 44, y: 10, w: 6 }, { x: 56, y: 6, w: 6 }]], { spikes: [24, 44] });
  push(zigzag, 'zigzag', [72, 19, [13, 9, 5, 1], 10], { spikes: [24, 44, 54] });
  // World 5
  push(islands, 'islands', [80, 20, [{ x: 6, y: 16, w: 6 }, { x: 14, y: 13, w: 6 }, { x: 22, y: 10, w: 6 }, { x: 30, y: 7, w: 6 }, { x: 38, y: 4, w: 6 }]], { spikes: [60, 66] });
  push(staircase, 'stair', [76, 19, [14, 10, 6, 2], 11], { spikes: [20, 30, 44, 54, 60], springs: [28] });
  push(pitgauntlet, 'pit', [84, 18, [[12, 13], [28, 29], [44, 45], [60, 61], [76, 77]]], { spikes: [20, 36, 52, 68] });
  push(tower, 'tower', [64, 20, 5], { spikes: [26, 44] });
  // World 6
  push(zigzag, 'zigzag', [80, 20, [15, 11, 7, 3], 11], { spikes: [26, 42, 58, 70], springs: [34] });
  push(springclimb, 'spring', [72, 19, [{ x: 4, y: 15, w: 6 }, { x: 16, y: 11, w: 6 }, { x: 30, y: 7, w: 6 }, { x: 44, y: 11, w: 6 }, { x: 56, y: 7, w: 6 }]], { spikes: [26, 48] });
  push(islands, 'islands', [84, 20, [{ x: 6, y: 16, w: 6 }, { x: 14, y: 13, w: 6 }, { x: 22, y: 10, w: 6 }, { x: 30, y: 7, w: 6 }, { x: 38, y: 4, w: 6 }]], { spikes: [64, 70] });
  push(staircase, 'stair', [80, 19, [14, 10, 6, 2], 11], { spikes: [22, 34, 46, 58, 70], springs: [30] });
  // World 7 (repeat pattern with varied sizes)
  push(tower, 'tower', [56, 17, 4], { spikes: [20, 36] });
  push(pitgauntlet, 'pit', [76, 16, [[12, 13], [28, 29], [44, 45], [60, 61]]], { spikes: [20, 36, 52, 68] });
  push(islands, 'islands', [76, 19, [{ x: 6, y: 15, w: 6 }, { x: 14, y: 12, w: 6 }, { x: 22, y: 9, w: 6 }, { x: 30, y: 6, w: 6 }, { x: 38, y: 3, w: 6 }]], { spikes: [56, 60] });
  push(zigzag, 'zigzag', [76, 19, [14, 10, 6, 2], 11], { spikes: [24, 40, 56, 66] });
  // World 8
  push(staircase, 'stair', [80, 20, [15, 11, 7, 3], 11], { spikes: [24, 38, 52, 66, 76], springs: [32] });
  push(springclimb, 'spring', [72, 19, [{ x: 4, y: 15, w: 6 }, { x: 16, y: 11, w: 6 }, { x: 30, y: 7, w: 6 }, { x: 44, y: 11, w: 6 }, { x: 56, y: 7, w: 6 }]], { spikes: [26, 48] });
  push(pitgauntlet, 'pit', [84, 19, [[12, 13], [30, 31], [48, 49], [66, 67]]], { spikes: [22, 40, 58, 76] });
  push(islands, 'islands', [84, 20, [{ x: 6, y: 16, w: 6 }, { x: 14, y: 13, w: 6 }, { x: 22, y: 10, w: 6 }, { x: 30, y: 7, w: 6 }, { x: 38, y: 4, w: 6 }]], { spikes: [64, 70] });
  // World 9
  push(zigzag, 'zigzag', [80, 20, [15, 11, 7, 3], 11], { spikes: [26, 42, 58, 70], springs: [34] });
  push(tower, 'tower', [68, 20, 5], { spikes: [28, 46] });
  push(staircase, 'stair', [84, 20, [15, 11, 7, 3], 12], { spikes: [24, 38, 54, 68, 80], springs: [32] });
  push(pitgauntlet, 'pit', [88, 19, [[12, 13], [30, 31], [48, 49], [66, 67], [82, 83]]], { spikes: [22, 40, 58, 76] });
  // World 10
  push(islands, 'islands', [86, 20, [{ x: 6, y: 16, w: 6 }, { x: 14, y: 13, w: 6 }, { x: 22, y: 10, w: 6 }, { x: 30, y: 7, w: 6 }, { x: 38, y: 4, w: 6 }]], { spikes: [66, 72] });
  push(springclimb, 'spring', [80, 20, [{ x: 4, y: 16, w: 6 }, { x: 18, y: 12, w: 6 }, { x: 34, y: 8, w: 6 }, { x: 50, y: 12, w: 6 }, { x: 66, y: 8, w: 6 }]], { spikes: [28, 52] });
  push(zigzag, 'zigzag', [86, 20, [15, 11, 7, 3], 12], { spikes: [26, 44, 62, 80] });
  push(staircase, 'stair', [88, 20, [15, 11, 7, 3], 12], { spikes: [24, 40, 56, 72, 84], springs: [34] });
  return L;
}
const normals = buildNormals();

// ---- boss arena ----
function makeBossArena(W) {
  const H = 16, surface = 14, m = Map(W, H);
  m.solid(surface, 0, W - 1); m.solid(H - 1, 0, W - 1);
  m.brick(10, 8, 8); m.brick(W - 18, 8, 8); m.brick(Math.floor(W / 2) - 4, 5, 8);
  m.ladder(9, 8, 13); m.ladder(Math.floor(W / 2) - 5, 5, 8); m.ladder(W - 19, 8, 13);
  m.heart(Math.floor(W / 2), 12); m.star(Math.floor(W / 2), 4);
  m.coin(12, 7); m.coin(W - 14, 7); m.coin(Math.floor(W / 2) - 2, 4); m.coin(Math.floor(W / 2) + 2, 4);
  return m.rows();
}
const bossW = [48, 56, 64, 72, 80, 88, 96, 104, 112, 120];
const bossMaps = bossW.map(makeBossArena);

// Detailed western town arena for the GUNSLINGER boss (Level 30).
function makeGunslingerArena(W) {
  const H = 16, surface = 14, m = Map(W, H);
  m.solid(surface, 0, W - 1); m.solid(H - 1, 0, W - 1);
  // main street rooftop buildings
  m.brick(6, 8, 10);          // left building roof cols6-15
  m.brick(W - 16, 8, 10);     // right building roof
  m.brick(Math.floor(W / 2) - 5, 5, 10); // center balcony roof
  // ladders up to the roofs
  m.ladder(5, 8, 13); m.ladder(W - 17, 8, 13); m.ladder(Math.floor(W / 2) - 6, 5, 8);
  // barrels (crates) as street cover
  m.put(18, surface - 1, 'Z'); m.put(20, surface - 1, 'Z');
  m.put(W - 22, surface - 1, 'Z'); m.put(W - 20, surface - 1, 'Z');
  // cacti at the edges
  m.put(2, surface - 1, 'c'); m.put(W - 4, surface - 1, 'c'); m.put(Math.floor(W / 2) + 12, surface - 1, 'c');
  // hanging saloon signs below the roofs
  m.put(12, 9, 'Y'); m.put(W - 18, 9, 'Y');
  // coins + powerups
  m.coin(8, 7); m.coin(W - 12, 7); m.coin(Math.floor(W / 2), 4);
  m.coin(12, 12); m.coin(W - 14, 12);
  m.heart(Math.floor(W / 2), 12); m.star(Math.floor(W / 2), 4);
  m.put(Math.floor(W / 2) + 4, 12, 'Q'); // shield
  return m.rows();
}

// ---- bosses: 9 normal + final giant RAT ----
const bossDefs = [
  { hp: 4, speed: 1.2, fireInterval: 80, name: 'SLUDGE KING', skin: 0, attack: 'single', intro: [{ t: 'zoom', d: 260 }, { t: 'eyes', d: 240 }, { t: 'drop', d: 200 }, { t: 'roar', d: 360 }, { t: 'summon', d: 300 }, { t: 'charge', d: 200 }, { t: 'name', d: 260 }] },
  { hp: 6, speed: 1.4, fireInterval: 68, name: 'TAR TITAN', skin: 1, attack: 'spread', intro: [{ t: 'zoom', d: 240 }, { t: 'eyes', d: 300 }, { t: 'drop', d: 200 }, { t: 'roar', d: 340 }, { t: 'charge', d: 300 }, { t: 'summon', d: 280 }, { t: 'name', d: 260 }] },
  { hp: 8, speed: 1.6, fireInterval: 58, name: 'GOO GOLEM', skin: 2, attack: 'charge', intro: [{ t: 'zoom', d: 280 }, { t: 'eyes', d: 240 }, { t: 'drop', d: 220 }, { t: 'roar', d: 320 }, { t: 'charge', d: 360 }, { t: 'summon', d: 260 }, { t: 'name', d: 260 }] },
  { hp: 6, speed: 1.2, fireInterval: 70, name: 'GLOOP GOBBLER', skin: 3, attack: 'chaos', intro: [{ t: 'zoom', d: 260 }, { t: 'eyes', d: 300 }, { t: 'drop', d: 220 }, { t: 'roar', d: 380 }, { t: 'summon', d: 300 }, { t: 'charge', d: 260 }, { t: 'name', d: 280 }] },
  { hp: 12, speed: 2.0, fireInterval: 50, name: 'SWORD KNIGHT', skin: 5, attack: 'sword', intro: [{ t: 'zoom', d: 300 }, { t: 'eyes', d: 320 }, { t: 'drop', d: 240 }, { t: 'roar', d: 380 }, { t: 'summon', d: 300 }, { t: 'charge', d: 280 }, { t: 'name', d: 300 }] },
  { hp: 12, speed: 2.2, fireInterval: 40, name: 'GUNSLINGER', skin: 6, attack: 'gun', intro: [{ t: 'zoom', d: 320 }, { t: 'eyes', d: 300 }, { t: 'drop', d: 240 }, { t: 'roar', d: 360 }, { t: 'charge', d: 300 }, { t: 'summon', d: 280 }, { t: 'name', d: 300 }] },
  { hp: 13, speed: 2.4, fireInterval: 46, name: 'GHOST WRAITH', skin: 7, attack: 'ghost', intro: [{ t: 'eyes', d: 360 }, { t: 'zoom', d: 320 }, { t: 'roar', d: 380 }, { t: 'summon', d: 340 }, { t: 'drop', d: 260 }, { t: 'charge', d: 300 }, { t: 'name', d: 320 }] },
  { hp: 15, speed: 1.8, fireInterval: 52, name: 'SPIKED TANK', skin: 8, attack: 'charge', intro: [{ t: 'zoom', d: 320 }, { t: 'eyes', d: 300 }, { t: 'drop', d: 260 }, { t: 'roar', d: 400 }, { t: 'charge', d: 360 }, { t: 'summon', d: 320 }, { t: 'name', d: 320 }] },
  { hp: 14, speed: 2.2, fireInterval: 44, name: 'LASER BOT', skin: 9, attack: 'laser', intro: [{ t: 'eyes', d: 300 }, { t: 'zoom', d: 320 }, { t: 'drop', d: 240 }, { t: 'roar', d: 380 }, { t: 'charge', d: 320 }, { t: 'summon', d: 300 }, { t: 'name', d: 300 }] },
  // FINAL BOSS: GIANT RAT - releases enemies + bosses, chases, stompable
  { hp: 16, speed: 2.0, fireInterval: 30, name: 'THE GIANT RAT', skin: 4, attack: 'rat', rat: true, intro: [] }
];

// ---- enemies (progressive) ----
function enemiesFor(i, H) {
  const s = H - 2;
  const base = [{ type: 'patrol', tx: 12, ty: s, dir: -1, speed: 1.3 }];
  if (i >= 3) base.push({ type: 'hopper', tx: 24, ty: s, dir: 1, speed: 1.2 });
  if (i >= 6) base.push({ type: 'charger', tx: 34, ty: s, dir: 1, speed: 2.6 });
  if (i >= 9) base.push({ type: 'cannon', tx: 8, ty: s, dir: 1, speed: 0, fire: 95 });
  if (i >= 12) base.push({ type: 'chaser', tx: 26, ty: 8, dir: 1, speed: 1.5 });
  if (i >= 16) base.push({ type: 'fireball', tx: 40, ty: s, dir: 1, speed: 1.8 });
  if (i >= 20) base.push({ type: 'ghost', tx: 30, ty: 9, dir: 1, speed: 1.7 });
  if (i >= 24) base.push({ type: 'snake', tx: 20, ty: s, dir: 1, speed: 1.1 });
  if (i >= 28) base.push({ type: 'brute', tx: 44, ty: s, dir: 1, speed: 1.0 });
  if (i >= 32) base.push({ type: 'mole', tx: 32, ty: s, dir: 1, speed: 0.6 });
  if (i >= 36) base.push({ type: 'flyer', tx: 40, ty: 9, dir: 1, speed: 1.8 });
  return base;
}

// ---- moving platforms ----
function platformsFor(i, W, H) {
  const s = H - 2, p = [];
  const spread = [30, 36, 44, 50, 56, 60, 66, 72, 78, 84];
  if (i >= 4) p.push({ x: spread[i % 10], y: s - 5, w: 4, axis: i % 2 === 0 ? 'x' : 'y', range: 128, speed: 0.012, phase: (i % 4) * 0.25 });
  if (i >= 16) p.push({ x: spread[(i + 3) % 10], y: s - 4, w: 4, axis: 'x', range: 120, speed: 0.013, phase: (i % 5) * 0.2 });
  return p;
}

// ---- themes ----
const pal = [['#0b0f1f', '#070912'], ['#0a1a1a', '#050f0f'], ['#1c1016', '#12070c'], ['#1c160a', '#120c07'], ['#0f0f1c', '#07070f'], ['#1a1010', '#100707'], ['#0f1c10', '#07120c'], ['#10101c', '#07070f'], ['#1c0f1c', '#100510'], ['#0a141c', '#050b0f'], ['#1c1a0a', '#120f05'], ['#101c14', '#07130c'], ['#1c1c1c', '#101010'], ['#0b0f1f', '#070912'], ['#1a1a0a', '#100f05'], ['#0f0f1c', '#07070f'], ['#1c1016', '#12070c'], ['#0a1a1a', '#050f0f'], ['#1c160a', '#120c07'], ['#0f0f1c', '#07070f'], ['#2a1a0a', '#170d05'], ['#0a1a1c', '#050f10'], ['#1c1a1c', '#101010'], ['#1a1a0a', '#100f05'], ['#101c14', '#07130c'], ['#0f1c10', '#07120c'], ['#1c1016', '#12070c'], ['#1c160a', '#120c07'], ['#0f0f1c', '#07070f'], ['#1a1010', '#100707'], ['#1c1c1c', '#101010'], ['#0b0f1f', '#070912'], ['#10101c', '#07070f'], ['#1c1a0a', '#120f05'], ['#0a141c', '#050b0f'], ['#1c0f1c', '#100510'], ['#0a1a1a', '#050f0f'], ['#1c160a', '#120c07'], ['#0f0f1c', '#07070f'], ['#1a1a0a', '#100f05']];
const bossPal = [['#1c1010', '#120707'], ['#1c1c1c', '#101010'], ['#1c1610', '#120d07'], ['#1a0f1c', '#0f0712'], ['#0f0f1c', '#07070f'], ['#1c0f0f', '#120707'], ['#101010', '#0a0a0a'], ['#1a1a1a', '#101010'], ['#1c1010', '#120707'], ['#2a1200', '#140800']];

// ---- validate normal levels ----
let allOk = true;
normals.forEach(([t, m], i) => { const r = validate(m); const ok = r.all && r.trophy; if (!ok) allOk = false; console.log((ok ? 'PASS' : 'FAIL'), 'L' + (i + 1), t, m[0].length + 'x' + m.length, 'coins:' + r.coins); });
console.log('ALL 40 NORMAL VALID:', allOk);

// ---- assemble 50 levels ----
let out = '';
function emit(name, isBoss, map, enemies, platforms, theme, boss, world) {
  out += '    {\n      name: "' + name + '",\n';
  out += '      theme: { c0: "' + theme[0] + '", c1: "' + theme[1] + '" },\n';
  out += '      isBoss: ' + isBoss + ',\n';
  if (boss) out += '      boss: { hp: ' + boss.hp + ', speed: ' + boss.speed + ', fireInterval: ' + boss.fireInterval + ', name: "' + boss.name + '", skin: ' + boss.skin + ', attack: "' + boss.attack + '", rat: ' + (boss.rat || false) + ', intro: ' + JSON.stringify(boss.intro) + ' },\n';
  out += '      map: [\n';
  map.forEach(r => { out += '        "' + r + '",\n'; });
  out = out.replace(/,\n$/, '\n') + '      ],\n      enemies: [\n';
  enemies.forEach(e => { out += '        { type: "' + e.type + '", tx: ' + e.tx + ', ty: ' + e.ty + ', dir: ' + e.dir + ', speed: ' + e.speed + (e.fire ? ', fire: ' + e.fire : '') + ' },\n'; });
  out = out.replace(/,\n$/, '\n') + '      ],\n      platforms: [\n';
  platforms.forEach(p => { out += '        { x: ' + p.x + ', y: ' + p.y + ', w: ' + p.w + ', axis: "' + p.axis + '", range: ' + p.range + ', speed: ' + p.speed + ', phase: ' + p.phase + ' },\n'; });
  out = out.replace(/,\n$/, '\n') + '      ]\n    },\n';
}
let li = 0;
for (let w = 0; w < 10; w++) {
  for (let j = 0; j < 4; j++) {
    const i = w * 4 + j;
    let [t, m] = normals[i];
    const W = m[0].length, H = m.length;
    m = sprinkle(m, i, W, H);
    emit('Level ' + (li + 1), false, m, enemiesFor(i, H), platformsFor(i, W, H), pal[i % pal.length], null, w + 1);
    li++;
  }
  const bm = (w === 5) ? makeGunslingerArena(bossW[w]) : bossMaps[w];
  const W = bm[0].length, H = bm.length;
  // Level 20 (GLOOP GOBBLER) is tough: drop a Shield powerup to help.
  if (w === 3) {
    var sc = Math.floor(W / 2) + 3;
    if (bm[12][sc] === '.') bm[12] = bm[12].slice(0, sc) + 'Q' + bm[12].slice(sc + 1);
  }
  const boss = bossDefs[w];
  emit('Level ' + (li + 1) + (boss.rat ? ' - FINAL BOSS' : ' - BOSS'), true, bm, [{ type: 'boss', tx: Math.floor(W / 2), ty: 14, dir: 1, speed: boss.speed }], [{ x: 20, y: 6, w: 4, axis: 'x', range: 160, speed: 0.015, phase: 0 }], bossPal[w], boss, w + 1);
  li++;
}
out = out.replace(/,\n$/, '\n');
require('fs').writeFileSync('levels_block.js', out);
console.log('Wrote levels_block.js with', li, 'levels');
