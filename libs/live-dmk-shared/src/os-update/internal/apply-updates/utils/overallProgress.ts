import {
  FINAL_WEIGHT,
  FLASH_DECAY,
  FLASH_WEIGHT,
  OSU_WEIGHT,
  RESTORE_WEIGHT,
  UPDATES_WEIGHT,
} from "../constants";
import type { ApplyUpdatesStateMachineContext } from "../types";

export type OverallProgressContext = Pick<
  ApplyUpdatesStateMachineContext,
  | "osUpdates"
  | "updateIndex"
  | "osuProgress"
  | "flashesDone"
  | "currentFlashProgress"
  | "flashCompleted"
  | "finalProgress"
  | "restoreProgress"
  | "lastProgress"
>;

/**
 * The flash loop is unbounded. A device can need any number of MCU and bootloader passes, so its
 * term cannot be a ratio. Each pass instead covers a fixed share of what is left, which approaches
 * 1 without ever reaching it, and the term is snapped once the loop is left.
 */
const flashTerm = (context: OverallProgressContext, hasFlash: boolean): number => {
  if (!hasFlash || context.flashCompleted) {
    return 1;
  }
  return 1 - FLASH_DECAY ** (context.flashesDone + context.currentFlashProgress);
};

/**
 * The share of the bar the updates have covered, with work that will not happen snapped to 1 so the
 * bar jumps over it rather than leaving a gap nothing will ever fill.
 */
const updatesTerm = (context: OverallProgressContext): number => {
  const updateCount = context.osUpdates.length;
  if (updateCount === 0) {
    return 0;
  }

  const currentUpdate = context.osUpdates[context.updateIndex];
  const hasFinalFirmware = Boolean(currentUpdate?.finalFirmware.firmware);
  const inner =
    OSU_WEIGHT * context.osuProgress +
    FLASH_WEIGHT * flashTerm(context, Boolean(currentUpdate?.shouldFlashMcu)) +
    FINAL_WEIGHT * (hasFinalFirmware ? context.finalProgress : 1);

  return (context.updateIndex + inner) / updateCount;
};

/**
 * Clamped monotonic: the terms are recomputed from a different mix at each phase, and the bar must
 * never go backwards on the screen. The restore runs in a step of its own and reports 0 to 1,
 * which is taken as is and only ever weighted here.
 */
export const overallProgress = (context: OverallProgressContext): number => {
  const overall = updatesTerm(context) * UPDATES_WEIGHT + context.restoreProgress * RESTORE_WEIGHT;
  return Math.min(1, Math.max(context.lastProgress, overall));
};
