import { handleActions } from "redux-actions";
import type { Action } from "redux-actions";
import { createSelector } from "reselect";
import type { State, WalletConnectState } from "./types";
import { WalletConnectSetUriPayload } from "../actions/types";

export const INITIAL_STATE: WalletConnectState = {
  uri: undefined,
};

const handlers = {
  WALLET_CONNECT_SET_URI: (
    state: WalletConnectState,
    { payload: { uri } }: Action<WalletConnectSetUriPayload>,
  ) => ({
    ...state,
    uri,
  }),
};

const storeSelector = (state: State): WalletConnectState => state.walletconnect;

export const exportSelector = storeSelector;

export default handleActions<WalletConnectState, WalletConnectSetUriPayload>(
  handlers,
  INITIAL_STATE,
);
export const uriSelector = createSelector(
  storeSelector,
  (state: WalletConnectState) => {
    return state.uri;
  },
);
