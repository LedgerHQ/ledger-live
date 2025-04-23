import { handleActions } from "redux-actions";
import { Handlers } from "./types";

export enum Flow {
  Activation = "Activation",
}

export enum Step {
  //Activation
  CreateOrSynchronize = "CreateOrSynchronize",
  DeviceAction = "DeviceAction",
  ActivationLoading = "ActivationLoading",
  ActivationFinal = "ActivationFinal",
  SynchronizationFinal = "SynchronizationFinal",
  SynchronizationError = "SynchronizationError",

  //Synchronize
  PinCode = "PinCode",
  PinCodeError = "PinCodeError",
  SynchronizeLoading = "SynchronizeLoading",
  Synchronized = "Synchronized",
}

export type HodlShieldState = {
  isDrawerOpen: boolean;
  flow: Flow;
  step: Step;
  nextStep: Step | null;
  hasBeenfaked: boolean;
};

export const initialStateWalletSync: HodlShieldState = {
  isDrawerOpen: false,
  flow: Flow.Activation,
  step: Step.CreateOrSynchronize,
  nextStep: null,
  hasBeenfaked: false,
};

export type ChangeFlowPayload = {
  flow: Flow;
  step: Step;
  nextStep?: Step | null;
};

type HandlersPayloads = {
  HODLSHIELD_CHANGE_DRAWER_VISIBILITY: boolean;
  HODLSHIELD_CHANGE_FLOW: ChangeFlowPayload;
  HODLSHIELD_FAKED: boolean;
};

type WalletSyncHandlers<PreciseKey = true> = Handlers<
  HodlShieldState,
  HandlersPayloads,
  PreciseKey
>;

const handlers: WalletSyncHandlers = {
  HODLSHIELD_CHANGE_DRAWER_VISIBILITY: (
    state: HodlShieldState,
    { payload }: { payload: boolean },
  ) => ({
    ...state,
    isDrawerOpen: payload,
  }),
  HODLSHIELD_CHANGE_FLOW: (
    state: HodlShieldState,
    { payload: { flow, step, nextStep = null } }: { payload: ChangeFlowPayload },
  ) => ({
    ...state,
    flow,
    step,
    nextStep,
  }),
  HODLSHIELD_FAKED: (state: HodlShieldState, { payload }: { payload: boolean }) => ({
    ...state,
    hasBeenfaked: payload,
  }),
};

// Selectors
export const hodlShieldSyncSelector = (state: { hodlShield: HodlShieldState }) => state.hodlShield;

export const hodlShieldDrawerVisibilitySelector = (state: { hodlShield: HodlShieldState }) =>
  state.hodlShield.isDrawerOpen;

export const hodlShieldFlowSelector = (state: { hodlShield: HodlShieldState }) =>
  state.hodlShield.flow;
export const hodlShieldStepSelector = (state: { hodlShield: HodlShieldState }) =>
  state.hodlShield.step;
export const hodlShieldNextStepSelector = (state: { hodlShield: HodlShieldState }) =>
  state.hodlShield.nextStep;

export default handleActions<HodlShieldState, HandlersPayloads[keyof HandlersPayloads]>(
  handlers as unknown as WalletSyncHandlers<false>,
  initialStateWalletSync,
);
