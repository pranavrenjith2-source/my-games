#!/bin/bash
# Site bug fixer — takes ONE failing page from bugs.json, asks the agent to fix
# the reported bugs, re-audits it, and rolls back if it's still broken.
# Never touches uploaded games or the raw template.

set -uo pipefail
ROOT="/Users/pranav/dev"
TOOLS="$ROOT/game-tools"
BASE="$ROOT/.game-forge"
BACKUP="$BASE/backups"
LOG="$BASE/sitefix.log"
HISTORY="$BASE/history.txt"
BUGS="$ROOT/bugs.json"
LOCK="$BASE/.sitefixlock"
OPENCODE="/opt/homebrew/bin/opencode"
NODE="/opt/homebrew/bin/node"
export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin"

mkdir -p "$BACKUP" "$BASE" || exit 1
if ! mkdir "$LOCK" 2>/dev/null; then exit 0; fi
trap 'rmdir "$LOCK" 2>/dev/null' EXIT
STAMP="$(date +%Y%m%d-%H%M%S)"

[ -f "$BUGS" ] || exit 0

# pick the first fixable failing page (skip uploads + template)
TARGET="$("$NODE" -e '
  var fs=require("fs");
  var b=[]; try { b=JSON.parse(fs.readFileSync(process.argv[1],"utf8")); } catch(e){}
  // only forge-created games are fixable; uploads are never touched
  var forge=new Set();
  try { fs.readFileSync(process.argv[2],"utf8").split("\n").forEach(function(n){ if(n.trim()) forge.add("games/"+n.trim()); }); } catch(e){}
  var skip=/^game_template\.html$/;
  function fixable(file){
    if(skip.test(file)) return false;
    if(file.indexOf("games/") === 0) return forge.has(file);
    return true;
  }
  var hit=b.filter(function(r){ return !r.ok && fixable(r.file); })[0];
  if(hit) process.stdout.write(hit.file);
' "$BUGS" "$BASE/manifest.txt")"

[ -z "$TARGET" ] && exit 0
FILE="$ROOT/$TARGET"
[ -f "$FILE" ] || exit 0
cp "$FILE" "$BACKUP/$(basename "$TARGET").$STAMP.bak"

ISSUES="$("$NODE" -e '
  var fs=require("fs"), b=[];
  try { b=JSON.parse(fs.readFileSync(process.argv[1],"utf8")); } catch(e){}
  var r=b.filter(function(x){ return x.file===process.argv[2]; })[0];
  process.stdout.write(r ? r.errors.concat(r.warnings).slice(0,10).join("; ") : "");
' "$BUGS" "$TARGET")"

PROMPT_FILE="$BASE/.sitefix-prompt.txt"
cat > "$PROMPT_FILE" <<EOF
The single-file HTML page at $FILE has bugs that a real user would hit. Fix them.

Reported problems:
$ISSUES

Requirements:
- Fix the actual causes so the page runs with NO errors, without changing its purpose or look.
- Keep it a single self-contained .html file (no external resources, no network, no CDN).
- Do not remove features; make them work.
- Verify the JavaScript parses. Only edit $FILE.
EOF

cd "$ROOT" || exit 1
echo "[$STAMP] === fixing $TARGET ===" >> "$LOG"
echo "    issues: $ISSUES" >> "$LOG"
"$OPENCODE" run --auto --dir "$ROOT" "$(cat "$PROMPT_FILE")" >> "$LOG" 2>&1

# re-audit just this page
"$NODE" "$TOOLS/audit.js" "$TARGET" > "$BASE/.reaudit.json" 2>>"$LOG"
if "$NODE" -e 'var r=require(process.argv[1]); process.exit(r.ok?0:1);' "$BASE/.reaudit.json"; then
  echo "$(date '+%Y-%m-%d %H:%M') | $TARGET | bug fix" >> "$HISTORY"
  echo "[$STAMP] fixed $TARGET" >> "$LOG"
else
  cp "$BACKUP/$(basename "$TARGET").$STAMP.bak" "$FILE"
  echo "[$STAMP] FAILED validation - rolled back $TARGET" >> "$LOG"
fi

if [ "$(wc -l < "$LOG" 2>/dev/null || echo 0)" -gt 800 ]; then tail -300 "$LOG" > "$LOG.tmp" && mv "$LOG.tmp" "$LOG"; fi
exit 0