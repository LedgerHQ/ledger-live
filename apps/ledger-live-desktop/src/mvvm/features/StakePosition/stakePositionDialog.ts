import {
  openDialog,
  closeDialog,
  selectIsDialogOpen,
  type DialogId,
} from "~/renderer/reducers/dialogs";
import type { State } from "~/renderer/reducers";

const DIALOG_ID: DialogId = "STAKE_POSITION";

export const openStakePositionDialog = () => openDialog(DIALOG_ID);
export const closeStakePositionDialog = () => closeDialog(DIALOG_ID);
export const selectIsStakePositionDialogOpen = (state: Pick<State, "dialogs">) =>
  selectIsDialogOpen(state, DIALOG_ID);
