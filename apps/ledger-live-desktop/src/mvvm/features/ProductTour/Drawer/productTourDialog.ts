import {
  openDialog,
  closeDialog,
  selectIsDialogOpen,
  type DialogId,
} from "~/renderer/reducers/dialogs";
import type { State } from "~/renderer/reducers";

const DIALOG_ID: DialogId = "PRODUCT_TOUR";

export const openProductTour = () => openDialog(DIALOG_ID);
export const closeProductTour = () => closeDialog(DIALOG_ID);
export const selectIsProductTourOpen = (state: Pick<State, "dialogs">) =>
  selectIsDialogOpen(state, DIALOG_ID);
