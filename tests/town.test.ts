// Westerford: the market town west of the surface, its six interiors and the
// walk-in portals that join them (roads off a map's edge, shop doors).
import { test } from "node:test";
import assert from "node:assert/strict";
import { createWorld, player, getArea, enterArea } from "../src/game/world/world";
import { serialize, deserialize } from "../src/game/world/save";
import { stepPlayer } from "../src/game/sim/step";
import { portalAt, portalDestination, portalRoute } from "../src/game/sim/portals";
import { PORTALS, portalById, TOWN_BUILDINGS, TOWN_INTERIORS, frontRow, HIGH_STREET, SQUARE } from "../src/game/content/town";
import { AREAS } from "../src/game/world/areas";
import { AREA_NAMES } from "../src/game/content/geography";
import { reachable, type Box } from "../src/game/sim/reach";
import { boxFree } from "../src/game/sim/collision";
import { propDef } from "../src/game/content/props";
import { TS, T } from "../src/game/content/tiles";
import type { AreaData } from "../src/game/map";

const AREA_IDS = ["town", ...TOWN_INTERIORS.map((r) => r.id)];
const boxes = (a: AreaData): Box[] => a.props.flatMap((p) => { const b = propDef(p.kind).box; return b ? [[p.x - b[0] / 2, p.y - b[1], p.x + b[0] / 2, p.y] as Box] : []; });
const reachFrom = (a: AreaData, x: number, y: number) => reachable({ w: a.w, h: a.h, grid: a.grid }, boxes(a), { x, y });

test("the town and every interior are registered, named and build deterministically", () => {
  for (const id of AREA_IDS) {
    assert.ok(AREAS[id], id); assert.ok(AREA_NAMES[id], `${id} has a name`);
    const a = AREAS[id](), b = AREAS[id]();
    assert.deepEqual(a.grid, b.grid); assert.deepEqual(a.props, b.props); assert.deepEqual(a.decals, b.decals);
    assert.equal(new Set(a.props.map((p) => p.id)).size, a.props.length, `${id}: prop ids are unique`);
  }
  for (const b of TOWN_BUILDINGS) assert.ok(propDef(`bld.${b.id}`), b.id);
});

test("every portal links to one that links back, and lands on free ground outside any portal", () => {
  for (const p of PORTALS) {
    const link = portalById(p.link)!;
    assert.ok(link, p.id); assert.equal(link.area, p.to, p.id); assert.equal(link.link, p.id, `${p.id} round trip`);
    const a = getArea(createWorld(1), link.area);
    assert.ok(boxFree(a, link.arrive.x, link.arrive.y), `${link.id} arrival is free`);
    assert.equal(portalAt(link.area, link.arrive.x, link.arrive.y), null, `${link.id} arrival is outside every portal`);
  }
  // six establishments, each a door out and a door in, plus the road both ways
  assert.equal(PORTALS.length, 2 + TOWN_INTERIORS.length * 2);
});

test("every door, the square and the road are reachable on foot from where the road arrives", () => {
  const t = AREAS.town(), start = portalById("road.town.east")!.arrive, reach = reachFrom(t, start.x, start.y);
  const at = (tx: number, ty: number) => reach[ty * t.w + tx] === 1;
  for (const b of TOWN_BUILDINGS.filter((b) => b.door)) for (let x = b.door!.x; x < b.door!.x + b.door!.w; x++) {
    assert.equal(t.grid[frontRow(b) * t.w + x], T.FLOOR, `${b.id} door notch`);
    assert.ok(at(x, frontRow(b) + 1), `${b.id}: the street in front of its door is reachable`);
  }
  assert.ok(at(49, 33) && at(SQUARE.x0 + 2, HIGH_STREET.y0 + 1), "the square and the High Street");
  assert.ok(at(14, HIGH_STREET.y0 + 1), "the bridge");
  // the surface's end of the road reaches the rune
  const s = AREAS.surface(), sp = portalById("road.surface.west")!.arrive, sr = reachFrom(s, sp.x, sp.y);
  assert.ok(sr[Math.floor((s.start.y - 1) / TS) * s.w + Math.floor(s.start.x / TS)] === 1, "surface road reaches the rune clearing");
});

test("inside, the counter has a clear lane on both sides and the room is reachable from the door", () => {
  for (const r of TOWN_INTERIORS) {
    const a = AREAS[r.id](), arrive = portalById(`door.${r.id}`)!.arrive, reach = reachFrom(a, arrive.x, arrive.y);
    const c = a.props.find((p) => p.id === "counter" || p.id === "bar")!;
    assert.ok(c, `${r.id} has a counter`);
    const cx = Math.floor(c.x / TS), front = Math.floor(c.y / TS) + 1, back = Math.floor((c.y - 12) / TS) - 1;
    const near = (ty: number) => [-1, 0, 1].some((dx) => reach[ty * a.w + cx + dx] === 1);
    assert.ok(near(front), `${r.id}: customers can stand in front of the counter`);
    assert.ok(near(back), `${r.id}: the keeper's lane behind the counter is reachable`);
  }
});

test("walking: surface west edge -> town -> into the smithy and back out, then a save/load inside", () => {
  const w = createWorld(7), pl = player(w);
  const walk = (ix: number, iy: number, secs: number, until?: () => boolean) => { for (let t = 0; t < secs; t += 1 / 30) { stepPlayer(w, 1 / 30, { ix, iy, use: false }); if (until?.()) return; } };
  enterArea(w, pl, "surface", 2 * TS + 8, 31 * TS + 8);
  walk(-1, 0, 3, () => pl.area === "town");
  assert.equal(pl.area, "town"); assert.equal(pl.facing, "left");
  assert.ok(pl.y >= HIGH_STREET.y0 * TS && pl.y < (HIGH_STREET.y1 + 1) * TS, "arrived on the High Street");
  assert.ok(w.events.some((e) => e.t === "portal" && e.to === "town" && e.label === "WESTERFORD"));
  const front = portalById("door.smithy")!.arrive;
  enterArea(w, pl, "town", front.x, front.y);
  walk(0, -1, 3, () => pl.area !== "town");
  assert.equal(pl.area, "town_smithy");
  walk(0, 1, 3, () => pl.area !== "town_smithy");
  assert.equal(pl.area, "town"); assert.equal(pl.facing, "down");
  enterArea(w, pl, "town_tavern", portalById("door.town_tavern")!.arrive.x, portalById("door.town_tavern")!.arrive.y);
  const w2 = deserialize(JSON.parse(JSON.stringify(serialize(w))));
  assert.equal(player(w2).area, "town_tavern");
  // and back east along the road
  enterArea(w, pl, "town", (96 - 2) * TS, (HIGH_STREET.y0 + 1) * TS + 8);
  walk(1, 0, 3, () => pl.area !== "town");
  assert.equal(pl.area, "surface");
});

test("roads keep the sideways offset; the portal graph routes from the surface to any shop", () => {
  const road = portalById("road.surface.west")!;
  const top = portalDestination(road, 6, road.rect.y + 4)!, bottom = portalDestination(road, 6, road.rect.y + road.rect.h - 4)!;
  assert.ok(top.y < bottom.y);
  assert.deepEqual(portalRoute("surface", "town_tavern"), ["road.surface.west", "door.tavern"]);
  assert.deepEqual(portalRoute("town_guild", "town_jeweler"), ["door.town_guild", "door.jeweler"]);
  assert.equal(portalRoute("dungeon", "town"), null, "the dungeon only connects by rune");
});
