import {
  openDialog,
  closeDialog,
  selectIsDialogOpen,
  type DialogId,
} from "~/renderer/reducers/dialogs";
import type { State } from "~/renderer/reducers";

const DIALOG_ID: DialogId = "XRP_ADD_TOKEN";

export const openAddToken = () => openDialog(DIALOG_ID);
export const closeAddToken = () => closeDialog(DIALOG_ID);
export const selectIsAddTokenOpen = (state: Pick<State, "dialogs">) =>
  selectIsDialogOpen(state, DIALOG_ID);
