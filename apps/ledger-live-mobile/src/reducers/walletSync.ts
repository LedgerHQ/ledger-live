import { handleActions } from "redux-actions";
import type { Action, ReducerMap } from "redux-actions";
import type { State, WalletSyncState } from "./types";
import { WalletSyncPayload, WalletSyncSetManageKeyDrawerPayload } from "../actions/types";

export const INITIAL_STATE: WalletSyncState = {
  isManageKeyDrawerOpen: false,
};

const handlers: ReducerMap<WalletSyncState, WalletSyncPayload> = {
  WALLET_SYNC_SET_MANAGE_KEY_DRAWER: (state, action) => ({
    ...state,
    isManageKeyDrawerOpen: (action as Action<WalletSyncSetManageKeyDrawerPayload>).payload,
  }),
};

export const storeSelector = (state: State): WalletSyncState => state.walletSync;
export const manageKeyDrawerSelector = (state: State): boolean =>
  state.walletSync.isManageKeyDrawerOpen;

export default handleActions<WalletSyncState, WalletSyncPayload>(handlers, INITIAL_STATE);
