import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { State } from "~/reducers/types";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";

export interface ReceiveOptionsDrawerState {
  isOpen: boolean;
  currency?: CryptoOrTokenCurrency;
  sourceScreenName: string;
  fromMenu?: boolean;
}

export const INITIAL_STATE: ReceiveOptionsDrawerState = {
  isOpen: false,
  currency: undefined,
  sourceScreenName: "",
  fromMenu: false,
};

// Selectors
export const receiveOptionsDrawerStateSelector = (state: State) => state.receiveOptionsDrawer;

const receiveOptionsDrawerSlice = createSlice({
  name: "receiveOptionsDrawerKey",
  initialState: INITIAL_STATE,
  reducers: {
    openReceiveOptionsDrawer: (
      state,
      action: PayloadAction<{
        currency?: CryptoOrTokenCurrency;
        sourceScreenName: string;
        fromMenu?: boolean;
      }>,
    ) => {
      state.isOpen = true;
      const { currency, sourceScreenName, fromMenu } = action.payload;

      if (currency !== undefined) {
        state.currency = currency;
      }
      if (sourceScreenName !== undefined) {
        state.sourceScreenName = sourceScreenName;
      }
      if (fromMenu !== undefined) {
        state.fromMenu = fromMenu;
      }
    },
    closeReceiveOptionsDrawer: state => {
      state.isOpen = false;
      state.currency = undefined;
      state.sourceScreenName = "";
      state.fromMenu = false;
    },

    setCurrency: (state, action: PayloadAction<CryptoOrTokenCurrency | undefined>) => {
      state.currency = action.payload;
    },
    setSourceScreenName: (state, action: PayloadAction<string>) => {
      state.sourceScreenName = action.payload;
    },
    setFromMenu: (state, action: PayloadAction<boolean>) => {
      state.fromMenu = action.payload;
    },
  },
});

export const {
  openReceiveOptionsDrawer,
  closeReceiveOptionsDrawer,
  setCurrency,
  setSourceScreenName,
  setFromMenu,
} = receiveOptionsDrawerSlice.actions;

export default receiveOptionsDrawerSlice.reducer;
