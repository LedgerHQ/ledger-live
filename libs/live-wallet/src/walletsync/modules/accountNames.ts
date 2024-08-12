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
