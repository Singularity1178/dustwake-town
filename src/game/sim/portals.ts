// Walk-in connections between areas (roads off a map's edge, shop doors).
// Pure sim, no DOM: stepping into a portal's rect moves the body to the linked
// portal's arrival spot through enterArea, exactly like rune travel lands it
// (its own footprint, nearest free spot, never overlapping another body).
// Portals are data (content/town.ts: PORTALS); `portalRoute` is the seam for
// future NPC pathing across doors and roads (a static graph, like runeRoute).
import { PORTALS, portalById, portalsIn, type PortalDef } from "../content/town";
import { emit, enterArea, getArea, type Actor, type World } from "../world/world";
import { nearestFree, actorBoxes } from "./collision";
import { actorDef } from "../content/actors";

export type { PortalDef } from "../content/town";

/** The portal whose rect holds the point (feet), if any. */
export function portalAt(area: string, x: number, y: number): PortalDef | null {
  for (const p of portalsIn(area)) if (x >= p.rect.x && x < p.rect.x + p.rect.w && y >= p.rect.y && y < p.rect.y + p.rect.h) return p;
  return null;
}

/** Where a body stepping into `p` at (x, y) lands: the linked portal's arrival, roads keeping the sideways offset. */
export function portalDestination(p: PortalDef, x: number, y: number): { area: string; x: number; y: number; facing: PortalDef["arrive"]["facing"]; link: PortalDef } | null {
  const link = portalById(p.link);
  if (!link || link.area !== p.to) return null;
  let ax = link.arrive.x, ay = link.arrive.y;
  if (p.kind === "road") {
    const horizontal = link.arrive.facing === "left" || link.arrive.facing === "right";
    if (horizontal) { const off = y - (p.rect.y + p.rect.h / 2); ay = Math.max(link.rect.y + 6, Math.min(link.rect.y + link.rect.h - 2, link.arrive.y - 4 + off)); }
    else { const off = x - (p.rect.x + p.rect.w / 2); ax = Math.max(link.rect.x + 6, Math.min(link.rect.x + link.rect.w - 6, link.arrive.x + off)); }
  }
  return { area: link.area, x: ax, y: ay, facing: link.arrive.facing, link };
}

/**
 * Take the portal under an actor's feet, if any (only while it is free to act:
 * no task in progress). Returns the portal taken, or null.
 */
export function stepPortal(w: World, a: Actor): PortalDef | null {
  if (a.task) return null;
  const p = portalAt(a.area, a.x, a.y);
  if (!p) return null;
  const d = portalDestination(p, a.x, a.y);
  if (!d) return null;
  const dest = getArea(w, d.area);
  const spot = nearestFree(dest, d.x, d.y, actorBoxes(w, dest.id, a.id), actorDef(a).body.box);
  if (!spot || portalAt(d.area, spot.x, spot.y)) return null;
  const from = a.area;
  enterArea(w, a, d.area, spot.x, spot.y);
  a.facing = d.facing;
  emit(w, { t: "portal", actor: a.id, from, to: d.area, portal: p.id, kind: p.kind, label: d.link.label });
  return p;
}

/** Portal hops from one area to another over the static portal graph (breadth first, stable order), or null. */
export function portalRoute(from: string, to: string): string[] | null {
  if (from === to) return [];
  const prev = new Map<string, { area: string; via: string }>([[from, { area: "", via: "" }]]);
  const queue = [from];
  for (let i = 0; i < queue.length; i++) {
    const area = queue[i];
    for (const p of [...portalsIn(area)].sort((a, b) => (a.id < b.id ? -1 : 1))) {
      if (prev.has(p.to)) continue;
      prev.set(p.to, { area, via: p.id });
      if (p.to === to) {
        const hops: string[] = [];
        for (let k = to; k !== from; k = prev.get(k)!.area) hops.unshift(prev.get(k)!.via);
        return hops;
      }
      queue.push(p.to);
    }
  }
  return null;
}

export { PORTALS };
