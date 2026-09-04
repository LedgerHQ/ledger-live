import type { CloudSyncDataManager } from "@shared/cloud-sync-module";
import { parseAnyAccountId, type AnyAccountId } from "@shared/schema-primitives";
import {
  AccountNamesDistantSchema,
  type AccountNamesDistantState,
  type AccountNamesState,
} from "./schema";

function sameDistantState(a: AccountNamesDistantState, b: AccountNamesDistantState) {
  const aEntries = Object.entries(a);
  if (aEntries.length !== Object.keys(b).length) return false;
  for (const [k, v] of aEntries) {
    if (b[k] !== v) return false;
  }
  return true;
}

export const accountNamesSyncModule: CloudSyncDataManager<
  AccountNamesState,
  { replaceAllNames: AccountNamesDistantState },
  typeof AccountNamesDistantSchema
> = {
  schema: AccountNamesDistantSchema,

  diffLocalToDistant(localData: AccountNamesState, latestState: AccountNamesDistantState | null) {
    const nextState = Object.fromEntries(localData.entries());
    const hasChanges = !sameDistantState(latestState ?? {}, nextState);
    return { hasChanges, nextState };
  },

  async resolveIncrementalUpdate(
    localData: AccountNamesState,
    latestState: AccountNamesDistantState | null,
    incomingState: AccountNamesDistantState | null,
  ) {
    if (!incomingState) return { hasChanges: false as const };
    const hasChanges =
      latestState !== incomingState &&
      !sameDistantState(Object.fromEntries(localData.entries()), incomingState);
    if (!hasChanges) return { hasChanges: false as const };
    return { hasChanges: true as const, update: { replaceAllNames: incomingState } };
  },

  applyUpdate(
    _localData: AccountNamesState,
    update: { replaceAllNames: AccountNamesDistantState },
  ) {
    const entries: [AnyAccountId, string][] = [];
    for (const [id, name] of Object.entries(update.replaceAllNames)) {
      try {
        entries.push([parseAnyAccountId(id), name]);
      } catch {
        // skip malformed ids from cloud payload
      }
    }
    return new Map(entries);
  },
};
