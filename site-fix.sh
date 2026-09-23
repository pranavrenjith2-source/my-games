#!/bin/bash
# Site bug fixer — takes failing pages from bugs.json, has the agent fix each one,
# re-audits it, and rolls back any page that is still broken. Then refreshes the
# report and (if this is a git repo) publishes the fixes.
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
NODE="/opt/homebrew/bin/node"
FORGE_RUN="$ROOT/forge-run.sh"
MAX="${SITE_FIX_MAX:-3}"
export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin"

mkdir -p "$BACKUP" "$BASE" || exit 1
if ! mkdir "$LOCK" 2>/dev/null; then exit 0; fi
trap 'rmdir "$LOCK" 2>/dev/null' EXIT
STAMP="$(date +%Y%m%d-%H%M%S)"

[ -f "$BUGS" ] || exit 0

# fixable failing pages (skip uploads + template), capped
TARGETS="$("$NODE" -e '
  var fs=require("fs");
  var b=[]; try { b=JSON.parse(fs.readFileSync(process.argv[1],"utf8")); } catch(e){}
  var forge=new Set();
  try { fs.readFileSync(process.argv[2],"utf8").split("\n").forEach(function(n){ if(n.trim()) forge.add("games/"+n.trim()); }); } catch(e){}
  var skip=/^game_template\.html$/;
  function fixable(f){
    if(skip.test(f)) return false;
    if(f.indexOf("games/") === 0) return forge.has(f);
    return true;
  }
  var n = Number(process.argv[3]) || 3;
  b.filter(function(r){ return !r.ok && fixable(r.file); }).slice(0, n).forEach(function(r){ process.stdout.write(r.file + "\n"); });
' "$BUGS" "$BASE/manifest.txt" "$MAX")"

[ -z "$TARGETS" ] && exit 0

fixed=0; failed=0; TOUCHED=""
while IFS= read -r TARGET; do
  [ -n "$TARGET" ] || continue
  FILE="$ROOT/$TARGET"
  [ -f "$FILE" ] || continue
  cp "$FILE" "$BACKUP/$(basename "$TARGET").$STAMP.bak"

  ISSUES="$("$NODE" -e '
    var fs=require("fs"), b=[];
    try { b=JSON.parse(fs.readFileSync(process.argv[1],"utf8")); } catch(e){}
    var r=b.filter(function(x){ return x.file===process.argv[2]; })[0];
    process.stdout.write(r ? r.errors.concat(r.warnings).slice(0,12).join("; ") : "");
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
  TOUCHED="$TOUCHED $TARGET"
  "$FORGE_RUN" "$ROOT" "$LOG" "$PROMPT_FILE" "$FILE"

  "$NODE" "$TOOLS/audit.js" "$TARGET" > "$BASE/.reaudit.json" 2>>"$LOG"
  if "$NODE" -e 'var r=require(process.argv[1]); process.exit(r.ok?0:1);' "$BASE/.reaudit.json"; then
    echo "$(date '+%Y-%m-%d %H:%M') | $TARGET | bug fix" >> "$HISTORY"
    echo "[$STAMP] fixed $TARGET" >> "$LOG"
    fixed=$((fixed + 1))
  else
    cp "$BACKUP/$(basename "$TARGET").$STAMP.bak" "$FILE"
    echo "[$STAMP] FAILED validation - rolled back $TARGET" >> "$LOG"
    failed=$((failed + 1))
  fi
done <<< "$TARGETS"

echo "[$STAMP] fixed=$fixed rolledback=$failed" >> "$LOG"

# refresh the report for just the pages we touched (a full sweep can be slow)
if [ -n "$(echo $TOUCHED)" ]; then
  "$NODE" -e '
    var fs=require("fs"), cp=require("child_process");
    var bugsPath=process.argv[1], auditPath=process.argv[2], files=process.argv.slice(3);
    var b=[]; try { b=JSON.parse(fs.readFileSync(bugsPath,"utf8")); } catch(e){}
    files.forEach(function(f){
      var r=null;
      try { r=JSON.parse(cp.execFileSync(process.execPath,[auditPath,"--single",f],{timeout:40000,maxBuffer:2e7}).toString()); } catch(e){}
      if(!r) return;
      var i=-1; for(var k=0;k<b.length;k++) if(b[k].file===f) i=k;
      if(i>=0) b[i]=r; else b.push(r);
    });
    fs.writeFileSync(bugsPath, JSON.stringify(b,null,2));
  ' "$BUGS" "$TOOLS/audit.js" $TOUCHED >> "$LOG" 2>&1
fi

# publish fixes so the public site matches
if [ -d "$ROOT/.git" ] && [ "$fixed" -gt 0 ]; then
  (
    cd "$ROOT" || exit 0
    git pull --rebase --autostash -q 2>>"$LOG"
    git add -A
    if ! git diff --staged --quiet; then
      git commit -q -m "auto bug fix: $(date -u +%Y-%m-%d)"
      git push -q 2>>"$LOG"
      echo "[$STAMP] published $fixed fix(es)" >> "$LOG"
    fi
  )
fi

if [ "$(wc -l < "$LOG" 2>/dev/null || echo 0)" -gt 800 ]; then tail -300 "$LOG" > "$LOG.tmp" && mv "$LOG.tmp" "$LOG"; fi
exit 0