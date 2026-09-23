#!/bin/bash
# Daily autonomous "content update" for gloop-escape.html.
# Backs up the game, asks an AI agent to ship one themed feature cluster,
# validates the result, and rolls back if the JavaScript no longer parses.

set -uo pipefail

GAME_DIR="/Users/pranav/dev"
GAME="$GAME_DIR/gloop-escape.html"
BASE="$GAME_DIR/.gloop-autoupdate"
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

# One update at a time.
if ! mkdir "$LOCK" 2>/dev/null; then exit 0; fi
trap 'rmdir "$LOCK" 2>/dev/null' EXIT

if [ ! -f "$GAME" ]; then
  echo "[$STAMP] game file missing: $GAME" >> "$LOG"
  exit 1
fi

hash_of() { shasum -a 256 "$1" 2>/dev/null | awk '{print $1}'; }

cp "$GAME" "$BACKUP/gloop-escape-$STAMP.html"
cp "$GAME" "$BACKUP/last-good.html"
HASH_BEFORE="$(hash_of "$GAME")"

THEMES="$(cat "$HISTORY" 2>/dev/null)"

# Pick the most-upvoted open request from the website's request terminal, if any.
TOP_ID=""
TOP_TEXT=""
if [ -f "$REQ_FILE" ]; then
  TOP_ID="$("$NODE" -e 'const fs=require("fs");try{const a=JSON.parse(fs.readFileSync(process.argv[1],"utf8"));const o=a.filter(r=>r.status!=="done").sort((x,y)=>((y.votes||0)-(x.votes||0))||((x.ts||0)-(y.ts||0)));if(o[0])process.stdout.write(String(o[0].id))}catch(e){}' "$REQ_FILE")"
  TOP_TEXT="$("$NODE" -e 'const fs=require("fs");try{const a=JSON.parse(fs.readFileSync(process.argv[1],"utf8"));const o=a.filter(r=>r.status!=="done").sort((x,y)=>((y.votes||0)-(x.votes||0))||((x.ts||0)-(y.ts||0)));if(o[0])process.stdout.write(String(o[0].text))}catch(e){}' "$REQ_FILE")"
fi
TOP_LINE=""
if [ -n "$TOP_TEXT" ]; then
  TOP_LINE="TOP USER REQUEST (from the website request terminal — implement THIS as the update): $TOP_TEXT"
else
  TOP_LINE="No user requests are pending; ship a themed update of your choice."
fi

make_prompt() {
cat <<EOF
You are the autonomous maintainer of a single-file HTML5 canvas platformer game at:
$GAME

Ship exactly ONE small, focused "Minecraft-style" themed update — a single named feature
cluster (e.g. "The Aquatic Update", "The Copper Update"). Keep it SMALL enough to finish.

$TOP_LINE

WORKFLOW (important):
- Do NOT read the whole file; it is large. Use grep to find the section you need, then read
  only a small window around it (grep -n 'function drawTile' file, then read ~80 lines).
- Make the change with the edit tool. You MUST edit $GAME at least once.
- Keep everything in the SAME single self-contained HTML file. No external files, no network.
- Do NOT remove, rename, or break existing features, levels, controls, or tile ids.
- Follow the existing code style (tile constants + LEGEND, LEVELS array, drawTile / drawEnemy /
  drawBossBody, update* functions, sfx/music helpers).
- After editing, verify the JS parses: extract the <script> contents to a temp .js file and run
  \`node --check\` on it; fix any errors.
- Finally append one line to $HISTORY in the format: <date> | <theme name> | <short summary>
- Work autonomously. Do not ask questions. Only touch $GAME and $HISTORY.

Pick ONE theme and do a coherent 2-4 edit cluster: a new power-up tile + pickup effect, a new
enemy type + behavior/visual, a new hazard, or a visual polish pass.

Update history (newest last):
$THEMES
EOF
}

FOCUSED_PROMPT="Make ONE small, concrete, additive improvement to $GAME (a single-file HTML5
canvas platformer): add one new power-up tile with its pickup effect, OR one new enemy type
with behavior and visuals, OR one new hazard. Use grep to find where to insert; do NOT read the
whole file. You MUST edit $GAME. Keep the JS valid (extract the <script> to a temp .js and run
node --check). Then append one line to $HISTORY: <date> | <theme name> | <short summary>.
Only touch $GAME and $HISTORY. Do not ask questions."

run_agent() {
  "$OPENCODE" run --auto --dir "$GAME_DIR" "$1" >> "$LOG" 2>&1
  echo $?
}

cd "$GAME_DIR" || exit 1
echo "[$STAMP] === starting update run ===" >> "$LOG"
AGENT_STATUS="$(run_agent "$(make_prompt)")"
HASH_AFTER="$(hash_of "$GAME")"

# If the agent produced no edits, retry once with a narrower instruction.
if [ "$HASH_BEFORE" = "$HASH_AFTER" ]; then
  echo "[$STAMP] agent made no edits; retrying with focused prompt" >> "$LOG"
  AGENT_STATUS="$(run_agent "$FOCUSED_PROMPT")"
  HASH_AFTER="$(hash_of "$GAME")"
fi

if [ "$HASH_BEFORE" = "$HASH_AFTER" ]; then
  echo "[$STAMP] FAILED: agent made no changes (agent exit $AGENT_STATUS)." >> "$LOG"
  exit 1
fi

VALID=1
"$NODE" - "$GAME" >> "$LOG" 2>&1 <<'NODE'
const fs = require('fs');
const file = process.argv[2];
const html = fs.readFileSync(file, 'utf8');
const m = html.match(/<script>([\s\S]*)<\/script>/);
if (!m) { console.error('VALIDATE: no <script> block found'); process.exit(1); }
try { new Function(m[1]); } catch (e) { console.error('VALIDATE: syntax error -> ' + e.message); process.exit(1); }
console.log('VALIDATE: syntax OK');
NODE
VALID=$?

if [ "$VALID" -ne 0 ]; then
  cp "$BACKUP/last-good.html" "$GAME"
  echo "[$STAMP] VALIDATION FAILED - rolled back to last-good. (agent exit $AGENT_STATUS)" >> "$LOG"
  exit 1
fi

cp "$GAME" "$BACKUP/last-good.html"
# Mark the request we just implemented as done.
if [ -n "$TOP_ID" ] && [ -f "$REQ_FILE" ]; then
  "$NODE" -e 'const fs=require("fs");const id=process.argv[1];const f=process.argv[2];try{const a=JSON.parse(fs.readFileSync(f,"utf8"));const r=a.filter(x=>x.id===id)[0];if(r){r.status="done";r.doneTs=Date.now();fs.writeFileSync(f,JSON.stringify(a,null,2));console.log("marked request done: "+id)}else{console.log("request id not found: "+id)}}catch(e){console.error("mark done failed: "+e.message)}' "$TOP_ID" "$REQ_FILE" >> "$LOG" 2>&1
fi
echo "[$STAMP] update OK (agent exit $AGENT_STATUS)" >> "$LOG"
exit 0