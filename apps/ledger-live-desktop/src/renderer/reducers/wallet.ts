import {
  HandlersPayloads,
  WalletHandlers,
  initialState,
  WalletState,
  handlers,
  isStarredAccountSelector,
  accountNameWithDefaultSelector,
} from "@ledgerhq/live-wallet/store";
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

export const useMaybeAccountName = (
  account: AccountLike | null | undefined,
): string | undefined => {
  return useSelector((state: State) =>
    !account ? undefined : accountNameWithDefaultSelector(state.wallet, account),
  );
};

export const useAccountName = (account: AccountLike) => {
  return useSelector((state: State) => accountNameWithDefaultSelector(state.wallet, account));
};

export default handleActions<WalletState, HandlersPayloads[keyof HandlersPayloads]>(
  handlers as unknown as WalletHandlers<false>,
  initialState,
);
