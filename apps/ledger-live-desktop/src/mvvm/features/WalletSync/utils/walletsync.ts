import type { Dispatch } from "redux";
import { bulkSetAccountNames } from "@domain/entity-account-name";
import { selectContacts, setContacts } from "@domain/entity-contact";
import { updateRecentAddresses } from "@domain/entity-recent-addresses";
import { walletSyncUpdate } from "@domain/entity-wallet-sync";
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
import { replaceAccounts } from "~/renderer/actions/accounts";
import logger from "~/renderer/logger";
import type { State } from "~/renderer/reducers";

export function createLiveWalletsync(
  blacklistedTokenIds: State["settings"]["blacklistedTokenIds"],
): Walletsync {
  return createWalletsync(
    { getAccountBridge, bridgeCache, blacklistedTokenIds },
    { onModuleError },
  );
}

export function localStateSelector(state: State): WalletSyncLocalState {
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

export async function save(
  data: DistantDocument | null,
  version: number,
  newLocalState: WalletSyncLocalState | null,
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

function onModuleError(moduleKey: string, error: CloudSyncModuleQuarantined) {
  logger.critical(error, `cloud-sync module ${moduleKey} quarantined`);
}
