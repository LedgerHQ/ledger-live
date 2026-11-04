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
    dispatch(replaceAccounts(newLocalState.accounts.list)); // IMPORTANT: keep this one last, it's doing the DB:* trigger to save the data
  }
}

function onModuleError(_moduleKey: string, error: CloudSyncModuleQuarantined) {
  logger.critical(error);
}
