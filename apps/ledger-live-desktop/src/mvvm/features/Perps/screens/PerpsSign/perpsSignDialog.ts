import {
  openDialog,
  closeDialog,
  selectIsDialogOpen,
  selectDialogData,
  type DialogId,
} from "~/renderer/reducers/dialogs";
import type { State } from "~/renderer/reducers";
import type { PerpsSignData } from "./usePerpsSignViewModel";

const DIALOG_ID: DialogId = "PERPS_SIGNING";

export const openPerpsSign = (data: PerpsSignData) => openDialog(DIALOG_ID, data);
export const closePerpsSign = () => closeDialog(DIALOG_ID);
export const selectIsPerpsSignOpen = (state: Pick<State, "dialogs">) =>
  selectIsDialogOpen(state, DIALOG_ID);
export const selectPerpsSignData = (state: Pick<State, "dialogs">) =>
  selectDialogData<PerpsSignData>(state, DIALOG_ID);
