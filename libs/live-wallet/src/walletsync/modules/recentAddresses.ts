/**
 * @module recentAddresses
 *
 * This module is responsible for synchronizing recent addresses across Wallet instances
 * in the WalletSync system. It manages an ordered list of recently used addresses,
 * ensuring that when a user accesses an address on one Live instance, that address
 * (and its position in the recent list) is propagated to all other synchronized Live instances.
 *
 * Recent addresses are off-chain data (not stored on the blockchain), and therefore need to
 * be synchronized through the WalletSync system to ensure consistency across all Live instances.
 *
 * Key responsibilities:
 * - Tracks local recent address changes and prepares them for synchronization
 * - Resolves incoming recent address updates from other Live instances
 * - Maintains the order/index of addresses in the recent list
 * - Handles conflict resolution by accepting incoming state changes (last-write-wins strategy)
 * - Maintains consistency between local state (string[]) and distant state (RecentAddressesState[])
 *
 * The module preserves the index/position of each address, allowing the UI to maintain
 * a consistent ordering of recently used addresses across all synchronized Live instances.
 */

import { z } from "zod";
import { WalletSyncDataManager } from "../types";
import { RecentAddressesState } from "@ledgerhq/types-live";

/**
 * We dont use the same data structure for remote state
 * An index attribute has been added to keep the order (recomputed locally)
 */
export type DistantRecentAddressesState = Record<
  string,
  {
    address: string;
    index: number;
  }[]
>;

function toDistantState(addressesByCurrency: RecentAddressesState): DistantRecentAddressesState {
  const state: DistantRecentAddressesState = {};
  Object.keys(addressesByCurrency).forEach(key => {
    state[key] = addressesByCurrency[key].map((address, index) => ({ address, index }));
  });

  return state;
}

function toState(addressesByCurrency: DistantRecentAddressesState): RecentAddressesState {
  const state: RecentAddressesState = {};
  Object.keys(addressesByCurrency).forEach(key => {
    state[key] = addressesByCurrency[key]
      .sort((current, other) => current.index - other.index)
      .map(data => data.address);
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
        !distantState[key].find(
          data =>
            data.index < 0 ||
            data.index >= localData[key].length ||
            localData[key][data.index] !== data.address,
        )
      );
    })
  );
}

const recentAddressesSchema = z.object({
  address: z.string(),
  index: z.number(),
});

const schema = z.record(z.string(), z.array(recentAddressesSchema));

const manager: WalletSyncDataManager<RecentAddressesState, RecentAddressesState, typeof schema> = {
  schema,
  diffLocalToDistant(localData, latestState) {
    if (!sameDistantState(localData, latestState ?? {})) {
      return {
        hasChanges: true,
        nextState: toDistantState(localData),
      };
    }

    return {
      hasChanges: false,
      nextState: latestState ?? {},
    };
  },
  async resolveIncrementalUpdate(_ctx, localData, latestState, incomingState) {
    if (!incomingState) {
      return { hasChanges: false };
    }

    if (latestState === incomingState || sameDistantState(localData, incomingState)) {
      return { hasChanges: false };
    }

    return Promise.resolve({
      hasChanges: true,
      update: toState(incomingState),
    });
  },
  applyUpdate(_localData, update) {
    return update;
  },
};

export default manager;
