import { handleActions } from "redux-actions";
import { Handlers } from "./types";
export enum Flow {
  Activation = "Activation",
  Synchronize = "Synchronize",
  ManageInstances = "ManageInstances",
  ManageBackups = "ManageBackups",
}

export enum Step {
  //ManageBackup
  ManageBackupStep = "ManageBackupStep",
  DeleteBackupStep = "DeleteBackupStep",
  BackupDeleted = "BackupDeleted",

  //Activation
  CreateOrSynchronizeStep = "CreateOrSynchronizeStep",
  DeviceActionStep = "DeviceActionStep",
  CreateOrSynchronizeTrustChainStep = "CreateOrSynchronizeTrustChainStep",
  ActivationFinalStep = "ActivationFinalStep",
}

export type WalletSyncState = {
  activated: boolean;
  flow: Flow;
  step: Step;
};

const initialState: WalletSyncState = {
  activated: true,
  flow: Flow.Activation,
  step: Step.CreateOrSynchronizeStep,
};

type HandlersPayloads = {
  WALLET_SYNC_ACTIVATE: boolean;
  WALLET_SYNC_DEACTIVATE: boolean;
  WALLET_SYNC_CHANGE_FLOW: Flow;
  WALLET_SYNC_CHANGE_STEP: Step;
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
  WALLET_SYNC_CHANGE_STEP: (state: WalletSyncState, { payload }: { payload: Step }) => ({
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
