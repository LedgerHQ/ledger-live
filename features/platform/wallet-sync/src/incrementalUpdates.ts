import { UpdateEvent } from "@shared/cloud-sync";
import { CloudSyncDataManager } from "@shared/cloud-sync-module";
import { ZodType, z } from "zod";

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
