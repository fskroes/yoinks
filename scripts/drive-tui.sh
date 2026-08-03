#!/usr/bin/env bash
#
# Drive the built CLI through a real pty and read back what it drew.
#
# Ink only listens to stdin when it is a tty, so the wiring — the picker, the
# phase choreography, `esc` — cannot be reached from a normal shell and is not
# covered by `npm test`. Two earlier attempts on this went nowhere: under both
# `script` and `expect` the picker rendered but no keystroke ever arrived, so
# the selection would not leave the first choice. `tmux send-keys` names keys
# (`Down`, `Enter`, `Escape`) instead of emitting raw escape bytes, and that is
# the difference — it is what produced the runs recorded in
# `docs/validation/step-9-whisper-timing.md`.
#
# Needs `tmux` (brew install tmux) and a current `npm run build`.
#
# Usage:
#   scripts/drive-tui.sh <url> <step>...
#
# Steps, applied in order:
#   wait:<seconds>   sleep, then capture
#   until:<text>     poll ~2x/second until <text> is on screen (fails at 300s)
#   key:<Name>       one tmux key name — Down, Enter, Escape, C-c
#   type:<text>      literal text, as if typed
#   snap             capture now
#
# Every step captures the screen, so a run leaves the trace of what the product
# showed rather than only where it ended up. Example — the transcript rung on a
# source with no captions, cancelled while whisper is running:
#
#   scripts/drive-tui.sh https://archive.org/details/DuckandC1951 \
#     until:'Save as' key:Down key:Down key:Enter \
#     until:'transcribing with local whisper' key:Escape wait:3
#
# The picker's rows differ per source and the separator is skipped, so count
# `key:Down`s against a real capture rather than assuming — the transcript
# choice is always last.
set -uo pipefail

if [ $# -lt 1 ]; then
  sed -n '2,40p' "$0" | sed 's/^# \{0,1\}//'
  exit 64
fi

url=$1
shift

root=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
session="drive-tui-$$"

if ! command -v tmux >/dev/null; then
  echo "drive-tui: needs tmux — brew install tmux" >&2
  exit 69
fi
if [ ! -f "$root/dist/cli.js" ]; then
  echo "drive-tui: no dist/cli.js — run npm run build" >&2
  exit 69
fi

# a wide, tall pane: the picker and the phase lines are centred, and a narrow
# one wraps them into unreadable captures
tmux new-session -d -s "$session" -x 200 -y 50 \
  "cd '$root' && node dist/cli.js '$url'; echo '[drive-tui] cli exited'; sleep 600"
trap 'tmux kill-session -t "$session" 2>/dev/null' EXIT

screen() { tmux capture-pane -t "$session" -p; }
snap() { echo "----- $1 -----"; screen | sed -e 's/[[:space:]]*$//' | cat -s; }

status=0
for step in "$@"; do
  case "$step" in
    wait:*)
      sleep "${step#wait:}"
      snap "$step"
      ;;
    until:*)
      want=${step#until:}
      found=1
      for _ in $(seq 1 600); do
        if screen | grep -qF -- "$want"; then found=0; break; fi
        sleep 0.5
      done
      if [ $found -ne 0 ]; then
        echo "----- $step — NOT SEEN after 300s -----"
        snap "screen at timeout"
        status=1
        break
      fi
      snap "$step"
      ;;
    key:*)
      tmux send-keys -t "$session" "${step#key:}"
      sleep 1
      snap "$step"
      ;;
    type:*)
      tmux send-keys -t "$session" -l "${step#type:}"
      sleep 1
      snap "$step"
      ;;
    snap)
      snap "snap"
      ;;
    *)
      echo "drive-tui: unknown step '$step'" >&2
      status=64
      break
      ;;
  esac
done

exit $status
