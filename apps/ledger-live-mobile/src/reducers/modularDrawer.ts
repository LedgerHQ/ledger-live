import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
  MODULAR_DRAWER_KEY,
  ModularDrawerStep,
  type ModularDrawerCompletionMode,
  type ModularDrawerPresentation,
  type DrawerExtras,
  type DrawerRemoteParams,
} from "LLM/features/ModularDrawer/types";
import { State } from "~/reducers/types";
import { EnhancedModularDrawerConfiguration } from "@ledgerhq/live-common/wallet-api/ModularDrawer/types";

export interface ModularDrawerState {
  isOpen: boolean;
  preselectedCurrencies: string[];
  callbackId?: string;
  enableAccountSelection?: boolean;
  completionMode?: ModularDrawerCompletionMode;
  presentation: ModularDrawerPresentation;
  flow: string;
  source: string;
  assetsConfiguration?: EnhancedModularDrawerConfiguration["assets"];
  networksConfiguration?: EnhancedModularDrawerConfiguration["networks"];
  useCase?: string;
  uiUseCase?: string;
  areCurrenciesFiltered?: boolean;
  searchValue: string;
  step: ModularDrawerStep;
}

export const INITIAL_STATE: ModularDrawerState = {
  isOpen: false,
  preselectedCurrencies: [],
  callbackId: undefined,
  enableAccountSelection: false,
  completionMode: undefined,
  presentation: "drawer",
  flow: "",
  source: "",
  assetsConfiguration: {
    leftElement: "undefined",
    rightElement: "balance",
  },
  networksConfiguration: {
    leftElement: "numberOfAccounts",
    rightElement: "balance",
  },
  useCase: undefined,
  uiUseCase: undefined,
  areCurrenciesFiltered: undefined,
  searchValue: "",
  step: ModularDrawerStep.Asset,
};

// Selectors
export const modularDrawerStateSelector = (state: State) => state.modularDrawer;

export const modularDrawerSearchValueSelector = (state: State) => state.modularDrawer.searchValue;
export const modularDrawerFlowSelector = (state: State) => state.modularDrawer.flow;
export const modularDrawerSourceSelector = (state: State) => state.modularDrawer.source;
export const modularDrawerEnableAccountSelectionSelector = (state: State) =>
  state.modularDrawer.enableAccountSelection;
export const modularDrawerCompletionModeSelector = (state: State) =>
  state.modularDrawer.completionMode;
export const modularDrawerPresentationSelector = (state: State) => state.modularDrawer.presentation;
export const modularDrawerStepSelector = (state: State) => state.modularDrawer.step;

const modularDrawerSlice = createSlice({
  name: MODULAR_DRAWER_KEY,
  initialState: INITIAL_STATE,
  reducers: {
    openModularDrawer: (
      state,
      action: PayloadAction<DrawerRemoteParams<DrawerExtras & { step?: ModularDrawerStep }>>,
    ) => {
      state.isOpen = true;
      state.searchValue = "";
      const {
        currencies,
        callbackId,
        enableAccountSelection,
        completionMode,
        presentation,
        flow,
        source,
        assetsConfiguration,
        networksConfiguration,
        useCase,
        uiUseCase,
        areCurrenciesFiltered,
        step,
      } = action.payload;
      const isEmbeddedCurrency = completionMode === "currency" && presentation === "embedded";

      if (currencies !== undefined) {
        state.preselectedCurrencies = currencies;
      }
      state.callbackId = callbackId;
      state.completionMode = completionMode;
      state.presentation = completionMode === "currency" ? (presentation ?? "drawer") : "drawer";
      if (isEmbeddedCurrency) {
        state.enableAccountSelection = false;
      } else if (enableAccountSelection !== undefined) {
        state.enableAccountSelection = enableAccountSelection;
      }
      if (flow !== undefined) {
        state.flow = flow;
      }
      if (source !== undefined) {
        state.source = source;
      }
      if (assetsConfiguration !== undefined) {
        state.assetsConfiguration = assetsConfiguration;
      }
      if (networksConfiguration !== undefined) {
        state.networksConfiguration = networksConfiguration;
      }
      if (useCase !== undefined) {
        state.useCase = useCase;
      }
      if (uiUseCase !== undefined) {
        state.uiUseCase = uiUseCase;
      }
      if (areCurrenciesFiltered !== undefined) {
        state.areCurrenciesFiltered = areCurrenciesFiltered;
      }
      if (isEmbeddedCurrency) {
        state.step = ModularDrawerStep.Asset;
      } else if (step !== undefined) {
        state.step = step;
      }
    },
    closeModularDrawer: state => {
      state.isOpen = false;
      state.preselectedCurrencies = [];
      state.callbackId = undefined;
      state.enableAccountSelection = false;
      state.completionMode = undefined;
      state.presentation = "drawer";
      state.flow = "";
      state.source = "";
      state.assetsConfiguration = INITIAL_STATE.assetsConfiguration;
      state.networksConfiguration = INITIAL_STATE.networksConfiguration;
      state.useCase = undefined;
      state.uiUseCase = undefined;
      state.areCurrenciesFiltered = undefined;
      state.searchValue = "";
      state.step = ModularDrawerStep.Asset;
    },

    setCallbackId: (state, action: PayloadAction<string | undefined>) => {
      state.callbackId = action.payload;
    },
    setAssetsConfiguration: (
      state,
      action: PayloadAction<EnhancedModularDrawerConfiguration["assets"]>,
    ) => {
      state.assetsConfiguration = action.payload;
    },
    setNetworksConfiguration: (
      state,
      action: PayloadAction<EnhancedModularDrawerConfiguration["networks"]>,
    ) => {
      state.networksConfiguration = action.payload;
    },
    setSearchValue: (state, action: PayloadAction<string>) => {
      state.searchValue = action.payload;
    },
    setStep: (state, action: PayloadAction<ModularDrawerStep>) => {
      state.step = action.payload;
    },
  },
});

export const { openModularDrawer, closeModularDrawer, setSearchValue, setStep } =
  modularDrawerSlice.actions;

export default modularDrawerSlice.reducer;
