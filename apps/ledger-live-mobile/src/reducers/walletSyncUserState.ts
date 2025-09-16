import { StoredWalletSyncUserState } from "@ledgerhq/live-wallet/store";
import { handleActions, Action, ReducerMap } from "redux-actions";
import {
  WalletSyncUserStatePayload,
  WalletSyncUserStateSetUserStatePayload,
  WalletSyncUserStateSetPendingPayload,
  WalletSyncUserStateSetErrorPayload,
} from "../actions/types";

export type WalletSyncUserStateState = StoredWalletSyncUserState;

export const INITIAL_STATE: WalletSyncUserStateState = {
  visualPending: false,
  walletSyncError: null,
};

const handlers: ReducerMap<WalletSyncUserStateState, WalletSyncUserStatePayload> = {
  SET_WALLET_SYNC_USER_STATE: (state, action) => ({
    ...state,
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    ...(action as Action<WalletSyncUserStateSetUserStatePayload>).payload,
  }),
  SET_WALLET_SYNC_PENDING: (state, action) => ({
    ...state,
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    visualPending: (action as Action<WalletSyncUserStateSetPendingPayload>).payload,
  }),
  SET_WALLET_SYNC_ERROR: (state, action) => ({
    ...state,
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    walletSyncError: (action as Action<WalletSyncUserStateSetErrorPayload>).payload,
  }),
};

export default handleActions<WalletSyncUserStateState, WalletSyncUserStatePayload>(
  handlers,
  INITIAL_STATE,
);
