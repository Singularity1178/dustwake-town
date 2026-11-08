// Westerford, the market town west of the buried keep (see content/town.ts for
// its history and layout data). Pure, deterministic builder (no DOM): fixed
// seed, stable prop ids (kind@tx,ty; buildings bld.<id>@...).
//
// What the builder lays down, in order: wild edges (thicket, broken only by the
// old keep road to the east and the closed Auric Road north), meadow ground,
// the millstream, the streets (setts where the lamps are, cobbles and dirt
// where they are not), the buildings' footprints (BUILDING tiles, one walkable
// door notch each), then the props by quarter, then greenery in the yards and
// gardens, then decals. Streets and plazas never get anything blocking beyond
// the authored street furniture, so NPC pathing later can use them as they are.
import { mulberry, hash2 } from "./core/rng";
import { TS, T, FS } from "./content/tiles";
import { propDef } from "./content/props";
import {
  TOWN_W as W, TOWN_H as H, TOWN_BUILDINGS, frontRow, HIGH_STREET, SQUARE, LANTERN_ROW, NORTH_LANE, LOW_STREET, AURIC_ROAD, OLD_GATE, STREAM, portalById,
} from "./content/town";
import { vnoise } from "./surface";
import type { AreaData, DecalDef, LightDef, PropDef } from "./map";

const TOWN_SEED = 4417;
/** Night ambient, the surface's: the town's look is its lamps. */
export const TOWN_AMBIENT: [number, number, number] = [0.3, 0.3, 0.42];

export function buildTown(): AreaData {
  const rng = mulberry(TOWN_SEED);
  const n = W * H;
  const grid = new Uint8Array(n).fill(T.FLOOR);
  const style = new Uint8Array(n).fill(FS.GRASS);
  const tvar = new Uint8Array(n);
  /** Tiles where nothing blocking may be scattered (streets, plazas, door aprons). */
  const street = new Uint8Array(n);
  const inb = (x: number, y: number) => x >= 0 && y >= 0 && x < W && y < H;
  const set = (x: number, y: number, t: number, s?: number) => { if (!inb(x, y)) return; grid[y * W + x] = t; if (s !== undefined) style[y * W + x] = s; };
  const paint = (x0: number, y0: number, x1: number, y1: number, s: number | ((x: number, y: number) => number), isStreet = true) => {
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (inb(x, y)) {
      grid[y * W + x] = T.FLOOR; style[y * W + x] = typeof s === "number" ? s : s(x, y); if (isStreet) street[y * W + x] = 1;
    }
  };

  // ---- ground: meadow with moss and bare patches; the wild closes every edge
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = y * W + x, e = Math.min(x, y, W - 1 - x, H - 1 - y);
    const nz = vnoise(x, y, 4, 501), patch = vnoise(x, y, 7, 502);
    style[i] = patch > 0.7 ? FS.MOSS : nz > 0.8 ? FS.DIRT : FS.GRASS;
    if (e < 2 + Math.floor(vnoise(x, y, 5, 503) * 3)) grid[i] = T.THICKET;
  }
  // ---- the millstream: meanders in the wild, straightened through the town by the old stone banks
  const streamOff = (y: number) => (y > 34 && y < 66 ? 0 : -Math.round(Math.abs(Math.sin(y * 0.17)) * 1.6));
  for (let y = 0; y < H; y++) for (let x = STREAM.x0 + streamOff(y); x <= STREAM.x1 + streamOff(y); x++) set(x, y, T.WATER);
  for (let y = 0; y < H; y++) for (const x of [STREAM.x0 + streamOff(y) - 1, STREAM.x1 + streamOff(y) + 1]) if (inb(x, y) && grid[y * W + x] === T.FLOOR) style[y * W + x] = y > 34 && y < 66 ? FS.EARTH : FS.MUD;

  // ---- streets. Setts mark where the money (and the lamps) are; cobbles and dirt elsewhere.
  const cobbleDirt = (x: number, y: number) => (vnoise(x, y, 3, 504) > 0.62 ? FS.DIRT : FS.COBBLE);
  const dirtEarth = (x: number, y: number) => (vnoise(x, y, 3, 505) > 0.55 ? FS.EARTH : FS.DIRT);
  // the west road (past the mill), the bridge, the lamplit High Street, the gate, then the old keep road
  paint(2, HIGH_STREET.y0, STREAM.x0 - 1, HIGH_STREET.y1, dirtEarth);
  paint(STREAM.x0 - 1, HIGH_STREET.y0, STREAM.x1 + 1, HIGH_STREET.y1, FS.SETTS);
  paint(STREAM.x1 + 1, HIGH_STREET.y0, OLD_GATE.x1, HIGH_STREET.y1, FS.SETTS);
  paint(OLD_GATE.x1 + 1, HIGH_STREET.y0, 88, HIGH_STREET.y1, cobbleDirt);
  paint(89, HIGH_STREET.y0, W - 1, HIGH_STREET.y1, dirtEarth);
  paint(SQUARE.x0, SQUARE.y0, SQUARE.x1, SQUARE.y1, FS.SETTS);
  // Lantern Row runs east as far as the tailor's door, then plain cobbles
  paint(SQUARE.x1 + 1, LANTERN_ROW.y0, 70, LANTERN_ROW.y1, FS.SETTS);
  paint(71, LANTERN_ROW.y0, 81, LANTERN_ROW.y1, cobbleDirt);
  paint(16, LANTERN_ROW.y0, SQUARE.x0 - 1, LANTERN_ROW.y1, cobbleDirt); // Tanner's Row
  paint(16, NORTH_LANE.y0, 81, NORTH_LANE.y1, cobbleDirt);
  paint(AURIC_ROAD.x0, 0, AURIC_ROAD.x1, SQUARE.y0 - 1, (_x, y) => (y > 20 ? FS.SETTS : FS.COBBLE));
  paint(16, NORTH_LANE.y0, 17, LOW_STREET.y1, dirtEarth); // Bank Walk, along the stream
  paint(80, NORTH_LANE.y0, 81, LOW_STREET.y1, cobbleDirt); // the east alley, outside the old wall
  paint(74, LANTERN_ROW.y0, 75, HIGH_STREET.y0, cobbleDirt); // the tavern's side passage
  paint(2, LOW_STREET.y0, 93, LOW_STREET.y1, (x, y) => (x >= STREAM.x0 - 1 && x <= STREAM.x1 + 1 ? FS.WOOD : dirtEarth(x, y)));
  paint(9, 41, 10, LOW_STREET.y0, dirtEarth); // the mill path
  paint(3, 41, 11, 43, dirtEarth); // the mill yard
  // the labour yard: packed earth, rutted by sledges
  paint(82, 30, 91, HIGH_STREET.y0 - 1, (x, y) => (vnoise(x, y, 3, 506) > 0.5 ? FS.EARTH : FS.DIRT));
  // the smithy yard, gritty with clinker
  paint(28, 36, 33, 43, (x, y) => (vnoise(x, y, 2, 507) > 0.6 ? FS.EARTH : FS.SOOTFLAG));
  // the village green keeps its grass; a worn path crosses it to the old well
  for (let y = 47; y < LOW_STREET.y0; y++) for (let x = 40; x <= 52; x++) { const i = y * W + x; grid[i] = T.FLOOR; style[i] = FS.GRASS; }
  for (let t = 0; t <= 1; t += 0.02) { const x = Math.round(46 + Math.sin(t * 3) * 1.5), y = Math.round(47 + t * 10); for (const dx of [0, 1]) if (inb(x + dx, y)) { style[y * W + x + dx] = FS.EARTH; street[y * W + x + dx] = 1; } }
  // the bridge deck and the plank footbridge by the old ford
  for (let y = HIGH_STREET.y0; y <= HIGH_STREET.y1; y++) for (let x = STREAM.x0; x <= STREAM.x1; x++) { set(x, y, T.FLOOR, FS.SETTS); street[y * W + x] = 1; }
  for (let y = LOW_STREET.y0; y <= LOW_STREET.y1; y++) for (let x = STREAM.x0; x <= STREAM.x1; x++) { set(x, y, T.FLOOR, FS.WOOD); street[y * W + x] = 1; }
  // the east road's opening and the closed north road stay open ground
  for (let y = HIGH_STREET.y0 - 1; y <= HIGH_STREET.y1 + 1; y++) for (let x = W - 6; x < W; x++) if (grid[y * W + x] === T.THICKET) set(x, y, T.FLOOR, FS.GRASS);

  // ---- buildings: footprint tiles are BUILDING (solid, opaque); the door notch is walkable
  const props: PropDef[] = [], lights: LightDef[] = [], decals: DecalDef[] = [];
  const ids = new Set<string>();
  const occ = new Uint8Array(n), deco = new Uint8Array(n);
  const footprint = (kind: string, px: number, py: number) => {
    const b = propDef(kind).box;
    if (!b) return null;
    return { x0: Math.floor((px - b[0] / 2) / TS), x1: Math.floor((px + b[0] / 2 - 0.01) / TS), y0: Math.floor((py - b[1]) / TS), y1: Math.floor((py - 0.01) / TS) };
  };
  const P = (kind: string, px: number, py: number, o: Partial<PropDef> = {}) => {
    const tx = Math.floor(px / TS), ty = Math.floor((py - 1) / TS);
    let id = o.id ?? `${kind}@${tx},${ty}`;
    for (let k = 2; ids.has(id); k++) id = `${kind}@${tx},${ty}#${k}`;
    ids.add(id);
    const p: PropDef = { kind, x: Math.round(px), y: Math.round(py), v: 0, ...o, id };
    props.push(p);
    const f = footprint(kind, p.x, p.y);
    if (f) { for (let y = f.y0; y <= f.y1; y++) for (let x = f.x0; x <= f.x1; x++) if (inb(x, y)) occ[y * W + x] = 1; }
    else if (inb(tx, ty)) deco[ty * W + tx] = 1;
    const L = propDef(kind).light;
    if (L && (L.when === "always" || p.lit)) lights.push({ x: p.x + L.dx, y: p.y + L.dy, rad: L.rad, col: L.col, int: L.int, flick: L.flick, owner: id });
    return p;
  };
  /** Tile -> px anchor (bottom centre of the tile, or an offset inside it). */
  const T2 = (tx: number, ty: number, dx = 8, dy = 16) => ({ x: tx * TS + dx, y: ty * TS + dy });
  const at = (kind: string, tx: number, ty: number, o: Partial<PropDef> = {}, dx = 8, dy = 16) => { const a = T2(tx, ty, dx, dy); return P(kind, a.x, a.y, o); };

  for (const b of TOWN_BUILDINGS) {
    for (let y = b.ty; y < b.ty + b.d; y++) for (let x = b.tx; x < b.tx + b.w; x++) { set(x, y, T.BUILDING); occ[y * W + x] = 1; street[y * W + x] = 0; }
    const fy = frontRow(b);
    if (b.door) for (let x = b.door.x; x < b.door.x + b.door.w; x++) { set(x, fy, T.FLOOR, b.tier === "rune" ? FS.MARBLE : FS.FLAG); street[fy * W + x] = 1; occ[fy * W + x] = 0; }
    // the apron in front of every facade stays clear (doors now, shop queues and NPCs later)
    for (let x = b.tx; x < b.tx + b.w; x++) if (inb(x, fy + 1) && grid[(fy + 1) * W + x] === T.FLOOR) street[(fy + 1) * W + x] = 1;
    P(`bld.${b.id}`, b.tx * TS + b.w * 8, (b.ty + b.d) * TS, { id: `bld.${b.id}` });
  }
  const B = (id: string) => TOWN_BUILDINGS.find((b) => b.id === id)!;
  /** Facade fixtures: a lamp or torch either side of a door (standing on the street, drawn high on the wall). */
  const doorLights = (id: string, kind: "runelamp_wall" | "walltorch", both = true, spread = 0) => {
    const b = B(id), fy = (frontRow(b) + 1) * TS + 1;
    const cx = b.door ? b.door.x * TS + b.door.w * 8 : b.tx * TS + b.w * 8, half = (b.door?.w ?? 1) * 8 + 10 + spread;
    const o = kind === "walltorch" ? { lit: true } : {};
    P(kind, cx - half, fy, o);
    if (both) P(kind, cx + half, fy, o);
  };

  // ================================================================ the square and Lantern Row (rune light)
  const sqCx = 49;
  P("lampstone", sqCx * TS + 8, 37 * TS + 4, { id: "lampstone" });
  at("trough", 45, 38, {}, 8, 12);
  // two rows of stalls with a wide aisle between them and room behind for the traders
  const stalls: [number, number, number][] = [[38, 32, 0], [42, 32, 1], [56, 32, 2], [60, 32, 3], [38, 41, 3], [42, 41, 2], [56, 41, 1], [60, 41, 0], [38, 36, 1], [60, 36, 2]];
  for (const [x, y, v] of stalls) P("stall", x * TS, y * TS + 14, { v });
  for (const [x, y] of [[36, 34], [44, 33], [58, 34], [40, 43], [62, 40]] as [number, number][]) at(hash2(x, y, 510) < 0.5 ? "crate" : "barrel", x, y, { v: hash2(x, y, 511) < 0.7 ? 0 : 1 });
  at("sack", 37, 33, {}, 4, 14); at("sack", 55, 33, {}, 12, 14); at("sack", 61, 42, {}, 10, 15);
  // a cobbled ring around the Lamp Stone, worn by feet; carts parked for the night
  for (let a = 0; a < 40; a++) { const t = (a / 40) * Math.PI * 2; decals.push({ kind: "ruts", x: Math.round(sqCx * TS + 8 + Math.cos(t) * 40) - 3, y: Math.round(37 * TS + Math.sin(t) * 24), v: 0, w: 6 }); }
  at("handcart", 46, 34, { v: 0 }, 0, 12); at("handcart", 53, 40, { v: 1 }, 8, 12);
  at("barrel", 47, 41, { v: 0 }); at("crate", 51, 33, { v: 0 }); at("sack", 52, 33, {}, 6, 14);
  P("noticeboard", 52 * TS + 8, 29 * TS + 14, { id: "noticeboard" });
  for (const [x, y] of [[36, 37], [63 - 1, 37]] as [number, number][]) at("bench_town", x, y, {}, 8, 12);
  at("planter", 46, 29, { v: 0 }, 8, 14); at("planter", 52, 43, { v: 1 }, 8, 14);
  // the rune lamps: around the square, along Lantern Row and the High Street inside the old gate
  for (const [x, y] of [[34, 29], [62, 29], [34, 42], [62, 43], [41, 37], [57, 37], [49, 30], [49, 43]] as [number, number][]) at("runelamp", x, y, {}, 8, 10);
  for (let x = 20; x <= 74; x += 9) { if (x > SQUARE.x0 - 2 && x < SQUARE.x1 + 2) continue; at("runelamp", x, HIGH_STREET.y0, {}, 8, 6); }
  for (let x = 24; x <= 72; x += 9) { if (x > SQUARE.x0 - 2 && x < SQUARE.x1 + 2) continue; at("runelamp", x, HIGH_STREET.y1 + 1, {}, 8, 6); }
  at("runelamp", 66, LANTERN_ROW.y1 + 1, {}, 2, 6); at("runelamp", 55, 24, {}, 4, 10);
  doorLights("armory", "runelamp_wall"); doorLights("guild", "runelamp_wall", true, 4); doorLights("jeweler", "runelamp_wall"); doorLights("reeve", "runelamp_wall");
  // the tailor bought one rune lamp, for the sign, and burns torches for the rest
  doorLights("tailor", "runelamp_wall", false); P("walltorch", (B("tailor").door!.x + 1) * TS + 12, (frontRow(B("tailor")) + 1) * TS + 1, { lit: true });
  doorLights("house_lr_w", "walltorch", false); doorLights("house_lr_e", "walltorch", false);

  // ================================================================ the High Street's torchlit trades
  doorLights("smithy", "walltorch", true, 6); doorLights("tavern", "walltorch");
  // the smithy yard: quench trough, coal, a cartwheel waiting for its rim
  at("quench", 30, 38, {}, 8, 12); at("coalheap", 32, 41, {}, 0, 14); at("woodpile", 30, 36, {}, 8, 14); at("anvil", 29, 41, {}, 8, 14);
  at("barrel", 33, 37, { v: 0 }); at("handcart", 31, 43, { v: 1 }, 0, 12);
  // the tavern's frontage: benches under its windows, a barrel stood for a table
  for (const x of [64, 70]) at("bench_town", x, 44, {}, 8, 6);
  at("barrel", 73, 44, { v: 0 }, 8, 8);
  // the tavern's backyard
  at("kegrack", 66, 32, {}, 8, 14); at("barrel", 70, 31, { v: 0 }); at("barrel", 71, 31, { v: 1 }); at("crate", 63, 33, { v: 0 }); at("woodpile", 69, 33, {}, 8, 14);
  // ---- the old east gate: two squat towers where the lamps stop
  P("gatetower", (OLD_GATE.x0 + 2) * TS, (HIGH_STREET.y0) * TS, { id: "gatetower.n", v: 0 });
  P("gatetower", (OLD_GATE.x0 + 2) * TS, (HIGH_STREET.y1 + 4) * TS, { id: "gatetower.s", v: 1 });
  for (let y = HIGH_STREET.y0 - 4; y < HIGH_STREET.y0; y++) for (let x = OLD_GATE.x0; x <= OLD_GATE.x1; x++) { set(x, y, T.BUILDING); occ[y * W + x] = 1; }
  for (let y = HIGH_STREET.y1 + 1; y <= HIGH_STREET.y1 + 3; y++) for (let x = OLD_GATE.x0; x <= OLD_GATE.x1; x++) { set(x, y, T.BUILDING); occ[y * W + x] = 1; }
  // what is left of the town wall, running north and south from the towers
  for (const y of [31, 33, 34, 37, 38]) at("oldwall", 78, y, { v: y % 3 }, 8, 16);
  for (const y of [51, 52, 55, 57]) at("oldwall", 78, y, { v: y % 3 }, 8, 16);

  // ================================================================ outside the gate: the suburb and the labour yard
  for (const x of [83, 86, 89]) at("golemberth", x, 33, { v: x }, 8, 16);
  at("haulsledge", 84, 38, {}, 8, 14); at("stonestack", 89, 38, { v: 0 }, 8, 14); at("stonestack", 89, 41, { v: 1 }, 0, 14);
  at("handcart", 85, 41, { v: 0 }, 8, 14); at("crate", 82, 41, { v: 1 });
  for (const [x, y] of [[82, 37], [91, 35]] as [number, number][]) at("torch_post", x, y, { lit: true }, 8, 14);
  at("signpost", 92, 43, {}, 8, 14);
  for (const x of [84, 90]) at("torch_post", x, HIGH_STREET.y0, { lit: true }, 8, 6);
  // the old keep road runs on east, unlit
  doorLights("sub_1", "walltorch", false); doorLights("laborshed", "walltorch", false);
  // hedged fields to the north-east
  for (let x = 83; x <= 92; x++) for (const y of [8, 20]) if (x !== 87) at("hedge", x, y, { v: (x + y) % 3 }, 8, 16);
  for (let y = 9; y <= 19; y++) if (y !== 14) { at("hedge", 83, y, { v: y % 3 }, 8, 16); }
  for (let y = 10; y < 19; y += 2) for (let x = 85; x < 92; x += 2) at("cabbages", x, y, { v: 0 }, 8, 12);

  // ================================================================ North Lane, the warehouse, the back yards
  for (const x of [22, 36, 52, 64, 76]) at("torch_post", x, NORTH_LANE.y0, { lit: x % 3 !== 1 }, 8, 6);
  // the corn warehouse: wide doors, a hoist, sacks waiting for the labour golems to carry them in
  at("haulsledge", 44, 15, {}, 0, 8);
  for (const [x, y] of [[40, 14], [41, 14], [48, 14]] as [number, number][]) at("sack", x, y, {}, 8, 8);
  doorLights("house_n2", "walltorch", false); doorLights("house_n5", "walltorch", false); doorLights("house_n7", "walltorch", false); doorLights("house_n3", "walltorch", false);
  // laundry strung between the backs of the houses, sheds and woodpiles
  at("laundry", 28, 18, { v: 1 }, 0, 14); at("laundry", 60, 18, { v: 4 }, 0, 14); at("laundry", 71, 19, { v: 6 }, 0, 14);
  at("woodpile", 22, 18, {}, 8, 14); at("woodpile", 66, 17, {}, 8, 14); at("haybale", 38, 17, {}, 8, 14); at("haybale", 39, 18, {}, 8, 14);
  // the closed north road: the labour yard is resetting it
  P("roadbarrier", 55.5 * TS, 5 * TS + 10, { id: "roadbarrier" });
  at("stonestack", 54, 7, { v: 0 }, 2, 14); at("stonestack", 56, 8, { v: 1 }, 10, 14); at("haulsledge", 55, 10, {}, 8, 14);
  at("torch_post", 53, 6, { lit: true }, 8, 14);
  for (let y = 0; y < 6; y++) for (const x of [AURIC_ROAD.x0 - 1, AURIC_ROAD.x1 + 1]) set(x, y, T.THICKET);

  // ================================================================ the west: bridge, mill, Bank Walk
  P("bridgerail", (STREAM.x0 + 2) * TS, HIGH_STREET.y0 * TS + 2, { id: "bridgerail.n" });
  P("bridgerail", (STREAM.x0 + 2) * TS, (HIGH_STREET.y1 + 1) * TS + 3, { id: "bridgerail.s", v: 1 });
  P("plankrail", (STREAM.x0 + 2) * TS, LOW_STREET.y0 * TS + 2, { id: "plankrail.n" });
  P("plankrail", (STREAM.x0 + 2) * TS, (LOW_STREET.y1 + 1) * TS + 3, { id: "plankrail.s" });
  // the old ford: stepping stones a little downstream, long since replaced by the bridges
  for (const [x, y, v] of [[12, 62, 0], [13, 62, 1], [14, 63, 0], [15, 62, 1]] as [number, number, number][]) at("steppingstone", x, y, { v }, 8, 12);
  P("millwheel", (STREAM.x0) * TS + 8, 41 * TS, { id: "millwheel" });
  at("sack", 4, 42, {}, 8, 10); at("sack", 5, 42, {}, 6, 12); at("handcart", 7, 42, { v: 0 }, 8, 14); at("torch_post", 11, 41, { lit: true }, 4, 14);
  at("torch_post", 16, HIGH_STREET.y1 + 1, { lit: true }, 8, 8); at("torch_post", 16, LOW_STREET.y0, { lit: true }, 8, 6);
  for (const x of [2, 4, 6]) at("fence", x, 49, {}, 8, 10);
  at("woodpile", 4, 58, {}, 8, 0); at("laundry", 4, 47, { v: 2 }, 0, 0);

  // ================================================================ the Old Quarter: the green, the well, the shrine
  P("well", 46 * TS + 8, 52 * TS + 8, { id: "well" });
  at("shrine", 50, 49, {}, 8, 14);
  at("bench_town", 42, 55, {}, 8, 12);
  // low garden walls along the High Street's south side, with gaps for the gates
  for (let x = 18; x <= 75; x++) {
    if (x >= 40 && x <= 52) continue;
    if ([21, 28, 35, 56, 63, 71].includes(x)) continue;
    if (x === 76 || x === 77) continue;
    at("lowwall", x, 47, { v: x % 3 }, 8, 14);
  }
  for (const x of [26, 40, 52, 66, 86]) at("torch_post", x, LOW_STREET.y0, { lit: x !== 66 }, 8, 6);
  doorLights("cott_1", "walltorch", false); doorLights("cott_3", "walltorch", false); doorLights("farmhouse", "walltorch", false); doorLights("cott_4", "walltorch", false);
  // gardens behind the cottages: cabbages, a haybale, a woodpile, laundry
  for (const [x, y] of [[20, 49], [22, 49], [30, 50], [55, 49], [57, 50], [62, 49]] as [number, number][]) at("cabbages", x, y, {}, 8, 12);
  at("haybale", 69, 49, {}, 8, 14); at("woodpile", 33, 49, {}, 8, 14); at("laundry", 60, 50, { v: 3 }, 0, 14);
  // south of Low Street: allotments and orchard trees, the old palisade's stumps
  for (let x = 20; x < 76; x += 3) at("fence", x, 61, {}, 8, 8);
  for (const [x, y] of [[23, 64], [31, 65], [44, 63], [52, 65], [60, 64], [70, 63], [86, 64]] as [number, number][]) at("tree", x, y, { v: (x + y) % 3 }, 8, 14);
  for (let y = 62; y <= 66; y += 2) for (let x = 35; x < 42; x += 2) at("cabbages", x, y, {}, 8, 12);

  // ================================================================ greenery in yards, gardens and the wild edge
  const canScatter = (kind: string, px: number, py: number) => {
    const tx = Math.floor(px / TS), ty = Math.floor((py - 1) / TS);
    if (!inb(tx, ty) || grid[ty * W + tx] !== T.FLOOR || street[ty * W + tx] || deco[ty * W + tx] || occ[ty * W + tx]) return false;
    const f = footprint(kind, px, py);
    if (!f) return true;
    for (let y = f.y0 - 1; y <= f.y1 + 1; y++) for (let x = f.x0 - 1; x <= f.x1 + 1; x++) {
      if (!inb(x, y) || grid[y * W + x] !== T.FLOOR || occ[y * W + x]) return false;
      if (x >= f.x0 && x <= f.x1 && y >= f.y0 && y <= f.y1 && street[y * W + x]) return false;
    }
    return true;
  };
  const order = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) { const j = (rng() * (i + 1)) | 0; const t = order[i]; order[i] = order[j]; order[j] = t; }
  for (const i of order) {
    const x = i % W, y = (i / W) | 0;
    if (grid[i] !== T.FLOOR || street[i]) continue;
    const r = rng(), wild = Math.min(x, y, W - 1 - x, H - 1 - y) < 7, s = style[i];
    const ax = x * TS + 8 + Math.round((hash2(x, y, 512) - 0.5) * 6), ay = y * TS + 16 - Math.round(hash2(x, y, 513) * 3);
    const tryP = (kind: string, v: number) => { if (canScatter(kind, ax, ay)) P(kind, ax, ay, { v }); };
    if (wild) {
      if (r < 0.08) tryP("tree", (rng() * 3) | 0);
      else if (r < 0.14) tryP("bush", (rng() * 4) | 0);
      else if (r < 0.3) tryP("tallgrass", (rng() * 3) | 0);
      else if (r < 0.38) tryP("fern", (rng() * 3) | 0);
    } else if (s === FS.GRASS || s === FS.MOSS) {
      if (r < 0.012) tryP("tree", (rng() * 3) | 0);
      else if (r < 0.03) tryP("bush", (rng() * 4) | 0);
      else if (r < 0.08) tryP("tallgrass", (rng() * 3) | 0);
      else if (r < 0.1) tryP("fern", (rng() * 3) | 0);
    } else if (s === FS.MUD || s === FS.EARTH) { if (r < 0.12) tryP("tallgrass", 2); }
  }
  // the green's great oak (planted when the ford was a hamlet)
  P("tree", 42 * TS + 8, 50 * TS + 14, { v: 0, id: "tree.oak" });

  // ================================================================ decals
  const D = (kind: string, x: number, y: number, v = 0, w?: number, h?: number) => decals.push({ kind, x: Math.round(x), y: Math.round(y), v, w, h });
  const jit = (s: number) => (rng() - 0.5) * s;
  for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
    const i = y * W + x;
    if (grid[i] !== T.FLOOR) continue;
    const bx = x * TS, by = y * TS, r = rng(), s = style[i];
    if (s === FS.SETTS) { if (r < 0.02) D("puddle", bx + jit(6), by + 4 + jit(4), 0, 10 + rng() * 10, 4 + rng() * 3); else if (r < 0.05) D("tuft", bx + 3 + rng() * 10, by + 6 + rng() * 9, 0); }
    else if (s === FS.COBBLE) { if (r < 0.05) D("tuft", bx + 3 + rng() * 10, by + 6 + rng() * 9, 0); else if (r < 0.07) D("puddle", bx + jit(6), by + 4, 1, 12 + rng() * 10, 5 + rng() * 3); else if (r < 0.1) D("pebbles", bx + 8, by + 8, 0); }
    else if (s === FS.DIRT || s === FS.EARTH) { if (r < 0.06) D("pebbles", bx + 8 + jit(6), by + 8 + jit(6), 0); else if (r < 0.08) D("puddle", bx + jit(6), by + 4, 1, 14 + rng() * 12, 6 + rng() * 4); else if (r < 0.14) D("tuft", bx + 3 + rng() * 10, by + 6 + rng() * 9, 0); }
    else if (s === FS.GRASS) { if (r < 0.3) D("tuft", bx + 3 + rng() * 10, by + 6 + rng() * 9, 0); else if (r < 0.36) D("flowers", bx + 8, by + 8, (rng() * 4) | 0); else if (r < 0.39 && vnoise(x, y, 5, 514) > 0.6) D("wildflowers", bx + 8 + jit(8), by + 8 + jit(8), (rng() * 4) | 0); }
    else if (s === FS.MOSS) { if (r < 0.1) D("mosspatch", bx + 8 + jit(8), by + 8 + jit(8), (rng() * 2) | 0, 10 + rng() * 10); }
    else if (s === FS.MUD) { if (r < 0.2) D("weeds", bx + 8 + jit(8), by + 12, 0); }
  }
  // cart ruts down the old keep road; the green's path; moss on the Old Quarter's walls
  for (let x = 80; x < W; x += 2) { D("ruts", x * TS, HIGH_STREET.y0 * TS + 14, 0, 34); D("ruts", x * TS + 6, HIGH_STREET.y1 * TS + 2, 1, 30); }
  for (let x = 82; x <= 91; x += 2) D("ruts", x * TS, 37 * TS, 1, 30);
  for (const p of props) if (p.kind === "tree" && rng() < 0.6) { D("roots", p.x - 4 + jit(4), p.y - 4, 0); D("shade", p.x + 6 + jit(6), p.y - 12, 0, 44 + rng() * 14); }
  for (const b of TOWN_BUILDINGS) if (b.look.age === 2) for (let k = 0; k < 4; k++) D("weeds", (b.tx + rng() * b.w) * TS, (b.ty + b.d) * TS + 3, 0);
  D("scorch", 31 * TS, 40 * TS, 0); D("scorch", 23 * TS + 8, 44 * TS + 6, 0);
  for (let k = 0; k < 10; k++) D("straw", (82 + rng() * 9) * TS, (31 + rng() * 12) * TS, (rng() * 3) | 0);
  for (let k = 0; k < 8; k++) D("straw", (40 + rng() * 9) * TS, (14 + rng() * 2) * TS, (rng() * 3) | 0);

  const start = portalById("road.town.east")!.arrive;
  return {
    id: "town", w: W, h: H, grid, plan: grid.slice(), style, tvar, rooms: [], props, decals, lights, loose: [],
    start: { x: start.x, y: start.y }, exits: [], drips: [], outdoor: true, ambient: TOWN_AMBIENT,
  };
}
