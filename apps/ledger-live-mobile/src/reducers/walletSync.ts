import { handleActions } from "redux-actions";
import type { Action, ReducerMap } from "redux-actions";
import type { State, WalletSyncState } from "./types";
import {
  WalletSyncPayload,
  WalletSyncSetManageKeyDrawerPayload,
  WalletSyncQrCodeUrlPayload,
  WalletSyncChangeQrCodePinCodePayload,
} from "../actions/types";

export const INITIAL_STATE: WalletSyncState = {
  isManageKeyDrawerOpen: false,
  qrCodePinCode: null,
  qrCodeUrl: null,
};

const handlers: ReducerMap<WalletSyncState, WalletSyncPayload> = {
  WALLET_SYNC_SET_MANAGE_KEY_DRAWER: (state, action) => ({
    ...state,
    isManageKeyDrawerOpen: (action as Action<WalletSyncSetManageKeyDrawerPayload>).payload,
  }),
  WALLET_SYNC_CHANGE_QRCODE_URL: (state, action) => ({
    ...state,
    qrCodeUrl: (action as Action<WalletSyncQrCodeUrlPayload>).payload,
  }),
  WALLET_SYNC_CHANGE_QRCODE_PINCODE: (state, action) => ({
    ...state,
    qrCodePinCode: (action as Action<WalletSyncChangeQrCodePinCodePayload>).payload,
  }),
};

export const storeSelector = (state: State): WalletSyncState => state.walletSync;
export const manageKeyDrawerSelector = (state: State): boolean =>
  state.walletSync.isManageKeyDrawerOpen;
export const qrCodeUrlSelector = (state: State): WalletSyncState["qrCodeUrl"] =>
  state.walletSync.qrCodeUrl;
export const qrCodePinCodeSelector = (state: State): WalletSyncState["qrCodePinCode"] =>
  state.walletSync.qrCodePinCode;

export default handleActions<WalletSyncState, WalletSyncPayload>(handlers, INITIAL_STATE);
