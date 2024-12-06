import { log } from "@ledgerhq/logs";
import walletsync, { DistantState, LocalState } from "./root";
import { UpdateEvent } from "../cloudsync/sdk";
import { WalletSyncDataManagerResolutionContext } from "./types";
import { WSState } from "../store";

export function makeSaveNewUpdate<S>({
  ctx,
  getState,
  latestDistantStateSelector,
  latestDistantVersionSelector,
  localStateSelector,
  saveUpdate,
}: {
  ctx: WalletSyncDataManagerResolutionContext;
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
    log("walletsync", "saveNewUpdate", { event });
    switch (event.type) {
      case "new-data": {
        // we resolve incoming distant state changes
        const state = getState();
        const latestVersion = latestDistantVersionSelector(state);
        const latest = latestDistantStateSelector(state);
        const local = localStateSelector(state);
        const data = event.data;
        const resolved = await walletsync.resolveIncrementalUpdate(ctx, local, latest, data);

        if (resolved.hasChanges) {
          const version = event.version;
          const localState = localStateSelector(getState()); // fetch again latest state because it might have changed
          const newLocalState = walletsync.applyUpdate(localState, resolved.update); // we resolve in sync the new local state to save
          await saveUpdate(data, version, newLocalState);
          log("walletsync", "resolved. changes applied.");
        } else {
          log("walletsync", "resolved. no changes to apply.");
        }
        if (event.version !== latestVersion) {
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

export function makeLocalIncrementalUpdate<S>({
  ctx,
  getState,
  latestWalletStateSelector,
  localStateSelector,
  saveUpdate,
}: {
  ctx: WalletSyncDataManagerResolutionContext;
  getState: () => S;
  latestWalletStateSelector: (state: S) => WSState;
  localStateSelector: (state: S) => LocalState;
  saveUpdate: (
    data: DistantState | null,
    version: number,
    newLocalState: LocalState | null,
  ) => Promise<void>;
}): () => Promise<void> {
  return async () => {
    // we resolve possible local incremental update
    const state = getState();
    const { data, version } = latestWalletStateSelector(state);
    const local = localStateSelector(state);
    const resolved = await walletsync.resolveIncrementalUpdate(ctx, local, data, data);

    if (resolved.hasChanges) {
      const localState = localStateSelector(getState()); // fetch again latest state because it might have changed
      const newLocalState = walletsync.applyUpdate(localState, resolved.update); // we resolve in sync the new local state to save
      await saveUpdate(data, version, newLocalState);
      log("walletsync", "localIncrementalUpdate done.");
    }
  };
}
