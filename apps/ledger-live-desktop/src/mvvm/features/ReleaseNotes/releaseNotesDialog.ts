import {
  openDialog,
  closeDialog,
  selectIsDialogOpen,
  type DialogId,
} from "~/renderer/reducers/dialogs";
import type { State } from "~/renderer/reducers";

const DIALOG_ID: DialogId = "RELEASE_NOTES";

export const openReleaseNotes = () => openDialog(DIALOG_ID);
export const closeReleaseNotes = () => closeDialog(DIALOG_ID);
export const selectIsReleaseNotesOpen = (state: Pick<State, "dialogs">) =>
  selectIsDialogOpen(state, DIALOG_ID);
