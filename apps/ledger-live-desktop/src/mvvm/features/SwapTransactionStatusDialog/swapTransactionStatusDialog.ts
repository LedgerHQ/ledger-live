import type { SwapTransactionStatusParams } from "@ledgerhq/live-common/exchange/swapTransactionStatus/index";
import {
  closeDialogWithData,
  openDialogWithData,
  selectDialogWithDataParams,
  selectIsDialogWithDataOpen,
} from "~/renderer/reducers/dialogsWithData";
import type { DialogWithDataId } from "~/renderer/reducers/dialogsWithData";
import type { State } from "~/renderer/reducers";

const DIALOG_ID = "SWAP_TRANSACTION_STATUS" satisfies DialogWithDataId;

export const openSwapTransactionStatusDialog = (params: SwapTransactionStatusParams) =>
  openDialogWithData({ id: DIALOG_ID, data: params });

export const closeSwapTransactionStatusDialog = () => closeDialogWithData(DIALOG_ID);

export const selectIsSwapTransactionStatusDialogOpen = (state: Pick<State, "dialogsWithData">) =>
  selectIsDialogWithDataOpen(state, DIALOG_ID);

export const selectSwapTransactionStatusDialogParams = (state: Pick<State, "dialogsWithData">) =>
  selectDialogWithDataParams(state, DIALOG_ID);
