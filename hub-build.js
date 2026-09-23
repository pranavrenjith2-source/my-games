#!/usr/bin/env node
// Builds hub.html as a VERBATIM copy of index.html — identical UI — plus a tiny
// bootstrap so the same file also works when opened directly (file://): it routes
// fetches and relative game links to the local server. Nothing visual is added.
//
// So: one file, the exact site UI, always showing the latest games from the server.
const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const src = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");

function readJSON(p, d){ try { return JSON.parse(fs.readFileSync(p, "utf8")); } catch (e){ return d; } }
const SNAPSHOT = {
  games: (readJSON(path.join(ROOT, "games-index.json"), { games: [] }).games) || [],
  drops: readJSON(path.join(ROOT, "drops.json"), []),
  bugs: readJSON(path.join(ROOT, "bugs.json"), [])
};

const BOOT = `<script>
(function(){
  var LOCAL = "http://127.0.0.1:8787";
  var PUBLIC = "https://pranavrenjith2-source.github.io/my-games";
  var SNAPSHOT = ${JSON.stringify(SNAPSHOT)};
  var proto = location.protocol, host = location.hostname;
  var isFile = proto === "file:";
  var isLocal = /^(127\\.0\\.0\\.1|localhost)$/.test(host);

  function hideServerOnly(){
    try {
      Array.prototype.forEach.call(document.querySelectorAll("section.devmon"), function(s){ s.style.display = "none"; });
      var rf = document.getElementById("req-form");
      if(rf && rf.closest){ var s2 = rf.closest("section"); if(s2) s2.style.display = "none"; }
    } catch(e){}
  }
  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", hideServerOnly); else hideServerOnly();

  // Served by the local server: behave exactly like the real site.
  if(!isFile && isLocal) return;

  // Hosted on a static host (GitHub Pages): no server APIs.
  if(!isFile){
    var _f0 = window.fetch ? window.fetch.bind(window) : null;
    if(_f0){
      window.fetch = function(input, init){
        var u = (typeof input === "string") ? input : (input && input.url) || "";
        if(/\\/api\\/games(\\?|$)/.test(u)) u = "games-index.json";
        return _f0(u, init);
      };
    }
    return;
  }

  // Opened as a plain file: try the local server, then the public site, then the snapshot.
  var _f = window.fetch ? window.fetch.bind(window) : null;
  if(!_f) return;
  function isRel(u){ return u && !/^([a-z][a-z0-9+.-]*:|\\/\\/)/i.test(u); }
  function clean(u){ return String(u).replace(/^\\/+/, ""); }
  function snap(u){
    if(typeof Response === "undefined") return null;
    var body = null;
    if(/\\/api\\/games/.test(u)) body = { games: SNAPSHOT.games };
    else if(/drops\\.json/.test(u)) body = SNAPSHOT.drops || [];
    else if(/bugs\\.json/.test(u)) body = SNAPSHOT.bugs || [];
    if(body === null) return null;
    return new Response(JSON.stringify(body), { status: 200, headers: { "Content-Type": "application/json" } });
  }
  window.fetch = function(input, init){
    var u = (typeof input === "string") ? input : (input && input.url) || "";
    if(!isRel(u)) return _f(u, init);
    var p = clean(u);
    return _f(LOCAL + "/" + p, init).then(function(r){ if(!r.ok) throw new Error("local " + r.status); return r; })
      .catch(function(){
        var pp = /\\/api\\/games/.test(p) ? "games-index.json" : p;
        return _f(PUBLIC + "/" + pp, init).then(function(r){ if(!r.ok) throw new Error("public " + r.status); return r; });
      })
      .catch(function(e){
        var s = snap(u);
        if(s) return s;
        throw e;
      });
  };
  window.__HUB_BASE__ = PUBLIC;
  _f(LOCAL + "/api/games", { cache: "no-store" }).then(function(r){ if(r.ok) window.__HUB_BASE__ = LOCAL; }).catch(function(){});
})();
</script>`;

let out;
if (/<body[^>]*>/i.test(src)) out = src.replace(/<body([^>]*)>/i, (m, a) => "<body" + a + ">\n" + BOOT);
else out = BOOT + "\n" + src;

fs.writeFileSync(path.join(ROOT, "hub.html"), out);

const same = out.replace(BOOT, "").trim() === src.trim();
console.log("wrote hub.html (" + Math.round(out.length / 1024) + " KB) — verbatim copy of index.html" + (same ? " (UI identical)" : ""));