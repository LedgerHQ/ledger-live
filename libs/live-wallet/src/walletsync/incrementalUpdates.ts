import {
  makeSaveNewUpdate as platformMakeSaveNewUpdate,
  makeLocalIncrementalUpdate as platformMakeLocalIncrementalUpdate,
} from "@features/platform-wallet-sync";
import root, { DistantState, LocalState, Schema, UpdateEvent as RootUpdate } from "./root";
import { UpdateEvent } from "../cloudsync/sdk";
import { WalletSyncDataManagerResolutionContext } from "./types";
import { bindCtx } from "./ctx";
import { WSState } from "../store";

/**
 * Deprecated: these only bind the root manager and its resolution ctx over
 * @features/platform-wallet-sync, which holds the implementation.
 */
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
  return platformMakeSaveNewUpdate<S, LocalState, RootUpdate, Schema, DistantState>({
    walletsync: bindCtx(root, ctx),
    getState,
    latestDistantStateSelector,
    latestDistantVersionSelector,
    localStateSelector,
    saveUpdate,
  });
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
  return platformMakeLocalIncrementalUpdate<S, LocalState, RootUpdate, Schema, DistantState>({
    walletsync: bindCtx(root, ctx),
    getState,
    latestWalletStateSelector,
    localStateSelector,
    saveUpdate,
  });
}
