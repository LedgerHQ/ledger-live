import { UpdateEvent } from "@shared/cloud-sync";
import { CloudSyncDataManager } from "@shared/cloud-sync-module";
import { ZodType, z } from "zod";

/**
 * Builds the `saveNewUpdate` callback Cloud Sync calls on each update event. On new data it
 * resolves the incremental update against the local state and saves the new local state when
 * something changed, or only the document and version when the version moved. Pushed data saves
 * the document; deleted data saves an empty document at version 0.
 *
 * `saveUpdate` receives `newLocalState: null` when the local state must stay as it is.
 *
 * @example
 * ```ts
 * const saveNewUpdate = makeSaveNewUpdate({
 *   walletsync,
 *   getState: store.getState,
 *   latestDistantStateSelector,
 *   latestDistantVersionSelector,
 *   localStateSelector,
 *   saveUpdate,
 * });
 * const cloudSync = createKeyRingCloudSync({
 *   apiBaseUrl,
 *   slug: liveSlug,
 *   getCurrentVersion,
 *   saveNewUpdate,
 * });
 * ```
 */
export function makeSaveNewUpdate<
  S,
  LocalState,
  Update,
  Schema extends ZodType,
  DistantState = z.infer<Schema>,
>({
  walletsync,
  getState,
  latestDistantStateSelector,
  latestDistantVersionSelector,
  localStateSelector,
  saveUpdate,
}: {
  walletsync: CloudSyncDataManager<LocalState, Update, Schema, DistantState>;
  getState: () => S;
  latestDistantStateSelector: (state: S) => DistantState | null;
  latestDistantVersionSelector: (state: S) => number;
  localStateSelector: (state: S) => LocalState;
  saveUpdate: (
    data: DistantState | null,
    version: number,
    newLocalState: LocalState | null,
  ) => Promise<void>;
}): (event: UpdateEvent<DistantState>) => Promise<void> {
  return async (event: UpdateEvent<DistantState>) => {
    switch (event.type) {
      case "new-data": {
        const state = getState();
        const latestVersion = latestDistantVersionSelector(state);
        const latest = latestDistantStateSelector(state);
        const local = localStateSelector(state);
        const data = event.data;
        const resolved = await walletsync.resolveIncrementalUpdate(local, latest, data);

        if (resolved.hasChanges) {
          const version = event.version;
          const localState = localStateSelector(getState());
          const newLocalState = walletsync.applyUpdate(localState, resolved.update);
          await saveUpdate(data, version, newLocalState);
        } else if (event.version !== latestVersion) {
          await saveUpdate(data, event.version, null);
        }
        break;
      }
      case "pushed-data": {
        await saveUpdate(event.data, event.version, null);
        break;
      }
      case "deleted-data": {
        await saveUpdate(null, 0, null);
        break;
      }
    }
  };
}

/**
 * Builds the step of each watch loop cycle that resolves the last saved document against the
 * current local state again, and saves the new local state when that resolution has changes. The
 * document and version passed to `saveUpdate` are the stored ones.
 *
 * @example
 * ```ts
 * const localIncrementUpdate = makeLocalIncrementalUpdate({
 *   walletsync,
 *   getState: store.getState,
 *   latestWalletStateSelector,
 *   localStateSelector,
 *   saveUpdate,
 * });
 * ```
 */
export function makeLocalIncrementalUpdate<
  S,
  LocalState,
  Update,
  Schema extends ZodType,
  DistantState = z.infer<Schema>,
>({
  walletsync,
  getState,
  latestWalletStateSelector,
  localStateSelector,
  saveUpdate,
}: {
  walletsync: CloudSyncDataManager<LocalState, Update, Schema, DistantState>;
  getState: () => S;
  latestWalletStateSelector: (state: S) => { data: DistantState | null; version: number };
  localStateSelector: (state: S) => LocalState;
  saveUpdate: (
    data: DistantState | null,
    version: number,
    newLocalState: LocalState | null,
  ) => Promise<void>;
}): () => Promise<void> {
  return async () => {
    const state = getState();
    const { data, version } = latestWalletStateSelector(state);
    const local = localStateSelector(state);
    const resolved = await walletsync.resolveIncrementalUpdate(local, data, data);

    if (resolved.hasChanges) {
      const localState = localStateSelector(getState());
      const newLocalState = walletsync.applyUpdate(localState, resolved.update);
      await saveUpdate(data, version, newLocalState);
    }
  };
}
