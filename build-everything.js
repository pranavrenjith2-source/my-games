#!/usr/bin/env node
// Builds everything.html — ONE file containing the ENTIRE site: the index UI,
// every built-in page, every forge game, the drops, and the Bill Wurtz data.
// Games are embedded and opened in the in-page viewer via Blob URLs, so it works
// fully offline (except pages that need the local server: proxy browser / YouTube).
const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const read = (p) => fs.readFileSync(path.join(ROOT, p), "utf8");
const readJSON = (p, d) => { try { return JSON.parse(read(p)); } catch (e){ return d; } };
const exists = (p) => { try { fs.accessSync(path.join(ROOT, p)); return true; } catch (e){ return false; } };
// JSON that is safe to inline inside a <script> block (escape "</")
const js = (o) => JSON.stringify(o).replace(/<\//g, "<\\/");

const manifest = read(".game-forge/manifest.txt").split("\n").map((s) => s.trim()).filter(Boolean);
const desc = readJSON(".game-forge/descriptions.json", {});
const drops = readJSON("drops.json", []);
const bugs = readJSON("bugs.json", []);
const songs = readJSON("billwurtz-songs.json", []);
const words = readJSON("billwurtz-words.json", []);

const pages = {};
function add(url, title, description, source){
  if (!exists(url)) return;
  pages[url] = { title, description: description || "", source: source || "page", html: read(url) };
}

// built-in pages
add("gloop-escape.html", "Gloop's Great Escape", "Help Gloop the slime escape the enemy horde.", "builtin");
add("bot-arena.html", "Bot Arena", "Fighting bots with a real ML layer.", "builtin");
add("browser.html", "Browser", "A proxy browser with an ad blocker (needs the local server).", "utility");
add("youtube.html", "YouTube Player", "Plays a video/playlist (needs the local server).", "utility");
add("youtubers.html", "YouTubers", "Browse channels' latest uploads (needs the local server).", "utility");
add("billwurtz.html", "Bill Wurtz Sentence Machine", "Type a sentence, hear it stitched from bill wurtz clips.", "utility");
add("billwurtz-portal.html", "Bill Wurtz Portal", "Every bill wurtz section plus his whole song list.", "utility");
add("audio-test.html", "Audio Test", "Diagnostic page.", "utility");

// give the billwurtz page its data offline
if (pages["billwurtz.html"]){
  const inject = "<script>window.__BW_SONGS__=" + js(songs) + ";window.__BW_WORDS__=" + js(words) +
    ";(function(){var _f=window.fetch;window.fetch=function(i,init){var u=(typeof i==='string')?i:(i&&i.url)||'';" +
    "if(/billwurtz-songs\\.json/.test(u))return Promise.resolve(new Response(JSON.stringify(window.__BW_SONGS__),{headers:{'Content-Type':'application/json'}}));" +
    "if(/billwurtz-words\\.json/.test(u))return Promise.resolve(new Response(JSON.stringify(window.__BW_WORDS__),{headers:{'Content-Type':'application/json'}}));" +
    "return _f.apply(window,arguments);};})();</script>";
  pages["billwurtz.html"].html = pages["billwurtz.html"].html.replace(/<body([^>]*)>/i, (m) => m + inject);
}

// forge games
const gamesList = [];
for (const name of manifest){
  const url = "games/" + name;
  const m = desc[name] || {};
  const title = m.title || name.replace(/\.html?$/i, "");
  add(url, title, m.description || "", "forge");
  gamesList.push({ name, url: "games/" + encodeURIComponent(name), source: "forge", title, description: m.description || "" });
}

// drops
for (const d of drops){
  add(d.file, d.title, d.description, d.kind === "utility" ? "utility" : "game");
}

const PAGES = {};
for (const k of Object.keys(pages)) PAGES[k] = pages[k].html;
const META = {};
for (const k of Object.keys(pages)) META[k] = { title: pages[k].title, description: pages[k].description };

const BOOT = "<script>\n(function(){\n" +
  "  var PAGES = " + js(PAGES) + ";\n" +
  "  var META = " + js(META) + ";\n" +
  "  var GAMES = " + js(gamesList) + ";\n" +
  "  var DROPS = " + js(drops) + ";\n" +
  "  var BUGS = " + js(bugs) + ";\n" +
  "  var blobs = {};\n" +
  "  function blobUrl(k){ if(!blobs[k]) blobs[k] = URL.createObjectURL(new Blob([PAGES[k]], { type:'text/html' })); return blobs[k]; }\n" +
  "  function resp(o){ var b=JSON.stringify(o); if(typeof Response!=='undefined') return new Response(b,{status:200,headers:{'Content-Type':'application/json'}}); return { ok:true, status:200, json:function(){ return Promise.resolve(JSON.parse(b)); }, text:function(){ return Promise.resolve(b); } }; }\n" +
  "  var _f = window.fetch ? window.fetch.bind(window) : null;\n" +
  "  if(_f){ window.fetch = function(i, init){\n" +
  "    var u = (typeof i === 'string') ? i : (i && i.url) || ''; var m = u.split('?')[0];\n" +
  "    if(/\\/api\\/games$|games-index\\.json$/.test(m)) return Promise.resolve(resp({ games: GAMES }));\n" +
  "    if(/drops\\.json$/.test(m)) return Promise.resolve(resp(DROPS));\n" +
  "    if(/bugs\\.json$/.test(m)) return Promise.resolve(resp(BUGS));\n" +
  "    return _f(i, init);\n" +
  "  }; }\n" +
  "  function openPage(k){\n" +
  "    if(!PAGES[k]) return;\n" +
  "    var v=document.getElementById('viewer'), f=document.getElementById('frame'), t=document.getElementById('vtitle'), o=document.getElementById('vopen');\n" +
  "    var u=blobUrl(k);\n" +
  "    f.src=u; t.textContent=(META[k]&&META[k].title)||k; o.href=u;\n" +
  "    v.classList.add('open'); document.body.style.overflow='hidden';\n" +
  "  }\n" +
  "  document.addEventListener('click', function(e){\n" +
  "    var a = e.target && e.target.closest ? e.target.closest('a.card') : null; if(!a) return;\n" +
  "    var h = a.getAttribute('href') || ''; var k = h.replace(/^\\.\\//,'');\n" +
  "    if(PAGES[k]){ e.preventDefault(); e.stopPropagation(); openPage(k); }\n" +
  "  }, true);\n" +
  "})();\n</script>";

let shell = read("index.html");
shell = shell.replace(/<body([^>]*)>/i, (m) => m + "\n" + BOOT);
shell = shell.replace(/<title>([\s\S]*?)<\/title>/i, "<title>My Games — everything (single file)</title>");

fs.writeFileSync(path.join(ROOT, "everything.html"), shell);
console.log("wrote everything.html (" + (fs.statSync(path.join(ROOT, "everything.html")).size / 1048576).toFixed(2) + " MB)");
console.log("embedded pages: " + Object.keys(PAGES).length + " | forge games: " + gamesList.length + " | drops: " + drops.length);