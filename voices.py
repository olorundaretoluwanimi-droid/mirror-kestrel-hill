# Voices → voices/<id>.wav + voices/dur.json
#   narrator: ElevenLabs voice through AI33 (../tools/tts_ai33.py, key from the AI33_API_KEY environment variable; costs credits, cached per line)
#   characters: Microsoft neural voices through edge-tts (core/tts/tts_zh.py; needs the internet)
# Usage: <LIB>/.venv/bin/python voices.py
import os, sys, json, subprocess, tempfile
HERE = os.path.dirname(os.path.abspath(__file__))
LIB = os.environ.get('LIB') or os.path.expanduser('~/lemo-opuscar')
AI33 = os.path.join(HERE, '..', 'tools', 'tts_ai33.py')
PY = sys.executable
L = json.load(open(os.path.join(HERE, 'lines.json'), encoding='utf-8'))
out = os.path.join(HERE, 'voices'); os.makedirs(out, exist_ok=True)
dur = {}
is_ai = lambda l: l['voice'].startswith('elevenlabs_')
for kind in ('ai33', 'edge'):
    sub = [l for l in L if is_ai(l) == (kind == 'ai33')]
    if not sub: continue
    tmp = tempfile.mkdtemp(); lj = os.path.join(tmp, 'lines.json'); json.dump(sub, open(lj, 'w', encoding='utf-8'), ensure_ascii=False)
    od = os.path.join(out, '_' + kind)   # keeps each tool's cache between runs
    if kind == 'ai33': subprocess.run([PY, AI33, 'lines', lj, od], check=True)
    else: subprocess.run([PY, os.path.join(LIB, 'core', 'tts', 'tts_zh.py'), lj, od], check=True)
    d = json.load(open(os.path.join(od, 'dur.json')))
    for l in sub:
        src = os.path.join(od, l['id'] + '.wav')
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', src, '-ar', '48000', '-ac', '1', os.path.join(out, l['id'] + '.wav')], check=True)
        dur[l['id']] = d[l['id']]
json.dump({l['id']: dur[l['id']] for l in L}, open(os.path.join(out, 'dur.json'), 'w'), indent=1)
print('voices', len(dur), 'total', round(sum(dur.values()), 1), 's')
