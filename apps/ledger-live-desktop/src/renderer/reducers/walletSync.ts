import { handleActions } from "redux-actions";
import { Handlers } from "./types";
export enum Flow {
  Activation = "Activation",
  Synchronize = "Synchronize",
  ManageInstances = "ManageInstances",
  ManageBackups = "ManageBackups",
}

export type WalletSyncState = {
  activated: boolean;
  flow: Flow;
  step: number;
};

const initialState: WalletSyncState = {
  activated: true,
  flow: Flow.Activation,
  step: 1,
};

type HandlersPayloads = {
  WALLET_SYNC_ACTIVATE: boolean;
  WALLET_SYNC_DEACTIVATE: boolean;
  WALLET_SYNC_CHANGE_FLOW: Flow;
  WALLET_SYNC_CHANGE_STEP: number;
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
  WALLET_SYNC_CHANGE_STEP: (state: WalletSyncState, { payload }: { payload: number }) => ({
    ...state,
    step: payload,
  }),
};

// Selectors
export const walletSyncSelector = (state: { walletSync: WalletSyncState }) => state.walletSync;

export const walletSyncFlowSelector = (state: { walletSync: WalletSyncState }) =>
  state.walletSync.flow;
export const walletSyncStepSelector = (state: { walletSync: WalletSyncState }) =>
  state.walletSync.step;
export const walletSyncStateSelector = (state: { walletSync: WalletSyncState }) =>
  state.walletSync.activated;

export default handleActions<WalletSyncState, HandlersPayloads[keyof HandlersPayloads]>(
  handlers as unknown as MarketHandlers<false>,
  initialState,
);
