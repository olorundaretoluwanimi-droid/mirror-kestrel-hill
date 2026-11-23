// Kestrel Hill: the set pieces. Snow textures, pines, houses with instanced windows that can go dark and light again,
// the funicular (two stepped cars, a track with a passing loop exactly halfway, service steps), the stations,
// the engine house with its bull wheel, and Sam and Pip's flat with the hall mirror and the room behind the glass.
import * as THREE from 'three';
import { PX, ramp, h2, fbm, texOf, glow, shingles, plaster, woodPlanks } from './px.js';
import { box, mat, mesh } from './kit.js';
import { cmats, solid, sign } from './city_art.js';
import { clamp, ss, seg, lerp } from '/core/lib.js';

export const C = c => new THREE.Color(c);
export const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
export const stdM = o => new THREE.MeshStandardMaterial({ roughness: .85, ...o });
export const TT = (w, h, f) => { const P = new PX(w, h); P.fill(f); return P.done(); };

// —— Hill geometry: a straight slope rising toward −z ——
export const HILL = { H: 48, LZ: 80 };
export const ANG = Math.atan2(HILL.H, HILL.LZ);
export const yAt = z => HILL.H * clamp(-z / HILL.LZ);
// the passing loop: the two lanes split around s = .5
const bump = s => ss(seg(s, .36, .45)) * (1 - ss(seg(s, .55, .64)));
export const laneX = (s, lane) => 1.6 * lane * bump(s);
export const trackPt = (s, lane, up = .45) => V3(laneX(s, lane), s * HILL.H + up, -s * HILL.LZ);
export const STEPX = 4.2;   // the service steps, on the +x side

// —— Materials ——
const MAT = {};
export function smats() {
  if (MAT.ok) return MAT;
  const R = ramp(['#8a96b0', '#a8b4cc', '#c6d0e2', '#e2e8f2', '#f6f8fc'], .45);
  MAT.snow = mat(TT(96, 96, (x, y) => R(.62 + (fbm(x * .06, y * .06, 3) - .5) * .45 + (h2(x, y, 9) > .985 ? .3 : 0) - (fbm(x * .2, y * .2, 5) > .7 ? .12 : 0), x, y)));
  const RI = ramp(['#4a6a86', '#6a8eaa', '#8cb0c8', '#b4d0e0', '#dcecf4'], .45);
  MAT.ice = mat(TT(96, 96, (x, y) => { const cr = Math.abs(fbm(x * .04, y * .04, 11) - .5) < .012 || Math.abs(fbm(x * .05 + 4, y * .03, 12) - .5) < .01; return RI(cr ? .95 : .45 + (fbm(x * .03, y * .08, 13) - .5) * .5, x, y); }), { rough: .25 });
  MAT.roofSnow = mat(shingles(96, 96, { seed: 4, cols: ['#6a7488', '#909aae', '#b4bccc', '#d4dae6', '#eef2f8'] }));
  MAT.roofDark = mat(shingles(96, 96, { seed: 7, cols: ['#1a1418', '#2c2228', '#40343a', '#56484c', '#6c5e60'] }));
  MAT.wallA = mat(plaster(96, 96, { seed: 3, wall: ['#7a5a4a', '#94705c', '#ac8870', '#c2a086'], beams: [{ t: 'h', y: 0 }, { t: 'v', x: 0 }, { t: 'v', x: 48 }] }));
  MAT.wallB = mat(plaster(96, 96, { seed: 8, wall: ['#5e6a7a', '#76828e', '#909aa4', '#a8b0b8'], beams: [{ t: 'h', y: 0 }, { t: 'h', y: 48 }, { t: 'v', x: 0 }, { t: 'v', x: 32 }, { t: 'v', x: 64 }] }));
  MAT.wallC = mat(plaster(96, 96, { seed: 12, wall: ['#8a7a5a', '#a49270', '#bcaa86', '#d2c29c'], beams: [{ t: 'h', y: 0 }, { t: 'v', x: 0 }, { t: 'v', x: 48 }] }));
  MAT.wallD = mat(plaster(96, 96, { seed: 15, wall: ['#7a4a46', '#94605a', '#ac7870', '#c29086'], beams: [{ t: 'h', y: 0 }, { t: 'v', x: 0 }, { t: 'v', x: 96 }] }));
  MAT.beam = mat(woodPlanks(48, 48, { pw: 48, len: 96, seed: 6, nails: false, cols: ['#1a0f0b', '#2a1a12', '#3e2618', '#533420'] }));
  MAT.plank = mat(woodPlanks(96, 96, { pw: 6, len: 48, seed: 2 }));
  MAT.stone = cmats().stone; MAT.gravel = cmats().gravel; MAT.metal = cmats().metal; MAT.rail = cmats().rail; MAT.dark = cmats().dark; MAT.wood = cmats().wood;
  MAT.carBody = solid(['#0e3a40', '#16525a', '#206a72', '#2e848a'], 41);      // the cars: teal and cream
  MAT.carCream = solid(['#8a8270', '#aaa28c', '#c8c0a8', '#e2dcc6'], 43);
  MAT.red = solid(['#4a0a0a', '#7a1410', '#a42418', '#c83a28'], 53);
  MAT.iron = solid(['#141416', '#222226', '#323238', '#46464e'], 57);
  MAT.brass = solid(['#4a3410', '#7a5a1e', '#a8822e', '#d0aa4a'], 59);
  MAT.ok = true; return MAT;
}

// —— Windows: instanced panes with lamp light; each can go dark at `off` and come back at `on` ——
function winTex() {
  const P = new PX(10, 14), F = ramp(['#26201c', '#3a302a', '#50443a'], .3);
  P.fill((x, y) => { if (x === 0 || x === 9 || y === 0 || y === 13) return F(.6, x, y); if (x === 5 || y === 6) return F(.35, x, y); const v = .78 + (1 - y / 14) * .22 - h2(x, y, 3) * .12; const c = Math.round(255 * Math.min(1, v)); return [c, c, c]; });
  return texOf(P.done());
}
export class Windows {
  constructor(max = 3000) {
    this.list = []; this.mesh = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: winTex(), color: '#ffffff' }), max);
    this.mesh.count = 0; this.mesh.frustumCulled = false; this.c = new THREE.Color(); this.m4 = new THREE.Matrix4(); this.q = new THREE.Quaternion();
  }
  add(p, ry, w, h, o = {}) {
    const i = this.list.length; this.q.setFromAxisAngle(V3(0, 1, 0), ry);
    this.m4.compose(p.clone ? p.clone() : V3(...p), this.q, V3(w, h, 1)); this.mesh.setMatrixAt(i, this.m4);
    this.list.push({ p: p.clone ? p.clone() : V3(...p), lamp: o.lamp ?? true, seed: i, off: o.off ?? Infinity, on: o.on ?? Infinity, warm: o.warm ?? 1 }); this.mesh.count = this.list.length;
  }
  // o.night 0..1; o.day = glass tint by day; o.power(t, w) → 0..1 (1 = lit)
  update(t, o = {}) {
    const night = o.night ?? 0, day = o.day;
    this.list.forEach((w, i) => {
      let r = .06, g = .065, b = .08;
      if (day) { const v = .7 + .3 * h2(i, 3, 7); r = day[0] * v; g = day[1] * v; b = day[2] * v; }
      let pw = 1;
      if (t >= w.off) pw = 0;
      if (t >= w.on) pw = Math.min(1, (t - w.on) / .1);
      if (w.lamp && night > 0) { const k = night * pw * w.warm * (.75 + .25 * h2(i, 5, 1)); r += 2.4 * k; g += 1.45 * k; b += .6 * k; }
      this.c.setRGB(r, g, b); this.mesh.setColorAt(i, this.c);
    });
    this.mesh.instanceColor.needsUpdate = true;
  }
}

// —— Pine: a pixel billboard with snow on the boughs ——
let _pine = null;
export function pineTex() {
  if (_pine) return _pine;
  const W = 24, H = 40, P = new PX(W, H), G = ramp(['#0a1a16', '#123028', '#1c4436', '#2a5a46'], .3), S = ramp(['#a8b4cc', '#d4dcea', '#f4f6fa'], .3);
  for (let y = 0; y < H - 5; y++) {
    const tier = (y % 9) / 9, half = (2 + (y / (H - 5)) * 10) * (.55 + tier * .45);
    for (let x = 0; x < W; x++) { const d = Math.abs(x + .5 - W / 2); if (d > half) continue; const edge = half - d; const snowy = tier < .25 && edge < half * .9 && h2(x, y, 3) > .25; P.set(x, y, snowy ? S(.6 + h2(x, y, 4) * .3, x, y) : G(.35 + (x < W / 2 ? .25 : 0) - tier * .2 + h2(x, y, 5) * .2, x, y)); }
  }
  for (let y = H - 5; y < H; y++) for (let x = 10; x < 14; x++) P.set(x, y, [44, 30, 22]);
  P.outline(.4);
  _pine = texOf(P.done()); return _pine;
}
export function pines(list) {   // list of [x, y, z, h]; one InstancedMesh, turned to the camera each frame
  const geo = new THREE.PlaneGeometry(.6, 1).translate(0, .5, 0);
  const m = new THREE.MeshStandardMaterial({ map: pineTex(), transparent: true, alphaTest: .5, roughness: 1 });
  const me = new THREE.InstancedMesh(geo, m, list.length); me.castShadow = true; me.frustumCulled = false;
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion();
  me.userData.update = cam => { list.forEach(([x, y, z, h], i) => { q.setFromAxisAngle(V3(0, 1, 0), Math.atan2(cam.position.x - x, cam.position.z - z)); m4.compose(V3(x, y, z), q, V3(h, h, h)); me.setMatrixAt(i, m4); }); me.instanceMatrix.needsUpdate = true; };
  return me;
}

// —— House: walls, a snowy gable roof, windows (instanced), a chimney ——
export function house(W, o) {
  const M = smats(), g = new THREE.Group(), { w, d, h } = o, rh = o.rh ?? w * .42;
  const wm = M[o.wall ?? 'wallA'];
  g.add(box(w, h, d, wm));
  const tri = new THREE.Shape([new THREE.Vector2(-d / 2, 0), new THREE.Vector2(d / 2, 0), new THREE.Vector2(0, rh)]);
  for (const s of [-1, 1]) { const tg = new THREE.ShapeGeometry(tri); tg.rotateY(Math.PI / 2 * s); tg.translate(s * w / 2, h, 0); g.add(mesh(tg, wm)); }
  const ov = .35, sl = Math.hypot(d / 2 + ov, rh + ov * rh / (d / 2));
  for (const s of [-1, 1]) { const pg = new THREE.BoxGeometry(w + ov * 2, .2, sl); pg.translate(0, 0, s * sl / 2); const m = mesh(pg, o.dark ? M.roofDark : M.roofSnow); m.rotation.x = s * Math.atan2(rh, d / 2); m.position.set(0, h + rh + .06, 0); g.add(m); }
  if (o.chimney !== false) { const c = box(.6, rh + 1.2, .6, M.stone); c.position.set(w * .25, h, -d * .15); g.add(c); }
  g.position.set(o.x, o.y ?? 0, o.z); g.updateMatrixWorld(true);
  const R = o.rnd;
  const nx = Math.max(1, Math.round(w / 2.2)), fl = Math.max(1, Math.round(h / 2.8));
  for (let f = 0; f < fl; f++) for (let i = 0; i < nx; i++) {
    if (f === 0 && i === Math.floor(nx / 2) && o.door !== false) continue;
    const p = V3(o.x - w / 2 + (i + .5) * w / nx, (o.y ?? 0) + 1.3 + f * 2.7, o.z + d / 2 + .03);
    W.add(p, 0, .8, 1.1, { lamp: R() < (o.lampP ?? .7), off: o.off ? o.off(p) : Infinity, on: o.on ? o.on(p) : Infinity });
  }
  if (o.side) for (let f = 0; f < fl; f++) { const p = V3(o.x + w / 2 + .03, (o.y ?? 0) + 1.3 + f * 2.7, o.z); W.add(p, Math.PI / 2, .8, 1.1, { lamp: R() < .5, off: o.off ? o.off(p) : Infinity, on: o.on ? o.on(p) : Infinity }); }
  if (o.door !== false) { const dm = box(1.0, 2.0, .1, M.beam); dm.position.set(o.x - w / 2 + (Math.floor(nx / 2) + .5) * w / nx - o.x, 0, d / 2 + .03); g.add(dm); }
  return g;
}

// —— Funicular car: a chassis on the slope, three level compartments stepping up it, glass all round ——
export function funCar(num) {
  const M = smats(), g = new THREE.Group(), R = {};
  const L = 1.25, n = 3, dy = L * Math.tan(ANG);
  const chassis = new THREE.Mesh(new THREE.BoxGeometry(1.9, .35, n * L / Math.cos(ANG) + .2), M.iron); chassis.rotation.x = ANG; chassis.position.set(0, .45, 0); chassis.castShadow = true; g.add(chassis);
  const glassM = new THREE.MeshStandardMaterial({ color: '#203040', roughness: .1, metalness: .2, transparent: true, opacity: .22, depthWrite: false, emissive: C('#ffc880'), emissiveIntensity: 0 });
  R.glass = glassM; R.comp = [];
  for (let i = 0; i < n; i++) {
    const c = new THREE.Group(); g.add(c); const z = (i - (n - 1) / 2) * L, y = .7 - (i - (n - 1) / 2) * dy * -1;
    c.position.set(0, .7 + ((n - 1) / 2 - i) * dy * -1 + (n - 1) / 2 * 0, -z); R.comp.push(c);
    const fl = box(1.9, .1, L, M.wood); c.add(fl);
    const low = (x) => { const b = box(.08, .9, L, M.carBody); b.position.set(x, .1, 0); c.add(b); }; low(-.91); low(.91);
    const band = (x) => { const b = box(.1, .14, L, M.carCream, { cast: false }); b.position.set(x, .86, 0); c.add(b); }; band(-.92); band(.92);
    for (const x of [-.91, .91]) for (const zz of [-L / 2 + .05, L / 2 - .05]) { const p = box(.08, 1.2, .08, M.carBody); p.position.set(x, 1.0, zz); c.add(p); }
    const roof = box(2.05, .12, L + .04, M.carCream); roof.position.y = 2.2; c.add(roof);
    for (const x of [-.92, .92]) { const gl = new THREE.Mesh(new THREE.PlaneGeometry(L - .1, 1.1), glassM); gl.rotation.y = Math.PI / 2; gl.position.set(x, 1.6, 0); c.add(gl); }
    if (i === 0 || i === n - 1) { const e = box(1.9, .5, .08, M.carBody); e.position.set(0, .1, (i === 0 ? 1 : -1) * L / 2); c.add(e); const gl = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 1.5), glassM); gl.position.set(0, 1.4, (i === 0 ? 1 : -1) * L / 2); c.add(gl); }
    const seat = box(1.6, .45, .35, M.carCream); seat.position.set(0, .1, L / 2 - .25); c.add(seat);
  }
  // the compartments step up the slope: compartment i (0 = downhill end) sits higher by dy per step toward −z
  R.comp.forEach((c, i) => { c.position.set(0, .7 + (i - 1) * dy, (1 - i) * L); });
  const plate = sign(String(num), .5, .4, { bg: '#e2dcc6', fg: '#16525a', k: .8, font: 'Cinzel' }); plate.position.set(.97, .55, 1.0); plate.rotation.y = Math.PI / 2; g.add(plate);
  const lamp = new THREE.Mesh(new THREE.SphereGeometry(.09, 8, 6), new THREE.MeshBasicMaterial({ color: C('#ffd8a0') })); lamp.position.set(0, 2.05, 0); g.add(lamp); R.bulb = lamp;
  g.userData = R; g.userData.seat = (i = 1) => V3(0, .8 + (i - 1) * dy, (1 - i) * L);
  return g;
}

// —— Engine house interior: the bull wheel (120 teeth), the brake lever, a stove, a desk with the phone and the radio ——
export function engineRoom() {
  const M = smats(), g = new THREE.Group(), R = {};
  const W = 8, D = 5.4, Hh = 4.2;
  const fl = box(W + .4, .12, D + .2, M.plank, { cast: false }); fl.position.set(0, -.12, -.1); g.add(fl);
  const bk = box(W + .4, Hh, .2, M.stone); bk.position.set(0, 0, -D / 2 - .1); g.add(bk);
  const lw = box(.2, Hh, D, M.stone); lw.position.set(-W / 2 - .1, 0, 0); g.add(lw);
  const rw = box(.2, Hh, D, M.stone); rw.position.set(W / 2 + .1, 0, 0); g.add(rw);
  // the window in the back wall (snow outside)
  const win = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.2), new THREE.MeshBasicMaterial({ color: C('#30466a') })); win.position.set(2.4, 2.4, -D / 2 + .005); g.add(win); R.win = win;
  for (const [w, h, x, y] of [[1.8, .1, 2.4, 1.76], [1.8, .1, 2.4, 3.0], [.1, 1.3, 1.5, 1.76], [.1, 1.3, 3.3, 1.76], [.06, 1.2, 2.4, 1.8]]) { const f = box(w, h, .12, M.beam, { cast: false }); f.position.set(x, y, -D / 2 + .05); g.add(f); }
  // the bull wheel: vertical, axle along x, 1.6 m radius, spokes and 120 teeth on the rim
  const wheel = new THREE.Group(); wheel.position.set(-.6, 2.0, -.9); g.add(wheel); R.wheel = wheel;
  const rimGeo = new THREE.TorusGeometry(1.55, .09, 6, 48); const rim = new THREE.Mesh(rimGeo, M.iron); rim.rotation.y = Math.PI / 2; rim.castShadow = true; wheel.add(rim);
  const rim2 = rim.clone(); rim2.position.x = .22; wheel.add(rim2);
  for (let i = 0; i < 8; i++) { const sp = new THREE.Mesh(new THREE.BoxGeometry(.08, 3.0, .1), M.iron); sp.rotation.x = i * Math.PI / 8; sp.position.x = .11; sp.castShadow = true; wheel.add(sp); }
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(.22, .22, .5, 12), M.brass); hub.rotation.z = Math.PI / 2; hub.position.x = .11; wheel.add(hub);
  const teeth = new THREE.InstancedMesh(new THREE.BoxGeometry(.3, .09, .06), M.brass, 120); const m4 = new THREE.Matrix4(), q = new THREE.Quaternion();
  for (let i = 0; i < 120; i++) { const a = i / 120 * Math.PI * 2; q.setFromAxisAngle(V3(1, 0, 0), a); m4.compose(V3(.11, Math.cos(a) * 1.68, Math.sin(a) * 1.68), q, V3(1, 1, 1)); teeth.setMatrixAt(i, m4); }
  wheel.add(teeth);
  const axle = box(.24, .24, .24, M.iron); axle.position.set(-.6 - .5, 1.88, -.9); g.add(axle);
  for (const x of [-1.25, .05]) { const st = box(.3, 2.0, .5, M.iron); st.position.set(x, 0, -.9); g.add(st); }
  // the cable leaves the wheel through a slot in the floor toward the hill
  const cab = box(.05, .05, 2.6, M.dark, { cast: false }); cab.position.set(-.48, .3, .6); cab.rotation.x = -.5; g.add(cab);
  // the brake lever: an iron post, a red handle; pivots (R.lever.rotation.z)
  const lp = box(.3, .9, .3, M.iron); lp.position.set(1.7, 0, -.4); g.add(lp);
  const lever = new THREE.Group(); lever.position.set(1.7, .9, -.4); g.add(lever); R.lever = lever;
  const lv = box(.08, 1.1, .08, M.iron); lever.add(lv); const lh = box(.12, .22, .12, M.red); lh.position.y = 1.05; lever.add(lh);
  // stove with its fire glow, a desk with the phone and the radio, a hanging lamp
  const stove = box(.8, 1.0, .7, M.iron); stove.position.set(-3.1, 0, -1.6); g.add(stove);
  const pipe = box(.18, 3.2, .18, M.iron); pipe.position.set(-3.1, 1.0, -1.85); g.add(pipe);
  const fireW = new THREE.Mesh(new THREE.PlaneGeometry(.4, .25), new THREE.MeshBasicMaterial({ color: C('#ff8a30').multiplyScalar(2.2) })); fireW.position.set(-3.1, .45, -1.24); g.add(fireW); R.fire = fireW;
  const desk = box(1.4, .76, .7, M.wood); desk.position.set(3.0, 0, .6); g.add(desk);
  const phone = box(.26, .12, .2, M.dark); phone.position.set(2.7, .76, .5); g.add(phone);
  const radio = box(.18, .3, .12, M.dark); radio.position.set(3.3, .76, .5); g.add(radio); R.radio = radio;
  const rl = new THREE.Mesh(new THREE.PlaneGeometry(.05, .05), new THREE.MeshBasicMaterial({ color: C('#ff5040').multiplyScalar(2) })); rl.position.set(3.3, 1.0, .565); g.add(rl);
  const hook = box(.3, .3, .05, M.iron); hook.position.set(-3.8, 1.5, .6); hook.rotation.y = Math.PI / 2; g.add(hook);
  const lampHang = box(.2, .26, .2, M.iron); lampHang.position.set(-3.85, 1.3, .6); g.add(lampHang); R.lampHang = lampHang;
  const cord = box(.02, .8, .02, M.dark, { cast: false }); cord.position.set(0, Hh - .8, 0); g.add(cord);
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(.08, 8, 6), new THREE.MeshBasicMaterial({ color: C('#ffd090') })); bulb.position.set(0, Hh - .9, 0); g.add(bulb); R.bulb = bulb;
  // the door (front-left), open toward the camera side
  const door = box(.1, 2.2, 1.1, M.beam); door.position.set(-W / 2 + .05, 0, 1.2); g.add(door); R.door = door;
  g.userData = R; g.userData.dims = { W, D, Hh };
  return g;
}

// —— The flat: hall-kitchen with the tall mirror on the right wall (x = +RW/2). A mirror-image copy sits behind the glass ——
export const FL = { RW: 5.0, RD: 3.2, RH: 2.6, HOLE: { z0: -1.0, z1: .6, y0: .12, y1: 2.08 } };
function marksTex(n) {   // pencil marks on the doorframe post, one per birthday from 5, labelled; the strip covers 1.00-1.76 m
  const P = new PX(16, 104), B = ramp(['#c8b896', '#dccca8', '#ece0c0'], .3);
  P.fill((x, y) => B(.55 + (fbm(x * .3, y * .05, 3) - .5) * .3, x, y));
  const HM = { 5: 1.08, 6: 1.14, 7: 1.20, 8: 1.26, 9: 1.32, 10: 1.38, 11: 1.44, 12: 1.53, 13: 1.59, 14: 1.63, 15: 1.655, 16: 1.675, 17: 1.695, 18: 1.71, 19: 1.725 };
  const GL = { 0: '111101101101111', 1: '010110010010111', 2: '111001111100111', 3: '111001111001111', 4: '101101111001001', 5: '111100111001111', 6: '111100111101111', 7: '111001001001001', 8: '111101111101111', 9: '111101111001111' };
  const ages = n === 19 ? [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 19] : [...Array(Math.max(0, n - 4))].map((_, i) => 5 + i);
  for (const a of ages) {
    const y = Math.round((1.76 - HM[a]) / .76 * 104); if (y < 1 || y > 103) continue;
    for (let x = 1; x < 8; x++) P.set(x, y, [62, 56, 64]);
    const dg = String(a), x0 = dg.length > 1 ? 8 : 11;
    if (a >= 15 && a !== 15 && a !== 19 && a % 2 === 0) continue;   // crowded at the top: label every other one
    dg.split('').forEach((d, k) => { const G = GL[d]; for (let j = 0; j < 5; j++) for (let i = 0; i < 3; i++) if (G[j * 3 + i] === '1') P.set(x0 + k * 4 + i, y - 5 + j, [74, 64, 72]); });
  }
  return texOf(P.done());
}
export const MARKS = {}; export const markTex = n => MARKS[n] || (MARKS[n] = marksTex(n));
function calTex(year, page = 'DEC') {
  const P = new PX(40, 52); P.fill((x, y) => (y < 14 ? [150, 40, 36] : [236, 232, 222]));
  const g = P.g; P.done();
  const c = P.c, ctx = c.getContext('2d'); ctx.fillStyle = '#f6efe0'; ctx.font = 'bold 10px monospace'; ctx.textAlign = 'center'; ctx.fillText(page, 20, 11);
  ctx.fillStyle = '#2a2220'; ctx.font = 'bold 11px monospace'; ctx.fillText(String(year), 20, 27);
  ctx.fillStyle = '#9a9088'; for (let j = 0; j < 4; j++) for (let i = 0; i < 6; i++) ctx.fillRect(4 + i * 6, 32 + j * 5, 3, 2);
  return texOf(c);
}
export function flatRoom(W, o = {}) {
  const M = smats(), CM = cmats(), g = new THREE.Group(), R = {}, { RW, RD, RH, HOLE } = FL;
  const wallM = solid(o.mirror ? ['#4a5468', '#5c667a', '#6e788c', '#828ca0'] : ['#4e5a6e', '#606c80', '#727e92', '#8692a6'], 13);
  const fl = box(RW + .32, .1, RD + .16, M.plank, { cast: false }); fl.position.set(0, -.1, -.08); g.add(fl);
  const bk = box(RW + .32, RH, .16, wallM); bk.position.set(0, 0, -RD / 2 - .08); g.add(bk);
  const lw = box(.16, RH, RD, wallM); lw.position.set(-RW / 2 - .08, 0, 0); g.add(lw);
  if (!o.mirror) {
    const x = RW / 2 + .08, H = HOLE;
    for (const [h, y, d, z] of [[H.y0, 0, RD, 0], [RH - H.y1, H.y1, RD, 0], [H.y1 - H.y0, H.y0, H.z0 + RD / 2, (-RD / 2 + H.z0) / 2], [H.y1 - H.y0, H.y0, RD / 2 - H.z1, (H.z1 + RD / 2) / 2]]) { const b = box(.16, h, d, wallM); b.position.set(x, y, z); g.add(b); }
    const fm = solid(['#3a2a1a', '#5a4228', '#7a5a38', '#9a7448'], 47);
    for (const [y, h] of [[H.y0 - .07, .07], [H.y1, .07]]) { const f = box(.08, h, H.z1 - H.z0 + .14, fm, { cast: false }); f.position.set(RW / 2 - .02, y, (H.z0 + H.z1) / 2); g.add(f); }
    for (const z of [H.z0 - .035, H.z1 + .035]) { const f = box(.08, H.y1 - H.y0 + .14, .07, fm, { cast: false }); f.position.set(RW / 2 - .02, H.y0 - .07, z); g.add(f); }
    const gl = new THREE.Mesh(new THREE.PlaneGeometry(H.z1 - H.z0, H.y1 - H.y0), new THREE.MeshBasicMaterial({ color: '#9fc4cc', transparent: true, opacity: .06, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
    gl.rotation.y = -Math.PI / 2; gl.position.set(RW / 2 - .006, (H.y0 + H.y1) / 2, (H.z0 + H.z1) / 2); g.add(gl); R.glass = gl;
  }
  if (o.mirror) { const c = box(RW + .32, .12, RD + .16, wallM, { cast: false }); c.position.set(0, RH, -.08); g.add(c); const f = box(RW + .32, RH + .12, .16, CM.dark); f.position.set(0, 0, RD / 2 + .08); g.add(f); }
  // Pip's door in the left wall, its frame, the pencil marks on the post that faces the room
  const DZ = [-1.25, -.45];
  const door = box(.06, 2.0, DZ[1] - DZ[0], solid(['#5a3a24', '#6e4a30', '#845a3c', '#9a6c48'], 59)); door.position.set(-RW / 2 + .02, 0, (DZ[0] + DZ[1]) / 2); g.add(door); R.door = door;
  const pipSign = sign('PIP', .32, .14, { bg: '#e8d48a', fg: '#7a1a14', k: .7, font: 'Cinzel' }); pipSign.position.set(-RW / 2 + .07, 1.5, (DZ[0] + DZ[1]) / 2); pipSign.rotation.y = Math.PI / 2; g.add(pipSign); R.pipSign = pipSign;
  const frM = solid(['#b8a888', '#ccbc9c', '#dcceb0', '#ece0c4'], 61);
  for (const z of [DZ[0] - .05, DZ[1] + .05]) { const f = box(.1, 2.08, .1, frM, { cast: false }); f.position.set(-RW / 2 + .03, 0, z); g.add(f); }
  const top = box(.1, .1, DZ[1] - DZ[0] + .2, frM, { cast: false }); top.position.set(-RW / 2 + .03, 2.0, (DZ[0] + DZ[1]) / 2); g.add(top);
  const marks = new THREE.Mesh(new THREE.PlaneGeometry(.1, .76), stdM({ map: markTex(o.marks ?? 9), roughness: .9, emissive: C('#ffffff'), emissiveMap: markTex(o.marks ?? 9), emissiveIntensity: .08 })); marks.rotation.y = Math.PI / 2; marks.position.set(-RW / 2 + .085, 1.38, DZ[1] + .05); g.add(marks); R.marks = marks;
  R.marksSpot = V3(-RW / 2 + .09, 1.3, DZ[1] + .05);
  // boxes stacked against the door (the future that gave up)
  const boxes = new THREE.Group(); g.add(boxes); R.boxes = boxes; boxes.visible = false;
  [[.55, .45, .5, -RW / 2 + .4, -.95], [.5, .4, .45, -RW / 2 + .42, -.6], [.45, .35, .4, -RW / 2 + .4, -.78, .45]].forEach(([w, h, d, x, z, y = 0], i) => { const b = box(w, h, d, solid(['#6a4a2a', '#8a6438', '#a87c48'], 70 + i)); b.position.set(x, y, z); boxes.add(b); });
  // coat hooks on the left wall: Sam's green coat, Pip's red coat
  const rail = box(.06, .06, .9, M.beam, { cast: false }); rail.position.set(-RW / 2 + .03, 1.75, .6); g.add(rail);
  R.coats = {};
  for (const [k, z, cols] of [['sam', .35, ['#0e2218', '#173426', '#224a36', '#2f6248']], ['pip', .75, ['#3a0608', '#6a0c10', '#a01818', '#d0302a']], ['pip19', .75, ['#3a0e0c', '#5e1814', '#86241c', '#ac3626']]]) {
    const c = box(.12, k === 'pip' ? .62 : .9, .34, solid(cols, 80 + z * 10)); c.position.set(-RW / 2 + .1, k === 'pip' ? 1.1 : .86, z); g.add(c); R.coats[k] = c;
  }
  R.coats.pip19.visible = false;
  // calendar beside the door
  const cal = new THREE.Mesh(new THREE.PlaneGeometry(.32, .42), stdM({ map: calTex(o.year ?? 2026), emissive: C('#ffffff'), emissiveMap: calTex(o.year ?? 2026), emissiveIntensity: .1 })); cal.rotation.y = Math.PI / 2; cal.position.set(-RW / 2 + .02, 1.55, -1.48); g.add(cal); R.cal = cal;
  // kitchen corner along the back wall: table, two chairs, a shelf with mugs, a window
  const tbl = box(1.2, .06, .7, M.wood); tbl.position.set(.3, .72, -1.0); g.add(tbl);
  for (const x of [-.2, .8]) for (const z of [-1.3, -.7]) { const lg = box(.06, .72, .06, M.wood); lg.position.set(x, 0, z); g.add(lg); }
  R.chairs = [];
  for (const x of [-.5, 1.1]) { const ch = new THREE.Group(); ch.position.set(x, 0, -.95); g.add(ch); const s = box(.42, .05, .42, M.wood); s.position.y = .45; ch.add(s); const b = box(.05, .5, .42, M.wood); b.position.set(x < .3 ? -.2 : .2, .45, 0); ch.add(b); for (const dx of [-.18, .18]) for (const dz of [-.18, .18]) { const l = box(.04, .45, .04, M.wood); l.position.set(dx, 0, dz); ch.add(l); } R.chairs.push(ch); }
  const shelf = box(.9, .04, .22, M.wood, { cast: false }); shelf.position.set(1.65, 1.5, -1.5); g.add(shelf);
  R.mugs = [];
  for (const [x, col] of [[1.4, '#c43a2a'], [1.65, '#7a9aa8'], [1.9, '#e0c060']]) { const m = new THREE.Mesh(new THREE.CylinderGeometry(.045, .04, .1, 8).translate(0, .05, 0), stdM({ color: col })); m.position.set(x, 1.52, -1.5); g.add(m); R.mugs.push(m); }
  const tm = new THREE.Mesh(new THREE.CylinderGeometry(.045, .04, .1, 8).translate(0, .05, 0), stdM({ color: '#7a9aa8' })); tm.position.set(.5, .75, -.95); g.add(tm); R.tableMug = tm;
  const tm2 = tm.clone(); tm2.material = stdM({ color: '#ac3626' }); tm2.position.set(.15, .75, -1.05); g.add(tm2); R.tableMug2 = tm2; tm2.visible = false;
  const win = new THREE.Mesh(new THREE.PlaneGeometry(.9, 1.0), new THREE.MeshBasicMaterial({ color: C('#8aa0c8') })); win.position.set(-1.25, 1.55, -RD / 2 + .005); g.add(win); R.win = win;
  for (const [w, h, x, y] of [[1.0, .06, -1.25, 1.02], [1.0, .06, -1.25, 2.05], [.06, 1.06, -1.73, 1.02], [.06, 1.06, -.77, 1.02], [.04, 1.0, -1.25, 1.05]]) { const f = box(w, h, .08, M.beam, { cast: false }); f.position.set(x, y, -RD / 2 + .04); g.add(f); }
  // a shelf under the mirror: the chipped mug (toothbrushes), a stool
  const stool = new THREE.Group(); stool.position.set(RW / 2 - .9, 0, .9); g.add(stool); R.stool = stool;
  { const s = box(.36, .05, .36, M.wood); s.position.y = .5; stool.add(s); for (const dx of [-.14, .14]) for (const dz of [-.14, .14]) { const l = box(.04, .5, .04, M.wood); l.position.set(dx, 0, dz); stool.add(l); } }
  // the hall bulb on its flex
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(.06, 8, 6), new THREE.MeshBasicMaterial({ color: C('#ffd8a0') })); bulb.position.set(.9, RH - .45, .1); g.add(bulb); R.bulb = bulb;
  const flex = box(.012, .4, .012, CM.dark, { cast: false }); flex.position.set(.9, RH - .42, .1); g.add(flex);
  // the note on the glass (only the final morning, in the room behind the glass) is added by the world
  g.userData = R; return g;
}

// —— Steam on the glass: a shader plane; a wiped stripe and two digits written with a fingertip ——
export function steamPlane(w, h) {
  const c = document.createElement('canvas'); c.width = 48; c.height = 72; const x = c.getContext('2d');
  x.fillStyle = '#000'; x.fillRect(0, 0, 48, 72); x.fillStyle = '#fff';
  const seg5 = [[8, 20, 14, 3], [8, 20, 3, 14], [8, 32, 14, 3], [19, 32, 3, 13], [8, 43, 14, 3]], seg1 = [[30, 20, 3, 26], [27, 22, 4, 3]];
  for (const r of [...seg5, ...seg1]) x.fillRect(...r);
  const mask = new THREE.CanvasTexture(c); mask.magFilter = THREE.NearestFilter; mask.minFilter = THREE.NearestFilter;
  const u = { fogA: { value: 0 }, wipe: { value: 0 }, write: { value: 0 }, mask: { value: mask }, band: { value: new THREE.Vector2(.72, .24) } };
  const m = new THREE.ShaderMaterial({
    uniforms: u, transparent: true, depthWrite: false,
    vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }`,
    fragmentShader: `varying vec2 vUv; uniform float fogA, wipe, write; uniform sampler2D mask; uniform vec2 band;
      float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233))) * 43758.5453); }
      void main(){ vec2 q = floor(vUv * vec2(48., 72.)) / vec2(48., 72.);
        float n = .75 + .25 * h(q * 31.) + .1 * sin(q.y * 40. + q.x * 7.);
        float a = fogA * .78 * n;
        float inBand = step(abs(q.y - band.x), band.y * .5) * step(q.x, wipe * 1.08 - .04 + .05 * sin(q.y * 30.));
        a *= 1. - inBand * .92;
        float mk = texture2D(mask, vec2(q.x, q.y)).r; float drawn = mk * step(q.x, write);
        a *= 1. - drawn * .95;
        float drip = step(.985, h(vec2(floor(q.x * 48.), 3.))) * step(q.y, .9 - .4 * h(vec2(floor(q.x * 48.), 5.)));
        a *= 1. - drip * .5;
        gl_FragColor = vec4(vec3(.82, .86, .9), a); }`,
  });
  const me = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m); me.renderOrder = 5; me.userData.u = u; return me;
}
