import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { State } from ".";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import type { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import type { EnhancedModularDrawerConfiguration } from "@ledgerhq/live-common/wallet-api/ModularDrawer/types";

export interface ModularDialogParams {
  currencies?: string[];
  dialogConfiguration?: EnhancedModularDrawerConfiguration;
  useCase?: string;
  uiUseCase?: string;
  areCurrenciesFiltered?: boolean;
  onAssetSelected?: (currency: CryptoOrTokenCurrency) => void;
  onAccountSelected?: (account: AccountLike, parentAccount?: Account) => void;
  onClose?: () => void;
}

export interface ModularDialogState {
  searchedValue?: string;
  isDebuggingDuplicates: boolean;
  flow: string;
  source: string;
  isOpen: boolean;
  dialogParams: ModularDialogParams | null;
}

const initialState: ModularDialogState = {
  searchedValue: undefined,
  isDebuggingDuplicates: false,
  flow: "",
  source: "",
  isOpen: false,
  dialogParams: null,
};

const modularDialogSlice = createSlice({
  name: "modularDialog",
  initialState,
  reducers: {
    setSearchedValue: (state, action: PayloadAction<string | undefined>) => {
      state.searchedValue = action.payload;
    },
    setIsDebuggingDuplicates: (state, action: PayloadAction<boolean>) => {
      state.isDebuggingDuplicates = action.payload;
    },
    resetModularDialogState: () => initialState,
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

export const modularDialogSearchedSelector = (state: State) => state.modularDialog.searchedValue;
export const modularDialogFlowSelector = (state: State) => state.modularDialog.flow;
export const modularDialogSourceSelector = (state: State) => state.modularDialog.source;
export const modularDialogIsOpenSelector = (state: State) => state.modularDialog.isOpen;
export const modularDialogOnCloseSelector = (state: State) =>
  state.modularDialog.dialogParams?.onClose;
export const modularDialogOnAccountSelectedSelector = (state: State) =>
  state.modularDialog.dialogParams?.onAccountSelected;
export const modularDialogOnAssetSelectedSelector = (state: State) =>
  state.modularDialog.dialogParams?.onAssetSelected;
export const modularDialogConfigurationSelector = (state: State) =>
  state.modularDialog.dialogParams?.dialogConfiguration;
export const modularDialogCurrenciesSelector = (state: State) =>
  state.modularDialog.dialogParams?.currencies;
export const modularDialogUseCaseSelector = (state: State) =>
  state.modularDialog.dialogParams?.useCase;
export const modularDialogUiUseCaseSelector = (state: State) =>
  state.modularDialog.dialogParams?.uiUseCase;
export const modularDialogAreCurrenciesFilteredSelector = (state: State) =>
  state.modularDialog.dialogParams?.areCurrenciesFiltered;

export const modularDialogIsDebuggingDuplicatesSelector = (state: State) =>
  state.modularDialog.isDebuggingDuplicates;

export const {
  setSearchedValue,
  setIsDebuggingDuplicates,
  resetModularDialogState,
  setFlowValue,
  setSourceValue,
  openDialog,
  closeDialog,
} = modularDialogSlice.actions;

export default modularDialogSlice.reducer;
