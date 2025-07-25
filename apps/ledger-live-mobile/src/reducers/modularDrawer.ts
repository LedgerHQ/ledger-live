import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";

export interface ModularDrawerState {
  isOpen: boolean;
  preselectedCurrencies: CryptoOrTokenCurrency[];
  callbackId?: string; // Replace function with callback ID
  enableAccountSelection?: boolean;
  accountsObservableId?: string; // Replace Observable with ID
}

const initialState: ModularDrawerState = {
  isOpen: false,
  preselectedCurrencies: [],
  callbackId: undefined,
  enableAccountSelection: false,
  accountsObservableId: undefined,
};

const modularDrawerSlice = createSlice({
  name: "modularDrawer",
  initialState,
  reducers: {
    openModularDrawer: (
      state,
      action: PayloadAction<{
        currencies?: CryptoOrTokenCurrency[];
        callbackId?: string; // Replace function with callback ID
        enableAccountSelection?: boolean;
        accountsObservableId?: string; // Replace Observable with ID
      }>,
    ) => {
      state.isOpen = true;
      if (action.payload.currencies) {
        state.preselectedCurrencies = action.payload.currencies;
      }
      if (action.payload.callbackId) {
        state.callbackId = action.payload.callbackId;
      }
      if (action.payload.enableAccountSelection !== undefined) {
        state.enableAccountSelection = action.payload.enableAccountSelection;
      }
      if (action.payload.accountsObservableId) {
        state.accountsObservableId = action.payload.accountsObservableId;
      }
    },
    closeModularDrawer: state => {
      state.isOpen = false;
      state.preselectedCurrencies = [];
      state.callbackId = undefined;
      state.enableAccountSelection = false;
      state.accountsObservableId = undefined;
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
