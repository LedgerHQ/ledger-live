import { ZodType, z } from "zod";

/**
 * CloudSyncDataManager is responsible of the reconciliation of incremental data updates.
 * We distinguish local data from distant data: local data is client side data whereas distant data is the subset of data that we push to cloud sync (essentially the identifier parts of the data that local data can be restored from).
 *
 * (1) we determine if there are changes between local state and latest distant state by `diffLocalToDistant(localState, latestDist)`. This is a synchronous operation.
 *
 * (2) when receiving a new distant state from cloud sync, the module must calculate the update to apply to the local state. resolveIncrementalUpdate calculates the update and applyUpdate applies it.
 *
 * state transition is done incrementally with a diff, moving from A to B is essentially
 * - resolveIncrementalUpdate: solving the transition (distA->distB) from stateA (this is asynchronous, for instance we need to fetch data from the blockchain to get a valid Account state)
 * - applyUpdate: applying that transition update to get to stateB
 *
 *  so in other words:
 *
 *     stateB = stateA + (distB - distA)
 *
 * Glossary:
 *
 * LocalState = All the data that the client has locally that the module needs as an input for the reconciliation.
 * Update = an action payload to express the update mutation that you need to do on the local state after determining an update to do with distant state changes.
 * Schema = the Schema is a Zod type that allows to validate the data that this module will store in cloud sync data. the `typeof schema`. IMPORTANT: the schema must not change over time.
 * DistantState = the type that correspond to the Schema. Basically the exact data that we store in cloud sync for that module. (NB: it is automatically inferred from the Schema)
 */
export interface CloudSyncDataManager<
  LocalState,
  Update,
  Schema extends ZodType,
  DistantState = z.infer<Schema>,
> {
  schema: Schema;
  diffLocalToDistant: (
    localData: LocalState,
    latestState: DistantState | null,
  ) => DistantDiff<DistantState>;
  resolveIncrementalUpdate: (
    localData: LocalState,
    latestState: DistantState | null,
    incomingState: DistantState | null,
  ) => Promise<UpdateDiff<Update>>;
  applyUpdate: (localData: LocalState, update: Update) => LocalState;
}

export type UpdateDiff<Update> = { hasChanges: false } | { hasChanges: true; update: Update };

export type DistantDiff<DistantState> = { hasChanges: boolean; nextState: DistantState };

export type ExtractLocalState<T> = T extends CloudSyncDataManager<infer L, any, any> ? L : never;
export type ExtractUpdateEvent<T> = T extends CloudSyncDataManager<any, infer U, any> ? U : never;
export type ExtractSchema<T> = T extends CloudSyncDataManager<any, any, infer S> ? S : never;
export type ExtractDistantState<T> =
  T extends CloudSyncDataManager<any, any, any, infer D> ? D : never;

export function createAggregator<Mods extends Record<string, CloudSyncDataManager<any, any, any>>>(
  modules: Mods,
) {
  const schema = z.object(mapValues(modules, m => z.optional(m.schema)));

  type Schema = typeof schema;
  type DistantState = { [K in keyof Mods]?: z.infer<Mods[K]["schema"]> };
  type LocalState = { [K in keyof Mods]: ExtractLocalState<Mods[K]> };
  type UpdateEvent = { [K in keyof Mods]: UpdateDiff<ExtractUpdateEvent<Mods[K]>> };

  const root: CloudSyncDataManager<LocalState, UpdateEvent, Schema, DistantState> = {
    schema,

    diffLocalToDistant(localData, latestState) {
      let hasChanges = false;
      const unknownRest: Record<string, unknown> = { ...latestState };
      const nextState = mapValues(modules, (m, k) => {
        const diff = m.diffLocalToDistant(
          localData[k],
          latestState != null ? (latestState[k] ?? null) : null,
        );
        delete unknownRest[k as string];
        if (diff.hasChanges) hasChanges = true;
        return diff.nextState;
      });
      return { hasChanges, nextState: { ...nextState, ...unknownRest } };
    },

    async resolveIncrementalUpdate(localData, latestState, incomingState) {
      const resolved = mapValues(modules, (m, k) =>
        m.resolveIncrementalUpdate(
          localData[k],
          latestState != null ? (latestState[k] ?? null) : null,
          incomingState != null ? (incomingState[k] ?? null) : null,
        ),
      );
      const results = await Promise.all(Object.values(resolved));
      const hasChanges = results.some(r => r.hasChanges);
      let index = 0;
      const update = mapValues(modules, () => results[index++]) as UpdateEvent;
      return !hasChanges ? { hasChanges: false } : { hasChanges: true, update };
    },

    applyUpdate(localData, update) {
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
