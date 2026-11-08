// Developer tool (not a test): renders an area (or a window of it) to PNG with
// the game's own pipeline (background bake, depth-sorted prop sprites, the
// lighting pass with the area's lights and ambient) on a small pixel canvas, so
// maps can be checked without a browser. Run: node scripts/areaPreview.mjs town [x y w h scale]
import { writeFileSync, mkdirSync } from "node:fs";
import { deflateSync } from "node:zlib";

type RGBA = [number, number, number, number];
const cache = new Map<string, RGBA>();
function parse(s: string): RGBA {
  const c = cache.get(s); if (c) return c;
  let out: RGBA = [0, 0, 0, 1];
  if (s.startsWith("#")) {
    const h = s.slice(1);
    const full = h.length === 3 || h.length === 4 ? h.split("").map((ch) => ch + ch).join("") : h;
    const n = parseInt(full.slice(0, 6), 16);
    out = [(n >> 16) & 255, (n >> 8) & 255, n & 255, full.length === 8 ? parseInt(full.slice(6, 8), 16) / 255 : 1];
  } else { const m = s.match(/rgba?\(([^)]+)\)/); if (m) { const p = m[1].split(",").map(Number); out = [p[0], p[1], p[2], p[3] ?? 1]; } }
  cache.set(s, out); return out;
}
class Ctx {
  fillStyle = "#000"; globalAlpha = 1; globalCompositeOperation = "source-over"; imageSmoothingEnabled = false;
  constructor(public canvas: Cnv) {}
  private put(i: number, c: RGBA, a: number) {
    const d = this.canvas.data;
    if (this.globalCompositeOperation === "lighter") { d[i] = Math.min(255, d[i] + c[0] * a); d[i + 1] = Math.min(255, d[i + 1] + c[1] * a); d[i + 2] = Math.min(255, d[i + 2] + c[2] * a); d[i + 3] = 255; return; }
    d[i] = d[i] * (1 - a) + c[0] * a; d[i + 1] = d[i + 1] * (1 - a) + c[1] * a; d[i + 2] = d[i + 2] * (1 - a) + c[2] * a; d[i + 3] = Math.min(255, d[i + 3] + 255 * a);
  }
  fillRect(x: number, y: number, w: number, h: number) {
    const c = parse(this.fillStyle), W = this.canvas.width, H = this.canvas.height, a = c[3] * this.globalAlpha;
    const x0 = Math.max(0, Math.round(x)), y0 = Math.max(0, Math.round(y)), x1 = Math.min(W, Math.round(x + w)), y1 = Math.min(H, Math.round(y + h));
    for (let yy = y0; yy < y1; yy++) for (let xx = x0; xx < x1; xx++) this.put((yy * W + xx) * 4, c, a);
  }
  clearRect(x: number, y: number, w: number, h: number) { const W = this.canvas.width; for (let yy = Math.max(0, y); yy < Math.min(this.canvas.height, y + h); yy++) for (let xx = Math.max(0, x); xx < Math.min(W, x + w); xx++) this.canvas.data.fill(0, (yy * W + xx) * 4, (yy * W + xx) * 4 + 4); }
  createImageData(w: number, h: number) { return { width: w, height: h, data: new Uint8ClampedArray(w * h * 4) }; }
  getImageData(x: number, y: number, w: number, h: number) {
    const img = this.createImageData(w, h), W = this.canvas.width;
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) { const s = ((y + j) * W + x + i) * 4, t = (j * w + i) * 4; for (let k = 0; k < 4; k++) img.data[t + k] = this.canvas.data[s + k] ?? 0; }
    return img;
  }
  putImageData(img: { width: number; height: number; data: Uint8ClampedArray }, x: number, y: number) {
    const W = this.canvas.width, H = this.canvas.height;
    for (let j = 0; j < img.height; j++) for (let i = 0; i < img.width; i++) { const tx = x + i, ty = y + j; if (tx < 0 || ty < 0 || tx >= W || ty >= H) continue; const s = (j * img.width + i) * 4, t = (ty * W + tx) * 4; for (let k = 0; k < 4; k++) this.canvas.data[t + k] = img.data[s + k]; }
  }
  drawImage(src: Cnv, ...a: number[]) {
    let sx = 0, sy = 0, sw = src.width, sh = src.height, dx = 0, dy = 0, dw = src.width, dh = src.height;
    if (a.length === 2) [dx, dy] = a; else if (a.length === 4) [dx, dy, dw, dh] = a; else [sx, sy, sw, sh, dx, dy, dw, dh] = a;
    const W = this.canvas.width, H = this.canvas.height;
    for (let j = 0; j < Math.round(dh); j++) for (let i = 0; i < Math.round(dw); i++) {
      const tx = Math.round(dx) + i, ty = Math.round(dy) + j; if (tx < 0 || ty < 0 || tx >= W || ty >= H) continue;
      const ux = Math.floor(sx + (i * sw) / dw), uy = Math.floor(sy + (j * sh) / dh); if (ux < 0 || uy < 0 || ux >= src.width || uy >= src.height) continue;
      const si = (uy * src.width + ux) * 4, al = src.data[si + 3] / 255;
      if (al > 0) this.put((ty * W + tx) * 4, [src.data[si], src.data[si + 1], src.data[si + 2], 1], al * this.globalAlpha);
    }
  }
  save() {} restore() {} beginPath() {} rect() {} clip() {}
}
class Cnv {
  width = 0; height = 0; data = new Uint8ClampedArray(4); private ctx?: Ctx;
  getContext() { if (this.data.length !== this.width * this.height * 4) this.data = new Uint8ClampedArray(Math.max(4, this.width * this.height * 4)); return (this.ctx ??= new Ctx(this)); }
}
(globalThis as unknown as { document: unknown }).document = { createElement: () => new Cnv() };

import { getArea, createWorld } from "../../src/game/world/world";
import { bakeRegion } from "../../src/game/art/tiles";
import { propSprite } from "../../src/game/art/props";
import { propDef } from "../../src/game/content/props";
import { Lighting, computeVis, makeLight } from "../../src/game/light";
import { TS } from "../../src/game/content/tiles";

function png(c: Cnv, scale: number): Buffer {
  const W = c.width * scale, H = c.height * scale, raw = Buffer.alloc((W * 3 + 1) * H);
  for (let y = 0; y < H; y++) { raw[y * (W * 3 + 1)] = 0; for (let x = 0; x < W; x++) { const si = (Math.floor(y / scale) * c.width + Math.floor(x / scale)) * 4, di = y * (W * 3 + 1) + 1 + x * 3; raw[di] = c.data[si]; raw[di + 1] = c.data[si + 1]; raw[di + 2] = c.data[si + 2]; } }
  const crcT = Array.from({ length: 256 }, (_, n) => { let k = n; for (let i = 0; i < 8; i++) k = k & 1 ? 0xedb88320 ^ (k >>> 1) : k >>> 1; return k >>> 0; });
  const crc = (b: Buffer) => { let r = 0xffffffff; for (const v of b) r = crcT[(r ^ v) & 255] ^ (r >>> 8); return (r ^ 0xffffffff) >>> 0; };
  const chunk = (t: string, d: Buffer) => { const l = Buffer.alloc(4); l.writeUInt32BE(d.length); const td = Buffer.concat([Buffer.from(t), d]); const cb = Buffer.alloc(4); cb.writeUInt32BE(crc(td)); return Buffer.concat([l, td, cb]); };
  const ih = Buffer.alloc(13); ih.writeUInt32BE(W, 0); ih.writeUInt32BE(H, 4); ih[8] = 8; ih[9] = 2;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk("IHDR", ih), chunk("IDAT", deflateSync(raw)), chunk("IEND", Buffer.alloc(0))]);
}

export function render(areaId: string, out: string, x0 = 0, y0 = 0, tw = 0, th = 0, scale = 1, lit = true) {
  const w = createWorld(1), area = getArea(w, areaId);
  tw = tw || area.w; th = th || area.h;
  const W = tw * TS, H = th * TS, camX = x0 * TS, camY = y0 * TS;
  const bg = new Cnv(); bg.width = area.w * TS; bg.height = area.h * TS;
  bakeRegion(bg.getContext() as unknown as CanvasRenderingContext2D, area, x0, y0, Math.min(area.w - 1, x0 + tw), Math.min(area.h - 1, y0 + th));
  const sc = new Cnv(); sc.width = W; sc.height = H; const ec = new Cnv(); ec.width = W; ec.height = H;
  const s = sc.getContext(), e = ec.getContext();
  s.fillStyle = "#000"; s.fillRect(0, 0, W, H); e.fillStyle = "#000"; e.fillRect(0, 0, W, H);
  s.drawImage(bg, camX, camY, W, H, 0, 0, W, H);
  const list = area.props.map((p) => { const d = propDef(p.kind); return { p, d, y: d.wallMounted ? p.y - 0.5 : d.flat ? p.y - 16 : p.y }; }).sort((a, b) => a.y - b.y);
  for (const { p, d } of list) {
    const alt = d.alt === "lit" ? !!p.lit : d.alt === "taken" ? p.taken : p.open;
    const spr = propSprite(p.kind, p.v, alt) as unknown as { a: Cnv; e: Cnv; ax: number; ay: number } | null;
    if (!spr) continue;
    s.drawImage(spr.a, Math.round(p.x - spr.ax - camX), Math.round(p.y - spr.ay - camY)); e.drawImage(spr.e, Math.round(p.x - spr.ax - camX), Math.round(p.y - spr.ay - camY));
    if (p.lit && d.fire) { e.fillStyle = "#ffb040"; e.fillRect(Math.round(p.x - camX) - 1, Math.round(p.y - camY - (d.fire.fy ?? 15)) - 3, 3, 4); e.fillStyle = "#fff0b0"; e.fillRect(Math.round(p.x - camX), Math.round(p.y - camY - (d.fire.fy ?? 15)) - 2, 1, 2); }
  }
  if (lit) {
    const L = new Lighting(W, H);
    const lights = area.lights.map((l) => { const m = makeLight(l.x, l.y, l.rad, l.col, l.int, l.flick, l.id); m.cur = l.int * (1 - l.flick * 0.5); computeVis(m, area); return m; }).filter((_l, i) => !(area.lights[i].id === "runeglow"));
    L.accumulate(lights, camX, camY);
    const outC = new Cnv(); outC.width = W; outC.height = H; outC.getContext();
    L.compose(sc.data, ec.data, outC.data, area.base.ambient ?? [0.05, 0.045, 0.065]);
    mkdirSync(".preview", { recursive: true }); writeFileSync(out, png(outC, scale));
  } else { mkdirSync(".preview", { recursive: true }); writeFileSync(out, png(sc, scale)); }
}
