import { handleActions } from "redux-actions";
import { Handlers } from "./types";
import { TrustchainMember } from "@ledgerhq/ledger-key-ring-protocol/types";

export enum Flow {
  Activation = "Activation",
  Synchronize = "Synchronize",
  ManageInstances = "ManageInstances",
  ManageBackup = "ManageBackup",
  LedgerSyncActivated = "LedgerSyncActivated",
}

export enum Step {
  //ManageBackup
  DeleteBackup = "DeleteBackup",
  BackupDeleted = "BackupDeleted",
  BackupDeletionError = "BackupDeletionError",

  //Activation
  CreateOrSynchronize = "CreateOrSynchronize",
  DeviceAction = "DeviceAction",
  CreateOrSynchronizeTrustChain = "CreateOrSynchronizeTrustChain",
  ActivationLoading = "ActivationLoading",
  ActivationFinal = "ActivationFinal",
  SynchronizationFinal = "SynchronizationFinal",
  SynchronizationError = "SynchronizationError",
  AlreadySecuredSameSeed = "AlreadySecuredSameSeed",
  AlreadySecuredOtherSeed = "AlreadySecuredOtherSeed",

  //Synchronize
  SynchronizeMode = "SynchronizeMode",
  SynchronizeWithQRCode = "SynchronizeWithQRCode",
  PinCode = "PinCode",
  PinCodeError = "PinCodeError",
  SynchronizeLoading = "SynchronizeLoading",
  UnbackedError = "UnbackedError",
  Synchronized = "Synchronized",

  //ManageInstances
  SynchronizedInstances = "SynchronizedInstances",
  DeviceActionInstance = "DeviceActionInstance",
  DeleteInstanceWithTrustChain = "DeleteInstanceWithTrustChain",
  InstanceSuccesfullyDeleted = "InstanceSuccesfullyDeleted",
  InstanceErrorDeletion = "InstanceErrorDeletion",
  UnsecuredLedger = "UnsecuredLedger",
  AutoRemoveInstance = "AutoRemoveInstance",

  //walletSyncActivated
  LedgerSyncActivated = "LedgerSyncActivated",
}

export type WalletSyncState = {
  isDrawerOpen: boolean;
  flow: Flow;
  step: Step;
  nextStep: Step | null;
  hasTrustchainBeenCreated: boolean | null;
  instances: TrustchainMember[];
  hasBeenfaked: boolean;
  qrCodeUrl: string | null;
  qrCodePinCode: string | null;
};

export const initialStateWalletSync: WalletSyncState = {
  isDrawerOpen: false,
  flow: Flow.Activation,
  step: Step.CreateOrSynchronize,
  nextStep: null,
  hasTrustchainBeenCreated: null,
  instances: [],
  hasBeenfaked: false,
  qrCodePinCode: null,
  qrCodeUrl: null,
};

export type ChangeFlowPayload = {
  flow: Flow;
  step: Step;
  nextStep?: Step | null;
  hasTrustchainBeenCreated?: boolean | null;
};

type HandlersPayloads = {
  WALLET_SYNC_CHANGE_DRAWER_VISIBILITY: boolean;
  WALLET_SYNC_CHANGE_FLOW: ChangeFlowPayload;
  WALLET_SYNC_CHANGE_ADD_INSTANCE: TrustchainMember;
  WALLET_SYNC_RESET: undefined;
  WALLET_SYNC_FAKED: boolean;
  WALLET_SYNC_CHANGE_QRCODE_URL: string | null;
  WALLET_SYNC_CHANGE_QRCODE_PINCODE: string | null;
};

type WalletSyncHandlers<PreciseKey = true> = Handlers<
  WalletSyncState,
  HandlersPayloads,
  PreciseKey
>;

const handlers: WalletSyncHandlers = {
  WALLET_SYNC_CHANGE_DRAWER_VISIBILITY: (
    state: WalletSyncState,
    { payload }: { payload: boolean },
  ) => ({
    ...state,
    isDrawerOpen: payload,
  }),
  WALLET_SYNC_CHANGE_FLOW: (
    state: WalletSyncState,
    {
      payload: { flow, step, nextStep = null, hasTrustchainBeenCreated = null },
    }: { payload: ChangeFlowPayload },
  ) => ({
    ...state,
    flow,
    step,
    nextStep,
    hasTrustchainBeenCreated,
  }),
  WALLET_SYNC_CHANGE_ADD_INSTANCE: (
    state: WalletSyncState,
    { payload }: { payload: TrustchainMember },
  ) => ({
    ...state,
    instances: [...state.instances, payload],
  }),
  WALLET_SYNC_RESET: () => initialStateWalletSync,
  WALLET_SYNC_FAKED: (state: WalletSyncState, { payload }: { payload: boolean }) => ({
    ...state,
    hasBeenfaked: payload,
  }),
  WALLET_SYNC_CHANGE_QRCODE_URL: (
    state: WalletSyncState,
    { payload }: { payload: string | null },
  ) => ({
    ...state,
    qrCodeUrl: payload,
  }),
  WALLET_SYNC_CHANGE_QRCODE_PINCODE: (
    state: WalletSyncState,
    { payload }: { payload: string | null },
  ) => ({
    ...state,
    qrCodePinCode: payload,
  }),
};

// Selectors

export const walletSyncDrawerVisibilitySelector = (state: { walletSync: WalletSyncState }) =>
  state.walletSync.isDrawerOpen;

export const walletSyncFlowSelector = (state: { walletSync: WalletSyncState }) =>
  state.walletSync.flow;
export const walletSyncStepSelector = (state: { walletSync: WalletSyncState }) =>
  state.walletSync.step;
export const walletSyncNextStepSelector = (state: { walletSync: WalletSyncState }) =>
  state.walletSync.nextStep;
export const walletSyncInstancesSelector = (state: { walletSync: WalletSyncState }) =>
  state.walletSync.instances;

export const walletSyncFakedSelector = (state: { walletSync: WalletSyncState }) =>
  state.walletSync.hasBeenfaked;

export const walletSyncQrCodePinCodeSelector = (state: { walletSync: WalletSyncState }) =>
  state.walletSync.qrCodePinCode;

export default handleActions<WalletSyncState, HandlersPayloads[keyof HandlersPayloads]>(
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  handlers as unknown as WalletSyncHandlers<false>,
  initialStateWalletSync,
);
