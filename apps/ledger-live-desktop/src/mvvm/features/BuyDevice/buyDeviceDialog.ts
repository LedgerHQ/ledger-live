import {
  openDialog,
  closeDialog,
  selectIsDialogOpen,
  type DialogId,
} from "~/renderer/reducers/dialogs";
import type { State } from "~/renderer/reducers";

const DIALOG_ID: DialogId = "BUY_DEVICE";

export const openBuyDevice = () => openDialog(DIALOG_ID);
export const closeBuyDevice = () => closeDialog(DIALOG_ID);
export const selectIsBuyDeviceOpen = (state: Pick<State, "dialogs">) =>
  selectIsDialogOpen(state, DIALOG_ID);
