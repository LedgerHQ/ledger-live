import { z } from "zod";
import { ExtractLocalState, ExtractUpdateEvent, UpdateDiff, WalletSyncDataManager } from "./types";

/**
 * an aggregator takes a bunch of WalletSyncDataManager modules and make a top-level WalletSyncDataManager one.
 * In this root WalletSyncDataManager, the data is segmented into JS Object fields (one field = one module)
 * and under modules/ folder: each module implements a WalletSyncDataManager at the field level of the main data.
 */
export function createAggregator<Mods extends Record<string, WalletSyncDataManager<any, any, any>>>(
  modules: Mods,
) {
  const schema = z.object(mapValues(modules, m => z.optional(m.schema)));

  type Schema = typeof schema;
  type DistantState = { [K in keyof Mods]?: z.infer<Mods[K]["schema"]> };
  type LocalState = { [K in keyof Mods]: ExtractLocalState<Mods[K]> };
  type UpdateEvent = { [K in keyof Mods]: UpdateDiff<ExtractUpdateEvent<Mods[K]>> };

  const root: WalletSyncDataManager<LocalState, UpdateEvent, Schema, DistantState> = {
    schema,

    diffLocalToDistant(localData, latestState) {
      let hasChanges = false;

      // to be forward compatible, we must also preserve the fields we don't know yet.
      const unknownRest: Record<string, unknown> = { ...latestState };

      // Aggregate all diffs from each module
      const nextState = mapValues(modules, (m, k) => {
        const diff = m.diffLocalToDistant(
          localData[k],
          latestState && latestState[k] ? latestState[k] : null,
        );
        delete unknownRest[k as string];
        if (diff.hasChanges) {
          hasChanges = true;
        }
        return diff.nextState;
      });

      return {
        hasChanges,
        nextState: {
          ...nextState,
          ...unknownRest,
        },
      };
    },

    async resolveIncrementalUpdate(ctx, localData, latestState, incomingState) {
      // Aggregate all promises resulting of each module resolveIncrementalUpdate
      const resolved = mapValues(modules, (m, k) =>
        m.resolveIncrementalUpdate(
          ctx,
          localData[k],
          latestState && latestState[k] ? latestState[k] : null,
          (incomingState && incomingState[k]) || null,
        ),
      );

      // wait for all promises
      const results = await Promise.all(Object.values(resolved));
      const hasChanges = results.some(r => r.hasChanges);
      let index = 0;
      const update = mapValues(modules, () => results[index++]) as UpdateEvent;

      // returns the partial updates
      return !hasChanges ? { hasChanges: false } : { hasChanges: true, update };
    },

    applyUpdate(localData, update) {
      // apply all updates to each module and aggregate
      const result = mapValues(modules, (m, k) => {
        const up = update[k];
        return up.hasChanges ? m.applyUpdate(localData[k], up.update) : localData[k];
      });
      return result;
    },
  };
  return root;
}

export function mapValues<T extends object, U>(
  obj: T,
  fn: (value: T[keyof T], key: keyof T) => U,
): { [K in keyof T]: U } {
  const result = {} as { [K in keyof T]: U };
  for (const key in obj) {
    result[key] = fn(obj[key], key);
  }
  return result;
}
