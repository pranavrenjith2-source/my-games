#!/usr/bin/env node
// Transcribes bill wurtz clips with whisper.cpp and builds a word-level timing index.
// Usage: node bw-align.js [maxDurationSeconds]
const fs = require('fs');
const path = require('path');
const cp = require('child_process');

const ROOT = __dirname;
const MODEL = path.join(ROOT, '.whisper', 'ggml-base.en.bin');
const WHISPER = '/opt/homebrew/bin/whisper-cli';
const CACHE = path.join(ROOT, '.whisper', 'cache');
const OUT = path.join(ROOT, 'billwurtz-words.json');
const MAXDUR = Number(process.argv[2] || 25);

fs.mkdirSync(CACHE, { recursive: true });

const songs = JSON.parse(fs.readFileSync(path.join(ROOT, 'billwurtz-songs.json'), 'utf8'));
const targets = songs.filter(s => s.dur <= MAXDUR);
console.log('clips to transcribe:', targets.length, '(<= ' + MAXDUR + 's of', songs.length + ')');

function sh(cmd){ return cp.execSync(cmd, { stdio: ['ignore','ignore','ignore'], maxBuffer: 1<<28 }); }
function slug(s){ return s.replace(/[^a-z0-9]+/gi, '_').slice(0, 80); }

function parseWords(jsonPath){
  const j = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  const out = [];
  (j.transcription || []).forEach(seg => {
    let cur = null;
    (seg.tokens || []).forEach(t => {
      const txt = t.text || '';
      if (/^\[_/.test(txt) || /^<\|/.test(txt)) return;
      const startsWord = /^\s/.test(txt) || cur === null;
      if (startsWord){
        if (cur && cur.w) out.push(cur);
        cur = { w: txt.trim(), s: t.offsets.from/1000, e: t.offsets.to/1000 };
      } else {
        cur.w += txt; cur.e = t.offsets.to/1000;
      }
    });
    if (cur && cur.w) out.push(cur);
  });
  return out
    .map(o => ({ w: o.w.toLowerCase().replace(/[^a-z']/g, ''), s: +o.s.toFixed(3), e: +o.e.toFixed(3) }))
    .filter(o => o.w && o.e - o.s >= 0.12)
    .reduce((acc, o) => {
      const prev = acc[acc.length - 1];
      if (prev && /^'/.test(o.w)){ prev.w += o.w; prev.e = o.e; }
      else acc.push(o);
      return acc;
    }, [])
    .map(o => ({ w: o.w.replace(/[^a-z']/g, ''), s: o.s, e: o.e }))
    .filter(o => o.w && o.e - o.s >= 0.12);
}

const result = [];
let done = 0;
for (const s of targets){
  const base = path.join(CACHE, slug(s.title));
  const jsonPath = base + '.json';
  try {
    if (!fs.existsSync(jsonPath)){
      const mp3 = base + '.mp3', wav = base + '.16k.wav';
      if (!fs.existsSync(mp3)) sh('curl -s -A "Mozilla/5.0" -o ' + JSON.stringify(mp3) + ' ' + JSON.stringify('https://billwurtz.com/' + s.file));
      if (!fs.existsSync(wav)) sh('afconvert -f WAVE -d LEI16@16000 -c 1 ' + JSON.stringify(mp3) + ' ' + JSON.stringify(wav));
      sh(WHISPER + ' -m ' + JSON.stringify(MODEL) + ' -f ' + JSON.stringify(wav) +
         ' -ml 1 -ojf -of ' + JSON.stringify(base) + ' --prompt ' + JSON.stringify(s.title));
      fs.unlinkSync(wav);
    }
    const words = parseWords(jsonPath);
    result.push({ file: s.file, title: s.title, dur: s.dur, words: words });
  } catch (e){
    result.push({ file: s.file, title: s.title, dur: s.dur, words: [], error: e.message });
  }
  done++;
  if (done % 10 === 0 || done === targets.length) process.stdout.write('\r  ' + done + '/' + targets.length + '  ');
}

result.sort((a,b) => a.title.localeCompare(b.title));
fs.writeFileSync(OUT, JSON.stringify(result));
const totalWords = result.reduce((n,r) => n + r.words.length, 0);
const uniq = new Set();
result.forEach(r => r.words.forEach(w => uniq.add(w.w)));
const empty = result.filter(r => !r.words.length).length;
console.log('\nwrote', OUT);
console.log('clips with words:', result.length - empty, '| empty:', empty, '| total words:', totalWords, '| unique words:', uniq.size);