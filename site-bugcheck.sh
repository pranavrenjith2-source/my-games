#!/bin/bash
# Site bug sweep — audits every page the site owns for bugs a user would hit
# (script errors, runtime exceptions, broken ids/links, dead interactions)
# and writes bugs.json for the site's BUG REPORT panel.
#
# Uploaded games are NEVER audited: only games listed in the forge manifest are.

set -uo pipefail
ROOT="/Users/pranav/dev"
TOOLS="$ROOT/game-tools"
BASE="$ROOT/.game-forge"
MANIFEST="$BASE/manifest.txt"
OUT="$ROOT/bugs.json"
LOG="$BASE/bugcheck.log"
LOCK="$BASE/.sitechecklock"
NODE="/opt/homebrew/bin/node"
export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin"

mkdir -p "$BASE" || exit 1
if ! mkdir "$LOCK" 2>/dev/null; then exit 0; fi
trap 'rmdir "$LOCK" 2>/dev/null' EXIT

cd "$ROOT" || exit 1

FILES=()
# site's own pages (skip the raw template)
for f in *.html; do
  [ -f "$f" ] || continue
  [ "$f" = "game_template.html" ] && continue
  FILES+=("$f")
done
# daily drops
for f in drops/*.html; do
  [ -f "$f" ] && FILES+=("$f")
done
# forge-created games ONLY (uploads are deliberately excluded)
if [ -f "$MANIFEST" ]; then
  while IFS= read -r name; do
    [ -n "$name" ] || continue
    [ -f "games/$name" ] && FILES+=("games/$name")
  done < "$MANIFEST"
fi

[ ${#FILES[@]} -eq 0 ] && exit 0

STAMP="$(date '+%F %T')"
echo "[$STAMP] auditing ${#FILES[@]} pages" >> "$LOG"
printf '%s\n' "${FILES[@]}" | xargs "$NODE" "$TOOLS/audit.js" --out "$OUT" >> "$LOG" 2>&1

"$NODE" -e '
  var fs=require("fs"), b=[];
  try { b=JSON.parse(fs.readFileSync(process.argv[1],"utf8")); } catch(e){}
  var bad=b.filter(function(r){ return !r.ok; });
  console.log("pages="+b.length+" healthy="+(b.length-bad.length)+" failing="+bad.length);
  bad.forEach(function(r){ console.log("FAIL "+r.file+" :: "+r.errors.slice(0,2).join(" | ")); });
' "$OUT" >> "$LOG" 2>&1

if [ "$(wc -l < "$LOG" 2>/dev/null || echo 0)" -gt 800 ]; then tail -300 "$LOG" > "$LOG.tmp" && mv "$LOG.tmp" "$LOG"; fi

# refresh the single-file hub's offline snapshot so it stays current
"$NODE" "$ROOT/hub-build.js" >> "$LOG" 2>&1
exit 0