# Original score for "What If Your Mirror Showed You in 10 Years?" (Kestrel Hill). 64 bpm, 4/4 (bar = 3.75 s).
# A minor for the glass and the fear, C major only when it is earned (the brakes let go, the lights, the dawn).
# The glass motif: four notes on glass harp, E-B-G-F# (minor) / E-B-G-A (major). The father: a horn line. Pip: a solo violin.
# The cable ostinato: pizzicato cellos and contrabass, a low pulse that is the funicular; it stops dead when the power dies.
# The festival: a small folk band (recorder, nylon guitar, frame drum) heard from the square.
# Every section starts from the timeline marks in events.json (shots and story beats), so the music follows the cut.
# Usage: <LIB>/.venv/bin/python score.py   → out/score.wav
import sys, os, json, numpy as np, soundfile as sf
HERE = os.path.dirname(os.path.abspath(__file__))
LIB = os.environ.get('LIB') or os.path.expanduser('~/lemo-opuscar')
sys.path.insert(0, LIB)
from core.audio import sampler as S
from core.audio.sfx import SR

S.seed(64)
E = json.load(open(os.path.join(HERE, 'events.json'), encoding='utf-8'))
DUR = E['dur']
SH = {e['id']: (e['t'], e['b']) for e in E['ev'] if e['type'] == 'shot'}
T = {e['id']: e['t'] for e in E['ev'] if e['type'] == 'mark'}
VO = {e['id']: e['t'] for e in E['ev'] if e['type'] == 'voice'}
A = lambda s: SH[s][0]; Bn = lambda s: SH[s][1]
BPM = 64; B = 60 / BPM; BAR = 4 * B
EV = []
def ev(t, inst, pitch, dur, vel, pan=0, gain=1.0, **kw):
    if 0 <= t < DUR: EV.append(dict(t=t, inst=inst, pitch=pitch, dur=dur, vel=vel, pan=pan, gain=gain, **kw))
m = S.midi
CH = {'Am': ['A1', 'E2', 'A2', 'C3', 'E3'], 'F': ['F1', 'C2', 'F2', 'A2', 'C3'], 'C': ['C2', 'G2', 'C3', 'E3', 'G3'], 'G': ['G1', 'D2', 'G2', 'B2', 'D3'],
      'Dm': ['D2', 'A2', 'D3', 'F3', 'A3'], 'E': ['E2', 'B2', 'E3', 'G#3', 'B3'], 'Em': ['E2', 'B2', 'E3', 'G3', 'B3'], 'Fmaj7': ['F1', 'C2', 'E2', 'A2', 'C3'],
      'Bdim': ['B1', 'F2', 'B2', 'D3', 'F3'], 'Esus': ['E2', 'B2', 'E3', 'A3', 'B3']}
P_GLASS = ['Am', 'F', 'Dm', 'E']
P_TOWN = ['Am', 'F', 'C', 'G']
P_HOME = ['C', 'Am', 'F', 'G']
P_FEAR = ['Am', 'Am', 'F', 'E']
GLASS_M = ['E5', 'B5', 'G5', 'F#5']
GLASS_J = ['E5', 'B5', 'G5', 'A5']
FATHER = [(0, 'E4', 1), (1, 'G4', 1), (2, 'C5', 2), (4, 'B4', 1), (5, 'A4', 1), (6, 'G4', 2), (8, 'A4', 1), (9, 'C5', 1), (10, 'E5', 2), (12, 'D5', 3)]
PIP = [(0, 'A5', .5), (.5, 'B5', .5), (1, 'C6', 1), (2, 'E6', 1.5), (3.5, 'D6', .5), (4, 'C6', 1), (5, 'B5', 1), (6, 'A5', 2)]

def melody(t0, inst, notes, vel=.45, pan=.1, tr=0, rate=1.0, leg=.92):
    for b, p, d in notes:
        if p: ev(t0 + b * B / rate, inst, m(p) + tr, d * B / rate * leg, vel, pan, attack=.05)
def glass(t0, vel=.5, tr=0, major=False, big=False, step=.75):
    for i, p in enumerate(GLASS_J if major else GLASS_M):
        t = t0 + i * B * step; pp = m(p) + tr
        ev(t, 'glass', pp, 2.6, vel, .15); ev(t, 'harp', pp - 12, 1.6, vel * .55, -.2)
    if big:
        for p in CH['C' if major else 'Am']: ev(t0 + 3 * B * step, 'violins' if m(p) >= 55 else 'cellos', m(p) + 12, BAR * 2, vel * .45, 0, attack=.5)
def pad(t0, t1, prog, vel=.16, upper='violas', low='cellos', att=.7, tr=0):
    i = 0; s = t0
    while s < t1 - .3:
        c = CH[prog[i % len(prog)]]; L = min(BAR, t1 - s)
        if low: ev(s, low, m(c[0]) + 12 + tr, L * 1.04, vel, -.2, attack=att)
        if upper: ev(s, upper, m(c[3]) + 12 + tr, L * 1.04, vel * .8, .25, attack=att); ev(s, upper, m(c[4]) + 12 + tr, L * 1.04, vel * .7, .35, attack=att)
        i += 1; s += BAR
def harp(t0, t1, prog, vel=.22, tr=0, per=8):
    i = 0; s = t0
    while s < t1 - .2:
        c = [m(x) + 12 + tr for x in CH[prog[i % len(prog)]][1:]]; seq = [c[0], c[1], c[2], c[3], c[2], c[1], c[2], c[3]]
        for k in range(per):
            t = s + k * BAR / per
            if t < t1: ev(t, 'harp', seq[k % 8], 1.4, vel * (1 if k == 0 else .76), .3)
        i += 1; s += BAR
def cable(t0, t1, prog, vel=.16, per=4, cresc=0.0, inst='cellos_pizz'):
    """The funicular: a pizzicato pulse (per bar), the root in the contrabass on 1."""
    n = int((t1 - t0) / (BAR / per))
    for k in range(n):
        t = t0 + k * BAR / per; i = int((t - t0) // BAR); c = CH[prog[i % len(prog)]]; u = k / max(1, n - 1)
        v = vel * (1 + cresc * u) * (1.15 if k % per == 0 else .85)
        ev(t, inst, m([c[1], c[2], c[1], c[3]][k % 4]) + 12, .3, v, .2)
        if k % per == 0: ev(t, 'contrabass_pizz', m(c[0]) + 12, .6, v * 1.2, -.2)
def drone(t0, dur, note, vel=.12, inst='cellos', pan=-.15, att=1.5): ev(t0, inst, note, dur, vel, pan, attack=att)
def trem(t0, dur, notes, vel=.1, cresc=1.0, inst='violins', rate=.125):
    n = int(dur / rate)
    for k in range(n):
        u = k / max(1, n - 1)
        for j, p in enumerate(notes): ev(t0 + k * rate, inst, p, rate * 1.6, vel * (1 + (cresc - 1) * u) * (.9 + .2 * ((k + j) % 2)), .2 - .1 * j)
def hit(t, vel=.6, chord='Am', cym=True):
    c = CH[chord]
    ev(t, 'timpani', c[0] if m(c[0]) >= m('F2') else S.name(m(c[0]) + 12), 2.0, vel, 0)
    for p in c[:3]: ev(t, 'cellos', m(p) + 12, 1.8, vel * .7, -.2, attack=.01)
    ev(t, 'contrabass', m(c[0]) + 12, 2.2, vel * .6, -.1, attack=.01)
    for p in c[3:5]: ev(t, 'horn', m(p) + 12, 2.0, vel * .55, .1, attack=.02)
    for p in c[2:5]: ev(t, 'violins', m(p) + 24, 1.4, vel * .5, .25, attack=.01)
    if cym: ev(t - .02, 'sus_cymbal', None, None, vel * .45, 0)
def heart(t0, n, gap=.95, vel=.22, note='A2'):
    for i in range(n): ev(t0 + i * gap, 'timpani', note, .6, vel, 0); ev(t0 + i * gap + .22, 'timpani', note, .5, vel * .6, 0)
def bells(t0, n, gap, notes, vel=.22, inst='glockenspiel'):
    for i in range(n): ev(t0 + i * gap, inst, notes[i % len(notes)], 1.4, vel * (.8 + .2 * (i % 3 == 0)), (i % 5 - 2) * .2)
def V(i): return VO[i]

# ===== Cold open: steam, the wipe, the older face =====
drone(.3, A('title') - .6, 'A1', vel=.08, inst='contrabass', pan=0)
ev(.6, 'violins', 'E6', 8.0, .06, .3, attack=2.0)                                 # a high harmonic, held
glass(T['wipe'] + 1.6, vel=.5)                                                     # the face behind the steam
drone(T['wipe'] + 2.0, 14, 'A2', vel=.1, inst='violas', pan=.2)
ev(T['recoil'], 'timpani', 'A2', 1.5, .4, 0); ev(T['recoil'], 'sus_cymbal', None, None, .22, 0)
trem(T['recoil'] + .2, 5.0, [m('E4'), m('F4')], vel=.07, cresc=1.6)
heart(V('s01') - .2, 4, vel=.16)
for i, p in enumerate(['E5', 'B5']): ev(T['write'] + i * .9, 'glass', p, 2.2, .3, .2)      # 5 … 1
ev(T['write'] + 1.9, 'glass', 'F6', 3.2, .26, -.1); ev(T['write'] + 1.9, 'glass', 'E6', 3.2, .3, .2)   # the rub
trem(V('n04') - .5, A('title') - V('n04') + .4, [m('A3'), m('A#3')], vel=.08, cresc=3.0, inst='cellos')
for k in range(8): ev(A('title') - 4.0 + k * .5, 'violins', m('E5') + k, .5, .08 + .03 * k, .2, attack=.02)
# ===== Title: a hit, the father's line on horn over the cable =====
hit(A('title'), vel=.7, chord='Am')
melody(A('title') + .9, 'horn', FATHER[:7], vel=.42, pan=-.05, tr=-12)
glass(A('title') + 5.4, vel=.3, tr=12)
cable(A('title') + 1.0, Bn('title'), ['Am', 'F'], vel=.1)
# ===== Ch I: the town, the funicular =====
harp(A('hill'), Bn('hill'), P_TOWN, vel=.2)
cable(A('hill') + BAR, Bn('hill'), P_TOWN, vel=.14, per=4)
pad(A('hill'), Bn('hill'), P_TOWN, vel=.12)
melody(A('hill') + 2 * BAR, 'clarinet', FATHER, vel=.24, pan=.2)
ev(V('n07') + 3.5, 'violin', 'A5', 2.0, .16, .3)                                  # "Pip."
# the test, the inventory: bowed glass, no pulse
pad(A('test'), Bn('inventory'), P_GLASS, vel=.1, upper='vibraphone_bowed', low='cellos', att=1.2, tr=0)
glass(T['raise'] + .6, vel=.38)
ev(V('n09') + 1.0, 'glass', 'E6', 2.0, .18, .3); ev(V('n09') + 4.5, 'glass', 'E6', 2.0, .18, -.3)     # left … right
ev(V('n10') + 6.0, 'horn', 'A3', 3.6, .16, 0, attack=.6)
for k, p in enumerate(['A4', 'C5', 'E5', 'D5', 'F5', 'E5']): ev(A('inventory') + 1 + k * 2.8, 'harp', p, 1.6, .16, .3)
ev(V('n13') + .4, 'cellos', 'F2', 4.0, .2, -.2, attack=.3); ev(V('n13') + .4, 'violas', 'B3', 4.0, .12, .2, attack=.3)
# the marks: a pad alone, one glass note per birthday, climbing; then nothing
drone(A('marks'), Bn('marks') - A('marks'), 'A2', vel=.09, inst='violas', pan=.2)
DN = {e['id']: e for e in E['ev'] if e['type'] == 'voice'}
D14 = json.load(open(os.path.join(HERE, 'voices', 'dur.json')))['n14']
for k, f in enumerate([.52, .62, .72, .82, .93]): ev(V('n14') + D14 * f, 'glass', ['A4', 'B4', 'C5', 'D5', 'E5'][k], 1.8, .14, .2)   # 5 6 7 8 9
for k, key in enumerate(['k10', 'k11', 'k12', 'k13', 'k14', 'k15']): ev(T[key], 'glass', ['C5', 'D5', 'F5', 'G5', 'A5', 'B5'][k], 2.2, .24 + .03 * k, .2)
ev(T['k12'], 'harp', 'F3', 2.0, .25, -.2)
# Pip comes in: warmth
harp(A('pip1') + 1.0, V('n18'), P_HOME, vel=.15, per=4)
melody(V('p01') + .2, 'violin', PIP[:5], vel=.2, pan=.3)
ev(V('n19') - .1, 'glass', 'F6', 3.0, .26, .2); ev(V('n19') - .1, 'cellos', 'F2', 4.0, .16, -.2, attack=.2)   # nobody there
pad(V('s03') - .5, Bn('pip1'), ['Dm', 'E'], vel=.1)
# ===== Ch II: fear. The cable tightens; a timpani on every ban =====
hit(A('board') + .1, vel=.42, chord='Am', cym=False)
cable(A('board') + 1.0, Bn('booth'), P_FEAR, vel=.16, per=8, cresc=.6, inst='violins_pizz')
pad(A('board'), Bn('booth'), P_FEAR, vel=.11, upper='violas')
for k in ('s04', 's05', 's06', 's07'): ev(V(k) - .05, 'timpani', 'A2', 1.2, .34, 0); ev(V(k) - .05, 'contrabass', 'A1', 1.5, .2, -.1, attack=.01)
ev(T['doorShut'] - .3, 'timpani', 'E2', 1.6, .45, 0)
melody(V('o01') + .2, 'oboe', [(0, 'C5', 1), (1, 'B4', 1), (2, 'A4', 2)], vel=.18)
# the mornings: the glass motif a semitone lower each time
drone(A('mornings'), Bn('mornings') - A('mornings'), 'A1', vel=.1, inst='contrabass', pan=0)
for k, tr in (('m14', 0), ('m13', -1), ('m12', -2)): glass(T[k] - .05, vel=.34, tr=tr, step=.4)
trem(V('n24') - .3, Bn('mornings') - V('n24') + .2, [m('E3'), m('F3')], vel=.07, cresc=2.0, inst='violas')
# the kitchen: Pip's violin; then almost nothing
pad(A('kitchen'), V('s08'), ['F', 'C'], vel=.08, upper='violas', low=None)
melody(V('p06') + .4, 'violin', PIP, vel=.22, pan=.3)
ev(V('s08') + .02, 'timpani', 'A2', .8, .3, 0)
ev(V('p07') + .4, 'violin', 'A5', 4.0, .08, .3, attack=1.0)
ev(T['doorSlam'] - .15, 'timpani', 'E2', 1.2, .34, 0)
# ===== Ch III: the letter. One held note, then silence and a heartbeat =====
drone(A('letter') + .5, T['letterCard'] - A('letter'), 'E3', vel=.1, inst='violas', pan=.2)
glass(V('n26') + 1.0, vel=.3, step=.6)
ev(T['hmirror'], 'glass', 'B5', 2.5, .24, .2)
ev(T['letterCard'] + 1.9, 'glass', 'E6', 3.5, .3, 0)                                # the page turns the right way round
heart(T['letterCard'] + 4.0, 2, gap=.95, vel=.24)
drone(V('n29') - .1, Bn('letter') - V('n29'), 'A1', vel=.12, inst='contrabass', pan=0)
ev(V('n30') + 3.2, 'cellos', 'F2', 3.4, .22, -.2, attack=.1); ev(V('n30') + 3.2, 'violas', 'B3', 3.4, .14, .2, attack=.1)   # "Because of him."
# the two Sams: the father's line, alone, softly
melody(A('sit') + .8, 'horn', FATHER, vel=.24, pan=0, tr=-12, rate=1.0)
pad(A('sit') + .8, Bn('sit'), ['Am', 'F', 'C'], vel=.08)
# the festival: a folk band from the square (an L-cut runs it under "You always say after")
f0, f1 = A('festival'), Bn('festival') + 1.5
fb = B / 2
k = 0; t = f0
DANCE = ['E5', 'A5', 'B5', 'C6', 'B5', 'A5', 'G5', 'A5', 'E5', 'G5', 'A5', 'B5', 'C6', 'D6', 'B5', 'A5']
while t < f1:
    gl = .7 if t < T['pipGo'] else max(0, .7 - (t - T['pipGo']) * .25)
    if k % 2 == 0: ev(t, 'recorder', DANCE[(k // 2) % 16], fb * 1.8, .22 * gl, .35)
    if k % 4 == 0: ev(t, 'frame_drum', None, None, .26 * gl, -.3)
    elif k % 4 == 2: ev(t, 'frame_drum', None, None, .14 * gl, -.3)
    if k % 8 == 0:
        c = CH[['Am', 'G', 'F', 'E'][(k // 8) % 4]]
        for j, p in enumerate(c[1:]): ev(t + j * .03, 'guitar_nylon', m(p) + 12, BAR / 2, .18 * gl, -.1)
    t += fb; k += 1
# ===== Ch IV: the storm =====
drone(A('engine'), Bn('engine') - A('engine'), 'A1', vel=.12, inst='contrabass', pan=0)
cable(A('engine') + .5, Bn('engine'), ['Am', 'Am', 'F', 'E'], vel=.13, per=4)
ev(T['ring'], 'glass', 'B5', 1.0, .14, .3)
# depart: the storm drive builds, then a hard stop at the blackout
cable(A('depart'), T['blackout'], ['Am', 'F'], vel=.2, per=8, cresc=1.0, inst='cellos_pizz')
trem(A('depart'), T['blackout'] - A('depart'), [m('A3'), m('E4')], vel=.09, cresc=2.2, inst='violins')
for k in range(int((T['blackout'] - A('depart')) / B)): ev(A('depart') + k * B, 'timpani', 'A2', .8, .25 + .05 * k, 0)
hit(T['flash'], vel=.55, chord='Dm')
# (hard stop below) — then only the wind, until a low pad creeps back under the car
pad(A('car1') + .5, Bn('eh2'), ['Am', 'Am'], vel=.07, upper='vibraphone_bowed', low='contrabass', att=2.0)
# the climb: slow heartbeat timpani, a low string pad, the father and Pip answering
heart(A('climb') + .3, int((Bn('climb') - A('climb')) / 2.6), gap=2.6, vel=.12)
pad(A('climb'), Bn('climb'), ['Am', 'F', 'Dm', 'E'], vel=.1, upper='violas', low='cellos', att=1.5)
melody(V('s14') - .2, 'horn', [(0, 'E4', 1), (1, 'G4', 1), (2, 'C5', 2)], vel=.22, tr=-12)
melody(V('p12') + .3, 'violin', PIP, vel=.24, pan=.3, rate=.85)
ev(V('n36') + .5, 'horn', 'C4', 4.0, .16, -.1, attack=.8)
# the loop: tender strings and harp
pad(A('loop'), T['three'], ['F', 'C', 'G', 'Am', 'F', 'C', 'Dm', 'G'], vel=.11)
harp(V('s15') - .3, T['three'] - .2, ['F', 'C', 'G', 'Am'], vel=.13, per=4)
for k, key in enumerate(['p13', 'p14']): ev(V(key) + .1, 'violin', ['A5', 'G5'][k], 1.6, .12, .3)
trem(V('s19') - .2, T['three'] - V('s19') + .2, [m('G3'), m('B3'), m('D4')], vel=.07, cresc=2.5, inst='violas')
for k in range(3): ev(V('s19') + V('s19') * 0 + (T['three'] - V('s19')) * (k + 1) / 3 - .1, 'timpani', 'G2', .8, .18 + .07 * k, 0)
# the release: the glass motif and the father's line together, in C, a harp glissando, the strings
r0 = T['three'] + .1
for k in range(12): ev(r0 - .6 + k * .05, 'harp', m('C4') + [0, 2, 4, 5, 7, 9, 11, 12, 14, 16, 17, 19][k], 1.5, .18, .2)
hit(r0, vel=.45, chord='C', cym=True)
glass(r0 + .4, vel=.42, major=True, big=True)
melody(r0 + 2.2, 'horn', FATHER, vel=.34, pan=-.1, tr=-12)
melody(r0 + 2.2, 'violin', [(b * 1.0, p, d) for b, p, d in FATHER], vel=.2, pan=.3, tr=12)
pad(r0, Bn('release'), ['C', 'G', 'Am', 'F', 'C', 'G', 'F', 'C'], vel=.18, upper='violins')
harp(r0 + BAR, Bn('release'), ['C', 'G', 'Am', 'F'], vel=.15)
# power: the lights come on from the bottom up — bells and a rising C major
pad(A('power'), Bn('wheel'), ['C', 'F', 'C', 'G'], vel=.14, upper='violins')
bells(T['powerOn'] + .5, 14, .27, ['C6', 'E6', 'G6', 'C7', 'D6', 'G6', 'E6'], vel=.2)
ev(T['powerOn'] + .3, 'tubular_bells', 'C5', 4.0, .18, 0)
cable(A('wheel') + .2, Bn('wheel'), ['C', 'G'], vel=.1, per=4)
ev(V('p16') + .5, 'glockenspiel', 'G6', 1.0, .2, .3)
# ===== Ch V: ten years — the glass in a gentle lilt, the violin and the horn together =====
f0 = A('final')
harp(f0 + .8, Bn('final'), ['C', 'Am', 'F', 'G'], vel=.15, per=6)
glass(V('n41') + .2, vel=.26, major=True)
ev(T['k19'], 'glass', 'C6', 2.4, .3, .2)
melody(V('n43') + .4, 'violin', PIP, vel=.18, pan=.3)
melody(V('n44') + .5, 'horn', FATHER[:6], vel=.18, tr=-12)
pad(f0 + .8, Bn('final'), ['C', 'Am', 'F', 'G'], vel=.1)
ev(V('p17') - .1, 'glockenspiel', 'E6', 1.0, .18, .3)
# the end: the whole theme over the dawn wide; the last chord under the title
e0 = A('end')
pad(e0, DUR, ['C', 'Am', 'F', 'G', 'C', 'F', 'G', 'C', 'C', 'C'], vel=.2, upper='violins')
harp(e0, DUR - 3, ['C', 'Am', 'F', 'G'], vel=.17)
melody(e0 + BAR, 'horn', FATHER, vel=.3, tr=-12)
melody(e0 + BAR, 'violin', [(b, p, d) for b, p, d in FATHER], vel=.18, pan=.3, tr=12)
glass(T['endTitle'] - .2, vel=.34, major=True, big=True)
for p in ['C2', 'G2', 'C3', 'E3', 'G3', 'C4']: ev(T['endTitle'] + .2, 'violins' if m(p) >= 55 else 'cellos', p, DUR - T['endTitle'], .2, 0, attack=1.0)
ev(T['endTitle'] + .2, 'timpani', 'C3', 2.0, .26, 0)

# —— Render ——
mus = S.render(EV, dur=DUR, master=False)
N = int(DUR * SR); mus = mus[:N]
def hard_stop(at, until, size=.9):
    cut = int(at * SR)
    tail = np.zeros((int(2.4 * SR), 2), np.float32); tail[:int(.3 * SR)] = mus[cut - int(.3 * SR):cut]
    tail = S.room(tail, size=size, mix=.9)
    mus[cut:int(until * SR)] = 0
    L = min(len(tail) - int(.3 * SR), N - cut)
    mus[cut:cut + L] += tail[int(.3 * SR):int(.3 * SR) + L] * np.linspace(1, 0, L)[:, None]
mus[:int(.3 * SR)] = 0
hard_stop(A('title') - .04, A('title'), .3)                  # the cut to the title hit
hard_stop(T['stop'], A('pip1'), .8)                          # "And then the marks stopped."
hard_stop(T['doorSlam'], A('letter'), .7)                    # the door
hard_stop(T['letterCard'] + .2, T['letterCard'] + 1.9, .6)   # the letter: silence before the page turns
hard_stop(T['letterCard'] + 6.0, V('n29') - .1, .8)          # … and after the heartbeat
hard_stop(T['blackout'], A('car1') + .5, 1.0)                # the power dies
mus = S.room(mus, size=.6, mix=.22)
fade = int(1.6 * SR); mus[-fade:] *= np.linspace(1, 0, fade)[:, None]
mus /= max(1e-6, np.abs(mus).max()) / .9
os.makedirs(os.path.join(HERE, 'out'), exist_ok=True)
sf.write(os.path.join(HERE, 'out', 'score.wav'), mus.astype(np.float32), SR)
used = sorted({e['inst'] for e in EV})
open(os.path.join(HERE, 'out', 'score_instruments.txt'), 'w').write('\n'.join(used))
print('score', DUR, 's', len(EV), 'notes', used)
