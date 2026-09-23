const TS = 32;
const GRAVITY = 0.8, JUMP_VY = -14.0, SPRING_VY = -25.0, MOVE_SPEED = 4.0, MAX_FALL = 12;
const E = 0, GROUND = 1, BRICK = 2, SPIKE = 3, SPRING = 4, COIN = 5, TROPHY = 6, HEART = 7, STAR = 8, LADDER = 9;
const LEGEND = { '.': 0, '#': 1, 'B': 2, 'S': 3, 'P': 4, 'C': 5, 'T': 6, 'H': 7, '*': 8, '|': 9, '^': 10, '+': 11 };

function validate(map) {
  const ROWS = map.length, COLS = map[0].length;
  let grid = [];
  for (let r = 0; r < ROWS; r++) {
    let row = [];
    for (let c = 0; c < COLS; c++) row.push(LEGEND[map[r][c]] ?? 0);
    grid.push(row);
  }
  function isSolid(t) { return t === GROUND || t === BRICK || t === SPRING; }
  function tileAt(px, py) {
    let tx = Math.floor(px / TS), ty = Math.floor(py / TS);
    if (tx < 0 || tx >= COLS || ty < 0 || ty >= ROWS) return E;
    return grid[ty][tx];
  }
  function hCol(p) {
    let l = Math.floor(p.x / TS), r = Math.floor((p.x + p.w - 1) / TS), t = Math.floor(p.y / TS), b = Math.floor((p.y + p.h - 1) / TS);
    for (let ty = t; ty <= b; ty++) {
      let tr = tileAt(r * TS, ty * TS), tl = tileAt(l * TS, ty * TS);
      if (p.vx > 0 && isSolid(tr)) { p.x = r * TS - p.w - 0.01; p.vx = 0; }
      else if (p.vx < 0 && isSolid(tl)) { p.x = (l + 1) * TS + 0.01; p.vx = 0; }
    }
  }
  function vCol(p, useSpring) {
    let l = Math.floor(p.x / TS), r = Math.floor((p.x + p.w - 1) / TS), t = Math.floor(p.y / TS), b = Math.floor((p.y + p.h - 1) / TS);
    let spring = false;
    for (let tx = l; tx <= r; tx++) {
      let tt = tileAt(tx * TS, t * TS), tb = tileAt(tx * TS, b * TS);
      if (p.vy > 0 && isSolid(tb)) { p.y = b * TS - p.h - 0.01; p.vy = 0; p.onGround = true; if (tb === SPRING) spring = true; }
      else if (p.vy < 0 && isSolid(tt)) { p.y = (t + 1) * TS + 0.01; p.vy = 0; }
    }
    if (spring && useSpring) { p.vy = SPRING_VY; p.onGround = false; }
  }
  function sim(fx, fy, vy0, policy) {
    let p = { x: fx * TS, y: (fy) * TS - 32, w: 32, h: 32, vx: 0, vy: vy0, onGround: false };
    let f = 0; const lands = new Set(); const picks = new Set();
    while (f < 400) {
      p.vx = policy[Math.min(f, policy.length - 1)];
      p.vy += GRAVITY; if (p.vy > MAX_FALL) p.vy = MAX_FALL;
      p.x += p.vx; hCol(p); p.y += p.vy; vCol(p, true);
      let l = Math.floor(p.x / TS), r = Math.floor((p.x + p.w - 1) / TS), t = Math.floor(p.y / TS), b = Math.floor((p.y + p.h - 1) / TS);
      for (let ty = t; ty <= b; ty++) for (let tx = l; tx <= r; tx++) {
        let t2 = (ty >= 0 && ty < ROWS && tx >= 0 && tx < COLS) ? grid[ty][tx] : E;
        if (t2 === COIN) picks.add('C:' + tx + ',' + ty);
        if (t2 === TROPHY) picks.add('T:' + tx + ',' + ty);
        if (t2 === HEART) picks.add('H:' + tx + ',' + ty);
        if (t2 === STAR) picks.add('*:' + tx + ',' + ty);
      }
      if (p.onGround) {
        let by = Math.floor((p.y + p.h + 0.99) / TS); let bx = Math.floor((p.x + p.w / 2) / TS);
        if (by < ROWS) lands.add(bx + ',' + by);
        break;
      }
      f++;
    }
    return { lands, picks };
  }
  const pol = [];
  const dirs = [-1, 0, 1];
  for (const d of dirs) for (const N of [0, 4, 8, 12, 16, 20, 24, 28, 32, 36, 40]) {
    let a = []; for (let i = 0; i < N; i++) a.push(d * MOVE_SPEED); a.push(0); pol.push(a);
  }
  for (const A of [-1, 1]) for (const B of [-1, 0, 1]) for (const N of [8, 16, 24]) {
    let a = []; for (let i = 0; i < N; i++) a.push(A * MOVE_SPEED); for (let i = 0; i < 40; i++) a.push(B * MOVE_SPEED); pol.push(a);
  }
  const surface = ROWS - 2;
  const R = new Set();
  const startKey = 1 + ',' + surface; R.add(startKey);
  function ladderRun(x, row) {
    if (grid[row][x] !== LADDER) return null;
    let top = row; while (top - 1 >= 0 && grid[top - 1][x] === LADDER) top--;
    let bot = row; while (bot + 1 < ROWS && grid[bot + 1][x] === LADDER) bot++;
    return { top, bot };
  }
  let changed = true;
  while (changed) {
    changed = false; const keys = [...R];
    for (const key of keys) {
      const [fx, fy] = key.split(',').map(Number);
      if (isSolid(grid[fy][fx])) {
        for (const pp of pol) {
          const j = sim(fx, fy, -14, pp); for (const L of j.lands) if (!R.has(L)) { R.add(L); changed = true; }
          const w = sim(fx, fy, 0, pp); for (const L of w.lands) if (!R.has(L)) { R.add(L); changed = true; }
        }
      }
      if (grid[fy][fx] === SPRING) {
        for (const pp of pol) { const s = sim(fx, fy, -25, pp); for (const L of s.lands) if (!R.has(L)) { R.add(L); changed = true; } }
      }
      for (const br of [fy - 1, fy]) {
        if (br >= 0 && br < ROWS && grid[br][fx] === LADDER) {
          const run = ladderRun(fx, br);
          for (let r = run.top; r <= run.bot; r++) {
            const foot = r + 1;
            const k = fx + ',' + foot; if (!R.has(k)) { R.add(k); changed = true; }
            for (const dx of [-1, 1]) {
              const nx = fx + dx; if (nx < 0 || nx >= COLS) continue;
              if (isSolid(grid[foot][nx])) { const kk = nx + ',' + foot; if (!R.has(kk)) { R.add(kk); changed = true; } }
              if (foot - 1 >= 0 && isSolid(grid[foot - 1][nx])) { const kk = nx + ',' + (foot - 1); if (!R.has(kk)) { R.add(kk); changed = true; } }
            }
          }
        }
      }
      for (const dx of [-1, 0, 1]) for (const dy of [-2, -1, 0, 1, 2]) {
        const nx = fx + dx, ny = fy + dy;
        if (nx < 0 || nx >= COLS || ny < 0 || ny >= ROWS) continue;
        if (grid[ny][nx] === LADDER) {
          const run = ladderRun(nx, ny);
          for (let r = run.top; r <= run.bot; r++) {
            const foot = r + 1;
            const k = nx + ',' + foot; if (!R.has(k)) { R.add(k); changed = true; }
            for (const d2 of [-1, 1]) {
              const n2 = nx + d2; if (n2 < 0 || n2 >= COLS) continue;
              if (isSolid(grid[foot][n2])) { const kk = n2 + ',' + foot; if (!R.has(kk)) { R.add(kk); changed = true; } }
              if (foot - 1 >= 0 && isSolid(grid[foot - 1][n2])) { const kk = n2 + ',' + (foot - 1); if (!R.has(kk)) { R.add(kk); changed = true; } }
            }
          }
        }
      }
    }
  }
  function overlapFoot(key, cx, cy) { const [fx, fy] = key.split(',').map(Number); return fx <= cx + 1 && fx >= cx - 1 && fy - 1 <= cy && fy >= cy - 1; }
  const coins = [];
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) if (grid[r][c] === COIN) coins.push(c + ',' + r);
  let rc = new Set(), trophy = false, heart = false, star = false;
  for (const key of R) for (const c of coins) { const [a, b] = c.split(',').map(Number); if (overlapFoot(key, a, b)) rc.add(c); }
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    if (grid[r][c] === TROPHY) { for (const key of R) if (overlapFoot(key, c, r)) trophy = true; }
    if (grid[r][c] === HEART) { for (const key of R) if (overlapFoot(key, c, r)) heart = true; }
    if (grid[r][c] === STAR) { for (const key of R) if (overlapFoot(key, c, r)) star = true; }
  }
  for (const key of R) {
    const [fx, fy] = key.split(',').map(Number);
    if (isSolid(grid[fy][fx])) {
      for (const pp of pol) {
        for (const r of [sim(fx, fy, -14, pp), sim(fx, fy, 0, pp)]) {
          for (const pk of r.picks) {
            if (pk[0] === 'C') rc.add(pk.slice(2));
            else if (pk[0] === 'T') trophy = true;
            else if (pk[0] === 'H') heart = true;
            else if (pk[0] === '*') star = true;
          }
        }
      }
    }
    if (grid[fy][fx] === SPRING) {
      for (const pp of pol) {
        const r = sim(fx, fy, -25, pp);
        for (const pk of r.picks) {
          if (pk[0] === 'C') rc.add(pk.slice(2));
          else if (pk[0] === 'T') trophy = true;
          else if (pk[0] === 'H') heart = true;
          else if (pk[0] === '*') star = true;
        }
      }
    }
  }
  const all = coins.every(c => rc.has(c));
  return { all, trophy, heart, star, coins: coins.length, reached: rc };
}
module.exports = { validate };
