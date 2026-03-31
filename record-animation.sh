#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════════════════
# record-animation.sh
# Records the full Bahrain animation sequence to a 2K ProRes .mov file.
#
# Requirements (Linux):
#   ffmpeg, python3, chromium-browser or google-chrome
#   Xvfb (auto-used when no $DISPLAY or when display < 2560×1440)
#     → sudo apt install ffmpeg xvfb chromium-browser
#
# Requirements (macOS):
#   ffmpeg, Chrome or Chromium installed under /Applications
#     → brew install ffmpeg
#
# Usage:
#   chmod +x record-animation.sh
#   ./record-animation.sh              # full defaults (2K, 30fps, 60s)
#   ./record-animation.sh --fps 60     # 60fps capture
#   ./record-animation.sh --duration 90
#   ./record-animation.sh --output my-clip.mov
# ═══════════════════════════════════════════════════════════════════════════════
set -euo pipefail
IFS=$'\n\t'

# ── Defaults ──────────────────────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
W=2560
H=1440
FPS=30
# Entrance (≈3s) + 7 cards × 7s each + 10s buffer = 62s; round to 65
DURATION=65
PORT=8743
VDISPLAY=":99"
OUTPUT=""

# ── Argument parsing ───────────────────────────────────────────────────────────
while [[ $# -gt 0 ]]; do
  case "$1" in
    --fps)      FPS="$2";      shift 2 ;;
    --duration) DURATION="$2"; shift 2 ;;
    --output)   OUTPUT="$2";   shift 2 ;;
    --port)     PORT="$2";     shift 2 ;;
    --help|-h)
      sed -n '/^# Usage:/,/^# ═/{ /^# ═/!p }' "$0" | sed 's/^# //'
      exit 0 ;;
    *) echo "Unknown option: $1" >&2; exit 1 ;;
  esac
done

[[ -z "$OUTPUT" ]] && OUTPUT="${SCRIPT_DIR}/bahrain-animation-$(date +%Y%m%d-%H%M%S).mov"

# ── ANSI helpers ───────────────────────────────────────────────────────────────
RED='\033[0;31m'; GRN='\033[0;32m'; YLW='\033[1;33m'
BLU='\033[0;34m'; MAG='\033[0;35m'; NC='\033[0m'
info() { echo -e "${BLU}▶${NC}  $*"; }
ok()   { echo -e "${GRN}✔${NC}  $*"; }
warn() { echo -e "${YLW}⚠${NC}  $*"; }
die()  { echo -e "${RED}✖  ERROR:${NC} $*" >&2; exit 1; }
hr()   { echo -e "${MAG}$(printf '─%.0s' {1..60})${NC}"; }

# ── PID registry ──────────────────────────────────────────────────────────────
SERVER_PID=""; BROWSER_PID=""; XVFB_PID=""

cleanup() {
  echo ""
  info "Cleaning up…"
  [[ -n "${SERVER_PID}"  ]] && kill "${SERVER_PID}"  2>/dev/null || true
  [[ -n "${BROWSER_PID}" ]] && kill "${BROWSER_PID}" 2>/dev/null || true
  [[ -n "${XVFB_PID}"   ]] && kill "${XVFB_PID}"   2>/dev/null || true
  rm -rf "/tmp/bahrain-record-$$" 2>/dev/null || true
}
trap cleanup EXIT

# ── Dependency checks ─────────────────────────────────────────────────────────
hr
info "Checking dependencies…"
command -v ffmpeg  >/dev/null 2>&1 || die "ffmpeg not found.\n  Linux:  sudo apt install ffmpeg\n  macOS:  brew install ffmpeg"
command -v python3 >/dev/null 2>&1 || die "python3 not found."

# Detect browser
BROWSER=""
if [[ "$(uname)" == "Darwin" ]]; then
  for b in \
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
    "/Applications/Chromium.app/Contents/MacOS/Chromium"; do
    [[ -x "$b" ]] && { BROWSER="$b"; break; }
  done
else
  for b in google-chrome google-chrome-stable chromium-browser chromium; do
    command -v "$b" >/dev/null 2>&1 && { BROWSER="$b"; break; }
  done
fi
[[ -n "$BROWSER" ]] || die "No Chrome/Chromium browser found.\n  Linux: sudo apt install chromium-browser\n  macOS: Install from https://www.google.com/chrome/"

ok "ffmpeg   : $(ffmpeg -version 2>&1 | head -1 | cut -d' ' -f1-3)"
ok "python3  : $(python3 --version)"
ok "browser  : $BROWSER"

# ── Detect encoder ────────────────────────────────────────────────────────────
ENCODER_ARGS=()
if ffmpeg -hide_banner -encoders 2>/dev/null | grep -q 'prores_ks'; then
  # ProRes 422 HQ — best quality/size ratio for 2K
  ENCODER_ARGS=( -c:v prores_ks -profile:v 3 -vendor apl0
                 -pix_fmt yuv422p10le
                 -color_range tv -colorspace bt709
                 -color_primaries bt709 -color_trc bt709 )
  ok "encoder  : prores_ks  (ProRes 422 HQ)"
elif ffmpeg -hide_banner -encoders 2>/dev/null | grep -q ' prores '; then
  ENCODER_ARGS=( -c:v prores -pix_fmt yuv422p10le )
  ok "encoder  : prores"
else
  warn "ProRes encoder not available — falling back to H.264 in .mov wrapper"
  warn "For ProRes: sudo apt install ffmpeg (build with --enable-libx264)"
  ENCODER_ARGS=( -c:v libx264 -crf 10 -preset slow
                 -pix_fmt yuv420p -movflags +faststart )
fi

hr
info "Recording plan:"
info "  Resolution : ${W}×${H}"
info "  Frame rate : ${FPS} fps"
info "  Duration   : ${DURATION}s"
info "  Output     : ${OUTPUT}"
hr

# ── Virtual display (Linux only) ──────────────────────────────────────────────
PLATFORM="$(uname)"
if [[ "$PLATFORM" != "Darwin" ]]; then
  NEED_XVFB=true

  if [[ -n "${DISPLAY:-}" ]]; then
    # Check if existing display is large enough
    DISP_RES="$(xdpyinfo -display "${DISPLAY}" 2>/dev/null \
                | awk '/dimensions:/{print $2}' || echo "")"
    if [[ "$DISP_RES" == "${W}x${H}" ]]; then
      NEED_XVFB=false
      ok "display  : using ${DISPLAY} (${DISP_RES})"
    else
      warn "Existing display ${DISPLAY} is ${DISP_RES:-unknown}; launching Xvfb at ${W}×${H}"
    fi
  fi

  if $NEED_XVFB; then
    command -v Xvfb >/dev/null 2>&1 || \
      die "Xvfb not found.\n  sudo apt install xvfb"
    Xvfb "$VDISPLAY" -screen 0 "${W}x${H}x24" -ac +extension GLX +render \
      >/dev/null 2>&1 &
    XVFB_PID=$!
    export DISPLAY="$VDISPLAY"
    sleep 2
    ok "display  : Xvfb on ${VDISPLAY} (PID ${XVFB_PID})"
  fi
fi

# ── Local HTTP server ─────────────────────────────────────────────────────────
cd "$SCRIPT_DIR"
python3 -m http.server "$PORT" --quiet 2>/dev/null &
SERVER_PID=$!
ok "server   : http://localhost:${PORT}  (PID ${SERVER_PID})"
sleep 1

# ── Browser launch flags ──────────────────────────────────────────────────────
BROWSER_FLAGS=(
  --no-sandbox
  --disable-gpu-sandbox
  --enable-gpu-rasterization
  --window-size="${W},${H}"
  --window-position=0,0
  --no-first-run
  --no-default-browser-check
  --disable-infobars
  --disable-extensions
  --disable-translate
  --disable-notifications
  --disable-background-networking
  --disable-sync
  --hide-scrollbars
  --force-device-scale-factor=1
  --disable-features=TranslateUI
  --user-data-dir="/tmp/bahrain-record-$$"
  "http://localhost:${PORT}/index.html"
)

# macOS: also disable crash reporter
[[ "$PLATFORM" == "Darwin" ]] && BROWSER_FLAGS+=( --disable-crash-reporter )

"$BROWSER" "${BROWSER_FLAGS[@]}" 2>/dev/null &
BROWSER_PID=$!
ok "browser  : PID ${BROWSER_PID}"

WAIT=5
info "Waiting ${WAIT}s for page load and animation start…"
sleep "$WAIT"

# ── Screen capture → ffmpeg ───────────────────────────────────────────────────
hr
info "Recording ${DURATION}s → $(basename "$OUTPUT")"
info "(Press Ctrl+C to stop early — partial file will be saved)"
hr

declare -a CAPTURE_ARGS
if [[ "$PLATFORM" == "Darwin" ]]; then
  # List capture devices and pick screen
  warn "macOS: listing AVFoundation capture devices:"
  ffmpeg -f avfoundation -list_devices true -i "" 2>&1 | grep -E '^\[|video' || true
  warn "Using device index 1 (Capture screen 1). Edit CAPTURE_ARGS if wrong."
  CAPTURE_ARGS=(
    -f avfoundation
    -framerate "$FPS"
    -capture_cursor 0
    -i "1:none"
  )
else
  CAPTURE_ARGS=(
    -f x11grab
    -video_size "${W}x${H}"
    -framerate "$FPS"
    -draw_mouse 0
    -i "${DISPLAY}+0,0"
  )
fi

ffmpeg \
  "${CAPTURE_ARGS[@]}" \
  -t "$DURATION" \
  "${ENCODER_ARGS[@]}" \
  -movflags +faststart \
  -y \
  "$OUTPUT"

# ── Done ──────────────────────────────────────────────────────────────────────
hr
if [[ -f "$OUTPUT" ]]; then
  SIZE="$(du -sh "$OUTPUT" 2>/dev/null | cut -f1 || echo "?")"
  ok "Saved: ${OUTPUT}  (${SIZE})"
  info "Tip: Open in QuickTime / VLC, or import into DaVinci Resolve / Final Cut."
else
  die "Recording failed — output file not found."
fi
hr
