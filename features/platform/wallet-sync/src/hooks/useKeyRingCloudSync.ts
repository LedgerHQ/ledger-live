import { useCallback, useMemo } from "react";
import type { ZodType, z } from "zod";
import type { CloudSyncDataManager } from "@shared/cloud-sync-module";
import { createKeyRingCloudSync, type KeyRingCloudSync } from "../cloudSync/keyRingCloudSync";
import { makeSaveNewUpdate } from "../watchLoop/incrementalUpdates";
import { liveSlug } from "../cloudSync/liveSlug";

/**
 * The app's Cloud Sync client for the Ledger Wallet document, on key ring streams. Both apps
 * share it: each passes its data manager, state access and save dispatches as ports. The client
 * stays the same object while the ports keep their identity, so pass module-level selectors and
 * memoized callbacks. Hand the result to `useWalletSyncWatcher`.
 *
 * @example
 * ```ts
 * // Module level: a new selector on each render would rebuild the client.
 * function localStateSelector(state: State): WalletSyncLocalState { ... }
 *
 * export function useCloudSyncSDK(): KeyRingCloudSync<DistantDocument> {
 *   const walletSyncFeature = useFeature("lldWalletSync");
 *   const { cloudSyncApiBaseUrl } = getWalletSyncEnvironmentParams(
 *     walletSyncFeature?.params?.environment,
 *   );
 *   return useKeyRingCloudSync({
 *     apiBaseUrl: cloudSyncApiBaseUrl,
 *     walletsync: useWalletsync(),
 *     getState: useGetState(),
 *     latestDistantStateSelector,
 *     latestDistantVersionSelector,
 *     localStateSelector,
 *     saveUpdate: useSaveUpdate(),
 *   });
 * }
 * ```
 */
export function useKeyRingCloudSync<
  State,
  LocalState,
  Update,
  Schema extends ZodType,
  DistantState extends Record<string, unknown>,
>({
  apiBaseUrl,
  walletsync,
  getState,
  latestDistantStateSelector,
  latestDistantVersionSelector,
  localStateSelector,
  saveUpdate,
}: KeyRingCloudSyncPorts<
  State,
  LocalState,
  Update,
  Schema,
  DistantState
>): KeyRingCloudSync<DistantState> {
  const getCurrentVersion = useCallback(
    () => latestDistantVersionSelector(getState()),
    [getState, latestDistantVersionSelector],
  );

  const saveNewUpdate = useMemo(
    () =>
      makeSaveNewUpdate({
        walletsync,
        getState,
        latestDistantStateSelector,
        latestDistantVersionSelector,
        localStateSelector,
        saveUpdate,
      }),
    [
      walletsync,
      getState,
      latestDistantStateSelector,
      latestDistantVersionSelector,
      localStateSelector,
      saveUpdate,
    ],
  );

  return useMemo(
    () =>
      createKeyRingCloudSync<DistantState>({
        apiBaseUrl,
        slug: liveSlug,
        getCurrentVersion,
        saveNewUpdate,
      }),
    [apiBaseUrl, getCurrentVersion, saveNewUpdate],
  );
}

/** What `useKeyRingCloudSync` needs from the app. Every port must keep its identity. */
export type KeyRingCloudSyncPorts<
  State,
  LocalState,
  Update,
  Schema extends ZodType,
  DistantState = z.infer<Schema>,
> = Readonly<{
  /** Base URL of the Cloud Sync API, from the app's environment parameters. */
  apiBaseUrl: string;
  /** The app's data manager, from `createWalletsync` in live-wallet. */
  walletsync: CloudSyncDataManager<LocalState, Update, Schema, DistantState>;
  /** Reads the current store state, not a render snapshot. */
  getState: () => State;
  /** Module-level selectors: a new function on each render would rebuild the client. */
  latestDistantStateSelector: (state: State) => DistantState | null;
  latestDistantVersionSelector: (state: State) => number;
  localStateSelector: (state: State) => LocalState;
  /** Dispatches the saved document and, when not null, the new local state. */
  saveUpdate: (
    data: DistantState | null,
    version: number,
    newLocalState: LocalState | null,
  ) => Promise<void>;
}>;
