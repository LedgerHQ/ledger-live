import type { RegionSideEffects, RegionUpdate } from "../../ports";
import { toAllowedRegionLocale } from "./regionChoices";

/** Tells whether a change of the Settings port is the Region one. */
export function isRegionUpdate(update: Readonly<{ key: string }>): update is RegionUpdate {
  return update.key === "region";
}

/** Runs the side effect of a Region change: a sanctioned region is stored as `en-US`. */
export function applyRegionUpdate(effects: RegionSideEffects, update: RegionUpdate): void {
  effects.setRegion(toAllowedRegionLocale(update.value));
}
