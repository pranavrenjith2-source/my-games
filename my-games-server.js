#!/usr/bin/env node
// Tiny dependency-free server for the "My Games" page + request terminal.
// Serves the static site and stores submitted requests in requests.json,
// which the daily auto-updater reads to implement the most upvoted ideas.
//
//   node my-games-server.js            -> http://127.0.0.1:8787
//   node my-games-server.js 9000       -> custom port

const http = require("http");
const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const PORT = Number(process.argv[2]) || 8787;
const REQ_FILE = path.join(ROOT, "requests.json");
const ARENA_FILE = path.join(ROOT, "arena-world.json");
const GAMES_DIR = path.join(ROOT, "games");
const FORGE_BASE = path.join(ROOT, ".game-forge");
const UPDATERS = [
  { id: "gloop", name: "Gloop's Great Escape", file: "gloop-escape.html", base: ".gloop-autoupdate" },
  { id: "bot-arena", name: "Bot Arena", file: "bot-arena.html", base: ".bot-arena-autoupdate" },
  { id: "game-forge", name: "Game Forge (hourly games)", file: "games/", base: ".game-forge" }
];

function readText(p) { try { return fs.readFileSync(p, "utf8"); } catch (e) { return ""; } }
function stripAnsi(s) { return String(s).replace(/\x1b\[[0-9;]*m/g, ""); }
function updateInfo(u) {
  const base = path.join(ROOT, u.base);
  const history = readText(path.join(base, "history.txt")).split("\n").map((l) => l.trim()).filter(Boolean);
  let logs = [];
  try { logs = fs.readdirSync(path.join(base, "logs")).filter((f) => f.endsWith(".log")).sort().reverse(); } catch (e) { }
  let lastLog = "", lastLogFile = logs[0] || "";
  if (lastLogFile) lastLog = stripAnsi(readText(path.join(base, "logs", lastLogFile))).split("\n").slice(-60).join("\n");
  let backups = 0;
  try { backups = fs.readdirSync(path.join(base, "backups")).filter((f) => f.endsWith(".html")).length; } catch (e) { }
  const plist = path.join(process.env.HOME || "", "Library", "LaunchAgents", "com.pranav." + u.id + "-autoupdate.plist");
  return { id: u.id, name: u.name, file: u.file, installed: fs.existsSync(base), scheduled: fs.existsSync(plist), history, lastLog, lastLogFile, backups };
}

/* ============================================================
   AD-BLOCK WEB PROXY
   Fetches pages server-side and strips ad/tracker requests.
   Localhost-only, with SSRF guards. Not a general open proxy.
   ============================================================ */
const AD_DOMAINS = [
  'doubleclick.net', 'googlesyndication.com', 'googleadservices.com', 'googletagservices.com', 'google-analytics.com',
  'googletagmanager.com', 'adservice.google.com', '2mdn.net', 'adnxs.com', 'adsrvr.org', 'rubiconproject.com',
  'pubmatic.com', 'openx.net', 'casalemedia.com', 'criteo.com', 'criteo.net', 'taboola.com', 'outbrain.com',
  'scorecardresearch.com', 'quantserve.com', 'amazon-adsystem.com', 'adsafeprotected.com', 'moatads.com',
  'serving-sys.com', 'mathtag.com', 'turn.com', 'bidswitch.net', 'sharethrough.com', 'teads.tv', 'smartadserver.com',
  'yieldmo.com', '3lift.com', 'adcolony.com', 'applovin.com', 'chartbeat.com', 'hotjar.com', 'mixpanel.com',
  'segment.io', 'segment.com', 'fullstory.com', 'mouseflow.com', 'crazyegg.com', 'optimizely.com', 'branch.io',
  'adjust.com', 'appsflyer.com', 'kochava.com', 'bugsnag.com', 'sentry.io', 'adroll.com', 'bluekai.com',
  'demdex.net', 'everesttech.net', 'krxd.net', 'omtrdc.net', 'rlcdn.com', 'tapad.com', 'tidaltv.com', 'yieldlab.net'
];
const AD_KEYWORDS = ['doubleclick', 'adserver', 'adservice', 'adsystem', 'advert', 'analytics', 'tracker', 'tracking', 'telemetry'];
function isAdHost(host) {
  host = String(host || '').toLowerCase();
  for (let i = 0; i < AD_DOMAINS.length; i++) if (host === AD_DOMAINS[i] || host.endsWith('.' + AD_DOMAINS[i])) return true;
  for (let k = 0; k < AD_KEYWORDS.length; k++) if (host.indexOf(AD_KEYWORDS[k]) >= 0) return true;
  return false;
}
function isPrivateHost(host) {
  host = String(host || '').toLowerCase();
  if (host === 'localhost' || host === '::1' || host === '0.0.0.0' || host.endsWith('.local')) return true;
  if (/^127\./.test(host) || /^10\./.test(host) || /^192\.168\./.test(host) || /^169\.254\./.test(host)) return true;
  if (/^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(host)) return true;
  return false;
}
function isAdUrl(u, base) {
  try { return isAdHost(new URL(u, base).hostname); } catch (e) { return false; }
}
const blockStats = { blocked: 0, allowed: 0, recent: [] };
function recordBlock(host) {
  blockStats.blocked++;
  blockStats.recent.unshift({ host: host, ts: Date.now() });
  if (blockStats.recent.length > 50) blockStats.recent.pop();
}
function rewriteHtml(html, baseUrl) {
  const prox = (u) => '/proxy?url=' + encodeURIComponent(u);
  const abs = (h) => { try { return new URL(h, baseUrl).href; } catch (e) { return null; } };
  // Drop ad/tracker <script>, <iframe>, <img>, <link> elements.
  html = html.replace(/<script\b[^>]*\bsrc=["']([^"']+)["'][^>]*>\s*<\/script>/gi, (m, s) => isAdUrl(s, baseUrl) ? '' : m);
  html = html.replace(/<iframe\b[^>]*\bsrc=["']([^"']+)["'][^>]*>\s*<\/iframe>/gi, (m, s) => isAdUrl(s, baseUrl) ? '' : m);
  html = html.replace(/<img\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi, (m, s) => isAdUrl(s, baseUrl) ? '' : m);
  html = html.replace(/<link\b[^>]*\bhref=["']([^"']+)["'][^>]*>/gi, (m, s) => isAdUrl(s, baseUrl) ? '' : m);
  // Rewrite remaining URLs so subresources also go through the proxy.
  html = html.replace(/\b(href|src|action|poster)=["']([^"']+)["']/gi, (m, attr, val) => {
    if (/^(javascript:|mailto:|tel:|#|data:|blob:)/i.test(val)) return m;
    const a = abs(val);
    if (!a) return m;
    if (isAdUrl(a, baseUrl)) return '';
    return attr + '="' + prox(a) + '"';
  });
  return html;
}

/* YouTube: resolve a channel and list its latest videos via the public RSS feed. */
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36";
function decodeXml(s) { return String(s).replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'"); }
function parseFeed(xml) {
  const out = [];
  const parts = String(xml).split("<entry>").slice(1);
  for (const e of parts) {
    const vid = (e.match(/<yt:videoId>([^<]+)<\/yt:videoId>/) || [])[1];
    const title = (e.match(/<title>([\s\S]*?)<\/title>/) || [])[1];
    const pub = (e.match(/<published>([^<]+)<\/published>/) || [])[1];
    const thumb = (e.match(/<media:thumbnail url="([^"]+)"/) || [])[1];
    if (vid) out.push({ id: vid, title: decodeXml(title || ""), published: pub || "", thumb: thumb || "" });
  }
  return out;
}
async function fetchText(u) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 15000);
  try {
    const r = await fetch(u, { headers: { "User-Agent": UA, "Accept-Language": "en-US,en;q=0.9" }, signal: ctrl.signal, redirect: "follow" });
    return { ok: r.ok, status: r.status, text: await r.text() };
  } finally { clearTimeout(t); }
}
async function resolveChannel(q) {
  q = String(q || "").trim();
  if (/^UC[\w-]{22}$/.test(q)) return q;
  let target = q;
  if (/^@/.test(q)) target = "https://www.youtube.com/" + q;
  else if (!/^https?:/i.test(q)) target = "https://www.youtube.com/@" + q;
  const r = await fetchText(target);
  if (!r.ok) return null;
  const m = r.text.match(/"channelId":"(UC[\w-]{22})"/) ||
    r.text.match(/<meta itemprop="identifier" content="(UC[\w-]{22})"/) ||
    r.text.match(/channel_id=(UC[\w-]{22})/) ||
    r.text.match(/youtube\.com\/channel\/(UC[\w-]{22})/);
  return m ? m[1] : null;
}
async function channelVideos(cid) {
  const r = await fetchText("https://www.youtube.com/feeds/videos.xml?channel_id=" + encodeURIComponent(cid));
  if (!r.ok) return { title: "", videos: [] };
  const title = decodeXml((r.text.match(/<title>([\s\S]*?)<\/title>/) || [])[1] || "");
  return { title: title, videos: parseFeed(r.text) };
}

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon"
};

function readRequests() {
  try {
    const data = JSON.parse(fs.readFileSync(REQ_FILE, "utf8"));
    return Array.isArray(data) ? data : [];
  } catch (e) {
    return [];
  }
}

function writeRequests(list) {
  fs.writeFileSync(REQ_FILE, JSON.stringify(list, null, 2));
}

function sendJson(res, code, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(code, { "Content-Type": "application/json; charset=utf-8", "Content-Length": Buffer.byteLength(body) });
  res.end(body);
}

function readBody(req) {
  return new Promise((resolve) => {
    let raw = "";
    req.on("data", (c) => { raw += c; if (raw.length > 1e5) req.destroy(); });
    req.on("end", () => { try { resolve(JSON.parse(raw || "{}")); } catch (e) { resolve({}); } });
  });
}

function newId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

/* Uploaded games (dev uploads). Stored as real files under games/ and served. */
function ensureGames() { try { fs.mkdirSync(GAMES_DIR, { recursive: true }); } catch (e) { } }
function safeGameName(n) {
  n = String(n || "").replace(/[^\w.\- ]+/g, "_").replace(/^\.+/, "").slice(0, 80);
  if (!/\.html?$/i.test(n)) n += ".html";
  return n || ("game-" + Date.now() + ".html");
}
function listGames() {
  ensureGames();
  var manifest = {}, meta = {};
  try { fs.readFileSync(path.join(FORGE_BASE, "manifest.txt"), "utf8").split("\n").forEach(function (l) { l = l.trim(); if (l) manifest[l] = 1; }); } catch (e) { }
  try { meta = JSON.parse(fs.readFileSync(path.join(FORGE_BASE, "descriptions.json"), "utf8")); } catch (e) { }
  try {
    return fs.readdirSync(GAMES_DIR).filter(function (f) { return /\.html?$/i.test(f); }).map(function (f) {
      var st = fs.statSync(path.join(GAMES_DIR, f));
      var m = meta[f] || {};
      var isForge = !!manifest[f];
      return {
        name: f, url: "games/" + encodeURIComponent(f), size: st.size, mtime: st.mtimeMs,
        source: isForge ? "forge" : "upload",
        title: m.title || f.replace(/\.html?$/i, ""),
        description: m.description || ""
      };
    }).sort(function (a, b) { return b.mtime - a.mtime; });
  } catch (e) { return []; }
}
function readBigBody(req, limit) {
  return new Promise(function (resolve) {
    var chunks = [], size = 0;
    req.on("data", function (c) { size += c.length; if (size > (limit || 30e6)) { req.destroy(); resolve(null); return; } chunks.push(c); });
    req.on("end", function () { try { resolve(JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}")); } catch (e) { resolve({}); } });
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://localhost");
  const pathname = url.pathname;

  // Allow the single-file hub (which may be opened from file://) to read live data.
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,DELETE,PATCH,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") { res.writeHead(204); return res.end(); }

  if (pathname === "/api/requests" && req.method === "GET") {
    return sendJson(res, 200, readRequests());
  }

  if (pathname === "/api/requests" && req.method === "POST") {
    const body = await readBody(req);
    const text = String(body.text || "").trim().slice(0, 240);
    if (!text) return sendJson(res, 400, { error: "text required" });
    const entry = {
      id: newId(),
      game: String(body.game || "Gloop's Great Escape").slice(0, 60),
      name: String(body.name || "anon").slice(0, 24),
      text: text,
      votes: 0,
      status: "open",
      ts: Date.now()
    };
    const list = readRequests();
    list.push(entry);
    writeRequests(list);
    console.log("[request] " + entry.game + " :: " + entry.text);
    return sendJson(res, 201, entry);
  }

  if (pathname === "/api/requests/vote" && req.method === "POST") {
    const body = await readBody(req);
    const list = readRequests();
    const item = list.filter((r) => r.id === body.id)[0];
    if (!item) return sendJson(res, 404, { error: "not found" });
    item.votes = (item.votes || 0) + 1;
    writeRequests(list);
    return sendJson(res, 200, item);
  }

  // Dev monitor: update histories + latest logs for every game.
  if (pathname === "/api/updates" && req.method === "GET") {
    return sendJson(res, 200, { now: Date.now(), games: UPDATERS.map(updateInfo) });
  }

  // Shared bot-arena world (bots, feed, human ladder).
  if (pathname === "/api/arena" && req.method === "GET") {
    try {
      const raw = fs.readFileSync(ARENA_FILE, "utf8");
      return sendJson(res, 200, JSON.parse(raw));
    } catch (e) {
      return sendJson(res, 200, {});
    }
  }
  if (pathname === "/api/arena" && req.method === "POST") {
    const body = await readBody(req);
    if (!body || !Array.isArray(body.bots)) return sendJson(res, 400, { error: "invalid world" });
    try {
      fs.writeFileSync(ARENA_FILE, JSON.stringify(body));
      return sendJson(res, 200, { ok: true, bots: body.bots.length });
    } catch (e) {
      return sendJson(res, 500, { error: "write failed" });
    }
  }

  // Ad-block web proxy (localhost only, SSRF-guarded).
  if (pathname === "/proxy" && req.method === "GET") {
    const target = url.searchParams.get("url");
    if (!target) { res.writeHead(400); return res.end("missing url"); }
    let u;
    try { u = new URL(target); } catch (e) { res.writeHead(400); return res.end("bad url"); }
    if (u.protocol !== "http:" && u.protocol !== "https:") { res.writeHead(400); return res.end("only http(s)"); }
    if (isPrivateHost(u.hostname)) { res.writeHead(403); return res.end("blocked private host"); }
    if (isAdHost(u.hostname)) { recordBlock(u.hostname); res.writeHead(204); return res.end(); }
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 15000);
      const upstream = await fetch(u.href, {
        redirect: "follow",
        signal: ctrl.signal,
        headers: {
          "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9"
        }
      });
      clearTimeout(timer);
      const ct = upstream.headers.get("content-type") || "application/octet-stream";
      const buf = Buffer.from(await upstream.arrayBuffer());
      blockStats.allowed++;
      if (ct.indexOf("text/html") >= 0) {
        res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
        return res.end(rewriteHtml(buf.toString("utf8"), upstream.url || u.href));
      }
      res.writeHead(200, { "Content-Type": ct });
      return res.end(buf);
    } catch (e) {
      res.writeHead(502, { "Content-Type": "text/plain" });
      return res.end("proxy error: " + e.message);
    }
  }

  if (pathname === "/api/blockstats" && req.method === "GET") {
    return sendJson(res, 200, { blocked: blockStats.blocked, allowed: blockStats.allowed, recent: blockStats.recent.slice(0, 30), listSize: AD_DOMAINS.length + AD_KEYWORDS.length });
  }
  if (pathname === "/api/blockstats/reset" && req.method === "POST") {
    blockStats.blocked = 0; blockStats.allowed = 0; blockStats.recent = [];
    return sendJson(res, 200, { ok: true });
  }

  // YouTube channel -> latest videos (via the public RSS feed; needs the server for CORS).
  if (pathname === "/api/yt/channel" && req.method === "GET") {
    const q = url.searchParams.get("q") || "";
    try {
      const cid = await resolveChannel(q);
      if (!cid) return sendJson(res, 404, { error: "channel not found" });
      const info = await channelVideos(cid);
      return sendJson(res, 200, { channelId: cid, title: info.title, count: info.videos.length });
    } catch (e) { return sendJson(res, 502, { error: e.message }); }
  }
  if (pathname === "/api/yt/videos" && req.method === "GET") {
    const cid = url.searchParams.get("id") || "";
    if (!/^UC[\w-]{22}$/.test(cid)) return sendJson(res, 400, { error: "bad channel id" });
    try {
      const info = await channelVideos(cid);
      return sendJson(res, 200, { channelId: cid, title: info.title, videos: info.videos });
    } catch (e) { return sendJson(res, 502, { error: e.message }); }
  }

  // Dev game uploads.
  if (pathname === "/api/games" && req.method === "GET") {
    return sendJson(res, 200, { games: listGames() });
  }
  if (pathname === "/api/games" && req.method === "POST") {
    const body = await readBigBody(req, 30e6);
    if (!body || !body.html) return sendJson(res, 400, { error: "html required" });
    ensureGames();
    const name = safeGameName(body.name || ("game-" + Date.now() + ".html"));
    fs.writeFileSync(path.join(GAMES_DIR, name), String(body.html));
    console.log("[game] uploaded " + name + " (" + Math.round(String(body.html).length / 1024) + " KB)");
    return sendJson(res, 201, { ok: true, name: name, url: "games/" + encodeURIComponent(name) });
  }
  if (pathname === "/api/games" && req.method === "DELETE") {
    const name = safeGameName(url.searchParams.get("name") || "");
    const p = path.join(GAMES_DIR, name);
    if (p.startsWith(GAMES_DIR) && fs.existsSync(p)) { fs.unlinkSync(p); return sendJson(res, 200, { ok: true }); }
    return sendJson(res, 404, { error: "not found" });
  }
  if (pathname === "/api/games" && req.method === "PATCH") {
    const body = await readBody(req);
    const from = safeGameName(body.from || "");
    const to = safeGameName(body.to || "");
    const fp = path.join(GAMES_DIR, from), tp = path.join(GAMES_DIR, to);
    if (fp.startsWith(GAMES_DIR) && tp.startsWith(GAMES_DIR) && fs.existsSync(fp)) {
      fs.renameSync(fp, tp);
      console.log("[game] renamed " + from + " -> " + to);
      return sendJson(res, 200, { ok: true, name: to, url: "games/" + encodeURIComponent(to) });
    }
    return sendJson(res, 404, { error: "not found" });
  }

  // Static files.
  let file = pathname === "/" ? "/index.html" : pathname;
  try { file = decodeURIComponent(file); } catch (e) { }
  file = path.normalize(file).replace(/^(\.\.[\/\\])+/, "");
  const full = path.join(ROOT, file);
  if (!full.startsWith(ROOT)) { res.writeHead(403); return res.end("forbidden"); }
  fs.readFile(full, (err, data) => {
    if (err) { res.writeHead(404, { "Content-Type": "text/plain" }); return res.end("not found"); }
    res.writeHead(200, { "Content-Type": MIME[path.extname(full)] || "application/octet-stream" });
    res.end(data);
  });
});

server.listen(PORT, "127.0.0.1", () => {
  console.log("My Games running at http://127.0.0.1:" + PORT);
  console.log("Requests are stored in " + REQ_FILE);
});