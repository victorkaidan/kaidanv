// Nautilus page background (Victor's "nautilus-background.html", 2026-11).
// The reveal logic (NautilusReveal) is the original class; what changed:
// - the artwork is no longer inlined (830 KB of base64 in every page): the
//   particle list and the sprite atlas are static files in
//   public/backgrounds/, fetched once and cached for in-site navigation;
// - no paper texture: the canvas is transparent, so the site background
//   (--bg-main) shows through in both themes;
// - dark theme: the brown ink would vanish on the dark background, so the
//   atlas is redrawn with its lightness inverted (hue kept) and swapped in
//   live when the theme toggles.
/* eslint-disable */

const PARTICLES_URL = '/backgrounds/nautilus-particles.json';
const ATLAS_URL = '/backgrounds/nautilus-atlas.png';

const smoothstep = (a, b, value) => {
  const t = Math.min(1, Math.max(0, (value - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
const decode = (src) => new Promise((resolve, reject) => {
  const img = new Image();
  img.onload = () => resolve(img);
  img.onerror = () => reject(new Error('The nautilus atlas could not be decoded.'));
  img.src = src;
});

class NautilusReveal {
  constructor(canvas, artwork, atlas, options = {}) {
    this.canvas = canvas;
    this.context = canvas.getContext('2d', { alpha: true });
    if (!this.context) throw new Error('A 2D canvas is required.');
    this.options = { radius: 200, growMs: 2000, fadeMs: 4000, inkOpacity: 0.40, fit: 'contain', ...options };
    this.artwork = artwork;
    this.atlas = atlas;
    this.data = artwork.particles;
    this.count = this.data.length / 6;
    this.scales = new Float32Array(this.count);
    this.pointer = { x: 0, y: 0, active: false };
    this.full = false;
    this.raf = 0;
    this.destroyed = false;
    this.frames = 0;
    this.abort = new AbortController();
    this.motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    this.frame = this.frame.bind(this);
    this.initialize();
  }

  initialize() {
    const signal = this.abort.signal;
    const listen = (target, event, handler, extra = {}) => target.addEventListener(event, handler, { signal, ...extra });
    listen(document, 'pointermove', event => this.setPointer(event.clientX, event.clientY), { passive: true });
    listen(document, 'pointerdown', event => this.setPointer(event.clientX, event.clientY), { passive: true });
    listen(document, 'pointerup', event => { if (event.pointerType !== 'mouse') this.clearPointer(); }, { passive: true });
    listen(document, 'pointercancel', () => this.clearPointer());
    listen(document.documentElement, 'pointerleave', () => this.clearPointer());
    listen(window, 'blur', () => this.clearPointer());
    listen(window, 'scroll', () => { this.rect = this.canvas.getBoundingClientRect(); this.clearPointer(); }, { passive: true, capture: true });
    listen(document, 'visibilitychange', () => {
      if (document.hidden) {
        cancelAnimationFrame(this.raf);
        this.raf = 0;
      } else {
        this.clearPointer();
        this.wake();
      }
    });
    listen(this.motion, 'change', () => this.wake());
    this.observer = new ResizeObserver(() => this.resize());
    this.observer.observe(this.canvas);
    this.resize();
  }

  resize() {
    if (this.destroyed) return;
    const { width, height } = this.artwork;
    this.rect = this.canvas.getBoundingClientRect();
    this.width = this.rect.width;
    this.height = this.rect.height;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = Math.max(1, Math.round(this.width * this.dpr));
    this.canvas.height = Math.max(1, Math.round(this.height * this.dpr));
    const fit = this.options.fit === 'cover' ? Math.max : Math.min;
    this.imageScale = fit(this.width / width, this.height / height);
    this.offsetX = (this.width - width * this.imageScale) / 2;
    this.offsetY = (this.height - height * this.imageScale) / 2;
    this.wake();
  }

  setAtlas(atlas) { this.atlas = atlas; this.wake(); }

  setPointer(clientX, clientY) {
    if (!this.rect || this.destroyed) return;
    const x = clientX - this.rect.left;
    const y = clientY - this.rect.top;
    this.pointer = { x, y, active: x >= 0 && y >= 0 && x <= this.width && y <= this.height };
    this.wake();
  }

  clearPointer() { this.pointer.active = false; this.wake(); }

  wake() {
    if (!this.raf && this.atlas && !this.destroyed && !document.hidden) {
      this.lastTime = performance.now();
      this.raf = requestAnimationFrame(this.frame);
    }
  }

  frame(now) {
    this.raf = 0;
    if (this.destroyed) return;
    const dt = Math.min(64, Math.max(1, now - this.lastTime));
    this.lastTime = now;
    const { radius, growMs, fadeMs } = this.options;
    // Times describe approximately 95% of a transition, independently of fps.
    const grow = this.motion.matches || growMs === 0 ? 1 : 1 - Math.exp(-3 * dt / growMs);
    const fade = this.motion.matches || fadeMs === 0 ? 1 : 1 - Math.exp(-3 * dt / fadeMs);
    const ctx = this.context;
    const s = this.imageScale;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, this.width, this.height);
    ctx.imageSmoothingEnabled = true;
    ctx.globalAlpha = this.options.inkOpacity;
    let changing = false;
    let visible = 0;

    for (let i = 0, j = 0; i < this.count; i++, j += 6) {
      const w = this.data[j + 2], h = this.data[j + 3];
      const x = this.offsetX + (this.data[j] + w / 2) * s;
      const y = this.offsetY + (this.data[j + 1] + h / 2) * s;
      let target = this.full ? 1 : 0;
      if (!this.full && this.pointer.active) {
        const dx = x - this.pointer.x, dy = y - this.pointer.y;
        const distanceSquared = dx * dx + dy * dy;
        if (distanceSquared < radius * radius) {
          target = 1 - smoothstep(radius * 0.18, radius, Math.sqrt(distanceSquared));
        }
      }
      let scale = this.scales[i];
      const delta = target - scale;
      if (Math.abs(delta) < 0.002) scale = target;
      else {
        scale += delta * (delta > 0 ? grow : fade);
        if (Math.abs(target - scale) > 0.002) changing = true;
        else scale = target;
      }
      this.scales[i] = scale;
      if (scale <= 0.002 || x < -20 || x > this.width + 20 || y < -20 || y > this.height + 20) continue;
      const dw = w * s * scale, dh = h * s * scale;
      ctx.drawImage(this.atlas, this.data[j+4], this.data[j+5], w, h, x-dw/2, y-dh/2, dw, dh);
      visible++;
    }
    this.visible = visible;
    this.frames++;
    if (changing) this.raf = requestAnimationFrame(this.frame);
  }

  destroy() {
    this.destroyed = true;
    cancelAnimationFrame(this.raf);
    this.raf = 0;
    this.abort.abort();
    this.observer?.disconnect();
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }
}

// The same sprites with lightness inverted and hue and saturation kept (HSL),
// for the dark theme: dark brown ink becomes a light warm tone. In HSL,
// L -> 1 - L leaves the chroma unchanged, so every channel just shifts by
// (1 - 2L). Computed once per visit.
function invertLightness(img) {
  const c = document.createElement('canvas');
  c.width = img.width;
  c.height = img.height;
  const ctx = c.getContext('2d');
  ctx.drawImage(img, 0, 0);
  const pixels = ctx.getImageData(0, 0, c.width, c.height);
  const d = pixels.data;
  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] === 0) continue;
    const max = Math.max(d[i], d[i + 1], d[i + 2]);
    const min = Math.min(d[i], d[i + 1], d[i + 2]);
    const shift = 255 - (max + min); // 255 * (1 - 2L)
    d[i] += shift;
    d[i + 1] += shift;
    d[i + 2] += shift;
  }
  ctx.putImageData(pixels, 0, 0);
  return c;
}

// Fetched once per visit; in-site navigation reuses it.
let assets = null;
function loadAssets() {
  if (!assets) {
    assets = Promise.all([fetch(PARTICLES_URL).then((r) => r.json()), decode(ATLAS_URL)])
      .then(([artwork, atlas]) => ({ artwork, atlas, darkAtlas: null }))
      .catch((error) => {
        assets = null;
        throw error;
      });
  }
  return assets;
}

const isDark = () => document.documentElement.classList.contains('dark');

export function mountNautilusBackground(host) {
  const canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;pointer-events:none;';
  host.append(canvas);

  let reveal = null;
  let themeWatch = null;
  let destroyed = false;

  loadAssets()
    .then((a) => {
      if (destroyed) return;
      const atlasFor = () => (isDark() ? (a.darkAtlas ??= invertLightness(a.atlas)) : a.atlas);
      reveal = new NautilusReveal(canvas, a.artwork, atlasFor());
      themeWatch = new MutationObserver(() => reveal.setAtlas(atlasFor()));
      themeWatch.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    })
    .catch((error) => console.error('Nautilus background:', error));

  return {
    destroy() {
      destroyed = true;
      themeWatch?.disconnect();
      reveal?.destroy();
      canvas.remove();
    },
  };
}
