// The world of "What If Your Mirror Showed You in 10 Years?" (Kestrel Hill): one scene, three dioramas.
// The hill with its funicular at the origin; the flat (with the room behind the glass) at x = 200; the engine house at x = 300.
import * as THREE from 'three';
import { glow } from './px.js';
import { box, ridge } from './kit.js';
import { sky, stars, particles, rain, flick } from './fx.js';
import { cmats, solid, sign, lampPost } from './city_art.js';
import { makeChar } from './chars.js';
import { T, VO, shot, vo, carS } from './story.js';
import { track, seg, ss, lerp, clamp, mulberry } from '/core/lib.js';
import { smats, Windows, pines, house, funCar, engineRoom, flatRoom, steamPlane, markTex, FL, HILL, ANG, yAt, laneX, trackPt, STEPX, C, V3, stdM } from './sets.js';

const KEYS = {
  night: { top: '#03050c', mid: '#0b1428', hor: '#1e2c46', sun: '#8ea8e0', sunI: .75, sunDir: [-20, 34, 16], hemiS: '#3a4c7a', hemiG: '#0a0c14', hemiI: 1.4, fog: '#101a2e', fogD: .006, exp: 1.45, moon: .4 },
  storm: { top: '#06080e', mid: '#121a28', hor: '#222c3c', sun: '#8a9ab8', sunI: .6, sunDir: [-20, 34, 16], hemiS: '#44527a', hemiG: '#0a0c12', hemiI: 1.7, fog: '#1a2232', fogD: .008, exp: 1.65, moon: 0 },
  dark: { top: '#04060c', mid: '#0a0e18', hor: '#141a28', sun: '#6a78a0', sunI: .55, sunDir: [-20, 34, 16], hemiS: '#3a4a6e', hemiG: '#0a0c12', hemiI: 1.7, fog: '#111828', fogD: .009, exp: 1.75, moon: 0 },
  morning: { top: '#5a7aa8', mid: '#a8bcd8', hor: '#eae6e0', sun: '#fff2e0', sunI: 2.0, sunDir: [30, 26, 34], hemiS: '#c0d0e8', hemiG: '#5a5a66', hemiI: 1.3, fog: '#c8d0dc', fogD: .006, exp: 1.0, moon: 0 },
  dusk: { top: '#1a2048', mid: '#6a5288', hor: '#f0a088', sun: '#ffb090', sunI: 1.0, sunDir: [40, 10, 20], hemiS: '#9a88b8', hemiG: '#2a2030', hemiI: 1.25, fog: '#6a5a7a', fogD: .008, exp: 1.25, moon: 0 },
  dawn: { top: '#3a4a7a', mid: '#a890b0', hor: '#ffd0a0', sun: '#ffd8b0', sunI: 1.5, sunDir: [40, 14, 30], hemiS: '#c8b0c8', hemiG: '#4a3a40', hemiI: 1.4, fog: '#c0a8b0', fogD: .005, exp: 1.2, moon: 0 },
  flatDay: { top: '#2a3446', mid: '#5a6a80', hor: '#a8b0c0', sun: '#c8d4ff', sunI: .5, sunDir: [-20, 30, 26], hemiS: '#8a9ab4', hemiG: '#2a2a32', hemiI: 1.05, fog: '#2a3442', fogD: .02, exp: 1.25, moon: 0 },
  flatNight: { top: '#05070c', mid: '#0c1220', hor: '#1a2234', sun: '#7a8ab0', sunI: .2, sunDir: [-20, 30, 26], hemiS: '#4a5878', hemiG: '#14141c', hemiI: .9, fog: '#121826', fogD: .02, exp: 1.35, moon: 0 },
  flatDawn: { top: '#3a4a7a', mid: '#a890b0', hor: '#ffd0a0', sun: '#ffd8b0', sunI: .9, sunDir: [-20, 20, 26], hemiS: '#b8a8c0', hemiG: '#3a3034', hemiI: 1.15, fog: '#4a4048', fogD: .015, exp: 1.2, moon: 0 },
  engine: { top: '#05070c', mid: '#0c1220', hor: '#1a2234', sun: '#7a8ab0', sunI: .15, sunDir: [-20, 30, 26], hemiS: '#8a7660', hemiG: '#2a2018', hemiI: 1.3, fog: '#1a1612', fogD: .015, exp: 1.5, moon: 0 },
  engineDark: { top: '#020306', mid: '#05070c', hor: '#0a0c12', sun: '#4a5470', sunI: .08, sunDir: [-20, 30, 26], hemiS: '#3a4258', hemiG: '#0a0a0e', hemiI: .8, fog: '#08090c', fogD: .02, exp: 1.6, moon: 0 },
};
const KEY_OF = { open: 'flatDay', title: 'night', hill: 'morning', test: 'flatDay', inventory: 'flatDay', marks: 'flatDay', pip1: 'flatDay', board: 'morning', lake: 'morning', sled: 'morning', door: 'morning', booth: 'morning',
  mornings: 'flatDay', kitchen: 'flatNight', letter: 'flatDay', sit: 'flatDay', festival: 'dusk', engine: 'engine', depart: 'storm', car1: 'dark', eh2: 'engineDark', climb: 'dark', loop: 'dark', release: 'dark', power: 'night', wheel: 'engine', final: 'flatDawn', end: 'dawn' };
const FLAT = ['open', 'test', 'inventory', 'marks', 'pip1', 'mornings', 'kitchen', 'letter', 'sit', 'final'];
const ENG = ['engine', 'eh2', 'wheel'];
function mixKey(a, b, k) {
  const A = KEYS[a], B = KEYS[b], o = {};
  for (const n in A) { if (typeof A[n] === 'number') o[n] = lerp(A[n], B[n], k); else if (Array.isArray(A[n])) o[n] = A[n].map((v, i) => lerp(v, B[n][i], k)); else o[n] = C(A[n]).lerp(C(B[n]), k); }
  return o;
}

export function buildWorld() {
  const M = smats(), CM = cmats(), scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2('#101a2e', .006);
  const SK = sky(); scene.add(SK.mesh);
  const ST = stars(500, 11); scene.add(ST);
  const sun = new THREE.DirectionalLight('#ffffff', 1); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
  const sc = sun.shadow.camera; sc.left = -30; sc.right = 30; sc.top = 24; sc.bottom = -24; sc.near = 1; sc.far = 220; sun.shadow.bias = -.0006; sun.shadow.normalBias = .02;
  const sunT = new THREE.Object3D(); scene.add(sunT); sun.target = sunT; scene.add(sun);
  const hemi = new THREE.HemisphereLight('#ffffff', '#222222', 1); scene.add(hemi);
  const W = new Windows(2400); scene.add(W.mesh);
  const R = mulberry(17);
  const { H, LZ } = HILL;

  // ================= The hill =================
  // power: windows go dark from the top down at the blackout, and come back from the bottom up
  const offT = p => T.blackout + .15 + (1 - clamp(p.y / H)) * 1.3;
  const onT = p => T.powerOn + .4 + clamp(p.y / (H + 6)) * 3.4;
  const terrain = (x, z) => {
    let y = z > 0 ? 0 : z < -LZ ? H : yAt(z);
    const side = Math.abs(x);
    y += Math.max(0, side - 46) * .35 * (z < 10 ? 1 : 0);                               // the valley walls rise beyond the town
    if (side > 7) y += (z < 0 && z > -LZ ? (fbmLite(x * .05, z * .05) - .5) * 1.6 : 0);
    return y;
  };
  function fbmLite(x, z) { return .5 + .25 * Math.sin(x * 1.7 + z * .9) + .15 * Math.sin(x * 3.1 - z * 2.3) + .1 * Math.sin(x * 5.3 + z * 4.1); }
  { const g = new THREE.PlaneGeometry(240, 260, 80, 90); g.rotateX(-Math.PI / 2); g.translate(0, 0, -60); const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) p.setY(i, terrain(p.getX(i), p.getZ(i)) - .02);
    g.computeVertexNormals(); const uv = new Float32Array(p.count * 2); for (let i = 0; i < p.count; i++) { uv[i * 2] = p.getX(i) / 4; uv[i * 2 + 1] = (p.getZ(i) - p.getY(i) * .6) / 4; } g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    const m = new THREE.Mesh(g, M.snow); m.receiveShadow = true; scene.add(m); }
  // the track bed (an embankment along the slope)
  const SL = Math.hypot(H, LZ);
  { const bed = box(6.4, .6, SL + 2, M.gravel, { cast: false }); bed.geometry.translate(0, -.3, 0); bed.rotation.x = ANG; bed.position.set(0, H / 2 + .05, -LZ / 2); scene.add(bed); }
  // rails and sleepers (one lane below and above the loop, two lanes inside it)
  { const seg_ = [], sl_ = [];
    for (const lane of [-1, 1]) for (let s = 0; s < 1; s += .004) { if (lane === 1 && (s < .355 || s > .645)) continue; const a = trackPt(s, lane, .32), b = trackPt(s + .004, lane, .32); for (const off of [-.5, .5]) seg_.push([a.clone().add(V3(off, 0, 0)), b.clone().add(V3(off, 0, 0))]); }
    for (const lane of [-1, 1]) for (let s = 0; s < 1; s += .0085) { if (lane === 1 && (s < .355 || s > .645)) continue; sl_.push(trackPt(s, lane, .22)); }
    const rails = new THREE.InstancedMesh(new THREE.BoxGeometry(.07, .08, 1), M.rail, seg_.length), m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), up = V3(0, 0, 1);
    seg_.forEach(([a, b], i) => { const d = b.clone().sub(a); q.setFromUnitVectors(up, d.clone().normalize()); m4.compose(a.clone().add(b).multiplyScalar(.5), q, V3(1, 1, d.length() + .01)); rails.setMatrixAt(i, m4); }); scene.add(rails);
    const slp = new THREE.InstancedMesh(new THREE.BoxGeometry(1.5, .1, .22), M.wood, sl_.length); q.setFromAxisAngle(V3(1, 0, 0), ANG);
    sl_.forEach((p, i) => { m4.compose(p, q, V3(1, 1, 1)); slp.setMatrixAt(i, m4); }); slp.receiveShadow = true; scene.add(slp);
    const cab = []; for (let s = 0; s <= 1.0001; s += .02) cab.push(trackPt(s, -1, .3)); const cl = new THREE.Line(new THREE.BufferGeometry().setFromPoints(cab), new THREE.LineBasicMaterial({ color: '#1a1a1e' })); scene.add(cl); }
  // the service steps and their handrail, with small lamps every 12 m
  const stepLamps = [];
  { const n = Math.floor(LZ / .32), st = new THREE.InstancedMesh(new THREE.BoxGeometry(1.3, .22, .34), M.stone, n), m4 = new THREE.Matrix4();
    for (let i = 0; i < n; i++) { const z = -i * .32 - .16; m4.makeTranslation(STEPX, yAt(z) + .02, z); st.setMatrixAt(i, m4); } st.receiveShadow = true; scene.add(st);
    const hr = box(.06, .06, SL, M.metal, { cast: false }); hr.geometry.translate(0, 0, 0); hr.rotation.x = ANG; hr.position.set(STEPX + .7, H / 2 + 1.0, -LZ / 2); scene.add(hr);
    for (let z = -6; z > -LZ; z -= 12) { const p = box(.08, 1.2, .08, M.metal, { cast: false }); p.position.set(STEPX + .75, yAt(z), z); scene.add(p); const gl = glow('#ffd9a0', .9, 1.0); gl.position.set(STEPX + .75, yAt(z) + 1.3, z); gl.material.depthTest = false; gl.renderOrder = 6; scene.add(gl); stepLamps.push(gl); } }
  // cars
  const car1 = funCar(1), car2 = funCar(2); scene.add(car1, car2);
  const carL1 = new THREE.PointLight('#ffc880', 0, 6, 2), carL2 = new THREE.PointLight('#ffc880', 0, 6, 2); scene.add(carL1, carL2);
  const carG1 = glow('#ffc880', 1.6, .9), carG2 = glow('#ffc880', 1.6, .9); for (const g of [carG1, carG2]) { g.material.depthTest = false; g.renderOrder = 6; scene.add(g); }
  function placeCars(t) {
    const s1 = carS(t);
    car1.position.copy(trackPt(s1, -1, .05)); car2.position.copy(trackPt(1 - s1, 1, .05));
    return s1;
  }
  // bottom station, plaza, booth, lake, sled run
  { const pl = box(26, .2, 18, CM.paving, { cast: false }); pl.position.set(-2, -.18, 9); scene.add(pl);
    const shed = new THREE.Group(); scene.add(shed);
    for (const x of [-3, 3]) for (const z of [-1, 2.5, 6]) { const p = box(.25, 3.6, .25, M.beam); p.position.set(x, 0, z); shed.add(p); }
    const roof = box(7.4, .3, 8.4, M.roofSnow); roof.position.set(0, 3.6, 2.5); shed.add(roof);
    const plat = box(1.6, .5, 7, M.stone); plat.position.set(2.2, 0, 2.6); shed.add(plat);
    const sg = sign('KESTREL HILL', 4.2, .55, { bg: '#16304a', fg: '#f0e6c8', k: .6, lit: .8 }); sg.position.set(0, 3.2, 6.8); shed.add(sg); }
  const BOOTH = V3(-6.5, 0, 6.5);
  { const b = new THREE.Group(); b.position.copy(BOOTH); scene.add(b);
    const back = box(2.4, 2.6, .12, M.wallD); back.position.set(0, 0, -.9); b.add(back);
    for (const x of [-1.2, 1.2]) { const s = box(.12, 2.6, 1.9, M.wallD); s.position.set(x, 0, 0); b.add(s); }
    const low = box(2.4, 1.0, .12, M.wallD); low.position.set(0, 0, .9); b.add(low);
    const rf = box(2.8, .25, 2.3, M.roofSnow); rf.position.set(0, 2.6, 0); b.add(rf);
    const sg = sign('TICKETS', 1.6, .3, { bg: '#7a1a14', fg: '#f0e6c8', k: .6, lit: .6 }); sg.position.set(0, 2.3, .98); b.add(sg); }
  const boothL = new THREE.PointLight('#ffc070', 0, 5, 2); boothL.position.copy(BOOTH).add(V3(0, 2.1, .3)); scene.add(boothL);
  const lake = box(30, .06, 22, M.ice, { cast: false }); lake.position.set(29, -.04, 17); scene.add(lake);
  const SLED = { x: 21 };
  { const len = Math.hypot(yAt(-34), 34), ch = box(1.4, .25, len, M.snow, { cast: false }); ch.rotation.x = Math.atan2(yAt(-34), 34); ch.position.set(SLED.x, yAt(-17) + .15, -17); scene.add(ch);
    for (const dx of [-.75, .75]) { const e = box(.15, .35, len, M.wood, { cast: false }); e.rotation.x = ch.rotation.x; e.position.set(SLED.x + dx, yAt(-17) + .25, -17); scene.add(e); } }
  const sled = new THREE.Group(); { const b = box(.5, .1, 1.0, M.red); b.position.y = .12; sled.add(b); for (const dx of [-.22, .22]) { const r = box(.04, .1, 1.1, M.metal); r.position.set(dx, 0, 0); sled.add(r); } } scene.add(sled);
  // lamp posts round the plaza; festival lanterns strung between them
  const lamps = [];
  for (const [x, z] of [[-12, 2], [-12, 14], [-2, 16], [8, 14], [-16, 6], [-8, -1]]) { const L = lampPost(4.4); L.position.set(x, 0, z); L.rotation.y = Math.atan2(-1 - x, 8 - z) - Math.PI / 2; scene.add(L); lamps.push(L); }
  const lampGlows = lamps.map(L => { L.updateMatrixWorld(true); const g = glow('#ffd9a0', 1.6, .9); g.position.copy(L.localToWorld(L.userData.head.clone())); g.material.depthTest = false; g.renderOrder = 6; scene.add(g); return g; });
  const lantPts = [];
  for (let i = 0; i < lamps.length; i++) { const a = lampGlows[i].position, b = lampGlows[(i + 1) % lamps.length].position; for (let k = 1; k < 9; k++) { const u = k / 9; lantPts.push([lerp(a.x, b.x, u), lerp(a.y, b.y, u) - .2 - Math.sin(u * Math.PI) * .9, lerp(a.z, b.z, u), k % 3]); } }
  const LCOL = [[1.0, .45, .6], [1.0, .75, .35], [.55, .8, 1.0]];
  const lanterns = particles(lantPts.length, (i, t, o) => { const p = lantPts[i]; o.x = p[0]; o.y = p[1] + Math.sin(t * 1.3 + i) * .03; o.z = p[2]; o.s = .14; o.a = .9 + .1 * Math.sin(t * 3 + i); [o.r, o.g, o.b] = LCOL[p[3]]; }, { soft: 1 }); scene.add(lanterns);
  // houses stepping up both sides
  const HC = []; const walls = ['wallA', 'wallB', 'wallC', 'wallD'];
  for (const sd of [-1, 1]) for (let z = -4; z > -LZ + 3; z -= 6.5 + R() * 2) {
    for (let k = 0; k < 4; k++) {
      const x = sd * (9 + k * 9.5 + R() * 3), w = 5 + R() * 3, d = 5 + R() * 1.5, h = 3 + Math.floor(R() * 2) * 2.7;
      if (sd > 0 && Math.abs(x - SLED.x) < 4.5 && z > -36) continue;
      const zf = z + (R() - .5) * 2; const y = yAt(zf + d / 2) - .2;
      const hs = house(W, { x, y, z: zf, w, d, h, wall: walls[Math.floor(R() * 4)], rnd: R, lampP: .75, off: offT, on: onT, side: R() < .4, dark: R() < .3 });
      scene.add(hs); HC.push(hs);
      const base = box(w + .2, 3, d + .2, M.stone, { cast: false }); base.position.set(x, y - 3, zf); scene.add(base);
    }
  }
  // the plaza houses (bottom) and the far rows beyond the lake
  for (const [x, z, w] of [[-16, 8, 6], [-20, 16, 7], [-14, 22, 6], [12, 26, 6], [3, 26, 7], [-6, 26, 6]]) { const hs = house(W, { x, y: 0, z, w, d: 5, h: 5.7, wall: walls[Math.floor(R() * 4)], rnd: R, lampP: .8, off: offT, on: onT }); hs.rotation.y = z > 20 ? Math.PI : 0; scene.add(hs); }
  // the top: station, the engine house and the flat above it
  const TOP = V3(0, H, -LZ - 6);
  { const plt = box(40, 1, 30, M.snow, { cast: false }); plt.position.set(0, H - 1, -LZ - 14); scene.add(plt);
    const eh = box(11, 4.6, 8, M.stone); eh.position.set(0, H, -LZ - 7); scene.add(eh);
    const fl = box(11, 3.4, 8, M.wallC); fl.position.set(0, H + 4.6, -LZ - 7); scene.add(fl);
    const tri = new THREE.Shape([new THREE.Vector2(-4.4, 0), new THREE.Vector2(4.4, 0), new THREE.Vector2(0, 3)]);
    for (const s of [-1, 1]) { const tg = new THREE.ShapeGeometry(tri); tg.rotateY(Math.PI / 2 * s); tg.translate(s * 5.5, H + 8, -LZ - 7); scene.add(new THREE.Mesh(tg, M.wallC)); }
    for (const s of [-1, 1]) { const sl = Math.hypot(4.4, 3); const pg = new THREE.BoxGeometry(12, .25, sl + .4); pg.translate(0, 0, s * (sl + .4) / 2); const m = new THREE.Mesh(pg, M.roofSnow); m.castShadow = true; m.rotation.x = s * Math.atan2(3, 4.4); m.position.set(0, H + 8 + 3.06, -LZ - 7); scene.add(m); }
    const shed = box(6, .3, 7, M.roofSnow); shed.position.set(0, H + 3.4, -LZ + 1.5); scene.add(shed);
    for (const x of [-2.6, 2.6]) for (const z of [-LZ - 2.5, -LZ + 4.5]) { const p = box(.25, 3.4, .25, M.beam); p.position.set(x, H, z); scene.add(p); }
    const door = box(1.1, 2.2, .12, M.beam); door.position.set(-4.6, H, -LZ - 2.95); scene.add(door); }
  const EHdoor = scene.children[scene.children.length - 1];
  const ehWin = []; for (const x of [-3.6, 3.6]) { const p = V3(x, H + 2.4, -LZ - 2.96); W.add(p, 0, 2.0, 1.5, { lamp: true, warm: 1.4, off: T.blackout + .1, on: T.powerOn + 4.0 }); ehWin.push(p); }
  for (const x of [-3.5, 0, 3.5]) { const p = V3(x, H + 6.2, -LZ - 2.96); W.add(p, 0, 1.0, 1.2, { lamp: x === 3.5, off: T.blackout + .1, on: T.powerOn + 4.2 }); }
  // pines
  const PN = [];
  for (let i = 0; i < 260; i++) { const x = (R() - .5) * 200, z = 20 - R() * 170; if (Math.abs(x) < 7.5 || (Math.abs(x - SLED.x) < 3 && z > -36 && z < 2) || (x > 12 && x < 46 && z > 4 && z < 30) || (z > -2 && Math.abs(x) < 26)) continue; PN.push([x, terrain(x, z), z, 4 + R() * 5]); }
  const PNm = pines(PN); scene.add(PNm);
  // mountains behind
  for (const [x, z, w, h, col, s] of [[0, -240, 700, 160, '#2a3448', 3], [-120, -200, 400, 110, '#384660', 5], [140, -210, 420, 120, '#34405a', 7]]) { const r = ridge(w, h, col, s, { ppm: 1.2, f: .02 }); r.position.set(x, H - 30, z); scene.add(r); }

  // snow: a near field of flakes around the look point; storm streaks
  const snowC = V3(0, 0, 0); let snowS = 30, wind = .4, snowA = 1;
  const SN = 2600, SR = mulberry(5), sp = [...Array(SN)].map(() => [SR(), SR(), SR(), .5 + SR()]);
  const snow = particles(SN, (i, t, o) => { const s = sp[i], S = snowS, fall = (s[1] - t * .06 * s[3] * (1 + wind)) % 1, y = ((fall + 1) % 1 - .5) * S * .6;
    o.x = snowC.x + ((s[0] + t * wind * .02 * s[3]) % 1 - .5) * S + Math.sin(t * .8 + i) * .2; o.y = snowC.y + y; o.z = snowC.z + (s[2] - .5) * S; o.s = .05 + s[3] * .03; o.a = snowA * .85; o.r = .92; o.g = .95; o.b = 1; }, { soft: 0 });
  scene.add(snow);
  const streaks = rain(1600, [-30, 0, -30, 30, 26, 30], { color: '#c8d4e8', opacity: .3, speed: 16, len: .8, seed: 4 }); scene.add(streaks);

  // ================= The flat (and the room behind the glass) =================
  const F0 = V3(200, 0, 0), { RW, RD, HOLE } = FL;
  const flat = flatRoom(W, { year: 2026, marks: 9 }); flat.position.copy(F0); scene.add(flat);
  const mir = flatRoom(W, { mirror: true, year: 2036, marks: 15 }); mir.position.set(F0.x + RW, 0, F0.z); mir.scale.x = -1; scene.add(mir);
  const FR = flat.userData, MR = mir.userData;
  const steam = steamPlane(HOLE.z1 - HOLE.z0, HOLE.y1 - HOLE.y0); steam.rotation.y = -Math.PI / 2; steam.position.set(F0.x + RW / 2 - .014, (HOLE.y0 + HOLE.y1) / 2, F0.z + (HOLE.z0 + HOLE.z1) / 2); scene.add(steam);
  const SU = steam.userData.u;
  const bulbF = new THREE.PointLight('#ffd8a0', 0, 8, 1.6); bulbF.castShadow = true; bulbF.shadow.mapSize.set(1024, 1024); bulbF.shadow.bias = -.004; scene.add(bulbF);
  const bulbM = new THREE.PointLight('#ffd8a0', 0, 8, 1.6); scene.add(bulbM);
  const winF = new THREE.PointLight('#a8b8e0', 0, 6, 2); scene.add(winF);
  const winM = new THREE.PointLight('#a8b8e0', 0, 6, 2); scene.add(winM);
  const FT = new Map(), flipTex = tx => { if (!FT.has(tx)) { const c = tx.clone(); c.wrapS = THREE.RepeatWrapping; c.repeat.x = -1; c.offset.x = 1; c.needsUpdate = true; FT.set(tx, c); } return FT.get(tx); };
  MR.cal.material.map = flipTex(MR.cal.material.map); MR.cal.material.emissiveMap = MR.cal.material.map;
  const MW = x => 2 * F0.x + RW - x;   // mirror a world x across the glass (plane at F0.x + RW/2)

  // ================= The engine house =================
  const E0 = V3(300, 0, 0);
  const eng = engineRoom(); eng.position.copy(E0); scene.add(eng); const ER = eng.userData;
  const ehBulb = new THREE.PointLight('#ffc888', 0, 9, 1.6); ehBulb.castShadow = true; ehBulb.shadow.mapSize.set(1024, 1024); ehBulb.shadow.bias = -.004; scene.add(ehBulb);
  const stoveL = new THREE.PointLight('#ff8a40', 0, 5, 2); stoveL.position.copy(E0).add(V3(-3.1, .7, -.9)); scene.add(stoveL);

  // ================= Cast =================
  const sam = makeChar('hero', 'sam'), sam51 = makeChar('hero', 'sam51'), sam51up = makeChar('hero', 'sam51up', { tag: 'sam51up' });
  const pip = makeChar('kid', 'pip'), pipIn = makeChar('kid', 'pipIn', { tag: 'pipIn' }), pip19 = makeChar('hero', 'pip19', { tag: 'pip19' }), odile = makeChar('odile', 'odile');
  const folk = ['t1', 't2', 't3', 't4', 't5', 't6', 't7', 't8'].map(l => makeChar('folk', l)), kids = ['k1', 'k2'].map(l => makeChar('kid', l));
  const all = [sam, sam51, sam51up, pip, pipIn, pip19, odile, ...folk, ...kids];
  all.forEach(c => { scene.add(c.root); c.root.visible = false; });
  const fill = new THREE.PointLight('#c8d4f0', 0, 8, 2); scene.add(fill);
  const lampL = new THREE.PointLight('#d8f4ff', 0, 9, 1.5); lampL.castShadow = true; lampL.shadow.mapSize.set(1024, 1024); lampL.shadow.bias = -.003; scene.add(lampL);
  const lampG = glow('#cfefff', .8, 1.3); lampG.material.depthTest = true; lampG.renderOrder = 7; scene.add(lampG);
  const torchL = new THREE.PointLight('#ffe6b0', 0, 4, 2); scene.add(torchL);
  const torchG = glow('#ffe0a0', .5, 1.2); torchG.material.depthTest = true; torchG.renderOrder = 7; scene.add(torchG);
  const blinkOr = (t, f, b, s = 0) => (((t + s) % 3.7) < .12 ? b : f);
  const place = (c, x, y, z) => { c.root.visible = true; c.root.position.set(x, y, z); };
  const walk4 = (t, fps = 7, pre = 'w') => pre + (Math.floor(t * fps) % 4);
  const talking = (t, id) => { const v = vo(id); return v && t > v.t && t < v.t + v.d; };
  const speak = (t, ids, on, off) => ids.some(id => talking(t, id)) ? (Math.floor(t * 6) % 3 ? on : off) : off;
  const Fp = (x, y, z) => [F0.x + x, y, F0.z + z], Ep = (x, y, z) => [E0.x + x, y, E0.z + z];
  // where the reflection stands: the true mirror position, slid along the glass so it shows through the hole from this camera
  const H0 = V3(F0.x + RW / 2, (HOLE.y0 + HOLE.y1) / 2, F0.z + (HOLE.z0 + HOLE.z1) / 2);
  function mirrorChar(Rc, sp_, cam, k = 1) {
    const xm = MW(sp_.x); let z = sp_.z;
    if (k > 0) { const d = H0.clone().sub(cam.position); if (Math.abs(d.x) > .05) { const s = (xm - cam.position.x) / d.x; z = lerp(sp_.z, cam.position.z + d.z * s + (sp_.z - H0.z) * .5, k); } }
    place(Rc, xm, sp_.y, z); Rc.face(cam, true);
  }

  // ================= Cameras (u = 0…1 through the shot) =================
  const U = keys => track(keys);
  const MIRROR_P = U([[0, Fp(-.95, 2.15, 1.55)], [1, Fp(-.7, 2.05, 1.35)]]), MIRROR_L = U([[0, Fp(2.5, 1.2, -.2)], [1, Fp(2.5, 1.25, -.2)]]);
  const CAM = {
    open: { p: U([[0, Fp(.1, 2.15, 1.75)], [.6, Fp(-.2, 2.15, 1.65)], [1, Fp(-.7, 2.15, 1.55)]]), l: U([[0, Fp(2.5, 1.5, -.12)], [1, Fp(2.5, 1.3, -.2)]]), fov: 28 },
    title: { p: U([[0, [74, 98, 80]], [1, [62, 86, 66]]]), l: U([[0, [0, 22, -40]], [1, [0, 24, -40]]]), fov: 32 },
    hill: { p: U([[0, [42, 28, 36]], [.4, [40, 40, 4]], [.8, [36, 62, -36]], [1, [32, 70, -48]]]), l: U([[0, [0, 3, 0]], [.4, [0, 16, -26]], [.8, [0, 40, -66]], [1, [0, 50, -84]]]), fov: 34 },
    test: { p: MIRROR_P, l: MIRROR_L, fov: 30 },
    inventory: { p: U([[0, Fp(-1.0, 2.1, 1.7)], [1, Fp(-.2, 2.0, 1.75)]]), l: U([[0, Fp(2.5, 1.5, -.1)], [1, Fp(2.5, 1.05, -.6)]]), fov: 28 },
    marks: { p: U([[0, Fp(-1.35, 1.75, .45)], [.34, Fp(-1.4, 1.7, .35)], [.36, Fp(2.2, 1.62, .15)], [1, Fp(2.3, 1.6, .1)]]), l: U([[0, Fp(-2.45, 1.35, -.4)], [.34, Fp(-2.45, 1.38, -.4)], [.36, Fp(7.4, 1.38, -.42)], [1, Fp(7.41, 1.48, -.4)]]), fov: U([[0, [26]], [.34, [22]], [.36, [10]], [1, [8.5]]]) },
    pip1: { p: U([[0, Fp(-1.3, 2.0, 2.0)], [1, Fp(-1.1, 1.9, 1.8)]]), l: U([[0, Fp(2.5, .95, -.1)], [1, Fp(2.5, 1.0, -.1)]]), fov: 32 },
    board: { p: U([[0, [0, 150, -36]], [1, [0, 130, -36.5]]]), l: U([[0, [0, 0, -36.1]], [1, [0, 0, -36.6]]]), fov: 40, top: 1 },
    lake: { p: U([[0, [38, 8, 31]], [1, [35, 7, 28]]]), l: U([[0, [25, .6, 15]], [1, [24, .7, 14]]]), fov: 30 },
    sled: { p: U([[0, [28, yAt(-30) + 5.5, -24]], [1, [27.5, yAt(-30) + 5, -25]]]), l: U([[0, [SLED.x - .5, yAt(-30) + .9, -30]], [1, [SLED.x - .5, yAt(-30) + 1, -30]]]), fov: 30 },
    door: { p: U([[0, [-12, H + 4.6, -LZ + 5]], [1, [-11, H + 4.2, -LZ + 4]]]), l: U([[0, [-4.6, H + 1.1, -LZ - 2.6]], [1, [-4.6, H + 1.1, -LZ - 2.6]]]), fov: 30 },
    booth: { p: U([[0, [-1, 4.2, 15.5]], [1, [-2, 3.8, 14]]]), l: U([[0, [-6.2, 1.3, 6.8]], [1, [-6.3, 1.4, 6.9]]]), fov: 30 },
    mornings: { p: U([[0, Fp(2.2, 1.62, .15)], [1, Fp(2.3, 1.6, .1)]]), l: U([[0, Fp(7.41, 1.45, -.42)], [1, Fp(7.41, 1.5, -.4)]]), fov: 9 },
    kitchen: { p: U([[0, Fp(.6, 2.9, 4.6)], [.8, Fp(.3, 2.3, 3.4)], [1, Fp(.1, 1.9, 2.6)]]), l: U([[0, Fp(.2, .9, -.9)], [1, Fp(-.3, .85, -.9)]]), fov: 30 },
    letter: { p: U([[0, Fp(-.95, 2.15, 1.55)], [.45, Fp(-.1, 1.95, 1.4)], [1, Fp(.25, 1.9, 1.3)]]), l: U([[0, Fp(2.5, 1.25, -.2)], [1, Fp(2.5, 1.4, -.15)]]), fov: U([[0, [30]], [1, [27]]]) },
    sit: { p: U([[0, Fp(-1.1, 1.8, 1.7)], [1, Fp(-.9, 1.7, 1.5)]]), l: U([[0, Fp(2.5, .9, -.2)], [1, Fp(2.5, .9, -.2)]]), fov: 32 },
    festival: { p: U([[0, [11, 7, 20]], [1, [8.5, 5.8, 17]]]), l: U([[0, [-1.5, 1.2, 6.5]], [1, [-2, 1.2, 7]]]), fov: 30 },
    engine: { p: U([[0, Ep(-.6, 2.7, 4.4)], [1, Ep(.5, 2.4, 4.1)]]), l: U([[0, Ep(1.6, 1.3, .5)], [1, Ep(2.1, 1.2, .9)]]), fov: 32 },
    depart: { p: U([[0, [40, 44, 22]], [1, [36, 40, 16]]]), l: U([[0, [0, 18, -30]], [1, [0, 22, -38]]]), fov: 34 },
    car1: { p: U([[0, [-4.6, 27.6, -32.2]], [1, [-3.6, 27.2, -33.2]]]), l: U([[0, [-1.6, 25.6, -38.6]], [1, [-1.6, 25.7, -38.6]]]), fov: 28 },
    eh2: { p: U([[0, Ep(.8, 2.6, 4.6)], [1, Ep(-1.6, 2.5, 4.2)]]), l: U([[0, Ep(2.4, 1.1, 1.2)], [1, Ep(-3.0, 1.1, 1.2)]]), fov: 34 },
    climb: { p: U([[0, [0, 0, 0]], [1, [0, 0, 0]]]), l: U([[0, [0, 0, -1]], [1, [0, 0, -1]]]), fov: 30 },
    loop: { p: U([[0, [7.5, 29.0, -30.5]], [.25, [3.6, 27.6, -31.6]], [1, [2.4, 27.2, -32.4]]]), l: U([[0, [2.4, 25.6, -37.6]], [.25, [.4, 25.8, -38.6]], [1, [0, 25.9, -38.6]]]), fov: 30 },
    release: { p: U([[0, [2.4, 27.2, -32.4]], [.1, [16, 42, -14]], [.5, [44, 70, 18]], [1, [78, 104, 62]]]), l: U([[0, [0, 25.9, -38.6]], [.1, [0, 24.5, -40]], [1, [0, 23, -40]]]), fov: U([[0, [30]], [.1, [32]], [1, [40]]]) },
    power: { p: U([[0, [62, 58, 52]], [1, [58, 62, 48]]]), l: U([[0, [0, 18, -32]], [1, [0, 22, -38]]]), fov: 34 },
    wheel: { p: U([[0, Ep(2.3, 1.9, 2.6)], [1, Ep(2.0, 1.7, 2.1)]]), l: U([[0, Ep(.9, .8, .1)], [1, Ep(1.0, .8, .1)]]), fov: 30 },
    final: { p: U([[0, Fp(-.95, 2.15, 1.55)], [.75, Fp(-.8, 2.1, 1.45)], [1, Fp(-1.3, 2.3, 1.8)]]), l: U([[0, Fp(2.5, 1.25, -.2)], [1, Fp(2.5, 1.2, -.2)]]), fov: 31 },
    end: { p: U([[0, [30, 44, 10]], [1, [80, 104, 78]]]), l: U([[0, [0, 24, -40]], [1, [0, 22, -40]]]), fov: U([[0, [30]], [1, [36]]]) },
  };

  function applyKey(K, renderer) {
    SK.u.top.value.copy(K.top); SK.u.mid.value.copy(K.mid); SK.u.hor.value.copy(K.hor);
    const sd = new THREE.Vector3(...K.sunDir).normalize();
    SK.u.moonDir.value.copy(sd); SK.u.moonCol.value.copy(K.sun); SK.u.moonI.value = K.moon;
    sun.color.copy(K.sun); sun.intensity = K.sunI; sun.position.copy(sunT.position).addScaledVector(sd, 90);
    hemi.color.copy(K.hemiS); hemi.groundColor.copy(K.hemiG); hemi.intensity = K.hemiI;
    scene.fog.color.copy(K.fog); scene.fog.density = K.fogD; renderer.toneMappingExposure = K.exp;
  }
  // the lightning: strike, dip, re-strike, decay
  const flash = t => { const d = t - T.flash; if (d < 0 || d > 1.6) return 0; return Math.max(0, d < .06 ? d / .06 : d < .16 ? 1 - (d - .06) * 6 : d < .26 ? .4 + (d - .16) * 6 : Math.exp(-(d - .26) * 3.2)); };
  const powerOn = t => t < T.blackout + .2 || t >= T.powerOn + .4;

  function update(t, sh, cam, post, renderer) {
    const id = sh.id, u = clamp((t - sh.a) / (sh.b - sh.a));
    all.forEach(c => { c.root.visible = false; c.mesh.scale.x = 1; });
    fill.intensity = 0; lampL.intensity = 0; lampG.visible = false; torchL.intensity = 0; torchG.visible = false; bulbF.intensity = bulbM.intensity = winF.intensity = winM.intensity = 0;
    ehBulb.intensity = 0; stoveL.intensity = 0; carL1.intensity = carL2.intensity = 0; boothL.intensity = 0; sled.visible = false;
    SU.fogA.value = 0; SU.wipe.value = 0; SU.write.value = 0;
    cam.up.set(0, 1, 0);

    // ——— camera ———
    const CK = CAM[id]; cam.position.set(...CK.p(u)); const look = V3(...CK.l(u)); cam.fov = typeof CK.fov === 'number' ? CK.fov : CK.fov(u)[0];
    if (CK.top) cam.up.set(0, 0, -1);
    // the board dives: straight down on the hill, then tilting into the 3/4 view in the last third
    if (id === 'board') { const k = ss(seg(u, .55, 1)); cam.position.set(lerp(0, 46, k), lerp(150, 70, k), lerp(-36, 30, k)); look.set(0, lerp(0, 14, k), lerp(-36.1, -30, k)); if (k > .02) cam.up.set(0, 1, 0); }
    // the climb follows Sam down the steps, the camera leading a little
    let samClimb = null;
    if (id === 'climb') { const z = lerp(-LZ + 1.5, -36.5, ss(seg(t, sh.a + .4, sh.b - .6)) * .96 + seg(t, sh.a + .4, sh.b - .6) * .04); samClimb = V3(STEPX, yAt(z) + .12, z); cam.position.set(STEPX + 7.0, samClimb.y + 3.8, z + 4.6); look.set(STEPX - .6, samClimb.y + .8, z - 1.6); if (t > sh.b - 7.5) { const kE = seg(t, sh.b - 7.5, sh.b); cam.position.copy(V3(8.6, 30.0, -29.4).lerp(V3(7.5, 29.0, -30.5), kE)); look.set(2.4, 25.6, -37.6); } }
    cam.lookAt(look);
    sunT.position.copy(look); sunT.position.y = 0;

    // ——— key, weather, power ———
    let K = mixKey(KEY_OF[id], KEY_OF[id], 0);
    if (id === 'depart') { K = mixKey('storm', 'dark', ss(seg(t, T.blackout, T.blackout + 1.5))); }
    if (id === 'power') K = mixKey('dark', 'night', ss(seg(t, T.powerOn, T.powerOn + 4)));
    if (id === 'board' || id === 'hill' || id === 'lake' || id === 'sled' || id === 'door') K.exp *= id === 'board' ? .55 : .85;
    if (id === 'final' && t > T.leave) K = mixKey('flatDawn', 'flatDay', 0);
    const fl = flash(t); if (fl > 0) { K.hemiI += 3.5 * fl; K.exp += .5 * fl; K.top = K.top.clone().lerp(C('#c8d4ff'), fl * .6); K.mid = K.mid.clone().lerp(C('#a8b8e8'), fl * .6); }
    applyKey(K, renderer);
    const nightish = ['night', 'storm', 'dark', 'dusk'].includes(KEY_OF[id]);
    ST.visible = KEY_OF[id] === 'night' && id !== 'power' ? true : id === 'power' && t > T.powerOn + 2; ST.material.uniforms.t.value = t;
    const pw = powerOn(t);
    W.update(t, { night: nightish ? (KEY_OF[id] === 'dusk' ? .8 : 1) : FLAT.includes(id) ? 0 : 0, day: nightish ? null : [K.mid.r * .45, K.mid.g * .48, K.mid.b * .55] });
    const lampsOn = nightish && pw;
    lampGlows.forEach((g, i) => { g.visible = lampsOn; }); lamps.forEach(Lp => Lp.userData.bulb.material.color.setRGB(lampsOn ? 3 : .5, lampsOn ? 2.5 : .48, lampsOn ? 1.6 : .45));
    stepLamps.forEach((g, i) => { const z = -6 - i * 12, on = id === 'power' ? t > onT(V3(0, yAt(z), 0)) : pw; g.visible = nightish && on; });
    lanterns.visible = id === 'festival';
    PNm.userData.update(cam);
    const storm = ['depart', 'car1', 'climb', 'loop', 'release'].includes(id) ? (id === 'release' ? 1 - ss(seg(u, .3, 1)) * .6 : 1) : 0;
    const snowing = !FLAT.includes(id) && !ENG.includes(id);
    snow.visible = snowing; streaks.visible = snowing && storm > .1;
    if (snowing) { const far = cam.position.distanceTo(look); snowC.copy(look).lerp(cam.position, .35); snowS = Math.min(90, Math.max(18, far * .9)); wind = storm ? 3.5 : .4; snowA = storm ? 1 : .6; snow.userData.update(t); streaks.position.copy(cam.position).lerp(look, .25); streaks.material.opacity = (far > 30 ? .1 : .26) * storm; streaks.userData.update(t, [-12, 0]); }
    lanterns.userData.update(t);
    // the cars
    const s1 = placeCars(t);
    const carOn = pw && !['final', 'end'].includes(id) ? 1 : id === 'end' ? .3 : t > T.three && t < T.powerOn + 1 ? .7 : nightish ? .14 : 0;
    for (const [cr, L, G] of [[car1, carL1, carG1], [car2, carL2, carG2]]) { cr.userData.glass.emissiveIntensity = nightish && carOn > .5 ? .9 : 0; cr.userData.glass.opacity = carOn > .5 ? .22 : .1; cr.userData.bulb.material.color.setRGB(.2 + 2.6 * carOn, .18 + 2.2 * carOn, .12 + 1.4 * carOn); L.position.copy(cr.position).add(V3(0, 2, 0)); L.intensity = nightish ? 4 * carOn : 0; G.position.copy(cr.position).add(V3(0, 1.6, 0)); G.visible = nightish && carOn > 0 && cam.position.distanceTo(cr.position) > 12; G.material.opacity = carOn > .5 ? .8 : .5; G.scale.setScalar(Math.max(1, cam.position.distanceTo(cr.position) / 25)); }

    let focusOn = null, tiltC = null, band = 1;
    const idle = (tt, s = 0) => blinkOr(tt, Math.floor((tt + s) * 1.1) % 2 ? 'idle1' : 'idle0', 'blink', s);
    const seatPos = (cr, i = 1) => cr.localToWorld(cr.userData.seat(i).clone());

    // ——— the flat ———
    if (FLAT.includes(id)) {
      const night = id === 'kitchen';
      const fin = id === 'final';
      bulbF.position.copy(F0).add(V3(.9, FL.RH - .6, .1)); bulbF.intensity = night ? 5.5 : 3.2;
      bulbM.position.set(MW(F0.x + .9), FL.RH - .6, F0.z + .1); bulbM.intensity = night ? 0 : 2.6;
      winF.position.copy(F0).add(V3(-1.25, 1.6, -.9)); winF.intensity = night ? .3 : fin ? 2.2 : 1.4; winF.color.set(fin ? '#ffd0a0' : '#a8b8e0');
      winM.position.set(MW(F0.x - 1.25), 1.6, F0.z - .9); winM.intensity = winF.intensity; winM.color.copy(winF.color);
      FR.win.material.color.set(night ? '#0c1428' : fin ? '#ffc8a0' : '#8aa0c8'); MR.win.material.color.set(night ? '#0c1428' : fin ? '#ffc8a0' : '#7a8aa8');
      FR.bulb.material.color.setRGB(3, 2.6, 1.8); MR.bulb.material.color.setRGB(night ? .2 : 2.6, night ? .18 : 2.3, night ? .14 : 1.6);
      fill.position.copy(F0).add(V3(-.6, 1.9, 2.2)); fill.intensity = 1.1;
      // the room behind the glass: the future in its current state
      let mk = 15; for (const [a, n] of [[T.m14, 14], [T.m13, 13], [T.m12, 12]]) if (t >= a) mk = n;
      if (id === 'marks') { mk = 9; for (const [a, n] of [[T.k10, 10], [T.k11, 11], [T.k12, 12], [T.k13, 13], [T.k14, 14], [T.k15, 15]]) if (t >= a) mk = n; }
      if (['test', 'inventory', 'open'].includes(id)) mk = 15;
      if (t >= shot('letter').a) mk = 12;
      if (fin) { mk = 15; for (const [a, n] of [[T.k16, 16], [T.k17, 17], [T.k19, 19]]) if (t >= a) mk = n; if (t < vo('n42').t) mk = 15; }
      MR.marks.material.map = flipTex(markTex(mk)); MR.marks.material.emissiveMap = MR.marks.material.map;
      MR.boxes.visible = !fin; MR.coats.pip.visible = false; MR.coats.pip19.visible = fin; MR.chairs[1].visible = fin; MR.tableMug2.visible = fin; MR.door.visible = true; MR.pipSign.visible = fin;
      MR.coats.sam.material = MR.coats.sam.material;   // (faded green is the same mesh)
      FR.boxes.visible = false; FR.coats.pip.visible = !(id === 'pip1' && t > T.pipIn) && !(id === 'final' && t > T.pipIn2 + 4);
      FR.stool.position.set(RW / 2 - .9, 0, id === 'sit' ? -.05 : 1.2);
      // Sam at the glass
      const S0 = V3(F0.x + 1.4, 0, F0.z - .05);
      let sp_ = S0.clone(), sf = idle(t), rf = null, show51 = true, refl = fin ? sam51up : sam51;
      if (id === 'open') {
        SU.fogA.value = 1 - ss(seg(t, sh.b - 2.4, sh.b)) * .25; SU.wipe.value = ss(seg(t, T.wipe + .2, T.wipe + 1.6)); SU.write.value = ss(seg(t, T.write, T.write + 1.8));
        sf = t < T.wipe + 1.7 ? (Math.floor(t * 4) % 2 ? 'wipe0' : 'wipe1') : t < T.recoil ? blinkOr(t, 'stare', 'wide') : t < T.recoil + 1.6 ? 'recoil' : talking(t, 's01') ? 'worry' : blinkOr(t, 'worryF', 'worryB');
        if (t > T.recoil) { const k = ss(seg(t, T.recoil, T.recoil + .5)); sp_.x -= .35 * k; sp_.z += .2 * k; }
        rf = t < T.write - .2 ? blinkOr(t, 'stare', 'blink', .4) : t < T.write + 2 ? (Math.floor(t * 3) % 2 ? 'write' : 'write2') : blinkOr(t, 'flat', 'flatBlink', .4);
      } else if (id === 'test') {
        const r0 = T.raise + .6; sf = t < r0 ? idle(t) : t < r0 + 5 ? 'raise' : talking(t, 'n10') ? blinkOr(t, 'lean', 'blink') : blinkOr(t, 'worryF', 'worryB');
        rf = t < r0 + .25 ? blinkOr(t, 'flat', 'flatBlink', .3) : t < r0 + 5.25 ? 'raise' : blinkOr(t, 'flat', 'flatBlink', .3);
      } else if (id === 'inventory') { sf = blinkOr(t, 'lean', 'blink'); rf = blinkOr(t, 'flat', 'flatBlink', .3); }
      else if (id === 'marks') { sp_ = V3(F0.x - 1.2, 0, F0.z + .6); sf = blinkOr(t, 'worryF', 'worryB'); rf = 'flat'; }
      else if (id === 'pip1') {
        sf = t < T.pipIn + 1.5 ? blinkOr(t, 'worryF', 'worryB') : talking(t, 's02') || talking(t, 's03') ? 'talkB' : blinkOr(t, 'worryF', 'worryB');
        if (talking(t, 'n19')) sf = 'stare';
        rf = blinkOr(t, 'flat', 'flatBlink', .3);
        const k = ss(seg(t, T.pipIn, T.pipIn + 3.2)); const pp = V3(lerp(F0.x - 2.1, F0.x + 1.15, k), 0, lerp(F0.z - .85, F0.z + .4, k));
        place(pipIn, pp.x, 0, pp.z); pipIn.frame(k < 1 ? walk4(t, 7) : talking(t, 'p01') || talking(t, 'p02') || talking(t, 'p03') ? speak(t, ['p01', 'p02', 'p03'], 'talk', 'smile') : t > vo('p03').t + vo('p03').d ? blinkOr(t, 'worry', 'blink') : blinkOr(t, 'smile', 'smileBlink')); pipIn.face(cam);
        if (t > vo('p03').t - .2 && t < vo('p03').t + 2.4) pipIn.frame('brush');
      } else if (id === 'mornings') { sf = 'worryF'; rf = 'flat'; }
      else if (id === 'kitchen') {
        sp_ = V3(F0.x + 1.5, 0, F0.z - .2); sf = talking(t, 's08') ? 'stop' : t < vo('s08').t ? blinkOr(t, 'flat', 'flatBlink') : blinkOr(t, 'worryF', 'worryB');
        const ch = V3(F0.x - .5, .02, F0.z - .78);
        const walkOut = t > T.doorSlam - 2.6;
        if (!walkOut) { place(pipIn, ch.x, ch.y, ch.z); pipIn.frame(t < vo('p06').t - .2 ? 'sitBlink' : talking(t, 'p06') ? 'sit' : t < T.fold ? 'sitWorry' : 'sitWorry'); }
        else { const k = ss(seg(t, T.doorSlam - 2.6, T.doorSlam - .3)); place(pipIn, lerp(ch.x, F0.x - 2.2, k), 0, lerp(ch.z + .3, F0.z - .85, k)); pipIn.frame(k < 1 ? walk4(t, 7, 'wd') : 'fold'); pipIn.mesh.scale.x = -1; }
        if (!walkOut && t > vo('p06').t - .4 && t < vo('s08').t + .5) { pipIn.root.visible = true; pipIn.root.position.set(ch.x + .5, 0, ch.z + .25); pipIn.frame(speak(t, ['p06'], 'drawingUp', 'drawingT')); }
        if (!walkOut && t > vo('p07').t - .3) { pipIn.root.position.set(ch.x + .5, 0, ch.z + .25); pipIn.frame(t < T.fold ? 'pout' : 'fold'); }
        pipIn.face(cam, walkOut); show51 = false;
        FR.door.rotation.y = t > T.doorSlam - 1.6 && t < T.doorSlam ? -1.2 : 0;
      } else if (id === 'letter') {
        sf = t < T.hmirror ? blinkOr(t, 'lean', 'blink') : t < T.letterCard + 11 ? 'hmirror' : blinkOr(t, 'worryF', 'worryB');
        rf = t < T.letterUp + .8 ? 'flat' : 'letter';
      } else if (id === 'sit') {
        const k = ss(seg(t, T.sitDown, T.sitDown + 1.2)); sp_ = V3(F0.x + lerp(1.4, 1.6, k), k > .5 ? .2 : 0, F0.z - .05);
        sf = k < .5 ? 'worryF' : blinkOr(t, 'sitWorry', 'sitBlink'); rf = sf;
      } else if (fin) {
        sf = t < T.look ? blinkOr(t, 'worryF', 'worryB') : t < vo('n43').t ? blinkOr(t, 'stare', 'blink') : blinkOr(t, 'smile', 'smileBlink');
        rf = t < vo('n43').t ? blinkOr(t, 'mugSmile', 'mug', .3) : 'mugSmile';
        // Pip at 19 beside him in the glass: ties her hair, shoulders the bag, a kiss on the cheek
        if (t > vo('n43').t - .6 && t < T.leave + 1) {
          const pz = F0.z - .75, px = F0.x + 1.1, a = vo('n43').t;
          const pf = t < a + 2.5 ? 'tie' : t < vo('n44').t ? blinkOr(t, 'bag', 'bagB') : t < vo('n45').t ? 'kiss' : blinkOr(t, 'bag', 'bagB');
          pip19.frame(pf); mirrorChar(pip19, V3(px, 0, pz), cam, 0);
        }
        if (t > T.pipIn2) { const k = ss(seg(t, T.pipIn2, T.pipIn2 + 2.4)); const pp = V3(lerp(F0.x - 2.1, F0.x + 1.15, k), 0, lerp(F0.z - .85, F0.z + .4, k));
          if (t > T.leave) { const k2 = ss(seg(t, T.leave, T.leave + 2.2)); pp.set(lerp(F0.x + 1.15, F0.x - 1.6, k2), 0, lerp(F0.z + .4, F0.z + .9, k2)); }
          place(pipIn, pp.x, 0, pp.z); pipIn.frame(k < 1 || t > T.leave ? walk4(t, 7) : talking(t, 'p17') ? 'talk' : blinkOr(t, 'smile', 'smileBlink')); pipIn.face(cam, t > T.leave); if (t > T.leave) pipIn.mesh.scale.x = -1; }
        if (t > T.leave + .6) { const k2 = ss(seg(t, T.leave + .6, T.leave + 2.6)); sp_.set(lerp(S0.x, F0.x - 1.3, k2), 0, lerp(S0.z, F0.z + .8, k2)); sf = walk4(t, 7); }
      }
      place(sam, sp_.x, sp_.y, sp_.z); sam.frame(sf); sam.face(cam, (id === 'final' && t > T.leave + .6) || id === 'marks');
      if ((id === 'final' && t > T.leave + .6) || id === 'marks') sam.mesh.scale.x = -1;
      if (id === 'kitchen' && t < shot('kitchen').a + 1.5) sam.root.visible = true;
      // the man in the glass
      if (show51 && rf) { refl.frame(refl.atlas.names.includes(rf) ? rf : 'idle0'); const at = id === 'open' ? S0.clone() : sp_; mirrorChar(refl, at, cam, 0); if (id === 'marks' || id === 'mornings') refl.root.visible = false; if (fin && t > T.leave + 1.5) refl.root.visible = false; }
      focusOn = id === 'marks' && u > .35 || id === 'mornings' ? V3(MW(F0.x - 2.41), 1.45, F0.z - .4) : id === 'marks' ? V3(F0.x - 2.41, 1.38, F0.z - .4) : id === 'kitchen' ? V3(F0.x - .2, 1, F0.z - .7) : id === 'open' ? H0.clone().add(V3(.3, .3, 0)) : sam.root.position.clone().add(V3(0, 1.4, 0));
    }

    // ——— the engine house ———
    if (ENG.includes(id)) {
      const dark = id === 'eh2';
      ER.wheel.rotation.x = dark ? -2.2 : -t * (id === 'wheel' ? .25 : .5);
      ehBulb.position.copy(E0).add(V3(.6, 3.2, 1.2)); ehBulb.intensity = dark ? 0 : 11; ER.bulb.material.color.setRGB(dark ? .1 : 3, dark ? .09 : 2.6, dark ? .07 : 1.8);
      stoveL.intensity = 2.2 * flick(t, 2); ER.fire.material.color.setRGB(2.2 * flick(t), 1.0 * flick(t), .35);
      ER.win.material.color.set(dark ? '#141c2c' : '#30466a');
      fill.position.copy(E0).add(V3(1.5, 2.2, 3.2)); fill.intensity = dark ? .6 : 1.8; fill.color.set('#ffe0c0');
      ER.lever.rotation.z = 0;
      if (id === 'engine') {
        const ring = t > T.ring && t < vo('o03').t; const p0 = V3(E0.x + 2.4, 0, E0.z + 1.4);
        const k = ss(seg(t, sh.a + 1, sh.a + 4.5)); const sp_ = V3(lerp(E0.x - 2.6, p0.x, k), 0, lerp(E0.z + .6, p0.z, k));
        place(sam, sp_.x, 0, sp_.z); sam.frame(k < 1 && k > 0 ? walk4(t, 7) : t > T.ring + 1.0 ? (talking(t, 'o03') ? 'phoneW' : 'phone') : idle(t)); sam.face(cam);
        focusOn = sam.root.position.clone().add(V3(0, 1.2, 0));
        ER.radio.material = CM.dark;
      } else if (id === 'eh2') {
        const go = T.goOut; const k = ss(seg(t, go - .2, go + 1.4)); const sp_ = V3(lerp(E0.x + 2.4, E0.x - 3.4, k), 0, lerp(E0.z + 1.4, E0.z + 1.4, k));
        place(sam, sp_.x, 0, sp_.z); sam.frame(t < vo('s12').t + vo('s12').d * .6 ? speak(t, ['s12'], 'radio', 'radioL') : k < 1 ? walk4(t, 8, 'wl') : 'lamp'); sam.face(cam, k > 0); if (k > 0) sam.mesh.scale.x = -1;
        const hp = sam.handPos(k > 0); lampL.position.copy(hp).add(V3(0, .1, .3)); lampL.intensity = 2.2; lampG.position.copy(hp); lampG.visible = true;
        ER.lampHang.visible = t < vo('s12').t + 1; focusOn = sam.root.position.clone().add(V3(0, 1.1, 0));
      } else if (id === 'wheel') {
        const pp = V3(E0.x + 1.1, 0, E0.z + .2); place(pip, pp.x, 0, pp.z); fill.position.copy(pp).add(V3(.8, 1.4, 1.6)); fill.intensity = 1.6; fill.color.set('#ffd8b0'); pip.frame(talking(t, 'p15') || talking(t, 'p16') ? 'radioS' : t > vo('p16').t + vo('p16').d ? blinkOr(t, 'smile', 'smileBlink') : blinkOr(t, 'radioS', 'radioS')); pip.face(cam);
        if (t > vo('p16').t - .2) { pip.frame(t < vo('p16').t + 1.5 ? 'lever' : 'smile'); ER.lever.rotation.z = -.35 * ss(seg(t, vo('p16').t, vo('p16').t + .5)); }
        focusOn = pip.root.position.clone().add(V3(0, .9, 0));
      }
    }

    // ——— the hill ———
    if (!FLAT.includes(id) && !ENG.includes(id)) {
      const tiny = ['title', 'board', 'depart', 'power', 'end', 'release'].includes(id) && !(id === 'release' && u < .15);
      if (id === 'title' || id === 'end') { focusOn = trackPt(.5, 0, 1.4); tiltC = .5; band = 1.2; }
      if (id === 'hill') { focusOn = look.clone(); }
      if (id === 'board') { focusOn = look.clone(); tiltC = .5; band = 2.2; }
      if (id === 'lake') {
        const ice = V3(24, 0, 15);
        for (const [c, i] of [[kids[0], 0], [kids[1], 1], [folk[4], 2]]) { const a = t * .35 + i * 2.1; place(c, ice.x + Math.cos(a) * (4 + i), 0, ice.z + Math.sin(a) * 3); c.frame('w' + (Math.floor(t * 3 + i) % 4)); c.face(cam, Math.sin(a) > 0); if (Math.sin(a) > 0) c.mesh.scale.x = -1; }
        const pk = ss(seg(t, vo('s04').t + .4, vo('s04').t + 2.2)); place(pip, lerp(ice.x - 1.5, ice.x - 4.6, pk), 0, ice.z + 1.2); pip.frame(t < vo('s04').t + .3 ? 'cheer' : talking(t, 'p04') ? 'talkO' : pk < 1 ? walk4(t, 6) : blinkOr(t, 'pout', 'poutB')); pip.face(cam, pk > 0 && pk < 1); if (pk > 0 && pk < 1) pip.mesh.scale.x = -1;
        const sk = ss(seg(t, sh.a, sh.a + 2.2)); place(sam, lerp(ice.x - 10, ice.x - 6, sk), 0, ice.z + 1.4); sam.frame(sk < 1 ? walk4(t, 7) : talking(t, 's04') ? 'stop' : blinkOr(t, 'worryF', 'worryB')); sam.face(cam);
        focusOn = V3(ice.x - 4, 1, ice.z + 1.3);
      }
      if (id === 'sled') {
        const top = V3(SLED.x, terrain(SLED.x, -30) + .25, -30); sled.visible = true; sled.position.set(top.x, top.y + .1, top.z + .6); sled.rotation.x = Math.atan2(yAt(-34), 34);
        place(pip, top.x + .2, top.y + .25, top.z + .2); pip.frame(t < vo('s05').t + .6 ? 'cheer' : blinkOr(t, 'pout', 'poutB')); pip.face(cam);
        place(sam, top.x - 1.6, terrain(top.x - 1.6, -29) + .05, -29); sam.frame(talking(t, 's05') ? 'stop' : blinkOr(t, 'worryF', 'worryB')); sam.face(cam);
        place(kids[0], top.x + 1.4, terrain(top.x + 1.4, -31) + .05, -31); kids[0].frame('idle0'); kids[0].face(cam, true); kids[0].mesh.scale.x = -1;
        focusOn = V3(top.x - .6, top.y + 1, top.z + .5);
      }
      if (id === 'door') {
        const dp = V3(-4.6, H, -LZ - 2.4);
        place(pip, dp.x + 1.2, H, dp.z + .6); pip.frame(talking(t, 'p05') ? 'talk' : t < T.doorShut ? blinkOr(t, 'worry', 'blink') : blinkOr(t, 'pout', 'poutB')); pip.face(cam, true); pip.mesh.scale.x = -1;
        place(sam, dp.x, H, dp.z); sam.frame(talking(t, 's06') ? 'stop' : blinkOr(t, 'flat', 'flatBlink')); sam.face(cam); if (t > T.doorShut - .3) sam.root.visible = false;
        EHdoor.rotation.y = t < T.doorShut - .3 ? 1.3 : 0; EHdoor.position.x = t < T.doorShut - .3 ? -5.0 : -4.6;
        focusOn = V3(dp.x + .6, H + 1, dp.z + .3);
      } else { EHdoor.rotation.y = 0; EHdoor.position.x = -4.6; }
      if (id === 'booth') {
        place(odile, BOOTH.x, 0, BOOTH.z - .2); odile.frame(talking(t, 'o01') ? 'point' : t > vo('s07').t ? blinkOr(t, 'cross', 'cross1') : blinkOr(t, 'cross', 'cross1')); odile.face(cam);
        boothL.intensity = 2;
        const k = ss(seg(t, sh.a + .2, sh.b)); const x = lerp(-1.2, -9.5, k);
        place(sam, x, 0, BOOTH.z + 2.4); sam.frame(talking(t, 's07') ? 'talkB' : walk4(t, 6)); sam.face(cam, true); sam.mesh.scale.x = -1;
        place(pip, x - .8, 0, BOOTH.z + 2.7); pip.frame(walk4(t + .2, 6)); pip.face(cam, true); pip.mesh.scale.x = -1;
        focusOn = V3(BOOTH.x + 1.5, 1.2, BOOTH.z + 1.2);
      }
      if (id === 'festival') {
        const ce = V3(-1, 0, 8.5);
        folk.forEach((c, i) => { const a = i / folk.length * Math.PI * 2 + .3; place(c, ce.x - 3 + Math.cos(a) * 5.5, 0, ce.z + 3 + Math.sin(a) * 3.5); c.frame(i % 3 === 0 ? 'mug' : i % 3 === 1 ? 'cheer' : idle(t, i)); if (i % 3 === 1 && Math.floor(t * 1.6 + i) % 2) c.frame('idle0'); c.face(cam, i % 2 === 0); if (i % 2 === 0) c.mesh.scale.x = -1; });
        place(odile, BOOTH.x + .4, 0, BOOTH.z + 1.6); odile.frame(talking(t, 'o02') ? 'talk' : blinkOr(t, 'cross', 'cross1')); odile.face(cam); boothL.intensity = 2.5;
        place(sam, ce.x + 1.4, 0, ce.z - 1.2); sam.frame(speak(t, ['s09', 's10'], 'talkB', 'worryF')); sam.face(cam, true); sam.mesh.scale.x = -1;
        const go = ss(seg(t, T.pipGo - .6, T.pipGo + 2.6));
        place(pip, lerp(ce.x + .2, ce.x - 5.5, go), 0, lerp(ce.z - .9, ce.z + 4.5, go)); pip.frame(go > 0 ? walk4(t, 7, 'wd') : speak(t, ['p08', 'p09'], 'drawingT', 'drawing')); if (go === 0 && !talking(t, 'p08') && !talking(t, 'p09')) pip.frame('fold'); pip.face(cam, go > 0); if (go > 0) pip.mesh.scale.x = -1;
        focusOn = V3(ce.x + .8, 1, ce.z - 1);
      }
      if (id === 'depart') { focusOn = car1.position.clone(); tiltC = null; band = 1.6; }
      if (id === 'car1' || id === 'loop' || id === 'release') {
        const ps = seatPos(car1, 0); place(pip, ps.x, ps.y - .12, ps.z + .15); pip.face(cam);
        pip.frame(id === 'car1' ? (talking(t, 'p10') ? 'sitTalk' : blinkOr(t, 'sitTorch', 'sitTorchB')) : talking(t, 'p13') || talking(t, 'p14') ? 'sitTalk' : t > vo('s19').t - .2 && t < T.three + 2 ? 'lever' : blinkOr(t, 'sitTorch', 'sitTorchB'));
        if (pip.cur === 'lever') pip.root.position.y += .1;
        const hp = pip.handPos(); torchL.position.copy(hp).add(V3(.2, .3, .5)); torchL.intensity = id === 'release' ? 1.0 : .9; torchG.position.copy(hp); torchG.visible = true; torchG.scale.setScalar(Math.max(.25, cam.position.distanceTo(hp) / 12));
        focusOn = pip.root.position.clone().add(V3(0, .8, 0));
      }
      if (id === 'climb') {
        place(sam, samClimb.x, samClimb.y, samClimb.z); const tk = speak(t, ['s13', 's14'], 'radio', null);
        sam.frame(tk || walk4(t, 6, 'wl')); sam.face(cam, true); sam.mesh.scale.x = -1;
        const hp = sam.handPos(true); const meter = 1 - .55 * seg(t, sh.a, sh.b);
        lampL.position.copy(hp).add(V3(.3, .1, .4)); lampL.intensity = 7 * meter * (1 + .04 * Math.sin(t * 17)); lampG.position.copy(hp); lampG.visible = true; lampG.material.opacity = meter;
        focusOn = sam.root.position.clone().add(V3(0, 1, 0));
      }
      if (id === 'loop' || id === 'release') {
        const arrive = V3(STEPX, yAt(-37.4) + .1, -37.4), c2 = seatPos(car2, 0).add(V3(0, -.02, .15));
        const k = ss(seg(t, T.climbIn, T.climbIn + 1.4));
        if (id === 'loop' && t < T.climbIn) { const kw = ss(seg(t, sh.a, T.climbIn)); place(sam, arrive.x, yAt(lerp(-35, -37.4, kw)) + .1, lerp(-35, -37.4, kw)); sam.frame(kw < 1 ? walk4(t, 6, 'wl') : 'lamp'); }
        else if (id === 'loop' && k < 1) { place(sam, lerp(arrive.x, c2.x, k), lerp(arrive.y, c2.y - .1, k), lerp(arrive.z, c2.z, k)); sam.frame('wl1'); }
        else { place(sam, c2.x, c2.y - .1, c2.z); sam.frame(t > vo('s19').t - .2 && t < T.three + 2 ? (t > T.three ? 'pull' : 'lever') : speak(t, ['s15', 's16', 's17', 's18', 's19'], 'sitLampT', 'sitLamp')); }
        sam.face(cam, true); sam.mesh.scale.x = -1;
        const hp = sam.handPos(true), meter = .45;
        lampL.position.copy(hp).add(V3(.3, .3, .5)); lampL.intensity = 1.6; lampG.position.copy(hp); const far_ = cam.position.distanceTo(hp); lampG.visible = far_ > 9; lampG.material.depthTest = far_ < 9; torchG.material.depthTest = far_ < 9; torchG.visible = far_ > 9; lampG.material.opacity = .7; lampG.scale.setScalar(far_ / 10); torchG.scale.setScalar(far_ / 12);
        if (id === 'release') { const f = ss(seg(u, .05, .4)); focusOn = car1.position.clone().lerp(car2.position, .5 * (1 - f) + 0 * f).lerp(car1.position, f * .5); band = 1 + u * .8; tiltC = u > .3 ? .5 : null; }
        else focusOn = V3(0, 25.6, -39.6);
      }
      if (id === 'power') { focusOn = V3(0, 20, -32); tiltC = .52; band = 1.5; }
      if (tiny && !focusOn) focusOn = look.clone();
      if (['car1', 'climb', 'loop', 'lake', 'sled', 'door', 'booth', 'festival'].includes(id) && focusOn) { fill.position.copy(focusOn).lerp(cam.position, .25).add(V3(0, .6, 0)); fill.intensity = nightish ? 2.2 : 1.2; fill.distance = 9; fill.color.set(nightish ? '#a8b8e8' : '#fff0e0'); }
    }

    const fo = focusOn || look;
    post.dof.focus = cam.position.distanceTo(fo);
    const far = post.dof.focus > 25;
    post.dof.aper = far ? 420 : FLAT.includes(id) ? 90 : 220; post.dof.maxCoc = far ? 20 : 15;
    if (id === 'marks' || id === 'mornings') { post.dof.aper = 120; post.dof.maxCoc = 12; }
    post.bloom.strength = nightish ? .75 : FLAT.includes(id) || ENG.includes(id) ? .6 : .45; post.bloom.threshold = nightish ? .78 : .86;
    post.vig.uniforms.warm.value = ENG.includes(id) || id === 'festival' || id === 'final' ? .18 : nightish ? .06 : .1;
    post.vig.uniforms.amt.value = nightish || ENG.includes(id) ? .66 : .55;
    const inside = FLAT.includes(id) || ENG.includes(id) || ['car1', 'loop', 'climb'].includes(id);
    return { tiltC, track: tiltC == null ? fo : null, band: inside ? 3.6 : band, tiltAmt: inside ? 8 : 17 };
  }
  return { scene, update };
}
