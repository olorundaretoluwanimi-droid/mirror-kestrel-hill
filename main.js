// What If Your Mirror Showed You in 10 Years? (Kestrel Hill) — page contract: window.DUR, window.render(t), window.READY, window.TEXTS, window.EV
import * as THREE from 'three';
import { makePost } from './post_ts.js';
import { DUR, shotAt, shot, VO, T, vo } from './story.js';
import { buildWorld } from './world.js';
import { drawOverlay, overlayReady } from './ui.js';
import { HILL, yAt } from './sets.js';

const W = 1920, H = 1080, Q = new URLSearchParams(location.search);
const SS = +(Q.get('ss') ?? 1);
const renderer = new THREE.WebGLRenderer({ antialias: false, preserveDrawingBuffer: true });
renderer.setPixelRatio(1); renderer.setSize(W, H);
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.1;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.getElementById('stage').appendChild(renderer.domElement);
renderer.domElement.style.width = W + 'px'; renderer.domElement.style.height = H + 'px';
const camera = new THREE.PerspectiveCamera(32, W / H, .1, 2000);
const world = buildWorld();
const post = makePost(renderer, world.scene, camera, W, H, { ssaa: SS });
const V = post.vig.uniforms;
await overlayReady();

const TILT = !Q.has('notilt');
const _v = new THREE.Vector3();
window.DUR = DUR; window.SHOTS = (await import('./story.js')).SHOTS;
window.render = t => {
  const sh = shotAt(t);
  post.dof.scene = world.scene;
  V.fade.value = 1; V.warm.value = .1; V.sat.value = 1.05; V.amt.value = .6; V.contrast.value = .2;
  post.bloom.radius = .7;
  const r = world.update(t, sh, camera, post, renderer) || {};
  camera.updateProjectionMatrix();
  if (TILT) {
    let c = r.tiltC;
    if (c == null && r.track) { camera.updateMatrixWorld(); _v.copy(r.track).project(camera); c = Math.min(.8, Math.max(.2, _v.y * .5 + .5)); }
    post.dof.tiltAmt = r.tiltAmt ?? 17; post.dof.tiltC = c ?? .45; post.dof.tiltW = (r.tiltW ?? .075) * (r.band ?? 1); post.dof.tiltF = .3;
    post.dof.maxCoc = Math.max(post.dof.maxCoc, 22); V.sat.value *= 1.12; V.contrast.value = .26;
  }
  post.composer.render();
  drawOverlay(t);
};
window.TEXTS = t => drawOverlay(t);
// Sound events for the mixer (exported by events.mjs)
const ev = (t, type, o = {}) => ({ t, type, ...o });
const steps = (a, b, dt, surf) => { const o = []; for (let x = a; x < b; x += dt) o.push(ev(x, 'step', { surf })); return o; };
const S = id => shot(id); const SH = window.SHOTS;
window.EV = [
  ...VO.map(v => ({ t: v.t, type: 'voice', id: v.id, dlg: !!v.dlg, sub: v.sub, who: v.who, radio: !!v.radio, phone: !!v.phone })),
  ...VO.filter(v => v.dlg && !v.radio && !v.phone).map(v => ev(v.t - .45, 'chime')),
  ...VO.filter(v => v.radio).map(v => ev(v.t - .25, 'squelch')),
  ...S('open') ? [ev(T.wipe + .2, 'squeak'), ev(T.wipe + .9, 'squeak'), ev(T.wipe + 1.6, 'reveal'), ev(T.recoil, 'recoil'), ...steps(T.recoil, T.recoil + .5, .25, 'wood'), ev(T.write, 'squeak'), ev(T.write + 1.0, 'squeak')] : [],
  ev(T.title, 'title'),
  ...steps(T.pipIn, T.pipIn + 3.2, .38, 'wood'),
  ev(S('lake').a + .3, 'ice'), ev(vo('s04').t + .6, 'ice'), ...steps(S('lake').a, S('lake').a + 2.2, .45, 'snow'),
  ev(S('sled').a + .4, 'sled'),
  ev(T.doorShut - .3, 'doorSlam'),
  ev(S('booth').a + .3, 'boothWin'), ...steps(S('booth').a + .2, S('booth').b, .5, 'snow'),
  ev(T.m14, 'tick'), ev(T.m13, 'tick'), ev(T.m12, 'tick'),
  ev(vo('p06').t - .2, 'paper'), ev(T.fold, 'paper'), ev(T.fold + .7, 'paper'), ...steps(T.doorSlam - 2.6, T.doorSlam - .3, .35, 'wood'), ev(T.doorSlam - .2, 'doorSlam'),
  ev(T.letterUp + .6, 'paper'), ev(T.hmirror, 'click'), ev(T.letterCard, 'flipGlass'), ev(T.letterCard + 4.0, 'heart'), ev(T.letterCard + 4.9, 'heart'),
  ev(T.sitDown + .5, 'chair'),
  ...steps(T.pipGo - .6, T.pipGo + 2.6, .33, 'snow'),
  ...[0, 1.2, 2.4, 3.6].map(d => ev(T.ring + d, 'ring')), ev(vo('o03').t - .3, 'pickup'),
  ev(T.flash, 'thunder'), ev(T.blackout, 'powerDown'),
  ev(T.goOut + .3, 'door'), ...steps(S('climb').a + .4, S('climb').b - .6, .42, 'steel'),
  ...steps(S('loop').a, T.climbIn, .42, 'steel'), ev(T.climbIn + .4, 'carDoor'),
  ev(T.three, 'brake'), ev(T.three + .3, 'cable'),
  ev(T.powerOn, 'powerUp'), ...[...Array(14)].map((_, i) => ev(T.powerOn + .5 + i * .27, 'bell', { i })),
  ev(vo('p16').t + .3, 'lever'),
  ev(T.look, 'squeak'), ...steps(T.pipIn2, T.pipIn2 + 2.4, .38, 'wood'), ...steps(T.leave, T.leave + 2.4, .38, 'wood'), ev(T.leave + 2.6, 'door'),
  ev(T.endTitle, 'title'),
  ...SH.map(s => ev(s.a, 'shot', { id: s.id, b: s.b })), ...Object.entries(T).map(([k, v]) => ev(v, 'mark', { id: k })),
];
window.READY = true;
