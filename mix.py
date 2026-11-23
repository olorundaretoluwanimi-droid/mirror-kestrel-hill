# Mix: score (out/score.wav) + ambience beds per place + event foley + voices → out/mix.wav
# Reads events.json (node core/render/events.mjs <project>): voice lines, foley events, shot spans and story marks.
# Usage: <LIB>/.venv/bin/python mix.py
import sys, os, json, numpy as np, soundfile as sf
from scipy.ndimage import uniform_filter1d
from scipy.signal import resample_poly
HERE = os.path.dirname(os.path.abspath(__file__))
LIB = os.environ.get('LIB') or os.path.expanduser('~/lemo-opuscar')
sys.path.insert(0, os.path.join(LIB, 'core', 'audio'))
from sfx import *

E = json.load(open(os.path.join(HERE, 'events.json'), encoding='utf-8'))
DUR = E['dur']; EV = E['ev']; N = int(DUR * SR); tt = np.arange(N) / SR
SH = {e['id']: (e['t'], e['b']) for e in EV if e['type'] == 'shot'}
T = {e['id']: e['t'] for e in EV if e['type'] == 'mark'}
rng = np.random.default_rng(31)
def stereo(x, pan=0.0): l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4); return np.stack([x * l * 1.414, x * r * 1.414], 1)
def place(buf, x, t, pan=0.0, g=1.0):
    s = int(t * SR); x = stereo(x, pan) if x.ndim == 1 else x
    if s >= len(buf) or s < 0: return
    n = min(len(x), len(buf) - s); buf[s:s + n] += x[:n] * g
def place_m(buf, x, t): s = int(t * SR); n = min(len(x), len(buf) - s); buf[s:s + n] += x[:n]
def rms_db(x): return 20 * np.log10(np.sqrt(np.mean(x ** 2)) + 1e-9)
def full(fn): return fn(DUR)[:N]
def gate(*spans, fi=.5, fo=.5):
    g = np.zeros(N)
    for a, b in spans: g = np.maximum(g, np.clip(np.minimum((tt - a) / fi + 1, (b - tt) / fo + 1), 0, 1))
    return g
def shots(*ids, pre=0.0, post=0.0): return [(SH[i][0] - pre, SH[i][1] + post) for i in ids]

# —— Ambience beds ——
NZ = full(noise); BR = full(brown)
roomTone = lp(np.roll(BR, 4321), 160) * .7
kettle = bp(np.roll(NZ, 77), 2500, 6000) * .05 * (np.sin(2 * np.pi * .03 * tt) ** 2)
clockTick = np.zeros(N)
for k in range(int(DUR)): s = int(k * SR); x = t_(.03); c = bp(np.random.default_rng(k).standard_normal(len(x)), 2000, 6000) * np.exp(-x / .004); clockTick[s:s + len(x)] += c * (.6 if k % 2 else .45)
windSoft = bp(np.roll(NZ, 2222), 200, 1400) * (.35 + .65 * np.sin(2 * np.pi * .06 * tt) ** 2)
gust = lambda sh: bp(np.roll(NZ, sh), 150, 2200) * (.4 + .6 * np.clip(np.sin(2 * np.pi * .11 * tt + sh) * 1.6, 0, 1))
blizzard = gust(5555) + gust(7777) * .8 + lp(np.roll(BR, 999), 300) * .8
cableHum = lp(np.roll(BR, 3131), 180) * .5 + np.sin(2 * np.pi * 55 * tt) * .02 + bp(np.roll(NZ, 6262), 800, 2400) * .03 * (np.sin(2 * np.pi * 3.2 * tt) > .7)
def chirps(n, f0, f1, seed, d0=.06, d1=.16):
    r = np.random.default_rng(seed); o = np.zeros(N)
    for k in range(n):
        t0 = r.uniform(0, DUR); f = r.uniform(f0, f1); d = r.uniform(d0, d1); m = int(d * SR); x = np.arange(m) / SR
        ch = np.sin(2 * np.pi * np.cumsum(f * (1 + .35 * np.sin(2 * np.pi * r.uniform(15, 30) * x))) / SR) * np.sin(np.pi * x / d) ** 2
        s = int(t0 * SR); o[s:s + m] += ch[:max(0, min(m, N - s))] * r.uniform(.2, .6)
    return o
birds = chirps(260, 2600, 4300, 1)
crows = np.zeros(N)
for k in range(60):
    t0 = rng.uniform(0, DUR); s = int(t0 * SR)
    for j in range(rng.integers(1, 4)):
        d = .28; x = t_(d); f = 520 * (1 - .25 * x / d); c = bp(np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)) + bp(noise(d), 600, 3000) * .6, 400, 3200) * np.sin(np.pi * x / d) ** .8
        place_m(crows, c * .4, t0 + j * .4)
# a crowd: band-limited babble with slow swells; laughter flecks
crowd = bp(np.roll(NZ, 1111), 300, 2400) * (.6 + .4 * np.sin(2 * np.pi * .23 * tt) * np.sin(2 * np.pi * .07 * tt)) + bp(np.roll(NZ, 2323), 500, 3000) * .3 * (np.sin(2 * np.pi * 1.7 * tt + np.sin(tt * .9) * 3) > .6)
kidsFar = chirps(120, 600, 1100, 7, .12, .3) * .5
stove = np.zeros(N)
for k in range(int(DUR * 7)): t0 = rng.uniform(0, DUR); place_m(stove, click(rng.uniform(.6, 1.4), rng.uniform(.1, .5))[:int(.05 * SR)], t0)
stove = bp(stove, 800, 6000) + lp(np.roll(BR, 4444), 300) * .3
machine = lp(np.roll(BR, 8888), 120) * .7 + np.sin(2 * np.pi * 47 * tt) * .05 + np.sin(2 * np.pi * 94 * tt) * .02 + bp(np.roll(NZ, 9999), 300, 900) * .05 * (np.sin(2 * np.pi * 1.1 * tt) ** 8)

FLAT = shots('open', 'test', 'inventory', 'marks', 'pip1', 'mornings', 'letter', 'sit')
g_flat = gate(*FLAT, fi=.3, fo=.3)
g_flatNight = gate(*shots('kitchen'), fi=.3, fo=.3)
g_final = gate(*shots('final'), fi=.3, fo=.3)
g_town = gate(*shots('hill', 'board', 'lake', 'sled', 'door', 'booth'), (SH['title'][0], SH['title'][1]), fi=.6, fo=.4)
g_lake = gate(*shots('lake'), fi=.3, fo=.3)
g_fest = gate((SH['festival'][0] - .8, SH['festival'][1] + 1.2), fi=1.2, fo=1.6)        # J-cut in, L-cut out
g_eng = gate(*shots('engine', 'wheel'), fi=.3, fo=.3)
g_engDark = gate(*shots('eh2'), fi=.3, fo=.3)
g_storm = gate((SH['depart'][0], SH['release'][1]), fi=1.5, fo=2.5) * (1 - .55 * gate(*shots('eh2'), fi=.3, fo=.3))
g_night = gate(*shots('power'), fi=.5, fo=.5)
g_dawn = gate(*shots('end'), fi=1.0, fo=1.5)
running = gate(*shots('title', 'hill', 'engine', 'end'), (SH['depart'][0], T['blackout']), fi=.6, fo=.05)
amb = (stereo(roomTone * (g_flat + g_flatNight + g_final), 0) + stereo(kettle * g_flat, .3) + stereo(clockTick * (g_flatNight + g_flat * .5) * .3, .3)
       + stereo(birds * (g_flat * .15 + g_final * .35 + g_dawn * .6), -.3) + stereo(np.roll(birds, 9001) * g_dawn * .5, .35)
       + stereo(windSoft * (g_town + g_night * .8), -.2) + stereo(crows * g_town * .5, .3) + stereo(kidsFar * (g_town * .3 + g_lake * .8), .2)
       + stereo(cableHum * running * .8, 0)
       + stereo(crowd * g_fest, -.15) + stereo(np.roll(crowd, 33333) * g_fest, .2)
       + stereo(stove * (g_eng + g_engDark) * .6, -.4) + stereo(machine * g_eng, 0)
       + stereo(blizzard * g_storm, -.25) + stereo(np.roll(blizzard, 44444) * g_storm, .25)
       )
amb *= (1 - .85 * gate((T['letterCard'] + .2, T['letterCard'] + 6.0), fi=.05, fo=.8))[:, None]   # the letter: the flat holds its breath
amb *= (1 - .6 * gate((T['stop'], SH['pip1'][0]), fi=.05, fo=.6))[:, None]

# —— Foley ——
fx = np.zeros((N, 2))
def tone(f, d, tau, v=1.0, h=((1, 1),)):
    x = t_(d); return norm(sum(a * np.sin(2 * np.pi * f * m * x) for m, a in h) * np.exp(-x / tau) * np.minimum(1, x / .004)) * v
def ping(v=1.0, f=1568): return tone(f, .5, .14, v, ((1, 1), (2, .25)))
def stepW(v=1.0): d = .12; x = t_(d); return norm(bp(noise(d), 300, 2500) * np.exp(-x / .015) + np.sin(2 * np.pi * 160 * x) * np.exp(-x / .02) * .6) * v
def stepSnow(v=1.0): d = .22; x = t_(d); return norm(bp(noise(d), 900, 6000) * np.exp(-x / .05) * (1 + .8 * (rng.random(len(x)) > .93))) * v
def stepSteel(v=1.0): d = .3; x = t_(d); return norm(bp(noise(d), 500, 4000) * np.exp(-x / .012) + sum(np.sin(2 * np.pi * f * x) * np.exp(-x / .12) * a for f, a in ((410, .5), (1130, .3), (2260, .15)))) * v
def squeak(v=1.0, d=.35): x = t_(d); f = 1400 + 900 * np.sin(np.pi * x / d); return norm(np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * x / d) ** 2 * (1 + .4 * np.sin(2 * np.pi * 37 * x))) * v
def paper(v=1.0, d=.45): x = t_(d); return norm(bp(noise(d), 1500, 9000) * (np.abs(np.sin(2 * np.pi * 9 * x)) ** 2) * np.sin(np.pi * x / d)) * v
def door(v=1.0): o = np.zeros(int(1.2 * SR)); place_m(o, creak(.8), 0); place_m(o, creak(.6), .2); place_m(o, thump(.7, 90)[:int(.3 * SR)], .7); return norm(o) * v
def slam(v=1.0): o = np.zeros(int(1.0 * SR)); place_m(o, thump(1, 70)[:int(.5 * SR)], 0); place_m(o, clack(.9, .8)[:int(.3 * SR)], 0); return norm(o) * v
def ice(v=1.0): d = 1.2; x = t_(d); f = 300 * np.exp(-x * 2.0) + 90; return norm(np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-x / .3) + bp(noise(d), 1200, 6000) * np.exp(-x / .05) * .5) * v
def sledHiss(v=1.0, d=1.6): x = t_(d); return norm(bp(noise(d), 1500, 7000) * np.sin(np.pi * x / d) ** 1.5) * v
def ring(v=1.0): d = 1.0; x = t_(d); bellr = (np.sin(2 * np.pi * 1000 * x) + np.sin(2 * np.pi * 1180 * x)) * (np.sin(2 * np.pi * 20 * x) > 0) * np.minimum(1, (d - x) / .05); return norm(bellr) * v
def thunder(v=1.0): d = 5.0; x = t_(d); return norm(lp(brown(d), 300) * (np.exp(-x / 1.4) * (1 + .8 * np.sin(2 * np.pi * 1.3 * x) ** 2)) + bp(noise(d), 800, 5000) * np.exp(-x / .08) * .6) * v
def powerDown(v=1.0): d = 2.2; x = t_(d); f = 120 * np.exp(-x * 1.6) + 20; return norm(np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-x / .9) + lp(noise(d), 400) * np.exp(-x / .3) * .3) * v
def powerUp(v=1.0): d = 2.0; x = t_(d); f = 25 + 95 * (1 - np.exp(-x * 1.8)); return norm(np.sin(2 * np.pi * np.cumsum(f) / SR) * np.minimum(1, x / .4) * np.exp(-np.maximum(0, x - 1.2) / .4)) * v
def brake(v=1.0): o = np.zeros(int(1.4 * SR)); place_m(o, clack(1, 1)[:int(.4 * SR)], 0); place_m(o, bp(noise(1.2), 1200, 5000) * np.exp(-t_(1.2) / .25) * .6, .05); place_m(o, thump(.8, 80)[:int(.4 * SR)], .02); return norm(o) * v
def cableRun(v=1.0, d=8.0): x = t_(d); return norm(lp(noise(d), 500) * (1 + .5 * np.sin(2 * np.pi * 4 * x * (1 + x / d))) * np.minimum(1, x / 1.0) * np.minimum(1, (d - x) / 2.5) + np.sin(2 * np.pi * np.cumsum(60 + 30 * x / d) / SR) * .3 * np.minimum(1, x / 1.0) * np.minimum(1, (d - x) / 2.5)) * v
def bellFx(v=1.0, f=2093): return tone(f, 1.0, .35, v, ((1, 1), (2.76, .3), (5.4, .12)))
def lever(v=1.0): o = np.zeros(int(.8 * SR)); place_m(o, creak(.9), 0); place_m(o, clack(.8, .9)[:int(.3 * SR)], .25); return norm(o) * v
def squelch(v=1.0): d = .18; x = t_(d); return norm(bp(noise(d), 1000, 5000) * np.exp(-x / .05)) * v
def pickup(v=1.0): o = np.zeros(int(.5 * SR)); place_m(o, clack(.8, .6)[:int(.2 * SR)], 0); return norm(o) * v
def flipGlass(v=1.0): d = 1.4; x = t_(d); return norm(bp(noise(d), 2500, 10000) * np.exp(-((x - .5) / .25) ** 2) * .6 + sum(np.sin(2 * np.pi * f * x) * np.exp(-x / .6) * a for f, a in ((1760, .4), (2637, .25)))) * v
def reveal(v=1.0): d = 2.0; x = t_(d); return norm(bp(noise(d), 3000, 11000) * np.exp(-x / .5) * np.minimum(1, x / .3) * .5) * v
def chair(v=1.0): o = np.zeros(int(.8 * SR)); place_m(o, creak(.6)[:int(.6 * SR)], 0); place_m(o, thump(.5, 120)[:int(.2 * SR)], .1); return norm(o) * v
def carDoor(v=1.0): o = np.zeros(int(.8 * SR)); place_m(o, clack(1, .9)[:int(.3 * SR)], 0); place_m(o, creak(.7), .05); return norm(o) * v
def boothWin(v=1.0): o = np.zeros(int(.8 * SR)); place_m(o, bp(noise(.4), 600, 3000) * np.exp(-t_(.4) / .08), 0); place_m(o, clack(.7, .6)[:int(.3 * SR)], .35); return norm(o) * v

STEP = {'wood': stepW, 'snow': stepSnow, 'steel': stepSteel}
for e in EV:
    t0, k = e['t'], e['type']
    if k == 'chime': place(fx, ping(.12, 1318), t0)
    elif k == 'squelch': place(fx, squelch(.16), t0, .1)
    elif k == 'tick': place(fx, ping(.08, 2093), t0, .45)
    elif k == 'step': place(fx, STEP.get(e.get('surf'), stepW)(.3 * rng.uniform(.8, 1.1)), t0 + rng.uniform(-.01, .01), rng.uniform(-.2, .2))
    elif k == 'squeak': place(fx, squeak(.18), t0, .3)
    elif k == 'reveal': place(fx, reveal(.25), t0, .2)
    elif k == 'recoil': place(fx, stepW(.5), t0, 0)
    elif k == 'ice': place(fx, ice(.4), t0, .3)
    elif k == 'sled': place(fx, sledHiss(.3), t0, .2)
    elif k == 'doorSlam': place(fx, slam(.6), t0, -.2)
    elif k == 'door': place(fx, door(.45), t0, -.3)
    elif k == 'boothWin': place(fx, boothWin(.4), t0, -.3)
    elif k == 'paper': place(fx, paper(.3), t0, .1)
    elif k == 'click': place(fx, clack(.6, .4)[:int(.3 * SR)], t0, .2)
    elif k == 'flipGlass': place(fx, flipGlass(.3), t0 + 1.4, 0)
    elif k == 'heart': place(fx, heartbeat(.4), t0)
    elif k == 'chair': place(fx, chair(.4), t0, 0)
    elif k == 'ring': place(fx, ring(.32), t0, .35)
    elif k == 'pickup': place(fx, pickup(.4), t0, .35)
    elif k == 'thunder': place(fx, thunder(.85), t0 + .25, 0)
    elif k == 'powerDown': place(fx, powerDown(.6), t0, 0)
    elif k == 'carDoor': place(fx, carDoor(.45), t0, .2)
    elif k == 'brake': place(fx, brake(.7), t0, 0)
    elif k == 'cable': place(fx, cableRun(.5, max(4.0, T['glideEnd'] - t0)), t0, 0)
    elif k == 'powerUp': place(fx, powerUp(.5), t0, 0)
    elif k == 'bell': place(fx, bellFx(.12, [2093, 2349, 2637, 3136, 2637, 2349][e.get('i', 0) % 6]), t0, (e.get('i', 0) % 5 - 2) * .25)
    elif k == 'lever': place(fx, lever(.4), t0, .2)

# —— Voices ——
VOI = {e['id']: e for e in EV if e['type'] == 'voice'}
Dd = json.load(open(os.path.join(HERE, 'voices', 'dur.json')))
vo = np.zeros((N, 2)); vmask = np.zeros(N)
for k, e in VOI.items():
    t0 = e['t']; y, sr = sf.read(os.path.join(HERE, 'voices', k + '.wav'))
    if y.ndim > 1: y = y.mean(1)
    if sr != SR: y = resample_poly(y, SR, sr)
    y = compress(norm(y, .9), thr=.25, ratio=3.2)
    act = np.abs(y) > .02 * np.abs(y).max(); y = y * (10 ** (-20 / 20)) / (np.sqrt(np.mean(y[act] ** 2)) + 1e-9)
    if e.get('radio'): y = radio(y) * .8                                     # the walkie-talkie
    elif e.get('phone'): y = norm(bp(y, 320, 3400)) * .5
    elif e.get('dlg'): y = lp(y, 7000) * 1.05                              # in the world
    pan = -.12 if k[0] == 's' else .18 if k[0] == 'p' else .25 if k[0] == 'o' else 0
    place(vo, y, t0, pan); s = int(t0 * SR); vmask[s:s + len(y)] = 1

# —— Music ——
m, sr = sf.read(os.path.join(HERE, 'out', 'score.wav'), always_2d=True)
mus = np.zeros((N, 2)); n = min(len(m), N); mus[:n] = m[:n]
duck = uniform_filter1d(vmask, int(.35 * SR)); mus *= (1 - .2 * np.clip(duck * 1.6, 0, 1))[:, None]

def lvl(x, db): sel = np.abs(x).sum(1) > 1e-4; r = np.sqrt(np.mean(x[sel] ** 2)) if sel.any() else 1; return x * (10 ** (db / 20)) / (r + 1e-9)
voS = lvl(vo, -17); musS = lvl(mus, -21); ambS = lvl(amb, -31); fxS = lvl(fx, -27)
bedG = np.ones(N)
for k, e in sorted(VOI.items(), key=lambda kv: kv[1]['t']):   # each line dips the bed just enough for 10 dB
    t0 = e['t']; a, b = int(t0 * SR), int((t0 + Dd[k]) * SR); need = rms_db(voS[a:b]) - 10 - rms_db((musS + ambS + fxS)[a:b]) - 1.5; g = min(1.0, 10 ** (need / 20))
    env = np.interp(tt, [t0 - .35, t0 - .05, t0 + Dd[k] + .1, t0 + Dd[k] + .6], [1.0, g, g, 1.0]); bedG = np.minimum(bedG, env)
musS *= bedG[:, None]; ambS *= (.2 + .8 * bedG)[:, None]; fxS *= (.45 + .55 * bedG)[:, None]
mix = voS + musS + ambS + fxS
pk = np.abs(mix).max(); mix = np.tanh(mix / max(pk, 1e-6) * 1.2) * .9
os.makedirs(os.path.join(HERE, 'out'), exist_ok=True)
sf.write(os.path.join(HERE, 'out', 'mix.wav'), mix.astype(np.float32), SR, subtype='FLOAT')
print('wrote out/mix.wav', DUR, 's | vo', round(rms_db(voS), 1), 'mus', round(rms_db(musS), 1), 'amb', round(rms_db(ambS), 1), 'fx', round(rms_db(fxS), 1))
low = []
for k, e in sorted(VOI.items(), key=lambda kv: kv[1]['t']):
    t0 = e['t']; a, b = int(t0 * SR), int((t0 + Dd[k]) * SR); gap = rms_db(voS[a:b]) - rms_db((musS + ambS + fxS)[a:b])
    if gap < 7: low.append(f'{k}@{t0:.1f}:{gap:.1f}dB')
print('voice over bed below 7 dB:', low or 'none')
