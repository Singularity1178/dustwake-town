// Westerford: the market town west of the buried keep (data). Pure; no DOM.
//
// History, as the town wears it:
// - THE WEST FORD. The keep's people called the hamlet by the stream "the west
//   ford": woodcutters and herders who fed the keep. That core still stands
//   south of the High Street (the Old Quarter): low fieldstone cottages under
//   thatch around the village green, the old well, the wayside shrine. Some of
//   their walls are built from dressed stone carried off the fallen keep, and
//   a few blocks still show its eye-in-triangle sigil.
// - THE MARKET. When the imperial road came through, the ford became a
//   crossing and the crossing a market. Timber-framed two-storey houses, the
//   tavern and the smithy went up along the High Street; a stone town wall was
//   raised around the core. Its east gate towers still flank the street, but
//   the arch was pulled down long ago so hauling golems and tall loads could
//   pass. The wall itself was quarried away for the stone bridge.
// - THE LAMPS. Recent money (the guild's trade, the road) bought runes of
//   endless light. They line the square, the High Street inside the old gate
//   and Lantern Row, and burn in the high-end shops. They stop at the old gate
//   towers, at the tailor's door, and at the edge of the square: everywhere
//   else, homes, lanes, the smithy, the tavern and the Old Quarter still burn
//   torches, tallow and hearth fire. At night the town's divides are drawn in
//   light: cool steady blue-white where the money is, warm guttering orange
//   everywhere else.
// - THE GOLEMS. Only simple labour golems exist here. The town is built around
//   them without making a show of it: the labour yard's empty berths and chalk
//   tally boards, a hoist and wide loading doors on the warehouse, sledges and
//   oversized handcarts, the setts stacked for the north road repaving, the
//   bridge's huge golem-laid blocks.
//
// Layout (tiles). Every building faces south onto a street; its door notch is
// the only walkable tile in its footprint. Streets, the square's aisles and
// each interior's floor in front of its counter are kept clear so NPCs,
// pathing and shopkeepers can be added later without rework (tested).
import { TS } from "./tiles";

export const TOWN_W = 96, TOWN_H = 72;

/** Lighting tier: rune lamps (the wealthy) or torches (everyone else). */
export type LightTier = "rune" | "torch";

export type WallMat = "fieldstone" | "timber" | "plaster" | "ashlar" | "brick";
export type RoofMat = "thatch" | "shingle" | "slate" | "tile";
export type Sign = "anvil" | "sword" | "gem" | "needle" | "crown" | "guild" | "seal" | "sheaf";
export type DoorStyle = "plank" | "double" | "grand" | "forge" | "barn" | "glazed";

/** How a building looks (art/propsTown.ts draws it from this). */
export interface BuildingLook {
  wall: WallMat;
  roof: RoofMat;
  stories: 1 | 2 | 3;
  door: DoorStyle;
  /** Limewash / brick tint index (art palette). */
  tint?: number;
  /** Windows: lit by torch or rune light, or dark and shuttered (asleep). */
  windows: LightTier | "dark" | "mixed";
  sign?: Sign;
  /** Chimney positions, as fractions of the width. Each smokes. */
  chimneys?: number[];
  /** Front-facing gable over the door. */
  gable?: boolean;
  /** Upper storey overhangs the ground floor (timber framing). */
  jetty?: boolean;
  /** Moss, sag and weathering, 0 (new) .. 2 (ancient). */
  age?: 0 | 1 | 2;
  /** Reused keep stones with the old sigil in the walls. */
  spolia?: boolean;
  /** Striped awning over the shop window (colour index). */
  awning?: number;
  /** Bay window on the ground floor (display). */
  bay?: boolean;
  /** Steps and a portico at the door (civic / high-end). */
  portico?: boolean;
  /** A hoist beam and loading door in the gable (warehouse). */
  hoist?: boolean;
  /** Window boxes with flowers. */
  flowers?: boolean;
}

export interface BuildingRow {
  id: string;
  name: string;
  /** Footprint, tiles: left, top, width, depth. Bottom row is ty + d - 1. */
  tx: number; ty: number; w: number; d: number;
  /** Door column (tile x) and width in tiles; absent: no usable door (decorative). */
  door?: { x: number; w: number };
  /** The interior area entered through the door. */
  interior?: string;
  /** Light tier of the facade and (for shops) the interior. */
  tier: LightTier;
  look: BuildingLook;
}

/** Bottom row of a building's footprint. */
export const frontRow = (b: BuildingRow) => b.ty + b.d - 1;

export const TOWN_BUILDINGS: BuildingRow[] = [
  // ---- Lantern Row: the square's north frontage, the money of the town (rune lamps)
  { id: "armory", name: "IRONWARD ARMORY", tx: 35, ty: 20, w: 8, d: 8, door: { x: 38, w: 1 }, interior: "town_armory", tier: "rune",
    look: { wall: "ashlar", roof: "slate", stories: 2, door: "double", windows: "rune", sign: "sword", chimneys: [0.8], portico: true } },
  { id: "guild", name: "ADVENTURERS' GUILD", tx: 44, ty: 18, w: 10, d: 10, door: { x: 48, w: 2 }, interior: "town_guild", tier: "rune",
    look: { wall: "ashlar", roof: "slate", stories: 3, door: "grand", windows: "rune", sign: "guild", chimneys: [0.15, 0.85], gable: true, portico: true } },
  { id: "jeweler", name: "VESSARI JEWELS", tx: 57, ty: 21, w: 6, d: 7, door: { x: 59, w: 1 }, interior: "town_jeweler", tier: "rune",
    look: { wall: "brick", roof: "slate", stories: 2, door: "glazed", windows: "rune", sign: "gem", bay: true, tint: 1, awning: 3 } },
  { id: "tailor", name: "THE GOLDEN NEEDLE", tx: 64, ty: 21, w: 7, d: 7, door: { x: 66, w: 1 }, interior: "town_tailor", tier: "torch",
    look: { wall: "plaster", roof: "tile", stories: 2, door: "glazed", windows: "torch", sign: "needle", tint: 2, jetty: true, awning: 1, bay: true, flowers: true, chimneys: [0.82] } },
  { id: "reeve", name: "REEVE'S HALL", tx: 26, ty: 20, w: 8, d: 8, tier: "rune",
    look: { wall: "ashlar", roof: "slate", stories: 2, door: "double", windows: "mixed", sign: "seal", gable: true, portico: true, chimneys: [0.2] } },
  { id: "house_lr_w", name: "HOUSE", tx: 18, ty: 22, w: 7, d: 6, tier: "torch",
    look: { wall: "timber", roof: "shingle", stories: 2, door: "plank", windows: "mixed", jetty: true, chimneys: [0.25], age: 1 } },
  { id: "house_lr_e", name: "HOUSE", tx: 72, ty: 22, w: 6, d: 6, tier: "torch",
    look: { wall: "plaster", roof: "tile", stories: 2, door: "plank", windows: "torch", tint: 0, chimneys: [0.7], flowers: true } },
  // ---- the High Street's north frontage
  { id: "smithy", name: "ODO'S FORGE", tx: 19, ty: 36, w: 9, d: 8, door: { x: 23, w: 2 }, interior: "town_smithy", tier: "torch",
    look: { wall: "fieldstone", roof: "shingle", stories: 1, door: "forge", windows: "torch", sign: "anvil", chimneys: [0.18, 0.8], age: 1 } },
  { id: "tavern", name: "THE SUNKEN CROWN", tx: 63, ty: 35, w: 11, d: 9, door: { x: 68, w: 1 }, interior: "town_tavern", tier: "torch",
    look: { wall: "timber", roof: "tile", stories: 2, door: "double", windows: "torch", sign: "crown", chimneys: [0.12, 0.9], jetty: true, gable: true, age: 1 } },
  // ---- North Lane: newer timber houses and the corn warehouse
  { id: "house_n1", name: "HOUSE", tx: 18, ty: 9, w: 6, d: 5, tier: "torch", look: { wall: "timber", roof: "thatch", stories: 1, door: "plank", windows: "dark", chimneys: [0.7], age: 1 } },
  { id: "house_n2", name: "HOUSE", tx: 25, ty: 8, w: 7, d: 6, tier: "torch", look: { wall: "timber", roof: "shingle", stories: 2, door: "plank", windows: "torch", jetty: true, chimneys: [0.2] } },
  { id: "house_n3", name: "HOUSE", tx: 33, ty: 9, w: 6, d: 5, tier: "torch", look: { wall: "plaster", roof: "tile", stories: 1, door: "plank", windows: "torch", tint: 3, flowers: true, chimneys: [0.5] } },
  { id: "warehouse", name: "CORN WAREHOUSE", tx: 40, ty: 7, w: 9, d: 7, tier: "torch",
    look: { wall: "timber", roof: "shingle", stories: 2, door: "barn", windows: "dark", sign: "sheaf", hoist: true, gable: true } },
  { id: "house_n4", name: "HOUSE", tx: 49, ty: 9, w: 5, d: 5, tier: "torch", look: { wall: "fieldstone", roof: "thatch", stories: 1, door: "plank", windows: "torch", chimneys: [0.3], age: 1 } },
  { id: "house_n5", name: "HOUSE", tx: 58, ty: 8, w: 7, d: 6, tier: "torch", look: { wall: "plaster", roof: "tile", stories: 2, door: "plank", windows: "mixed", tint: 1, chimneys: [0.8], flowers: true } },
  { id: "house_n6", name: "HOUSE", tx: 66, ty: 9, w: 6, d: 5, tier: "torch", look: { wall: "timber", roof: "shingle", stories: 1, door: "plank", windows: "dark", chimneys: [0.25] } },
  { id: "house_n7", name: "HOUSE", tx: 73, ty: 9, w: 7, d: 5, tier: "torch", look: { wall: "fieldstone", roof: "shingle", stories: 1, door: "plank", windows: "torch", chimneys: [0.75], age: 1 } },
  // ---- the Old Quarter: the original west ford, fieldstone and thatch
  { id: "cott_1", name: "COTTAGE", tx: 19, ty: 53, w: 6, d: 5, tier: "torch", look: { wall: "fieldstone", roof: "thatch", stories: 1, door: "plank", windows: "torch", chimneys: [0.2], age: 2 } },
  { id: "cott_2", name: "COTTAGE", tx: 26, ty: 53, w: 6, d: 5, tier: "torch", look: { wall: "fieldstone", roof: "thatch", stories: 1, door: "plank", windows: "dark", chimneys: [0.75], age: 2, spolia: true } },
  { id: "cott_3", name: "COTTAGE", tx: 33, ty: 53, w: 6, d: 5, tier: "torch", look: { wall: "fieldstone", roof: "thatch", stories: 1, door: "plank", windows: "torch", chimneys: [0.5], age: 2, flowers: true } },
  { id: "cott_4", name: "COTTAGE", tx: 54, ty: 53, w: 6, d: 5, tier: "torch", look: { wall: "fieldstone", roof: "thatch", stories: 1, door: "plank", windows: "torch", chimneys: [0.3], age: 2, spolia: true } },
  { id: "cott_5", name: "COTTAGE", tx: 61, ty: 53, w: 6, d: 5, tier: "torch", look: { wall: "timber", roof: "thatch", stories: 1, door: "plank", windows: "dark", chimneys: [0.7], age: 2 } },
  { id: "farmhouse", name: "FARMHOUSE", tx: 68, ty: 52, w: 7, d: 6, tier: "torch", look: { wall: "fieldstone", roof: "thatch", stories: 2, door: "plank", windows: "torch", chimneys: [0.15, 0.85], age: 2, spolia: true } },
  // ---- outside the old gate: the east suburb
  { id: "laborshed", name: "LABOUR YARD", tx: 83, ty: 26, w: 8, d: 4, tier: "torch", look: { wall: "timber", roof: "shingle", stories: 1, door: "barn", windows: "dark" } },
  { id: "sub_1", name: "HOUSE", tx: 82, ty: 52, w: 6, d: 5, tier: "torch", look: { wall: "timber", roof: "shingle", stories: 1, door: "plank", windows: "torch", chimneys: [0.3] } },
  { id: "sub_2", name: "HOUSE", tx: 89, ty: 52, w: 4, d: 5, tier: "torch", look: { wall: "plaster", roof: "thatch", stories: 1, door: "plank", windows: "dark", tint: 0, chimneys: [0.6], age: 1 } },
  // ---- west of the stream: the mill and the poorest cottages
  { id: "mill", name: "WATERMILL", tx: 3, ty: 34, w: 8, d: 7, tier: "torch", look: { wall: "fieldstone", roof: "shingle", stories: 2, door: "barn", windows: "torch", gable: true, age: 1 } },
  { id: "cott_w1", name: "COTTAGE", tx: 3, ty: 51, w: 5, d: 5, tier: "torch", look: { wall: "timber", roof: "thatch", stories: 1, door: "plank", windows: "torch", chimneys: [0.5], age: 2 } },
];

/** An enterable interior: a single room, door in the south wall. */
export interface InteriorRow {
  id: string;
  building: string;
  name: string;
  w: number; h: number;
  /** Door column(s) in the south wall. */
  door: { x: number; w: number };
  tier: LightTier;
}

export const TOWN_INTERIORS: InteriorRow[] = [
  { id: "town_smithy", building: "smithy", name: "ODO'S FORGE", w: 18, h: 13, door: { x: 8, w: 2 }, tier: "torch" },
  { id: "town_armory", building: "armory", name: "IRONWARD ARMORY", w: 16, h: 13, door: { x: 7, w: 1 }, tier: "rune" },
  { id: "town_jeweler", building: "jeweler", name: "VESSARI JEWELS", w: 14, h: 11, door: { x: 6, w: 1 }, tier: "rune" },
  { id: "town_tailor", building: "tailor", name: "THE GOLDEN NEEDLE", w: 16, h: 12, door: { x: 5, w: 1 }, tier: "torch" },
  { id: "town_tavern", building: "tavern", name: "THE SUNKEN CROWN", w: 24, h: 16, door: { x: 11, w: 1 }, tier: "torch" },
  { id: "town_guild", building: "guild", name: "ADVENTURERS' GUILD", w: 22, h: 16, door: { x: 10, w: 2 }, tier: "rune" },
];
export const interiorById = (id: string) => TOWN_INTERIORS.find((r) => r.id === id);

// ---- streets (tiles), shared by the builder and the tests
export const HIGH_STREET = { y0: 44, y1: 46 } as const;
export const SQUARE = { x0: 34, y0: 28, x1: 62, y1: 46 } as const;
export const LANTERN_ROW = { y0: 28, y1: 29 } as const;
export const NORTH_LANE = { y0: 14, y1: 15 } as const;
export const LOW_STREET = { y0: 58, y1: 59 } as const;
export const AURIC_ROAD = { x0: 54, x1: 56 } as const;
/** The old east gate towers; the lamps stop here. */
export const OLD_GATE = { x0: 76, x1: 79 } as const;
export const STREAM = { x0: 12, x1: 15 } as const;

/** Where the old keep road leaves the surface (west edge) and enters the town (east edge), in tiles. */
export const KEEP_ROAD = { surfaceY0: 30, surfaceY1: 32, townY0: HIGH_STREET.y0, townY1: HIGH_STREET.y1 } as const;

// ---------------------------------------------------------------- portals
/**
 * A walk-in connection between areas: stepping into `rect` (px, feet) moves the
 * body to the `link` portal of area `to`, at that portal's `arrive` spot.
 * Roads keep the body's sideways offset across the crossing.
 */
export interface PortalDef {
  id: string;
  area: string;
  rect: { x: number; y: number; w: number; h: number };
  to: string;
  link: string;
  arrive: { x: number; y: number; facing: "down" | "up" | "left" | "right" };
  kind: "door" | "road";
  /** The name shown when arriving through the other side. */
  label: string;
}

function buildPortals(): PortalDef[] {
  const out: PortalDef[] = [];
  // the old keep road: the surface's west edge <-> the town's east edge
  const sy = (KEEP_ROAD.surfaceY0 + KEEP_ROAD.surfaceY1 + 1) / 2 * TS, ty = (KEEP_ROAD.townY0 + KEEP_ROAD.townY1 + 1) / 2 * TS;
  const sh = (KEEP_ROAD.surfaceY1 - KEEP_ROAD.surfaceY0 + 1) * TS, th = (KEEP_ROAD.townY1 - KEEP_ROAD.townY0 + 1) * TS;
  out.push({ id: "road.surface.west", area: "surface", rect: { x: 0, y: KEEP_ROAD.surfaceY0 * TS, w: 9, h: sh }, to: "town", link: "road.town.east",
    arrive: { x: 2 * TS + 8, y: sy + 4, facing: "right" }, kind: "road", label: "THE SURFACE" });
  out.push({ id: "road.town.east", area: "town", rect: { x: TOWN_W * TS - 9, y: KEEP_ROAD.townY0 * TS, w: 9, h: th }, to: "surface", link: "road.surface.west",
    arrive: { x: (TOWN_W - 2) * TS - 8, y: ty + 4, facing: "left" }, kind: "road", label: "WESTERFORD" });
  // shop doors <-> interiors
  for (const r of TOWN_INTERIORS) {
    const b = TOWN_BUILDINGS.find((x) => x.id === r.building)!;
    const d = b.door!, fy = frontRow(b);
    out.push({ id: `door.${b.id}`, area: "town", rect: { x: d.x * TS, y: fy * TS, w: d.w * TS, h: 12 }, to: r.id, link: `door.${r.id}`,
      arrive: { x: d.x * TS + d.w * 8, y: (fy + 1) * TS + 10, facing: "down" }, kind: "door", label: "WESTERFORD" });
    out.push({ id: `door.${r.id}`, area: r.id, rect: { x: r.door.x * TS, y: (r.h - 1) * TS + 5, w: r.door.w * TS, h: 11 }, to: "town", link: `door.${b.id}`,
      arrive: { x: r.door.x * TS + r.door.w * 8, y: (r.h - 2) * TS + 8, facing: "up" }, kind: "door", label: r.name });
  }
  return out;
}

export const PORTALS: PortalDef[] = buildPortals();
export const portalById = (id: string) => PORTALS.find((p) => p.id === id);
export const portalsIn = (area: string) => PORTALS.filter((p) => p.area === area);
