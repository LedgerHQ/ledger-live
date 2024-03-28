import {
  HandlersPayloads,
  WalletHandlers,
  initialState,
  WalletState,
  handlers,
  isStarredAccountSelector,
} from "@ledgerhq/live-wallet/store";
import { handleActions } from "redux-actions";
import { State } from ".";
import { createSelector } from "reselect";

export const walletSelector = (state: State): WalletState => state.wallet;

export const accountStarredSelector = createSelector(
  walletSelector,
  (_: State, { accountId }: { accountId: string }) => accountId,
  (wallet, accountId) => isStarredAccountSelector(wallet, { accountId }),
);

export default handleActions<WalletState, HandlersPayloads[keyof HandlersPayloads]>(
  handlers as unknown as WalletHandlers<false>,
  initialState,
);
