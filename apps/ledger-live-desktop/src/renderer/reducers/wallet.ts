import {
  accountNameSelector as entityAccountNameSelector,
  accountNameWithDefaultSelector as entityAccountNameWithDefault,
  setAccountName as setAccountNameRTK,
} from "@domain/entity-account-name";
import {
  isStarredAccountSelector as entityIsStarredAccount,
  setAccountStarred as setAccountStarredRTK,
} from "@domain/entity-starred-account";
import { createSelector } from "reselect";
import { useSelector } from "LLD/hooks/redux";
import { shallowEqual } from "react-redux";
import type { RecentAddressesState } from "@domain/entity-recent-addresses";
import type { WSState } from "@domain/entity-wallet-sync";
import type { Account, AccountLike, AccountUserData } from "@ledgerhq/types-live";
import type { State } from ".";
import type { WalletState } from "./wallet.core";
import { parseAnyAccountId } from "@shared/schema-primitives";

export type { WalletState, ExportedWalletState } from "./wallet.core";
export {
  exportWalletState,
  walletStateExportShouldDiffer,
  importWalletState,
  initialState,
  updateRecentAddresses,
  bulkSetAccountNames,
} from "./wallet.core";

export const walletSelector = (state: State): WalletState => state.wallet;

export const setAccountName = (accountId: string, name: string) =>
  setAccountNameRTK({ accountId, name });

export const setAccountStarred = (accountId: string, starred: boolean) =>
  setAccountStarredRTK({ accountId, starred });

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

export const accountStarredSelector = createSelector(
  walletSelector,
  (_: State, { accountId }: { accountId: string }) => accountId,
  (wallet, accountId) => entityIsStarredAccount(wallet.starredAccountIds, { accountId }),
);

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

export const useMaybeAccountName = (account: AccountLike | null | undefined): string | undefined =>
  useSelector((state: State) => getAccountName(state, account));

export const useBatchMaybeAccountName = (
  accounts: (AccountLike | null | undefined)[],
): (string | undefined)[] =>
  useSelector(
    (state: State) => accounts.map(account => getAccountName(state, account)),
    shallowEqual,
  );

export const useAccountName = (account: AccountLike) =>
  useSelector((state: State) => entityAccountNameWithDefault(state.wallet.accountNames, account));

export { walletReducer as default } from "./wallet.core";
