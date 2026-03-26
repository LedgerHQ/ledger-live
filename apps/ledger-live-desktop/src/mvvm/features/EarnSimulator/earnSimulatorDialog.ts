import {
  openDialog,
  closeDialog,
  selectIsDialogOpen,
  type DialogId,
} from "~/renderer/reducers/dialogs";
import type { State } from "~/renderer/reducers";

const DIALOG_ID: DialogId = "EARN_SIMULATOR";

export const openEarnSimulator = () => openDialog(DIALOG_ID);
export const closeEarnSimulator = () => closeDialog(DIALOG_ID);
export const selectIsEarnSimulatorOpen = (state: Pick<State, "dialogs">) =>
  selectIsDialogOpen(state, DIALOG_ID);
