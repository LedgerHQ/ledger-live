import { useCallback } from "react";
import { combineReducers, type Dispatch } from "@reduxjs/toolkit";
import {
  accountNamesSlice,
  accountNameWithDefaultSelector as entityAccountNameWithDefault,
  setAccountName as setAccountNameRTK,
  bulkSetAccountNames,
  getDefaultAccountName,
} from "@domain/entity-account-name";
import {
  starredAccountsSlice,
  setAccountStarred as setAccountStarredRTK,
  initStarredFromIds,
} from "@domain/entity-starred-account";
import { walletSyncSlice, walletSyncUpdate, type WSState } from "@domain/entity-wallet-sync";
import {
  nonImportedAccountsSlice,
  setNonImportedAccounts,
  type NonImportedAccountInfo,
} from "@ledgerhq/live-wallet/accounts";
import { recentAddressesSlice, updateRecentAddresses } from "@domain/entity-recent-addresses";
import type { State } from "./types";
import { shallowEqual } from "react-redux";
import { useSelector } from "~/context/hooks";
import type {
  Account,
  AccountLike,
  AccountUserData,
  RecentAddressesState,
} from "@ledgerhq/types-live";

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

// --- Serialization (replaces live-wallet/store equivalents) ---

export type ExportedWalletState = {
  walletSyncState: WSState;
  nonImportedAccountInfos: NonImportedAccountInfo[];
  accountsData: {
    accountNames: Array<[string, string]>;
    starredAccountIds: string[];
  };
  recentAddresses: RecentAddressesState;
};

export const exportWalletState = (state: WalletState): ExportedWalletState => ({
  walletSyncState: state.walletSync.walletSyncState,
  nonImportedAccountInfos: state.nonImportedAccountInfos,
  accountsData: {
    accountNames: Array.from(state.accountNames),
    starredAccountIds: Array.from(state.starredAccountIds),
  },
  recentAddresses: state.recentAddresses,
});

export const walletStateExportShouldDiffer = (a: WalletState, b: WalletState): boolean =>
  a.walletSync.walletSyncState !== b.walletSync.walletSyncState ||
  a.nonImportedAccountInfos !== b.nonImportedAccountInfos ||
  a.accountNames !== b.accountNames ||
  a.starredAccountIds !== b.starredAccountIds ||
  a.recentAddresses !== b.recentAddresses;

export const importWalletState =
  (payload: Partial<ExportedWalletState>) =>
  (dispatch: Dispatch): void => {
    if (payload.accountsData?.accountNames) {
      dispatch(bulkSetAccountNames(new Map(payload.accountsData.accountNames)));
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
    if (payload.recentAddresses !== undefined) {
      dispatch(updateRecentAddresses(payload.recentAddresses));
    }
  };

// --- Action creators (compatibility wrappers, same signature as live-wallet/store) ---

export const setAccountName = (accountId: string, name: string) =>
  setAccountNameRTK({ accountId, name });

export const setAccountStarred = (accountId: string, starred: boolean) =>
  setAccountStarredRTK({ accountId, starred });

export { updateRecentAddresses };

// --- Selectors (same signature as live-wallet/store, operate on WalletState) ---

export const accountNameSelector = (
  state: WalletState,
  { accountId }: { accountId: string },
): string | undefined => state.accountNames.get(accountId);

export const accountNameWithDefaultSelector = (state: WalletState, account: AccountLike): string =>
  state.accountNames.get(account.id) || getDefaultAccountName(account);

export const isStarredAccountSelector = (
  state: WalletState,
  { accountId }: { accountId: string },
): boolean => state.starredAccountIds.has(accountId);

export const accountUserDataExportSelector = (
  state: WalletState,
  { account }: { account: Account },
): AccountUserData => {
  const id = account.id;
  const name = state.accountNames.get(id) || getDefaultAccountName(account);
  const starredIds: string[] = [];
  if (state.starredAccountIds.has(id)) starredIds.push(id);
  for (const t of account.subAccounts || []) {
    if (state.starredAccountIds.has(t.id)) starredIds.push(t.id);
  }
  return { id, name, starredIds };
};

export function latestDistantStateSelector(state: State): unknown {
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
  const selector = useCallback(
    (state: State) =>
      !account ? undefined : entityAccountNameWithDefault(state.wallet.accountNames, account),
    [account],
  );
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
