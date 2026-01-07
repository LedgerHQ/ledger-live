/**
 * @module accountNames
 *
 * This module is responsible for synchronizing custom account names across Live instances
 * in the WalletSync system. It manages the mapping between account IDs and their
 * user-defined names, ensuring that when a user renames an account on one Live instance,
 * that name change is propagated to all other synchronized Live instances.
 *
 * Account names are off-chain data (not stored on the blockchain), and therefore need to
 * be synchronized through the WalletSync system to ensure consistency across all Live instances.
 *
 * Key responsibilities:
 * - Tracks local account name changes and prepares them for synchronization
 * - Resolves incoming account name updates from other Live instances
 * - Handles conflict resolution by accepting incoming state changes (last-write-wins strategy)
 * - Maintains consistency between local state (Map<string, string>) and distant state (Record<string, string>)
 *
 * The module uses a replace-all strategy for updates, meaning any incoming state change
 * will replace the entire account names mapping. While this simplifies conflict resolution,
 * it may result in lost changes if multiple Live instances modify names simultaneously.
 */
import { WalletSyncDataManager } from "../types";
import { z } from "zod";

const schema = z.record(z.string());

const manager: WalletSyncDataManager<
  Map<string, string>,
  {
    replaceAllNames: Record<string, string>;
  },
  typeof schema
> = {
  schema,

  diffLocalToDistant(localData, latestState) {
    const nextState = Object.fromEntries(localData.entries());
    const hasChanges = !sameDistantState(latestState || {}, nextState);
    return {
      hasChanges,
      nextState,
    };
  },

  // NB: current implementation will take any incoming state changes and replace it all. the risk of conflict is limited but possible.
  async resolveIncrementalUpdate(_ctx, localData, latestState, incomingState) {
    if (!incomingState) {
      return { hasChanges: false }; // nothing to do, the data is no longer available
    }

    const hasChanges =
      latestState !== incomingState && // bail out from "local" increment update
      !sameDistantState(Object.fromEntries(localData.entries()), incomingState);

    if (!hasChanges) {
      return { hasChanges: false };
    }
    const update = { replaceAllNames: incomingState };
    return Promise.resolve({
      hasChanges: true,
      update,
    });
  },

  applyUpdate(_localData, update) {
    const data = new Map(Object.entries(update.replaceAllNames));
    return data;
  },
};

function sameDistantState(a: Record<string, string>, b: Record<string, string>) {
  const aEntries = Object.entries(a);
  if (aEntries.length !== Object.keys(b).length) return false;
  for (const [k, v] of aEntries) {
    if (b[k] !== v) return false;
  }
  return true;
}

export default manager;
