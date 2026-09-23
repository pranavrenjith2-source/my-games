#!/bin/bash
# Game Forge — generates ONE brand-new neal.fun-style single-file game.
# Validates it (headless smoke test); removes it if broken.

set -uo pipefail
GAMES_DIR="/Users/pranav/dev/games"
TOOLS="/Users/pranav/dev/game-tools"
BASE="/Users/pranav/dev/.game-forge"
LOGDIR="$BASE/logs"
HISTORY="$BASE/history.txt"
USED="$BASE/used-concepts.txt"
CONCEPTS="$BASE/concepts.txt"
LOCK="$BASE/.genlock"
OPENCODE="/opt/homebrew/bin/opencode"
NODE="/opt/homebrew/bin/node"
export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin"

mkdir -p "$GAMES_DIR" "$LOGDIR" "$BASE" || exit 1
STAMP="$(date +%Y%m%d-%H%M%S)"
LOG="$LOGDIR/gen-$STAMP.log"

if ! mkdir "$LOCK" 2>/dev/null; then exit 0; fi
trap 'rmdir "$LOCK" 2>/dev/null' EXIT

if [ ! -f "$CONCEPTS" ]; then
cat > "$CONCEPTS" <<'EOF'
a slider that shows the real size of things compared to a human
spend a million dollars on absurd items before it runs out
keep a secret for as long as you can
simulate a plant growing over 100 years
a button that does something different every time you press it
guess the country from its outline
balance a spinning plate for as long as possible
an endless runner where you are a raindrop
type the alphabet as fast as possible
a petri dish where bacteria evolve on their own
a mini stock market you can crash
a gravity sandbox where you throw planets around
a fake daily horoscope generator with constellations
stack blocks as high as you can
a choose-your-own-adventure that lasts 30 seconds
a one-key rhythm game
a maze that rearranges itself every few seconds
a food-chain ecosystem you feed
a password strength meter that judges you harshly
a rubber-band physics toy
a pixel-art painter with 8 colors
guess the year of invented historical events
a cookie clicker but for stars
a minimalist tower defense on a grid
a screensaver that reacts to your mouse
a language generator that invents words
a time-lapse of a city growing
a shadow puppet theater
a stock ticker of fake companies
bubble wrap that never runs out
EOF
fi

# pick an unused concept, else reset and pick at random
CONCEPT="$(comm -23 <(sort "$CONCEPTS") <(sort "$USED" 2>/dev/null) | head -1)"
if [ -z "$CONCEPT" ]; then CONCEPT="$(sort -R "$CONCEPTS" | head -1)"; : > "$USED"; fi
SLUG="$(printf '%s' "$CONCEPT" | tr 'A-Z' 'a-z' | tr -cs 'a-z0-9' '-' | sed 's/^-//; s/-$//' | cut -c1-38)"
[ -z "$SLUG" ] && SLUG="game-$STAMP"
OUT="$GAMES_DIR/$SLUG.html"

PROMPT="$(cat <<EOF
Create ONE brand-new single-file HTML game/toy in the style of neal.fun (clever, playful,
instantly understandable, fun within 30 seconds).

CONCEPT: $CONCEPT

Write it to EXACTLY this path: $OUT

Hard rules:
- ONE self-contained .html file. No external files, no network, no CDN, no images by URL.
- Everything inline: HTML, CSS, JS. Canvas or DOM is fine. Sound optional (guarded).
- Include a clear title and a one-line "how to play".
- Mouse and/or keyboard input. Works offline. No build step.
- If you add sound: browsers start the AudioContext SUSPENDED until a user gesture.
  Create it lazily and call resume() on the first pointerdown/keydown, and when playing
  a sound if the context is suspended do `ctx.resume().then(play)` (never fire a beep
  while suspended or it is silent). Sound must be optional and fully guarded.
- Keep it polished and bug-free: it must run without any console errors.
- Verify the JavaScript parses before finishing.
- Do NOT create or modify any other file. Only $OUT.
EOF
)"

cd "$GAMES_DIR" || exit 1
echo "[$STAMP] === generating: $CONCEPT ===" >> "$LOG"
printf '%s' "$PROMPT" > "$BASE/.hourly-prompt.txt"
/Users/pranav/dev/forge-run.sh "$GAMES_DIR" "$LOG" "$BASE/.hourly-prompt.txt" "$OUT"
STATUS=$?

if [ ! -f "$OUT" ]; then
  echo "[$STAMP] FAILED: no file produced (agent exit $STATUS)" >> "$LOG"
  exit 1
fi

"$NODE" "$TOOLS/smoke.js" "$OUT" >> "$LOG" 2>&1
if [ $? -ne 0 ]; then
  echo "[$STAMP] FAILED smoke test; removing $SLUG.html" >> "$LOG"
  rm -f "$OUT"
  exit 1
fi

echo "$CONCEPT" >> "$USED"
echo "$SLUG.html" >> "$BASE/manifest.txt"
TITLE="$(printf '%s' "$CONCEPT" | /opt/homebrew/bin/node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{process.stdout.write(s.trim().replace(/\b\w/g,function(c){return c.toUpperCase();}))})')"
"$NODE" -e 'var fs=require("fs");var file=process.argv[1],title=process.argv[2],desc=process.argv[3],p=process.argv[4];var o={};try{o=JSON.parse(fs.readFileSync(p,"utf8"));}catch(e){}o[file]={title:title,description:desc};fs.writeFileSync(p,JSON.stringify(o,null,2));' "$SLUG.html" "$TITLE" "$CONCEPT" "$BASE/descriptions.json" >> "$LOG" 2>&1
echo "$(date '+%Y-%m-%d %H:%M') | $SLUG | $CONCEPT" >> "$HISTORY"
echo "[$STAMP] created $SLUG.html ($CONCEPT)" >> "$LOG"
exit 0