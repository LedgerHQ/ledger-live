import type { Dispatch } from "redux";
import { bulkSetAccountNames } from "@domain/entity-account-name";
import { selectContacts, setContacts } from "@domain/entity-contact";
import { updateRecentAddresses } from "@domain/entity-recent-addresses";
import { setNonImportedAccounts } from "@ledgerhq/live-wallet/accounts";
import {
  createWalletsync,
  type CloudSyncModuleQuarantined,
  type Walletsync,
  type WalletSyncLocalState,
} from "@ledgerhq/live-wallet/walletSyncComposition";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { bridgeCache } from "~/bridge/cache";
import { replaceAccounts } from "~/actions/accounts";
import logger from "~/logger";
import type { State } from "~/reducers/types";

export function createLiveWalletsync(
  blacklistedTokenIds: State["settings"]["blacklistedTokenIds"],
): Walletsync {
  return createWalletsync(
    { getAccountBridge, bridgeCache, blacklistedTokenIds },
    { onModuleError },
  );
}

export function localStateSelector(state: State) {
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

export function applyLocalState(localState: WalletSyncLocalState, dispatch: Dispatch) {
  dispatch(setNonImportedAccounts(localState.accounts.nonImportedAccountInfos));
  dispatch(bulkSetAccountNames(localState.accountNames));
  dispatch(setContacts(localState.contacts));
  dispatch(updateRecentAddresses(localState.recentAddresses));
  dispatch(replaceAccounts(localState.accounts.list)); // IMPORTANT: keep this one last, it's doing the DB:* trigger to save the data
}

function onModuleError(_moduleKey: string, error: CloudSyncModuleQuarantined) {
  logger.critical(error);
}
