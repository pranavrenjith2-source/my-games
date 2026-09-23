#!/usr/bin/env node
// Cloud Forge — generates ONE self-contained HTML game per run using the
// particle-ai chat API. Runs in GitHub Actions (no Mac required).
// Env: PARTICLE_API_KEY (required), PARTICLE_BASE_URL, PARTICLE_MODEL, FORGE_KIND.
const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const GAMES = path.join(ROOT, "games");
const FORGE = path.join(ROOT, ".game-forge");
const DESCRIPTIONS = path.join(FORGE, "descriptions.json");
const INDEX = path.join(ROOT, "games-index.json");

const API = (process.env.PARTICLE_BASE_URL || "https://api.particle.ai/v1").replace(/\/$/, "");
const KEY = process.env.PARTICLE_API_KEY || "";
const MODEL = process.env.PARTICLE_MODEL || "deepseek-v4-flash-0731";
function pickKind(){
  const k = (process.env.FORGE_KIND || "").toLowerCase();
  if (k === "utility" || k === "game") return k;
  const d = new Date();
  const doy = Math.floor((Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) - Date.UTC(d.getUTCFullYear(), 0, 0)) / 86400000);
  return doy % 2 === 0 ? "game" : "utility";
}
const KIND = pickKind();

if (!KEY) { console.error("PARTICLE_API_KEY is not set"); process.exit(1); }
fs.mkdirSync(GAMES, { recursive: true });
fs.mkdirSync(FORGE, { recursive: true });

function lines(p){ try { return fs.readFileSync(p, "utf8").split("\n").map((s) => s.trim()).filter(Boolean); } catch (e){ return []; } }
function readJSON(p, d){ try { return JSON.parse(fs.readFileSync(p, "utf8")); } catch (e){ return d; } }
function slug(s){ return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || ("drop-" + Date.now()); }

const GAME_IDEAS = [
  "a full platformer with 15+ handcrafted levels, checkpoints and a final boss",
  "a roguelike dungeon crawler with random floors, items, and permadeath",
  "a city builder with zoning, money, population and disasters",
  "a 2D physics sandbox where you build vehicles and machines",
  "a space exploration game with planets, fuel, upgrades and discoveries",
  "a tower defense with a tech tree, many enemy types and endless waves",
  "a farming sim with seasons, crops, animals and a market",
  "a rhythm game that generates its own charts and judges your timing",
  "a card battler against AI opponents with deckbuilding",
  "a battle royale against 20 bots on a shrinking map",
  "a puzzle game with 30 handcrafted levels and a level editor",
  "a metroidvania-lite with abilities, secrets and a map",
  "a top-down racing game with several tracks and AI racers",
  "a tycoon game (theme park) with rides, guests and finances",
  "a survival game with crafting, hunger and day/night",
  "a turn-based tactics game on a grid with unit classes",
  "a detective game where you solve cases from clues",
  "a monster-catching RPG with battles, types and evolution",
  "a factory automation game with belts, machines and goals",
  "a god-game sandbox with terrain, followers and miracles"
];
const UTIL_IDEAS = [
  "a markdown editor with live preview, autosave and export",
  "a color palette generator with accessibility contrast checks",
  "a unit + currency converter that works fully offline",
  "a password generator and strength analyzer",
  "a regex tester with live match highlighting",
  "a JSON formatter, validator and tree explorer",
  "a side-by-side text diff tool",
  "a cron expression explainer with next-run times",
  "a subnet / IP calculator",
  "a Pomodoro timer with session statistics",
  "a habit tracker stored locally with streaks",
  "a note-taking app with tags and search",
  "an image to ASCII art converter",
  "an offline QR code generator drawn on canvas",
  "a base64 / URL / hash encoder-decoder",
  "a world clock across many timezones",
  "a CSS gradient and box-shadow playground with copyable code",
  "a kanban board stored locally with drag and drop",
  "a typing speed test with accuracy and history",
  "a stopwatch / lap timer with keyboard shortcuts"
];

const IDEAS = KIND === "utility" ? UTIL_IDEAS : GAME_IDEAS;
const USED_FILE = path.join(FORGE, "cloud-used-" + KIND + ".txt");
const used = lines(USED_FILE);
let concept = IDEAS.filter((c) => used.indexOf(c) < 0)[0];
if (!concept){ concept = IDEAS[Math.floor(Math.random() * IDEAS.length)]; fs.writeFileSync(USED_FILE, ""); }

const name = slug(concept) + ".html";
const OUT = path.join(GAMES, name);

const prompt = `Create ONE self-contained single-file HTML ${KIND}.

Concept: ${concept}

Make it feel like a major release: multiple levels or modes (or real progression), a title screen, a clear goal / score, and polished visuals with satisfying feedback. Aim for something someone would happily play for 10+ minutes.

Rules:
- ONE .html file. Everything inline (HTML, CSS, JS). No network, no external files, no CDN.
- Works offline. Must run with ZERO console errors.
- Mouse and/or keyboard input.
- Sound is optional and must be guarded: create the AudioContext lazily on the first user gesture, resume() it, and only play once running.
- Verify the JavaScript parses before finishing.

Reply with ONLY the complete file contents in one \`\`\`html code block. No explanation.`;

async function callAPI(){
  const res = await fetch(API + "/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: "Bearer " + KEY },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: "You are an expert game developer. You output complete, working, self-contained HTML files." },
        { role: "user", content: prompt }
      ],
      temperature: 0.85,
      max_tokens: 32000,
      reasoning_effort: "none"   // this model otherwise spends every token on reasoning and emits no file
    })
  });
  if (!res.ok) throw new Error("API HTTP " + res.status + ": " + (await res.text()).slice(0, 300));
  const j = await res.json();
  const choice = (j.choices && j.choices[0]) || {};
  const msg = (choice.message && choice.message.content) || "";
  console.log("finish=" + (choice.finish_reason || "?") + " content=" + msg.length + " chars");
  return msg;
}

function extractHtml(text){
  let m = text.match(/```(?:html)?\s*([\s\S]*?)```/i);
  let body = m ? m[1] : text;
  const i = body.search(/<!DOCTYPE html|<html[\s>]/i);
  if (i > 0) body = body.slice(i);
  const end = body.lastIndexOf("</html>");
  if (end >= 0) body = body.slice(0, end + 7);
  return body.trim();
}

function updateMeta(title, description){
  const meta = readJSON(DESCRIPTIONS, {});
  meta[name] = { title, description };
  fs.writeFileSync(DESCRIPTIONS, JSON.stringify(meta, null, 2));
  buildIndex(meta);
}
function buildIndex(meta){
  const manifest = {};
  lines(path.join(FORGE, "manifest.txt")).forEach((l) => { manifest[l] = 1; });
  meta = meta || readJSON(DESCRIPTIONS, {});
  let files = [];
  try { files = fs.readdirSync(GAMES).filter((f) => /\.html?$/i.test(f)); } catch (e){}
  const games = files.map((f) => {
    const st = fs.statSync(path.join(GAMES, f));
    const m = meta[f] || {};
    return { name: f, url: "games/" + encodeURIComponent(f), mtime: st.mtimeMs, source: manifest[f] ? "forge" : "upload", title: m.title || f.replace(/\.html?$/i, ""), description: m.description || "" };
  }).sort((a, b) => b.mtime - a.mtime);
  fs.writeFileSync(INDEX, JSON.stringify({ games }, null, 2));
}

(async () => {
  console.log("concept: " + concept);
  let html = "";
  try { html = extractHtml(await callAPI()); }
  catch (e){ console.error("generation failed: " + e.message); process.exit(1); }
  if (!/<script/i.test(html) || html.length < 800){ console.error("model did not return a usable file (" + html.length + " bytes)"); process.exit(1); }
  fs.writeFileSync(OUT, html);
  console.log("wrote " + name + " (" + Math.round(html.length / 1024) + " KB)");

  const title = concept.replace(/\b\w/g, (c) => c.toUpperCase());
  fs.appendFileSync(USED_FILE, concept + "\n");
  updateMeta(title, concept);
  console.log("updated descriptions.json + games-index.json");
})();