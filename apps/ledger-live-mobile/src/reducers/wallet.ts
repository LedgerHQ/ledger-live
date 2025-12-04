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
import { useSelector } from "react-redux";
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

export const useMaybeAccountName = (
  account: AccountLike | null | undefined,
): string | undefined => {
  return useSelector((state: State) =>
    !account ? undefined : accountNameWithDefaultSelector(state.wallet, account),
  );
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
