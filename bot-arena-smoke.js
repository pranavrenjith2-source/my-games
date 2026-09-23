#!/usr/bin/env node
// Headless smoke test for bot-arena.html.
// Loads the page with stubbed DOM/canvas, drives real frames, switches screens,
// and fails (exit 1) on any thrown error or logged frame error.
// Usage: node bot-arena-smoke.js [path-to-html]

const fs = require("fs");
const file = process.argv[2] || require("path").join(__dirname, "bot-arena.html");

let html;
try { html = fs.readFileSync(file, "utf8"); } catch (e) { console.error("SMOKE: cannot read " + file); process.exit(1); }
const m = html.match(/<script>([\s\S]*)<\/script>/);
if (!m) { console.error("SMOKE: no <script> block"); process.exit(1); }

const clickHandlers = [];
const canvas = {
  width: 960, height: 560,
  getContext: () => ctx,
  addEventListener: (k, fn) => { if (k === "click") clickHandlers.push(fn); },
  getBoundingClientRect: () => ({ left: 0, top: 0 })
};
const ctx = new Proxy({}, {
  get(t, p) {
    if (p === "canvas") return canvas;
    if (p === "createLinearGradient" || p === "createRadialGradient") return () => ({ addColorStop() {} });
    if (p === "measureText") return () => ({ width: 0 });
    if (p in t) return t[p];
    return () => {};
  },
  set(t, p, v) { t[p] = v; return true; }
});

const raf = [];
const listeners = {};
global.window = { addEventListener: (k, fn) => { listeners[k] = fn; }, AudioContext: undefined, webkitAudioContext: undefined };
global.document = { getElementById: () => canvas };
global.requestAnimationFrame = (cb) => raf.push(cb);
global.localStorage = { getItem: () => null, setItem: () => {} };
global.fetch = () => Promise.reject(new Error("no server"));

let loggedError = false;
const realError = console.error.bind(console);
console.error = (...a) => { loggedError = true; realError(...a); };

try { new Function(m[1])(); } catch (e) { realError("SMOKE FAIL (init): " + (e.stack || e.message)); process.exit(1); }

setTimeout(() => {
  let err = null, ts = 0;
  const key = (code) => { try { if (listeners.keydown) listeners.keydown({ code, key: "", preventDefault() {} }); } catch (e) { err = e; } };
  const frames = (n) => { for (let i = 0; i < n; i++) { const cb = raf.shift(); if (!cb) return; ts += 16.7; cb(ts); } };
  try {
    frames(60);
    key("Digit3"); frames(900);   // spectate
    key("Digit5"); frames(30);    // hack monitor
    key("Digit4"); frames(30);    // social
    key("Digit6"); frames(30);    // roster
    key("Digit7"); frames(30);    // ranked
    key("Digit1"); frames(30);    // home
    key("Digit2"); frames(60);    // fight
  } catch (e) { err = e; }

  if (err || loggedError) {
    realError("SMOKE FAIL: " + (err ? (err.stack || err.message) : "a frame error was logged"));
    process.exit(1);
  }
  realError("SMOKE OK");
  process.exit(0);
}, 80);