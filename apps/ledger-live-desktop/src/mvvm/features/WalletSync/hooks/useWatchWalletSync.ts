import { useCallback, useMemo } from "react";
import { useDispatch, useSelector, useStore } from "LLD/hooks/redux";
import {
  useKeyRingCloudSync,
  useWalletSyncWatcher,
  type KeyRingCloudSync,
  type WalletSyncUserState,
} from "@features/platform-wallet-sync";
import { selectKeyRingSession } from "@features/platform-key-ring";
import { useLedgerSyncBackends, useOnKeyRingRefreshNeeded } from "@features/flow-ledger-sync";
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
import { cache as bridgeCache } from "~/renderer/bridge/cache";
import {
  walletSelector,
  latestDistantStateSelector,
  latestDistantVersionSelector,
} from "~/renderer/reducers/wallet";
import { State } from "~/renderer/reducers";
import { blacklistedTokenIdsSelector } from "~/renderer/reducers/settings";
import { walletSyncUpdate } from "@domain/entity-wallet-sync";
import { replaceAccounts } from "~/renderer/actions/accounts";
import { useKeyRingClient } from "./useKeyRingClient";
import { Dispatch } from "redux";
import { useFeature } from "@features/platform-feature-flags";
import logger from "~/renderer/logger";

type DistantState = DistantDocument;
type LocalState = WalletSyncLocalState;

function onModuleError(moduleKey: string, error: CloudSyncModuleQuarantined) {
  logger.critical(error, `cloud-sync module ${moduleKey} quarantined`);
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

function localStateSelector(state: State): LocalState {
  return {
    accounts: {
      list: state.accounts,
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
    dispatch(replaceAccounts(newLocalState.accounts.list));
  }
}

export function useCloudSyncSDK(): KeyRingCloudSync<DistantState> {
  const { cloudSyncApiBaseUrl } = useLedgerSyncBackends();
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
  const featureWalletSync = useFeature("lldWalletSync");
  const dispatch = useDispatch();
  const saveUpdate = useSaveUpdate();
  const getState = useGetState();
  const walletsync = useWalletsync();
  const session = useSelector(selectKeyRingSession);
  const keyRing = useKeyRingClient();
  const cloudSync = useCloudSyncSDK();
  const onRefreshNeeded = useOnKeyRingRefreshNeeded(keyRing, {
    resetOnCategories: ["member-removed"],
    readTreeIdAt: "call",
  });

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
