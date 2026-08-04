import { z } from "zod";
import type { CloudSyncDataManager } from "@shared/cloud-sync-module";

const schema = z.record(z.string(), z.string());

function sameDistantState(a: Record<string, string>, b: Record<string, string>) {
  const aEntries = Object.entries(a);
  if (aEntries.length !== Object.keys(b).length) return false;
  for (const [k, v] of aEntries) {
    if (b[k] !== v) return false;
  }
  return true;
}

export const accountNamesSyncModule: CloudSyncDataManager<
  Map<string, string>,
  { replaceAllNames: Record<string, string> },
  typeof schema
> = {
  schema,

  diffLocalToDistant(localData: Map<string, string>, latestState: Record<string, string> | null) {
    const nextState = Object.fromEntries(localData.entries());
    const hasChanges = !sameDistantState(latestState ?? {}, nextState);
    return { hasChanges, nextState };
  },

  async resolveIncrementalUpdate(
    localData: Map<string, string>,
    latestState: Record<string, string> | null,
    incomingState: Record<string, string> | null,
  ) {
    if (!incomingState) return { hasChanges: false as const };
    const hasChanges =
      latestState !== incomingState &&
      !sameDistantState(Object.fromEntries(localData.entries()), incomingState);
    if (!hasChanges) return { hasChanges: false as const };
    return { hasChanges: true as const, update: { replaceAllNames: incomingState } };
  },

  applyUpdate(
    _localData: Map<string, string>,
    update: { replaceAllNames: Record<string, string> },
  ) {
    return new Map(Object.entries(update.replaceAllNames));
  },
};
