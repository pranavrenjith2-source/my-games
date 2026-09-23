#!/bin/bash
# Daily Drop — generates ONE major single-file game OR utility per day.
# Validates it (headless smoke test); only records it if it works.
# Usage: daily-drop.sh [game|utility]   (default: alternates by day)

set -uo pipefail
ROOT="/Users/pranav/dev"
DROPS="$ROOT/drops"
BASE="$ROOT/.game-forge"
TOOLS="$ROOT/game-tools"
GAMES="$BASE/daily-games.txt"
UTILS="$BASE/daily-utilities.txt"
DAILY="$ROOT/drops.json"
LOGDIR="$BASE/logs"
OPENCODE="/opt/homebrew/bin/opencode"
NODE="/opt/homebrew/bin/node"
export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin"

mkdir -p "$DROPS" "$LOGDIR" "$BASE" || exit 1
STAMP="$(date +%Y%m%d-%H%M%S)"
LOG="$LOGDIR/daily-$STAMP.log"
DATE="$(date +%Y-%m-%d)"

LOCK="$BASE/.dailylock"
if ! mkdir "$LOCK" 2>/dev/null; then exit 0; fi
trap 'rmdir "$LOCK" 2>/dev/null' EXIT

if [ ! -f "$GAMES" ]; then
cat > "$GAMES" <<'EOF'
a full platformer with 15+ handcrafted levels, checkpoints and a final boss
a roguelike dungeon crawler with random floors, items, and permadeath
a city builder with zoning, money, population and disasters
a 2D physics sandbox where you build vehicles and machines
a space exploration game with planets, fuel, upgrades and discoveries
a tower defense with a tech tree, many enemy types and endless waves
a farming sim with seasons, crops, animals and a market
a rhythm game that generates its own charts and judges your timing
a card battler against AI opponents with deckbuilding
a battle royale against 20 bots on a shrinking map
a puzzle game with 30 handcrafted levels and a level editor
a metroidvania-lite with abilities, secrets and a map
a top-down racing game with several tracks and AI racers
a tycoon game (theme park) with rides, guests and finances
a survival game with crafting, hunger and day/night
a turn-based tactics game on a grid with unit classes
a detective game where you solve cases from clues
a monster-catching RPG with battles, types and evolution
a factory automation game with belts, machines and goals
a god-game sandbox with terrain, followers and miracles
EOF
fi
if [ ! -f "$UTILS" ]; then
cat > "$UTILS" <<'EOF'
a markdown editor with live preview, autosave and export
a color palette generator with accessibility contrast checks
a unit + currency converter that works fully offline
a password generator and strength analyzer
a regex tester with live match highlighting
a JSON formatter, validator and tree explorer
a side-by-side text diff tool
a cron expression explainer with next-run times
a subnet / IP calculator
a Pomodoro timer with session statistics
a habit tracker stored locally with streaks
a note-taking app with tags and search
an image to ASCII art converter
an offline QR code generator drawn on canvas
a base64 / URL / hash encoder-decoder
a world clock across many timezones
a CSS gradient and box-shadow playground with copyable code
a kanban board stored locally with drag and drop
a typing speed test with accuracy and history
a stopwatch / lap timer with keyboard shortcuts
EOF
fi

KIND="${1:-}"
if [ -z "$KIND" ]; then
  DOY="$(date +%j)"
  if (( 10#$DOY % 2 == 0 )); then KIND="game"; else KIND="utility"; fi
fi

if [ "$KIND" = "utility" ]; then
  SRC="$UTILS"; USED="$BASE/daily-used-utilities.txt"; NOUN="utility"
else
  SRC="$GAMES"; USED="$BASE/daily-used-games.txt"; NOUN="game"
fi

CONCEPT="$(comm -23 <(sort "$SRC") <(sort "$USED" 2>/dev/null) | head -1)"
if [ -z "$CONCEPT" ]; then CONCEPT="$(sort -R "$SRC" | head -1)"; : > "$USED"; fi

SLUG="$(printf '%s' "$CONCEPT" | tr 'A-Z' 'a-z' | tr -cs 'a-z0-9' '-' | sed 's/^-//; s/-$//' | cut -c1-40)"
[ -z "$SLUG" ] && SLUG="drop-$STAMP"
OUT="$DROPS/$DATE-$SLUG.html"
REL="drops/$DATE-$SLUG.html"

PROMPT_FILE="$BASE/.daily-prompt.txt"
cat > "$PROMPT_FILE" <<EOF
Create ONE self-contained single-file HTML $NOUN at EXACTLY this path: $OUT

Concept: $CONCEPT

Make it feel like a major release: multiple levels or modes (or real progression),
a title screen, a clear goal / score, and polished visuals with satisfying feedback.
Aim for something someone would happily play for 10+ minutes.

Rules:
- ONE .html file. Everything inline (HTML, CSS, JS). No network, no external files, no CDN.
- Works offline. Must run with ZERO console errors.
- Mouse and/or keyboard input.
- Sound is optional and must be guarded: create the AudioContext lazily on the first user
  gesture, resume() it, and only play once running (ctx.resume().then(play)).
- Verify the JavaScript parses before finishing. Do not create any other file.
EOF
PROMPT="$(cat "$PROMPT_FILE")"

cd "$DROPS" || exit 1
echo "[$STAMP] === daily drop ($KIND): $CONCEPT ===" >> "$LOG"
"$ROOT/forge-run.sh" "$DROPS" "$LOG" "$PROMPT_FILE" "$OUT"
STATUS=$?

if [ ! -f "$OUT" ]; then
  echo "[$STAMP] FAILED: no file produced (agent exit $STATUS)" >> "$LOG"
  exit 1
fi

"$NODE" "$TOOLS/smoke.js" "$OUT" >> "$LOG" 2>&1
if [ $? -ne 0 ]; then
  echo "[$STAMP] FAILED smoke test; removing" >> "$LOG"
  rm -f "$OUT"
  exit 1
fi

echo "$CONCEPT" >> "$USED"
TITLE="$(printf '%s' "$CONCEPT" | "$NODE" -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{process.stdout.write(s.trim().replace(/\b\w/g,function(c){return c.toUpperCase()}))})')"
"$NODE" -e '
  var fs=require("fs"), p=process.argv[1], o=[];
  try { o=JSON.parse(fs.readFileSync(p,"utf8")); } catch(e){}
  o.unshift({ date: process.argv[2], file: process.argv[3], title: process.argv[4], kind: process.argv[5], description: process.argv[6] });
  fs.writeFileSync(p, JSON.stringify(o, null, 2));
' "$DAILY" "$DATE" "$REL" "$TITLE" "$KIND" "$CONCEPT" >> "$LOG" 2>&1

echo "[$STAMP] dropped $REL ($KIND: $CONCEPT)" >> "$LOG"
exit 0