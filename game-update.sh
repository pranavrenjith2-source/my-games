#!/bin/bash
# Game Forge — periodic update. Fixes a flagged/broken game, or improves one
# (new mode / level / feature). Rolls back if the result fails validation.

set -uo pipefail
ROOT="/Users/pranav/dev"
GAMES_DIR="/Users/pranav/dev/games"
TOOLS="/Users/pranav/dev/game-tools"
BASE="/Users/pranav/dev/.game-forge"
BACKUP="$BASE/backups"
HISTORY="$BASE/history.txt"
FLAG="$BASE/flagged.txt"
ROTATE="$BASE/rotate.txt"
LOG="$BASE/update.log"
LOCK="$BASE/.updatelock"
OPENCODE="/opt/homebrew/bin/opencode"
NODE="/opt/homebrew/bin/node"
export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin"

mkdir -p "$GAMES_DIR" "$BACKUP" "$BASE" || exit 1
STAMP="$(date +%Y%m%d-%H%M%S)"
if ! mkdir "$LOCK" 2>/dev/null; then exit 0; fi
trap 'rmdir "$LOCK" 2>/dev/null' EXIT

# target: a flagged (broken) forge game first, else round-robin over forge games.
# Never touches uploaded games — only names listed in the forge manifest.
TARGET=""
if [ -s "$FLAG" ] && [ -f "$BASE/manifest.txt" ]; then
  while IFS= read -r name; do
    [ -n "$name" ] || continue
    if [ -f "$GAMES_DIR/$name" ] && grep -qx "$name" "$BASE/manifest.txt"; then TARGET="$name"; FIXING=1; break; fi
  done < "$FLAG"
fi
if [ -z "$TARGET" ] && [ -f "$BASE/manifest.txt" ]; then
  FIXING=0
  while IFS= read -r name; do
    [ -n "$name" ] || continue
    if [ -f "$GAMES_DIR/$name" ]; then TARGET="$name"; break; fi
  done < "$BASE/manifest.txt"
  if [ -n "$TARGET" ]; then
    grep -v -x "$TARGET" "$BASE/manifest.txt" > "$BASE/manifest.txt.tmp" 2>/dev/null
    echo "$TARGET" >> "$BASE/manifest.txt.tmp"
    mv "$BASE/manifest.txt.tmp" "$BASE/manifest.txt"
  fi
fi
[ -z "$TARGET" ] && exit 0
GAME="$GAMES_DIR/$TARGET"
cp "$GAME" "$BACKUP/$TARGET.$STAMP.bak"

if [ "$FIXING" = "1" ]; then
  PROMPT="The single-file HTML game at $GAME is currently BROKEN (it throws errors when run). Fix it so it runs cleanly with no console errors, preserving its concept and look. Keep it a single self-contained .html file (no external resources, no network). Verify the JavaScript parses. Only edit $GAME."
else
  PROMPT="Improve the single-file HTML game at $GAME (in the style of neal.fun). Add exactly ONE meaningful upgrade: a new game mode, a new level/wave, a new mechanic, or a polish pass (better visuals/juice). Keep the existing gameplay working. Keep it a single self-contained .html file (no external resources, no network). Verify the JavaScript parses. Only edit $GAME."
fi

cd "$GAMES_DIR" || exit 1
echo "[$STAMP] === updating $TARGET (fixing=$FIXING) ===" >> "$LOG"
printf '%s' "$PROMPT" > "$BASE/.update-prompt.txt"
"$ROOT/forge-run.sh" "$GAMES_DIR" "$LOG" "$BASE/.update-prompt.txt" "$GAME"

"$NODE" "$TOOLS/smoke.js" "$GAME" >> "$LOG" 2>&1
if [ $? -ne 0 ]; then
  cp "$BACKUP/$TARGET.$STAMP.bak" "$GAME"
  echo "[$STAMP] FAILED validation - rolled back $TARGET" >> "$LOG"
  exit 1
fi

# clear it from the flagged list if it was there
if [ -f "$FLAG" ]; then grep -v -x "$TARGET" "$FLAG" > "$FLAG.tmp" 2>/dev/null; mv "$FLAG.tmp" "$FLAG" 2>/dev/null || true; fi
echo "$(date '+%Y-%m-%d %H:%M') | $TARGET | $([ "$FIXING" = 1 ] && echo 'bug fix' || echo 'update')" >> "$HISTORY"
echo "[$STAMP] updated $TARGET" >> "$LOG"

if [ "$(wc -l < "$LOG" 2>/dev/null || echo 0)" -gt 800 ]; then tail -300 "$LOG" > "$LOG.tmp" && mv "$LOG.tmp" "$LOG"; fi
exit 0