import { createSelector } from "reselect";
import { handleActions } from "redux-actions";
import { Handlers } from "./types";
import { WalletSyncPayload } from "@ledgerhq/live-common/bridge/react/types";

export type WalletSyncState = {
  version: undefined | number;
  auth: undefined | string;
  descriptors: WalletSyncPayload;
};

const initialState: WalletSyncState = {
  version: undefined,
  auth: undefined,
  descriptors: [],
};
const state: WalletSyncState = initialState;

type HandlersPayloads = {
  WALLETSYNC_SET_AUTH: string;
  WALLETSYNC_SET_VERSION: number;
  WALLETSYNC_SET_PAYLOAD: WalletSyncPayload;
  WALLETSYNC_INIT: WalletSyncState | undefined;
};
type WalletsyncHandlers<PreciseKey = true> = Handlers<
  WalletSyncState,
  HandlersPayloads,
  PreciseKey
>;

const handlers: WalletsyncHandlers = {
  WALLETSYNC_SET_AUTH: (state, { payload: auth }) =>
    state.auth !== auth ? { ...initialState, auth } : state,
  WALLETSYNC_SET_VERSION: (state, { payload: version }) => ({ ...state, version }),
  WALLETSYNC_SET_PAYLOAD: (state, { payload: descriptors }) => ({ ...state, descriptors }),
  WALLETSYNC_INIT: (state, { payload }) => ({ ...state, ...payload }),
};

export default handleActions<WalletSyncState, HandlersPayloads[keyof HandlersPayloads]>(
  handlers as unknown as WalletsyncHandlers<false>,
  state,
);

// Selectors

export const walletSyncSelector = (state: { walletsync: WalletSyncState }): WalletSyncState =>
  state.walletsync;

export const walletSyncVersionSelector = createSelector(
  walletSyncSelector,
  walletsync => walletsync.version,
);

export const walletSyncAuthSelector = createSelector(
  walletSyncSelector,
  walletsync => walletsync.auth,
);

export const walletSyncDescriptorsSelector = createSelector(
  walletSyncSelector,
  walletsync => walletsync.descriptors,
);
