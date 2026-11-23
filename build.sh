#!/bin/sh
# One command: "What If Your Mirror Showed You in 10 Years?" (Kestrel Hill, 2.5D Pixel Art) — voices, events, score, mix,
# subtitles, picture, master, poster.
#   sh build.sh                     full build (the picture alone takes many hours on a laptop: see render.yml for GitHub Actions)
#   STOP_BEFORE_VIDEO=1 sh build.sh sound and subtitles only
# Needs the Lemo-Opuscar library (core, voice and music tiers): set LIB if it is not at the path below.
# The narrator is an ElevenLabs voice through AI33 (../tools/tts_ai33.py, key in the AI33_API_KEY environment variable);
# finished lines are cached in voices/_ai33, so a rebuild only spends credits on lines whose text changed.
set -e
LIB=${LIB:-/c/Users/HP/lemo-opuscar}
export LIB
HERE=$(cd "$(dirname "$0")" && pwd)
[ -f "$LIB/core/render/video.mjs" ] || { echo "set LIB to the library folder"; exit 1; }
PY="$LIB/.venv/bin/python"; [ -x "$PY" ] || PY="$LIB/.venv/Scripts/python.exe"
NAME=mirror-kestrel-hill
FPS=30
cd "$LIB"
"$PY" core/audio/sampler.py --need "$HERE/score.py"
# 1. script → lines.json, voices (narrator: ElevenLabs via AI33; characters: Microsoft neural voices) + speech-to-text check
"$PY" "$HERE/script.py"
"$PY" "$HERE/voices.py"
"$PY" core/tts/asr_check.py "$HERE/lines.json" "$HERE/voices" --model small.en || echo "asr: check the DIFF lines by ear (numbers and spellings differ only in form)"
# 2. events (voice times, foley cues, shots and story marks) from the page
node core/render/events.mjs "$HERE"
# 3. score, mix, subtitles
"$PY" "$HERE/score.py"
"$PY" "$HERE/mix.py"
ffmpeg -v error -y -i "$HERE/out/mix.wav" -c:a flac -sample_fmt s16 -compression_level 8 "$HERE/audio/mix.flac"
# the soundtrack the GitHub render uses, in 7 MB pieces + checksum (pushes over ~30 MB fail on a slow connection)
(cd "$HERE/audio" && rm -f mix.flac.part* && split -b 7m -d -a 2 mix.flac mix.flac.part && sha256sum mix.flac > mix.flac.sha256)
"$PY" "$HERE/srt_cues.py"
"$PY" core/render/srt.py "$HERE/out/cues.json" "$HERE/subtitles_en.srt"   # burned in too: not named like the video
[ -n "$STOP_BEFORE_VIDEO" ] && { echo "stopped before the picture"; exit 0; }
# 4. picture (tilt-shift on), 30 fps
node core/render/video.mjs "$HERE" --fps $FPS --workers 2 --out "$HERE/out/video.mp4"
# 5. master: -14 LUFS, no grain (pixel art)
sh core/render/mux.sh "$HERE/out/video.mp4" "$HERE/out/mix.wav" "$HERE/$NAME.mp4" $FPS 0
# 6. poster (the two cars side by side at the passing loop)
ffmpeg -v error -y -ss 531 -i "$HERE/$NAME.mp4" -frames:v 1 -q:v 2 "$HERE/poster.jpg"
echo "done: $HERE/$NAME.mp4"
