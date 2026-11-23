// Timeline: the single source of truth. Built from the script order and the measured voice durations (voices/dur.json),
// so shots, voice lines, chapter cards and story beats always line up. Shots start on the half-bar grid (64 bpm, 4/4).
export const BPM = 64, BAR = 240 / BPM, HALF = BAR / 4;   // shots start on the beat grid
const D = await (await fetch('voices/dur.json')).json();
const LINES = await (await fetch('lines.json')).json();
const SUB = Object.fromEntries(LINES.map(l => [l.id, l.sub]));
const WHO = { s: 'Sam', p: 'Pip', o: 'Odile' };
// radio lines (heard through the handset): a tag on the name plate
const RADIO = new Set(['s11', 'p10', 's12', 'p11', 's13', 's14', 'p12', 'p15', 's20', 'p16']);
const PHONE = new Set(['o03']);

const SEQ = [
  'shot:open', 'T:wipe', 2.4, 'n01', 'n02', 'T:recoil', .7, 's01', .3, 'n03', 'T:write', 2.4, 'n04', 1.2,
  'shot:title', 'T:title', 8.6,
  'shot:hill', 'ch:I:The Man in the Glass', 3.0, 'n05', 'n06', 'n07', 1.2,
  'shot:test', .9, 'T:raise', 'n08', 'n09', 'n10', .6,
  'shot:inventory', .4, 'n11', 'n12', 'n13', .8,
  'shot:marks', .4, 'n14', 'n15', 'n16', 'n17', 'T:stop', 2.8,
  'shot:pip1', 'T:pipIn', 1.4, 'p01', 's02', 'p02', 'n18', 'n19', 1.3, 's03', 'p03', 'n20', 1.6,
  'shot:board', 'ch:II:Fifteen', 3.0, 'n21', .8,
  'shot:lake', .6, 's04', 'p04', .8,
  'shot:sled', .4, 's05', 1.0,
  'shot:door', .4, 'p05', 's06', 'T:doorShut', 1.4,
  'shot:booth', .4, 'o01', 's07', 1.4,
  'shot:mornings', .4, 'n22', 'n23', 'n24', 1.4,
  'shot:kitchen', 1.0, 'p06', 's08', .7, 'p07', 'T:fold', .3, 'n25', 'T:doorSlam', 2.4,
  'shot:letter', 'ch:III:The Letter', 3.0, 'T:letterUp', 'n26', 'n27', 'T:hmirror', 'n28', 'T:letterCard', 14.0, 'T:letterOff', 'n29', 'n30', 1.0,
  'shot:sit', 'T:sitDown', 1.2, 'n31', 2.8,
  'shot:festival', 1.6, 'o02', 's09', 'p08', 's10', 'p09', 'T:pipGo', 3.0,
  'shot:engine', 'ch:IV:The Storm', 3.0, 'n32', 'T:ring', 1.6, 'o03', 1.2,
  'shot:depart', 'T:storm', 4.0, 'T:flash', .5, 'T:blackout', 2.6, 'n33', 'n34', 1.4,
  'shot:car1', .4, 's11', 'p10', .8,
  'shot:eh2', .3, 's12', 'T:goOut', 1.2,
  'shot:climb', .6, 'p11', 's13', 'n35', 's14', 'p12', 'n36', 1.2,
  'shot:loop', .6, 'n36b', 'T:climbIn', 1.6, 's15', 's16', 'p13', 's17', 'p14', 's18', 'n37', 's19', 'T:release', 1.4,
  'shot:release', 2.6, 'n38', 'n39', 'T:glideEnd', 3.4,
  'shot:power', 'T:powerOn', 5.0,
  'shot:wheel', .5, 'p15', 's20', 'p16', 2.2,
  'shot:final', 'ch:V:Ten Years', 3.0, 'n40', 'T:look', 'n41', 'n42', 'n43', 'n44', 'T:note', 'n45', 1.4, 'T:pipIn2', 'p17', 's21', 'T:leave', 2.4,
  'shot:end', 2.0, 'n46', 'n47', 2.2, 'T:endTitle', 9.5,
];
export const T = {}, VO = [], CHAPTERS = [], SHOTS = [];
{
  let t = 0;
  for (const it of SEQ) {
    if (typeof it === 'number') { t += it; continue; }
    const [k, a, b] = it.split(':');
    if (k === 'shot') { if (SHOTS.length) { t = Math.ceil((t - 1e-6) / HALF) * HALF; SHOTS[SHOTS.length - 1].b = t; } SHOTS.push({ id: a, a: t, b: t }); continue; }
    if (k === 'T') { T[a] = t; continue; }
    if (k === 'ch') { CHAPTERS.push({ t: t + .2, n: a, name: b }); continue; }
    const d = D[it]; if (d == null) throw new Error('no voice ' + it);
    const who = WHO[it[0]];
    VO.push({ id: it, t, d, sub: SUB[it], ...(who ? { dlg: true, who, radio: RADIO.has(it), phone: PHONE.has(it) } : {}) });
    t += d + (who ? .3 : .42);
  }
  SHOTS[SHOTS.length - 1].b = t;
}
export const DUR = Math.round(SHOTS[SHOTS.length - 1].b * 10) / 10;
SHOTS[SHOTS.length - 1].b = DUR;
export const vo = id => VO.find(v => v.id === id);
export const shot = id => SHOTS.find(s => s.id === id);
export function shotAt(t) { for (const s of SHOTS) if (t >= s.a && t < s.b) return s; return SHOTS[SHOTS.length - 1]; }
// the morning marks: the counted words inside n23 ("Fourteen. Thirteen. Twelve.")
{ const v = vo('n23'); T.m14 = v.t + v.d * .55; T.m13 = v.t + v.d * .72; T.m12 = v.t + v.d * .88; }
{ const v = vo('n15'); T.k10 = v.t + v.d * .45; T.k11 = v.t + v.d * .58; T.k12 = v.t + v.d * .9; }
{ const v = vo('n17'); T.k13 = v.t + v.d * .08; T.k14 = v.t + v.d * .24; T.k15 = v.t + v.d * .4; }
{ const v = vo('n42'); T.k16 = v.t + v.d * .6; T.k17 = v.t + v.d * .76; T.k19 = v.t + v.d * .9; }
// the brake release on "Three." (the end of s19), the cars glide apart over the next shot
{ const v = vo('s19'); T.three = v.t + v.d - .25; }
// the cars: car 1 (Pip) climbs on lane −1, car 2 on lane +1. s1 = car 1's place on the track (0 bottom … 1 top); car 2 is at 1 − s1.
export function carS(t) {
  const sh = shotAt(t);
  if (t < T.storm - 20) return .5 + .48 * Math.sin((t - T.title - 4.5) / 70 * Math.PI * 2);   // daily running: back and forth, passing halfway mid-title
  if (t < shot('depart').a) return .05;
  if (t < T.blackout) return .05 + (.5 - .05) * Math.min(1, (t - shot('depart').a + 26) / (T.blackout - shot('depart').a + 26));
  if (t < T.three) return .5;
  if (t < T.glideEnd + 6) { const k = Math.min(1, Math.max(0, (t - T.three) / (T.glideEnd + 6 - T.three))); return .5 + .5 * k * k * (3 - 2 * k); }
  if (sh.id === 'end') { const k = (t - sh.a) / (sh.b - sh.a); return .12 + .76 * k; }
  return 1;
}
