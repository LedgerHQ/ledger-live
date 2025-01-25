import { handleActions } from "redux-actions";
import type { Action, ReducerMap } from "redux-actions";
import type { State, WalletSyncState } from "./types";
import {
  WalletSyncActionTypes,
  WalletSyncPayload,
  WalletSyncSetActivateDrawer,
  WalletSyncSetActivateStep,
  WalletSyncSetManageKeyDrawerPayload,
} from "../actions/types";
import { Steps } from "LLM/features/WalletSync/types/Activation";

export const INITIAL_STATE: WalletSyncState = {
  isManageKeyDrawerOpen: false,
  isActivateDrawerOpen: false,
  activateDrawerStep: Steps.Activation,
};

const handlers: ReducerMap<WalletSyncState, WalletSyncPayload> = {
  [WalletSyncActionTypes.WALLET_SYNC_SET_MANAGE_KEY_DRAWER]: (state, action) => ({
    ...state,
    isManageKeyDrawerOpen: (action as Action<WalletSyncSetManageKeyDrawerPayload>).payload,
  }),
  [WalletSyncActionTypes.LEDGER_SYNC_SET_ACTIVATE_DRAWER]: (state, action) => ({
    ...state,
    isActivateDrawerOpen: (action as Action<WalletSyncSetActivateDrawer>).payload,
  }),
  [WalletSyncActionTypes.LEDGER_SYNC_SET_ACTIVATE_STEP]: (state, action) => ({
    ...state,
    activateDrawerStep: (action as Action<WalletSyncSetActivateStep>).payload,
  }),
};

export const storeSelector = (state: State): WalletSyncState => state.walletSync;
export const manageKeyDrawerSelector = (state: State): boolean =>
  state.walletSync.isManageKeyDrawerOpen;
export const activateDrawerSelector = (state: State): boolean =>
  state.walletSync.isActivateDrawerOpen;
export const activateDrawerStepSelector = (state: State): Steps =>
  state.walletSync.activateDrawerStep;

export default handleActions<WalletSyncState, WalletSyncPayload>(handlers, INITIAL_STATE);
