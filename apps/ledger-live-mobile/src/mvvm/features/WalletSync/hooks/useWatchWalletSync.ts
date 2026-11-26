import { useCallback, useMemo } from "react";
import { useStore, useSelector, useDispatch } from "~/context/hooks";
import {
  useKeyRingCloudSync,
  useWalletSyncWatcher,
  type KeyRingCloudSync,
  type WalletSyncUserState,
} from "@features/platform-wallet-sync";
import { selectKeyRingSession } from "@features/platform-key-ring";
import { bulkSetAccountNames } from "@domain/entity-account-name";
import { selectContacts, setContacts } from "@domain/entity-contact";
import { updateRecentAddresses } from "@domain/entity-recent-addresses";
import { setNonImportedAccounts } from "@ledgerhq/live-wallet/accounts";
import {
  createWalletsync,
  type CloudSyncModuleQuarantined,
  type Walletsync,
  type DistantDocument,
  type WalletSyncLocalState,
} from "@ledgerhq/live-wallet/walletSyncComposition";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { walletSyncUpdate } from "@domain/entity-wallet-sync";
import { useKeyRingClient } from "./useKeyRingClient";
import { useOnTrustchainRefreshNeeded } from "./useOnTrustchainRefreshNeeded";
import { Dispatch } from "redux";
import {
  walletSelector,
  latestDistantStateSelector,
  latestDistantVersionSelector,
} from "~/reducers/wallet";
import { State } from "~/reducers/types";
import { blacklistedTokenIdsSelector } from "~/reducers/settings";
import { bridgeCache } from "~/bridge/cache";
import { replaceAccounts } from "~/actions/accounts";
import { useFeature } from "@features/platform-feature-flags";
import getWalletSyncEnvironmentParams from "@ledgerhq/live-common/walletSync/getEnvironmentParams";
import logger from "~/logger";

type DistantState = DistantDocument;
type LocalState = WalletSyncLocalState;

function onModuleError(_moduleKey: string, error: CloudSyncModuleQuarantined) {
  logger.critical(error);
}

function useWalletsync(): Walletsync {
  const blacklistedTokenIds = useSelector(blacklistedTokenIdsSelector);
  return useMemo(
    () =>
      createWalletsync({ getAccountBridge, bridgeCache, blacklistedTokenIds }, { onModuleError }),
    [blacklistedTokenIds],
  );
}

function latestWalletStateSelector(s: State): { data: DistantState | null; version: number } {
  const ws = walletSelector(s).walletSync.walletSyncState;
  return {
    data: ws.data,
    version: ws.version,
  };
}

function localStateSelector(state: State) {
  return {
    accounts: {
      list: state.accounts.active,
      nonImportedAccountInfos: state.wallet.nonImportedAccountInfos,
    },
    accountNames: state.wallet.accountNames,
    contacts: selectContacts(state),
    recentAddresses: state.wallet.recentAddresses,
  };
}

async function save(
  data: DistantState | null,
  version: number,
  newLocalState: LocalState | null,
  dispatch: Dispatch,
) {
  dispatch(walletSyncUpdate({ data, version }));
  if (newLocalState) {
    dispatch(setNonImportedAccounts(newLocalState.accounts.nonImportedAccountInfos));
    dispatch(bulkSetAccountNames(newLocalState.accountNames));
    dispatch(setContacts(newLocalState.contacts));
    dispatch(updateRecentAddresses(newLocalState.recentAddresses));
    dispatch(replaceAccounts(newLocalState.accounts.list)); // IMPORTANT: keep this one last, it's doing the DB:* trigger to save the data
  }
}

export function useCloudSyncSDK(): KeyRingCloudSync<DistantState> {
  const featureWalletSync = useFeature("llmWalletSync");
  const { cloudSyncApiBaseUrl } = getWalletSyncEnvironmentParams(
    featureWalletSync?.params?.environment,
  );
  const walletsync = useWalletsync();
  const getState = useGetState();
  const saveUpdate = useSaveUpdate();

  return useKeyRingCloudSync({
    apiBaseUrl: cloudSyncApiBaseUrl,
    walletsync,
    getState,
    latestDistantStateSelector,
    latestDistantVersionSelector,
    localStateSelector,
    saveUpdate,
  });
}

export function useWatchWalletSync(): WalletSyncUserState {
  const featureWalletSync = useFeature("llmWalletSync");
  const saveUpdate = useSaveUpdate();
  const getState = useGetState();
  const dispatch = useDispatch();
  const walletsync = useWalletsync();
  const session = useSelector(selectKeyRingSession);
  const keyRing = useKeyRingClient();
  const cloudSync = useCloudSyncSDK();
  const onRefreshNeeded = useOnTrustchainRefreshNeeded(keyRing);

  return useWalletSyncWatcher({
    walletSyncFeature: featureWalletSync,
    keyRing,
    session,
    cloudSync,
    walletsync,
    getState,
    dispatch,
    localStateSelector,
    latestDistantStateSelector,
    latestWalletStateSelector,
    saveUpdate,
    onRefreshNeeded,
  });
}

function useSaveUpdate() {
  const dispatch = useDispatch();
  return useCallback(
    (data: DistantState | null, version: number, newLocalState: LocalState | null) =>
      save(data, version, newLocalState, dispatch),
    [dispatch],
  );
}

function useGetState() {
  const store = useStore();
  return useCallback(() => store.getState(), [store]);
}
