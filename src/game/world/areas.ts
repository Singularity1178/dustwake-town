// Area registry: area id -> deterministic builder. Saves store only per-area
// diffs against these builders, so builders must be deterministic.
import { buildDungeon, type AreaData } from "../map";
import { buildSurface } from "../surface";
import { buildTown } from "../town";
import { INTERIOR_BUILDERS } from "../townInteriors";

export const AREAS: Record<string, () => AreaData> = {
  dungeon: buildDungeon,
  surface: buildSurface,
  town: buildTown,
  ...INTERIOR_BUILDERS,
};
