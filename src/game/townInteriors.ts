// The interiors of Westerford's six establishments, one area each (ids and
// sizes in content/town.ts: TOWN_INTERIORS). Pure, deterministic builders.
//
// Every room follows one plan so later systems need little rework: the back
// wall is a two-tile face (rows 1-2) carrying shelves, racks and windows; the
// floor starts at row 3; the door is a gap in the south wall. The counter
// stands across the room with a clear lane behind it (where the shopkeeper
// will stand) and a clear lane in front (customers); the doorway column is kept
// clear from door to counter. Rune-lit shops (armory, jeweler, guild) burn
// steady blue-white rune sconces and chandeliers; the smithy, the tavern and
// the tailor burn fire (forge, hearth, torches and candles). The tailor keeps
// one rune lamp, over the cutting table, where colour has to be judged true.
import { TS, T, FS, WS } from "./content/tiles";
import { propDef } from "./content/props";
import { TOWN_INTERIORS, interiorById, portalById, type InteriorRow } from "./content/town";
import type { AreaData, DecalDef, LightDef, PropDef } from "./map";

interface Room {
  r: InteriorRow;
  grid: Uint8Array; style: Uint8Array;
  props: PropDef[]; lights: LightDef[]; decals: DecalDef[];
  /** Place a prop at a px anchor (bottom centre). */
  P: (kind: string, x: number, y: number, o?: Partial<PropDef>) => PropDef;
  /** A wall fixture on the back wall at tile column tx (anchor at the face's foot). */
  wallAt: (kind: string, tx: number, o?: Partial<PropDef>, dx?: number) => PropDef;
  D: (kind: string, x: number, y: number, v?: number, w?: number, h?: number) => void;
}

/** First floor row (below the two-tile back wall face). */
export const FLOOR0 = 3;

function room(id: string, floor: number, wall: number): Room {
  const r = interiorById(id)!;
  const { w, h } = r, grid = new Uint8Array(w * h).fill(T.WALL), style = new Uint8Array(w * h).fill(wall);
  for (let y = FLOOR0; y <= h - 2; y++) for (let x = 1; x <= w - 2; x++) { grid[y * w + x] = T.FLOOR; style[y * w + x] = floor; }
  for (let x = r.door.x; x < r.door.x + r.door.w; x++) { grid[(h - 1) * w + x] = T.FLOOR; style[(h - 1) * w + x] = floor; }
  const props: PropDef[] = [], lights: LightDef[] = [], decals: DecalDef[] = [], ids = new Set<string>();
  const P = (kind: string, x: number, y: number, o: Partial<PropDef> = {}) => {
    const tx = Math.floor(x / TS), ty = Math.floor((y - 1) / TS);
    let pid = o.id ?? `${kind}@${tx},${ty}`;
    for (let k = 2; ids.has(pid); k++) pid = `${kind}@${tx},${ty}#${k}`;
    ids.add(pid);
    const p: PropDef = { kind, x: Math.round(x), y: Math.round(y), v: 0, ...o, id: pid };
    props.push(p);
    const L = propDef(kind).light;
    if (L && (L.when === "always" || p.lit)) lights.push({ x: p.x + L.dx, y: p.y + L.dy, rad: L.rad, col: L.col, int: L.int, flick: L.flick, owner: pid });
    return p;
  };
  const wallAt = (kind: string, tx: number, o: Partial<PropDef> = {}, dx = 8) => P(kind, tx * TS + dx, FLOOR0 * TS, o);
  const D = (kind: string, x: number, y: number, v = 0, dw?: number, dh?: number) => { decals.push({ kind, x: Math.round(x), y: Math.round(y), v, w: dw, h: dh }); };
  // the threshold: a worn sill in the doorway
  D("sill", r.door.x * TS, (h - 1) * TS + 2, 0, r.door.w * TS, 12);
  return { r, grid, style, props, lights, decals, P, wallAt, D };
}

function finish(R: Room, ambient: [number, number, number]): AreaData {
  const arrive = portalById(`door.${R.r.id}`)!.arrive;
  return {
    id: R.r.id, w: R.r.w, h: R.r.h, grid: R.grid, plan: R.grid.slice(), style: R.style, tvar: new Uint8Array(R.r.w * R.r.h),
    rooms: [], props: R.props, decals: R.decals, lights: R.lights, loose: [], start: { x: arrive.x, y: arrive.y }, exits: [], drips: [], ambient,
  };
}
/** Warm, low: fire-lit rooms. */
const AMB_FIRE: [number, number, number] = [0.26, 0.2, 0.16];
/** Cooler and brighter: rooms with rune light (the money shows). */
const AMB_RUNE: [number, number, number] = [0.32, 0.34, 0.4];

const px = (tx: number, dx = 8) => tx * TS + dx;
const py = (ty: number, dy = 16) => ty * TS + dy;

// ---------------------------------------------------------------- the smithy (fire)
export function buildSmithy(): AreaData {
  const R = room("town_smithy", FS.SOOTFLAG, WS.SOOT), { P, wallAt, D } = R;
  // the forge against the back wall, bellows beside it, anvils in the forge's light
  P("smithforge", px(4), py(4, 12), { lit: true, id: "forge" });
  P("bellows", px(7, 4), py(4, 10));
  P("anvil", px(5), py(6, 12)); P("anvil", px(9), py(6, 8));
  P("quench", px(2, 12), py(7, 12));
  P("grindstone", px(14), py(5, 8));
  wallAt("toolrack", 9, {}, 4); wallAt("horseshoes", 12, {}, 8); wallAt("toolrack", 15, {}, 0);
  wallAt("torch", 1, { lit: true }, 12); wallAt("torch", 16, { lit: true }, 4);
  P("coalbin", px(14, 4), py(3, 14)); P("barrel", px(16, 6), py(5, 12)); P("crate", px(16, 6), py(7, 10));
  // the counter: the smith's side behind it (row 8), the customers' in front, the doorway lane clear
  P("counter", px(12), py(9, 10), { v: 0, id: "counter" });
  P("weaponrack", px(4), py(9, 12)); P("barrel", px(1, 12), py(10, 12), { v: 0 }); P("sack", px(6), py(10, 12));
  D("scorch", px(4, 2), py(5, 2), 0); D("scorch", px(6, 4), py(6, 10), 1); D("scorch", px(9, 10), py(7, 0), 2);
  D("straw", px(14), py(10), 0); D("straw", px(3), py(8), 1);
  return finish(R, AMB_FIRE);
}

// ---------------------------------------------------------------- the armory (rune)
export function buildArmory(): AreaData {
  const R = room("town_armory", FS.TERRA, WS.ASHLAR), { P, wallAt, D } = R;
  wallAt("shieldwall", 3, {}, 4); wallAt("shieldwall", 11, {}, 12);
  wallAt("runesconce", 1, {}, 12); wallAt("runesconce", 7, {}, 8); wallAt("runesconce", 14, {}, 4);
  wallAt("guildbanner", 9, { v: 1 }, 0); wallAt("guildbanner", 6, { v: 0 }, 0);
  // weapon racks and full plate along the back, a case of blades, a strongbox
  P("weaponrack", px(2, 12), py(3, 14)); P("weaponrack", px(13, 4), py(3, 14));
  P("plate_stand", px(5), py(4, 4), { v: 1 }); P("plate_stand", px(10), py(4, 4), { v: 0 });
  P("armorstand", px(1, 12), py(6, 8)); P("armorstand", px(14, 4), py(6, 8));
  P("swordcase", px(4), py(7, 4)); P("swordcase", px(12), py(7, 4));
  P("counter", px(8), py(9, 12), { v: 1, id: "counter" });
  P("strongbox", px(13), py(9, 8)); P("plant", px(1, 12), py(11, 4)); P("plant", px(14, 4), py(11, 4), { v: 1 });
  D("rug", px(5, 0), py(10, 2), 1, 48, 30);
  P("runechandelier", px(8), py(7, 4), { id: "chandelier" });
  return finish(R, AMB_RUNE);
}

// ---------------------------------------------------------------- the jeweler (rune, the richest room in town)
export function buildJeweler(): AreaData {
  const R = room("town_jeweler", FS.PARQUET, WS.PANEL), { P, wallAt, D } = R;
  wallAt("curtain", 1, { v: 0 }, 9); wallAt("curtain", 12, { v: 0 }, 7);
  wallAt("vaultdoor", 10, {}, 0);
  wallAt("runesconce", 3, {}, 8); wallAt("runesconce", 7, {}, 8);
  wallAt("painting", 5, { v: 0 }, 8);
  P("jewelbench", px(4), py(4, 4)); P("tablecandle", px(5, 10), py(4, 0)); P("strongbox", px(12, 4), py(4, 12));
  // the glass counter across the room, display cases either side of the door
  P("counter", px(7), py(6, 12), { v: 2, id: "counter" });
  P("glasscase", px(2, 12), py(8, 12), { v: 0 }); P("glasscase", px(11, 4), py(8, 12), { v: 1 });
  P("plant", px(1, 10), py(9, 8)); P("plant", px(12, 6), py(9, 8), { v: 1 }); P("mirror", px(1, 10), py(5, 0), { id: "mirror" });
  D("rug", px(4, 4), py(7, 2), 2, 56, 28);
  P("runechandelier", px(7, 0), py(7, 6), { id: "chandelier" });
  return finish(R, AMB_RUNE);
}

// ---------------------------------------------------------------- the tailor (fire, and one rune lamp)
export function buildTailor(): AreaData {
  const R = room("town_tailor", FS.BOARDS, WS.PLASTER), { P, wallAt, D } = R;
  P("clothbolts", px(2), py(3, 14), { v: 0 }); P("clothbolts", px(12, 8), py(3, 14), { v: 3 });
  wallAt("window_in", 5, { v: 1 }); wallAt("window_in", 9, { v: 1 });
  wallAt("mirror", 7, {}, 8); wallAt("torch", 4, { lit: true }, 4); wallAt("torch", 10, { lit: true }, 12);
  // the cutting table under the one rune lamp the tailor could afford: colour has to be judged true
  P("cuttingtable", px(9, 8), py(6, 6)); P("runechandelier", px(9, 8), py(6, 12), { id: "runelamp.cutting" });
  P("spinwheel", px(14), py(5, 8)); P("loom", px(14, 0), py(8, 8));
  P("dressform", px(2), py(6, 6), { v: 0 }); P("dressform", px(3, 12), py(7, 0), { v: 4 }); P("dressform", px(1, 12), py(8, 6), { v: 2 });
  P("counter", px(6, 0), py(9, 10), { v: 3, id: "counter" }); P("tablecandle", px(4, 2), py(9, 0));
  P("stool", px(10), py(10, 8)); P("plant", px(14), py(10, 8));
  D("rug", px(2), py(9, 6), 3, 40, 22);
  D("thread", px(8), py(7, 8), 0); D("thread", px(11), py(8, 4), 1);
  return finish(R, AMB_FIRE);
}

// ---------------------------------------------------------------- the tavern (fire)
export function buildTavern(): AreaData {
  const R = room("town_tavern", FS.BOARDS, WS.PLASTER), { P, wallAt, D } = R;
  // the great hearth on the back wall, the bar along the east, stairs up to the rooms
  P("bighearth", px(5, 4), py(3, 14), { lit: true, id: "hearth" });
  wallAt("trophyhead", 9, { v: 1 }, 8); wallAt("painting", 2, { v: 0 }, 8); wallAt("window_in", 12, { v: 0 }); wallAt("window_in", 15, { v: 0 });
  wallAt("torch", 1, { lit: true }, 12); wallAt("torch", 11, { lit: true }, 0); wallAt("torch", 22, { lit: true }, 4);
  wallAt("bottleshelf", 18, {}, 8);
  P("kegrack", px(20, 8), py(3, 14));
  // the bar: the keeper's lane behind it (row 5), drinkers on stools in front
  P("bar", px(18, 8), py(6, 6), { id: "bar" });
  for (const x of [15, 17, 19, 21]) P("stool", px(x, 8), py(7, 2));
  P("stairs", px(2, 4), py(5, 14), { id: "stairs" });
  P("candelabra", px(14, 8), py(4, 10)); P("candelabra", px(22, 6), py(7, 6)); P("candelabra", px(4, 8), py(12, 12)); P("candelabra", px(12, 0), py(12, 12));
  // tables: long ones by the fire, round ones by the windows, benches and stools around them
  P("longtable", px(8, 8), py(7, 8)); P("bench", px(8, 8), py(6, 12)); P("bench", px(8, 8), py(8, 6));
  P("tablecandle", px(7, 4), py(7, 0)); P("tablecandle", px(10, 8), py(7, 0));
  for (const [x, y, v] of [[14, 10, 0], [19, 10, 1], [7, 11, 2], [3, 9, 1]] as [number, number, number][]) {
    P("roundtable", px(x, 8), py(y, 8), { v });
    P("stool", px(x - 1, 4), py(y, 10)); P("stool", px(x + 1, 12), py(y, 10)); P("stool", px(x, 8), py(y + 1, 2));
    P("tablecandle", px(x, 6), py(y, 0));
  }
  // a corner for the bard: a low dais, a stool
  D("dais", px(20, 0), py(11, -6), 0, 48, 28); P("stool", px(21, 8), py(12, 0));
  P("barrel", px(1, 12), py(12, 12), { v: 0 }); P("barrel", px(22, 6), py(12, 12)); P("crate", px(22, 6), py(8, 12));
  D("rug", px(5, 8), py(4, 10), 0, 64, 20);
  D("straw", px(12), py(13), 0); D("straw", px(16), py(9), 2); D("spill", px(17), py(7, 12), 0); D("spill", px(9), py(10), 1);
  return finish(R, AMB_FIRE);
}

// ---------------------------------------------------------------- the guild hall (rune)
export function buildGuild(): AreaData {
  const R = room("town_guild", FS.PARQUET, WS.ASHLAR), { P, wallAt, D } = R;
  wallAt("questboard", 8, {}, 14); wallAt("questboard", 12, {}, 2);
  wallAt("guildbanner", 2, { v: 1 }, 8); wallAt("guildbanner", 19, { v: 1 }, 8); wallAt("guildbanner", 7, { v: 0 }, 0); wallAt("guildbanner", 15, { v: 0 }, 0);
  wallAt("trophyhead", 4, { v: 0 }, 8); wallAt("trophyhead", 17, { v: 1 }, 8);
  wallAt("runesconce", 1, {}, 12); wallAt("runesconce", 6, {}, 4); wallAt("runesconce", 16, {}, 12); wallAt("runesconce", 20, {}, 4);
  // reception: the clerk's lane behind the long counter, the ledger, the archive shelves
  P("counter", px(10, 0), py(6, 10), { v: 1, id: "counter" }); P("counter_s", px(13, 8), py(6, 10), { v: 1 });
  P("ledgerdesk", px(4, 8), py(4, 6)); P("bookshelf", px(1, 8), py(3, 12), { v: 0 }); P("bookshelf", px(20, 8), py(3, 12), { v: 3 });
  P("strongbox", px(17, 0), py(4, 8));
  // the common room: the map table, benches for parties waiting on work, a weapon rack by the door
  P("maptable", px(5, 0), py(10, 8), { id: "maptable" }); P("chair", px(3, 4), py(10, 8)); P("chair", px(6, 12), py(10, 8));
  P("longtable", px(16, 0), py(10, 8)); P("bench", px(16, 0), py(9, 12)); P("bench", px(16, 0), py(11, 6));
  P("weaponrack", px(1, 12), py(13, 10)); P("barrel", px(20, 8), py(13, 12)); P("plant", px(8, 4), py(13, 8)); P("plant", px(13, 12), py(13, 8), { v: 1 });
  D("rug", px(9, 8), py(7, 8), 1, 64, 56);
  P("runechandelier", px(5, 0), py(9, 8), { id: "chandelier.w" }); P("runechandelier", px(16, 0), py(9, 8), { id: "chandelier.e" });
  return finish(R, AMB_RUNE);
}

export const INTERIOR_BUILDERS: Record<string, () => AreaData> = {
  town_smithy: buildSmithy, town_armory: buildArmory, town_jeweler: buildJeweler,
  town_tailor: buildTailor, town_tavern: buildTavern, town_guild: buildGuild,
};
// every interior row has a builder (and nothing else does)
for (const r of TOWN_INTERIORS) if (!INTERIOR_BUILDERS[r.id]) throw new Error(`no builder for interior ${r.id}`);
