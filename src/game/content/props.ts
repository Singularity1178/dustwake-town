// Prop kind definitions (data). Sprites stay procedural in art.ts (keyed by
// kind); behaviour that used to be scattered `kind === "..."` checks in the game
// class lives here.
import { TOWN_BUILDINGS } from "./town";
import { TS } from "./tiles";

export interface PropLightDef {
  dx: number; dy: number; rad: number; col: [number, number, number]; int: number; flick: number;
  /** "lit": only emitted while the prop is lit. "always": emitted unconditionally. */
  when: "lit" | "always";
}

export interface PropKindDef {
  /** Generic inventory, separate from a one-shot story container. */
  storage?: { slots: number };
  /** Reuse existing art without reusing its gameplay kind. */
  art?: string;
  /** Collision footprint [w, h], centred on x, ending at y. */
  box?: [number, number];
  /** Sorted just in front of the wall it hangs on. */
  wallMounted?: boolean;
  /** Which state selects the alternate sprite. Default "open". */
  alt?: "lit" | "taken" | "open";
  light?: PropLightDef;
  /** Fire visuals while lit. */
  fire?: { big: boolean; embers: number; emberDy: number; /** Flame height above the anchor (px; default 15). Facade torches sit higher. */ fy?: number };
  /** Chimneys: smoke rises from these offsets (px from the anchor; presentation only). */
  smoke?: { dx: number; dy: number }[];
  /** Horizontal offset of an item icon resting on the prop. */
  itemDx?: number;
  /** A teleportation rune site (see content/runes.ts). Drawn as a floor circle, not a sprite. */
  rune?: boolean;
  /** Interacting shows this text (ruins, landmarks). */
  examine?: string;
  /** Lies flat on the ground: always drawn beneath actors. */
  flat?: boolean;
  /** Foliage that sways in the wind (presentation only): the sprite's upper part shifts by up to 1px. */
  sway?: boolean;
  /**
   * A work station: interacting runs the `station` rule, whose `useStation`
   * effect asks presentation to open this UI (see content/crafting.ts).
   */
  station?: "crafting";
}

export const PROPS: Record<string, PropKindDef> = {
  bookshelf: { box: [16, 8] }, shelfrow: { box: [16, 10] }, shelf_fallen: { box: [28, 10] }, table: { box: [28, 10] },
  lectern: { box: [10, 6] }, chair: { box: [8, 5] }, bed: { box: [14, 26] }, footlocker: { box: [12, 6] },
  weaponrack: { box: [24, 6] }, limbrack: { box: [22, 6], alt: "taken" }, armorstand: { box: [10, 5] },
  barrel: { box: [12, 7] }, crate: { box: [14, 8] }, statue: { box: [18, 10] }, statue_fallen: { box: [30, 10] },
  throne: { box: [30, 14] }, maptable: { box: [28, 10], alt: "taken" }, altar: { box: [30, 10] }, pew: { box: [36, 6] },
  // The workbench is the crafting station: the dungeon's authored one and the buildable CRAFTING BENCH are the same prop.
  // While something rests on it (the dungeon's chisel) taking that comes first; see deriveInteractables.
  workbench: { box: [32, 10], itemDx: -6, station: "crafting" }, forge: { box: [32, 12] }, anvil: { box: [14, 6] }, cradle: { box: [28, 5] },
  slab: { box: [36, 10] }, hearth: { box: [36, 10] }, longtable: { box: [50, 10] }, bench: { box: [44, 4] },
  chest: { box: [16, 8] }, pot: { box: [10, 6] }, fountain: { box: [32, 14] }, pedestal: { box: [10, 5] },
  storage_chest: { box: [14, 8], storage: { slots: 32 }, art: "chest" },
  sack: { box: [10, 5] }, parts: { box: [16, 5] },
  brazier: {
    box: [12, 6], alt: "lit",
    light: { dx: 0, dy: -4, rad: 96, col: [1, 0.58, 0.3], int: 0.9, flick: 0.2, when: "lit" },
    fire: { big: true, embers: 4, emberDy: 0 },
  },
  torch: {
    wallMounted: true, alt: "lit",
    light: { dx: 0, dy: 6, rad: 84, col: [1, 0.62, 0.32], int: 0.85, flick: 0.22, when: "lit" },
    fire: { big: false, embers: 1.5, emberDy: 1 },
  },
  mushrooms: { light: { dx: 0, dy: -3, rad: 44, col: [0.35, 0.95, 0.8], int: 0.55, flick: 0.04, when: "always" } },
  banner: { wallMounted: true },
  // ---- surface
  tree: { box: [10, 6], alt: "taken", sway: true },
  rock: { box: [16, 8], alt: "taken" },
  torch_post: {
    box: [6, 4], alt: "lit",
    light: { dx: 0, dy: -14, rad: 96, col: [1, 0.62, 0.32], int: 0.9, flick: 0.22, when: "lit" },
    fire: { big: false, embers: 1.5, emberDy: -2 },
  },
  cart: { box: [30, 10] },
  // ---- buildables (content/build.ts)
  /** Sharpened stakes: blocks the whole tile width. */
  barricade: { box: [16, 7] },
  // The old surface gate, buried: no collision, no visible opening. Only a low
  // mound where the arch top lies, and a hollow sound if you go looking.
  buriedgate: { flat: true, examine: "THE GROUND HERE SOUNDS HOLLOW UNDERFOOT." },
  // ---- surface overgrowth (decorative; small boxes so the woods have texture)
  bush: { box: [12, 5], sway: true },
  fern: { sway: true },
  tallgrass: { sway: true },
  sapling: { box: [4, 3], sway: true },
  stump: { box: [10, 5] },
  log: { box: [30, 7], alt: "taken" },
  boulder: { box: [22, 9] },
  outcrop: { box: [40, 12] },
  // ---- the few remains that still break the surface (moss- and vine-covered)
  wallstub: { box: [30, 9], examine: "OLD MASONRY, HALF SWALLOWED BY THE EARTH." },
  masonry: { box: [18, 8] },
  stoneslab: { flat: true },
  cairn: { box: [14, 6] },
  standingstone: { box: [12, 6] },
  statue_toppled: { box: [30, 10] },
  /** A squared block peeking through the soil along a buried wall line. */
  capstone: { flat: true, examine: "A SQUARED STONE, SUNK DEEP. THE EARTH AROUND IT RINGS HOLLOW." },
  // ---- dungeon: the collapsed surface gate
  rockpile: { box: [16, 8] },
  runesite: { rune: true },
  runecircle: { rune: true },
  chains: { wallMounted: true },
};


// ---- Westerford (content/town.ts). Light colours carry the town's divide:
// rune lamps burn a steady, cool blue-white; torches and hearths a warm,
// guttering orange.
const RUNE_COL: [number, number, number] = [0.6, 0.8, 1];
const TORCH_COL: [number, number, number] = [1, 0.62, 0.32];
const runeLight = (dy: number, rad: number, int = 0.95) => ({ dx: 0, dy, rad, col: RUNE_COL, int, flick: 0.03, when: "always" as const });
const TOWN_PROPS: Record<string, PropKindDef> = {
  // lights
  runelamp: { box: [6, 4], light: runeLight(-8, 124) },
  runelamp_wall: { light: runeLight(2, 96, 0.85) },
  walltorch: {
    alt: "lit", light: { dx: 0, dy: 2, rad: 84, col: TORCH_COL, int: 0.85, flick: 0.22, when: "lit" },
    fire: { big: false, embers: 1.5, emberDy: -1, fy: 23 },
  },
  runesconce: { wallMounted: true, light: runeLight(10, 104, 0.9) },
  runechandelier: { light: runeLight(-6, 140, 1) },
  candelabra: { box: [8, 4], light: { dx: 0, dy: -14, rad: 64, col: [1, 0.7, 0.4], int: 0.75, flick: 0.16, when: "always" } },
  tablecandle: { light: { dx: 0, dy: -10, rad: 46, col: [1, 0.7, 0.4], int: 0.6, flick: 0.18, when: "always" } },
  smithforge: {
    box: [36, 12], alt: "lit", light: { dx: 0, dy: -8, rad: 132, col: [1, 0.48, 0.2], int: 1.05, flick: 0.26, when: "lit" },
    fire: { big: true, embers: 7, emberDy: -6, fy: 13 },
  },
  bighearth: {
    box: [40, 10], alt: "lit", light: { dx: 0, dy: -4, rad: 140, col: [1, 0.56, 0.26], int: 1, flick: 0.24, when: "lit" },
    fire: { big: true, embers: 4, emberDy: -2, fy: 9 },
  },
  // the street
  stall: { box: [32, 8] },
  well: { box: [24, 10], examine: "THE OLD WELL. ITS RING IS DRESSED STONE, FINER THAN ANYTHING ELSE IN THE OLD QUARTER." },
  lampstone: { box: [16, 8], light: runeLight(-14, 150, 1), examine: "A PLAQUE: THE FIRST LAMP OF WESTERFORD, LIT BY THE GUILD. LET NO HONEST TRADE WANT FOR LIGHT." },
  trough: { box: [28, 6] },
  noticeboard: { box: [24, 4], examine: "NOTICES, LAYERED THICK: A LOST MULE, A FEAST DAY, A PRICE ON WOLF PELTS, LABOUR GOLEMS FOR HIRE." },
  signpost: { box: [4, 3], examine: "EAST: THE OLD KEEP ROAD (UNKEPT). NORTH: THE AURIC ROAD, TO THE CAPITAL. WEST: THE MILL." },
  milestone: { box: [8, 4], examine: "A MILESTONE, NEWER THAN THE ROAD: WESTERFORD, WEST. THE EAST FACE IS BLANK." },
  gateplaque: { box: [6, 3], examine: "THE OLD EAST GATE. ITS ARCH WAS TAKEN DOWN SO THE HAULING GOLEMS AND TALL LOADS COULD PASS." },
  shrine: { box: [14, 6], examine: "A WAYSIDE SHRINE, OLDER THAN THE MARKET. ITS BASE IS A CARVED BLOCK: AN EYE WITHIN A TRIANGLE." },
  bench_town: { box: [28, 4] },
  handcart: { box: [26, 8] },
  haulsledge: { box: [34, 10] },
  golemberth: { box: [30, 10], examine: "AN EMPTY LABOUR BERTH. TWO WORN HOLLOWS IN THE PLINTH, A TETHER RING, A CHALKED TALLY OF LOADS." },
  stonestack: { box: [24, 8] },
  roadbarrier: { box: [44, 6], examine: "ROAD CLOSED. THE AURIC ROAD IS BEING RESET BY THE LABOUR YARD." },
  hedge: { box: [16, 8] },
  fence: { box: [16, 3] },
  fence_v: { box: [4, 16] },
  lowwall: { box: [16, 6] },
  oldwall: { box: [14, 14] },
  haybale: { box: [16, 7] },
  woodpile: { box: [28, 8] },
  laundry: {},
  bridgerail: { box: [64, 4] },
  plankrail: { box: [64, 3] },
  millwheel: { flat: false },
  steppingstone: { flat: true },
  cabbages: { flat: true },
  coalheap: { box: [24, 7] },
  planter: { box: [12, 4] },
  // interiors
  counter: { box: [48, 10] },
  counter_s: { box: [32, 10] },
  quench: { box: [28, 8] },
  grindstone: { box: [16, 6] },
  bellows: { box: [18, 8] },
  toolrack: { wallMounted: true },
  horseshoes: { wallMounted: true },
  coalbin: { box: [20, 8] },
  plate_stand: { box: [12, 5] },
  shieldwall: { wallMounted: true },
  swordcase: { box: [30, 8] },
  strongbox: { box: [16, 6] },
  glasscase: { box: [28, 8] },
  vaultdoor: { wallMounted: true },
  jewelbench: { box: [30, 8] },
  curtain: { wallMounted: true },
  clothbolts: { box: [32, 6] },
  dressform: { box: [8, 4] },
  cuttingtable: { box: [40, 10] },
  spinwheel: { box: [16, 6] },
  loom: { box: [32, 10] },
  mirror: { wallMounted: true },
  bar: { box: [64, 10] },
  kegrack: { box: [40, 8] },
  bottleshelf: { wallMounted: true },
  roundtable: { box: [20, 8] },
  stool: { box: [6, 3] },
  stairs: { box: [28, 14] },
  trophyhead: { wallMounted: true },
  questboard: { wallMounted: true },
  guildbanner: { wallMounted: true },
  ledgerdesk: { box: [30, 8] },
  window_in: { wallMounted: true },
  painting: { wallMounted: true },
  wallshelf: { wallMounted: true },
  plant: { box: [10, 5] },
  doorframe: { wallMounted: true },
};
/** One kind per town building (bld.<id>): no box, its footprint is BUILDING tiles; chimneys smoke. */
for (const b of TOWN_BUILDINGS) {
  TOWN_PROPS[`bld.${b.id}`] = { smoke: (b.look.chimneys ?? []).map((f) => ({ dx: Math.round((f - 0.5) * b.w * TS), dy: -(b.d * TS + 4) })) };
}
TOWN_PROPS.gatetower = { examine: "THE OLD EAST GATE. ITS ARCH WAS TAKEN DOWN SO THE HAULING GOLEMS AND TALL LOADS COULD PASS." };
Object.assign(PROPS, TOWN_PROPS);

const NONE: PropKindDef = {};
export const propDef = (kind: string): PropKindDef => PROPS[kind] ?? NONE;

/** Interaction radius used for props (matches the original tuning). */
export const propReach = (kind: string) => Math.min(30, 12 + (propDef(kind).box?.[0] ?? 12) / 2);
