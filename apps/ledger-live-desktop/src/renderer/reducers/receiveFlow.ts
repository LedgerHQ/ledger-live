import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { AccountUUID } from "@domain/entity-account-descriptor";
import type { CryptoOrTokenCurrencyId } from "@domain/entity-currency";
import type { State } from ".";

export type ReceiveAddressDialogPayload = Readonly<{
  accountUUID: AccountUUID;
  assetId: CryptoOrTokenCurrencyId;
  source?: string;
}>;

/** The receive address dialog of the new receive flow: `null` while closed. */
export type ReceiveFlowState = ReceiveAddressDialogPayload | null;

const receiveFlowSlice = createSlice({
  name: "receiveFlow",
  initialState: null as ReceiveFlowState,
  reducers: {
    openReceiveAddressDialog: (_, action: PayloadAction<ReceiveAddressDialogPayload>) =>
      action.payload,
    closeReceiveAddressDialog: () => null,
  },
});

export const receiveFlowSelector = (state: Pick<State, "receiveFlow">) => state.receiveFlow;

export const { openReceiveAddressDialog, closeReceiveAddressDialog } = receiveFlowSlice.actions;
export default receiveFlowSlice.reducer;
