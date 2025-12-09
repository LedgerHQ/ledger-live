import { useCallback, useMemo } from "react";
import {
  HandlersPayloads,
  WalletHandlers,
  initialState,
  WalletState,
  handlers,
  accountNameWithDefaultSelector,
  walletSyncStateSelector,
} from "@ledgerhq/live-wallet/store";
import { handleActions } from "redux-actions";
import { State } from "./types";
import { useSelector, shallowEqual } from "react-redux";
import { AccountLike, RecentAddressesState } from "@ledgerhq/types-live";
import { DistantState } from "@ledgerhq/live-wallet/walletsync/index";

export const walletSelector = (state: State): WalletState => state.wallet;

export function recentAddressesSelector(state: State): RecentAddressesState {
  return walletSelector(state).recentAddresses;
}
export function latestDistantStateSelector(state: State): DistantState | null {
  return walletSyncStateSelector(walletSelector(state)).data;
}

export function latestDistantVersionSelector(state: State): number {
  return walletSyncStateSelector(walletSelector(state)).version;
}

const getAccountName = (
  state: State,
  account: AccountLike | null | undefined,
): string | undefined => {
  return !account ? undefined : accountNameWithDefaultSelector(state.wallet, account);
};

/**
 * Hook to get the name of an account (or undefined if account is null/undefined).
 *
 * @param account
 * The account to get the name for.
 *
 * @returns
 * The name of the account.
 */
export const useMaybeAccountName = (
  account: AccountLike | null | undefined,
): string | undefined => {
  const accountId = account?.id;
  const selector = useCallback(
    (state: State) =>
      !account ? undefined : accountNameWithDefaultSelector(state.wallet, account),
    // Only recreate the selector when account identity changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [accountId],
  );
  return useSelector(selector);
};

/**
 * Hook to get names for a batch of accounts.
 *
 * @param accounts
 * The accounts to get names for.
 *
 * @returns
 * The names of the accounts.
 */
export const useBatchMaybeAccountName = (
  accounts: (AccountLike | null | undefined)[],
): (string | undefined)[] => {
  const accountIds = useMemo(() => accounts.map(a => a?.id).join(","), [accounts]);
  const selector = useCallback(
    (state: State) => accounts.map(account => getAccountName(state, account)),
    // Only recreate the selector when account identities change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [accountIds],
  );
  return useSelector(selector, shallowEqual);
};

/**
 * Hook to get the name of an account.
 *
 * Uses a memoized selector to prevent unnecessary re-renders in react-redux v9.
 */
export const useAccountName = (account: AccountLike) => {
  const accountId = account.id;
  const selector = useCallback(
    (state: State) => accountNameWithDefaultSelector(state.wallet, account),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [accountId],
  );
  return useSelector(selector);
};

export default handleActions<WalletState, HandlersPayloads[keyof HandlersPayloads]>(
  handlers as unknown as WalletHandlers<false>,
  initialState,
);
