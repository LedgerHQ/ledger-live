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
  ManageBackup = "ManageBackup",
  DeleteBackup = "DeleteBackup",
  BackupDeleted = "BackupDeleted",

  //Activation
  CreateOrSynchronize = "CreateOrSynchronize",
  DeviceAction = "DeviceAction",
  CreateOrSynchronizeTrustChain = "CreateOrSynchronizeTrustChain",
  ActivationFinal = "ActivationFinal",

  //Synchronize
  SynchronizeMode = "SynchronizeMode",
  SynchronizeWithQRCode = "SynchronizeWithQRCode",
  PinCode = "PinCode",
  Synchronized = "Synchronized",

  //ManageInstances
  SynchronizedInstances = "SynchronizedInstances",
}

type Instance = {
  name: string;
  typeOfDevice: "mobile" | "desktop";
  date: Date;
};

export type WalletSyncState = {
  activated: boolean;
  flow: Flow;
  step: Step;
  hasBeenfaked: boolean;
  instances: Instance[];
};

const initialState: WalletSyncState = {
  activated: true,
  flow: Flow.Activation,
  step: Step.CreateOrSynchronize,
  hasBeenfaked: false,
  instances: [],
};

type HandlersPayloads = {
  WALLET_SYNC_ACTIVATE: boolean;
  WALLET_SYNC_DEACTIVATE: boolean;
  WALLET_SYNC_CHANGE_FLOW: { flow: Flow; step: Step };
  WALLET_SYNC_FAKED: boolean;
  WALLET_SYNC_CHANGE_ADD_INSTANCE: Instance;
  WALLET_SYNC_CHANGE_REMOVE_INSTANCE: Instance;
  WALLET_SYNC_CHANGE_CLEAN_INSTANCES: undefined;
};

type WalletSyncHandlers<PreciseKey = true> = Handlers<
  WalletSyncState,
  HandlersPayloads,
  PreciseKey
>;

const handlers: WalletSyncHandlers = {
  WALLET_SYNC_FAKED: (state: WalletSyncState, { payload }: { payload: boolean }) => ({
    ...state,
    hasBeenfaked: payload,
  }),
  WALLET_SYNC_ACTIVATE: (state: WalletSyncState) => ({
    ...state,
    activated: true,
  }),
  WALLET_SYNC_DEACTIVATE: (state: WalletSyncState) => ({
    ...state,
    activated: false,
  }),
  WALLET_SYNC_CHANGE_FLOW: (
    state: WalletSyncState,
    { payload: { flow, step } }: { payload: { flow: Flow; step: Step } },
  ) => ({
    ...state,
    flow,
    step,
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

export const walletSyncHasBeenFaked = (state: { walletSync: WalletSyncState }) =>
  state.walletSync.hasBeenfaked;

export const walletSyncInstancesSelector = (state: { walletSync: WalletSyncState }) =>
  state.walletSync.instances;

export default handleActions<WalletSyncState, HandlersPayloads[keyof HandlersPayloads]>(
  handlers as unknown as WalletSyncHandlers<false>,
  initialState,
);
