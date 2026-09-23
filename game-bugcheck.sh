#!/bin/bash
# Game Forge — bug sweep. Runs a headless smoke test on every generated game
# and records which ones are broken (so the updater can fix them).

set -uo pipefail
GAMES_DIR="/Users/pranav/dev/games"
TOOLS="/Users/pranav/dev/game-tools"
BASE="/Users/pranav/dev/.game-forge"
LOG="$BASE/bugcheck.log"
FLAG="$BASE/flagged.txt"
LOCK="$BASE/.checklock"
NODE="/opt/homebrew/bin/node"
export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin"

mkdir -p "$BASE" "$GAMES_DIR" || exit 1
if ! mkdir "$LOCK" 2>/dev/null; then exit 0; fi
trap 'rmdir "$LOCK" 2>/dev/null' EXIT

: > "$FLAG.tmp"
total=0; bad=0
MANIFEST="$BASE/manifest.txt"
# Only check games the forge created (never the dev's uploads).
if [ -f "$MANIFEST" ]; then
  while IFS= read -r name; do
    [ -n "$name" ] || continue
    f="$GAMES_DIR/$name"
    [ -f "$f" ] || continue
    total=$((total + 1))
    if ! "$NODE" "$TOOLS/smoke.js" "$f" >/dev/null 2>&1; then
      bad=$((bad + 1))
      echo "$name" >> "$FLAG.tmp"
      echo "$(date '+%F %T') FAIL $name" >> "$LOG"
    fi
  done < "$MANIFEST"
fi
mv "$FLAG.tmp" "$FLAG"
echo "$(date '+%F %T') checked $total games, flagged $bad" >> "$LOG"

# keep the log from growing forever
if [ "$(wc -l < "$LOG" 2>/dev/null || echo 0)" -gt 800 ]; then tail -300 "$LOG" > "$LOG.tmp" && mv "$LOG.tmp" "$LOG"; fi
exit 0