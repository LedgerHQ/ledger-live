import {
  closeDialog,
  openDialog,
  selectIsDialogOpen,
  type DialogId,
} from "~/renderer/reducers/dialogs";
import type { State } from "~/renderer/reducers";

const DIALOG_ID: DialogId = "ACCOUNT_PUBLIC_KEY_UNAVAILABLE";

export const openAccountPublicKeyUnavailableDialog = () => openDialog(DIALOG_ID);
export const closeAccountPublicKeyUnavailableDialog = () => closeDialog(DIALOG_ID);
export const selectIsAccountPublicKeyUnavailableDialogOpen = (state: Pick<State, "dialogs">) =>
  selectIsDialogOpen(state, DIALOG_ID);
