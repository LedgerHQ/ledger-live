import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { MODULAR_DRAWER_KEY } from "LLM/features/ModularDrawer/types";
import { State } from "~/reducers/types";
import { EnhancedModularDrawerConfiguration } from "@ledgerhq/live-common/wallet-api/ModularDrawer/types";

export interface ModularDrawerState {
  isOpen: boolean;
  preselectedCurrencies: string[];
  callbackId?: string;
  enableAccountSelection?: boolean;
  accountsObservableId?: string;
  flow: string;
  source: string;
  assetsConfiguration?: EnhancedModularDrawerConfiguration["assets"];
  networksConfiguration?: EnhancedModularDrawerConfiguration["networks"];
  useCase?: string;
  areCurrenciesFiltered?: boolean;
  searchValue: string;
}

export const INITIAL_STATE: ModularDrawerState = {
  isOpen: false,
  preselectedCurrencies: [],
  callbackId: undefined,
  enableAccountSelection: false,
  accountsObservableId: undefined,
  flow: "",
  source: "",
  assetsConfiguration: {
    leftElement: "undefined",
    rightElement: "undefined",
  },
  networksConfiguration: {
    leftElement: "numberOfAccounts",
    rightElement: "undefined",
  },
  useCase: undefined,
  areCurrenciesFiltered: undefined,
  searchValue: "",
};

// Selectors
export const modularDrawerStateSelector = (state: State) => state.modularDrawer;

export const modularDrawerSearchValueSelector = (state: State) => state.modularDrawer.searchValue;
export const modularDrawerFlowSelector = (state: State) => state.modularDrawer.flow;
export const modularDrawerSourceSelector = (state: State) => state.modularDrawer.source;

const modularDrawerSlice = createSlice({
  name: MODULAR_DRAWER_KEY,
  initialState: INITIAL_STATE,
  reducers: {
    openModularDrawer: (
      state,
      action: PayloadAction<{
        currencies?: string[];
        callbackId?: string;
        enableAccountSelection?: boolean;
        accountsObservableId?: string;
        flow?: string;
        source?: string;
        assetsConfiguration?: EnhancedModularDrawerConfiguration["assets"];
        networksConfiguration?: EnhancedModularDrawerConfiguration["networks"];
        useCase?: string;
        areCurrenciesFiltered?: boolean;
      }>,
    ) => {
      state.isOpen = true;
      state.searchValue = "";
      const {
        currencies,
        callbackId,
        enableAccountSelection,
        accountsObservableId,
        flow,
        source,
        assetsConfiguration,
        networksConfiguration,
        useCase,
        areCurrenciesFiltered,
      } = action.payload;

      if (currencies !== undefined) {
        state.preselectedCurrencies = currencies;
      }
      if (callbackId !== undefined) {
        state.callbackId = callbackId;
      }
      if (enableAccountSelection !== undefined) {
        state.enableAccountSelection = enableAccountSelection;
      }
      if (accountsObservableId !== undefined) {
        state.accountsObservableId = accountsObservableId;
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
      if (areCurrenciesFiltered !== undefined) {
        state.areCurrenciesFiltered = areCurrenciesFiltered;
      }
    },
    closeModularDrawer: state => {
      state.isOpen = false;
      state.preselectedCurrencies = [];
      state.callbackId = undefined;
      state.enableAccountSelection = false;
      state.accountsObservableId = undefined;
      state.flow = "";
      state.source = "";
      state.assetsConfiguration = INITIAL_STATE.assetsConfiguration;
      state.networksConfiguration = INITIAL_STATE.networksConfiguration;
      state.useCase = undefined;
      state.areCurrenciesFiltered = undefined;
      state.searchValue = "";
    },
    setPreselectedCurrencies: (state, action: PayloadAction<string[]>) => {
      state.preselectedCurrencies = action.payload;
    },
    setCallbackId: (state, action: PayloadAction<string | undefined>) => {
      state.callbackId = action.payload;
    },
    setEnableAccountSelection: (state, action: PayloadAction<boolean>) => {
      state.enableAccountSelection = action.payload;
    },
    setAccountsObservableId: (state, action: PayloadAction<string | undefined>) => {
      state.accountsObservableId = action.payload;
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
    setUseCase: (state, action: PayloadAction<string | undefined>) => {
      state.useCase = action.payload;
    },
    setAreCurrenciesFiltered: (state, action: PayloadAction<boolean | undefined>) => {
      state.areCurrenciesFiltered = action.payload;
    },
    setSearchValue: (state, action: PayloadAction<string>) => {
      state.searchValue = action.payload;
    },
  },
});

export const {
  openModularDrawer,
  closeModularDrawer,
  setPreselectedCurrencies,
  setCallbackId,
  setEnableAccountSelection,
  setAccountsObservableId,
  setAssetsConfiguration,
  setNetworksConfiguration,
  setSearchValue,
} = modularDrawerSlice.actions;

export default modularDrawerSlice.reducer;
