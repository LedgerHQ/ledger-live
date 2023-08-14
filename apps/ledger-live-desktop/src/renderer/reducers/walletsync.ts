import { createSelector } from "reselect";
import { handleActions } from "redux-actions";
import { Handlers } from "./types";
import { WalletSyncPayload } from "@ledgerhq/live-common/bridge/react/types";

export type WalletSyncState = {
  // Version that WalletSync need to track what version of the data was applied so far to the current wallet
  version: number;
  // a crypto key that authenticate the user. if not set, wallet sync is not active.
  auth: undefined | string;
  // holds the latest backend state we have received, regardless if the local accounts had the time to apply it yet.
  // it can be used to display "pending" state to the UI, comparing that list to the current accounts.
  descriptors: WalletSyncPayload;
};

const initialState: WalletSyncState = {
  version: 0,
  auth: undefined,
  descriptors: [],
};

const state: WalletSyncState = initialState;

type HandlersPayloads = {
  WALLETSYNC_INIT: WalletSyncState | undefined;
  WALLETSYNC_SET_AUTH: string;
  WALLETSYNC_SET_VERSION: number;
  WALLETSYNC_SET_PAYLOAD: WalletSyncPayload;
};

type WalletsyncHandlers<PreciseKey = true> = Handlers<
  WalletSyncState,
  HandlersPayloads,
  PreciseKey
>;

const handlers: WalletsyncHandlers = {
  WALLETSYNC_INIT: (state, { payload }) => ({ ...state, ...payload }),
  WALLETSYNC_SET_AUTH: (state, { payload: auth }) =>
    state.auth !== auth ? { ...initialState, auth } : state,
  WALLETSYNC_SET_VERSION: (state, { payload: version }) => ({ ...state, version }),
  WALLETSYNC_SET_PAYLOAD: (state, { payload: descriptors }) => ({ ...state, descriptors }),
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
