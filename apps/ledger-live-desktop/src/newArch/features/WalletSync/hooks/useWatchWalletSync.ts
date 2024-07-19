import { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector, useStore } from "react-redux";
import noop from "lodash/noop";
import { CloudSyncSDK, UpdateEvent } from "@ledgerhq/live-wallet/cloudsync/index";
import walletsync, {
  liveSlug,
  DistantState,
  walletSyncWatchLoop,
  LocalState,
  Schema,
} from "@ledgerhq/live-wallet/walletsync/index";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { walletSelector } from "~/renderer/reducers/wallet";
import { memberCredentialsSelector, trustchainSelector } from "@ledgerhq/trustchain/store";
import { State } from "~/renderer/reducers";
import { cache as bridgeCache } from "~/renderer/bridge/cache";
import {
  setAccountNames,
  walletSyncStateSelector,
  walletSyncUpdate,
} from "@ledgerhq/live-wallet/store";
import { replaceAccounts } from "~/renderer/actions/accounts";
import { latestDistantStateSelector } from "~/renderer/reducers/wallet";
import { log } from "@ledgerhq/logs";
import { useTrustchainSdk } from "./useTrustchainSdk";
import { useOnTrustchainRefreshNeeded } from "./useOnTrustchainRefreshNeeded";
import { Dispatch } from "redux";

function localStateSelector(state: State): LocalState {
  // READ. connect the redux state to the walletsync modules
  return {
    accounts: { list: state.accounts },
    accountNames: state.wallet.accountNames,
  };
}

function saveUpdate(newLocalState: LocalState, dispatch: Dispatch) {
  // WRITE. save the state for the walletsync modules
  dispatch(setAccountNames(newLocalState.accountNames));
  dispatch(replaceAccounts(newLocalState.accounts.list)); // IMPORTANT: keep this one last, it's doing the DB:* trigger to save the data
}

export function useCloudSyncSDK(): CloudSyncSDK<Schema> {
  const trustchainSdk = useTrustchainSdk();
  const store = useStore();
  const dispatch = useDispatch();
  const getCurrentVersion = useCallback(
    () => walletSyncStateSelector(walletSelector(store.getState())).version,
    [store],
  );

  const saveNewUpdate = useCallback(
    async (event: UpdateEvent<DistantState>) => {
      log("walletsync", "saveNewUpdate", { event });
      switch (event.type) {
        case "new-data": {
          // we resolve incoming distant state changes
          const ctx = { getAccountBridge, bridgeCache, blacklistedTokenIds: [] };
          const state = store.getState();
          const latest = latestDistantStateSelector(state);
          const local = localStateSelector(state);
          const data = event.data;
          const resolved = await walletsync.resolveIncomingDistantState(ctx, local, latest, data);

          if (resolved.hasChanges) {
            const version = event.version;
            const localState = localStateSelector(store.getState()); // fetch again latest state because it might have changed
            const newLocalState = walletsync.applyUpdate(localState, resolved.update); // we resolve in sync the new local state to save
            dispatch(walletSyncUpdate(data, version));
            saveUpdate(newLocalState, dispatch);
            log("walletsync", "resolved. changes applied.");
          } else {
            log("walletsync", "resolved. no changes to apply.");
          }
          break;
        }
        case "pushed-data": {
          dispatch(walletSyncUpdate(event.data, event.version));
          break;
        }
        case "deleted-data": {
          dispatch(walletSyncUpdate(null, 0));
          break;
        }
      }
    },
    [store, dispatch],
  );

  const cloudSyncSDK = useMemo(
    () =>
      new CloudSyncSDK({
        slug: liveSlug,
        schema: walletsync.schema,
        trustchainSdk,
        getCurrentVersion,
        saveNewUpdate,
      }),
    [trustchainSdk, getCurrentVersion, saveNewUpdate],
  );

  return cloudSyncSDK;
}

export type WalletSyncUserState = {
  visualPending: boolean;
  walletSyncError: Error | null;
  onUserRefresh: () => void;
};

export function useWatchWalletSync(): WalletSyncUserState {
  const store = useStore();
  const memberCredentials = useSelector(memberCredentialsSelector);
  const trustchain = useSelector(trustchainSelector);
  const trustchainSdk = useTrustchainSdk();
  const walletSyncSdk = useCloudSyncSDK();
  const onTrustchainRefreshNeeded = useOnTrustchainRefreshNeeded(trustchainSdk, memberCredentials);

  const [visualPending, setVisualPending] = useState(true);
  const [walletSyncError, setWalletSyncError] = useState<Error | null>(null);
  const [onUserRefresh, setOnUserRefresh] = useState<() => void>(() => noop);
  const state = useMemo(
    () => ({ visualPending, walletSyncError, onUserRefresh }),
    [visualPending, walletSyncError, onUserRefresh],
  );

  // pull and push wallet sync loop
  useEffect(() => {
    if (!trustchain || !memberCredentials) {
      setOnUserRefresh(() => noop);
      return;
    }

    const { unsubscribe, onUserRefreshIntent } = walletSyncWatchLoop({
      walletSyncSdk,
      trustchain,
      memberCredentials,
      setVisualPending,
      getState: () => store.getState(),
      localStateSelector,
      latestDistantStateSelector,
      onError: e => setWalletSyncError(e && e instanceof Error ? e : new Error(String(e))),
      onStartPolling: () => setWalletSyncError(null),
      onTrustchainRefreshNeeded,
    });

    setOnUserRefresh(() => onUserRefreshIntent);

    return unsubscribe;
  }, [
    store,
    trustchainSdk,
    walletSyncSdk,
    trustchain,
    memberCredentials,
    onTrustchainRefreshNeeded,
  ]);

  return state;
}
