import { handleActions } from "redux-actions";
import { Handlers } from "./types";
export enum Flow {
  Activation = "Activation",
  Sync = "Sync",
  ManageInstances = "ManageInstances",
  ManageBackup = "ManageBackup",
}

export type WalletSyncState = {
  activated: boolean;
  flow: Flow;
};

const initialState: WalletSyncState = {
  activated: false,
  flow: Flow.Activation,
};

type HandlersPayloads = {
  WALLET_SYNC_ACTIVATE: boolean;
  WALLET_SYNC_DEACTIVATE: boolean;
  WALLET_SYNC_CHANGE_FLOW: Flow;
};

type MarketHandlers<PreciseKey = true> = Handlers<WalletSyncState, HandlersPayloads, PreciseKey>;

const handlers: MarketHandlers = {
  WALLET_SYNC_ACTIVATE: (state: WalletSyncState) => ({
    ...state,
    activated: true,
  }),
  WALLET_SYNC_DEACTIVATE: (state: WalletSyncState) => ({
    ...state,
    activated: false,
  }),
  WALLET_SYNC_CHANGE_FLOW: (state: WalletSyncState, { payload }: { payload: Flow }) => ({
    ...state,
    flow: payload,
  }),
};

// Selectors
export const walletSyncSelector = (state: { walletSync: WalletSyncState }) => state.walletSync;

export const walletSyncFlowSelector = (state: { walletSync: WalletSyncState }) =>
  state.walletSync.flow;
export const walletSyncStateSelector = (state: { walletSync: WalletSyncState }) =>
  state.walletSync.activated;

export default handleActions<WalletSyncState, HandlersPayloads[keyof HandlersPayloads]>(
  handlers as unknown as MarketHandlers<false>,
  initialState,
);
