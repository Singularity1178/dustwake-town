// Westerford's buildings, drawn from their data rows (content/town.ts:
// BuildingLook). One sprite per building, in the game's 3/4 view: the south
// facade at the bottom over the footprint's front rows, the front roof slope
// above it. Light carries the story: rune-lit windows glow a cold, leaded
// blue-white; torch-lit ones a warm, uneven amber; sleeping houses are shuttered
// and dark. Presentation only.
import type { Pen, Rng } from "../util";
import { hash2 } from "../util";
import { TS } from "../content/tiles";
import type { BuildingRow } from "../content/town";
import { WD, IR, GD } from "./palette";

const O = "#141016";
const MOSS = ["#2e4a22", "#3e5e2a", "#527636", "#6e8e34"];
const TINTS = ["#cfc3a0", "#c8a868", "#c49a88", "#9aa8b0"];
const TINT_SH = ["#a89c7c", "#a0864e", "#9c786a", "#7a868e"];
const BEAM = ["#2e1e14", "#3e2a1a", "#523822"];
const STONE = ["#6a6258", "#7a7064", "#5a544c", "#847a6a", "#706a60"];
const ASH = { j: "#5a5044", d: "#857862", m: "#a89a84", l: "#c4b8a0", h: "#d8ceb8" };
const BRICK = ["#8a4030", "#9a4a36", "#7a3628", "#a05440"];
const ROOF: Record<string, string[]> = {
  thatch: ["#4a3c22", "#7a6538", "#9a8450", "#b49a5c", "#c8b070"],
  shingle: ["#2e241c", "#4a3c30", "#5a4a3c", "#6a5848", "#7a6856"],
  slate: ["#262a32", "#3e4450", "#4a5260", "#56606e", "#6a7482"],
  tile: ["#4a2016", "#7a3a26", "#9a4a30", "#b05a38", "#c46e48"],
};
const AWN = [["#8a2a2a", "#d8ccb0"], ["#2a5a3a", "#d8ccb0"], ["#2a3a6a", "#d0c8b0"], ["#5a2a5a", "#d8c890"]];

/** Sprite geometry shared with the builder: footprint px inside the sprite. */
export const bldSize = (b: BuildingRow) => ({ w: b.w * TS + 8, h: b.d * TS + 14 });
const facadeH = (b: BuildingRow) => 14 + b.look.stories * 20;

interface G { x0: number; x1: number; top: number; bot: number; fh: number; eave: number; doorCx: number; doorW: number; doorH: number }

// ------------------------------------------------------------------ walls
function wall(p: Pen, r: Rng, b: BuildingRow, g: G) {
  const L = b.look, { x0, x1, bot, fh } = g, top = bot - fh, W = x1 - x0;
  switch (L.wall) {
    case "fieldstone": {
      for (let y = top; y < bot - 4; y += 5) {
        let x = x0 - ((r() * 6) | 0);
        while (x < x1) {
          const sw = 5 + ((r() * 6) | 0), c = STONE[(r() * STONE.length) | 0];
          const xa = Math.max(x0, x), xb = Math.min(x1, x + sw);
          if (xb - xa > 1) {
            p.r(xa, y, xb - xa, 5, "#2a2420");
            p.r(xa, y + 1, xb - xa - 1, 3, c);
            p.r(xa, y + 1, xb - xa - 1, 1, "#8e8676");
            if (r() < 0.25) p.p(xa + 1 + ((r() * (xb - xa - 2)) | 0), y + 2, "#4a443c");
          }
          x += sw;
        }
      }
      if (L.spolia) {
        // squared keep stones reused in the wall; one still carries the keep's sigil
        for (let k = 0; k < 3; k++) {
          const sx = x0 + 6 + ((hash2(b.tx, k, 300) * (W - 20)) | 0), sy = top + 6 + ((hash2(b.ty, k, 301) * (fh - 20)) | 0);
          p.o(sx, sy, 11, 7, "#9a9488", "#2a2420"); p.r(sx + 1, sy + 1, 9, 1, "#b8b2a4");
          if (k === 0) { p.p(sx + 5, sy + 2, "#3a3430"); p.r(sx + 4, sy + 3, 3, 1, "#3a3430"); p.r(sx + 3, sy + 4, 5, 1, "#3a3430"); p.p(sx + 5, sy + 3, "#6a6458"); }
        }
      }
      break;
    }
    case "timber": case "plaster": {
      const tint = L.wall === "timber" ? 0 : (L.tint ?? 0) % 4;
      p.r(x0, top, W, fh, TINTS[tint]);
      for (let i = 0; i < W * fh * 0.04; i++) p.p(x0 + ((r() * W) | 0), top + ((r() * fh) | 0), TINT_SH[tint]);
      if (L.age) for (let i = 0; i < W * 0.6; i++) p.p(x0 + ((r() * W) | 0), bot - 6 - ((r() * 10) | 0), "#8a8068");
      const beam = BEAM[1];
      if (L.wall === "timber") {
        const storyH = (fh - 6) / L.stories;
        for (let s = 0; s <= L.stories; s++) { const y = Math.round(top + s * storyH); p.r(x0, y, W, 3, beam); p.r(x0, y, W, 1, BEAM[2]); }
        const posts = Math.max(2, Math.round(W / 18));
        for (let k = 0; k <= posts; k++) {
          const x = Math.round(x0 + (k * (W - 3)) / posts);
          p.r(x, top, 3, fh - 5, beam); p.r(x, top, 1, fh - 5, BEAM[2]);
          if (k < posts) for (let s = 0; s < L.stories; s++) {
            const ya = Math.round(top + s * storyH) + 3, yb = Math.round(top + (s + 1) * storyH);
            const xb = Math.round(x0 + ((k + 1) * (W - 3)) / posts);
            if ((k + s + b.tx) % 3 === 0) { p.line(x + 3, yb - 1, xb - 1, ya, beam); p.line(x + 3, yb - 2, xb - 2, ya, beam); }
            else if ((k + s) % 3 === 1) { const ym = (ya + yb) >> 1; p.r(x + 3, ym, xb - x - 3, 2, beam); }
          }
        }
      } else {
        p.r(x0, top, 3, fh, BEAM[1]); p.r(x1 - 3, top, 3, fh, BEAM[1]);
        if (L.stories > 1) { const y = top + Math.round((fh - 6) / 2); p.r(x0, y, W, 2, BEAM[1]); }
        p.r(x0, top, W, 2, BEAM[0]);
      }
      if (L.jetty && L.stories > 1) {
        const y = top + Math.round((fh - 6) / L.stories) + 1;
        p.r(x0, y, W, 2, "rgba(0,0,0,0.35)");
        for (let x = x0 + 4; x < x1 - 2; x += 9) p.r(x, y - 2, 2, 2, BEAM[0]);
      }
      break;
    }
    case "ashlar": {
      for (let y = top, row = 0; y < bot - 4; y += 6, row++) {
        const off = row & 1 ? 7 : 0;
        for (let x = x0 - off; x < x1; x += 14) {
          const xa = Math.max(x0, x), xb = Math.min(x1, x + 14), t = hash2(x, y, 302);
          p.r(xa, y, xb - xa, 6, ASH.j);
          p.r(xa, y, xb - xa - 1, 5, t < 0.3 ? ASH.d : t > 0.8 ? ASH.l : ASH.m);
          p.r(xa, y, xb - xa - 1, 1, ASH.h);
        }
      }
      // quoins, a string course per storey and a cornice under the eave
      for (let y = top; y < bot - 4; y += 6) { const big = ((y - top) / 6) & 1; p.r(x0, y, big ? 7 : 4, 5, ASH.l); p.r(x1 - (big ? 7 : 4), y, big ? 7 : 4, 5, ASH.l); }
      for (let s = 1; s < L.stories; s++) { const y = Math.round(top + (s * (fh - 6)) / L.stories); p.r(x0, y, W, 3, ASH.h); p.r(x0, y + 2, W, 1, ASH.j); }
      p.r(x0 - 1, top, W + 2, 3, ASH.h); p.r(x0 - 1, top + 3, W + 2, 1, ASH.j);
      break;
    }
    case "brick": {
      for (let y = top, row = 0; y < bot - 4; y += 3, row++) {
        const off = row & 1 ? 3 : 0;
        for (let x = x0 - off; x < x1; x += 6) {
          const xa = Math.max(x0, x), xb = Math.min(x1, x + 6);
          p.r(xa, y, xb - xa, 3, "#4a3a32");
          p.r(xa, y, xb - xa - 1, 2, BRICK[(hash2(x, y, 303) * 4) | 0]);
        }
      }
      for (let y = top; y < bot - 4; y += 6) { p.r(x0, y, 5, 5, "#c8c0b0"); p.r(x1 - 5, y, 5, 5, "#c8c0b0"); p.r(x0, y + 5, 5, 1, "#7a7468"); p.r(x1 - 5, y + 5, 5, 1, "#7a7468"); }
      p.r(x0 - 1, top, W + 2, 3, "#d8d0c0"); p.r(x0 - 1, top + 3, W + 2, 1, "#5a544c");
      break;
    }
  }
  // plinth: a course of rough stone the whole town sits on, splashed with mud
  p.r(x0, bot - 5, W, 5, "#3a342e");
  for (let x = x0; x < x1; x += 4 + ((r() * 3) | 0)) p.r(x, bot - 5, 3, 4, r() < 0.5 ? "#5a544a" : "#4e4840");
  p.r(x0, bot - 5, W, 1, "#6a645a");
  if (L.age) for (let x = x0; x < x1; x++) if (r() < 0.25 * L.age) p.p(x, bot - 1 - ((r() * 3) | 0), MOSS[(r() * 3) | 0]);
}

// ------------------------------------------------------------------ windows
function windowAt(p: Pen, r: Rng, b: BuildingRow, x: number, y: number, w: number, h: number, lit: "torch" | "rune" | "dark", upper: boolean) {
  const L = b.look, stone = L.wall === "ashlar" || L.wall === "brick" || L.wall === "fieldstone";
  if (stone) { p.r(x - 1, y - 2, w + 2, 2, L.wall === "fieldstone" ? "#8a8272" : "#d0c8b4"); p.r(x - 1, y + h, w + 2, 2, L.wall === "fieldstone" ? "#6a645a" : "#b8b0a0"); }
  p.r(x - 1, y - 1, w + 2, h + 2, BEAM[0]);
  if (lit === "dark") {
    if (L.wall === "ashlar" || L.wall === "brick") {
      p.r(x, y, w, h, "#161c26"); p.r(x + (w >> 1), y, 1, h, "#2a3240"); p.r(x, y + (h >> 1), w, 1, "#2a3240"); p.p(x + 1, y + 1, "#4a5870");
    } else {
      // shuttered for the night
      p.r(x, y, w, h, WD.d);
      for (let k = 1; k < h; k += 2) p.r(x, y + k, w, 1, WD.o);
      p.r(x + (w >> 1), y, 1, h, WD.o); p.r(x, y, w, 1, WD.m);
    }
    return;
  }
  if (lit === "rune") {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
      const lead = (i + j) % 4 === 0 || (i - j + 64) % 4 === 0;
      p.g(x + i, y + j, 1, 1, lead ? "#5a7aa0" : j < h / 2 ? "#e6f8ff" : "#a8dcff");
    }
    p.g(x + (w >> 1), y, 1, h, "#40587a");
  } else {
    // torchlight: warm and uneven, a curtain edge, the odd silhouette of a pot or a jug on the sill
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
      const k = j / h + (hash2(x + i, y + j, 304) - 0.5) * 0.2;
      p.g(x + i, y + j, 1, 1, k < 0.35 ? "#ffd890" : k < 0.7 ? "#f0a050" : "#c86a2a");
    }
    p.g(x, y, 1, h, "#8a3a20"); p.g(x + w - 1, y, 1, h, "#8a3a20");
    p.g(x + (w >> 1), y, 1, h, "#3a1c10"); p.g(x, y + (h >> 1) - 1, w, 1, "#3a1c10");
    if (r() < 0.4) { p.g(x + 1, y + h - 3, 2, 3, "#2a140a"); }
  }
  if (!stone && !upper && b.look.wall !== "plaster") { p.r(x - 3, y - 1, 2, h + 2, WD.m); p.r(x + w + 1, y - 1, 2, h + 2, WD.m); p.p(x - 3, y + 2, IR.m); p.p(x + w + 2, y + 2, IR.m); }
  if (b.look.flowers && upper) {
    p.r(x - 1, y + h + 1, w + 2, 3, WD.m); p.r(x - 1, y + h + 1, w + 2, 1, WD.l);
    for (let i = 0; i < w + 2; i++) { p.p(x - 1 + i, y + h, i & 1 ? "#3e6a30" : "#5a8a40"); if (r() < 0.45) p.p(x - 1 + i, y + h - 1, ["#d04858", "#e8d060", "#d8d0e8", "#c86aa0"][(r() * 4) | 0]); }
  }
}

function windows(p: Pen, r: Rng, b: BuildingRow, g: G) {
  const L = b.look, { x0, x1, bot, fh } = g, top = bot - fh, W = x1 - x0;
  const storyH = (fh - 6) / L.stories;
  for (let s = 0; s < L.stories; s++) {
    const upper = s < L.stories - 1, ground = !upper;
    const wy = Math.round(top + s * storyH) + (L.wall === "ashlar" ? 6 : 5);
    const ww = L.wall === "ashlar" || L.wall === "brick" ? 7 : 8, wh = Math.max(7, Math.round(storyH) - (ground ? 10 : 9));
    const n = Math.max(1, Math.floor((W - 8) / 22));
    for (let k = 0; k < n; k++) {
      const cx = Math.round(x0 + ((k + 0.5) * W) / n);
      if (ground && Math.abs(cx - g.doorCx) < g.doorW / 2 + ww + 3) continue;
      if (ground && L.bay && Math.abs(cx - bayX(g)) < 18) continue;
      if (L.sign && ground && Math.abs(cx - signX(g)) < 6 && false) continue;
      let lit: "torch" | "rune" | "dark" = L.windows === "mixed" ? (hash2(b.tx + k, s, 305) < 0.5 ? "dark" : b.tier === "rune" ? "rune" : "torch") : L.windows;
      if (L.windows === "dark" && hash2(b.tx * 3 + k, s, 306) < 0.18) lit = "torch";
      windowAt(p, r, b, cx - (ww >> 1), wy, ww, wh, lit, upper);
    }
  }
}
const bayX = (g: G) => (g.doorCx - g.x0 > (g.x1 - g.x0) / 2 ? g.x0 + 18 : g.x1 - 18);
const signX = (g: G) => g.doorCx + g.doorW / 2 + 5;

// ------------------------------------------------------------------ doors
function door(p: Pen, _r: Rng, b: BuildingRow, g: G) {
  const L = b.look, cx = g.doorCx, bot = g.bot, dw = g.doorW, dh = g.doorH, x = Math.round(cx - dw / 2), y = bot - dh;
  if (L.portico) {
    p.r(x - 6, bot - 3, dw + 12, 3, ASH.l); p.r(x - 6, bot - 3, dw + 12, 1, ASH.h); p.r(x - 4, bot - 5, dw + 8, 2, ASH.m);
    for (const px of [x - 6, x + dw + 2]) { p.r(px, y - 2, 4, dh - 3, ASH.l); p.r(px, y - 2, 1, dh - 3, ASH.h); p.r(px + 3, y - 2, 1, dh - 3, ASH.d); }
    p.r(x - 8, y - 6, dw + 16, 4, ASH.l); p.r(x - 8, y - 6, dw + 16, 1, ASH.h); p.r(x - 8, y - 3, dw + 16, 1, ASH.j);
    for (let i = 0; i < (dw + 16) / 2; i++) p.r(x - 8 + i, y - 7 - Math.floor(i / 3), dw + 16 - i * 2, 1, i === 0 ? ASH.h : ASH.l);
  }
  switch (L.door) {
    case "forge": {
      // the smithy's open bay: a stone arch, the forge glowing deep inside
      p.r(x - 2, y - 3, dw + 4, dh + 3, "#2a2420");
      for (let j = 0; j < dh; j++) for (let i = 0; i < dw; i++) {
        const d = Math.hypot(i - dw / 2, (j - dh) * 1.3) / dw;
        p.g(x + i, y + j, 1, 1, d < 0.32 ? "#ff9a40" : d < 0.5 ? "#c45a20" : d < 0.7 ? "#6a2a10" : "#1a0e08");
      }
      p.g(x + (dw >> 1) - 4, bot - 6, 8, 2, "#1a0e08"); p.g(x + (dw >> 1) - 2, bot - 4, 4, 4, "#120a06");
      for (let i = 0; i < dw + 4; i++) { const a = Math.sin((i / (dw + 3)) * Math.PI); p.r(x - 2 + i, y - 3 - Math.round(a * 3), 1, 3, "#7a7064"); }
      return;
    }
    case "barn": {
      p.o(x, y, dw, dh, WD.m, O);
      for (let i = 2; i < dw - 1; i += 3) p.r(x + i, y + 1, 1, dh - 2, WD.d);
      p.r(x + (dw >> 1), y, 1, dh, O);
      p.line(x + 1, bot - 2, x + (dw >> 1) - 1, y + 1, WD.l); p.line(x + dw - 2, bot - 2, x + (dw >> 1) + 1, y + 1, WD.l);
      p.r(x + 1, y + 3, dw - 2, 2, WD.l);
      return;
    }
    case "grand": {
      // the guild's great doors: an arch with a lit fanlight, studded oak leaves
      for (let i = 0; i < dw + 4; i++) { const a = Math.sqrt(Math.max(0, 1 - ((i - (dw + 3) / 2) / ((dw + 4) / 2)) ** 2)); p.r(x - 2 + i, y - Math.round(a * 7) - 2, 1, Math.round(a * 7) + 2, ASH.h); }
      for (let i = 0; i < dw; i++) { const a = Math.sqrt(Math.max(0, 1 - ((i - (dw - 1) / 2) / (dw / 2)) ** 2)); const hh = Math.round(a * 6); if (hh > 0) p.g(x + i, y - hh, 1, hh, (i & 3) === 0 ? "#5a7aa0" : "#d8f2ff"); }
      p.o(x, y, dw, dh, "#4a2e1a", O); p.r(x + (dw >> 1), y, 1, dh, O);
      for (let j = 3; j < dh - 2; j += 4) for (let i = 2; i < dw - 1; i += 4) p.p(x + i, y + j, GD.m);
      p.r(x + (dw >> 1) - 3, y + (dh >> 1), 2, 2, GD.l); p.r(x + (dw >> 1) + 2, y + (dh >> 1), 2, 2, GD.l);
      return;
    }
    case "glazed": {
      p.o(x, y, dw, dh, "#3e2a1a", O);
      const lit = b.tier === "rune" ? ["#e6f8ff", "#a8dcff"] : ["#ffd890", "#e09048"];
      p.g(x + 2, y + 2, dw - 4, (dh >> 1) - 1, lit[0]); p.g(x + 2, y + (dh >> 2) + 1, dw - 4, 1, lit[1]); p.g(x + (dw >> 1), y + 2, 1, (dh >> 1) - 1, "#3a2a20");
      p.r(x + 2, y + (dh >> 1) + 2, dw - 4, (dh >> 1) - 4, "#4e3420"); p.p(x + dw - 3, y + (dh >> 1) + 1, GD.l);
      return;
    }
    case "double": {
      p.o(x, y, dw, dh, WD.m, O); p.r(x + (dw >> 1), y, 1, dh, O);
      for (const yy of [y + 3, bot - 5]) { p.r(x + 1, yy, dw - 2, 1, IR.m); }
      p.r(x + 1, y + 1, dw - 2, 1, WD.l);
      const lit = b.tier === "rune" ? "#d8f2ff" : "#ffc878";
      p.g(x + 2, y + 6, 3, 4, lit); p.g(x + dw - 5, y + 6, 3, 4, lit);
      p.p(x + (dw >> 1) - 2, y + (dh >> 1) + 1, GD.l); p.p(x + (dw >> 1) + 2, y + (dh >> 1) + 1, GD.l);
      return;
    }
    default: {
      p.o(x, y, dw, dh, WD.m, O);
      for (let i = 2; i < dw - 1; i += 3) p.r(x + i, y + 1, 1, dh - 2, WD.d);
      for (const yy of [y + 3, bot - 5]) { p.r(x + 1, yy, dw - 3, 1, IR.d); p.p(x + dw - 3, yy, IR.l); }
      p.p(x + dw - 3, y + (dh >> 1), GD.m);
      if (b.look.age) p.r(x, bot - 1, dw, 1, "#2a2016");
      p.r(x - 1, bot - 1, dw + 2, 1, "#5a544a");
    }
  }
}

// ------------------------------------------------------------------ signs
function signIcon(p: Pen, s: string, x: number, y: number) {
  const g = GD.l, i = IR.l;
  switch (s) {
    case "anvil": p.r(x + 1, y + 2, 8, 2, "#2a2e34"); p.r(x + 3, y + 4, 4, 2, "#2a2e34"); p.r(x + 2, y + 6, 6, 1, "#2a2e34"); p.p(x + 1, y + 2, i); p.r(x + 6, y, 1, 2, "#ff9a40"); break;
    case "sword": p.line(x + 1, y + 6, x + 8, y, "#c8d0d8"); p.line(x + 1, y, x + 8, y + 6, "#c8d0d8"); p.p(x + 4, y + 3, g); p.r(x + 3, y + 5, 4, 2, "#5a3a24"); break;
    case "gem": p.r(x + 3, y, 4, 1, "#e0f8ff"); p.r(x + 2, y + 1, 6, 2, "#60d0f0"); p.r(x + 3, y + 3, 4, 2, "#3090c0"); p.r(x + 4, y + 5, 2, 1, "#2070a0"); p.p(x + 3, y + 1, "#ffffff"); break;
    case "needle": p.line(x + 2, y + 6, x + 7, y, "#d0d4d8"); p.p(x + 7, y, "#606870"); p.line(x + 7, y + 1, x + 4, y + 4, "#d03040"); p.line(x + 4, y + 4, x + 1, y + 2, "#d03040"); break;
    case "crown": // a crown half sunk into the earth: the tavern's legend of the keep's lost treasury
      p.r(x + 1, y + 5, 8, 2, "#5a4630"); p.r(x + 2, y + 2, 6, 3, g); p.p(x + 2, y + 1, g); p.p(x + 5, y, g); p.p(x + 7, y + 1, g); p.p(x + 5, y + 3, "#c03040"); p.r(x + 2, y + 4, 6, 1, GD.d); break;
    case "guild": p.r(x + 2, y, 6, 6, "#2a3a6a"); p.r(x + 3, y + 6, 4, 1, "#2a3a6a"); p.line(x + 3, y + 5, x + 7, y + 1, "#d0d4d8"); p.p(x + 5, y + 2, g); p.p(x + 4, y + 1, g); break;
    case "seal": p.r(x + 3, y, 4, 7, "#6a1f24"); p.r(x + 2, y + 1, 6, 5, "#6a1f24"); p.r(x + 4, y + 2, 2, 3, g); break;
    case "sheaf": for (let k = 0; k < 5; k++) p.line(x + 5, y + 6, x + 3 + k, y, k & 1 ? "#c8b060" : "#a89040"); p.r(x + 3, y + 4, 4, 1, "#6a5020"); break;
  }
}
function hangingSign(p: Pen, b: BuildingRow, g: G) {
  const s = b.look.sign!;
  const x = Math.min(g.x1 - 14, Math.round(signX(g)) + (b.look.portico ? 6 : 0)), y = g.bot - Math.min(g.fh - 10, 30);
  p.r(x - 1, y, 14, 1, IR.d); p.r(x - 1, y - 1, 2, 3, IR.d); p.p(x + 12, y + 1, IR.l);
  p.r(x + 2, y + 1, 1, 2, IR.m); p.r(x + 10, y + 1, 1, 2, IR.m);
  p.o(x, y + 3, 13, 10, b.tier === "rune" ? "#2a2430" : "#4a3420", O);
  p.r(x + 1, y + 4, 11, 1, b.tier === "rune" ? GD.d : WD.l);
  signIcon(p, s, x + 2, y + 5);
}

// ------------------------------------------------------------------ roof
function roof(p: Pen, r: Rng, b: BuildingRow, g: G, sw: number) {
  const L = b.look, pal = ROOF[L.roof], eave = g.eave, sag = L.age === 2;
  const hip = Math.min(12, Math.round(sw * 0.1));
  for (let y = 2; y < eave + 3; y++) {
    const f = (y - 2) / (eave + 1), inset = Math.round((1 - f) * hip) + (L.roof === "thatch" ? 0 : 0);
    const xa = inset, xb = sw - inset;
    const course = L.roof === "slate" ? 3 : L.roof === "thatch" ? 5 : 4;
    const row = Math.floor((y - 2) / course), joint = (y - 2) % course === course - 1;
    const sagY = sag ? Math.round(Math.sin((Math.PI * 0) + f * Math.PI) * 0) : 0;
    for (let x = xa; x < xb; x++) {
      let c: string;
      const sideL = x < xa + Math.round(hip * (1 - f)) + 1 && inset > 0 && x < hip, sideR = x >= xb - Math.round(hip * (1 - f)) - 1 && inset > 0 && x > sw - hip;
      if (L.roof === "thatch") {
        const streak = hash2(x, row, 310), sh = hash2(x >> 1, y >> 2, 311);
        c = streak < 0.15 ? pal[1] : sh < 0.45 ? pal[2] : sh < 0.85 ? pal[3] : pal[4];
        if (joint && hash2(x, y, 312) < 0.5) c = pal[1];
      } else {
        const w = L.roof === "slate" ? 5 : 6, off = row & 1 ? w >> 1 : 0, jx = (x + off) % w === 0;
        const t = hash2(Math.floor((x + off) / w), row, 313);
        c = joint ? pal[0] : jx ? pal[1] : t < 0.25 ? pal[2] : t > 0.85 ? pal[4] : pal[3];
        if (L.roof === "tile" && !joint && (x + off) % w === w - 1) c = pal[1];
      }
      if (sideL) c = pal[Math.min(4, 3)]; if (sideR) c = pal[1];
      if (f > 0.86 && L.roof !== "thatch") c = y === eave + 2 ? pal[0] : c;
      p.p(x, y + sagY, c);
    }
    if (inset > 0) { p.p(xa, y, O); p.p(xb - 1, y, O); }
  }
  // ridge, eave lip and the eave's shadow on the wall
  p.r(hip, 1, sw - hip * 2, 2, pal[0]); p.r(hip, 0, sw - hip * 2, 1, O);
  if (L.roof === "thatch") {
    for (let x = hip; x < sw - hip; x += 3) p.r(x, 1, 2, 2, pal[1]);
    for (let x = 0; x < sw; x++) { const lip = 2 + ((hash2(x, 0, 314) * 2) | 0); p.r(x, eave + 1, 1, lip, x % 2 ? pal[1] : pal[2]); p.p(x, eave + 1 + lip, O); }
    if (L.age) for (let i = 0; i < sw * eave * 0.03 * L.age; i++) { const mx = (r() * sw) | 0, my = 4 + ((r() * (eave - 4)) | 0); p.r(mx, my, 2, 1, MOSS[(r() * 4) | 0]); }
  } else {
    p.r(0, eave + 2, sw, 1, pal[0]); p.r(0, eave + 3, sw, 1, O);
  }
  p.r(4, eave + 4, sw - 8, 2, "rgba(0,0,0,0.35)");
}

function chimney(p: Pen, r: Rng, b: BuildingRow, cx: number, eave: number) {
  const stone = b.look.wall === "brick" ? BRICK : STONE, x = cx - 4, top = 8, h = Math.min(eave - 4, 16);
  p.o(x, top, 9, h, stone[1], O);
  for (let y = top + 1; y < top + h - 1; y += 3) for (let xx = x + 1; xx < x + 8; xx += 4) p.r(xx + ((y >> 1) & 1) * 2, y, 3, 2, stone[(r() * stone.length) | 0]);
  p.r(x - 1, top, 11, 2, "#3a342e"); p.r(x, top, 9, 1, "#7a7064"); p.r(x + 2, top - 1, 5, 1, "#141010");
}

function gable(p: Pen, r: Rng, b: BuildingRow, g: G) {
  const L = b.look, gw = Math.min(64, Math.round((g.x1 - g.x0) * 0.5)) | 1, gh = Math.round(gw * 0.42), cx = g.doorCx, base = g.eave + 3;
  const pal = ROOF[L.roof];
  for (let j = 0; j < gh; j++) {
    const half = Math.round(((gh - j) / gh) * (gw / 2));
    const y = base - j;
    // wall of the gable
    const wc = L.wall === "ashlar" ? ASH.m : L.wall === "brick" ? BRICK[0] : L.wall === "fieldstone" ? STONE[1] : TINTS[L.wall === "plaster" ? (L.tint ?? 0) % 4 : 0];
    p.r(cx - half + 3, y, half * 2 - 6, 1, wc);
    // barge boards / verge
    p.r(cx - half, y, 4, 1, pal[2]); p.r(cx + half - 4, y, 4, 1, pal[1]);
    p.p(cx - half - 1, y, O); p.p(cx + half, y, O);
  }
  p.r(cx - 1, base - gh - 1, 3, 2, pal[0]);
  if (L.wall === "timber") { p.r(cx, base - gh + 3, 1, gh - 3, BEAM[1]); p.r(cx - (gw >> 2), base - 2, gw >> 1, 2, BEAM[1]); }
  if (L.hoist) {
    p.r(cx - 1, base - gh + 2, 3, 3, BEAM[1]); p.r(cx - 1, base - gh + 2, 3, 1, BEAM[2]);
    p.r(cx - 6, base - 12, 12, 11, WD.d); p.o(cx - 6, base - 12, 12, 11, WD.m, O); p.r(cx, base - 12, 1, 11, O);
    p.r(cx - 1, base - gh - 2, 2, 4, BEAM[1]); p.r(cx - 1, base - gh - 2, 10, 2, BEAM[1]); p.o(cx + 7, base - gh, 3, 3, IR.m, O);
    p.r(cx + 8, base - gh + 3, 1, 26, "#8a7a5a"); p.r(cx + 7, base - gh + 29, 3, 2, IR.d);
  } else {
    const lit = b.tier === "rune" || L.windows === "rune" ? "rune" : L.windows === "dark" ? "dark" : "torch";
    const ww = 6, wh = Math.max(5, gh - 9);
    if (gh > 12) windowAt(p, r, b, cx - (ww >> 1), base - gh + 6, ww, wh, lit, true);
  }
}

function dormers(p: Pen, r: Rng, b: BuildingRow, g: G, sw: number) {
  const pal = ROOF[b.look.roof], n = Math.floor((sw - 40) / 40), y = Math.round(g.eave * 0.35);
  for (let k = 0; k < n; k++) {
    const cx = Math.round(20 + ((k + 0.5) * (sw - 40)) / n);
    if (b.look.gable && Math.abs(cx - g.doorCx) < 40) continue;
    p.o(cx - 6, y, 13, 12, ASH.m, O);
    windowAt(p, r, b, cx - 3, y + 4, 6, 6, b.tier === "rune" ? "rune" : "torch", true);
    for (let j = 0; j < 5; j++) p.r(cx - 7 + j, y - 1 - j, 15 - j * 2, 1, j === 4 ? pal[0] : pal[3]);
  }
}

function awning(p: Pen, b: BuildingRow, x: number, y: number, w: number) {
  const [a, c] = AWN[(b.look.awning ?? 0) % 4];
  for (let j = 0; j < 6; j++) for (let i = -j; i < w + j; i++) p.p(x + i, y + j, ((i + 40) >> 2) & 1 ? a : c);
  for (let i = -6; i < w + 6; i += 3) { p.p(x + i, y + 6, a); p.p(x + i + 1, y + 6, a); p.p(x + i + 1, y + 7, a); }
  p.r(x - 6, y - 1, w + 12, 1, O);
}

function bay(p: Pen, b: BuildingRow, g: G) {
  const cx = bayX(g), x = cx - 11, w = 22, y = g.bot - 26, h = 17;
  p.r(x - 2, y - 3, w + 4, 3, b.look.wall === "brick" ? "#d8d0c0" : WD.m); p.r(x - 2, y - 3, w + 4, 1, b.look.wall === "brick" ? "#f0e8d8" : WD.l);
  p.o(x - 1, y - 1, w + 2, h + 2, "#3e2a1a", O);
  const lit = b.tier === "rune" ? ["#e6f8ff", "#a8dcff", "#5a7aa0"] : ["#ffe0a0", "#f0a858", "#7a4a2a"];
  for (let j = 0; j < h; j++) p.g(x, y + j, w, 1, j < h * 0.5 ? lit[0] : lit[1]);
  for (const mx of [x + 7, x + 14]) p.g(mx, y, 1, h, lit[2]);
  // the display inside
  if (b.look.sign === "gem") for (let k = 0; k < 7; k++) { const gx = x + 2 + k * 3, gy = y + h - 5 - (k % 2) * 2; p.g(gx, gy, 2, 2, ["#ff5a7a", "#60d0f0", "#70f0a0", "#f0d060"][k % 4]); p.g(gx, gy + 2, 2, 3, "#3a2a40"); }
  if (b.look.sign === "needle") { for (let k = 0; k < 3; k++) { const fx = x + 3 + k * 7; p.g(fx, y + 4, 4, 9, ["#8a2a3a", "#2a5a6a", "#c8a040"][k]); p.g(fx + 1, y + 2, 2, 2, "#3a2a20"); } }
  p.r(x - 1, y + h + 1, w + 2, 3, "#5a544a"); p.r(x - 1, y + h + 1, w + 2, 1, "#8a8272");
  if (b.look.awning !== undefined) awning(p, b, x, y - 8, w);
}

/** Draw one building (the sprite is bldSize(b); anchor bottom centre). */
export function drawBuilding(p: Pen, r: Rng, b: BuildingRow) {
  const { w: sw, h: sh } = bldSize(b), L = b.look;
  const fh = facadeH(b), x0 = 4, x1 = 4 + b.w * TS, bot = sh;
  const doorCx = b.door ? x0 + (b.door.x - b.tx) * TS + b.door.w * 8 : x0 + Math.round((b.w * TS) / 2);
  const doorW = L.door === "grand" ? 24 : L.door === "forge" ? 26 : L.door === "barn" ? 22 : L.door === "double" ? 14 : 10;
  const doorH = L.door === "grand" ? 24 : L.door === "barn" ? 22 : L.door === "forge" ? 20 : 18;
  const g: G = { x0, x1, top: 14, bot, fh, eave: bot - fh - 3, doorCx, doorW, doorH };
  // ground shadow at the foot of the building
  p.r(x0 - 2, bot - 2, x1 - x0 + 4, 2, "rgba(0,0,0,0.3)");
  roof(p, r, b, g, sw);
  for (const f of L.chimneys ?? []) chimney(p, r, b, Math.round(f * b.w * TS) + 4, g.eave);
  if (L.stories === 3 || (L.roof === "slate" && b.d >= 8)) dormers(p, r, b, g, sw);
  wall(p, r, b, g);
  if (L.gable) gable(p, r, b, g);
  windows(p, r, b, g);
  if (L.bay) bay(p, b, g);
  else if (L.awning !== undefined) awning(p, b, doorCx - 10, bot - doorH - 9, 20);
  if (b.door || L.door === "barn" || L.door === "double") door(p, r, b, g);
  else door(p, r, b, g);
  if (L.sign) hangingSign(p, b, g);
  // weathering: ivy on the old ones, a rain-butt on the homes
  if (L.age) {
    for (let k = 0; k < L.age * 2; k++) {
      let vx = x0 + 3 + ((hash2(b.tx, k, 320) * (x1 - x0 - 6)) | 0);
      if (Math.abs(vx - doorCx) < doorW) continue;
      for (let j = 0; j < 10 + L.age * 6; j++) { const y = bot - 6 - j; p.p(vx, y, "#2e3e1c"); if (j % 2 === 0) p.p(vx + (j % 4 ? 1 : -1), y, r() < 0.5 ? "#4e7a34" : "#3a6228"); if (r() < 0.2) vx += r() < 0.5 ? -1 : 1; }
    }
  }
  if (b.tier === "torch" && !L.sign && b.door === undefined && L.door === "plank") {
    const bx = doorCx + (b.tx % 2 ? 14 : -20);
    if (bx > x0 + 2 && bx < x1 - 9) { p.o(bx, bot - 11, 7, 10, WD.m, O); p.r(bx, bot - 8, 7, 1, IR.d); p.r(bx + 1, bot - 10, 5, 1, "#1a2430"); }
  }
}

/** The old east gate towers: squat, square, older stone than anything in the square, the arch's springing still visible. */
export function drawGateTower(p: Pen, r: Rng, south: boolean) {
  const W = 64, H = 96;
  p.r(2, H - 2, W - 4, 2, "rgba(0,0,0,0.35)");
  const top = south ? 54 : 10; // the south tower is seen from behind: keep its top off the High Street
  // crenellated top seen from above
  p.r(2, top - 8, W - 4, 10, "#4a443c");
  for (let x = 2; x < W - 2; x += 8) { p.o(x, top - 12, 6, 6, "#7a7064", O); p.r(x + 1, top - 12, 4, 1, "#9a9284"); }
  p.r(4, top - 6, W - 8, 4, "#2a2622");
  for (let y = top; y < H - 4; y += 6) {
    const off = ((y - top) / 6) & 1 ? 6 : 0;
    for (let x = 2 - off; x < W - 2; x += 12) {
      const xa = Math.max(2, x), xb = Math.min(W - 2, x + 12);
      p.r(xa, y, xb - xa, 6, "#2a2420");
      p.r(xa, y, xb - xa - 1, 5, STONE[(hash2(x, y, 330) * 5) | 0]);
      p.r(xa, y, xb - xa - 1, 1, "#9a9284");
    }
  }
  for (let x = 2; x < W - 2; x++) if (r() < 0.3) p.p(x, top + ((r() * 30) | 0), MOSS[(r() * 4) | 0]);
  // the stump of the arch that once spanned the street, toward the road side
  const sy = south ? top + 4 : H - 40;
  p.o(south ? 2 : 2, sy, 10, 14, "#8a8272", O); p.r(3, sy + 1, 8, 1, "#aaa294");
  // arrow slit
  p.r(W / 2 - 1, top + 12, 2, 12, "#0e0c0a"); p.r(W / 2 - 3, top + 17, 6, 2, "#0e0c0a");
  for (let k = 0; k < 2; k++) { let vx = 10 + k * 36; for (let j = 0; j < 30; j++) { p.p(vx, H - 6 - j, "#2e3e1c"); if (j % 2 === 0) p.p(vx + 1, H - 6 - j, "#4e7a34"); if (r() < 0.25) vx += r() < 0.5 ? -1 : 1; } }
  p.r(2, H - 5, W - 4, 5, "#3a342e"); p.r(2, H - 5, W - 4, 1, "#6a645a");
}
