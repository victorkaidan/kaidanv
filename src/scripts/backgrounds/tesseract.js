// Tesseract page background (Victor's "tesseract-background.html", 2026-11).
// The simulation and renderer below are the original file, plus one option
// marked "kaidanv.com addition" (activeZone, widthFraction). The mounting at the end is
// new: a transparent canvas (the site background shows through), figure
// colours taken from the theme (--bg-art-edge / -dot in global.css), updated
// live when the theme toggles, and the cursor (spotlight and pull) limited to
// the sides of the content block.
/* eslint-disable */

/**
 * Hyperspace Tesseract: an interactive canvas background (no dependencies).
 *
 * WHAT THE POINTER CAN AND CANNOT DO
 * Every pose is one rotation of the rest pose in a plane that contains the
 * W axis: the plane spanned by W and a direction â in XYZ, by the angle |a|.
 * The state is just a = [aXW, aYW, aZW]. The 3D view is fixed, so nothing the
 * pointer does can rotate the figure in XY, YZ or XZ, and no 3D twist builds
 * up from repeated gestures (which would happen if XW/YW/ZW rotations were
 * simply composed frame after frame: they do not commute).
 *
 * HOW THE CURSOR TURNS IT
 * The cursor is a soft attractor in screen space. Its pull on each corner is
 * converted by virtual work (force · ∂corner/∂a) into a push on the three
 * hyperspace angles. A corner can only approach the cursor by the cube
 * turning inside out: an inner corner (far away in W) pulled outward rotates
 * into our 3D space, an outer corner pulled inward rotates out of it.
 *   - Position pull: slow drags hold and steer corners. A held corner trails
 *     the cursor and loses its grip when the cursor outruns the field.
 *   - Velocity drag: quick flicks shove nearby corners along the flick.
 *   - Inertia + attractor lag + speed cap: the response trails the pointer,
 *     so the same path drawn fast or slow turns the cube differently.
 *   - A push strong enough re-aims the idle turn: after release the cube keeps
 *     turning inside out along the plane you pushed it into.
 *
 * USAGE
 *   import { createTesseractBackground } from './tesseract-bg.js';
 *   const bg = createTesseractBackground(document.querySelector('.hero-bg'), { size: 0.8 });
 *   bg.set({ idleSpeed: 0.1 });   // live changes
 *   bg.destroy();                 // on unmount
 */

const TAU = Math.PI * 2;

const TESSERACT_DEFAULTS = Object.freeze({
  // Look
  background: '#F2F1EC',  // canvas fill; null = transparent
  edgeColor: '#D5D3C7',
  dotColor: '#ABA79C',
  size: 0.62,             // outer-cube span as a fraction of the host's shorter side
  widthFraction: null,    // kaidanv.com addition: widest span of the idle turn as a fraction of the host width; overrides size. null = use size
  center: [0.5, 0.5],     // figure centre, as fractions of host width / height
  yaw: -0.62,             // fixed three-quarter view (radians); the pointer never changes it
  pitch: 0.36,
  tumble: 0,              // optional ambient 3D drift, rad/s. 0 = pure hyperspace motion
  edgeOpacity: [0.2, 1],  // far → near (near = close to our 3D space and to the viewer)
  edgeWidth: [0.75, 1.5], // px
  dotRadius: [1.3, 3.2],  // px
  dotOpacity: [0.4, 1],
  tethers: true,          // faint lines from the cursor to the corners it is pulling
  spotlight: 300,         // px; the figure shows only within this radius of the cursor. 0 = off
  spotlightFade: 0.7,     // share of the radius over which it fades out toward the rim (0–1)
  spotlightFloor: 0,      // visibility outside the circle and when there is no cursor (0 = hidden)
  wDistance: 3,           // 4D eye distance: sets the inner/outer cube ratio (2 at rest)
  zDistance: 9,           // 3D eye distance

  // Idle motion
  idlePlane: [1, 0, 0],   // resting turn direction, as a mix of XW, YW, ZW
  idleSpeed: 0.16,        // rad/s; a full inside-out cycle every ~40 s
  startAngle: 0.5,        // rad into the cycle at load
  recovery: 1.8,          // s; time constant for easing back to idle speed after a push
  centering: 0.4,         // how firmly it returns to a clean single-plane turn
  axisSnap: false,        // after a push, settle onto the nearest of XW / YW / ZW

  // Cursor field
  interactive: true,
  activeZone: null,       // kaidanv.com addition: (x, y) => boolean in host px; the cursor shows and turns the figure only where true. null = everywhere
  attraction: 1,          // position pull on nearby corners
  drag: 1,                // velocity drag (flicks)
  damping: 1,             // how much a held corner resists moving: more = longer trail, steadier
  reach: 0.55,            // field radius in figure units (outer edge ≈ 3 units)
  lag: 0.14,              // s; the attractor trails the cursor by this much
  inertia: 1,             // higher = heavier, slower to start and to stop
  maxSpeed: 1.8,          // rad/s cap on hyperspace turning
  release: 2.4,           // s; a resting cursor lets go after this long (0 = never)
  magnet: 7,              // px; max local lean of a corner dot toward the cursor

  // Runtime
  reducedMotion: 'auto',  // 'auto' (honour the OS setting) | 'static' | 'ignore'
  maxDpr: 2,
});

// 16 corners (±1, ±1, ±1, ±1) and the 32 edges joining corners that differ in one coordinate.
const TESSERACT_VERTICES = [];
for (let i = 0; i < 16; i++) {
  TESSERACT_VERTICES.push([i & 1 ? 1 : -1, i & 2 ? 1 : -1, i & 4 ? 1 : -1, i & 8 ? 1 : -1]);
}
const TESSERACT_EDGES = [];
for (let i = 0; i < 16; i++) {
  for (let b = 0; b < 4; b++) {
    const j = i ^ (1 << b);
    if (j > i) TESSERACT_EDGES.push([i, j]);
  }
}

/**
 * Rotate a 4D point by the angle |a| in the plane spanned by â (in XYZ) and W.
 * Positive angle carries W toward â. Written with sinc / cosc so it stays
 * smooth through a = 0. Components of XYZ orthogonal to â are untouched,
 * which is exactly the "no 3D rotation" guarantee.
 */
function rotateInHyperplane(ax, ay, az, v, out) {
  const t2 = ax * ax + ay * ay + az * az;
  let sinc, cosc, cos;
  if (t2 < 1e-8) {
    sinc = 1 - t2 / 6;
    cosc = -0.5 + t2 / 24;
    cos = 1 - t2 / 2;
  } else {
    const t = Math.sqrt(t2);
    cos = Math.cos(t);
    sinc = Math.sin(t) / t;
    cosc = (cos - 1) / t2;
  }
  const pa = v[0] * ax + v[1] * ay + v[2] * az;
  const w = v[3];
  const k = pa * cosc + w * sinc;
  out[0] = v[0] + ax * k;
  out[1] = v[1] + ay * k;
  out[2] = v[2] + az * k;
  out[3] = -pa * sinc + w * cos;
  return out;
}

/**
 * The physics, without any DOM. Positions are in figure units, y up,
 * relative to the figure centre.
 */
function createTesseractSim(options = {}) {
  const o = { ...TESSERACT_DEFAULTS, ...options };
  const a = [0, 0, 0];   // hyperspace pose (the turn), |a| ≤ π
  const u = [0, 0, 0];   // its velocity
  const d = [1, 0, 0];   // the plane the idle turn runs in (with W)
  let spin = 1;
  let time = 0;
  let force = 0;

  const P = new Float64Array(64); // per corner: x, y (projected), z (3D depth), w (4D depth)
  const J = new Float64Array(96); // per corner: ∂(x, y)/∂aXW, ∂(x, y)/∂aYW, ∂(x, y)/∂aZW
  const T = new Float64Array(4);
  const q = [0, 0, 0, 0];
  let cyaw = 1, syaw = 0, cpitch = 1, spitch = 0;

  function setPlane(dir) {
    const n = Math.hypot(dir[0] || 0, dir[1] || 0, dir[2] || 0);
    if (n < 1e-9) { d[0] = 1; d[1] = 0; d[2] = 0; return; }
    d[0] = dir[0] / n; d[1] = dir[1] / n; d[2] = dir[2] / n;
  }

  function updateView() {
    const yaw = o.yaw + o.tumble * time;
    cyaw = Math.cos(yaw); syaw = Math.sin(yaw);
    cpitch = Math.cos(o.pitch); spitch = Math.sin(o.pitch);
  }

  function pose(ax, ay, az, i, out, at) {
    rotateInHyperplane(ax, ay, az, TESSERACT_VERTICES[i], q);
    const D4 = Math.max(2.4, o.wDistance);
    const k4 = D4 / (D4 - q[3]);
    const x = q[0] * k4, y = q[1] * k4, z = q[2] * k4;
    const x1 = x * cyaw + z * syaw;
    const z1 = -x * syaw + z * cyaw;
    const y2 = y * cpitch - z1 * spitch;
    const z2 = y * spitch + z1 * cpitch;
    const D3 = Math.max(3.5, o.zDistance);
    const k3 = D3 / (D3 - z2);
    out[at] = x1 * k3;
    out[at + 1] = y2 * k3;
    out[at + 2] = z2;
    out[at + 3] = q[3];
  }

  function geometry(withJacobian) {
    updateView();
    const h = 1e-4;
    for (let i = 0; i < 16; i++) {
      const p = i * 4;
      pose(a[0], a[1], a[2], i, P, p);
      if (!withJacobian) continue;
      const j = i * 6;
      pose(a[0] + h, a[1], a[2], i, T, 0);
      J[j] = (T[0] - P[p]) / h; J[j + 1] = (T[1] - P[p + 1]) / h;
      pose(a[0], a[1] + h, a[2], i, T, 0);
      J[j + 2] = (T[0] - P[p]) / h; J[j + 3] = (T[1] - P[p + 1]) / h;
      pose(a[0], a[1], a[2] + h, i, T, 0);
      J[j + 4] = (T[0] - P[p]) / h; J[j + 5] = (T[1] - P[p + 1]) / h;
    }
  }

  /**
   * Advance by dt seconds. field = { x, y, vx, vy, gain } in figure units
   * (y up), or null when there is no pointer.
   */
  function step(dt, field) {
    time += dt;
    geometry(true);

    // 1. Cursor pull → generalized force on the three hyperspace angles.
    let F0 = 0, F1 = 0, F2 = 0;
    if (field && field.gain > 1e-3) {
      const reach = Math.max(0.05, o.reach);
      const s2 = reach * reach;
      const cut = 9 * s2;
      const A = 2.6 * o.attraction / s2;  // pull toward the attractor
      const B = 0.3 * o.drag;             // shove along the cursor's velocity
      const D = 2.4 * o.damping;          // resistance of a held corner to moving
      for (let i = 0; i < 16; i++) {
        const p = i * 4, j = i * 6;
        const rx = field.x - P[p];
        const ry = field.y - P[p + 1];
        const d2 = rx * rx + ry * ry;
        if (d2 > cut) continue;
        const g = field.gain * Math.exp(-d2 / (2 * s2));
        // The corner's own screen velocity. Damping it makes a held corner
        // trail a moving cursor (by ≈ D·v / A), and lose its grip once the
        // cursor moves faster than the field can drag it.
        const svx = J[j] * u[0] + J[j + 2] * u[1] + J[j + 4] * u[2];
        const svy = J[j + 1] * u[0] + J[j + 3] * u[1] + J[j + 5] * u[2];
        const fx = g * (A * rx + B * field.vx - D * svx);
        const fy = g * (A * ry + B * field.vy - D * svy);
        F0 += fx * J[j] + fy * J[j + 1];
        F1 += fx * J[j + 2] + fy * J[j + 3];
        F2 += fx * J[j + 4] + fy * J[j + 5];
      }
      const fm = Math.hypot(F0, F1, F2);
      if (fm > 40) { const k = 40 / fm; F0 *= k; F1 *= k; F2 *= k; }
    }
    force = Math.hypot(F0, F1, F2);

    // 2. Inertia: the push accelerates the turn, it never sets it directly.
    const m = Math.max(0.05, o.inertia);
    u[0] += (F0 / m) * dt;
    u[1] += (F1 / m) * dt;
    u[2] += (F2 / m) * dt;

    // 3. Ease back toward the idle turn: constant speed in the current plane,
    //    plus a gentle return onto a clean single-plane cycle (a parallel to d).
    const ad = a[0] * d[0] + a[1] * d[1] + a[2] * d[2];
    let c0 = -(a[0] - ad * d[0]) * o.centering;
    let c1 = -(a[1] - ad * d[1]) * o.centering;
    let c2 = -(a[2] - ad * d[2]) * o.centering;
    const cm = Math.hypot(c0, c1, c2);
    if (cm > 0.6) { const k = 0.6 / cm; c0 *= k; c1 *= k; c2 *= k; }
    const kr = 1 - Math.exp(-dt / Math.max(0.05, o.recovery));
    const idle = spin * o.idleSpeed;
    u[0] += (idle * d[0] + c0 - u[0]) * kr;
    u[1] += (idle * d[1] + c1 - u[1]) * kr;
    u[2] += (idle * d[2] + c2 - u[2]) * kr;

    // 4. Speed cap.
    const sp = Math.hypot(u[0], u[1], u[2]);
    if (sp > o.maxSpeed) { const k = o.maxSpeed / sp; u[0] *= k; u[1] *= k; u[2] *= k; }

    // 5. A push well above idle speed re-aims the idle plane: quick gestures
    //    redirect the turn, slow ones steer it and it settles back.
    const w0 = u[0] - c0, w1 = u[1] - c1, w2 = u[2] - c2;
    const wm = Math.hypot(w0, w1, w2);
    const excess = wm - Math.max(1.6 * o.idleSpeed, 0.15);
    if (excess > 0) {
      const sg = w0 * d[0] + w1 * d[1] + w2 * d[2] >= 0 ? 1 : -1;
      const k = 1 - Math.exp(-3 * excess * dt);
      d[0] += ((sg * w0) / wm - d[0]) * k;
      d[1] += ((sg * w1) / wm - d[1]) * k;
      d[2] += ((sg * w2) / wm - d[2]) * k;
      setPlane(d);
      spin = sg;
    } else if (o.axisSnap && force < 0.05) {
      let ix = 0;
      if (Math.abs(d[1]) > Math.abs(d[ix])) ix = 1;
      if (Math.abs(d[2]) > Math.abs(d[ix])) ix = 2;
      const k = 1 - Math.exp(-0.7 * dt);
      const s = d[ix] >= 0 ? 1 : -1;
      for (let n = 0; n < 3; n++) d[n] += ((n === ix ? s : 0) - d[n]) * k;
      setPlane(d);
    }

    // 6. Integrate and keep |a| ≤ π. a and a − 2π·â are the same rotation;
    //    velocity is carried across with the Jacobian of that map, so motion is continuous.
    a[0] += u[0] * dt;
    a[1] += u[1] * dt;
    a[2] += u[2] * dt;
    const r = Math.hypot(a[0], a[1], a[2]);
    if (r > Math.PI) {
      const s = 1 - TAU / r;
      const mm = (TAU * (a[0] * u[0] + a[1] * u[1] + a[2] * u[2])) / (r * r * r);
      for (let n = 0; n < 3; n++) u[n] = s * u[n] + mm * a[n];
      for (let n = 0; n < 3; n++) a[n] *= s;
    }
  }

  function setOptions(next = {}) {
    if (next.idlePlane) setPlane(next.idlePlane);
    Object.assign(o, next);
  }

  setPlane(o.idlePlane);
  for (let n = 0; n < 3; n++) {
    a[n] = d[n] * o.startAngle;
    u[n] = d[n] * o.idleSpeed;
  }
  geometry(false);

  return {
    options: o,
    a, u, d, P, J,
    get spin() { return spin; },
    get time() { return time; },
    get force() { return force; },
    geometry,
    step,
    setPlane,
    setOptions,
  };
}

function parseColor(color, fallback) {
  if (color == null) return null;
  try {
    const c = document.createElement('canvas').getContext('2d');
    c.fillStyle = '#000';
    c.fillStyle = color;
    const s = c.fillStyle;
    if (s[0] === '#') return [parseInt(s.slice(1, 3), 16), parseInt(s.slice(3, 5), 16), parseInt(s.slice(5, 7), 16)];
    const m = s.match(/[\d.]+/g);
    return m ? [+m[0], +m[1], +m[2]] : fallback;
  } catch (e) {
    return fallback;
  }
}

const clamp01 = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);
const lerp = (r, t) => r[0] + (r[1] - r[0]) * t;

/**
 * Mount the background. `target` is a positioned element (a canvas is added
 * inside it, behind its content) or an existing <canvas>. The pointer is read
 * on window, so content layered above the background never blocks it.
 */
function createTesseractBackground(target, options = {}) {
  const sim = createTesseractSim(options);
  const o = sim.options;
  const noop = { sim, set() {}, state() { return null; }, pause() {}, resume() {}, destroy() {} };
  if (typeof window === 'undefined' || !target) return noop;

  let canvas;
  let ownCanvas = false;
  if (target instanceof HTMLCanvasElement) {
    canvas = target;
  } else {
    canvas = document.createElement('canvas');
    ownCanvas = true;
    canvas.setAttribute('aria-hidden', 'true');
    canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;pointer-events:none;';
    if (getComputedStyle(target).position === 'static') target.style.position = 'relative';
    target.prepend(canvas);
  }
  const ctx = canvas.getContext('2d');
  if (!ctx) return noop;

  let W = 0, H = 0, dpr = 1, S = 1, cx = 0, cy = 0;
  let bgRGB = null, edgeRGB = [213, 211, 199], dotRGB = [171, 167, 156];
  function colors() {
    // The fill is painted by CSS behind the canvas, so the spotlight mask only
    // ever cuts into the figure, never into the background.
    canvas.style.backgroundColor = o.background || 'transparent';
    bgRGB = parseColor(o.background, null);
    edgeRGB = parseColor(o.edgeColor, edgeRGB);
    dotRGB = parseColor(o.dotColor, dotRGB);
  }
  colors();

  // x, y raw cursor · lx, ly lagged attractor · sx, sy spotlight centre
  const ptr = { x: 0, y: 0, lx: 0, ly: 0, sx: 0, sy: 0, vx: 0, vy: 0, inside: false, lastMove: -1e9, presence: 0, hold: 0 };
  const field = { x: 0, y: 0, vx: 0, vy: 0, gain: 0 };
  const off = new Float64Array(32);
  const X = new Float64Array(16), Y = new Float64Array(16), N = new Float64Array(16);
  const edgeOrder = TESSERACT_EDGES.map((_, i) => i);
  const edgeKey = new Float64Array(TESSERACT_EDGES.length);
  const dotOrder = Array.from({ length: 16 }, (_, i) => i);

  const mq = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
  const isStatic = () => o.reducedMotion === 'static' || (o.reducedMotion === 'auto' && !!mq && mq.matches);

  // kaidanv.com addition: the widest horizontal span (figure units) the
  // figure reaches during a full idle turn, so widthFraction can be exact.
  // Measured on a throwaway sim with the same view settings.
  let idleSpan = 0, idleSpanKey = '';
  function measureIdleSpan() {
    const key = [o.idlePlane, o.wDistance, o.zDistance, o.yaw, o.pitch].join();
    if (key === idleSpanKey) return idleSpan;
    const probe = createTesseractSim({ ...o, tumble: 0 });
    const d = probe.d;
    let widest = 0;
    for (let k = 0; k < 180; k++) {
      const t = -Math.PI + (TAU * k) / 180;
      probe.a[0] = d[0] * t; probe.a[1] = d[1] * t; probe.a[2] = d[2] * t;
      probe.geometry(false);
      let lo = Infinity, hi = -Infinity;
      for (let i = 0; i < 16; i++) { lo = Math.min(lo, probe.P[i * 4]); hi = Math.max(hi, probe.P[i * 4]); }
      widest = Math.max(widest, hi - lo);
    }
    idleSpanKey = key;
    return (idleSpan = widest);
  }

  function metrics() {
    S = o.widthFraction > 0
      ? (o.widthFraction * W) / measureIdleSpan()
      : (Math.max(0.05, o.size) * Math.min(W, H)) / 5.2;
    cx = o.center[0] * W;
    cy = o.center[1] * H;
  }

  function resize() {
    const r = canvas.getBoundingClientRect();
    W = r.width; H = r.height;
    dpr = Math.min(window.devicePixelRatio || 1, Math.max(1, o.maxDpr));
    canvas.width = Math.max(1, Math.round(W * dpr));
    canvas.height = Math.max(1, Math.round(H * dpr));
    metrics();
    draw();
  }

  const rgba = (c, al) => `rgba(${c[0]},${c[1]},${c[2]},${al.toFixed(3)})`;

  function draw() {
    if (!W || !H) return;
    metrics();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);

    // Spotlight: peak visibility at the cursor, `floor` outside the circle.
    const spot = o.spotlight > 0 ? o.spotlight : 0;
    const floor = clamp01(o.spotlightFloor);
    const peak = floor + (1 - floor) * ptr.presence;
    if (spot && peak < 0.002) return; // nothing would survive the mask

    const P = sim.P;
    for (let i = 0; i < 16; i++) {
      const p = i * 4;
      X[i] = cx + P[p] * S + off[i * 2];
      Y[i] = cy - P[p + 1] * S + off[i * 2 + 1];
      const n4 = clamp01((P[p + 3] + 1.45) / 2.9); // close to our 3D space
      const n3 = clamp01((P[p + 2] + 2.8) / 5.6);  // close to the viewer
      N[i] = Math.pow(0.72 * n4 + 0.28 * n3, 1.3);
    }

    // tethers: make the field legible
    if (o.tethers && field.gain > 0.01) {
      const R = Math.max(0.05, o.reach) * S * 1.25;
      ctx.lineWidth = 0.75;
      for (let i = 0; i < 16; i++) {
        const rx = X[i] - ptr.lx, ry = Y[i] - ptr.ly;
        const g = Math.exp(-(rx * rx + ry * ry) / (2 * R * R)) * field.gain;
        if (g < 0.04) continue;
        ctx.strokeStyle = rgba(edgeRGB, 0.85 * g);
        ctx.beginPath();
        ctx.moveTo(ptr.lx, ptr.ly);
        ctx.lineTo(X[i], Y[i]);
        ctx.stroke();
      }
    }

    // edges, far to near, each fading along its length with depth
    for (let e = 0; e < TESSERACT_EDGES.length; e++) {
      const [i, j] = TESSERACT_EDGES[e];
      edgeKey[e] = N[i] + N[j];
    }
    edgeOrder.sort((p, q) => edgeKey[p] - edgeKey[q]);
    ctx.lineCap = 'round';
    for (let k = 0; k < edgeOrder.length; k++) {
      const [i, j] = TESSERACT_EDGES[edgeOrder[k]];
      const g = ctx.createLinearGradient(X[i], Y[i], X[j], Y[j]);
      g.addColorStop(0, rgba(edgeRGB, lerp(o.edgeOpacity, N[i])));
      g.addColorStop(1, rgba(edgeRGB, lerp(o.edgeOpacity, N[j])));
      ctx.strokeStyle = g;
      ctx.lineWidth = lerp(o.edgeWidth, (N[i] + N[j]) / 2);
      ctx.beginPath();
      ctx.moveTo(X[i], Y[i]);
      ctx.lineTo(X[j], Y[j]);
      ctx.stroke();
    }

    // corners, far to near
    dotOrder.sort((p, q) => N[p] - N[q]);
    for (let k = 0; k < 16; k++) {
      const i = dotOrder[k];
      ctx.fillStyle = rgba(dotRGB, lerp(o.dotOpacity, N[i]));
      ctx.beginPath();
      ctx.arc(X[i], Y[i], lerp(o.dotRadius, N[i]), 0, TAU);
      ctx.fill();
    }

    // Alpha mask: keep the figure only where the radial gradient is opaque.
    if (spot) {
      ctx.globalCompositeOperation = 'destination-in';
      if (peak - floor < 1e-3) {
        ctx.fillStyle = `rgba(0,0,0,${floor.toFixed(4)})`;
      } else {
        const g = ctx.createRadialGradient(ptr.sx, ptr.sy, 0, ptr.sx, ptr.sy, spot);
        const inner = 1 - clamp01(o.spotlightFade);
        g.addColorStop(0, `rgba(0,0,0,${peak.toFixed(4)})`);
        if (inner > 0) g.addColorStop(inner, `rgba(0,0,0,${peak.toFixed(4)})`);
        for (let k = 1; k <= 8; k++) {
          const t = k / 8;
          const s = t * t * (3 - 2 * t); // smoothstep: no visible ring at either end
          g.addColorStop(inner + (1 - inner) * t, `rgba(0,0,0,${(peak + (floor - peak) * s).toFixed(4)})`);
        }
        ctx.fillStyle = g;
      }
      ctx.fillRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'source-over';
    }
  }

  // kaidanv.com addition: outside the active zone the cursor counts as
  // absent, so the spotlight fades out and the corners are let go smoothly.
  const inZone = () => !o.activeZone || o.activeZone(ptr.x, ptr.y);

  function updatePointer(dt, now) {
    const active = ptr.inside && inZone();
    if (active && ptr.presence < 0.02) {
      // fresh entry: start the attractor at the cursor instead of sweeping it in
      ptr.lx = ptr.x; ptr.ly = ptr.y; ptr.vx = 0; ptr.vy = 0;
      ptr.sx = ptr.x; ptr.sy = ptr.y;
    }
    // the spotlight tracks the real cursor closely; only the attractor lags
    const ks = 1 - Math.exp(-dt / 0.035);
    ptr.sx += (ptr.x - ptr.sx) * ks;
    ptr.sy += (ptr.y - ptr.sy) * ks;
    const kl = o.lag > 0 ? 1 - Math.exp(-dt / o.lag) : 1;
    const nx = ptr.lx + (ptr.x - ptr.lx) * kl;
    const ny = ptr.ly + (ptr.y - ptr.ly) * kl;
    const kv = 1 - Math.exp(-dt / 0.06);
    ptr.vx += ((nx - ptr.lx) / dt - ptr.vx) * kv;
    ptr.vy += ((ny - ptr.ly) / dt - ptr.vy) * kv;
    ptr.lx = nx; ptr.ly = ny;

    ptr.presence += ((active ? 1 : 0) - ptr.presence) * (1 - Math.exp(-dt / 0.25));
    let holdTarget = 1;
    if (o.release > 0) {
      const rest = (now - ptr.lastMove) / 1000;
      const grace = 0.4 * o.release, fade = 0.6 * o.release;
      holdTarget = rest < grace ? 1 : Math.max(0, 1 - (rest - grace) / fade);
    }
    ptr.hold += (holdTarget - ptr.hold) * (1 - Math.exp(-dt / 0.15));

    field.x = (ptr.lx - cx) / S;
    field.y = -(ptr.ly - cy) / S;
    let fvx = ptr.vx / S, fvy = -ptr.vy / S;
    const vm = Math.hypot(fvx, fvy);
    if (vm > 16) { fvx *= 16 / vm; fvy *= 16 / vm; }
    field.vx = fvx; field.vy = fvy;
    field.gain = o.interactive ? ptr.presence * ptr.hold : 0;
  }

  function updateMagnet(dt) {
    const P = sim.P;
    const R = Math.max(0.05, o.reach) * S;
    const k = 1 - Math.exp(-dt / 0.1);
    const lim = Math.max(0, o.magnet);
    for (let i = 0; i < 16; i++) {
      let tx = 0, ty = 0;
      if (field.gain > 1e-3 && lim > 0) {
        const sx = cx + P[i * 4] * S, sy = cy - P[i * 4 + 1] * S;
        const rx = ptr.lx - sx, ry = ptr.ly - sy;
        const g = Math.exp(-(rx * rx + ry * ry) / (2 * R * R)) * field.gain;
        tx = rx * g * 0.35; ty = ry * g * 0.35;
        const m = Math.hypot(tx, ty);
        if (m > lim) { tx *= lim / m; ty *= lim / m; }
      }
      off[i * 2] += (tx - off[i * 2]) * k;
      off[i * 2 + 1] += (ty - off[i * 2 + 1]) * k;
    }
  }

  let raf = 0, running = false, paused = false, onScreen = true, last = 0;

  function tick(now) {
    if (!running) return;
    raf = requestAnimationFrame(tick);
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (!(dt > 0)) return;
    metrics();
    updatePointer(dt, now);
    sim.step(dt, field);
    sim.geometry(false);
    updateMagnet(dt);
    draw();
  }

  function start() {
    if (running || paused || !onScreen || document.hidden || isStatic()) return;
    running = true;
    last = performance.now();
    raf = requestAnimationFrame(tick);
  }
  function stop() {
    running = false;
    cancelAnimationFrame(raf);
  }
  function renderStill() {
    off.fill(0);
    field.gain = 0;
    sim.geometry(false);
    draw();
  }

  // Reduced motion: the figure stays still, but the spotlight still follows the cursor.
  let stillRaf = 0;
  function redrawStill() {
    if (running || stillRaf || !(o.spotlight > 0)) return;
    stillRaf = requestAnimationFrame(() => {
      stillRaf = 0;
      ptr.presence = ptr.inside && inZone() ? 1 : 0;
      ptr.sx = ptr.x; ptr.sy = ptr.y;
      draw();
    });
  }

  // pointer, read on window so foreground content never blocks it
  const locate = (e) => {
    const r = canvas.getBoundingClientRect();
    ptr.x = e.clientX - r.left;
    ptr.y = e.clientY - r.top;
    ptr.inside = ptr.x >= 0 && ptr.y >= 0 && ptr.x <= r.width && ptr.y <= r.height;
    ptr.lastMove = performance.now();
    redrawStill();
  };
  const onUp = (e) => { if (e.pointerType !== 'mouse') { ptr.inside = false; redrawStill(); } };
  const onLeave = () => { ptr.inside = false; redrawStill(); };
  const onVisibility = () => (document.hidden ? stop() : start());
  const onMotionPref = () => (isStatic() ? (stop(), renderStill()) : start());
  window.addEventListener('pointermove', locate, { passive: true });
  window.addEventListener('pointerdown', locate, { passive: true });
  window.addEventListener('pointerup', onUp, { passive: true });
  window.addEventListener('pointercancel', onUp, { passive: true });
  window.addEventListener('blur', onLeave);
  document.documentElement.addEventListener('mouseleave', onLeave);
  document.addEventListener('visibilitychange', onVisibility);
  if (mq && mq.addEventListener) mq.addEventListener('change', onMotionPref);

  const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(resize) : null;
  if (ro) ro.observe(canvas); else window.addEventListener('resize', resize);
  const io = typeof IntersectionObserver !== 'undefined'
    ? new IntersectionObserver((entries) => {
        onScreen = entries[entries.length - 1].isIntersecting;
        onScreen ? start() : stop();
      })
    : null;
  if (io) io.observe(canvas);

  resize();
  if (isStatic()) renderStill(); else start();

  return {
    sim,
    /** Change any option live. */
    set(next = {}) {
      sim.setOptions(next);
      colors();
      if ('maxDpr' in next) resize();
      if (isStatic()) { stop(); renderStill(); } else { draw(); start(); }
    },
    /** Current turn, for readouts and debugging. */
    state() {
      const { a, u, d } = sim;
      return {
        angle: Math.hypot(a[0], a[1], a[2]),
        plane: { xw: d[0] * d[0], yw: d[1] * d[1], zw: d[2] * d[2] },
        direction: [d[0], d[1], d[2]],
        spin: sim.spin,
        speed: Math.hypot(u[0], u[1], u[2]),
        a: [a[0], a[1], a[2]],
        presence: ptr.presence,
        hold: ptr.hold,
        force: sim.force,
      };
    },
    pause() { paused = true; stop(); },
    resume() { paused = false; start(); },
    destroy() {
      stop();
      cancelAnimationFrame(stillRaf);
      window.removeEventListener('pointermove', locate);
      window.removeEventListener('pointerdown', locate);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      window.removeEventListener('blur', onLeave);
      window.removeEventListener('resize', resize);
      document.documentElement.removeEventListener('mouseleave', onLeave);
      document.removeEventListener('visibilitychange', onVisibility);
      if (mq && mq.removeEventListener) mq.removeEventListener('change', onMotionPref);
      if (ro) ro.disconnect();
      if (io) io.disconnect();
      if (ownCanvas) canvas.remove();
    },
  };
}


// Victor's settings from the original file (only the changed defaults).
const SETTINGS = {
  idleSpeed: 0.1,
  recovery: 2,
  axisSnap: true,
  lag: 0.15,
  release: 3,
  magnet: 5,
  size: 1,
  // Unchanged defaults, listed here so they are easy to edit:
  spotlight: 300,       // px radius around the cursor; 0 = show the whole figure
  spotlightFade: 0.7,   // share of the radius used for the fade-out
  spotlightFloor: 0,    // visibility outside the circle / with no cursor
};

function themeColors() {
  const s = getComputedStyle(document.documentElement);
  return {
    edgeColor: s.getPropertyValue('--bg-art-edge').trim() || TESSERACT_DEFAULTS.edgeColor,
    dotColor: s.getPropertyValue('--bg-art-dot').trim() || TESSERACT_DEFAULTS.dotColor,
  };
}

// The cursor shows and turns the figure only beside the content block (the
// 880px column, <main>), left or right of it; over the content the spotlight
// fades out and the figure only keeps its idle turn (Victor, 2026-11-05). The
// canvas covers the viewport, so host x = client x.
function besideContent(x) {
  const main = document.querySelector('main');
  if (!main) return true;
  const r = main.getBoundingClientRect();
  return x < r.left || x > r.right;
}

export function mountTesseractBackground(host) {
  const bg = createTesseractBackground(host, {
    ...SETTINGS,
    background: null,
    activeZone: besideContent,
    // The figure spans 80% of the browser width at its widest point of the
    // idle turn (Victor, 2026-11-05); replaces SETTINGS.size.
    widthFraction: 0.8,
    ...themeColors(),
  });
  // Dev only: lets the instance be inspected from the console (host.tesseract.state()).
  if (import.meta.env.DEV) host.tesseract = bg;
  const themeWatch = new MutationObserver(() => bg.set(themeColors()));
  themeWatch.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  return {
    destroy() {
      themeWatch.disconnect();
      bg.destroy();
    },
  };
}
