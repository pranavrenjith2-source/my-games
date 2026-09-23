#!/usr/bin/env node
// Writes games-index.json — the static game list the hub reads on a static host
// (GitHub Pages), so it works with no server. Same shape as /api/games.
const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const GAMES = path.join(ROOT, "games");
const FORGE = path.join(ROOT, ".game-forge");

function lines(p){ try { return fs.readFileSync(p, "utf8").split("\n").map((s) => s.trim()).filter(Boolean); } catch (e){ return []; } }
function readJSON(p, d){ try { return JSON.parse(fs.readFileSync(p, "utf8")); } catch (e){ return d; } }

const manifest = {};
lines(path.join(FORGE, "manifest.txt")).forEach((l) => { manifest[l] = 1; });
const meta = readJSON(path.join(FORGE, "descriptions.json"), {});
let files = [];
try { files = fs.readdirSync(GAMES).filter((f) => /\.html?$/i.test(f)); } catch (e){}

const games = files.map((f) => {
  const st = fs.statSync(path.join(GAMES, f));
  const m = meta[f] || {};
  return {
    name: f, url: "games/" + encodeURIComponent(f), mtime: st.mtimeMs,
    source: manifest[f] ? "forge" : "upload",
    title: m.title || f.replace(/\.html?$/i, ""),
    description: m.description || ""
  };
}).sort((a, b) => b.mtime - a.mtime);

fs.writeFileSync(path.join(ROOT, "games-index.json"), JSON.stringify({ games }, null, 2));
console.log("wrote games-index.json (" + games.length + " games)");