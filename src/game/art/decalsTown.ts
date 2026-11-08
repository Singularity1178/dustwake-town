// Westerford's decals: flat things baked into the town's and its interiors'
// ground (rugs, cart ruts, straw, door sills, spills, loose thread). Hooked into
// art/decals.ts (drawDecal / decalExtent). Presentation only.
import type { DecalDef } from "../map";
import { hash2, type Pen, type Rng } from "../util";
import { GD } from "./palette";

const RUGS = [
  ["#5a1e22", "#7a2a2e", "#b08a34", "#3a1216"], // tavern red
  ["#1e2a4a", "#2a3a6a", "#c8a050", "#141c34"], // guild / armory blue
  ["#3a1a3a", "#5a2a5a", "#e0c060", "#241024"], // jeweler plum and gold
  ["#4a5a3a", "#6a7a4a", "#d8c8a0", "#2a3422"], // tailor sage
];

export function townDecalExtent(dc: DecalDef): [number, number, number, number] | null {
  const w = dc.w ?? 0, h = dc.h ?? 0;
  switch (dc.kind) {
    case "rug": case "sill": return [-1, -1, w + 1, h + 1];
    case "ruts": return [-1, -2, w + 1, 3];
    case "straw": case "spill": case "thread": return [-8, -6, 10, 8];
  }
  return null;
}

export function drawTownDecal(p: Pen, dc: DecalDef, r: Rng): boolean {
  const x = Math.round(dc.x), y = Math.round(dc.y);
  switch (dc.kind) {
    case "rug": {
      // a woven rug: border bands, a field with a lozenge medallion, fringes at the ends
      const w = dc.w ?? 40, h = dc.h ?? 24, c = RUGS[dc.v % 4];
      for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
        const bi = Math.min(i, w - 1 - i), bj = Math.min(j, h - 1 - j), b = Math.min(bi, bj);
        let col = b === 0 ? c[3] : b < 3 ? c[2] : b === 3 ? c[3] : c[1];
        if (b > 3) {
          const lz = Math.abs(i - w / 2) / (w / 2) + Math.abs(j - h / 2) / (h / 2);
          if (lz < 0.5) col = lz < 0.25 ? c[2] : c[0];
          else if ((i + j) % 6 === 0 || (i - j + 600) % 6 === 0) col = c[0];
        }
        if (hash2(x + i, y + j, 600) < 0.04) col = c[3];
        p.p(x + i, y + j, col);
      }
      for (let i = 1; i < w - 1; i += 2) { p.p(x + i, y - 1, c[2]); p.p(x + i, y + h, c[2]); }
      return true;
    }
    case "sill": {
      const w = dc.w ?? 16, h = dc.h ?? 12;
      p.r(x, y, w, h, "#3a2a1c"); p.r(x + 1, y + 1, w - 2, 2, "#6a5038"); p.r(x + 1, y + h - 2, w - 2, 1, "#241a12");
      for (let i = 2; i < w - 2; i += 3) p.p(x + i, y + 5, "#2a1e14");
      return true;
    }
    case "ruts": {
      const w = dc.w ?? 30;
      for (let i = 0; i < w; i++) { const k = hash2(x + i, y, 601); if (k < 0.15) continue; p.p(x + i, y, k < 0.6 ? "#3a2c1e" : "#4a3a28"); if (k > 0.8) p.p(x + i, y + 1, "#5a4a36"); }
      return true;
    }
    case "straw": {
      const cols = ["#b49a5c", "#c8b070", "#8a7444"];
      for (let k = 0; k < 7; k++) { const sx = x + ((r() * 14) | 0) - 7, sy = y + ((r() * 8) | 0) - 4, len = 2 + ((r() * 3) | 0), dir = r() < 0.5 ? 1 : -1; for (let s = 0; s < len; s++) p.p(sx + s, sy + (s * dir) / 2, cols[(k + dc.v) % 3]); }
      return true;
    }
    case "spill": {
      for (let j = -3; j <= 3; j++) for (let i = -6; i <= 6; i++) { const d = (i * i) / 36 + (j * j) / 9; if (d < 1 && hash2(x + i, y + j, 602) > d * 0.6) p.p(x + i, y + j, d < 0.4 ? "#2a1a10" : "#3a2616"); }
      if (dc.v) { p.p(x + 5, y - 3, GD.d); p.p(x + 6, y - 3, GD.m); }
      return true;
    }
    case "thread": {
      const c = ["#c03040", "#3070a0", "#c8a040"][dc.v % 3];
      let tx = x, ty = y;
      for (let k = 0; k < 14; k++) { p.p(tx, ty, c); tx += r() < 0.7 ? 1 : 0; ty += r() < 0.4 ? (r() < 0.5 ? -1 : 1) : 0; }
      return true;
    }
  }
  return false;
}
