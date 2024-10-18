import {
  HandlersPayloads,
  WalletHandlers,
  initialState,
  WalletState,
  handlers,
  isStarredAccountSelector,
  accountNameWithDefaultSelector,
  walletSyncStateSelector,
} from "@ledgerhq/live-wallet/store";
import { DistantState } from "@ledgerhq/live-wallet/walletsync/index";
import { handleActions } from "redux-actions";
import { State } from ".";
import { createSelector } from "reselect";
import { useSelector } from "react-redux";
import { AccountLike } from "@ledgerhq/types-live";

export const walletSelector = (state: State): WalletState => state.wallet;

export const accountStarredSelector = createSelector(
  walletSelector,
  (_: State, { accountId }: { accountId: string }) => accountId,
  (wallet, accountId) => isStarredAccountSelector(wallet, { accountId }),
);

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

export const useMaybeAccountName = (
  account: AccountLike | null | undefined,
): string | undefined => {
  return useSelector((state: State) => getAccountName(state, account));
};

export const useBatchMaybeAccountName = (
  accounts: (AccountLike | null | undefined)[],
): (string | undefined)[] => {
  return useSelector((state: State) => accounts.map(account => getAccountName(state, account)));
};
export const useAccountName = (account: AccountLike) => {
  return useSelector((state: State) => accountNameWithDefaultSelector(state.wallet, account));
};

export default handleActions<WalletState, HandlersPayloads[keyof HandlersPayloads]>(
  handlers as unknown as WalletHandlers<false>,
  initialState,
);
