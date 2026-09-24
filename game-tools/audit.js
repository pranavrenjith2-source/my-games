#!/usr/bin/env node
// Site-wide bug auditor. For each HTML page it:
//   1. syntax-checks every inline <script>
//   2. loads it headless in jsdom and captures runtime/console errors
//   3. simulates a user: clicks every button/link, fires input/keyboard events
//   4. static checks: ids used but never defined, duplicate ids, broken local links
// Prints JSON: { file, title, ok, errors:[], warnings:[] }
//
//   node audit.js <file.html>
//   node audit.js --out bugs.json <files...>
const fs = require("fs");
const path = require("path");

// Pages can throw from timers inside jsdom; don't let one page kill the whole sweep.
const CRASHES = [];
process.on("uncaughtException", (e) => { CRASHES.push("uncaught: " + String((e && e.stack) || e).split("\n").slice(0, 2).join(" ")); });
process.on("unhandledRejection", (e) => { CRASHES.push("unhandledRejection: " + String((e && e.message) || e)); });

const BENIGN = /Could not parse CSS|Not implemented|navigation|Failed to fetch|NetworkError|net::|offline|ERR_|The operation is insecure|ResizeObserver/i;

function extractScripts(html){
  const out = [];
  const re = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = re.exec(html))){
    const attrs = m[1] || "";
    if (/\bsrc\s*=/i.test(attrs)) continue;
    if (/type\s*=\s*["']?(application\/json|text\/template|text\/x-handlebars)/i.test(attrs)) continue;
    out.push(m[2]);
  }
  return out;
}
function checkSyntax(html){
  const errors = [];
  extractScripts(html).forEach((code, i) => {
    try { new Function(code); } catch (e){ errors.push("script #" + (i + 1) + " syntax error: " + e.message); }
  });
  return errors;
}
function definedIds(html){
  const ids = new Set();
  const re = /id\s*=\s*\\?["'`]([A-Za-z0-9_:\-.]+)\\?["'`]/g;
  let m; while ((m = re.exec(html))) ids.add(m[1]);
  return ids;
}
function referencedIds(html){
  const refs = new Map();
  [/getElementById\(\s*["'`]([A-Za-z0-9_:\-.]+)["'`]/g,
   /\$\s*\(\s*["'`]([A-Za-z0-9_:\-.]+)["'`]\s*\)/g,
   /querySelector\(\s*["'`]#([A-Za-z0-9_:\-.]+)["'`]/g].forEach((re) => {
    let m; while ((m = re.exec(html))) refs.set(m[1], (refs.get(m[1]) || 0) + 1);
  });
  return refs;
}
function duplicateIds(html){
  const seen = new Map();
  const re = /<[^>]*\bid\s*=\s*["']([A-Za-z0-9_:\-.]+)["'][^>]*>/g;
  let m; while ((m = re.exec(html))) seen.set(m[1], (seen.get(m[1]) || 0) + 1);
  return [...seen.entries()].filter(([, n]) => n > 1).map(([id, n]) => "duplicate id \"" + id + "\" appears " + n + "x");
}
// Inline local <script src> files so pages with shared JS run self-contained in jsdom.
function inlineLocalScripts(html, dir){
  return html.replace(/<script\b([^>]*?)\bsrc\s*=\s*["']([^"']+)["']([^>]*?)>\s*<\/script>/gi, (m, pre, src, post) => {
    if (/^(https?:|\/\/|data:)/i.test(src)) return m;
    try {
      const code = fs.readFileSync(path.resolve(dir, src.split("?")[0]), "utf8");
      return "<script>" + code.split("</script").join("<\\/script") + "</scr" + "ipt>";
    } catch (e){ return m; }
  });
}
function brokenLinks(html, dir){
  const bad = [];
  const re = /(?:href|src)\s*=\s*["']([^"']+)["']/gi;
  let m;
  while ((m = re.exec(html))){
    let u = m[1].trim();
    if (!u || /^(#|https?:|mailto:|tel:|data:|javascript:|blob:|\/\/)/i.test(u)) continue;
    u = u.split("#")[0].split("?")[0];
    if (!u) continue;
    if (!/\.(html?|css|js|json|mp3|wav|png|jpe?g|gif|svg|ico|webp|txt|woff2?)$/i.test(u)) continue;
    if (!fs.existsSync(path.resolve(dir, decodeURIComponent(u)))) bad.push("missing local file: " + u);
  }
  return [...new Set(bad)];
}

function audit(file){
  return new Promise((resolve) => {
    const errors = [], warnings = [];
    let html;
    try { html = fs.readFileSync(file, "utf8"); }
    catch (e){ return resolve({ file, title: file, ok: false, errors: ["cannot read file"], warnings: [] }); }
    const dir = path.dirname(path.resolve(file));
    const tm = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    const title = tm ? tm[1].replace(/\s+/g, " ").trim() : path.basename(file);

    errors.push(...checkSyntax(html));
    const defined = definedIds(html);
    referencedIds(html).forEach((n, id) => { if (!defined.has(id)) warnings.push("id \"" + id + "\" used in code but not defined in the HTML"); });
    warnings.push(...duplicateIds(html), ...brokenLinks(html, dir));

    let JSDOM, VirtualConsole;
    try { ({ JSDOM, VirtualConsole } = require("jsdom")); }
    catch (e){ return resolve({ file, title, ok: errors.length === 0, errors, warnings: warnings.concat("jsdom missing — runtime check skipped") }); }

    const rt = [];
    const vc = new VirtualConsole();
    vc.on("jsdomError", (e) => { const msg = String((e && e.message) || e); if (!BENIGN.test(msg)) rt.push("jsdomError: " + msg); });
    vc.on("error", (...a) => { const msg = a.map(String).join(" "); if (!BENIGN.test(msg)) rt.push("console.error: " + msg); });

    const prelude = `<script>(function(){
      function Ctx(el){ return new Proxy({}, { get:function(t,k){
        if(k==='canvas')return el; if(k in t)return t[k];
        if(k==='createLinearGradient'||k==='createRadialGradient'||k==='createPattern') return function(){ return { addColorStop:function(){} }; };
        if(k==='measureText') return function(){ return { width:0 }; };
        if(k==='getImageData'||k==='createImageData') return function(){ return { data:new Uint8ClampedArray(4), width:1, height:1 }; };
        return function(){}; }, set:function(t,k,v){ t[k]=v; return true; } }); }
      try{ window.HTMLCanvasElement.prototype.getContext=function(){ if(!this.__ctx)this.__ctx=Ctx(this); return this.__ctx; }; }catch(e){}
      window.AudioContext=window.AudioContext||function(){ return { state:'running', currentTime:0, resume:function(){return Promise.resolve();}, createOscillator:function(){return {frequency:{setValueAtTime:function(){},exponentialRampToValueAtTime:function(){}},connect:function(){},start:function(){},stop:function(){},type:''};}, createGain:function(){return {gain:{setValueAtTime:function(){},exponentialRampToValueAtTime:function(){},value:0,linearRampToValueAtTime:function(){}},connect:function(){}};}, destination:{}, sampleRate:44100, decodeAudioData:function(){return Promise.reject(new Error('offline'));}, createBuffer:function(){return {getChannelData:function(){return new Float32Array(1);}};}, createBufferSource:function(){return {connect:function(){},start:function(){},stop:function(){},buffer:null};}, createBiquadFilter:function(){return {connect:function(){},frequency:{value:0},type:''};} }; };
      try{ if(!window.speechSynthesis) window.speechSynthesis={speak:function(){}}; }catch(e){}
      try{ window.fetch=function(){ return Promise.reject(new Error('offline (audit)')); }; }catch(e){}
      try{ if(!window.matchMedia) window.matchMedia=function(){ return { matches:false, addListener:function(){}, removeListener:function(){}, addEventListener:function(){}, removeEventListener:function(){} }; }; }catch(e){}
      try{ if(!window.crypto) window.crypto={ getRandomValues:function(a){ for(var i=0;i<a.length;i++)a[i]=Math.floor(Math.random()*256); return a; }, randomUUID:function(){ return 'id-'+Math.random().toString(36).slice(2); } }; }catch(e){}
      try{ if(!window.URL.createObjectURL) window.URL.createObjectURL=function(){ return 'blob:stub'; }; if(!window.URL.revokeObjectURL) window.URL.revokeObjectURL=function(){}; }catch(e){}
      try{ if(!window.requestAnimationFrame) window.requestAnimationFrame=function(cb){ return setTimeout(function(){ cb(Date.now()); }, 16); }; }catch(e){}
      try{ if(window.HTMLMediaElement){ window.HTMLMediaElement.prototype.play=function(){ return Promise.resolve(); }; window.HTMLMediaElement.prototype.pause=function(){}; window.HTMLMediaElement.prototype.load=function(){}; } }catch(e){}
      try{ if(!window.CanvasRenderingContext2D) window.CanvasRenderingContext2D=function(){}; }catch(e){}
      try{ if(!window.Path2D) window.Path2D=function(){ return { addPath:function(){}, moveTo:function(){}, lineTo:function(){}, closePath:function(){}, arc:function(){}, rect:function(){} }; }; }catch(e){}
      try{ if(!window.ImageData) window.ImageData=function(){ return { data:new Uint8ClampedArray(4), width:1, height:1 }; }; }catch(e){}
      try{ if(!window.Image) window.Image=function(){ var s=this; s.src=''; s.width=1; s.height=1; s.addEventListener=function(){}; s.removeEventListener=function(){}; s.onload=null; s.onerror=null; }; }catch(e){}
      try{ if(!window.OffscreenCanvas) window.OffscreenCanvas=function(){ return { getContext:function(){ return null; }, width:1, height:1 }; }; }catch(e){}
    })();</script>`;

    let dom;
    const runtimeHtml = inlineLocalScripts(html, dir);
    try { dom = new JSDOM(prelude + runtimeHtml, { runScripts: "dangerously", pretendToBeVisual: true, virtualConsole: vc, url: "http://localhost/" }); }
    catch (e){ return resolve({ file, title, ok: false, errors: errors.concat("load failed: " + e.message), warnings }); }

    const w = dom.window, d = w.document;
    const fire = (type, el, init) => { try { (el || d.body || d.documentElement).dispatchEvent(new w.MouseEvent(type, Object.assign({ bubbles: true, cancelable: true, clientX: 200, clientY: 150 }, init || {}))); } catch (e){} };
    const key = (k) => { try { w.dispatchEvent(new w.KeyboardEvent("keydown", { key: k, code: k, bubbles: true })); w.dispatchEvent(new w.KeyboardEvent("keyup", { key: k, code: k, bubbles: true })); } catch (e){} };

    setTimeout(() => {
      try {
        fire("mousemove"); fire("mousedown"); fire("mouseup");
        [...d.querySelectorAll("button, [role=button], a, input, select, textarea, canvas")].slice(0, 25).forEach((el) => {
          try {
            fire("mousedown", el); fire("mouseup", el); fire("click", el);
            if ((el.tagName === "INPUT" || el.tagName === "TEXTAREA") && el.type !== "file"){
              el.value = el.type === "range" ? "50" : "test";
              el.dispatchEvent(new w.Event("input", { bubbles: true }));
              el.dispatchEvent(new w.Event("change", { bubbles: true }));
            }
          } catch (e){ rt.push("interaction error on <" + String(el.tagName).toLowerCase() + ">: " + e.message); }
        });
        ["ArrowRight", "ArrowLeft", "ArrowUp", "ArrowDown", " ", "Enter", "Escape", "a", "d", "w", "s", "1", "2", "3"].forEach(key);
      } catch (e){ rt.push("input pass: " + e.message); }

      setTimeout(() => {
        rt.forEach((e) => errors.push(e));
        const text = (d.body ? d.body.textContent : "").replace(/\s+/g, " ").trim();
        const hasCanvas = !!d.querySelector("canvas");
        if (!text && !hasCanvas) errors.push("page looks blank (no text, no canvas)");
        try { dom.window.close(); } catch (e){}
        resolve({ file, title, ok: errors.length === 0, errors: [...new Set(errors)], warnings: [...new Set(warnings)] });
      }, 700);
    }, 500);
  });
}

async function main(){
  const args = process.argv.slice(2);
  if (args[0] === "--single"){
    const r = await audit(args[1]);
    process.stdout.write(JSON.stringify(r));
    process.exit(0);
    return;
  }
  if (args[0] === "--out"){
    const out = args[1], files = args.slice(2), results = [];
    const perPage = Number(process.env.AUDIT_TIMEOUT || 20000);
    const { execFile } = require("child_process");
    const auditOne = (file) => new Promise((resolve) => {
      execFile(process.execPath, [__filename, "--single", file], { timeout: perPage, killSignal: "SIGKILL", maxBuffer: 20 * 1024 * 1024 }, (err, stdout) => {
        if (!stdout){
          resolve({ file, title: file, ok: false, warnings: [],
            errors: [err && err.killed ? "audit timed out — the page appears to hang (infinite loop?)" : "audit crashed: " + (err ? err.message : "unknown")] });
          return;
        }
        try { resolve(JSON.parse(stdout)); }
        catch (e){ resolve({ file, title: file, ok: false, errors: ["audit produced no result"], warnings: [] }); }
      });
    });
    const pool = Math.max(1, Number(process.env.AUDIT_PARALLEL || 4));
    const out2 = new Array(files.length);
    let next = 0;
    async function worker(){
      while (true){
        const i = next++;
        if (i >= files.length) return;
        const f = files[i];
        const before = CRASHES.length;
        const r = await auditOne(f);
        const extra = CRASHES.slice(before);
        if (extra.length){ r.errors = [...new Set(r.errors.concat(extra))]; r.ok = false; }
        out2[i] = r;
      }
    }
    await Promise.all(Array.from({ length: Math.min(pool, files.length) }, worker));
    fs.writeFileSync(out, JSON.stringify(out2, null, 2));
    console.log("wrote " + out + " (" + out2.length + " pages, " + out2.filter((r) => !r.ok).length + " with errors, " + out2.reduce((n, r) => n + r.warnings.length, 0) + " warnings)");
  } else if (args[0]){
    const r = await audit(args[0]);
    process.stdout.write(JSON.stringify(r, null, 2) + "\n");
  } else {
    console.error("usage: node audit.js <file.html> | node audit.js --out bugs.json <files...>");
    process.exit(2);
  }
}
if (require.main === module) main();
module.exports = { audit };