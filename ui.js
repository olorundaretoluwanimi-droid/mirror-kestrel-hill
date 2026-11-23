// 2D overlay: chapter cards, title, dialogue boxes (with RADIO / PHONE tags), narration subtitles, the letter and the note, fades.
// Also reports on-screen text for readcheck (window.TEXTS). One metal: gold, plus paper white, over dark plates.
import { VO, CHAPTERS, T, DUR, SHOTS, vo } from './story.js';

const cv = document.getElementById('ov'), g = cv.getContext('2d');
const W = 1920, H = 1080;
let DURS = {};
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const seg = (t, a, b) => clamp((t - a) / (b - a));
const ss = x => { x = clamp(x); return x * x * (3 - 2 * x); };
const GOLD = '#e2c989', GOLD_D = 'rgba(216,190,128,', PAPER = '#f6f0e2', INK = 'rgba(14,10,6,';

export async function overlayReady() {
  await Promise.all(['500 40px Cinzel', '700 40px Cinzel', 'italic 500 40px "Cormorant Garamond"', '600 40px "Cormorant Garamond"', '500 40px "Cormorant Garamond"'].map(f => document.fonts.load(f)));
  DURS = await (await fetch('voices/dur.json')).json();
}
const dur = v => DURS[v.id] || 3;

function ornament(cx, y, w, a, col = GOLD) {
  g.save(); g.globalAlpha = a; g.fillStyle = col; g.lineWidth = 1.5;
  for (const s of [-1, 1]) {
    const gr = g.createLinearGradient(cx, 0, cx + s * w, 0); gr.addColorStop(0, GOLD_D + '1)'); gr.addColorStop(1, GOLD_D + '0)');
    g.strokeStyle = gr; g.beginPath(); g.moveTo(cx + s * 16, y); g.lineTo(cx + s * w, y); g.stroke();
    g.beginPath(); g.arc(cx + s * 26, y, 2.5, 0, 7); g.fill();
  }
  // a small oval mirror in the middle
  g.strokeStyle = col; g.beginPath(); g.ellipse(cx, y, 7, 10, 0, 0, 7); g.stroke(); g.globalAlpha *= .5; g.beginPath(); g.ellipse(cx, y, 3.5, 6, 0, 0, 7); g.fill();
  g.restore();
}
function spaced(text, x, y, sp) {
  const ws = [...text].map(c => g.measureText(c).width), tot = ws.reduce((a, b) => a + b, 0) + sp * (ws.length - 1);
  let cx = x - tot / 2; [...text].forEach((c, i) => { g.fillText(c, cx + ws[i] / 2, y); cx += ws[i] + sp; });
  return tot;
}
function spacedLeft(text, x, y, sp) { const ws = [...text].map(c => g.measureText(c).width); let cx = x; [...text].forEach((c, i) => { g.fillText(c, cx, y); cx += ws[i] + sp; }); return cx - x; }
function glowText(fn, col, blur) { g.save(); g.shadowColor = col; g.shadowBlur = blur; fn(); g.restore(); fn(); }
function corners(x, y, w, h, col) { for (const [cx, cy] of [[x, y], [x + w, y], [x, y + h], [x + w, y + h]]) { g.fillStyle = col; g.beginPath(); g.moveTo(cx, cy - 7); g.lineTo(cx + 7, cy); g.lineTo(cx, cy + 7); g.lineTo(cx - 7, cy); g.fill(); } }
function plate(x, y, w, h, a = .88) {
  const bgr = g.createLinearGradient(0, y, 0, y + h); bgr.addColorStop(0, INK + a + ')'); bgr.addColorStop(1, INK + (a + .04) + ')');
  g.fillStyle = bgr; g.fillRect(x, y, w, h);
  g.strokeStyle = GOLD_D + '.9)'; g.lineWidth = 2; g.strokeRect(x + .5, y + .5, w - 1, h - 1);
  g.strokeStyle = GOLD_D + '.3)'; g.lineWidth = 1; g.strokeRect(x + 7.5, y + 7.5, w - 15, h - 15);
  corners(x, y, w, h, '#ecd8a0');
}

// —— Chapter card ——
const CH_LEN = 5.0;
function chapter(t, c) {
  if (t < c.t || t > c.t + CH_LEN) return null;
  const a0 = ss(seg(t, c.t, c.t + .6)), a1 = ss(seg(t, c.t + .35, c.t + 1.0)), out = 1 - ss(seg(t, c.t + CH_LEN - .6, c.t + CH_LEN));
  g.save();
  const band = g.createLinearGradient(0, 120, 0, 380); band.addColorStop(0, 'rgba(10,6,2,0)'); band.addColorStop(.5, `rgba(10,6,2,${.55 * a0 * out})`); band.addColorStop(1, 'rgba(10,6,2,0)');
  g.fillStyle = band; g.fillRect(0, 120, W, 260);
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.globalAlpha = a0 * out; g.fillStyle = '#ecd9a6'; g.font = '500 32px Cinzel'; spaced('CHAPTER  ' + c.n, W / 2, 196, 10);
  ornament(W / 2, 236, 220 * (.4 + .6 * a0), a0 * out);
  g.globalAlpha = a1 * out; g.fillStyle = PAPER; g.font = 'italic 500 70px "Cormorant Garamond"';
  glowText(() => g.fillText(c.name, W / 2, 300 - (1 - a1) * 10), 'rgba(255,200,110,.35)', 22);
  g.restore();
  return { id: 'ch' + c.n, text: 'CHAPTER ' + c.n + ' ' + c.name, x0: 560, y0: 170, x1: 1360, y1: 340 };
}

// —— Title card (two lines) and end title ——
function titleCard(t, a, b, lines, sub, size) {
  if (t < a || t > b) return null;
  const ain = ss(seg(t, a, a + 1.1)), out = 1 - ss(seg(t, b - .7, b));
  g.save(); g.textAlign = 'center'; g.textBaseline = 'middle';
  g.globalAlpha = ain * out * .45; g.fillStyle = '#0a0602'; g.fillRect(0, 0, W, H);
  g.globalAlpha = ain * out; g.font = `700 ${size}px Cinzel`;
  const y0 = 470 - (lines.length - 1) * size * .62;
  lines.forEach((L, i) => { const y = y0 + i * size * 1.24, gr = g.createLinearGradient(0, y - size / 2, 0, y + size / 2); gr.addColorStop(0, '#fff6dc'); gr.addColorStop(.55, '#ecd08c'); gr.addColorStop(1, '#b08a44'); g.fillStyle = gr; glowText(() => spaced(L, W / 2, y, size * .1), 'rgba(255,196,96,.5)', 36); });
  const oy = y0 + (lines.length - 1) * size * 1.24 + size * .85;
  ornament(W / 2, oy, 330 * (.3 + .7 * ain), ain * out);
  const bA = ss(seg(t, a + .6, a + 1.4));
  if (sub) { g.globalAlpha = bA * out; g.font = 'italic 500 50px "Cormorant Garamond"'; g.fillStyle = PAPER; g.fillText(sub, W / 2, oy + 68); }
  g.restore();
  return [{ id: 'title' + a, text: lines.join(' ') + ' ' + (sub || ''), x0: 260, y0: y0 - size, x1: 1660, y1: oy + 100 }];
}

// —— Dialogue box ——
function wrap(text, maxW) { const words = text.split(' '), lines = []; let cur = ''; for (const w of words) { const n = cur ? cur + ' ' + w : w; if (g.measureText(n).width > maxW && cur) { lines.push(cur); cur = w; } else cur = n; } if (cur) lines.push(cur); return lines; }
const dlgSpan = v => [v.t - .45, Math.max(v.t + dur(v) + 1.6, v.t + (v.who.length + 1 + v.sub.length) / 15 + 1.6)];
const DLG = VO.filter(v => v.dlg).sort((a, b) => a.t - b.t);
function dialog(t, v) {
  let [a, b] = dlgSpan(v); const nx = DLG[DLG.indexOf(v) + 1]; if (nx) b = Math.min(b, nx.t - .45);
  const al = ss(seg(t, a, a + .35)) * (1 - ss(seg(t, b - .35, b)));
  if (al <= 0) return null;
  const bw = 1180, bh = 210, x = (W - bw) / 2, y = H - bh - 58 + (1 - al) * 14;
  g.save(); g.globalAlpha = al; plate(x, y, bw, bh, .84);
  const plateName = v.who + (v.radio ? '  ·  RADIO' : v.phone ? '  ·  PHONE' : '');
  g.font = '600 34px "Cormorant Garamond"'; const nw = g.measureText(plateName).width + 56;
  g.fillStyle = 'rgba(16,11,6,.96)'; g.fillRect(x + 36, y - 26, nw, 50); g.strokeStyle = GOLD_D + '.9)'; g.lineWidth = 1.5; g.strokeRect(x + 36.5, y - 25.5, nw - 1, 49);
  g.fillStyle = v.who === 'Sam' ? '#bfe0a0' : v.who === 'Pip' ? '#ffb0a0' : v.who === 'Odile' ? '#e8c8f0' : '#c8d0e0'; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText(plateName, x + 64, y - 1);
  g.font = '500 46px "Cormorant Garamond"'; g.fillStyle = PAPER;
  const n = v.sub.length, shown = Math.floor(n * clamp((t - v.t + .05) / (dur(v) * .9)));
  const lines = wrap(v.sub, bw - 150); let k = shown;
  lines.forEach((L, i) => { const s = L.slice(0, Math.max(0, k)); k -= L.length + 1; g.fillText(s, x + 72, y + 80 + i * 60); });
  if (shown >= n && Math.floor(t * 2.5) % 2 === 0) { g.fillStyle = '#ecd8a0'; const tx = x + bw - 56, ty = y + bh - 38; g.beginPath(); g.moveTo(tx - 9, ty - 5); g.lineTo(tx + 9, ty - 5); g.lineTo(tx, ty + 6); g.fill(); }
  g.restore();
  return { id: v.id, text: v.who + ' ' + v.sub, x0: x, y0: y - 26, x1: x + bw, y1: y + bh };
}

// —— Narration subtitle (two lines for long clips) ——
export const subSpan = v => { const nx = VO.filter(w => w.t > v.t).sort((a, b) => a.t - b.t)[0]; return [v.t - .35, Math.min(v.t + dur(v) + .7, nx ? nx.t - .4 : 1e9)]; };
function subtitle(t, v) {
  const [a, b] = subSpan(v), al = ss(seg(t, a, a + .3)) * (1 - ss(seg(t, b - .35, b)));
  if (al <= 0) return null;
  g.save(); g.globalAlpha = al; g.textAlign = 'center'; g.textBaseline = 'alphabetic'; g.font = 'italic 500 50px "Cormorant Garamond"';
  const lines = g.measureText(v.sub).width > 1500 ? wrap(v.sub, 1300) : [v.sub];
  const y1 = H - 84, y0 = y1 - (lines.length - 1) * 58, tw = Math.max(...lines.map(L => g.measureText(L).width));
  const sh = g.createLinearGradient(0, y0 - 70, 0, y1 + 40); sh.addColorStop(0, 'rgba(0,0,0,0)'); sh.addColorStop(.5, 'rgba(0,0,0,.52)'); sh.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = sh; g.fillRect(W / 2 - tw / 2 - 160, y0 - 70, tw + 320, y1 - y0 + 110);
  g.shadowColor = 'rgba(0,0,0,.9)'; g.shadowBlur = 10; g.shadowOffsetY = 2; g.fillStyle = PAPER;
  lines.forEach((L, i) => g.fillText(L, W / 2, y0 + i * 58));
  g.restore();
  return { id: v.id, text: v.sub, x0: W / 2 - tw / 2, y0: y0 - 50, x1: W / 2 + tw / 2, y1: y1 + 14 };
}

// —— Fades: a short dip to black wherever the film changes place (flat ↔ hill ↔ engine house); cuts inside a place are hard ——
const PLACE = { open: 'F', test: 'F', inventory: 'F', marks: 'F', pip1: 'F', mornings: 'F', kitchen: 'F', letter: 'F', sit: 'F', final: 'F', engine: 'E', eh2: 'E', wheel: 'E' };
const FADES = [];
for (let i = 1; i < SHOTS.length; i++) { const a = SHOTS[i - 1], b = SHOTS[i]; if ((PLACE[a.id] || 'H') !== (PLACE[b.id] || 'H') && b.id !== 'title' && a.id !== 'title') FADES.push([b.a, .35, .45]); }
FADES.push([SHOTS.find(s => s.id === 'hill').a, .4, .6]);
function blackout(t) {
  let a = 1 - ss(seg(t, 0, .6));
  for (const [c, o, i] of FADES) { if (t < c && t > c - o) a = Math.max(a, ss((t - (c - o)) / o)); if (t >= c && t < c + i) a = Math.max(a, 1 - ss((t - c) / i)); }
  a = Math.max(a, ss(seg(t, DUR - 1.4, DUR - .05)));
  if (a > 0) { g.fillStyle = `rgba(0,0,0,${a})`; g.fillRect(0, 0, W, H); }
  // the lightning lifts the whole frame for a moment
  const d = t - T.flash; if (d > 0 && d < .3) { g.fillStyle = `rgba(220,230,255,${(d < .06 ? d / .06 : 1 - (d - .06) / .24) * .35})`; g.fillRect(0, 0, W, H); }
}

// —— Paper cards: the letter (first seen backwards, then turned the right way round in the shaving mirror) and the note on the glass ——
function paperCard(t, a, b, lines, o = {}) {
  if (t < a || t > b) return null;
  const al = ss(seg(t, a, a + .6)) * (1 - ss(seg(t, b - .6, b)));
  const flip = o.flip ? lerp(-1, 1, ss(seg(t, a + o.flip[0], a + o.flip[1]))) : 1;
  const w = o.w ?? 880, h = o.h ?? 560, cx = W / 2, cy = o.cy ?? 470;
  g.save(); g.globalAlpha = al * .55; g.fillStyle = '#000'; g.fillRect(0, 0, W, H); g.globalAlpha = al;
  g.translate(cx, cy); g.rotate(o.rot ?? -.015); g.scale(Math.max(.02, Math.abs(flip)) * Math.sign(flip || 1), 1);
  g.shadowColor = 'rgba(0,0,0,.6)'; g.shadowBlur = 30; g.shadowOffsetY = 10;
  const pg = g.createLinearGradient(0, -h / 2, 0, h / 2); pg.addColorStop(0, '#f2ead6'); pg.addColorStop(1, '#e4d8bc'); g.fillStyle = pg; g.fillRect(-w / 2, -h / 2, w, h);
  g.shadowColor = 'transparent';
  g.strokeStyle = 'rgba(120,140,190,.35)'; g.lineWidth = 1.5; for (let y = -h / 2 + 90; y < h / 2 - 30; y += 62) { g.beginPath(); g.moveTo(-w / 2 + 40, y + 14); g.lineTo(w / 2 - 40, y + 14); g.stroke(); }
  g.fillStyle = '#2a2a48'; g.font = `italic 500 ${o.size ?? 50}px "Cormorant Garamond"`; g.textAlign = 'left'; g.textBaseline = 'alphabetic';
  lines.forEach((L, i) => g.fillText(L, -w / 2 + 60, -h / 2 + 98 + i * 62));
  g.restore();
  return flip > .6 ? { id: 'card' + a, text: lines.join(' '), x0: cx - w / 2, y0: cy - h / 2, x1: cx + w / 2, y1: cy + h / 2 } : { id: 'card' + a + 'flip', text: 'mirrored card turning', x0: cx - w / 2, y0: cy - h / 2, x1: cx + w / 2, y1: cy + h / 2, pass: true };
}
const lerp = (a, b, k) => a + (b - a) * k;
const LETTER_ = ['Dad —', 'I’m nineteen now. I’m not coming home', 'this Christmas. I’m fine. I’m happy, even.', 'But you never once asked me', 'what I wanted.', '                                        — Pip'];
const NOTE = ['Back for Christmas.', 'Check car 2’s brake!', '                — P'];

export function drawOverlay(t) {
  g.clearRect(0, 0, W, H);
  const texts = [];
  for (const c of CHAPTERS) { const r = chapter(t, c); if (r) texts.push(r); }
  const tc = titleCard(t, T.title + .2, T.title + 8.8, ['WHAT IF YOUR MIRROR', 'SHOWED YOU IN 10 YEARS?'], 'Kestrel Hill', 92); if (tc) texts.push(...tc);
  const te = titleCard(t, T.endTitle, DUR - .3, ['WHAT IF YOUR MIRROR', 'SHOWED YOU IN 10 YEARS?'], 'Made with code', 84); if (te) texts.push(...te);
  const lc = paperCard(t, T.letterCard, T.letterOff, LETTER_, { flip: [1.4, 2.4] }); if (lc) texts.push(lc);
  const nv = vo('n44'); const nc = paperCard(t, nv.t + .6, T.pipIn2 - .3, NOTE, { w: 560, h: 300, cy: 420, size: 54, rot: .03 }); if (nc) texts.push(nc);
  for (const v of VO) { if (v.dlg) { const r = dialog(t, v); if (r) texts.push(r); } else subtitle(t, v); }
  blackout(t);
  return texts;
}
