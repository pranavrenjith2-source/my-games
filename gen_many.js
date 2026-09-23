const { Map } = require('/var/folders/ny/fflj10fx21j0l321qz4htkxm0000gp/T/opencode/gen_ladder.js');
function arr(v) { return Array.isArray(v) ? v : (v === undefined ? [] : [v]); }

// ------------------------------------------------------------------
// STAIRCASE: floors rising to the right, ladders at left edge of each
// upper floor (floors overlap). Trophy at top-right; coins avoid it.
// ------------------------------------------------------------------
function staircase(W, H, floors, floorLen, opts) {
  const surface = H - 2, m = Map(W, H);
  m.solid(surface, 0, W - 1); m.solid(H - 1, 0, W - 1);
  const shift = floorLen - 3; let x = 4; const xs = [];
  floors.forEach((r, i) => { xs[i] = x; m.brick(x, r, floorLen); x += shift; });
  for (let i = 1; i < floors.length; i++) m.ladder(xs[i] - 1, floors[i], floors[i - 1] - 1);
  m.ladder(xs[0] - 1, floors[0], surface - 1);
  const top = floors.length - 1;
  m.trophy(xs[top] + floorLen - 1, floors[top] - 1);
  floors.forEach((r, i) => { for (let c = xs[i] + 2; c < xs[i] + floorLen - 2; c += 3) m.coin(c, r - 1); });
  for (let c = 6; c < W - 4; c += 4) if (m.g[surface-2][c] === '.') m.coin(c, surface - 2);
  arr(opts && opts.spikes).forEach(s => m.spike(s, surface - 1));
  arr(opts && opts.springs).forEach(s => m.spring(s, surface));
  arr(opts && opts.heart).forEach(h => m.heart(h, surface - 2));
  arr(opts && opts.star).forEach(s => m.star(s, surface - 2));
  arr(opts && opts.double).forEach(d => m.double(d, surface - 2));
  arr(opts && opts.speed).forEach(s => m.speed(s, surface - 2));
  return m.rows();
}

// ------------------------------------------------------------------
// TOWER: tall, narrow. Floors with a center gap; a center ladder runs
// up through the gap between floors.
// ------------------------------------------------------------------
function tower(W, H, n, opts) {
  const surface = H - 2, m = Map(W, H);
  m.solid(surface, 0, W - 1); m.solid(H - 1, 0, W - 1);
  const c = Math.floor(W / 2);
  for (let i = 0; i < n; i++) {
    const r = surface - 3 - i * 3;
    for (let x = c - 5; x <= c - 1; x++) m.put(x, r, 'B');
    for (let x = c + 1; x <= c + 5; x++) m.put(x, r, 'B');
    m.coin(c - 3, r - 1); m.coin(c + 3, r - 1);
    if (i > 0) m.ladder(c, r, surface - 3 - (i - 1) * 3 - 1);
    else m.ladder(c, r, surface - 1);
  }
  const topR = surface - 3 - (n - 1) * 3;
  m.trophy(c - 1, topR - 1);
  for (let cx = 6; cx < W - 4; cx += 5) if (m.g[surface-2][cx] === '.') m.coin(cx, surface - 2);
  arr(opts && opts.spikes).forEach(s => m.spike(s, surface - 1));
  arr(opts && opts.heart).forEach(h => m.heart(h, surface - 2));
  arr(opts && opts.star).forEach(s => m.star(s, surface - 2));
  arr(opts && opts.double).forEach(d => m.double(d, surface - 2));
  arr(opts && opts.speed).forEach(s => m.speed(s, surface - 2));
  return m.rows();
}

// ------------------------------------------------------------------
// ZIGZAG: floors alternate direction, ladders at the shared edge.
// ------------------------------------------------------------------
function zigzag(W, H, floors, floorLen, opts) {
  const surface = H - 2, m = Map(W, H);
  m.solid(surface, 0, W - 1); m.solid(H - 1, 0, W - 1);
  const shift = floorLen - 3; let x = 4; const xs = [];
  floors.forEach((r, i) => { xs[i] = x; m.brick(x, r, floorLen); x += (i % 2 === 0 ? 1 : -1) * shift; });
  for (let i = 1; i < floors.length; i++) {
    if (xs[i] > xs[i - 1]) m.ladder(xs[i] - 1, floors[i], floors[i - 1] - 1);
    else m.ladder(xs[i] + floorLen, floors[i], floors[i - 1] - 1);
  }
  m.ladder(xs[0] - 1, floors[0], surface - 1);
  const top = floors.length - 1;
  m.trophy(xs[top] + floorLen - 1, floors[top] - 1);
  floors.forEach((r, i) => { for (let c = xs[i] + 2; c < xs[i] + floorLen - 2; c += 3) m.coin(c, r - 1); });
  for (let c = 6; c < W - 4; c += 4) if (m.g[surface-2][c] === '.') m.coin(c, surface - 2);
  arr(opts && opts.spikes).forEach(s => m.spike(s, surface - 1));
  arr(opts && opts.springs).forEach(s => m.spring(s, surface));
  arr(opts && opts.heart).forEach(h => m.heart(h, surface - 2));
  arr(opts && opts.star).forEach(s => m.star(s, surface - 2));
  arr(opts && opts.double).forEach(d => m.double(d, surface - 2));
  arr(opts && opts.speed).forEach(s => m.speed(s, surface - 2));
  return m.rows();
}

module.exports = { staircase, tower, zigzag };

// ------------------------------------------------------------------
// ISLANDS: floating brick islands you hop between (jump-focused, no
// ladders). Each island is reachable from the last/surface by a jump.
// ------------------------------------------------------------------
function islands(W, H, isls, opts) {
  const surface = H - 2, m = Map(W, H);
  m.solid(surface, 0, W - 1); m.solid(H - 1, 0, W - 1);
  isls.forEach((is, i) => { m.brick(is.x, is.y, is.w); m.coin(is.x + Math.floor(is.w / 2), is.y - 1); });
  const top = isls[isls.length - 1];
  m.trophy(top.x + top.w - 1, top.y - 1);
  for (let c = 6; c < W - 4; c += 4) if (m.g[surface - 2][c] === '.') m.coin(c, surface - 2);
  arr(opts && opts.spikes).forEach(s => m.spike(s, surface - 1));
  arr(opts && opts.heart).forEach(h => m.heart(h, surface - 2));
  arr(opts && opts.star).forEach(s => m.star(s, surface - 2));
  arr(opts && opts.double).forEach(d => m.double(d, surface - 2));
  arr(opts && opts.speed).forEach(s => m.speed(s, surface - 2));
  return m.rows();
}

// ------------------------------------------------------------------
// SPRING SHAFT: a tall ascent using springs bounced off ledges.
// ------------------------------------------------------------------
function springshaft(W, H, ledges, opts) {
  const surface = H - 2, m = Map(W, H);
  m.solid(surface, 0, W - 1); m.solid(H - 1, 0, W - 1);
  // ledges: [{x,y,w}] where a spring on the floor below boosts onto it
  ledges.forEach((l, i) => {
    m.brick(l.x, l.y, l.w);
    m.coin(l.x + Math.floor(l.w / 2), l.y - 1);
    if (i === ledges.length - 1) m.trophy(l.x + l.w - 1, l.y - 1);
    else m.spring(l.x + Math.floor(l.w / 2), surface); // spring on ground below
  });
  for (let c = 6; c < W - 4; c += 4) if (m.g[surface - 2][c] === '.') m.coin(c, surface - 2);
  arr(opts && opts.spikes).forEach(s => m.spike(s, surface - 1));
  arr(opts && opts.heart).forEach(h => m.heart(h, surface - 2));
  arr(opts && opts.star).forEach(s => m.star(s, surface - 2));
  arr(opts && opts.double).forEach(d => m.double(d, surface - 2));
  arr(opts && opts.speed).forEach(s => m.speed(s, surface - 2));
  return m.rows();
}

// ------------------------------------------------------------------
// PIT GAUNTLET: a long horizontal run with carved pits to leap over.
// ------------------------------------------------------------------
function pitgauntlet(W, H, pits, opts) {
  const surface = H - 2, m = Map(W, H);
  m.solid(surface, 0, W - 1); m.solid(H - 1, 0, W - 1);
  // carve pits (remove surface + bedrock) to create gaps
  pits.forEach(p => { for (let x = p[0]; x <= p[1]; x++) { m.put(x, surface, '.'); m.put(x, H - 1, '.'); } });
  // a couple elevated platforms for variety
  (opts && opts.plats || []).forEach(pl => m.brick(pl.x, pl.y, pl.w));
  for (let c = 6; c < W - 4; c += 5) if (m.g[surface - 2][c] === '.') m.coin(c, surface - 2);
  arr(opts && opts.spikes).forEach(s => m.spike(s, surface - 1));
  arr(opts && opts.heart).forEach(h => m.heart(h, surface - 2));
  arr(opts && opts.star).forEach(s => m.star(s, surface - 2));
  arr(opts && opts.double).forEach(d => m.double(d, surface - 2));
  arr(opts && opts.speed).forEach(s => m.speed(s, surface - 2));
  m.trophy(W - 3, surface - 1);
  return m.rows();
}

module.exports = { staircase, tower, zigzag, islands, springshaft, pitgauntlet };

// ------------------------------------------------------------------
// BRIDGES: a long horizontal run of brick bridges over open air,
// with ladders connecting them (a "sky bridge" course).
// ------------------------------------------------------------------
function bridges(W, H, bridgeRows, bridgeLen, opts) {
  const surface = H - 2, m = Map(W, H);
  m.solid(surface, 0, W - 1); m.solid(H - 1, 0, W - 1);
  let x = 3;
  const xs = [];
  bridgeRows.forEach((r, i) => { xs[i] = x; m.brick(x, r, bridgeLen); x += bridgeLen + 3; });
  // ladders connect each bridge to the next (higher)
  for (let i = 1; i < bridgeRows.length; i++) m.ladder(xs[i] + 2, bridgeRows[i], bridgeRows[i - 1] - 1);
  // first bridge ladder from ground
  m.ladder(xs[0] + 2, bridgeRows[0], surface - 1);
  bridgeRows.forEach((r, i) => { for (let c = xs[i] + 2; c < xs[i] + bridgeLen - 1; c += 3) m.coin(c, r - 1); });
  const top = bridgeRows.length - 1;
  m.trophy(xs[top] + bridgeLen - 1, bridgeRows[top] - 1);
  for (let c = 6; c < W - 4; c += 4) if (m.g[surface - 2][c] === '.') m.coin(c, surface - 2);
  arr(opts && opts.spikes).forEach(s => m.spike(s, surface - 1));
  arr(opts && opts.heart).forEach(h => m.heart(h, surface - 2));
  arr(opts && opts.star).forEach(s => m.star(s, surface - 2));
  arr(opts && opts.double).forEach(d => m.double(d, surface - 2));
  arr(opts && opts.speed).forEach(s => m.speed(s, surface - 2));
  return m.rows();
}

// ------------------------------------------------------------------
// MAZE: a dense grid of small platforms and ladders (a ladder forest).
// ------------------------------------------------------------------
function maze(W, H, rows, cols, opts) {
  const surface = H - 2, m = Map(W, H);
  m.solid(surface, 0, W - 1); m.solid(H - 1, 0, W - 1);
  const cellW = Math.floor((W - 6) / cols), cellH = 3;
  const heights = [];
  for (let r = 0; r < rows; r++) heights.push(surface - 2 - r * cellH);
  // platforms on a checkerboard, connected by ladders
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = 3 + c * cellW;
      if ((r + c) % 2 === 0) { m.brick(x, heights[r], cellW - 2); }
    }
    // ladders up from the floor below
    const prev = r === 0 ? surface - 1 : heights[r - 1] - 1;
    for (let c = 1; c < cols; c += 2) m.ladder(3 + c * cellW, heights[r], prev);
  }
  // coins on some platforms
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c += 2) {
    if ((r + c) % 2 === 0) m.coin(3 + c * cellW + Math.floor((cellW - 2) / 2), heights[r] - 1);
  }
  const topR = heights[rows - 1];
  m.trophy(W - 4, topR - 1);
  arr(opts && opts.spikes).forEach(s => m.spike(s, surface - 1));
  arr(opts && opts.heart).forEach(h => m.heart(h, surface - 2));
  arr(opts && opts.star).forEach(s => m.star(s, surface - 2));
  arr(opts && opts.double).forEach(d => m.double(d, surface - 2));
  arr(opts && opts.speed).forEach(s => m.speed(s, surface - 2));
  return m.rows();
}

// ------------------------------------------------------------------
// PYRAMID: concentric shelves rising to a peak.
// ------------------------------------------------------------------
function pyramid(W, H, steps, opts) {
  const surface = H - 2, m = Map(W, H);
  m.solid(surface, 0, W - 1); m.solid(H - 1, 0, W - 1);
  const cx = Math.floor(W / 2);
  for (let i = 0; i < steps; i++) {
    const half = 6 + i * 3;
    const r = surface - 2 - i * 3;
    m.brick(cx - half, r, half * 2);
    m.coin(cx, r - 1);
    if (i === steps - 1) m.trophy(cx, r - 1);
    if (i > 0) { m.ladder(cx - half, r, r + 2); m.ladder(cx + half - 1, r, r + 2); }
  }
  // ladders from ground to first step
  m.ladder(cx - 6, surface - 2, surface - 1);
  for (let c = 6; c < W - 4; c += 4) if (m.g[surface - 2][c] === '.') m.coin(c, surface - 2);
  arr(opts && opts.spikes).forEach(s => m.spike(s, surface - 1));
  arr(opts && opts.heart).forEach(h => m.heart(h, surface - 2));
  arr(opts && opts.star).forEach(s => m.star(s, surface - 2));
  arr(opts && opts.double).forEach(d => m.double(d, surface - 2));
  arr(opts && opts.speed).forEach(s => m.speed(s, surface - 2));
  return m.rows();
}

// ------------------------------------------------------------------
// SPRING CLIMB: ascend using springs on offset ledges.
// ------------------------------------------------------------------
function springclimb(W, H, ledges, opts) {
  const surface = H - 2, m = Map(W, H);
  m.solid(surface, 0, W - 1); m.solid(H - 1, 0, W - 1);
  ledges.forEach((l, i) => {
    m.brick(l.x, l.y, l.w);
    m.coin(l.x + Math.floor(l.w / 2), l.y - 1);
    m.spring(l.x - 1, surface);
    if (i === ledges.length - 1) m.trophy(l.x + l.w - 1, l.y - 1);
  });
  for (let c = 6; c < W - 4; c += 4) if (m.g[surface - 2][c] === '.') m.coin(c, surface - 2);
  arr(opts && opts.spikes).forEach(s => m.spike(s, surface - 1));
  arr(opts && opts.heart).forEach(h => m.heart(h, surface - 2));
  arr(opts && opts.star).forEach(s => m.star(s, surface - 2));
  arr(opts && opts.double).forEach(d => m.double(d, surface - 2));
  arr(opts && opts.speed).forEach(s => m.speed(s, surface - 2));
  return m.rows();
}

module.exports = { staircase, tower, zigzag, islands, pitgauntlet, bridges, maze, pyramid, springclimb };
