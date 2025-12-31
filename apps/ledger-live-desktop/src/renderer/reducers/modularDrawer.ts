import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { State } from ".";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import type { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import type { EnhancedModularDrawerConfiguration } from "@ledgerhq/live-common/wallet-api/ModularDrawer/types";

export interface ModularDialogParams {
  currencies?: string[];
  dialogConfiguration?: EnhancedModularDrawerConfiguration;
  useCase?: string;
  areCurrenciesFiltered?: boolean;
  onAssetSelected?: (currency: CryptoOrTokenCurrency) => void;
  onAccountSelected?: (account: AccountLike, parentAccount?: Account) => void;
  onClose?: () => void;
}

export interface ModularDrawerState {
  searchedValue?: string;
  isDebuggingDuplicates: boolean;
  flow: string;
  source: string;
  isOpen: boolean;
  dialogParams: ModularDialogParams | null;
}

const initialState: ModularDrawerState = {
  searchedValue: undefined,
  isDebuggingDuplicates: false,
  flow: "",
  source: "",
  isOpen: false,
  dialogParams: null,
};

const modularDrawerSlice = createSlice({
  name: "modularDrawer",
  initialState,
  reducers: {
    setSearchedValue: (state, action: PayloadAction<string | undefined>) => {
      state.searchedValue = action.payload;
    },
    setIsDebuggingDuplicates: (state, action: PayloadAction<boolean>) => {
      state.isDebuggingDuplicates = action.payload;
    },
    resetModularDrawerState: () => initialState,
    setFlowValue: (state, action: PayloadAction<string>) => {
      state.flow = action.payload;
    },
    setSourceValue: (state, action: PayloadAction<string>) => {
      state.source = action.payload;
    },
    openDialog: (state, action: PayloadAction<ModularDialogParams>) => {
      state.dialogParams = action.payload;
      state.isOpen = true;
    },
    closeDialog: state => {
      state.isOpen = false;
      state.dialogParams = null;
    },
  },
});

export const modularDrawerSearchedSelector = (state: State) => state.modularDrawer.searchedValue;
export const modularDrawerFlowSelector = (state: State) => state.modularDrawer.flow;
export const modularDrawerSourceSelector = (state: State) => state.modularDrawer.source;
export const modularDialogIsOpenSelector = (state: State) => state.modularDrawer.isOpen;
export const modularDialogOnCloseSelector = (state: State) =>
  state.modularDrawer.dialogParams?.onClose;
export const modularDialogOnAccountSelected = (state: State) =>
  state.modularDrawer.dialogParams?.onAccountSelected;
export const modularDialogOnAssetSelected = (state: State) =>
  state.modularDrawer.dialogParams?.onAssetSelected;
export const modularDialogConfiguration = (state: State) =>
  state.modularDrawer.dialogParams?.dialogConfiguration;
export const modularDialogCurrencies = (state: State) =>
  state.modularDrawer.dialogParams?.currencies;
export const modularDialogUseCase = (state: State) => state.modularDrawer.dialogParams?.useCase;
export const modularDialogAreCurrenciesFiltered = (state: State) =>
  state.modularDrawer.dialogParams?.areCurrenciesFiltered;

export const modularDrawerIsDebuggingDuplicatesSelector = (state: State) =>
  state.modularDrawer.isDebuggingDuplicates;

export const {
  setSearchedValue,
  setIsDebuggingDuplicates,
  resetModularDrawerState,
  setFlowValue,
  setSourceValue,
  openDialog,
  closeDialog,
} = modularDrawerSlice.actions;

export default modularDrawerSlice.reducer;
