import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { AccountUUID } from "@domain/entity-account-descriptor";
import type { CryptoOrTokenCurrencyId } from "@domain/entity-currency";
import type { State } from ".";

/** Ids only: the dialog reads the account and its `receive` data from the store. */
export type ReceiveAddressDialogPayload = {
  accountUUID: AccountUUID;
  /** What the user receives: the account's coin, or a token of its network. */
  assetId: CryptoOrTokenCurrencyId;
  source?: string;
};

export type ReceiveFlowState = {
  addressDialog: ReceiveAddressDialogPayload | null;
};

const initialState: ReceiveFlowState = {
  addressDialog: null,
};

const receiveFlowSlice = createSlice({
  name: "receiveFlow",
  initialState,
  reducers: {
    openReceiveAddressDialog: (state, action: PayloadAction<ReceiveAddressDialogPayload>) => {
      state.addressDialog = action.payload;
    },
    closeReceiveAddressDialog: state => {
      state.addressDialog = null;
    },
  },
});

export const receiveAddressDialogSelector = (state: State) => state.receiveFlow.addressDialog;

export const { openReceiveAddressDialog, closeReceiveAddressDialog } = receiveFlowSlice.actions;
export default receiveFlowSlice.reducer;
