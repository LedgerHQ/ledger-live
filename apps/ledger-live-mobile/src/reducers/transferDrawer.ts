import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { CryptoOrTokenCurrency } from "@domain/entity-currency";
import { State } from "~/reducers/types";

export type TransferDrawerScope =
  | Readonly<{ type: "wallet" }>
  | Readonly<{ type: "asset"; currency: CryptoOrTokenCurrency; ledgerIds?: string[] }>
  | Readonly<{ type: "account"; accountId: string }>;

export interface TransferDrawerState {
  isOpen: boolean;
  sourceScreenName: string;
  scope: TransferDrawerScope;
}

const WALLET_SCOPE: TransferDrawerScope = { type: "wallet" };

export const INITIAL_STATE: TransferDrawerState = {
  isOpen: false,
  sourceScreenName: "",
  scope: WALLET_SCOPE,
};

export const transferDrawerStateSelector = (state: State) => state.transferDrawer;
export const transferDrawerIsOpenSelector = (state: State) => state.transferDrawer.isOpen;

const transferDrawerSlice = createSlice({
  name: "transferDrawer",
  initialState: INITIAL_STATE,
  reducers: {
    openTransferDrawer: (
      state,
      action: PayloadAction<{
        sourceScreenName: string;
        scope: TransferDrawerScope;
      }>,
    ) => {
      state.isOpen = true;
      state.sourceScreenName = action.payload.sourceScreenName;
      state.scope = action.payload.scope;
    },
    closeTransferDrawer: state => {
      state.isOpen = false;
      state.sourceScreenName = "";
      state.scope = WALLET_SCOPE;
    },
  },
});

export const { openTransferDrawer, closeTransferDrawer } = transferDrawerSlice.actions;

export default transferDrawerSlice.reducer;
