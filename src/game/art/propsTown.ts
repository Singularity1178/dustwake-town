// Westerford's prop sprites: the streets (rune lamps, wall torches, stalls,
// the Lamp Stone, the well, the labour yard), the buildings themselves (drawn
// by art/buildings.ts from their data rows), and the furnishings of the six
// shop interiors. Registered into PROP_ART by art/props.ts. Presentation only.
import type { Pen, Rng } from "../util";
import { hash2, makeSprite } from "../util";
import { S, WD, IR, CL, GD } from "./palette";
import { stoneBlob, type PropArt } from "./common";
import { TOWN_BUILDINGS } from "../content/town";
import { bldSize, drawBuilding, drawGateTower } from "./buildings";

const O = "#141016";
const MOSS = ["#2e4a22", "#3e5e2a", "#527636", "#6e8e34"];
// the rune light: a carved glyph burning cold blue-white, a faint violet heart (the runes' own colour)
const RUNE = { core: "#f4fcff", hi: "#c8eeff", mid: "#7cc8f4", lo: "#4a78c0", vio: "#9a80ff" };
const STALL = [["#8a2a2a", "#d8ccb0"], ["#2a5a3a", "#d8ccb0"], ["#2a3a6a", "#d0c8b0"], ["#a07020", "#e0d4b0"]];

/** A carved rune crystal, glowing (w x h at x, y). */
function runeGlow(p: Pen, x: number, y: number, w: number, h: number) {
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const d = Math.hypot((i + 0.5 - w / 2) / (w / 2), (j + 0.5 - h / 2) / (h / 2));
    if (d > 1.05) continue;
    p.g(x + i, y + j, 1, 1, d < 0.35 ? RUNE.core : d < 0.65 ? RUNE.hi : d < 0.88 ? RUNE.mid : RUNE.lo);
  }
  p.g(x + (w >> 1), y + 1, 1, h - 2, RUNE.vio);
}
function tufts(p: Pen, r: Rng, x: number, y: number, w: number, k: number) {
  const cols = ["#4e7a3a", "#628e44", "#3a5e2c"];
  for (let i = 0; i < k; i++) { const bx = x + ((r() * w) | 0), h = 1 + ((r() * 3) | 0); p.r(bx, y - h, 1, h, cols[(r() * 3) | 0]); }
}
function leaf(p: Pen, r: Rng, cx: number, cy: number, rr: number, pal: string[]) {
  for (let y = -rr; y <= rr; y++) for (let x = -rr; x <= rr; x++) {
    const d = (x * x + y * y) / (rr * rr);
    if (d > 1 || (d > 0.75 && r() < 0.35)) continue;
    p.p(cx + x, cy + y, d > 0.75 ? pal[0] : x + y < -rr * 0.5 ? pal[3] : x + y < 0 ? pal[2] : pal[1]);
  }
}
const cloth = ["#8a2a3a", "#2a5a6a", "#c8a040", "#3a6a3a", "#5a3a7a", "#d8d0c0", "#7a4a2a", "#2a2a4a"];

export const TOWN_PROP_ART: Record<string, PropArt> = {
  // ================================================================ lights
  /** A street rune lamp: a fluted iron post, a caged crystal burning without fuel. */
  runelamp: (_v, _a, M) => M(12, 38, (p) => {
    p.r(2, 35, 8, 3, "rgba(0,0,0,0.35)");
    p.o(3, 33, 6, 4, S.l, O); p.r(4, 33, 4, 1, S.h);
    p.r(5, 11, 2, 23, IR.d); p.r(5, 11, 1, 23, IR.l);
    p.r(4, 22, 4, 1, IR.m); p.r(4, 31, 4, 2, IR.m);
    p.o(2, 2, 8, 10, IR.d, O); runeGlow(p, 3, 3, 6, 8);
    p.r(2, 6, 8, 1, IR.d); p.r(5, 3, 1, 8, IR.d);
    p.r(1, 1, 10, 2, IR.m); p.r(3, 0, 6, 1, IR.l); p.r(1, 11, 10, 1, IR.m);
  }),
  /** A rune lamp on an iron bracket, fixed to a facade (the sprite's foot stands on the street). */
  runelamp_wall: (_v, _a, M) => M(12, 34, (p) => {
    p.r(1, 13, 9, 1, IR.d); p.r(1, 12, 1, 3, IR.d); p.line(2, 16, 7, 13, IR.d);
    p.o(5, 4, 7, 9, IR.d, O); runeGlow(p, 6, 5, 5, 7);
    p.r(4, 3, 9, 1, IR.m); p.r(4, 12, 9, 1, IR.m);
  }),
  /** A torch in an iron cresset on a facade (flame drawn live above it). */
  walltorch: (_v, alt, M) => M(8, 32, (p) => {
    p.r(2, 18, 4, 1, IR.d); p.r(3, 15, 2, 4, IR.m); p.r(2, 11, 4, 4, IR.m); p.r(2, 11, 4, 1, IR.l);
    p.r(3, 8, 2, 3, WD.m); p.p(3, 8, WD.l);
    if (!alt) p.r(3, 7, 2, 2, "#120e0c"); else p.g(3, 7, 2, 2, "#ff9a3a");
  }),
  runesconce: (_v, _a, M) => M(10, 18, (p) => {
    p.r(3, 13, 4, 3, IR.d); p.r(4, 10, 2, 4, IR.m);
    p.o(1, 1, 8, 10, GD.d, O); runeGlow(p, 2, 2, 6, 8); p.r(1, 0, 8, 1, GD.m); p.r(1, 10, 8, 1, GD.m);
  }),
  /** Brass hoops on a chain, three rune crystals: hangs high in the room (the sprite's foot is the floor beneath). */
  runechandelier: (_v, _a, M) => M(30, 56, (p) => {
    p.r(14, 0, 2, 14, IR.d);
    p.r(4, 18, 22, 2, GD.d); p.r(4, 18, 22, 1, GD.l); p.r(8, 14, 14, 1, GD.m);
    p.line(14, 14, 6, 18, GD.d); p.line(15, 14, 23, 18, GD.d);
    for (const x of [3, 13, 23]) { p.r(x + 1, 20, 2, 2, GD.d); runeGlow(p, x, 11, 4, 7); }
    p.r(10, 54, 10, 2, "rgba(0,0,0,0.12)");
  }),
  candelabra: (_v, _a, M) => M(12, 24, (p) => {
    p.r(2, 21, 8, 3, "rgba(0,0,0,0.3)"); p.r(3, 20, 6, 2, GD.d); p.r(5, 8, 2, 13, GD.m); p.r(5, 8, 1, 13, GD.l);
    p.r(1, 8, 10, 1, GD.m);
    for (const x of [1, 5, 9]) { p.r(x, 4, 2, 4, "#e8e0c8"); p.g(x, 2, 2, 2, "#ffd070"); p.g(x, 1, 1, 1, "#fff4c0"); }
  }),
  tablecandle: (_v, _a, M) => M(6, 18, (p) => {
    p.r(1, 14, 4, 1, GD.d); p.r(2, 10, 2, 4, "#e8e0c8"); p.g(2, 8, 2, 2, "#ffd070"); p.g(2, 7, 1, 1, "#fff4c0");
  }),
  // ================================================================ street furniture
  /** A market stall: trestle, canvas awning striped in its trader's colours, goods set out (v: colour/trade). */
  stall: (v, _a, M) => M(36, 34, (p, r) => {
    const [a, c] = STALL[v % 4];
    p.r(2, 31, 32, 3, "rgba(0,0,0,0.3)");
    for (const x of [3, 31]) { p.r(x, 6, 2, 26, WD.d); p.r(x, 6, 1, 26, WD.l); }
    p.o(1, 18, 34, 6, WD.m, O); p.r(2, 18, 32, 1, WD.l);
    p.r(4, 24, 28, 7, "#2a1c12"); p.r(4, 24, 28, 1, "#1a120c");
    // goods on the board
    const goods = [["#c03030", "#a02020", "#e05040"], ["#6a9a3a", "#4a7a2a", "#c8b040"], ["#c8b8a0", "#8a6a4a", "#5a3a2a"], ["#d0a040", "#a07020", "#8a5a20"]][v % 4];
    for (let x = 4; x < 32; x += 3) { const h = 2 + ((r() * 2) | 0); p.r(x, 18 - h, 3, h, goods[(r() * 3) | 0]); p.p(x, 18 - h, "#f0e0c0"); }
    p.o(5, 25, 9, 6, "#7a6a48", "#2a2216"); p.o(22, 26, 8, 5, WD.m, O);
    for (let j = 0; j < 7; j++) for (let i = -j; i < 36 + j - 0; i++) { const x = i; if (x < -1 || x > 36) continue; p.p(x, 1 + j, ((x + 40) >> 2) & 1 ? a : c); }
    for (let i = 0; i < 36; i += 4) { p.r(i, 8, 2, 1, a); p.p(i, 9, a); }
    p.r(0, 0, 36, 1, O);
  }),
  well: (_v, _a, M) => M(28, 40, (p, r) => {
    p.r(2, 36, 24, 4, "rgba(0,0,0,0.35)");
    // a ring of fine dressed stone (the keep's), patched with rough fieldstone
    for (let y = 22; y < 37; y++) for (let x = 2; x < 26; x++) {
      const dx = (x - 13.5) / 12, dy = (y - 29) / 8, d = dx * dx + dy * dy;
      if (d > 1) continue;
      p.p(x, y, d > 0.55 ? (dy < 0 ? "#a8a090" : (x >> 2) & 1 ? "#7a7468" : "#8a8476") : d > 0.4 ? O : "#0a0e12");
    }
    p.p(8, 30, "#2a3a4a"); p.p(17, 31, "#3a4a5a");
    for (const x of [3, 23]) { p.r(x, 4, 2, 24, WD.d); p.r(x, 4, 1, 24, WD.l); }
    p.r(1, 3, 26, 3, WD.m); p.r(1, 3, 26, 1, WD.l);
    for (let j = 0; j < 4; j++) p.r(2 + j * 2, 0 - 0 + j, 24 - j * 4, 1, j === 0 ? "#6a5848" : "#4a3c30");
    p.r(13, 6, 1, 14, "#8a7a5a"); p.o(11, 19, 5, 4, WD.m, O); p.r(12, 19, 3, 1, IR.m);
    p.r(4, 7, 20, 1, IR.d);
    for (let i = 0; i < 6; i++) p.p(3 + ((r() * 22) | 0), 23 + ((r() * 4) | 0), MOSS[(r() * 4) | 0]);
  }),
  /** The Lamp Stone: the town's first rune lamp, a granite obelisk with a bronze plaque. */
  lampstone: (_v, _a, M) => M(22, 60, (p) => {
    p.r(1, 56, 20, 4, "rgba(0,0,0,0.35)");
    p.o(0, 50, 22, 8, S.l, O); p.r(1, 51, 20, 1, S.h); p.o(2, 45, 18, 6, S.m, O); p.r(3, 46, 16, 1, S.h);
    for (let y = 14; y < 46; y++) { const w = 10 - Math.floor((45 - y) / 10); p.r(11 - (w >> 1) - 1, y, w + 2, 1, O); p.r(11 - (w >> 1), y, w, 1, y < 18 ? S.h : S.l); p.p(11 + (w >> 1) - 1, y, S.d); }
    p.o(7, 34, 8, 6, GD.d, O); p.r(8, 35, 6, 1, GD.l); p.r(8, 37, 6, 1, GD.m);
    p.o(5, 4, 12, 11, IR.d, O); runeGlow(p, 6, 5, 10, 9);
    p.r(5, 9, 12, 1, IR.d); p.r(4, 3, 14, 2, IR.m); p.r(8, 1, 6, 2, IR.l); p.r(10, 0, 2, 1, IR.h); p.r(4, 14, 14, 1, IR.m);
  }),
  trough: (_v, _a, M) => M(30, 14, (p) => {
    p.r(1, 11, 28, 3, "rgba(0,0,0,0.3)");
    p.o(0, 2, 30, 10, S.m, O); p.r(1, 3, 28, 1, S.h); p.r(2, 4, 26, 4, "#1e3240"); p.r(3, 5, 8, 1, "#3a5a6a"); p.r(16, 6, 6, 1, "#2e4a5a");
    p.r(1, 9, 28, 2, S.d);
  }),
  noticeboard: (_v, _a, M) => M(26, 28, (p, r) => {
    p.r(2, 25, 22, 3, "rgba(0,0,0,0.3)");
    for (const x of [2, 22]) { p.r(x, 4, 2, 23, WD.d); p.r(x, 4, 1, 23, WD.l); }
    p.o(0, 4, 26, 15, WD.m, O); p.r(1, 5, 24, 13, "#5a4630");
    for (let k = 0; k < 9; k++) { const x = 2 + ((r() * 18) | 0), y = 6 + ((r() * 8) | 0); p.r(x, y, 4 + ((r() * 2) | 0), 5, ["#d8d0b8", "#c8c0a0", "#e0d8c0", "#b8a888"][k % 4]); p.p(x + 1, y, CL.m); p.r(x + 1, y + 2, 2, 1, "#6a604c"); }
    for (let j = 0; j < 3; j++) p.r(1 + j, 3 - j, 24 - j * 2, 1, j === 2 ? "#4a3c30" : "#6a5848");
  }),
  signpost: (_v, _a, M) => M(30, 34, (p) => {
    p.r(11, 31, 8, 3, "rgba(0,0,0,0.3)");
    p.r(14, 4, 3, 28, WD.d); p.r(14, 4, 1, 28, WD.l);
    const arm = (y: number, left: boolean, c: string) => {
      const x = left ? 2 : 15; p.o(x, y, 14, 6, c, O); p.r(x + 1, y + 1, 12, 1, "#a08a64");
      if (left) { p.p(x - 1, y + 2, O); p.p(x - 1, y + 3, O); p.r(x, y + 2, 1, 2, c); } else { p.p(x + 14, y + 2, O); p.p(x + 14, y + 3, O); }
      p.r(x + 3, y + 3, 7, 1, "#3a2a1a");
    };
    arm(5, false, WD.m); arm(12, true, WD.m); arm(19, false, WD.l);
    p.r(13, 3, 5, 2, WD.o);
  }),
  milestone: (_v, _a, M) => M(12, 18, (p, r) => {
    p.r(1, 15, 10, 3, "rgba(0,0,0,0.3)");
    p.o(2, 3, 8, 13, "#8a8478", O); p.r(3, 3, 6, 2, "#aaa498"); for (let y = 2; y > 0; y--) p.r(3 + (2 - y), y, 6 - (2 - y) * 2, 1, "#9a9488");
    p.r(4, 7, 4, 1, "#4a463e"); p.r(4, 9, 3, 1, "#4a463e"); p.r(4, 11, 4, 1, "#4a463e");
    tufts(p, r, 0, 17, 12, 4);
  }),
  gateplaque: (_v, _a, M) => M(12, 16, (p) => {
    p.r(5, 6, 2, 10, IR.d); p.o(0, 0, 12, 8, GD.d, O); p.r(1, 1, 10, 1, GD.l); p.r(2, 3, 8, 1, "#5a3a10"); p.r(2, 5, 6, 1, "#5a3a10");
  }),
  shrine: (_v, _a, M) => M(18, 34, (p, r) => {
    p.r(2, 30, 14, 4, "rgba(0,0,0,0.3)");
    // the base is a squared block from the keep, its sigil worn but legible
    p.o(1, 20, 16, 12, "#9a9488", O); p.r(2, 21, 14, 1, "#bab4a6");
    p.p(9, 23, "#3a3430"); p.r(8, 24, 3, 1, "#3a3430"); p.r(7, 25, 5, 1, "#3a3430"); p.p(9, 24, "#6a6458");
    p.r(7, 6, 4, 15, "#7a7064"); p.r(7, 6, 1, 15, "#9a9284"); p.r(3, 9, 12, 3, "#7a7064"); p.r(3, 9, 12, 1, "#9a9284");
    p.r(8, 2, 2, 4, "#7a7064");
    // offerings: a sprig, a stub of candle
    p.r(4, 18, 2, 2, "#e8e0c8"); p.g(4, 17, 1, 1, "#ffc060"); p.r(12, 18, 3, 1, "#5a8a40"); p.p(13, 17, "#d04858");
    for (let i = 0; i < 8; i++) p.p(2 + ((r() * 14) | 0), 20 + ((r() * 3) | 0), MOSS[(r() * 4) | 0]);
    tufts(p, r, 0, 33, 18, 5);
  }),
  bench_town: (_v, _a, M) => M(30, 12, (p) => {
    p.r(2, 10, 26, 2, "rgba(0,0,0,0.3)");
    p.o(0, 0, 30, 4, WD.m, O); p.r(1, 1, 28, 1, WD.l);
    p.o(0, 4, 30, 4, WD.l, O); p.r(1, 5, 28, 1, WD.h);
    for (const x of [2, 26]) { p.r(x, 8, 2, 4, IR.d); p.r(x, 3, 2, 2, IR.d); }
  }),
  /** A handcart built for a labour golem: long shafts set far apart, a push-bar at golem height. */
  handcart: (v, _a, M) => M(30, 20, (p, r) => {
    p.r(2, 17, 26, 3, "rgba(0,0,0,0.3)");
    p.o(6, 4, 22, 9, WD.m, O); p.r(7, 5, 20, 1, WD.l); for (let x = 10; x < 27; x += 5) p.r(x, 6, 1, 6, WD.d);
    if (v % 2 === 0) for (let k = 0; k < 4; k++) { const x = 8 + k * 5; p.o(x, 1, 6, 5, "#7a6a48", "#2a2216"); p.r(x + 1, 2, 2, 1, "#9a8a60"); void r; }
    else { stoneBlob(p, 9, 0, 8, 6, r); stoneBlob(p, 16, 1, 9, 6, r); }
    p.o(14, 10, 10, 10, WD.d, O); p.r(18, 14, 2, 2, IR.m); p.r(15, 11, 8, 1, IR.d);
    p.r(0, 8, 8, 2, WD.d); p.r(0, 6, 2, 6, IR.d); p.p(0, 6, IR.l);
  }),
  /** A cargo sledge, iron-shod runners, lashed with dressed blocks too heavy for any team of men. */
  haulsledge: (_v, _a, M) => M(38, 24, (p) => {
    p.r(2, 21, 34, 3, "rgba(0,0,0,0.35)");
    p.r(1, 18, 36, 3, IR.d); p.r(1, 18, 36, 1, IR.l); p.r(0, 16, 3, 3, IR.d);
    p.o(3, 14, 32, 5, WD.m, O); p.r(4, 15, 30, 1, WD.l);
    for (const [x, y, w, h] of [[4, 4, 14, 10], [18, 6, 15, 8], [10, 0, 12, 5]] as [number, number, number, number][]) {
      p.o(x, y, w, h, "#8a8476", O); p.r(x + 1, y + 1, w - 2, 1, "#aaa498"); p.r(x + w - 2, y + 1, 1, h - 2, "#5a564c");
    }
    for (const x of [8, 26]) { p.r(x, 0, 1, 15, "#8a7a5a"); p.r(x - 1, 13, 3, 1, "#6a5a3a"); }
    p.r(3, 9, 31, 1, "#8a7a5a");
  }),
  /**
   * A labour berth: a lean-to with an empty stone plinth where a labour golem
   * stands to be loaded and stood down. Two foot-hollows worn into the stone,
   * an iron tether ring, a chalk tally of loads on the board.
   */
  golemberth: (v, _a, M) => M(34, 40, (p, r) => {
    p.r(2, 37, 30, 3, "rgba(0,0,0,0.35)");
    for (const x of [1, 31]) { p.r(x, 6, 2, 32, WD.d); p.r(x, 6, 1, 32, WD.l); }
    for (let j = 0; j < 7; j++) p.r(0, j, 34, 1, j === 6 ? "#2e241c" : j % 2 ? "#4a3c30" : "#5a4a3c");
    p.r(0, 0, 34, 1, O);
    p.r(3, 7, 28, 22, "#1a1612");
    // the tally board
    p.o(18, 10, 11, 9, "#2a2a2a", O);
    for (let k = 0; k < 4 + (v % 3); k++) p.r(20 + k * 2, 12, 1, 4, "#c8c8c0");
    p.line(19, 15, 28, 12, "#c8c8c0");
    p.r(20, 17, 6, 1, "#9a9a92");
    // tether ring on a staple
    p.r(7, 14, 2, 2, IR.d); p.o(5, 16, 6, 6, IR.d, IR.m); p.p(7, 18, "#1a1612");
    // plinth with worn foot hollows; a few chips of red clay at its foot
    p.o(6, 28, 22, 9, "#7a7468", O); p.r(7, 29, 20, 1, "#9a9488");
    p.r(10, 31, 5, 3, "#4e4a42"); p.r(19, 31, 5, 3, "#4e4a42"); p.r(10, 31, 5, 1, "#3a3630"); p.r(19, 31, 5, 1, "#3a3630");
    for (let i = 0; i < 4; i++) p.p(6 + ((r() * 22) | 0), 37 + ((r() * 2) | 0), i & 1 ? "#8a3a2a" : "#a04a34");
  }),
  stonestack: (v, _a, M) => M(28, 22, (p) => {
    p.r(2, 19, 24, 3, "rgba(0,0,0,0.3)");
    for (let row = 0; row < 3; row++) for (let k = 0; k < 4 - (row === 2 && v % 2 ? 1 : 0); k++) {
      const x = 1 + k * 6 + (row & 1) * 3, y = 14 - row * 5;
      if (x > 22) continue;
      p.o(x, y, 6, 6, "#7a7880", O); p.r(x + 1, y + 1, 4, 1, "#9a98a0");
    }
    p.r(0, 19, 28, 2, WD.d); p.r(0, 19, 28, 1, WD.m);
  }),
  roadbarrier: (_v, _a, M) => M(48, 24, (p) => {
    p.r(2, 21, 44, 3, "rgba(0,0,0,0.3)");
    for (const x of [3, 43]) { p.o(x - 2, 6, 5, 16, WD.d, O); p.r(x - 1, 20, 3, 2, WD.o); }
    p.o(0, 8, 48, 5, "#d8ccb0", O); for (let x = 1; x < 47; x += 6) p.r(x, 9, 3, 3, "#8a2a2a");
    p.o(0, 15, 48, 3, WD.m, O);
    p.r(21, 2, 6, 6, IR.d); p.g(22, 3, 4, 4, "#ffb050"); p.g(23, 4, 2, 2, "#fff0b0"); p.r(23, 0, 2, 2, IR.d);
  }),
  hedge: (v, _a, M) => M(18, 20, (p, r) => {
    const pal = v % 2 ? ["#1a3226", "#284a34", "#386442", "#4e8456"] : ["#1e3a1c", "#2e5226", "#3e6a30", "#5a8a40"];
    p.r(1, 17, 16, 3, "rgba(0,0,0,0.3)");
    for (let y = 4; y < 18; y++) for (let x = 0; x < 18; x++) {
      if ((y < 6 && r() < 0.5) || (x < 1 || x > 16) && r() < 0.5) continue;
      const k = hash2(x >> 1, y >> 1, 400 + v);
      p.p(x, y, y < 7 ? pal[3] : k < 0.25 ? pal[0] : k < 0.6 ? pal[1] : pal[2]);
    }
    if (v % 3 === 2) for (let i = 0; i < 4; i++) p.p(2 + ((r() * 14) | 0), 6 + ((r() * 8) | 0), "#d8d0e8");
  }),
  fence: (_v, _a, M) => M(16, 14, (p) => {
    for (const x of [0, 13]) { p.r(x, 2, 3, 12, WD.d); p.r(x, 2, 1, 12, WD.l); p.p(x + 1, 1, WD.d); }
    p.r(0, 5, 16, 2, WD.m); p.r(0, 5, 16, 1, WD.l); p.r(0, 10, 16, 2, WD.m);
  }),
  fence_v: (_v, _a, M) => M(6, 26, (p) => {
    p.r(1, 0, 3, 26, WD.m); p.r(1, 0, 1, 26, WD.l); p.r(1, 2, 3, 2, WD.d); p.r(1, 13, 3, 2, WD.d);
    p.r(0, 22, 5, 4, WD.d);
  }),
  lowwall: (v, _a, M) => M(18, 14, (p, r) => {
    p.r(0, 11, 18, 3, "rgba(0,0,0,0.25)");
    for (let y = 2; y < 12; y += 4) for (let x = -((y >> 2) & 1) * 3; x < 18; x += 6) { const xa = Math.max(0, x); p.o(xa, y, Math.min(6, 18 - xa), 5, ["#6a6258", "#7a7064", "#5a544c"][(hash2(x, y + v, 401) * 3) | 0], "#2a2420"); }
    for (let x = 0; x < 18; x++) if (r() < 0.4) p.p(x, 2, MOSS[(r() * 4) | 0]);
  }),
  /** A stretch of the old town wall, standing in ruin where the town spilled past it. */
  oldwall: (v, _a, M) => M(18, 30, (p, r) => {
    p.r(1, 27, 16, 3, "rgba(0,0,0,0.3)");
    const top = 2 + (v % 3) * 4;
    p.r(2, top, 14, 6, "#4a443c");
    for (let y = top + 4; y < 28; y += 5) for (let x = 2 - ((y >> 2) & 1) * 3; x < 16; x += 7) { const xa = Math.max(2, x); p.o(xa, y, Math.min(7, 16 - xa), 6, ["#6a6258", "#7a7064", "#5a544c", "#847a6a"][(hash2(x, y, 402) * 4) | 0], "#2a2420"); }
    for (let x = 2; x < 16; x++) { p.p(x, top + ((r() * 3) | 0), MOSS[(r() * 4) | 0]); }
    let vx = 5 + (v % 2) * 6; for (let j = 0; j < 16; j++) { p.p(vx, top + 4 + j, "#2e3e1c"); if (j % 2) p.p(vx + 1, top + 4 + j, "#4e7a34"); if (r() < 0.2) vx += r() < 0.5 ? -1 : 1; }
    tufts(p, r, 0, 30, 18, 6);
  }),
  haybale: (_v, _a, M) => M(18, 14, (p, r) => {
    p.r(1, 11, 16, 3, "rgba(0,0,0,0.3)");
    p.o(0, 2, 18, 10, "#b49a5c", O); for (let i = 0; i < 30; i++) p.p(1 + ((r() * 16) | 0), 3 + ((r() * 8) | 0), r() < 0.5 ? "#8a7444" : "#c8b070");
    p.r(5, 2, 1, 10, "#6a5428"); p.r(12, 2, 1, 10, "#6a5428");
  }),
  woodpile: (_v, _a, M) => M(30, 18, (p) => {
    p.r(1, 15, 28, 3, "rgba(0,0,0,0.3)");
    for (let row = 0; row < 3; row++) for (let k = 0; k < 6 - row; k++) { const x = 1 + k * 5 + row * 2, y = 11 - row * 4; p.o(x, y, 5, 5, "#8a6a44", WD.o); p.p(x + 2, y + 2, "#6a4e30"); p.p(x + 1, y + 1, "#a08050"); }
  }),
  laundry: (v, _a, M) => M(44, 30, (p) => {
    for (const x of [1, 41]) { p.r(x, 2, 2, 28, WD.d); p.r(x, 2, 1, 28, WD.l); }
    p.line(2, 4, 21, 6, "#8a8070"); p.line(21, 6, 41, 4, "#8a8070");
    const items = [[6, 5, "#d8d0c0", 6, 9], [14, 6, cloth[v % 8], 5, 7], [24, 6, "#9ab0c8", 7, 10], [33, 5, cloth[(v + 3) % 8], 5, 8]] as [number, number, string, number, number][];
    for (const [x, y, c, w, h] of items) { p.r(x, y, w, h, c); p.r(x, y, w, 1, "#2a2420"); p.r(x + w - 1, y + 1, 1, h - 1, "rgba(0,0,0,0.25)"); }
  }),
  bridgerail: (v, _a, M) => M(66, 14, (p) => {
    p.r(0, 11, 66, 3, "rgba(0,0,0,0.3)");
    for (let x = 0; x < 66; x += 11) { p.o(x, 2, 11, 10, v ? "#8a8476" : "#9a9488", O); p.r(x + 1, 3, 9, 1, "#bab4a6"); p.r(x + 9, 4, 1, 7, "#5a564c"); }
    p.r(0, 1, 66, 2, "#aaa498"); p.r(0, 1, 66, 1, "#c8c2b4");
  }),
  plankrail: (_v, _a, M) => M(66, 12, (p) => {
    for (let x = 1; x < 66; x += 16) { p.r(x, 2, 3, 10, WD.d); p.r(x, 2, 1, 10, WD.l); }
    p.r(0, 3, 66, 2, WD.m); p.r(0, 3, 66, 1, WD.l);
  }),
  millwheel: (_v, _a, M) => M(22, 40, (p) => {
    p.r(9, 0, 4, 40, "#2a1e14");
    for (let k = 0; k < 9; k++) { const y = 2 + k * 4; p.o(1, y, 20, 4, WD.m, O); p.r(2, y + 1, 18, 1, WD.l); }
    p.o(8, 16, 6, 6, IR.d, O); p.r(9, 17, 4, 1, IR.l);
    for (let k = 0; k < 6; k++) p.g(3 + k * 3, 38, 2, 1, "#5a7a8a");
  }),
  steppingstone: (v, _a, M) => M(14, 10, (p, r) => { stoneBlob(p, 1 + (v & 1), 1, 11, 7, r); p.r(3, 2, 6, 1, "#8a8392"); p.r(2, 8, 10, 1, "#2a4a5a"); }),
  cabbages: (_v, _a, M) => M(16, 12, (p, r) => {
    for (let k = 0; k < 3; k++) { const x = 1 + k * 5, y = 3 + (k & 1) * 3; leaf(p, r, x + 2, y + 2, 2, ["#2e4a22", "#4a7a32", "#6a9a44", "#8aba5a"]); }
  }),
  coalheap: (_v, _a, M) => M(26, 14, (p, r) => {
    p.r(1, 11, 24, 3, "rgba(0,0,0,0.35)");
    for (let y = 2; y < 13; y++) for (let x = 0; x < 26; x++) { const d = ((x - 13) / 13) ** 2 + ((y - 12) / 10) ** 2; if (d > 1) continue; p.p(x, y, r() < 0.15 ? "#3a3a40" : r() < 0.5 ? "#141418" : "#22222a"); }
  }),
  planter: (v, _a, M) => M(14, 16, (p, r) => {
    p.o(1, 8, 12, 8, v ? "#7a4a2a" : S.m, O); p.r(2, 9, 10, 1, v ? "#9a6a40" : S.h);
    leaf(p, r, 7, 6, 5, ["#1e3a1c", "#2e5226", "#3e6a30", "#5a8a40"]);
    for (let i = 0; i < 4; i++) p.p(3 + ((r() * 8) | 0), 2 + ((r() * 6) | 0), ["#d04858", "#e8d060", "#d8d0e8"][i % 3]);
  }),
  gatetower: (v, _a, M) => M(64, 96, (p, r) => drawGateTower(p, r, v === 1)),
  // ================================================================ interiors: shared
  counter: (v, _a, M) => M(50, 22, (p, r) => counter(p, r, 50, v)),
  counter_s: (v, _a, M) => M(34, 22, (p, r) => counter(p, r, 34, v)),
  /** A window in a room's back wall: night outside (moonlit glass). */
  window_in: (v, _a, M) => M(16, 22, (p) => {
    p.o(1, 1, 14, 18, v === 2 ? "#d0c8b4" : WD.d, O);
    for (let j = 0; j < 14; j++) p.g(3, 3 + j, 10, 1, j < 5 ? "#3a4a6a" : j < 10 ? "#2a3654" : "#1e2840");
    p.g(10, 4, 2, 2, "#c8d4f0"); p.r(7, 3, 2, 14, v === 2 ? "#b8b0a0" : WD.d); p.r(3, 9, 10, 1, v === 2 ? "#b8b0a0" : WD.d);
    p.r(0, 19, 16, 3, v === 2 ? "#e0d8c8" : WD.m); p.r(0, 19, 16, 1, v === 2 ? "#f0e8d8" : WD.l);
    if (v === 1) { p.r(1, 1, 3, 18, CL.m); p.r(12, 1, 3, 18, CL.m); p.r(1, 1, 14, 2, CL.d); }
  }),
  painting: (v, _a, M) => M(18, 16, (p) => {
    p.o(0, 0, 18, 14, GD.d, O); p.r(1, 1, 16, 1, GD.l);
    const sky = ["#4a5a7a", "#6a4a3a", "#3a4a3a"][v % 3];
    p.r(2, 2, 14, 10, sky); p.r(2, 8, 14, 4, "#3a4a2a");
    if (v % 3 === 0) { p.r(8, 4, 3, 6, "#6a6a72"); p.r(7, 3, 5, 1, "#6a6a72"); p.p(9, 2, "#6a6a72"); } // the keep, as the painter imagined it
    else if (v % 3 === 1) { p.r(5, 5, 8, 6, "#c8a080"); p.r(6, 4, 6, 2, "#3a2a1a"); }
    else { p.r(4, 6, 3, 5, "#2a3a1a"); p.r(10, 5, 4, 6, "#2a3a1a"); }
  }),
  wallshelf: (v, _a, M) => M(28, 16, (p, r) => {
    p.r(0, 11, 28, 2, WD.m); p.r(0, 11, 28, 1, WD.l); p.r(3, 13, 2, 3, WD.d); p.r(23, 13, 2, 3, WD.d);
    for (let x = 1; x < 27; x += 4) {
      const k = (r() * 4) | 0, h = 4 + ((r() * 5) | 0);
      if (v === 1) { p.o(x, 11 - h, 3, h, ["#4a6a5a", "#6a4a3a", "#5a5a7a", "#7a6a3a"][k], O); p.p(x + 1, 11 - h, "#c8c0a0"); }
      else { p.o(x, 6, 4, 5, ["#7a4a2a", "#9a8a6a", "#5a3a2a", "#8a6a4a"][k], O); p.r(x + 1, 6, 2, 1, "#d8d0b8"); }
    }
  }),
  plant: (v, _a, M) => M(14, 24, (p, r) => {
    p.r(2, 21, 10, 3, "rgba(0,0,0,0.3)"); p.o(3, 15, 8, 8, v ? "#7a4a2a" : "#5a6a7a", O); p.r(4, 16, 6, 1, v ? "#9a6a40" : "#7a8a9a");
    leaf(p, r, 7, 9, 6, ["#1e3a1c", "#2e5226", "#3e6a30", "#5a8a40"]); leaf(p, r, 4, 6, 3, ["#1e3a1c", "#2e5226", "#3e6a30", "#5a8a40"]);
  }),
  doorframe: (v, _a, M) => M(20 + v * 16, 8, (p) => { const w = 20 + v * 16; p.r(0, 2, w, 6, "#2a1e14"); p.r(2, 3, w - 4, 4, "#5a4630"); for (let x = 3; x < w - 3; x += 3) p.r(x, 4, 1, 2, "#3a2a1a"); }),
  // ================================================================ the smithy
  smithforge: (_v, alt, M) => M(40, 46, (p, r) => {
    p.r(2, 42, 36, 4, "rgba(0,0,0,0.4)");
    // hood and flue into the wall
    p.o(10, 0, 20, 14, "#3a3430", O); for (let y = 2; y < 13; y += 3) p.r(11, y, 18, 1, "#2a2622");
    p.o(4, 12, 32, 8, "#5a544c", O); p.r(5, 13, 30, 1, "#7a7468");
    // the hearth: firebrick, a bed of coals
    p.o(0, 20, 40, 24, "#6a5a4c", O); p.r(1, 21, 38, 2, "#8a7a68");
    for (let y = 24; y < 42; y += 4) for (let x = 2 + ((y >> 2) & 1) * 3; x < 37; x += 6) p.r(x, y, 5, 3, r() < 0.5 ? "#7a4a3a" : "#6a3e30");
    p.r(6, 24, 28, 12, "#1a0e08");
    if (alt) {
      for (let y = 30; y < 36; y++) for (let x = 7; x < 33; x++) p.g(x, y, 1, 1, ["#ff5a10", "#ff9a30", "#c43a08", "#7a2006", "#ffd060"][(hash2(x, y, 403) * 5) | 0]);
      p.g(12, 27, 16, 3, "#5a1806");
    } else for (let x = 7; x < 33; x++) p.r(x, 33, 1, 3, r() < 0.5 ? "#2a2626" : "#3a3634");
    p.r(1, 40, 38, 3, "#3a3430");
    // tongs and a poker leaning
    p.r(36, 22, 1, 18, IR.l); p.r(38, 24, 1, 16, IR.m);
  }),
  bellows: (_v, _a, M) => M(22, 20, (p) => {
    p.r(1, 17, 20, 3, "rgba(0,0,0,0.3)");
    p.o(2, 6, 16, 10, "#5a3e28", O); for (let x = 4; x < 16; x += 3) p.r(x, 7, 1, 8, "#3a2818");
    p.o(1, 4, 18, 3, WD.m, O); p.o(1, 15, 18, 3, WD.m, O); p.r(18, 9, 4, 3, IR.d);
    // a long lever with a worn foot-plate: pumped by whoever (or whatever) stands at it all day
    p.r(0, 0, 2, 6, WD.d); p.r(0, 0, 10, 2, WD.d); p.r(7, 0, 4, 2, IR.m);
  }),
  quench: (_v, _a, M) => M(30, 16, (p) => {
    p.r(1, 13, 28, 3, "rgba(0,0,0,0.3)");
    p.o(0, 3, 30, 11, WD.m, O); p.r(1, 4, 28, 1, WD.l); p.r(0, 7, 30, 1, IR.d); p.r(0, 11, 30, 1, IR.d);
    p.r(2, 5, 26, 2, "#1a2a32"); p.r(4, 5, 6, 1, "#3a5a6a"); p.r(18, 6, 5, 1, "#2a4a5a");
    p.r(24, 0, 1, 6, IR.l); p.r(26, 1, 1, 5, IR.m);
  }),
  grindstone: (_v, _a, M) => M(18, 20, (p) => {
    p.r(1, 17, 16, 3, "rgba(0,0,0,0.3)");
    p.r(2, 10, 2, 9, WD.d); p.r(14, 10, 2, 9, WD.d); p.r(1, 16, 16, 2, WD.m);
    for (let y = 0; y < 14; y++) { const w = Math.round(Math.sqrt(1 - ((y - 7) / 7) ** 2) * 4); p.r(9 - w, y, w * 2, 1, y < 4 ? "#9a9488" : "#7a7468"); }
    p.r(4, 7, 10, 1, IR.d); p.r(15, 5, 3, 2, IR.m);
  }),
  toolrack: (_v, _a, M) => M(32, 22, (p) => {
    p.o(0, 2, 32, 4, WD.m, O); p.r(1, 3, 30, 1, WD.l);
    const tools: [number, number, string][] = [[3, 12, IR.l], [8, 14, IR.m], [13, 10, IR.l], [18, 16, IR.m], [23, 12, IR.l], [28, 13, IR.m]];
    for (const [x, len, c] of tools) { p.r(x, 5, 1, len, WD.l); p.r(x - 1, 5 + len, 3, 2, c); p.p(x, 5 + len + 2, IR.d); }
    p.r(12, 6, 4, 3, IR.d); p.r(22, 6, 1, 6, IR.l);
  }),
  horseshoes: (_v, _a, M) => M(24, 16, (p) => {
    p.r(0, 2, 24, 2, WD.d);
    for (let k = 0; k < 5; k++) { const x = 1 + k * 5; p.r(x, 5, 1, 5, IR.l); p.r(x + 3, 5, 1, 5, IR.m); p.r(x, 10, 4, 1, IR.m); p.p(x + 1, 4, IR.d); }
  }),
  coalbin: (_v, _a, M) => M(22, 16, (p, r) => {
    p.r(1, 13, 20, 3, "rgba(0,0,0,0.3)"); p.o(0, 3, 22, 11, WD.d, O); p.r(1, 4, 20, 1, WD.m);
    for (let x = 1; x < 21; x++) p.r(x, 2 + ((r() * 3) | 0), 1, 3, r() < 0.3 ? "#3a3a40" : "#16161a");
    p.r(15, 0, 2, 8, WD.l); p.r(13, 0, 6, 2, IR.m);
  }),
  // ================================================================ the armory
  /** Full plate on a stand, polished to a mirror (the armory's showpiece). */
  plate_stand: (v, _a, M) => M(16, 32, (p) => {
    p.r(2, 29, 12, 3, "rgba(0,0,0,0.3)"); p.o(3, 28, 10, 3, WD.d, O);
    const m = v % 2 ? ["#5a6470", "#8a96a4", "#c8d2dc"] : ["#6a5a3a", "#a08a54", "#e0c878"];
    p.o(5, 18, 3, 11, m[0], O); p.o(8, 18, 3, 11, m[0], O);
    p.o(3, 8, 10, 11, m[1], O); p.r(4, 9, 3, 8, m[2]); p.r(4, 13, 8, 1, m[0]);
    p.o(1, 8, 3, 7, m[1], O); p.o(12, 8, 3, 7, m[1], O);
    p.o(4, 1, 8, 8, m[1], O); p.r(5, 2, 2, 5, m[2]); p.r(5, 4, 6, 1, "#101418"); p.r(7, 0, 2, 2, CL.m);
  }),
  shieldwall: (_v, _a, M) => M(40, 26, (p) => {
    const sh = (x: number, y: number, a: string, b: string, k: number) => {
      for (let j = 0; j < 14; j++) { const w = j < 8 ? 10 : 10 - (j - 7) * 1.4; p.r(x + 5 - Math.round(w / 2), y + j, Math.round(w), 1, j === 0 ? IR.l : (k + j) % 2 ? a : a); }
      p.r(x + 4, y + 1, 2, 11, b); p.r(x + 1, y + 4, 8, 2, b); p.p(x + 5, y + 4, GD.l);
    };
    p.r(0, 2, 40, 2, WD.d);
    sh(1, 4, CL.m, GD.m, 0); sh(15, 6, "#2a3a6a", "#d0d4d8", 1); sh(29, 4, "#3a5a3a", GD.d, 0);
    p.line(4, 2, 36, 24, IR.l); p.line(36, 2, 4, 24, IR.l);
  }),
  swordcase: (_v, _a, M) => M(32, 24, (p) => {
    p.r(1, 21, 30, 3, "rgba(0,0,0,0.3)");
    p.o(0, 8, 32, 14, "#4a2e1a", O); p.r(1, 9, 30, 1, "#6a4a2a"); p.r(3, 18, 26, 2, "#3a2414");
    p.o(1, 1, 30, 9, "#2a3a4a", O);
    for (let k = 0; k < 3; k++) { const y = 3 + k * 2; p.g(4, y, 18, 1, "#d8e4f0"); p.r(22, y - 1, 2, 3, GD.m); p.r(24, y, 4, 1, "#5a3a24"); }
    p.g(2, 2, 6, 1, "#e8f4ff"); p.g(2, 2, 1, 4, "#a8c8e0");
  }),
  strongbox: (_v, _a, M) => M(18, 16, (p) => {
    p.r(1, 13, 16, 3, "rgba(0,0,0,0.3)");
    p.o(0, 3, 18, 11, IR.d, O); p.r(1, 4, 16, 1, IR.l); p.r(0, 8, 18, 1, IR.m);
    for (const x of [3, 14]) p.r(x, 3, 1, 11, IR.m);
    p.o(7, 6, 5, 5, GD.m, "#3a2a08"); p.p(9, 8, "#000");
  }),
  // ================================================================ the jeweler
  /** A glass display case on turned legs; gems laid on velvet, catching the rune light. */
  glasscase: (v, _a, M) => M(30, 22, (p) => {
    p.r(1, 19, 28, 3, "rgba(0,0,0,0.3)");
    for (const x of [2, 26]) p.r(x, 14, 2, 6, "#3a2414");
    p.o(0, 10, 30, 5, "#5a3420", O); p.r(1, 11, 28, 1, GD.d);
    p.r(2, 4, 26, 7, CL.d);
    const gems = ["#ff5a7a", "#60d0f0", "#70f0a0", "#f0d060", "#c080ff", "#ffffff"];
    for (let k = 0; k < 7; k++) { const x = 3 + k * 3 + (v % 2), y = 6 + (k % 2) * 2; p.g(x, y, 2, 2, gems[(k + v) % 6]); p.g(x, y, 1, 1, "#ffffff"); }
    p.r(4, 8, 4, 1, GD.l); p.r(20, 7, 5, 1, GD.l);
    p.o(0, 1, 30, 10, "rgba(0,0,0,0)", O); p.g(1, 2, 28, 1, "#a8c8d8"); p.g(1, 2, 1, 8, "#88a8c0");
  }),
  vaultdoor: (_v, _a, M) => M(28, 30, (p) => {
    p.o(0, 0, 28, 30, "#3a3a42", O);
    for (let y = 2; y < 28; y++) for (let x = 2; x < 26; x++) { const d = Math.hypot(x - 13.5, y - 15) / 12; if (d > 1) continue; p.p(x, y, d > 0.85 ? "#6a6a74" : d > 0.8 ? O : (x + y) % 6 === 0 ? "#5a5a64" : "#4a4a54"); }
    for (let k = 0; k < 6; k++) { const a = (k / 6) * Math.PI * 2; p.line(14, 15, 14 + Math.cos(a) * 6, 15 + Math.sin(a) * 6, GD.m); }
    p.o(11, 12, 6, 6, GD.d, O); p.p(13, 14, GD.l);
    for (const [x, y] of [[4, 4], [23, 4], [4, 25], [23, 25]]) p.p(x, y, GD.l);
  }),
  jewelbench: (_v, _a, M) => M(32, 26, (p) => {
    p.r(1, 23, 30, 3, "rgba(0,0,0,0.3)");
    for (const x of [2, 28]) p.r(x, 15, 2, 9, WD.o);
    p.o(0, 10, 32, 6, "#6a4a2a", O); p.r(1, 11, 30, 1, "#8a6a40");
    p.r(1, 16, 30, 2, "#3a2414"); p.r(12, 16, 8, 2, "#4a2e1a");
    // balance scales, a loupe, a tray of stones under a tall candle
    p.r(6, 2, 1, 9, GD.m); p.r(2, 2, 9, 1, GD.m); p.r(1, 4, 3, 1, GD.l); p.r(9, 4, 3, 1, GD.l); p.p(2, 3, GD.d); p.p(10, 3, GD.d);
    p.o(15, 8, 8, 3, "#2a1a2a", O); p.g(16, 9, 1, 1, "#ff5a7a"); p.g(18, 9, 1, 1, "#60d0f0"); p.g(20, 9, 1, 1, "#f0d060");
    p.o(25, 7, 4, 4, IR.l, O); p.g(26, 8, 2, 2, "#c8f0ff");
  }),
  curtain: (v, _a, M) => M(18, 32, (p) => {
    p.r(0, 0, 18, 2, GD.d); p.p(0, 0, GD.l); p.p(17, 0, GD.l);
    const c = v ? ["#2a3a5a", "#3a4a6a", "#1e2a44"] : [CL.d, CL.m, CL.l];
    for (let x = 1; x < 17; x++) for (let y = 2; y < 31; y++) p.p(x, y, x % 4 === 0 ? c[0] : x % 4 === 1 ? c[2] : c[1]);
    p.r(1, 18, 16, 2, GD.m);
  }),
  // ================================================================ the tailor
  clothbolts: (v, _a, M) => M(34, 36, (p) => {
    p.r(1, 33, 32, 3, "rgba(0,0,0,0.3)");
    p.o(0, 0, 34, 34, WD.d, O); p.r(1, 1, 32, 2, WD.l);
    for (let s = 0; s < 3; s++) {
      const y = 4 + s * 10; p.r(1, y, 32, 9, "#140c08");
      for (let k = 0; k < 6; k++) { const c = cloth[(k + s * 3 + v) % 8]; p.r(2 + k * 5, y + 2, 5, 7, c); p.r(2 + k * 5, y + 2, 5, 1, "#ffffff22"); p.p(4 + k * 5, y + 5, "#00000040"); p.r(2 + k * 5 + 4, y + 2, 1, 7, "#00000030"); }
      p.r(1, y + 9, 32, 1, WD.m);
    }
  }),
  dressform: (v, _a, M) => M(12, 30, (p) => {
    p.r(2, 27, 8, 3, "rgba(0,0,0,0.3)");
    p.r(5, 20, 2, 8, WD.d); p.r(3, 27, 6, 1, WD.d);
    const c = cloth[v % 8];
    p.o(2, 6, 8, 15, c, O); p.r(3, 7, 2, 12, "#ffffff30"); p.r(2, 12, 8, 1, "#00000040");
    p.r(4, 21, 4, 1, c); p.o(4, 2, 4, 5, "#c8b898", O);
    if (v % 3 === 0) { p.r(3, 9, 6, 1, GD.m); }
    if (v % 3 === 1) { p.line(3, 7, 8, 14, "#d8d0c0"); }
  }),
  cuttingtable: (_v, _a, M) => M(42, 22, (p) => {
    p.r(1, 19, 40, 3, "rgba(0,0,0,0.3)");
    for (const x of [3, 37]) p.r(x, 12, 2, 9, WD.o);
    p.o(0, 2, 42, 11, WD.l, O); p.r(1, 3, 40, 1, WD.h);
    // a length of cloth with a chalked pattern, shears, a measuring stick, pins
    p.r(4, 4, 22, 7, "#2a5a6a"); p.r(4, 4, 22, 1, "#3a7a8a"); p.line(8, 5, 20, 9, "#d8d0c0"); p.line(8, 9, 14, 5, "#d8d0c0");
    p.r(28, 5, 2, 5, IR.l); p.r(31, 5, 2, 5, IR.l); p.r(28, 9, 5, 1, IR.m);
    p.r(4, 11, 34, 1, GD.d); for (let x = 5; x < 37; x += 3) p.p(x, 11, GD.l);
    p.r(35, 4, 3, 3, CL.m); p.p(36, 4, "#e0e0e0");
  }),
  spinwheel: (_v, _a, M) => M(20, 26, (p) => {
    p.r(1, 23, 18, 3, "rgba(0,0,0,0.3)");
    for (let a = 0; a < 16; a++) { const t = (a / 16) * Math.PI * 2; p.p(Math.round(9 + Math.cos(t) * 7), Math.round(9 + Math.sin(t) * 7), WD.m); }
    for (let a = 0; a < 6; a++) { const t = (a / 6) * Math.PI * 2; p.line(9, 9, 9 + Math.cos(t) * 6, 9 + Math.sin(t) * 6, WD.d); }
    p.r(8, 16, 2, 8, WD.d); p.r(2, 21, 16, 2, WD.m); p.r(15, 12, 2, 10, WD.d); p.r(15, 11, 4, 2, "#e8dcc0");
  }),
  loom: (_v, _a, M) => M(34, 30, (p) => {
    p.r(1, 27, 32, 3, "rgba(0,0,0,0.3)");
    for (const x of [1, 31]) { p.r(x, 2, 2, 26, WD.d); p.r(x, 2, 1, 26, WD.l); }
    p.r(0, 2, 34, 2, WD.m); p.r(0, 20, 34, 2, WD.m);
    for (let x = 4; x < 30; x++) p.r(x, 4, 1, 9, x % 2 ? "#d8d0c0" : "#c8bca0");
    for (let y = 13; y < 20; y++) for (let x = 4; x < 30; x++) p.p(x, y, (x + y) % 4 < 2 ? "#8a2a3a" : "#c8a040");
    p.r(3, 12, 28, 1, WD.l); p.r(4, 24, 26, 3, WD.d);
  }),
  mirror: (_v, _a, M) => M(14, 30, (p) => {
    p.o(0, 0, 14, 30, GD.d, O); p.r(1, 1, 12, 1, GD.l);
    for (let y = 2; y < 28; y++) p.g(2, y, 10, 1, y < 10 ? "#7a8aa0" : "#5a6a80");
    p.g(3, 3, 1, 10, "#c8d8f0"); p.g(5, 3, 1, 4, "#a8b8d0");
  }),
  // ================================================================ the tavern
  bighearth: (_v, alt, M) => M(44, 40, (p, r) => {
    p.r(2, 36, 40, 4, "rgba(0,0,0,0.4)");
    p.o(0, 4, 44, 34, S.m, O);
    for (let j = 0; j < 8; j++) for (let i = 0; i < 6; i++) { const bx = 1 + i * 7 + (j % 2 ? 3 : 0), by = 5 + j * 4; if (bx < 42) p.r(bx, by, Math.min(6, 43 - bx), 3, r() < 0.5 ? S.l : S.m); }
    p.o(0, 0, 44, 6, WD.m, O); p.r(1, 1, 42, 1, WD.l); // the mantel
    for (const x of [6, 18, 30]) { p.r(x, -0 + 0, 4, 0, O); p.o(x, 0, 5, 4, ["#7a4a2a", "#8a8a8a", "#6a6a3a"][(x / 12) | 0], O); }
    p.r(9, 14, 26, 22, "#080606"); p.r(10, 13, 24, 1, "#080606");
    p.r(10, 30, 24, 5, "#2a2624");
    p.r(12, 28, 10, 3, WD.o); p.r(18, 27, 12, 3, "#1e140c");
    if (alt) { for (let y = 27; y < 32; y++) for (let x = 12; x < 32; x++) if (hash2(x, y, 404) < 0.5) p.g(x, y, 1, 1, ["#ff5a10", "#ff9a30", "#c43a08", "#ffd060"][(hash2(x, y, 405) * 4) | 0]); }
    // a pot on a crane over the fire
    p.r(32, 14, 1, 10, IR.d); p.r(24, 14, 9, 1, IR.d); p.r(25, 15, 1, 6, IR.d); p.o(21, 20, 8, 6, "#2a2a2a", O); p.r(22, 21, 6, 1, "#4a4a4a");
    p.r(1, 36, 42, 2, S.d);
  }),
  bar: (_v, _a, M) => M(66, 24, (p, r) => {
    p.r(2, 21, 62, 3, "rgba(0,0,0,0.35)");
    p.o(0, 8, 66, 14, "#4a2e1a", O);
    for (let x = 4; x < 62; x += 10) { p.r(x, 11, 8, 8, "#3a2414"); p.r(x, 11, 8, 1, "#5a3a22"); }
    p.o(0, 4, 66, 5, "#7a5634", O); p.r(1, 5, 64, 1, "#a07a4a");
    // taps, tankards, a dish of coins, a slop cloth
    for (const x of [8, 14, 20]) { p.r(x, 0, 2, 5, GD.m); p.p(x, 0, GD.l); p.r(x - 1, 4, 4, 1, GD.d); }
    for (let k = 0; k < 4; k++) { const x = 30 + k * 6; p.o(x, 1, 4, 4, k % 2 ? "#8a8a8a" : "#6a4a2a", O); p.r(x + 4, 2, 1, 2, "#5a5a5a"); if (r() < 0.7) p.r(x + 1, 1, 2, 1, "#e8e0c0"); }
    p.r(55, 3, 6, 2, "#d8d0b8"); p.r(56, 2, 3, 1, GD.l);
  }),
  kegrack: (_v, _a, M) => M(42, 30, (p) => {
    p.r(1, 27, 40, 3, "rgba(0,0,0,0.3)");
    p.r(0, 14, 42, 2, WD.d); p.r(0, 27, 42, 2, WD.d);
    for (let row = 0; row < 2; row++) for (let k = 0; k < 3; k++) {
      const x = 2 + k * 13, y = 2 + row * 13;
      p.o(x, y, 12, 12, WD.m, O); p.r(x + 1, y + 1, 10, 1, WD.l);
      p.r(x + 3, y, 1, 12, IR.m); p.r(x + 8, y, 1, 12, IR.m);
      p.o(x + 4, y + 4, 4, 4, "#8a6a44", WD.o); p.r(x + 5, y + 6, 2, 3, IR.d);
    }
  }),
  bottleshelf: (_v, _a, M) => M(36, 26, (p, r) => {
    for (const y of [10, 22]) { p.r(0, y, 36, 2, WD.m); p.r(0, y, 36, 1, WD.l); }
    for (const y of [10, 22]) for (let x = 1; x < 35; x += 3) {
      if (r() < 0.15) continue;
      const h = 5 + ((r() * 4) | 0), c = ["#2a5a2a", "#5a2a1a", "#3a2a4a", "#6a5a2a", "#1a3a3a"][(r() * 5) | 0];
      p.r(x, y - h, 2, h, c); p.r(x, y - h - 2, 1, 2, c); p.p(x, y - h + 1, "#ffffff40");
    }
  }),
  roundtable: (v, _a, M) => M(24, 20, (p, r) => {
    p.r(3, 17, 18, 3, "rgba(0,0,0,0.3)");
    p.r(10, 9, 4, 9, WD.o); p.r(7, 17, 10, 1, WD.d);
    for (let y = 0; y < 10; y++) { const w = Math.round(Math.sqrt(1 - ((y - 4.5) / 5) ** 2) * 12); p.r(12 - w, y, w * 2, 1, y === 0 ? O : y < 3 ? WD.h : y > 7 ? WD.d : WD.l); }
    if (v % 3 !== 2) { p.o(6, 2, 4, 4, "#6a4a2a", O); p.r(7, 2, 2, 1, "#e8e0c0"); }
    if (v % 2) { p.o(14, 3, 4, 4, "#8a8a8a", O); p.r(15, 3, 2, 1, "#d8a040"); }
    if (v % 3 === 0) { p.r(11, 4, 4, 2, "#c8a870"); p.p(12, 4, "#e0c890"); void r; }
  }),
  stool: (_v, _a, M) => M(10, 10, (p) => {
    p.r(1, 8, 8, 2, "rgba(0,0,0,0.3)"); p.r(2, 4, 1, 6, WD.o); p.r(7, 4, 1, 6, WD.o);
    p.o(0, 1, 10, 4, WD.l, O); p.r(1, 2, 8, 1, WD.h);
  }),
  stairs: (_v, _a, M) => M(30, 44, (p) => {
    p.r(1, 40, 28, 4, "rgba(0,0,0,0.35)");
    for (let k = 0; k < 9; k++) { const y = 38 - k * 4; p.o(2, y, 26, 5, WD.l, O); p.r(3, y + 1, 24, 1, WD.h); p.r(3, y + 3, 24, 1, WD.d); }
    p.r(0, 2, 2, 41, WD.d); p.r(28, 2, 2, 41, WD.d); p.r(0, 2, 2, 1, WD.l);
    p.r(0, 0, 30, 2, "#0a0806");
  }),
  // ================================================================ the guild
  trophyhead: (v, _a, M) => M(26, 24, (p) => {
    p.o(7, 2, 12, 14, WD.m, O); p.r(8, 3, 10, 1, WD.l);
    if (v % 2 === 0) {
      // a wyvern skull, horned
      p.o(6, 6, 14, 9, "#c8c0a8", O); p.r(7, 7, 12, 1, "#e8e0c8"); p.r(9, 9, 2, 2, "#1a1410"); p.r(15, 9, 2, 2, "#1a1410");
      p.r(8, 14, 10, 3, "#b0a890"); for (let x = 9; x < 17; x += 2) p.p(x, 17, "#e8e0c8");
      p.line(6, 7, 1, 1, "#9a9078"); p.line(19, 7, 24, 1, "#9a9078");
    } else {
      // a dire boar
      p.o(6, 6, 14, 12, "#4a3a2a", O); p.r(7, 7, 12, 2, "#6a5444"); p.p(9, 10, "#ff4020"); p.p(16, 10, "#ff4020");
      p.o(9, 13, 8, 5, "#7a5a4a", O); p.r(7, 15, 2, 4, "#e8e0c8"); p.r(17, 15, 2, 4, "#e8e0c8");
    }
  }),
  /** The quest board: notices pinned three deep, a red-wax guild seal on the urgent ones. */
  questboard: (_v, _a, M) => M(44, 30, (p, r) => {
    p.o(0, 0, 44, 28, WD.d, O); p.r(1, 1, 42, 2, WD.l);
    p.r(2, 4, 40, 22, "#5a4630");
    for (let k = 0; k < 14; k++) {
      const x = 3 + ((r() * 34) | 0), y = 5 + ((r() * 15) | 0), w = 5 + ((r() * 3) | 0), h = 6 + ((r() * 2) | 0);
      p.r(x, y, w, h, ["#d8d0b8", "#c8c0a0", "#e0d8c0", "#b8a888"][k % 4]); p.r(x + 1, y + 2, w - 2, 1, "#6a604c"); p.r(x + 1, y + 4, w - 3, 1, "#8a806c");
      p.p(x + (w >> 1), y, k % 4 === 0 ? CL.l : IR.l); if (k % 5 === 0) p.r(x + w - 2, y + h - 2, 2, 2, CL.m);
    }
    p.r(14, -0, 16, 0, O); p.o(16, 26, 12, 4, GD.d, O); p.r(17, 27, 10, 1, GD.l);
  }),
  guildbanner: (v, _a, M) => M(16, 32, (p) => {
    p.r(0, 1, 16, 1, IR.l); p.p(0, 0, GD.l); p.p(15, 0, GD.l);
    const c = v % 2 ? ["#1e2a4a", "#2a3a6a", "#3a4a7a"] : ["#4a1418", "#6e1f24", "#8e3036"];
    for (let y = 2; y < 30; y++) for (let x = 2; x < 14; x++) { if (y > 25 && Math.abs(x - 7.5) < (y - 25) * 1.4) continue; p.p(x, y, x === 2 || x === 13 ? GD.d : x === 3 || x === 12 ? c[2] : c[1]); }
    // the guild's mark: a sword crossed with a compass
    p.line(5, 18, 11, 8, "#d0d4d8"); p.p(10, 9, GD.l); p.r(4, 17, 3, 1, GD.m);
    for (let a = 0; a < 12; a++) { const t = (a / 12) * Math.PI * 2; p.p(Math.round(8 + Math.cos(t) * 3), Math.round(13 + Math.sin(t) * 3), GD.l); }
  }),
  ledgerdesk: (_v, _a, M) => M(32, 22, (p) => {
    p.r(1, 19, 30, 3, "rgba(0,0,0,0.3)");
    p.o(0, 6, 32, 14, "#4a2e1a", O); p.r(1, 7, 30, 1, "#6a4a2a"); p.r(3, 12, 10, 6, "#3a2414"); p.r(19, 12, 10, 6, "#3a2414"); p.p(8, 15, GD.l); p.p(24, 15, GD.l);
    p.r(4, 2, 12, 5, "#d8d0b8"); p.r(10, 2, 1, 5, "#8a826a"); for (let y = 3; y < 7; y += 2) { p.r(5, y, 4, 1, "#6a604c"); p.r(11, y, 4, 1, "#6a604c"); }
    p.r(20, 2, 2, 5, "#1a1a2a"); p.line(23, 1, 26, 6, "#e8e0d0");
  }),
};

function counter(p: Pen, r: Rng, w: number, v: number) {
  // v: 0 plain oak (smith, tavern), 1 polished with a brass rail (armory, guild), 2 glass-topped (jeweler), 3 pale wood (tailor)
  const top = v === 1 ? ["#5a3420", "#7a4a2a", "#9a6a3a"] : v === 3 ? ["#7a5a3a", "#9a7a50", "#b89a6a"] : ["#4a2e1a", WD.l, WD.h];
  p.r(1, 19, w - 2, 3, "rgba(0,0,0,0.35)");
  p.o(0, 8, w, 13, v === 2 ? "#3a2030" : WD.m, O);
  for (let x = 3; x < w - 6; x += 9) { p.r(x, 11, 7, 7, v === 2 ? "#2a1424" : WD.d); p.r(x, 11, 7, 1, v === 2 ? "#4a2a3a" : WD.l); }
  if (v === 2) {
    p.o(0, 1, w, 8, "#1a2a3a", O); p.g(1, 2, w - 2, 1, "#a8c8d8");
    for (let k = 0; k < (w - 6) / 4; k++) p.g(3 + k * 4, 5, 2, 2, ["#ff5a7a", "#60d0f0", "#70f0a0", "#f0d060", "#ffffff"][k % 5]);
  } else {
    p.o(0, 4, w, 5, top[1], O); p.r(1, 5, w - 2, 1, top[2]);
    if (v === 1) { p.r(0, 18, w, 1, GD.m); p.r(0, 18, w, 1, GD.l); }
    if (v === 0 && r() < 2) { p.r(5, 1, 6, 4, "#8a7a5a"); p.r(6, 2, 4, 1, "#a89a7a"); }
    if (v === 3) { p.r(w - 12, 2, 8, 3, cloth[4]); p.r(4, 3, 6, 2, "#d8d0b8"); }
  }
}

/** Building sprites: one kind per town building, drawn from its data row. */
for (const b of TOWN_BUILDINGS) {
  const { w, h } = bldSize(b);
  TOWN_PROP_ART[`bld.${b.id}`] = () => makeSprite(w, h, Math.floor(w / 2), h, 7000 + b.tx * 31 + b.ty, (p, r) => drawBuilding(p, r, b));
}
