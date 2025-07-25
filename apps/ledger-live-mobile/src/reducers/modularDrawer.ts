import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { Account } from "@ledgerhq/types-live";
import { Observable } from "rxjs";
import { WalletAPIAccount } from "@ledgerhq/live-common/wallet-api/types";

export interface ModularDrawerState {
  isOpen: boolean;
  preselectedCurrencies: CryptoOrTokenCurrency[];
  onAccountSelected?: (account: Account) => void;
  enableAccountSelection?: boolean;
  accounts$?: Observable<WalletAPIAccount[]>;
}

const initialState: ModularDrawerState = {
  isOpen: false,
  preselectedCurrencies: [],
  onAccountSelected: undefined,
  enableAccountSelection: false,
  accounts$: undefined,
};

const modularDrawerSlice = createSlice({
  name: "modularDrawer",
  initialState,
  reducers: {
    openModularDrawer: (
      state,
      action: PayloadAction<{
        currencies?: CryptoOrTokenCurrency[];
        onAccountSelected?: (account: Account) => void;
        enableAccountSelection?: boolean;
        accounts$?: Observable<WalletAPIAccount[]>;
      }>,
    ) => {
      state.isOpen = true;
      if (action.payload.currencies) {
        state.preselectedCurrencies = action.payload.currencies;
      }
      if (action.payload.onAccountSelected) {
        state.onAccountSelected = action.payload.onAccountSelected;
      }
      if (action.payload.enableAccountSelection !== undefined) {
        state.enableAccountSelection = action.payload.enableAccountSelection;
      }
      if (action.payload.accounts$) {
        state.accounts$ = action.payload.accounts$;
      }
    },
    closeModularDrawer: state => {
      state.isOpen = false;
      state.preselectedCurrencies = [];
      state.onAccountSelected = undefined;
      state.enableAccountSelection = false;
    },
    setPreselectedCurrencies: (state, action: PayloadAction<CryptoOrTokenCurrency[]>) => {
      state.preselectedCurrencies = action.payload;
    },
    setOnAccountSelected: (
      state,
      action: PayloadAction<((account: Account) => void) | undefined>,
    ) => {
      state.onAccountSelected = action.payload;
    },
    setEnableAccountSelection: (state, action: PayloadAction<boolean>) => {
      state.enableAccountSelection = action.payload;
    },
    setAccounts$: (state, action: PayloadAction<Observable<WalletAPIAccount[]> | undefined>) => {
      state.accounts$ = action.payload;
    },
  },
});

export const {
  openModularDrawer,
  closeModularDrawer,
  setPreselectedCurrencies,
  setOnAccountSelected,
  setEnableAccountSelection,
  setAccounts$,
} = modularDrawerSlice.actions;

export default modularDrawerSlice.reducer;
