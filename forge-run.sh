#!/bin/bash
# forge-run.sh — runs the coding agent for the game forge / daily drop / updater.
#   online  -> cloud model (default)
#   offline -> local model via Ollama (so the forge keeps working with no internet)
#   also falls back to local if the cloud run produces nothing.
#
# Usage: forge-run.sh <workdir> <logfile> <promptfile> [expected_output_file]

set -uo pipefail
DIR="${1:?workdir}"
LOG="${2:?logfile}"
PROMPT_FILE="${3:?promptfile}"
OUT="${4:-}"

OPENCODE="/opt/homebrew/bin/opencode"
LOCAL_MODEL="${FORGE_LOCAL_MODEL:-local/qwen3:8b}"
OLLAMA_URL="http://127.0.0.1:11434/api/tags"
CLOUD_PING="https://api.particle.ai/v1"
export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin"

[ -f "$PROMPT_FILE" ] || { echo "[forge-run] no prompt file $PROMPT_FILE" >> "$LOG"; exit 1; }
PROMPT="$(cat "$PROMPT_FILE")"

ollama_ready(){ curl -s -m 3 -o /dev/null "$OLLAMA_URL"; }
online(){ curl -s -m 4 -o /dev/null "$CLOUD_PING"; }

run_cloud(){ "$OPENCODE" run --auto --dir "$DIR" "$PROMPT" >> "$LOG" 2>&1; }
run_local(){ "$OPENCODE" run --auto --model "$LOCAL_MODEL" --dir "$DIR" "$PROMPT" >> "$LOG" 2>&1; }

if [ "${FORGE_FORCE_LOCAL:-0}" = "1" ] || ! online; then
  if ollama_ready; then
    echo "[forge-run] offline (or forced) — using local model $LOCAL_MODEL" >> "$LOG"
    run_local
  else
    echo "[forge-run] offline and ollama not reachable — attempting cloud anyway" >> "$LOG"
    run_cloud
  fi
else
  run_cloud
  if [ -n "$OUT" ] && [ ! -f "$OUT" ] && ollama_ready; then
    echo "[forge-run] cloud run produced no output — retrying with local model" >> "$LOG"
    run_local
  fi
fi
exit 0