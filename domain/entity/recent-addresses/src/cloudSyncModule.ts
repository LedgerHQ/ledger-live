import { z } from "zod";
import type { CloudSyncDataManager } from "@shared/cloud-sync-module";
import type { RecentAddressesState } from "./schema";

const RecentAddressDistantSchema = z.object({
  address: z.string(),
  index: z.number(),
  lastUsed: z.number().optional(),
});

export const RecentAddressesDistantSchema = z.record(
  z.string(),
  z.array(RecentAddressDistantSchema),
);

type DistantRecentAddressesState = z.infer<typeof RecentAddressesDistantSchema>;

function toDistantState(addressesByCurrency: RecentAddressesState): DistantRecentAddressesState {
  const state: DistantRecentAddressesState = {};
  Object.keys(addressesByCurrency).forEach(key => {
    state[key] = addressesByCurrency[key].map((entry, index) => ({
      address: entry.address,
      index,
      lastUsed: entry.lastUsed,
    }));
  });
  return state;
}

function toState(addressesByCurrency: DistantRecentAddressesState): RecentAddressesState {
  const state: RecentAddressesState = {};
  Object.keys(addressesByCurrency).forEach(key => {
    state[key] = [...addressesByCurrency[key]]
      .sort((current, other) => current.index - other.index)
      .map(data => ({ address: data.address, lastUsed: data.lastUsed ?? Date.now() }));
  });
  return state;
}

function sameDistantState(
  localData: RecentAddressesState,
  distantState: DistantRecentAddressesState,
) {
  const localDataKeys = Object.keys(localData);
  const distantStateKeys = Object.keys(distantState);
  return (
    localDataKeys.length === distantStateKeys.length &&
    distantStateKeys.every(key => {
      return (
        localData[key] &&
        localData[key].length === distantState[key].length &&
        !distantState[key].some(data => {
          if (data.index < 0 || data.index >= localData[key].length) return true;
          return localData[key][data.index].address !== data.address;
        })
      );
    })
  );
}

export const recentAddressesSyncModule: CloudSyncDataManager<
  RecentAddressesState,
  RecentAddressesState,
  typeof RecentAddressesDistantSchema
> = {
  schema: RecentAddressesDistantSchema,

  diffLocalToDistant(
    localData: RecentAddressesState,
    latestState: DistantRecentAddressesState | null,
  ) {
    if (!sameDistantState(localData, latestState ?? {})) {
      return { hasChanges: true as const, nextState: toDistantState(localData) };
    }
    return { hasChanges: false as const, nextState: latestState ?? {} };
  },

  async resolveIncrementalUpdate(
    localData: RecentAddressesState,
    latestState: DistantRecentAddressesState | null,
    incomingState: DistantRecentAddressesState | null,
  ) {
    if (!incomingState) return { hasChanges: false as const };
    if (latestState === incomingState || sameDistantState(localData, incomingState)) {
      return { hasChanges: false as const };
    }
    return { hasChanges: true as const, update: toState(incomingState) };
  },

  applyUpdate(_localData: RecentAddressesState, update: RecentAddressesState) {
    return update;
  },
};
