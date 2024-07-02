import { z } from "zod";
import { UpdateDiff, WalletSyncDataManager } from "./types";

// TODO make modules a parameter to create an aggregation, because we will want our tests to have multiple aggregator to test the non regression and backward support of things.

import accounts from "./modules/accounts";
import accountNames from "./modules/accountNames";

const modules = {
  accounts,
  accountNames,
};

type Mods = typeof modules;

const schema = z.object(
  mapValues<Mods, { [K in keyof Mods]: Mods[K]["schema"] }>(modules, m => m.schema),
);

export type Schema = typeof schema;

export type DistantState = z.infer<Schema>;

export type LocalState = { [K in keyof Mods]: ExtractLocalState<Mods[K]> };

export type UpdateEvent = { [K in keyof Mods]: UpdateDiff<ExtractUpdateEvent<Mods[K]>> };

/**
 * Tips for integrations:
 * - you typically will have a selector for providing LocalState
 * - you should also have it for latestState which needs to be persisted in order for the diff to properly work incrementally
 */

const root: WalletSyncDataManager<LocalState, UpdateEvent, Schema, DistantState> = {
  schema,

  diffLocalToDistant(localData, latestState) {
    let hasChanges = false;

    // to be forward compatible, we must also preserve the fields we don't know yet.
    const unknownRest: Record<string, unknown> = { ...latestState };

    // Aggregate all diffs from each module
    const nextState = mapValues<Mods, DistantState>(modules, (m, k) => {
      const diff = m.diffLocalToDistant(
        // @ts-expect-error can't seems to properly infer dynamic type
        localData[k],
        latestState ? latestState[k] : null,
      );
      delete unknownRest[k];
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

  async resolveIncomingDistantState(ctx, localData, latestState, incomingState) {
    // Aggregate all promises resulting of each module resolveIncomingDistantState

    type Resolved = {
      [K in keyof Mods]: Promise<UpdateDiff<ExtractUpdateEvent<Mods[K]>>>;
    };

    const resolved = mapValues<Mods, Resolved>(modules, (m, k) =>
      m.resolveIncomingDistantState(
        ctx,
        // @ts-expect-error can't seems to properly infer dynamic type
        localData[k],
        latestState ? latestState[k] : null,
        incomingState[k],
      ),
    );

    // wait for all promises
    const results = await Promise.all(Object.values(resolved));
    const hasChanges = results.some(r => r.hasChanges);
    let index = 0;
    const update = mapValues<Mods, UpdateEvent>(modules, () => results[index++]);

    // returns the partial updates
    return !hasChanges ? { hasChanges: false } : { hasChanges: true, update };
  },

  applyUpdate(localData, update) {
    // apply all updates to each module and aggregate
    const result = mapValues<Mods, LocalState>(modules, (m, k) =>
      update[k].hasChanges
        ? m.applyUpdate(
            // @ts-expect-error can't seems to properly infer dynamic type
            localData[k],
            // @ts-expect-error can't seems to properly infer dynamic type
            update[k].update,
          )
        : localData[k],
    );
    return result;
  },
};

export default root;

// utility types and helpers

type ExtractLocalState<T> = T extends WalletSyncDataManager<infer L, any, any> ? L : never;

type ExtractUpdateEvent<T> = T extends WalletSyncDataManager<any, infer U, any> ? U : never;

function mapValues<T extends object, U extends { [K in keyof T]: unknown }>(
  obj: T,
  fn: <K extends keyof T>(value: T[K], key: K) => any, // U[K], // should be the actual type...
): U {
  const result: Partial<U> = {};
  for (const key in obj) {
    result[key as keyof T] = fn(obj[key], key as keyof T);
  }
  return result as U;
}
