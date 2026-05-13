import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { SwapTransactionStatusParams } from "@ledgerhq/live-common/exchange/transactionStatus/index";
import type { State } from "~/renderer/reducers";

export type SwapTransactionStatusDialogState = SwapTransactionStatusParams | null;

const swapTransactionStatusDialogSlice = createSlice({
  name: "swapTransactionStatusDialog",
  initialState: null as SwapTransactionStatusDialogState,
  reducers: {
    openSwapTransactionStatusDialog: (_state, action: PayloadAction<SwapTransactionStatusParams>) =>
      action.payload,
    closeSwapTransactionStatusDialog: () => null,
  },
});

export const { openSwapTransactionStatusDialog, closeSwapTransactionStatusDialog } =
  swapTransactionStatusDialogSlice.actions;

export const selectSwapTransactionStatusDialogParams = (
  state: Pick<State, "swapTransactionStatusDialog">,
) => state.swapTransactionStatusDialog;

export default swapTransactionStatusDialogSlice.reducer;
