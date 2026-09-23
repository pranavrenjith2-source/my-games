#!/bin/bash
# Daily autonomous "content update" for bot-arena.html.
# Backs up the game, asks an AI agent to ship one focused feature,
# validates the JS parses AND passes a headless smoke test, then rolls
# back if anything is broken. Reads the website's request terminal.

set -uo pipefail

GAME_DIR="/Users/pranav/dev"
GAME="$GAME_DIR/bot-arena.html"
SMOKE="$GAME_DIR/bot-arena-smoke.js"
BASE="$GAME_DIR/.bot-arena-autoupdate"
LOGDIR="$BASE/logs"
BACKUP="$BASE/backups"
HISTORY="$BASE/history.txt"
REQ_FILE="$GAME_DIR/requests.json"
LOCK="$BASE/.lock"
OPENCODE="/opt/homebrew/bin/opencode"
NODE="/opt/homebrew/bin/node"
export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin"

mkdir -p "$LOGDIR" "$BACKUP" || exit 1
STAMP="$(date +%Y%m%d-%H%M%S)"
LOG="$LOGDIR/update-$STAMP.log"

if ! mkdir "$LOCK" 2>/dev/null; then exit 0; fi
trap 'rmdir "$LOCK" 2>/dev/null' EXIT

if [ ! -f "$GAME" ]; then
  echo "[$STAMP] game file missing: $GAME" >> "$LOG"
  exit 1
fi

hash_of() { shasum -a 256 "$1" 2>/dev/null | awk '{print $1}'; }

cp "$GAME" "$BACKUP/bot-arena-$STAMP.html"
cp "$GAME" "$BACKUP/last-good.html"
HASH_BEFORE="$(hash_of "$GAME")"

THEMES="$(cat "$HISTORY" 2>/dev/null)"

# Top open request aimed at Bot Arena (or a general new-game request).
TOP_ID=""
TOP_TEXT=""
if [ -f "$REQ_FILE" ]; then
  TOP_ID="$("$NODE" -e 'const fs=require("fs");try{const a=JSON.parse(fs.readFileSync(process.argv[1],"utf8"));const o=a.filter(r=>r.status!=="done"&&/bot arena|other \/ new game/i.test(r.game||"")).sort((x,y)=>((y.votes||0)-(x.votes||0))||((x.ts||0)-(y.ts||0)));if(o[0])process.stdout.write(String(o[0].id))}catch(e){}' "$REQ_FILE")"
  TOP_TEXT="$("$NODE" -e 'const fs=require("fs");try{const a=JSON.parse(fs.readFileSync(process.argv[1],"utf8"));const o=a.filter(r=>r.status!=="done"&&/bot arena|other \/ new game/i.test(r.game||"")).sort((x,y)=>((y.votes||0)-(x.votes||0))||((x.ts||0)-(y.ts||0)));if(o[0])process.stdout.write(String(o[0].text))}catch(e){}' "$REQ_FILE")"
fi
TOP_LINE="No user requests are pending; ship a feature of your choice."

if [ -n "$TOP_TEXT" ]; then
  TOP_LINE="TOP USER REQUEST (implement THIS): $TOP_TEXT"
fi

make_prompt() {
cat <<EOF
You are the autonomous maintainer of a single-file HTML5 canvas game at:
$GAME

Bot Arena is a fighting game whose bots evolve: they mutate their genome, write
their own AI "brains" as real JavaScript, code their own spells from scratch,
morph into custom body forms, and run inside a SANDBOXED interpreter. There is a
social feed, a WARDEN mod bot that only stops world-destroying rogues, an
OVERCLOCK faction that raises the stakes, and ranked human-vs-bot play.

Ship exactly ONE small, focused, additive improvement.

$TOP_LINE

HARD RULES (must not break):
- Keep it a SINGLE self-contained HTML file. No external files, no network, no build.
- Keep the sandbox SAFE: the interpreter must never expose host globals, must keep
  blocked properties (constructor/prototype/__proto__/call/apply/bind) blocked, and
  must keep its step budget. Do NOT use eval/Function on bot code.
- Keep every existing screen working (home, fight, spectate, social, code, roster, ranked).
- Do NOT remove existing features. Changes must be additive or safe refactors.
- Do NOT let evolved code grow unbounded (keep the mutation size caps).

WORKFLOW:
- Do NOT read the whole file. Use grep to find the section, then read a small window.
- Make the change with the edit tool. You MUST edit $GAME at least once.
- After editing, verify the JS parses: extract the <script> to a temp .js and run \`node --check\`.
- Then run the smoke test: \`node $SMOKE $GAME\` (must print SMOKE OK). Fix any failure.
- Finally append one line to $HISTORY: <date> | <feature name> | <short summary>
- Work autonomously. Do not ask questions. Only touch $GAME and $HISTORY.

Ideas (pick ONE cluster): a new morph form with unique visuals, a new spell
primitive (e.g. summon/homing/gravity), a new bot behaviour or ecosystem event,
a new social/spectator feature, better fighter graphics/particles, or a new tab.

Update history (newest last):
$THEMES
EOF
}

FOCUSED_PROMPT="Make ONE small, concrete, additive improvement to $GAME (a single-file
HTML5 canvas fighting game with a SANDBOXED JS interpreter for bot AI). Examples: add a new
bot morph form with visuals, add a new spell primitive to the spell.* API, add a new bot
behaviour, or polish the graphics. Use grep to find where to insert; do NOT read the whole
file. You MUST edit $GAME. Keep the sandbox safe (no host access, keep step budgets, keep
blocked properties blocked). Verify: extract the <script> to a temp .js and run node --check,
then run: node $SMOKE $GAME  (must print SMOKE OK). Append one line to $HISTORY:
<date> | <feature name> | <short summary>. Only touch $GAME and $HISTORY. Do not ask questions."

run_agent() {
  "$OPENCODE" run --auto --dir "$GAME_DIR" "$1" >> "$LOG" 2>&1
  echo $?
}

cd "$GAME_DIR" || exit 1
echo "[$STAMP] === starting Bot Arena update run ===" >> "$LOG"
AGENT_STATUS="$(run_agent "$(make_prompt)")"
HASH_AFTER="$(hash_of "$GAME")"

if [ "$HASH_BEFORE" = "$HASH_AFTER" ]; then
  echo "[$STAMP] agent made no edits; retrying with focused prompt" >> "$LOG"
  AGENT_STATUS="$(run_agent "$FOCUSED_PROMPT")"
  HASH_AFTER="$(hash_of "$GAME")"
fi

if [ "$HASH_BEFORE" = "$HASH_AFTER" ]; then
  echo "[$STAMP] FAILED: agent made no changes (agent exit $AGENT_STATUS)." >> "$LOG"
  exit 1
fi

# 1) JS syntax
VALID=1
"$NODE" - "$GAME" >> "$LOG" 2>&1 <<'NODE'
const fs = require('fs');
const html = fs.readFileSync(process.argv[2], 'utf8');
const m = html.match(/<script>([\s\S]*)<\/script>/);
if (!m) { console.error('VALIDATE: no <script> block'); process.exit(1); }
try { new Function(m[1]); } catch (e) { console.error('VALIDATE: syntax error -> ' + e.message); process.exit(1); }
console.log('VALIDATE: syntax OK');
NODE
VALID=$?

# 2) runtime smoke test
SMOKE_OK=1
if [ "$VALID" -eq 0 ] && [ -f "$SMOKE" ]; then
  "$NODE" "$SMOKE" "$GAME" >> "$LOG" 2>&1
  SMOKE_OK=$?
fi

if [ "$VALID" -ne 0 ] || [ "$SMOKE_OK" -ne 0 ]; then
  cp "$BACKUP/last-good.html" "$GAME"
  echo "[$STAMP] VALIDATION FAILED (syntax=$VALID smoke=$SMOKE_OK) - rolled back to last-good." >> "$LOG"
  exit 1
fi

cp "$GAME" "$BACKUP/last-good.html"
if [ -n "$TOP_ID" ] && [ -f "$REQ_FILE" ]; then
  "$NODE" -e 'const fs=require("fs");const id=process.argv[1];const f=process.argv[2];try{const a=JSON.parse(fs.readFileSync(f,"utf8"));const r=a.filter(x=>x.id===id)[0];if(r){r.status="done";r.doneTs=Date.now();fs.writeFileSync(f,JSON.stringify(a,null,2));console.log("marked request done: "+id)}}catch(e){console.error("mark done failed: "+e.message)}' "$TOP_ID" "$REQ_FILE" >> "$LOG" 2>&1
fi
echo "[$STAMP] update OK (agent exit $AGENT_STATUS)" >> "$LOG"
exit 0