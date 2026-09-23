#!/usr/bin/env node
// Generic headless smoke test for any single-file HTML game.
// Loads it in jsdom (with a stubbed canvas + rAF), runs for a bit,
// dispatches some input, and fails on any script error or blank page.
//
//   node smoke.js <file.html>
// exit 0 = OK, exit 1 = broken

const fs = require("fs");
const { JSDOM, VirtualConsole } = require("jsdom");

const file = process.argv[2];
if (!file) { console.error("usage: node smoke.js <file.html>"); process.exit(2); }

let html;
try { html = fs.readFileSync(file, "utf8"); } catch (e) { console.error("SMOKE: cannot read " + file); process.exit(1); }

const errors = [];
const vc = new VirtualConsole();
vc.on("jsdomError", (e) => { if (!/Could not parse CSS|Not implemented/.test(e.message)) errors.push("jsdomError: " + e.message); });
vc.on("error", (m) => { if (!/Not implemented|Could not parse CSS/.test(String(m))) errors.push("console.error: " + m); });

// Stub canvas 2D so canvas games don't crash in jsdom.
const prelude = `<script>(function(){
  function Ctx(el){ return new Proxy({}, {
    get:function(t,k){
      if(k==='canvas')return el;
      if(k in t)return t[k];
      if(k==='createLinearGradient'||k==='createRadialGradient'||k==='createPattern') return function(){ return { addColorStop:function(){} }; };
      if(k==='measureText') return function(){ return { width: 0 }; };
      if(k==='getImageData'||k==='createImageData') return function(){ return { data: new Uint8ClampedArray(4), width:1, height:1 }; };
      return function(){};
    },
    set:function(t,k,v){ t[k]=v; return true; }
  }); }
  try{ window.HTMLCanvasElement.prototype.getContext=function(){ if(!this.__ctx)this.__ctx=Ctx(this); return this.__ctx; }; }catch(e){}
  window.AudioContext=window.AudioContext||function(){ return { state:'running', currentTime:0, resume:function(){}, createOscillator:function(){return {frequency:{setValueAtTime:function(){},exponentialRampToValueAtTime:function(){}},connect:function(){},start:function(){},stop:function(){},type:''};}, createGain:function(){return {gain:{setValueAtTime:function(){},exponentialRampToValueAtTime:function(){},value:0},connect:function(){}};}, destination:{}, sampleRate:44100, createBuffer:function(){return {getChannelData:function(){return new Float32Array(1);}};}, createBufferSource:function(){return {connect:function(){},start:function(){},buffer:null};}, createBiquadFilter:function(){return {connect:function(){},frequency:{value:0},type:''};} }; };
  try{ if(!window.speechSynthesis) window.speechSynthesis={speak:function(){}}; }catch(e){}
  try{ if(!window.fetch) window.fetch=function(){ return Promise.reject(new Error('offline (smoke test)')); }; }catch(e){}
  try{ if(!window.matchMedia) window.matchMedia=function(){ return { matches:false, addListener:function(){}, removeListener:function(){}, addEventListener:function(){}, removeEventListener:function(){} }; }; }catch(e){}
  try{ if(!window.crypto) window.crypto={ getRandomValues:function(a){ for(var i=0;i<a.length;i++)a[i]=Math.floor(Math.random()*256); return a; }, randomUUID:function(){ return 'id-'+Math.random().toString(36).slice(2); } }; }catch(e){}
  try{ if(!window.CanvasRenderingContext2D) window.CanvasRenderingContext2D=function(){}; }catch(e){}
  try{ if(!window.Path2D) window.Path2D=function(){ return { addPath:function(){}, moveTo:function(){}, lineTo:function(){}, closePath:function(){}, arc:function(){}, rect:function(){} }; }; }catch(e){}
  try{ if(!window.ImageData) window.ImageData=function(){ return { data:new Uint8ClampedArray(4), width:1, height:1 }; }; }catch(e){}
  try{ if(!window.Image) window.Image=function(){ var s=this; s.src=''; s.width=1; s.height=1; s.addEventListener=function(){}; s.removeEventListener=function(){}; s.onload=null; s.onerror=null; }; }catch(e){}
  try{ if(!window.OffscreenCanvas) window.OffscreenCanvas=function(){ return { getContext:function(){ return null; }, width:1, height:1 }; }; }catch(e){}
})();</script>`;

let dom;
try {
  dom = new JSDOM(prelude + html, {
    runScripts: "dangerously",
    pretendToBeVisual: true,
    virtualConsole: vc,
    url: "http://localhost/"
  });
} catch (e) { console.error("SMOKE FAIL (load): " + e.message); process.exit(1); }

const w = dom.window;
const d = w.document;

function fire(type, target) {
  try {
    const el = target || d.body || d.documentElement;
    el.dispatchEvent(new w.MouseEvent(type, { bubbles: true, cancelable: true, clientX: 200, clientY: 150 }));
  } catch (e) { }
}
function key(code) { try { w.dispatchEvent(new w.KeyboardEvent("keydown", { key: code, code: code, bubbles: true })); w.dispatchEvent(new w.KeyboardEvent("keyup", { key: code, code: code, bubbles: true })); } catch (e) { } }

setTimeout(() => {
  try {
    fire("mousemove"); fire("mousedown"); fire("mouseup"); fire("click");
    ["ArrowRight", "ArrowLeft", "ArrowUp", " ", "Enter", "a", "d", "w"].forEach(key);
    fire("click");
  } catch (e) { errors.push("input: " + e.message); }

  setTimeout(() => {
    const text = (d.body ? d.body.textContent : "").replace(/\s+/g, " ").trim();
    const hasCanvas = !!d.querySelector("canvas");
    const interactive = d.querySelectorAll("button,input,a,[onclick],canvas").length;
    if (errors.length) {
      console.error("SMOKE FAIL (" + file + "):");
      errors.slice(0, 8).forEach((e) => console.error("  - " + e));
      process.exit(1);
    }
    if (!text && !hasCanvas) {
      console.error("SMOKE FAIL (" + file + "): page looks blank (no text, no canvas)");
      process.exit(1);
    }
    if (!text && !interactive) {
      console.error("SMOKE FAIL (" + file + "): nothing rendered/interactive");
      process.exit(1);
    }
    console.log("SMOKE OK (" + file + ")");
    process.exit(0);
  }, 1200);
}, 900);