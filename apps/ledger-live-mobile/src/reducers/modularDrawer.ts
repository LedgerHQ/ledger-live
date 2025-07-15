import { handleActions } from "redux-actions";
import type { Action, ReducerMap } from "redux-actions";
import type { State, ModularDrawerState } from "./types";
import {
  ModularDrawerActionTypes,
  ModularDrawerPayload,
  ModularDrawerSetDrawerOpenPayload,
  ModularDrawerSetStepPayload,
  ModularDrawerSetSelectedAssetPayload,
  ModularDrawerSetSelectedNetworkPayload,
} from "../actions/types";
import { ModularDrawerStep } from "LLM/features/ModularDrawer/types";

export const INITIAL_STATE: ModularDrawerState = {
  isDrawerOpen: false,
  currentStep: ModularDrawerStep.Asset,
  selectedAsset: null,
  selectedNetwork: null,
};

const handlers: ReducerMap<ModularDrawerState, ModularDrawerPayload> = {
  [ModularDrawerActionTypes.MODULAR_DRAWER_SET_DRAWER_OPEN]: (state, action) => ({
    ...state,
    isDrawerOpen: (action as Action<ModularDrawerSetDrawerOpenPayload>).payload,
  }),
  [ModularDrawerActionTypes.MODULAR_DRAWER_SET_STEP]: (state, action) => ({
    ...state,
    currentStep: (action as Action<ModularDrawerSetStepPayload>).payload,
  }),
  [ModularDrawerActionTypes.MODULAR_DRAWER_SET_SELECTED_ASSET]: (state, action) => ({
    ...state,
    selectedAsset: (action as Action<ModularDrawerSetSelectedAssetPayload>).payload,
  }),
  [ModularDrawerActionTypes.MODULAR_DRAWER_SET_SELECTED_NETWORK]: (state, action) => ({
    ...state,
    selectedNetwork: (action as Action<ModularDrawerSetSelectedNetworkPayload>).payload,
  }),
};

export const storeSelector = (state: State): ModularDrawerState => state.modularDrawer;
export const isDrawerOpenSelector = (state: State): ModularDrawerState["isDrawerOpen"] =>
  state.modularDrawer.isDrawerOpen;
export const currentStepSelector = (state: State): ModularDrawerState["currentStep"] =>
  state.modularDrawer.currentStep;
export const selectedAssetSelector = (state: State): ModularDrawerState["selectedAsset"] =>
  state.modularDrawer.selectedAsset;
export const selectedNetworkSelector = (state: State): ModularDrawerState["selectedNetwork"] =>
  state.modularDrawer.selectedNetwork;

export default handleActions<ModularDrawerState, ModularDrawerPayload>(handlers, INITIAL_STATE);
