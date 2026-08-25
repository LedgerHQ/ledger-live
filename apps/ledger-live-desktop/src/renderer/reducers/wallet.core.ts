import { combineReducers, type Dispatch } from "@reduxjs/toolkit";
import { accountNamesSlice, initFromUserData } from "@domain/entity-account-name";
import { setContacts, type ContactsState } from "@domain/entity-contact";
import { starredAccountsSlice, initStarredFromIds } from "@domain/entity-starred-account";
import { walletSyncSlice, walletSyncUpdate, type WSState } from "@domain/entity-wallet-sync";
import {
  nonImportedAccountsSlice,
  setNonImportedAccounts,
  type NonImportedAccountInfo,
} from "@ledgerhq/live-wallet/accounts";
import {
  recentAddressesSlice,
  updateRecentAddresses,
  type RecentAddressesState,
} from "@domain/entity-recent-addresses";
import type { State } from ".";

export const walletReducer = combineReducers({
  accountNames: accountNamesSlice.reducer,
  starredAccountIds: starredAccountsSlice.reducer,
  walletSync: walletSyncSlice.reducer,
  nonImportedAccountInfos: nonImportedAccountsSlice.reducer,
  recentAddresses: recentAddressesSlice.reducer,
});

export type WalletState = ReturnType<typeof walletReducer>;

export const initialState: WalletState = walletReducer(undefined, { type: "@@INIT" });

export type ExportedWalletState = {
  walletSyncState: WSState;
  nonImportedAccountInfos: NonImportedAccountInfo[];
  accountsData: {
    accountNames: Array<[string, string]>;
    starredAccountIds: string[];
  };
  contacts: ContactsState["contacts"];
  recentAddresses: RecentAddressesState;
};

type WalletPersistenceState = Pick<State, "wallet" | "contacts">;

export const exportWalletState = (state: WalletPersistenceState): ExportedWalletState => ({
  walletSyncState: state.wallet.walletSync.walletSyncState,
  nonImportedAccountInfos: state.wallet.nonImportedAccountInfos,
  accountsData: {
    accountNames: Array.from(state.wallet.accountNames),
    starredAccountIds: Array.from(state.wallet.starredAccountIds),
  },
  contacts: state.contacts.contacts,
  recentAddresses: state.wallet.recentAddresses,
});

export const walletStateExportShouldDiffer = (
  a: WalletPersistenceState,
  b: WalletPersistenceState,
): boolean =>
  a.wallet.walletSync.walletSyncState !== b.wallet.walletSync.walletSyncState ||
  a.wallet.nonImportedAccountInfos !== b.wallet.nonImportedAccountInfos ||
  a.wallet.accountNames !== b.wallet.accountNames ||
  a.wallet.starredAccountIds !== b.wallet.starredAccountIds ||
  a.contacts.contacts !== b.contacts.contacts ||
  a.wallet.recentAddresses !== b.wallet.recentAddresses;

export const importWalletState =
  (payload: Partial<ExportedWalletState>) =>
  (dispatch: Dispatch): void => {
    if (payload.accountsData?.accountNames) {
      dispatch(
        initFromUserData(payload.accountsData.accountNames.map(([id, name]) => ({ id, name }))),
      );
    }
    if (payload.accountsData?.starredAccountIds) {
      dispatch(initStarredFromIds(payload.accountsData.starredAccountIds));
    }
    if (payload.walletSyncState !== undefined) {
      dispatch(walletSyncUpdate(payload.walletSyncState));
    }
    if (payload.nonImportedAccountInfos !== undefined) {
      dispatch(setNonImportedAccounts(payload.nonImportedAccountInfos));
    }
    if (payload.contacts !== undefined) {
      dispatch(setContacts(payload.contacts));
    }
    if (payload.recentAddresses !== undefined) {
      dispatch(updateRecentAddresses(payload.recentAddresses));
    }
  };

export { updateRecentAddresses };
export { bulkSetAccountNames } from "@domain/entity-account-name";
