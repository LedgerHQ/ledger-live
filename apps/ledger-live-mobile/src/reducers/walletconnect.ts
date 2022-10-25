import { handleActions } from "redux-actions";
import { createSelector } from "reselect";

export type WalletConnectState = {
  uri?: string;
};
export const INITIAL_STATE: WalletConnectState = {
  uri: undefined,
};

const handlers: Record<string, any> = {
  WALLET_CONNECT_SET_URI: (
    state: WalletConnectState,
    { uri }: { uri?: string },
  ) => ({
    ...state,
    uri,
  }),
};

const storeSelector = (state: any): WalletConnectState => state.walletconnect;

export const exportSelector = storeSelector;

export default handleActions(handlers, INITIAL_STATE);
export const uriSelector = createSelector(
  storeSelector,
  (state: WalletConnectState) => {
    return state.uri;
  },
);
