import { useCallback } from "react";
import { combineReducers, type Dispatch } from "@reduxjs/toolkit";
import {
  accountNamesSlice,
  accountNameSelector as entityAccountNameSelector,
  accountNameWithDefaultSelector as entityAccountNameWithDefault,
  setAccountName as setAccountNameRTK,
  initFromUserData,
} from "@domain/entity-account-name";
import { setContacts, type ContactsState } from "@domain/entity-contact";
import {
  starredAccountsSlice,
  isStarredAccountSelector as entityIsStarredAccount,
  setAccountStarred as setAccountStarredRTK,
  initStarredFromIds,
} from "@domain/entity-starred-account";
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
import type { State } from "./types";
import { shallowEqual } from "react-redux";
import { useSelector } from "~/context/hooks";
import type { Account, AccountLike, AccountUserData } from "@ledgerhq/types-live";
import { parseAnyAccountId } from "@shared/schema-primitives";

const walletReducer = combineReducers({
  accountNames: accountNamesSlice.reducer,
  starredAccountIds: starredAccountsSlice.reducer,
  walletSync: walletSyncSlice.reducer,
  nonImportedAccountInfos: nonImportedAccountsSlice.reducer,
  recentAddresses: recentAddressesSlice.reducer,
});

export type WalletState = ReturnType<typeof walletReducer>;

export const INITIAL_STATE: WalletState = walletReducer(undefined, { type: "@@INIT" });

export const walletSelector = (state: State): WalletState => state.wallet;

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

// Positional-argument wrappers kept so existing call sites need no change.

export const setAccountName = (accountId: string, name: string) =>
  setAccountNameRTK({ accountId, name });

export const setAccountStarred = (accountId: string, starred: boolean) =>
  setAccountStarredRTK({ accountId, starred });

export { updateRecentAddresses };

export const accountNameSelector = (
  state: WalletState,
  params: { accountId: string },
): string | undefined => entityAccountNameSelector(state.accountNames, params);

export const accountNameWithDefaultSelector = (state: WalletState, account: AccountLike): string =>
  entityAccountNameWithDefault(state.accountNames, account);

export const isStarredAccountSelector = (
  state: WalletState,
  params: { accountId: string },
): boolean => entityIsStarredAccount(state.starredAccountIds, params);

export const accountUserDataExportSelector = (
  state: WalletState,
  { account }: { account: Account },
): AccountUserData => {
  const starredIds = [account, ...(account.subAccounts || [])]
    .map(a => a.id)
    .filter(id => state.starredAccountIds.has(parseAnyAccountId(id)));
  return {
    id: account.id,
    name: accountNameWithDefaultSelector(state, account),
    starredIds,
  };
};

export function latestDistantStateSelector(state: State): WSState["data"] {
  return walletSelector(state).walletSync.walletSyncState.data;
}

export function latestDistantVersionSelector(state: State): number {
  return walletSelector(state).walletSync.walletSyncState.version;
}

export function recentAddressesSelector(state: State): RecentAddressesState {
  return walletSelector(state).recentAddresses;
}

const getAccountName = (
  state: State,
  account: AccountLike | null | undefined,
): string | undefined =>
  !account ? undefined : entityAccountNameWithDefault(state.wallet.accountNames, account);

export const useMaybeAccountName = (
  account: AccountLike | null | undefined,
): string | undefined => {
  const selector = useCallback((state: State) => getAccountName(state, account), [account]);
  return useSelector(selector);
};

export const useBatchMaybeAccountName = (
  accounts: (AccountLike | null | undefined)[],
): (string | undefined)[] => {
  const selector = useCallback(
    (state: State) => accounts.map(account => getAccountName(state, account)),
    [accounts],
  );
  return useSelector(selector, shallowEqual);
};

export const useAccountName = (account: AccountLike) => {
  const selector = useCallback(
    (state: State) => entityAccountNameWithDefault(state.wallet.accountNames, account),
    [account],
  );
  return useSelector(selector);
};

export default walletReducer;
