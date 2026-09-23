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

const BOOT = `<script>
(function(){
  var host = location.hostname, proto = location.protocol;
  var isFile = proto === "file:";
  var isLocal = /^(127\\.0\\.0\\.1|localhost)$/.test(host);

  // --- opened as a plain file: talk to the local server for live data + games ---
  if(isFile){
    var BASE = "http://127.0.0.1:8787";
    window.__HUB_BASE__ = BASE;
    var _f = window.fetch ? window.fetch.bind(window) : null;
    if(_f){
      window.fetch = function(input, init){
        var u = (typeof input === "string") ? input : (input && input.url) || "";
        if(u && !/^([a-z][a-z0-9+.-]*:|\\/\\/)/i.test(u)) u = BASE + "/" + u.replace(/^\\/+/, "");
        return _f(u, init);
      };
    }
    document.addEventListener("click", function(e){
      var a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
      if(!a) return;
      var h = a.getAttribute("href") || "";
      if(!h || /^([a-z][a-z0-9+.-]*:|\\/\\/|#)/i.test(h)) return;
      a.setAttribute("href", BASE + "/" + h.replace(/^\\/+/, ""));
    }, true);
    return;
  }

  // --- hosted on a static host (GitHub Pages): no server APIs ---
  if(!isLocal){
    var _f2 = window.fetch ? window.fetch.bind(window) : null;
    if(_f2){
      window.fetch = function(input, init){
        var u = (typeof input === "string") ? input : (input && input.url) || "";
        if(/\\/api\\/games(\\?|$)/.test(u)) u = "games-index.json";
        return _f2(u, init);
      };
    }
    function hideServerOnly(){
      try {
        Array.prototype.forEach.call(document.querySelectorAll("section.devmon"), function(s){ s.style.display = "none"; });
        var rf = document.getElementById("req-form");
        if(rf && rf.closest) { var s2 = rf.closest("section"); if(s2) s2.style.display = "none"; }
      } catch(e){}
    }
    if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", hideServerOnly);
    else hideServerOnly();
  }
})();
</script>`;

let out;
if (/<body[^>]*>/i.test(src)) out = src.replace(/<body([^>]*)>/i, (m, a) => "<body" + a + ">\n" + BOOT);
else out = BOOT + "\n" + src;

fs.writeFileSync(path.join(ROOT, "hub.html"), out);

const same = out.replace(BOOT, "").trim() === src.trim();
console.log("wrote hub.html (" + Math.round(out.length / 1024) + " KB) — verbatim copy of index.html" + (same ? " (UI identical)" : ""));