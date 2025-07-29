import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { MODULAR_DRAWER_KEY } from "LLM/features/ModularDrawer/types";
import { State } from "~/reducers/types";

export interface ModularDrawerState {
  isOpen: boolean;
  preselectedCurrencies: CryptoOrTokenCurrency[];
  callbackId?: string;
  enableAccountSelection?: boolean;
  accountsObservableId?: string;
  flow?: string;
  source?: string;
}

export const INITIAL_STATE: ModularDrawerState = {
  isOpen: false,
  preselectedCurrencies: [],
  callbackId: undefined,
  enableAccountSelection: false,
  accountsObservableId: undefined,
  flow: undefined,
  source: undefined,
};

// Selectors
export const modularDrawerStateSelector = (state: State) => state.modularDrawer;

const modularDrawerSlice = createSlice({
  name: MODULAR_DRAWER_KEY,
  initialState: INITIAL_STATE,
  reducers: {
    openModularDrawer: (
      state,
      action: PayloadAction<{
        currencies?: CryptoOrTokenCurrency[];
        callbackId?: string;
        enableAccountSelection?: boolean;
        accountsObservableId?: string;
        flow?: string;
        source?: string;
      }>,
    ) => {
      state.isOpen = true;

      const { currencies, callbackId, enableAccountSelection, accountsObservableId, flow, source } =
        action.payload;

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
    },
    closeModularDrawer: state => {
      state.isOpen = false;
      state.preselectedCurrencies = [];
      state.callbackId = undefined;
      state.enableAccountSelection = false;
      state.accountsObservableId = undefined;
      state.flow = undefined;
      state.source = undefined;
    },
    setPreselectedCurrencies: (state, action: PayloadAction<CryptoOrTokenCurrency[]>) => {
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
  },
});

export const {
  openModularDrawer,
  closeModularDrawer,
  setPreselectedCurrencies,
  setCallbackId,
  setEnableAccountSelection,
  setAccountsObservableId,
} = modularDrawerSlice.actions;

export default modularDrawerSlice.reducer;
