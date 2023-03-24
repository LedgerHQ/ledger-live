import { handleActions } from "redux-actions";
import type { Action, ReducerMap } from "redux-actions";
import { createSelector } from "reselect";
import type { State, WalletConnectState } from "./types";
import {
  WalletConnectPayload,
  WalletConnectSetUriPayload,
} from "../actions/types";

export const INITIAL_STATE: WalletConnectState = {
  uri: undefined,
};

const handlers: ReducerMap<WalletConnectState, WalletConnectPayload> = {
  WALLET_CONNECT_SET_URI: (state, action) => ({
    ...state,
    uri: (action as Action<WalletConnectSetUriPayload>).payload || undefined,
  }),
};

const storeSelector = (state: State): WalletConnectState => state.walletconnect;

export const exportSelector = storeSelector;

export default handleActions<WalletConnectState, WalletConnectPayload>(
  handlers,
  INITIAL_STATE,
);
export const uriSelector = createSelector(
  storeSelector,
  (state: WalletConnectState) => {
    return state.uri;
  },
);
